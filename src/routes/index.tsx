import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { getCurrentUser, signOut } from "@/lib/auth.functions";
import { submitEntry } from "@/lib/entries.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "New Case · Clinic Case Tracker" },
      { name: "description", content: "Record a new clinical case intake entry." },
    ],
  }),
  component: HomePage,
});

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; id: string }
  | { kind: "error"; msg: string };

const blankForm = {
  date_of_admission: "",
  name: "",
  passport_no: "",
  diagnosis: "",
  medication: "",
  days: "",
  next_checkup: "",
};

function HomePage() {
  const navigate = useNavigate();
  const router = useRouter();
  const getUserFn = useServerFn(getCurrentUser);
  const signOutFn = useServerFn(signOut);
  const submitFn = useServerFn(submitEntry);

  const userQuery = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => getUserFn(),
  });

  const [form, setForm] = useState(blankForm);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  useEffect(() => {
    if (!userQuery.isLoading && !userQuery.data?.email) {
      navigate({ to: "/login" });
    }
  }, [userQuery.isLoading, userQuery.data?.email, navigate]);

  if (userQuery.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!userQuery.data?.email) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Redirecting to sign in…
      </div>
    );
  }

  const email = userQuery.data.email;

  function update<K extends keyof typeof form>(key: K, v: string) {
    setForm((f) => ({ ...f, [key]: v }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    try {
      const res = await submitFn({
        data: {
          ...form,
          days: Number(form.days),
        },
      });
      if (!res.ok) {
        setStatus({ kind: "error", msg: res.error });
        return;
      }
      setStatus({ kind: "success", id: res.id });
      setForm(blankForm);
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : "Submission failed" });
    }
  }

  async function onSignOut() {
    await signOutFn();
    await router.invalidate();
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-accent/30">
      <header className="border-b border-border bg-card/70 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold">
              +
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight">Clinic Case Tracker</h1>
              <p className="text-xs text-muted-foreground">{email}</p>
            </div>
          </div>
          <button
            onClick={onSignOut}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">New case intake</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Submitted entries are appended to the Entries worksheet.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date of admission" required>
              <input
                type="date"
                required
                value={form.date_of_admission}
                onChange={(e) => update("date_of_admission", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Next check-up schedule" required>
              <input
                type="date"
                required
                value={form.next_checkup}
                onChange={(e) => update("next_checkup", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Name" required>
              <input
                type="text"
                required
                maxLength={200}
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="Passport No." required>
              <input
                type="text"
                required
                maxLength={40}
                value={form.passport_no}
                onChange={(e) => update("passport_no", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Diagnosis" required>
            <textarea
              required
              maxLength={1000}
              rows={3}
              value={form.diagnosis}
              onChange={(e) => update("diagnosis", e.target.value)}
              className={inputCls}
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4">
            <Field label="Medication" required>
              <textarea
                required
                maxLength={1000}
                rows={3}
                value={form.medication}
                onChange={(e) => update("medication", e.target.value)}
                className={inputCls}
              />
            </Field>
            <Field label="No. of days for medication" required>
              <input
                type="number"
                min={0}
                max={3650}
                required
                value={form.days}
                onChange={(e) => update("days", e.target.value)}
                className={inputCls}
              />
            </Field>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <button
              type="submit"
              disabled={status.kind === "loading"}
              className="w-full sm:w-auto rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:opacity-90 disabled:opacity-60 transition"
            >
              {status.kind === "loading" ? "Submitting…" : "Submit entry"}
            </button>
            <StatusBanner status={status} />
          </div>
        </form>
      </main>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

function StatusBanner({ status }: { status: Status }) {
  if (status.kind === "idle") {
    return (
      <p className="text-xs text-muted-foreground">
        Status: ready. Fill the form and submit to append to Google Sheets.
      </p>
    );
  }
  if (status.kind === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-primary">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        Sending entry to Google Sheets…
      </div>
    );
  }
  if (status.kind === "success") {
    return (
      <div className="rounded-md border border-primary/30 bg-primary/10 px-3 py-2 text-sm">
        <span className="font-medium text-primary">Submitted ✓</span>{" "}
        <span className="text-foreground">Entry ID: </span>
        <code className="font-mono text-xs">{status.id}</code>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {status.msg}
    </div>
  );
}
