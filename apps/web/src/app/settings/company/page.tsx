export default function CompanySettingsPage() {
  return (
    <main className="shell">
      <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px" }}>Company settings</h1>
      <section className="glass" style={{ padding: 32, marginTop: 24, maxWidth: 640 }}>
        <label style={{ display: "block", marginBottom: 16 }}>
          <span style={{ display: "block", marginBottom: 8, color: "#4A6256" }}>Company name</span>
          <input style={{ width: "100%", height: 56, borderRadius: 16, border: "1px solid #CFE0CC", padding: "0 16px" }} defaultValue="Atlas Studio" />
        </label>
        <button type="button" style={{ height: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>
          Save changes
        </button>
      </section>
    </main>
  );
}
