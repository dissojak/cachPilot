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
    <main className="shell" style={{ maxWidth: 640 }}>
      <p className="mono">Welcome, {actor.name}</p>
      <h1 className="page-title">Create your company</h1>
      <p className="muted page-description">
        {companies.length === 0
          ? "You are not a member of any company yet. Create one (you become its owner), or ask an owner to add your e-mail "
          : "Add another company you manage. Your e-mail is "}
        <strong>{actor.email}</strong>.
      </p>
      <section className="glass card" style={{ marginTop: 24 }}>
        <ActionForm action={registerCompanyAction}>
          <Field label="Company name" name="name" required autoComplete="organization" />
          <SelectField label="Sector" name="sector" options={sectors} />
          <div className="form-row">
            <Field label="Cash in the bank today (DNT)" name="openingBalance" inputMode="decimal" placeholder="5000.000" required hint="Your opening balance, recorded once as a cash movement" />
            <Field label="On date" name="openingDate" type="date" defaultValue={today} max={today} required />
          </div>
          <SubmitButton>Create company</SubmitButton>
        </ActionForm>
      </section>
    </main>
  );
}
