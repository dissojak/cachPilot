import { User } from "@cashpilot/domain";
import { UserId } from "@cashpilot/domain";

export interface UserRepository {
  byId(id: UserId): Promise<User | null>;
  byEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
