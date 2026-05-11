import { useSession } from "@tanstack/react-start/server";

export type SessionData = { email?: string };

export function getClinicSession() {
  const password = process.env.SESSION_SECRET;
  if (!password || password.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return useSession<SessionData>({
    password,
    name: "clinic-session",
    maxAge: 60 * 60 * 8,
    cookie: { httpOnly: true, sameSite: "lax", secure: true, path: "/" },
  });
}