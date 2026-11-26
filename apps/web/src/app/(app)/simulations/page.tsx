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
      <PageHeader title="Simulations"
        description="Test a decision before you make it. A scenario only stores hypotheses: your invoices, expenses and cash never change." />
      <div className="grid-2">
        <Card title="Your scenarios">
          {scenarios.length === 0
            ? <EmptyState title="No scenario yet" text="Create one, then add a late payment, a new expense or an extra income to see its effect." />
            : (
              <div className="list">
                {scenarios.map((scenario) => (
                  <Link key={scenario.id} href={`/simulations/${scenario.id}`} className="alert-item accent-lake">
                    <strong>{scenario.name}</strong>
                    <small className="muted">Starts {date(scenario.baseReferenceDate)} · {scenario.hypotheses.length} {scenario.hypotheses.length === 1 ? "hypothesis" : "hypotheses"}</small>
                  </Link>
                ))}
              </div>
            )}
        </Card>
        <Card title="New scenario">
          <p className="muted page-lead">Give it a name that says what you are testing.</p>
          <ActionForm action={createScenarioAction} className="form">
            <Field label="Name" name="name" placeholder="Client pays 20 days late" required />
            <Field label="Start from" name="baseReferenceDate" type="date" defaultValue={today} hint="The forecast is compared from this day onward." required />
            <div className="form-footer"><SubmitButton>Create scenario</SubmitButton></div>
          </ActionForm>
        </Card>
      </div>
    </main>
  );
}
