
import { User, UserId } from "@cashpilot/domain";

export interface OAuthIdentity {
  provider: string;
  subject: string;
  email: string;
  name: string;
}

export interface UserRepository {
  byId(id: UserId): Promise<User | null>;
  byEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;

  resolveOAuthIdentity(identity: OAuthIdentity): Promise<User>;
}
