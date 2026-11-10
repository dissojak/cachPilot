import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export class InvoiceNumber {
  private constructor(readonly value: string) {}

  static from(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Invoice number is required");
    }
    return new InvoiceNumber(trimmed);
  }
}
