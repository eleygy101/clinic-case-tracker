import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { appendRow } from "./sheets.server";
import { getClinicSession } from "./session.server";

const entrySchema = z.object({
  date_of_admission: z.string().min(1).max(40),
  name: z.string().trim().min(1).max(200),
  passport_no: z.string().trim().min(1).max(40),
  diagnosis: z.string().trim().min(1).max(1000),
  medication: z.string().trim().min(1).max(1000),
  days: z.coerce.number().int().min(0).max(3650),
  next_checkup: z.string().min(1).max(40),
});

function makeId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `CC-${ts}-${rand}`;
}

export const submitEntry = createServerFn({ method: "POST" })
  .inputValidator((input) => entrySchema.parse(input))
  .handler(async ({ data }) => {
    const session = await getClinicSession();
    const email = session.data.email;
    if (!email) {
      return { ok: false as const, error: "Not authenticated" };
    }

    const id = makeId();
    const submittedAt = new Date().toISOString();

    await appendRow("Entries!A:J", [
      id,
      data.date_of_admission,
      data.name,
      data.passport_no,
      data.diagnosis,
      data.medication,
      data.days,
      data.next_checkup,
      email,
      submittedAt,
    ]);

    await appendRow("ActivityLog!A:C", [submittedAt, email, id]);

    return { ok: true as const, id };
  });