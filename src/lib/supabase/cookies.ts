/**
 * Supabase session cookie settings. The app only talks to Supabase from the server, so the session is
 * kept out of reach of page scripts (httpOnly) and only sent over HTTPS in production.
 */
export const AUTH_COOKIE_OPTIONS = { httpOnly: true, secure: process.env.NODE_ENV === "production" } as const;
