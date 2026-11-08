import { FindOrCreateGoogleUser } from "@cashpilot/application";
import { MongoUserRepository } from "@cashpilot/infra";

const userRepository = new MongoUserRepository();

export const findOrCreateGoogleUser =
  new FindOrCreateGoogleUser(userRepository);