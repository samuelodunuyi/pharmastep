// Makes an existing account an admin. Sign up on the site first, then:
//   npx tsx scripts/make-admin.ts you@example.com
import { prisma } from "./lib";

async function main() {
  const email = process.argv[2]?.toLowerCase();
  if (!email) throw new Error("Usage: npx tsx scripts/make-admin.ts <email>");
  const profile = await prisma.profile.update({ where: { email }, data: { role: "ADMIN" } }).catch(() => null);
  if (!profile) throw new Error(`No profile for ${email}. Sign up on the site first.`);
  console.log(`${email} is now an admin.`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
