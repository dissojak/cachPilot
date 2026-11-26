import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="state">
      <section className="glass state-card">
        <h1>Your role cannot open this page</h1>
        <p className="muted">Ask an owner of your company if you need access to it.</p>
        <Link href="/" className="btn">Go to my pages</Link>
      </section>
    </main>
  );
}
