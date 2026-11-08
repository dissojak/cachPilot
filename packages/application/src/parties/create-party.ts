import {
  CompanyId,
  UserId,
  PartyId,
  Party,
  DomainError,
  DOMAIN_ERROR_CODES,
} from "@cashpilot/domain";

import type {
  PartyRepository,
  MembershipRepository,
  IdGenerator,
} from "../ports";

export interface CreatePartyInput {
  userId: string;
  companyId: string;
  type: "customer" | "supplier";
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export class CreateParty {
  constructor(
    private readonly parties: PartyRepository,
    private readonly memberships: MembershipRepository,
    private readonly ids?: IdGenerator
  ) {}

  async execute(input: CreatePartyInput) {
    const companyId = CompanyId.from(input.companyId);
    const userId = UserId.from(input.userId);

    // 1. Vérifier l'appartenance à l'entreprise
    const membership =
      await this.memberships.byUserAndCompany(
        userId,
        companyId
      );

    if (!membership) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "You are not a member of this company"
      );
    }

    // 2. Contrôler le rôle
    if (
      membership.role !== "owner" &&
      membership.role !== "finance_manager"
    ) {
      throw new DomainError(
        DOMAIN_ERROR_CODES.ACCESS_DENIED,
        "You cannot manage customers or suppliers"
      );
    }

    // 3. Valider les données métier
    const name = input.name.trim();

    if (name.length < 2 || name.length > 100) {
      throw new Error("Invalid customer or supplier name");
    }

    // 4. Construire l'entité
    const party = Party.create({
      id: this.ids
        ? PartyId.from(this.ids.newId())
        : undefined,
      companyId,
      type: input.type,
      name,
      email: input.email?.trim().toLowerCase(),
      phone: input.phone?.trim(),
      address: input.address?.trim(),
    });

    // 5. Enregistrer via le repository
    await this.parties.save(party);

    return party.snapshot();
  }
}
