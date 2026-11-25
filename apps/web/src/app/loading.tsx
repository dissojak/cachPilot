export default function Loading() {
  return (
    <main className="state" aria-busy="true" aria-live="polite">
      <div className="glass state-card">
        <p className="mono">Loading</p>
        <div className="progress"><span /></div>
      </div>
    </main>
  );
}
