import { PartyId } from "../value-objects/ids";
import { CompanyId } from "../value-objects/ids";

export type PartyType = "customer" | "supplier";

export class Party {
  private constructor(
    readonly id: PartyId,
    private props: {
      companyId: CompanyId;
      type: PartyType;
      name: string;
      email?: string;
      phone?: string;
      address?: string;
    },
  ) {}

  static create(input: {
    id?: PartyId;
    companyId: CompanyId;
    type: PartyType;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    return new Party(input.id ?? PartyId.next(), {
      companyId: input.companyId,
      type: input.type,
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
    });
  }

  static restore(input: {
    id: PartyId;
    companyId: CompanyId;
    type: PartyType;
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  }) {
    return new Party(input.id, input);
  }

  get companyId() { return this.props.companyId; }
  get type() { return this.props.type; }
  get name() { return this.props.name; }

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
