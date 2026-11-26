"use client";

export default function AppError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="shell">
      <section className="glass card state-card">
        <h1 className="page-title">This page could not load</h1>
        <p className="muted">No data was changed. If the database is unreachable, check your connection and try again.</p>
        <button type="button" className="btn" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
