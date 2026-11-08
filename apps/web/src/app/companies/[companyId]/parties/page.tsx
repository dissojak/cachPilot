
import Link from "next/link";

import { requireCompanyActor } from "@/lib/company-actor";
import { onboardingUseCases } from "@/container/onboarding";

import CreatePartyForm from "./create-party-form";

interface Props {
  params: Promise<{
    companyId: string;
  }>;
}

export default async function PartiesPage({
  params,
}: Props) {
  const { companyId } = await params;

  const actor = await requireCompanyActor(companyId);

  const parties = await onboardingUseCases.listParties.execute({
    userId: actor.userId,
    companyId: actor.companyId,
  });

  const customers = parties.filter(
    (party) => party.type === "customer"
  );

  const suppliers = parties.filter(
    (party) => party.type === "supplier"
  );

  const canManage =
    actor.role === "owner" ||
    actor.role === "finance_manager";

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "0 auto",
        padding: 40,
      }}
    >
      <Link href={`/companies/${companyId}`}>
        Back to Company
      </Link>

      <header style={{ marginTop: 30 }}>
        <p className="mono">
          CashPilot / Company Management
        </p>

        <h1>Customers & Suppliers</h1>

        <p>
          Company: <strong>{actor.companyName}</strong>
        </p>
      </header>

      <section
        style={{
          display: "flex",
          gap: 16,
          marginTop: 32,
          flexWrap: "wrap",
        }}
      >
        <div className="glass" style={{ padding: 24, flex: 1 }}>
          <h2>{customers.length}</h2>
          <p>Customers</p>
        </div>

        <div className="glass" style={{ padding: 24, flex: 1 }}>
          <h2>{suppliers.length}</h2>
          <p>Suppliers</p>
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Customers</h2>

        {customers.length === 0 && (
          <p>No customers found.</p>
        )}

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {customers.map((customer) => (
            <article
              key={customer.id}
              className="glass"
              style={{ padding: 20 }}
            >
              <h3>{customer.name}</h3>
              <p>{customer.email || "No email"}</p>
              <p>{customer.phone || "No phone"}</p>
              <p>{customer.address || "No address"}</p>
            </article>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 32 }}>
        <h2>Suppliers</h2>

        {suppliers.length === 0 && (
          <p>No suppliers found.</p>
        )}

        <div style={{ display: "grid", gap: 12, marginTop: 16 }}>
          {suppliers.map((supplier) => (
            <article
              key={supplier.id}
              className="glass"
              style={{ padding: 20 }}
            >
              <h3>{supplier.name}</h3>
              <p>{supplier.email || "No email"}</p>
              <p>{supplier.phone || "No phone"}</p>
              <p>{supplier.address || "No address"}</p>
            </article>
          ))}
        </div>
      </section>

      {canManage && (
        <CreatePartyForm companyId={companyId} />
      )}
    </main>
  );
}
