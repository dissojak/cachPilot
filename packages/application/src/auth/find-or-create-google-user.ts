
import { Email } from "@cashpilot/domain";
import type { UserRepository } from "../ports/user-repository";

export interface GoogleUserInput {
  email: string;
  name: string;
  googleSubject: string;
}

export class FindOrCreateGoogleUser {
  constructor(
    private readonly users: UserRepository
  ) {}

  async execute(input: GoogleUserInput): Promise<string> {
    const email = Email.from(input.email).value;
    const subject = input.googleSubject.trim();

    if (!subject) {
      throw new Error("Google subject is required");
    }

    const user = await this.users.resolveOAuthIdentity({
      provider: "google",
      subject,
      email,
      name: input.name.trim() || email,
    });

    return user.id.value;
  }
}
