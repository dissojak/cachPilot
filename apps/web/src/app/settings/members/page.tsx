export default function MembersPage() {
  return (
    <main className="shell">
      <h1 style={{ fontFamily: "Outfit, system-ui, sans-serif", fontSize: 40, lineHeight: "44px" }}>Members</h1>
      <section className="glass" style={{ padding: 32, marginTop: 24 }}>
        <p style={{ color: "#4A6256" }}>Owner, finance manager, and collaborator roles are managed here.</p>
        <button type="button" style={{ height: 48, padding: "0 24px", borderRadius: 999, border: 0, background: "#1F6B4E", color: "white", fontWeight: 600, cursor: "pointer" }}>
          Invite member
        </button>
      </section>
    </main>
  );
}
