import { PartyId } from "../value-objects/ids";
import type { CompanyId } from "../value-objects/ids";
import { Email } from "../value-objects/email";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export type PartyType = "customer" | "supplier";

interface PartyProps {
  companyId: CompanyId;
  type: PartyType;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

type PartyDetails = Pick<PartyProps, "type" | "name" | "email" | "phone" | "address">;

/** BR-32: a customer or supplier belongs to exactly one company. */
export class Party {
  private constructor(
    readonly id: PartyId,
    private props: PartyProps,
  ) {}

  static create(input: { id?: PartyId; companyId: CompanyId } & PartyDetails) {
    return new Party(input.id ?? PartyId.next(), { companyId: input.companyId, ...Party.checked(input) });
  }

  static restore(input: { id: PartyId } & PartyProps) {
    return new Party(input.id, {
      companyId: input.companyId,
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
    });
  }

  get companyId() { return this.props.companyId; }
  get type() { return this.props.type; }
  get name() { return this.props.name; }

  update(changes: Partial<PartyDetails>) {
    this.props = { companyId: this.props.companyId, ...Party.checked({ ...this.props, ...changes }) };
  }

  private static checked(details: PartyDetails): PartyDetails {
    const name = details.name.trim();
    if (name.length === 0) throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "A name is required");
    const email = details.email?.trim() ? Email.from(details.email).value : undefined;
    return {
      type: details.type,
      name,
      email,
      phone: details.phone?.trim() || undefined,
      address: details.address?.trim() || undefined,
    };
  }

  snapshot() {
    return {
      id: this.id.value,
      companyId: this.props.companyId.value,
      type: this.props.type,
      name: this.props.name,
      email: this.props.email,
      phone: this.props.phone,
      address: this.props.address,
    };
  }
}
