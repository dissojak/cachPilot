"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="shell" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <section className="glass" style={{ padding: 32, textAlign: "center", maxWidth: 520 }}>
        <p className="mono">Something went wrong</p>
        <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 32, lineHeight: "36px", margin: "12px 0" }}>Calm down, then retry</h1>
        <p style={{ color: "#4A6256", margin: "0 0 24px" }}>The page could not load. No data was changed.</p>
        <button type="button" onClick={reset} style={{ height: 44, padding: "0 20px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>
          Try again
        </button>
      </section>
    </main>
  );
}
