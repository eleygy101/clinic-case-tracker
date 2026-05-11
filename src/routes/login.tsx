import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState, type FormEvent } from "react";
import { signIn } from "@/lib/auth.functions";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in · Clinic Case Tracker" },
      { name: "description", content: "Authorized staff sign-in for the Clinic Case Tracker." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const router = useRouter();
  const signInFn = useServerFn(signIn);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "loading" | "error"; msg?: string }>({
    kind: "idle",
  });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus({ kind: "loading" });
    try {
      const res = await signInFn({ data: { email, password } });
      if (!res.ok) {
        setStatus({ kind: "error", msg: res.error });
        return;
      }
      await router.invalidate();
      navigate({ to: "/" });
    } catch (err) {
      setStatus({ kind: "error", msg: err instanceof Error ? err.message : "Sign-in failed" });
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary via-background to-accent/40 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground text-xl font-bold mb-4">
            +
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Clinic Case Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Sign in to record a case</p>
        </div>
        <form
          onSubmit={onSubmit}
          className="bg-card border border-border rounded-2xl shadow-sm p-6 space-y-4"
        >
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={status.kind === "loading"}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 disabled:opacity-60 transition"
          >
            {status.kind === "loading" ? "Signing in…" : "Sign in"}
          </button>
          {status.kind === "error" && (
            <p className="text-sm text-destructive text-center">{status.msg}</p>
          )}
          <p className="text-xs text-muted-foreground text-center pt-2">
            Credentials are managed by the administrator in Google Sheets.
          </p>
        </form>
      </div>
    </div>
  );
}