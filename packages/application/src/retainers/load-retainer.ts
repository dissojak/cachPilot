import { CompanyId, RetainerId, DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";
import type { Retainer } from "@cashpilot/domain";
import type { RetainerRepository } from "../ports/retainer-repository";

/** Loads a retainer of this company or fails as "not found" (tenant isolation). */
export async function loadRetainer(retainers: RetainerRepository, companyId: string, retainerId: string): Promise<Retainer> {
  const retainer = await retainers.byId(RetainerId.from(retainerId));
  if (!retainer || !retainer.companyId.equals(CompanyId.from(companyId))) {
    throw new DomainError(DOMAIN_ERROR_CODES.RETAINER_NOT_FOUND, "Retainer not found");
  }
  return retainer;
}
