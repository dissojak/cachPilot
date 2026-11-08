import { signInWithGoogle } from "./signin-action";
export default function LoginPage() {
  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "Outfit, system-ui, sans-serif", fontSize: "28vw", fontWeight: 600, color: "rgba(31,107,78,0.05)", letterSpacing: "-0.05em", pointerEvents: "none", userSelect: "none" }}>
        CASH
      </div>
      <section className="glass" style={{ position: "relative", width: "100%", maxWidth: 430, padding: 44, textAlign: "center" }}>
        <p className="mono">CashPilot</p>
        <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 44, lineHeight: "48px", margin: "14px 0 10px" }}>
          Sign in to your company
        </h1>
        <p style={{ color: "#4A6256", margin: "0 0 34px", lineHeight: 1.5 }}>
          Track real cash, see shortages early, and test decisions before you make them.
        </p>
        <form action={signInWithGoogle}>
          <button
            type="submit"
            style={{ display: "block", width: "100%", height: 52, border: 0, borderRadius: 999, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer", fontSize: 16 }}
          >
            Continue with Google
          </button>
        </form>
        <p style={{ color: "#7C8F83", fontSize: 13, margin: "20px 0 0" }}>
          OAuth only. No passwords are stored by CashPilot.
        </p>
      </section>
    </main>
  );
}
