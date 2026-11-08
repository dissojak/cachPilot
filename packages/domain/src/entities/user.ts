import { UserId } from "../value-objects/ids";
import { Email } from "../value-objects/email";

export class User {
  private constructor(
    readonly id: UserId,
    private props: {
      email: Email;
      name: string;
      oauthProvider: string;
      oauthSubject: string;
    },
  ) {}

  static fromOAuth(input: {
    id?: UserId;
    email: string;
    name: string;
    provider: string;
    subject: string;
  }) {
    return new User(input.id ?? UserId.next(), {
      email: Email.from(input.email),
      name: input.name,
      oauthProvider: input.provider,
      oauthSubject: input.subject,
    });
  }

  static restore(input: {
    id: UserId;
    email: string;
    name: string;
    oauthProvider: string;
    oauthSubject: string;
  }) {
    return new User(input.id, {
      email: Email.from(input.email),
      name: input.name,
      oauthProvider: input.oauthProvider,
      oauthSubject: input.oauthSubject,
    });
  }

  get email() { return this.props.email.value; }
  get name() { return this.props.name; }

  snapshot() {
    return {
      id: this.id.value,
      email: this.props.email.value,
      name: this.props.name,
      oauthProvider: this.props.oauthProvider,
      oauthSubject: this.props.oauthSubject,
    };
  }
}
