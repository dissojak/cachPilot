import { CompanyId } from "../value-objects/ids";
import { Money } from "../value-objects/money";

export class Company {
  private constructor(
    readonly id: CompanyId,
    private props: {
      name: string;
      sector: string;
      openingBalance: Money;
      forecastThreshold: Money;
    },
  ) {}

  static create(input: {
    id?: CompanyId;
    name: string;
    sector: string;
    openingBalance: Money;
    forecastThreshold?: Money;
  }) {
    return new Company(input.id ?? CompanyId.next(), {
      name: input.name,
      sector: input.sector,
      openingBalance: input.openingBalance,
      forecastThreshold: input.forecastThreshold ?? Money.of(0),
    });
  }

  static restore(input: {
    id: CompanyId;
    name: string;
    sector: string;
    openingBalance: Money;
    forecastThreshold: Money;
  }) {
    return new Company(input.id, {
      name: input.name,
      sector: input.sector,
      openingBalance: input.openingBalance,
      forecastThreshold: input.forecastThreshold,
    });
  }

  get name() { return this.props.name; }
  get sector() { return this.props.sector; }
  get openingBalance() { return this.props.openingBalance; }
  get forecastThreshold() { return this.props.forecastThreshold; }

  snapshot() {
    return {
      id: this.id.value,
      name: this.props.name,
      sector: this.props.sector,
      openingBalanceMillimes: this.props.openingBalance.amount,
      forecastThresholdMillimes: this.props.forecastThreshold.amount,
    };
  }
}
