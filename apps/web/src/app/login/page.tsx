import { signInWithGoogle } from "./signin-action";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/dashboard";
  return (
    <main className="auth-page">
      <section className="glass auth-card">
        <p className="mono">CashPilot</p>
        <h1 className="auth-title">See your cash before it moves</h1>
        <p className="muted auth-copy">
          Track real cash, spot shortages early and test a decision before you make it.
        </p>
        <form action={signInWithGoogle}>
          <input type="hidden" name="callbackUrl" value={redirectTo} />
          <button type="submit" className="btn btn-block">Continue with Google</button>
        </form>
        <p className="field-hint auth-fine">Sign-in uses Google only. CashPilot never stores a password.</p>
      </section>
    </main>
  );
}
