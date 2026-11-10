"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="shell">
      <section className="glass card" style={{ maxWidth: 560 }}>
        <p className="mono">Something went wrong</p>
        <h1 className="page-title">This page could not load</h1>
        <p className="muted">No data was changed. If the database is unreachable, check your connection and try again.</p>
        <button type="button" className="btn" onClick={reset} style={{ marginTop: 12 }}>Try again</button>
      </section>
    </main>
  );
}
