"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="state">
      <section className="glass state-card">
        <p className="mono">Something went wrong</p>
        <h1>Nothing was lost</h1>
        <p className="muted">The page could not load. No data was changed, so you can retry safely.</p>
        <button type="button" className="btn" onClick={reset}>Try again</button>
      </section>
    </main>
  );
}
