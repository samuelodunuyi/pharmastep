// Sample catalogue for testing. Prices in naira; converted to kobo when seeding.

type SeedProduct = {
  slug: string;
  name: string;
  category: string;
  manufacturer: string;
  activeIngredient?: string;
  strength?: string;
  packSize: string;
  dosageForm: string;
  price: number;
  compareAt?: number;
  stock: number;
  rx?: boolean;
  /** Path under public/images, without extension. */
  image: string;
  tags: string[];
  description: string;
};

export const SEED_PRODUCTS: SeedProduct[] = [
  // Antibacterials
  { slug: "amoxicillin-500mg-capsules", name: "Amoxicillin 500mg Capsules", category: "antibacterial", manufacturer: "Emzor", activeIngredient: "Amoxicillin", strength: "500 mg", packSize: "21 capsules", dosageForm: "Capsule", price: 2800, stock: 60, rx: true, image: "products/capsules", tags: ["antibiotic", "infection"], description: "Penicillin-type antibiotic for bacterial infections of the chest, ear, throat and urinary tract. Take the full course as prescribed." },
  { slug: "augmentin-625mg-tablets", name: "Augmentin 625mg Tablets", category: "antibacterial", manufacturer: "GSK", activeIngredient: "Amoxicillin / Clavulanic acid", strength: "500/125 mg", packSize: "14 tablets", dosageForm: "Tablet", price: 11500, compareAt: 12800, stock: 24, rx: true, image: "products/blister", tags: ["antibiotic", "infection"], description: "Broad-spectrum antibiotic combination for respiratory, skin and urinary tract infections." },
  { slug: "ciprofloxacin-500mg-tablets", name: "Ciprofloxacin 500mg Tablets", category: "antibacterial", manufacturer: "Fidson", activeIngredient: "Ciprofloxacin", strength: "500 mg", packSize: "10 tablets", dosageForm: "Tablet", price: 1900, stock: 45, rx: true, image: "products/tablets", tags: ["antibiotic", "typhoid", "uti"], description: "Fluoroquinolone antibiotic used for urinary tract infections and typhoid fever." },

  // Anti-malarials
  { slug: "coartem-80-480-tablets", name: "Coartem 80/480mg Tablets", category: "anti-malarials", manufacturer: "Novartis", activeIngredient: "Artemether / Lumefantrine", strength: "80/480 mg", packSize: "6 tablets", dosageForm: "Tablet", price: 5200, compareAt: 5800, stock: 80, image: "products/blister", tags: ["malaria", "fever", "act"], description: "Artemisinin-based combination therapy for uncomplicated malaria. Take with food or milk over three days." },
  { slug: "lonart-ds-tablets", name: "Lonart DS Tablets", category: "anti-malarials", manufacturer: "Bliss GVS", activeIngredient: "Artemether / Lumefantrine", strength: "80/480 mg", packSize: "6 tablets", dosageForm: "Tablet", price: 3600, stock: 55, image: "products/blister", tags: ["malaria", "fever", "act"], description: "Three-day treatment for uncomplicated malaria in adults." },
  { slug: "p-alaxin-tablets", name: "P-Alaxin Tablets", category: "anti-malarials", manufacturer: "Bliss GVS", activeIngredient: "Dihydroartemisinin / Piperaquine", strength: "40/320 mg", packSize: "9 tablets", dosageForm: "Tablet", price: 3900, stock: 3, image: "products/tablets", tags: ["malaria", "act"], description: "Once-daily antimalarial combination taken over three days." },

  // Pain management
  { slug: "panadol-extra-caplets", name: "Panadol Extra Caplets", category: "pain-management", manufacturer: "GSK", activeIngredient: "Paracetamol / Caffeine", strength: "500/65 mg", packSize: "16 caplets", dosageForm: "Caplet", price: 1200, stock: 150, image: "products/tablets", tags: ["pain", "headache", "fever"], description: "Fast, effective relief from headaches, toothache, period pain and fever." },
  { slug: "ibuprofen-400mg-tablets", name: "Ibuprofen 400mg Tablets", category: "pain-management", manufacturer: "Emzor", activeIngredient: "Ibuprofen", strength: "400 mg", packSize: "24 tablets", dosageForm: "Tablet", price: 950, stock: 90, image: "products/blister", tags: ["pain", "inflammation"], description: "Anti-inflammatory pain relief for muscle aches, joint pain and period pain. Take with food." },
  { slug: "diclofenac-gel-50g", name: "Diclofenac Gel 1% (50g)", category: "pain-management", manufacturer: "Novartis", activeIngredient: "Diclofenac diethylamine", strength: "1%", packSize: "50 g tube", dosageForm: "Gel", price: 3400, stock: 35, image: "products/cream", tags: ["pain", "joint", "sprain"], description: "Topical gel for local relief of back pain, sprains and joint pain." },

  // Vitamins
  { slug: "vitamin-c-1000mg-tablets", name: "Vitamin C 1000mg Tablets", category: "vitamins", manufacturer: "Emzor", activeIngredient: "Ascorbic acid", strength: "1000 mg", packSize: "30 tablets", dosageForm: "Tablet", price: 2500, stock: 120, image: "products/supplements", tags: ["vitamin", "immunity"], description: "High-strength vitamin C to support normal immune function." },
  { slug: "daily-multivitamin-tablets", name: "Daily Multivitamin Tablets", category: "vitamins", manufacturer: "Seven Seas", strength: "One-a-day", packSize: "30 tablets", dosageForm: "Tablet", price: 6800, compareAt: 7500, stock: 40, image: "products/supplements", tags: ["vitamin", "multivitamin"], description: "Complete A–Z multivitamin and mineral formula for everyday health." },
  { slug: "omega-3-fish-oil-capsules", name: "Omega-3 Fish Oil Capsules", category: "vitamins", manufacturer: "Vitabiotics", activeIngredient: "EPA / DHA", strength: "1000 mg", packSize: "60 capsules", dosageForm: "Capsule", price: 7900, stock: 0, image: "products/capsules", tags: ["omega", "heart", "supplement"], description: "Fish oil supplement supporting heart, brain and eye health." },

  // Antihypertensives
  { slug: "amlodipine-5mg-tablets", name: "Amlodipine 5mg Tablets", category: "antihypertensives", manufacturer: "Pfizer", activeIngredient: "Amlodipine", strength: "5 mg", packSize: "28 tablets", dosageForm: "Tablet", price: 3200, stock: 70, rx: true, image: "products/tablets", tags: ["blood pressure", "hypertension"], description: "Calcium-channel blocker for high blood pressure and angina." },
  { slug: "lisinopril-10mg-tablets", name: "Lisinopril 10mg Tablets", category: "antihypertensives", manufacturer: "Fidson", activeIngredient: "Lisinopril", strength: "10 mg", packSize: "28 tablets", dosageForm: "Tablet", price: 2700, stock: 50, rx: true, image: "products/blister", tags: ["blood pressure", "hypertension"], description: "ACE inhibitor used to treat high blood pressure and heart failure." },
  { slug: "digital-blood-pressure-monitor", name: "Digital Blood Pressure Monitor", category: "antihypertensives", manufacturer: "Omron", packSize: "1 device", dosageForm: "Device", price: 38500, compareAt: 42000, stock: 12, image: "products/bp-monitor", tags: ["blood pressure", "monitor", "device"], description: "Automatic upper-arm monitor for accurate readings at home, with memory for 60 results." },

  // Antidiabetics
  { slug: "metformin-500mg-tablets", name: "Metformin 500mg Tablets", category: "antidiabetics", manufacturer: "Merck", activeIngredient: "Metformin hydrochloride", strength: "500 mg", packSize: "30 tablets", dosageForm: "Tablet", price: 2100, stock: 85, rx: true, image: "products/tablets", tags: ["diabetes", "blood sugar"], description: "First-line medicine for type 2 diabetes. Take with meals." },
  { slug: "blood-glucose-meter-kit", name: "Blood Glucose Meter Kit", category: "antidiabetics", manufacturer: "Accu-Chek", packSize: "Meter, 10 strips, lancets", dosageForm: "Device", price: 24000, stock: 15, image: "products/glucose-meter", tags: ["diabetes", "glucose", "device"], description: "Easy-to-use meter for checking blood sugar at home, with starter strips and lancets." },

  // Antihistamines
  { slug: "loratadine-10mg-tablets", name: "Loratadine 10mg Tablets", category: "antihistamines", manufacturer: "Emzor", activeIngredient: "Loratadine", strength: "10 mg", packSize: "10 tablets", dosageForm: "Tablet", price: 1100, stock: 75, image: "products/tablets", tags: ["allergy", "hay fever", "catarrh"], description: "Non-drowsy relief from sneezing, runny nose and itchy eyes." },
  { slug: "chlorphenamine-syrup-100ml", name: "Chlorphenamine Syrup (100ml)", category: "antihistamines", manufacturer: "GSK", activeIngredient: "Chlorphenamine maleate", strength: "2 mg/5 ml", packSize: "100 ml", dosageForm: "Syrup", price: 1500, stock: 40, image: "products/syrup", tags: ["allergy", "itching", "children"], description: "Antihistamine syrup for allergies and itching. May cause drowsiness." },

  // Gastrointestinal
  { slug: "omeprazole-20mg-capsules", name: "Omeprazole 20mg Capsules", category: "gastrointestinal", manufacturer: "Fidson", activeIngredient: "Omeprazole", strength: "20 mg", packSize: "14 capsules", dosageForm: "Capsule", price: 1800, stock: 65, image: "products/capsules", tags: ["ulcer", "heartburn", "acid"], description: "Reduces stomach acid for heartburn, indigestion and ulcers." },
  { slug: "antacid-suspension-200ml", name: "Antacid Suspension (200ml)", category: "gastrointestinal", manufacturer: "Reckitt", activeIngredient: "Sodium alginate / Bicarbonate", packSize: "200 ml", dosageForm: "Suspension", price: 4200, stock: 30, image: "products/syrup", tags: ["heartburn", "indigestion"], description: "Soothing relief from heartburn and indigestion; forms a protective layer over stomach contents." },

  // Creams and ointments
  { slug: "hydrocortisone-cream-1-15g", name: "Hydrocortisone Cream 1% (15g)", category: "cream-and-ointments", manufacturer: "GSK", activeIngredient: "Hydrocortisone", strength: "1%", packSize: "15 g tube", dosageForm: "Cream", price: 1600, stock: 45, image: "products/cream", tags: ["eczema", "itching", "rash"], description: "Mild steroid cream for eczema, insect bites and skin irritation." },
  { slug: "clotrimazole-cream-20g", name: "Clotrimazole Cream 1% (20g)", category: "cream-and-ointments", manufacturer: "Bayer", activeIngredient: "Clotrimazole", strength: "1%", packSize: "20 g tube", dosageForm: "Cream", price: 1400, stock: 55, image: "products/cream", tags: ["fungal", "ringworm", "athlete's foot"], description: "Antifungal cream for ringworm, athlete's foot and other fungal skin infections." },

  // Antiemetics, contraceptives, sexual health
  { slug: "metoclopramide-10mg-tablets", name: "Metoclopramide 10mg Tablets", category: "antiemetics", manufacturer: "Emzor", activeIngredient: "Metoclopramide", strength: "10 mg", packSize: "20 tablets", dosageForm: "Tablet", price: 900, stock: 30, rx: true, image: "products/tablets", tags: ["nausea", "vomiting"], description: "Relieves nausea and vomiting. Short-term use only." },
  { slug: "postinor-2-tablets", name: "Postinor-2 Tablets", category: "contraceptives", manufacturer: "Gedeon Richter", activeIngredient: "Levonorgestrel", strength: "0.75 mg", packSize: "2 tablets", dosageForm: "Tablet", price: 1500, stock: 60, image: "products/blister", tags: ["emergency contraception"], description: "Emergency contraceptive. Most effective when taken as soon as possible after unprotected sex." },
  { slug: "latex-condoms-12-pack", name: "Latex Condoms (12 pack)", category: "sexual-health", manufacturer: "Durex", packSize: "12 condoms", dosageForm: "Pack", price: 3500, stock: 100, image: "categories/sexual-health", tags: ["condoms", "protection"], description: "Classic latex condoms for protection against pregnancy and STIs." },
];
