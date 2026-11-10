import { PageHeader, Card } from "@cashpilot/ui";
import { useCases } from "@/container";
import { requirePermission } from "@/lib/session";
import { moneyInput } from "@/lib/format";
import { ActionForm, Field, SubmitButton } from "@/components/form";
import { updateCompanyAction } from "../actions";

export default async function CompanySettingsPage() {
  const actor = await requirePermission("company.manage");
  const company = await useCases.getCompany.execute(actor);
  return (
    <main className="shell" style={{ maxWidth: 720 }}>
      <PageHeader eyebrow="Settings" title="Company" description="The opening balance is a cash movement: correct it from the Cash page with an adjustment." />
      <Card>
        <ActionForm action={updateCompanyAction}>
          <Field label="Company name" name="name" defaultValue={company.name} required />
          <Field label="Sector" name="sector" defaultValue={company.sector} required />
          <Field label="Low-cash alert threshold (DNT)" name="threshold" inputMode="decimal" defaultValue={moneyInput(company.forecastThresholdMillimes)}
            hint="The dashboard warns when the forecast falls below this amount. 0 turns it off." />
          <SubmitButton>Save</SubmitButton>
        </ActionForm>
      </Card>
    </main>
  );
}
