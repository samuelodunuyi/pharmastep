-- The app reads and writes through Prisma on the server (as the postgres role, which bypasses RLS).
-- Supabase also exposes the public schema through its REST API using the publishable key.
-- Enabling RLS with no policies blocks that API from reading or writing any of these tables.
ALTER TABLE "Profile" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Prescription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactMessage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
