import { CompanyId } from "../value-objects/ids";
import { Money } from "../value-objects/money";
import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

interface CompanyProps {
  name: string;
  sector: string;
  forecastThreshold: Money;
}

/**
 * A company has no opening balance of its own: the initial cash is an
 * "opening" cash movement (D2), so the balance has exactly one source (BR-17).
 */
export class Company {
  private constructor(
    readonly id: CompanyId,
    private props: CompanyProps,
  ) {}

  static create(input: {
    id?: CompanyId;
    name: string;
    sector: string;
    forecastThreshold?: Money;
  }) {
    const name = input.name.trim();
    const sector = input.sector.trim();
    if (name.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Company name is required");
    }
    if (sector.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Company sector is required");
    }
    return new Company(input.id ?? CompanyId.next(), {
      name,
      sector,
      forecastThreshold: input.forecastThreshold ?? Money.zero(),
    });
  }

  static restore(input: {
    id: CompanyId;
    name: string;
    sector: string;
    forecastThreshold: Money;
  }) {
    return new Company(input.id, {
      name: input.name,
      sector: input.sector,
      forecastThreshold: input.forecastThreshold,
    });
  }

  get name() { return this.props.name; }
  get sector() { return this.props.sector; }
  get forecastThreshold() { return this.props.forecastThreshold; }

  rename(name: string) {
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Company name is required");
    }
    this.props.name = trimmed;
  }

  changeSector(sector: string) {
    const trimmed = sector.trim();
    if (trimmed.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Company sector is required");
    }
    this.props.sector = trimmed;
  }

  setForecastThreshold(money: Money) {
    if (money.isNegative()) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Forecast threshold cannot be negative");
    }
    this.props.forecastThreshold = money;
  }

  snapshot() {
    return {
      id: this.id.value,
      name: this.props.name,
      sector: this.props.sector,
      forecastThresholdMillimes: this.props.forecastThreshold.amount,
    };
  }
}
