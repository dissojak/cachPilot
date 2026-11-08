export class InvoiceNumber {
  private constructor(readonly value: string) {}

  static from(value: string) {
    if (value.trim().length === 0) throw new Error("Invalid invoice number");
    return new InvoiceNumber(value.trim());
  }
}
