import type { DomainErrorCode } from "./codes";

/** Carries a stable business code; the presentation maps it to a message and HTTP status. */
export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = code;
  }
}
