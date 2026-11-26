export default function Loading() {
  return (
    <main className="state" aria-busy="true" aria-live="polite">
      <div className="glass state-card">
        <p className="muted">Loading your company…</p>
        <div className="progress"><span /></div>
      </div>
    </main>
  );
}
