import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getValues } from "./sheets.server";
import { getClinicSession } from "./session.server";

const credSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(255),
});

export const signIn = createServerFn({ method: "POST" })
  .inputValidator((input) => credSchema.parse(input))
  .handler(async ({ data }) => {
    const rows = await getValues("Users!A2:B");
    const email = data.email.toLowerCase();
    const match = rows.find(
      (r) => (r[0] ?? "").trim().toLowerCase() === email && (r[1] ?? "") === data.password,
    );
    if (!match) {
      return { ok: false as const, error: "Invalid email or password" };
    }
    const session = await getClinicSession();
    await session.update({ email });
    return { ok: true as const, email };
  });

export const getCurrentUser = createServerFn({ method: "GET" }).handler(async () => {
  const session = await getClinicSession();
  return { email: session.data.email ?? null };
});

export const signOut = createServerFn({ method: "POST" }).handler(async () => {
  const session = await getClinicSession();
  await session.clear();
  return { ok: true };
});