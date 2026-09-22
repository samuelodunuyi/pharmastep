-- Staff accounts created with a temporary password must set their own at first sign-in.
ALTER TABLE "Profile" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
