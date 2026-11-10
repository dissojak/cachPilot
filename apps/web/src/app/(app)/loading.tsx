export default function Loading() {
  return (
    <main className="shell" aria-busy="true">
      <p className="mono">Loading</p>
      <div className="glass card" style={{ height: 160, marginTop: 16, opacity: 0.6 }} />
      <div className="grid-stats" style={{ marginTop: 20 }}>
        {[0, 1, 2].map((key) => <div key={key} className="glass" style={{ height: 110, opacity: 0.5 }} />)}
      </div>
    </main>
  );
}
