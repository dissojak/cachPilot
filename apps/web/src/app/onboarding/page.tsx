import { redirect } from "next/navigation";
import { getActor } from "@/lib/session";
import { ActionForm, Field, SelectField, SubmitButton } from "@/components/form";
import { registerCompanyAction } from "./actions";
import { useCases } from "@/container";

const sectors = [
  { value: "digital agency", label: "Digital agency" },
  { value: "training center", label: "Training center" },
  { value: "shop", label: "Shop" },
  { value: "services", label: "Service company" },
];

/** A signed-in user with no company lands here: no one is added to a company implicitly. */
export default async function OnboardingPage() {
  const actor = await getActor();
  if (!actor) redirect("/login");
  const today = new Date().toISOString().slice(0, 10);
  const companies = await useCases.listMyCompanies.execute({ userId: actor.userId });

  return (
    <main className="shell width-narrow">
      <h1 className="page-title">Create your company</h1>
      <p className="muted page-description">
        {companies.length === 0
          ? <>You are not a member of a company yet. Create one and you become its owner. Or ask an owner to add <strong>{actor.email}</strong> to theirs.</>
          : <>Add another company you manage. You are signed in as <strong>{actor.email}</strong>.</>}
      </p>
      <section className="glass card mt-24">
        <ActionForm action={registerCompanyAction} className="form">
          <Field label="Company name" name="name" required autoComplete="organization" />
          <SelectField label="Sector" name="sector" options={sectors} />
          <div className="form-row">
            <Field label="Cash in the bank today (DNT)" name="openingBalance" inputMode="decimal" placeholder="5000.000" required hint="Your starting cash. It is recorded once, as the opening balance." />
            <Field label="On date" name="openingDate" type="date" defaultValue={today} max={today} required />
          </div>
          <div className="form-footer"><SubmitButton>Create company</SubmitButton></div>
        </ActionForm>
      </section>
    </main>
  );
}
