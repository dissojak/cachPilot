export default function Loading() {
  return (
    <main className="shell" style={{ display: "grid", placeItems: "center", minHeight: "60vh" }}>
      <div className="glass" style={{ padding: 32, textAlign: "center" }}>
        <p className="mono">Loading</p>
        <div style={{ marginTop: 16, width: 120, height: 4, borderRadius: 999, background: "rgba(31,107,78,0.15)", overflow: "hidden" }}>
          <div style={{ width: "40%", height: "100%", background: "#1F6B4E", animation: "motionSlide 900ms ease-in-out infinite alternate" }} />
        </div>
      </div>
    </main>
  );
}
