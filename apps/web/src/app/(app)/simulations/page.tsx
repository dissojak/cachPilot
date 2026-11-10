import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { date } from "@/lib/format";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { createScenarioAction } from "./actions";

export default async function SimulationsPage() {
  const actor = await requirePermission("simulations.use");
  const scenarios = await useCases.listScenarios.execute(actor);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <main className="shell">
      <PageHeader eyebrow="What if?" title="Simulations" description="A scenario stores only hypotheses. It never changes your invoices, expenses or cash." />
      <div className="grid-2">
        <Card title="Scenarios">
          {scenarios.length === 0
            ? <EmptyState title="No scenario yet" text="Create one, then add a client delay, a new expense or extra income." />
            : (
              <div className="list">
                {scenarios.map((scenario) => (
                  <Link key={scenario.id} href={`/simulations/${scenario.id}`} className="alert-item" style={{ borderLeftColor: "var(--lake)" }}>
                    <strong>{scenario.name}</strong>
                    <small className="muted">From {date(scenario.baseReferenceDate)} · {scenario.hypotheses.length} hypothes{scenario.hypotheses.length === 1 ? "is" : "es"}</small>
                  </Link>
                ))}
              </div>
            )}
        </Card>
        <Card title="New scenario">
          <ActionForm action={createScenarioAction}>
            <Field label="Name" name="name" placeholder="Client pays 20 days late" required />
            <Field label="Start from" name="baseReferenceDate" type="date" defaultValue={today} required />
            <SubmitButton>Create scenario</SubmitButton>
          </ActionForm>
        </Card>
      </div>
    </main>
  );
}
