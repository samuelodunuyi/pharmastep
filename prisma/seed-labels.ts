// Pack-label text for the sample catalogue, taken from official leaflets (source URL on each).
// Seeded as live (APPROVED) but not pharmacist-checked (no reviewedAt): the product page says it's from the
// official leaflet until a pharmacist checks it against the pack we stock and approves it in /admin/labels.
// Products left out on purpose (a pharmacist enters them from the pack):
// - Vitamin C 1000mg (Emzor): no official leaflet online.
// - Omeprazole 20mg capsules: the UK capsule leaflet is prescription-only; confirm how we sell it first.
// - Coartem, Lonart DS, P-Alaxin: weight-based dosing, and the catalogue details need checking against the packs.
// - Postinor-2: directions differ between markets; use the leaflet in our pack.
// - Daily Multivitamin, Antacid Suspension: generic sample entries, not a specific product.
// - Blood pressure monitor, glucose meter, condoms: no dosing.

export type SeedLabel = { slug: string; directions: string; warnings: string; sourceUrl: string; notes: string };

export const SEED_LABELS: SeedLabel[] = [
  {
    slug: "panadol-extra-caplets",
    directions:
      "Adults (including the elderly) and children aged 12 years and over: 1 or 2 caplets every 4 to 6 hours as required. Do not take more than 8 caplets in 24 hours. Children below 12 years: not recommended.",
    warnings:
      "Do not take more than the recommended dose, as this may cause liver failure which can lead to liver transplant or death. Do not take with any other medicine containing paracetamol. If you have liver or kidney disease, consult a doctor before taking it.",
    sourceUrl: "https://www.panadol.com/content/cf-consumer-healthcare/wellness-panadol/en_ke/home/products/adult-products/panadol-extra.html",
    notes:
      "From Haleon's Kenyan Panadol Extra page, the closest regional label to a Nigerian pack. The UK leaflet (medicines.org.uk/emc/product/4504/pil) differs: 2 tablets only from 16 years, 1 tablet for ages 12-15, and not for use in pregnancy or breastfeeding because of the caffeine. Check against our pack.",
  },
  {
    slug: "ibuprofen-400mg-tablets",
    directions:
      "Adults and children aged 12 years and over: Take 1 tablet up to three times a day as required. Leave at least four hours between doses. Do not take more than 3 tablets in any 24 hour period. Take with or after food, with a glass of water. Do not take for longer than 10 days unless your doctor tells you to. If a child aged 12 to 18 needs it for more than 3 days, or symptoms get worse, consult a doctor. Do not give to children under 12 years old except on the advice of a doctor.",
    warnings:
      "Do not take if you: are allergic to ibuprofen, aspirin or other related painkillers; have had a worsening of asthma, skin rash, itchy runny nose or facial swelling when previously taking ibuprofen, aspirin or similar medicines; have (or have had two or more episodes of) a stomach ulcer, perforation or bleeding; are taking other NSAID painkillers, or aspirin above 75 mg a day; suffer from liver or kidney disease; suffer from heart disease or high blood pressure; are in the last 3 months of pregnancy. Avoid during pregnancy.",
    sourceUrl: "https://www.medicines.org.uk/emc/product/13541/pil",
    notes: "From a UK ibuprofen 400 mg (pharmacy) leaflet. Check against the Emzor pack we stock.",
  },
  {
    slug: "diclofenac-gel-50g",
    directions:
      "Adults and adolescents 14 years and over: Squeeze out a small amount of gel and apply to the painful or swollen area 3 to 4 times a day, slowly rubbing it into the skin. Allow at least 4 hours between applications. Do not apply more than 4 times in any 24 hour period. Do not use for more than 14 days unless a doctor recommends longer. If the pain and swelling do not improve within 7 days, or get worse, speak to your doctor. Not recommended for children under 14 years of age.",
    warnings:
      "Do not use if you have ever had an allergic reaction to diclofenac or to other medicines for pain, fever or inflammation such as aspirin or ibuprofen, or in the last 3 months of pregnancy. Use only on unbroken skin: not on cuts, open wounds, rashes or eczema. Do not cover with bandages or plasters. Keep it away from the eyes and mouth. Wash your hands after use unless you are treating them. Ask a doctor or pharmacist first if you are pregnant or breastfeeding.",
    sourceUrl: "https://www.medicines.org.uk/emc/product/8773/pil",
    notes:
      "From the UK Voltarol Back & Muscle Pain Relief 1.16% Gel leaflet. The catalogue entry says 'Diclofenac diethylamine 1%, Novartis': Voltaren/Voltarol Emulgel is diclofenac diethylamine 1.16% (equal to diclofenac sodium 1%) and is now made by Haleon. Correct the product details and check against our pack.",
  },
  {
    slug: "loratadine-10mg-tablets",
    directions:
      "Adults and children over 6 years of age with a body weight greater than 30 kg: Take 1 tablet 1 time daily with a glass of water, with or without food. Do not give to children who weigh 30 kg or less. If symptoms get worse, or persist after 7 days of treatment, see a doctor.",
    warnings:
      "Do not take if you are allergic to loratadine or any of the other ingredients. Talk to a doctor or pharmacist first if you have severe liver problems. Do not take for two days before allergy skin tests. It is preferable to avoid it during pregnancy, and do not take it if you are breast-feeding.",
    sourceUrl: "https://www.medicines.org.uk/emc/product/8911/pil",
    notes: "From a UK loratadine 10 mg leaflet. Check against the Emzor pack we stock.",
  },
  {
    slug: "chlorphenamine-syrup-100ml",
    directions:
      "Use the spoon provided. Adults and children over 12 years: two 5 ml spoonfuls (10 ml) every 4-6 hours; no more than twelve 5 ml spoonfuls (60 ml) in 24 hours. Elderly: two 5 ml spoonfuls (10 ml) every 4-6 hours; no more than six 5 ml spoonfuls (30 ml) in 24 hours, and talk to a doctor or pharmacist first. Children 6-12 years: one 5 ml spoonful every 4-6 hours; no more than six 5 ml spoonfuls (30 ml) in 24 hours. Children 2-6 years: one 2.5 ml spoonful every 4-6 hours; no more than six 2.5 ml spoonfuls (15 ml) in 24 hours. Children 1-2 years: one 2.5 ml spoonful twice daily; no more than two 2.5 ml spoonfuls (5 ml) in 24 hours. The minimum time between doses is 4 hours. Do not use continuously for more than 14 days without consulting a doctor. Do not give to children under 12 months.",
    warnings:
      "Do not take if you have had an allergic reaction to antihistamines, have taken MAOI antidepressants in the last two weeks, or are taking other medicines containing antihistamines (including cold and cough remedies). Talk to a doctor first if you have very high blood pressure, heart disease, epilepsy, glaucoma, an enlarged prostate, liver or kidney disease, bronchitis, asthma or another long-term lung problem. It can cause drowsiness: avoid alcohol, and do not drive or operate machinery if it makes you drowsy or dizzy or blurs your vision. Talk to a doctor before taking it if you are pregnant or breastfeeding. Contains alcohol (6.3% v/v).",
    sourceUrl: "https://www.medicines.org.uk/emc/product/3928/pil",
    notes: "From the UK Piriton Children's Allergy Syrup leaflet (Haleon; the catalogue says GSK). Check the dosing table against our pack.",
  },
  {
    slug: "hydrocortisone-cream-1-15g",
    directions:
      "Adults (including the elderly): gently apply a thin layer of cream to the affected area(s) once or twice a day. Do not use on children under 10 years of age without medical advice. Treatment should be limited to seven days. You must talk to a doctor if you do not feel better or if you feel worse after 7 days.",
    warnings:
      "Do not use on the face, eyes, anus or genital areas, or on skin with an infection such as athlete's foot, chickenpox, shingles, cold sores, impetigo, ringworm, thrush, infected or broken skin, or acne. Do not use under a nappy or an airtight dressing. Talk to a doctor or pharmacist first if you have psoriasis, or if you are pregnant or breastfeeding. If the area becomes weepy or infected, stop using it and speak to your doctor.",
    sourceUrl: "https://www.medicines.org.uk/emc/product/15099/pil",
    notes:
      "From a UK over-the-counter hydrocortisone 1% leaflet (Boots DermaCare). The UK prescription leaflet allows wider use; these are the over-the-counter limits. Check against our pack.",
  },
  {
    slug: "clotrimazole-cream-20g",
    directions:
      "Apply thinly and evenly to the affected areas two or three times daily and rub in gently. A strip of cream (1/2 cm long) is enough to treat an area about the size of the hand. Treatment generally needs a minimum of two weeks, although up to four weeks may be necessary. If symptoms persist, consult your doctor.",
    warnings:
      "Do not use if you are allergic to clotrimazole or any of the other ingredients (including cetostearyl alcohol or benzyl alcohol), or to treat nail or scalp infections. For external use only: do not swallow it. It can be used in pregnancy and breastfeeding, but tell your doctor or midwife first. It can damage latex condoms and diaphragms, so if it is used on the vulva or penis, use other precautions for at least five days afterwards.",
    sourceUrl: "https://www.medicines.org.uk/emc/product/1282/pil",
    notes: "From the UK Canesten Cream leaflet. Check against our pack.",
  },
  {
    slug: "omega-3-fish-oil-capsules",
    directions: "Two capsules per day with your main meal. Swallow with water or a cold drink. Not to be chewed. Do not exceed the recommended intake.",
    warnings:
      "Not suitable for children. Those taking anticoagulants (blood thinners) should consult their doctor before using this product. Made in a site that may handle nuts/peanuts.",
    sourceUrl: "https://www.vitabiotics.com/products/ultra-omega-3-super-strength-capsules",
    notes:
      "From Vitabiotics' Ultra Omega-3 page. The catalogue entry says 'EPA / DHA 1000 mg'; Vitabiotics lists 1080 mg fish oil (355 mg EPA, 235 mg DHA) per two capsules. Correct the product details and check against our pack.",
  },
];
