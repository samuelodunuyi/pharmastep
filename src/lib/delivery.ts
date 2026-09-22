import "server-only";

export type DeliveryQuote = {
  feeKobo: number;
  distanceKm: number | null;
  /** False when the address couldn't be located and the flat fee was used. */
  located: boolean;
};

const ORIGIN = {
  latitude: Number(process.env.STORE_LAT ?? 6.504502),
  longitude: Number(process.env.STORE_LNG ?? 3.37762),
};

// Same bands as the old site, in naira.
function feeForDistance(km: number) {
  if (km < 4.5) return 1000;
  if (km < 6.4) return 1500;
  if (km < 24.1) return 2000;
  if (km < 33.3) return 2500;
  if (km < 40.3) return 3000;
  return 3500;
}

function flatFee(): DeliveryQuote {
  return { feeKobo: Number(process.env.DELIVERY_FLAT_FEE_NAIRA ?? 2000) * 100, distanceKm: null, located: false };
}

/** Delivery fee is always computed on the server; the browser never supplies it. */
export async function quoteDelivery(address: string, city: string, state = "Lagos"): Promise<DeliveryQuote> {
  const key = process.env.GOOGLE_MAPS_API_KEY;
  if (!key || address.trim().length < 5) return flatFee();

  try {
    const q = encodeURIComponent(`${address}, ${city}, ${state}, Nigeria`);
    const geo = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${q}&region=ng&components=country:NG&key=${key}`,
      { next: { revalidate: 60 * 60 * 24 } },
    ).then((r) => r.json());
    const loc = geo?.results?.[0]?.geometry?.location;
    if (!loc) return flatFee();

    const route = await fetch("https://routes.googleapis.com/directions/v2:computeRoutes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.distanceMeters",
      },
      body: JSON.stringify({
        origin: { location: { latLng: ORIGIN } },
        destination: { location: { latLng: { latitude: loc.lat, longitude: loc.lng } } },
        travelMode: "DRIVE",
      }),
      cache: "no-store",
    }).then((r) => r.json());

    const meters = route?.routes?.[0]?.distanceMeters;
    if (typeof meters !== "number") return flatFee();

    const km = Math.round((meters / 1000) * 10) / 10;
    return { feeKobo: feeForDistance(km) * 100, distanceKm: km, located: true };
  } catch (err) {
    console.error("Delivery quote failed", err);
    return flatFee();
  }
}
