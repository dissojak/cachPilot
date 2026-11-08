export class Email {
  private constructor(readonly value: string) {}

  static from(value: string) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new Error("Invalid email");
    return new Email(value.trim().toLowerCase());
  }
}
