// Creates a staff admin account, for setting up the first admin. After that, add staff from /admin/staff.
//   npx tsx scripts/create-admin.ts you@pharmastepng.com "Your Name"
// Prints a temporary password once; you'll choose your own at first sign-in at /admin/login.
import { generateTempPassword } from "../src/lib/passwords";
import { prisma, supabaseAdmin } from "./lib";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  const fullName = process.argv[3]?.trim() || null;
  if (!email || !email.includes("@")) throw new Error('Usage: npx tsx scripts/create-admin.ts <email> "<full name>"');

  if (await prisma.profile.findUnique({ where: { email } })) {
    throw new Error(`${email} already has an account. Staff accounts must use their own email, separate from any customer account.`);
  }

  const supabase = supabaseAdmin();
  const password = generateTempPassword();
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error || !data.user) {
    throw new Error(error?.code === "email_exists" ? `${email} already exists in Supabase Auth.` : error?.message ?? "Could not create user.");
  }

  try {
    await prisma.profile.create({ data: { id: data.user.id, email, fullName, role: "ADMIN", mustChangePassword: true } });
  } catch (err) {
    await supabase.auth.admin.deleteUser(data.user.id);
    throw err;
  }

  console.log(`Admin created: ${email}`);
  console.log(`Temporary password: ${password}`);
  console.log("Sign in at /admin/login; you'll be asked to choose your own password. This password isn't stored anywhere else.");
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    // exitCode rather than exit(): exiting while the connection closes crashes Node on Windows.
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
