export default function Loading() {
  return (
    <main className="shell" aria-busy="true" aria-live="polite">
      <p className="mono">Loading</p>
      <div className="glass card skeleton skeleton-block mt-16" />
      <div className="grid-stats">
        {[0, 1, 2].map((key) => <div key={key} className="glass skeleton stat skeleton-tile" />)}
      </div>
    </main>
  );
}
