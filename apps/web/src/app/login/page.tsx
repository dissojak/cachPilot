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
      <section className="auth-brand" aria-label="About CashPilot">
        <div className="nav-brand-row">
          <div className="nav-avatar nav-avatar-lg" aria-hidden="true">C</div>
          <span className="nav-brand-name">CashPilot</span>
        </div>

        <div>
          <h2 className="auth-headline">See the shortage before the bank does.</h2>
          {/* illustrative forecast: the balance dips under zero and the dip is shaded */}
          <svg className="auth-chart" viewBox="0 0 560 240" role="img" aria-label="Example forecast that falls below zero for a few days">
            <line className="axis" x1="0" y1="200" x2="560" y2="200" />
            <line className="zero" x1="0" y1="150" x2="560" y2="150" />
            <text className="label" x="0" y="140">0</text>
            <path className="dip" d="M 300 150 L 336 186 L 404 196 L 446 168 L 470 150 Z" />
            <path className="line" d="M 0 70 C 90 80, 180 96, 260 124 S 330 190, 380 196 S 450 176, 500 130 S 540 112, 560 110" />
          </svg>
        </div>

        <ul className="auth-points">
          <li>Your real cash, from every recorded movement</li>
          <li>A 90-day forecast built from unpaid invoices</li>
          <li>Test a late payment before it happens</li>
        </ul>
      </section>

      <section className="auth-panel">
        <div className="auth-form">
          <h1 className="auth-title">Sign in to your company</h1>
          <p className="muted auth-copy">Use the Google account your company uses for CashPilot.</p>
          <form action={signInWithGoogle}>
            <input type="hidden" name="callbackUrl" value={redirectTo} />
            <button type="submit" className="btn btn-block">Continue with Google</button>
          </form>
          <p className="field-hint auth-fine">CashPilot never stores a password. What you can do depends on the role your company gives you.</p>
        </div>
      </section>
    </main>
  );
}
