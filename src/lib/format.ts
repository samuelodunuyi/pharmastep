const naira = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

export function formatNaira(kobo: number) {
  return naira.format(kobo / 100);
}

export function nairaToKobo(naira: number | string) {
  return Math.round(Number(naira) * 100);
}

export function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(date));
}

export function formatTime(date: Date | string) {
  return new Intl.DateTimeFormat("en-NG", { timeStyle: "short" }).format(new Date(date));
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAID: "Paid",
  PROCESSING: "Being prepared",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const RX_STATUS_LABEL: Record<string, string> = {
  NOT_REQUIRED: "Not required",
  PENDING_REVIEW: "Awaiting pharmacist review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export const CHAT_STATUS_LABEL: Record<string, string> = {
  BOT: "With the assistant",
  WAITING: "Waiting for a pharmacist",
  WITH_PHARMACIST: "With a pharmacist",
  CLOSED: "Closed",
};

export const CHAT_SEVERITY_LABEL: Record<string, string> = {
  MODERATE: "Moderate",
  SEVERE: "Severe",
  EMERGENCY: "Emergency",
};
