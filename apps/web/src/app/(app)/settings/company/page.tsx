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
    <main className="shell width-form">
      <PageHeader title="Company" description="The name, sector and low-cash alert. The opening balance is a cash movement: correct it on the Cash page with an adjustment." />
      <Card>
        <ActionForm action={updateCompanyAction} className="form">
          <Field label="Company name" name="name" defaultValue={company.name} required />
          <Field label="Sector" name="sector" defaultValue={company.sector} required />
          <Field label="Low-cash alert (DNT)" name="threshold" inputMode="decimal" defaultValue={moneyInput(company.forecastThresholdMillimes)}
            hint="You are warned when the forecast drops below this amount. Enter 0 to turn the warning off." />
          <div className="form-footer"><SubmitButton>Save changes</SubmitButton></div>
        </ActionForm>
      </Card>
    </main>
  );
}
