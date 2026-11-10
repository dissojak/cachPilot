import { DomainError } from "../errors/domain-error";
import { DOMAIN_ERROR_CODES } from "../errors/codes";

export class Email {
  private constructor(readonly value: string) {}

  static from(value: string) {
    const trimmed = value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_EMAIL, `Invalid email: ${value}`);
    }
    return new Email(trimmed.toLowerCase());
  }
}
