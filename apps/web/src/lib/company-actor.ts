
import { auth } from "@/auth";
import { getCreatedCompanyForUser } from "@/container/onboarding";
import { notFound, redirect } from "next/navigation";

export async function requireCompanyActor(companyId: string) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!/^[a-f\d]{24}$/i.test(companyId)) {
    notFound();
  }

  const company = await getCreatedCompanyForUser(
    session.user.id,
    companyId
  );

  if (!company) {
    notFound();
  }

  return {
    userId: session.user.id,
    companyId,
    role: company.role,
    companyName: company.name,
    sector: company.sector,
  };
}
