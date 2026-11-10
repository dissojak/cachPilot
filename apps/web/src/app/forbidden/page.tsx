import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="shell" style={{ display: "grid", placeItems: "center", minHeight: "70vh" }}>
      <section className="glass card" style={{ maxWidth: 520, textAlign: "center" }}>
        <p className="mono">Not allowed</p>
        <h1 className="page-title">Your role cannot open this page</h1>
        <p className="muted">Ask an owner of your company if you need access.</p>
        <Link href="/" className="btn" style={{ marginTop: 12 }}>Go to my pages</Link>
      </section>
    </main>
  );
}
