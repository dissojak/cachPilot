
import { connectDb, UserModel } from "@cashpilot/db";
import { User, UserId } from "@cashpilot/domain";
import type {
  UserRepository,
  OAuthIdentity,
} from "@cashpilot/application";

type UserDocument = {
  _id: { toString(): string };
  email: string;
  name: string;
  oauthProvider: string;
  oauthSubject: string;
};

function toDomain(doc: UserDocument): User {
  return User.restore({
    id: UserId.from(doc._id.toString()),
    email: doc.email,
    name: doc.name,
    oauthProvider: doc.oauthProvider,
    oauthSubject: doc.oauthSubject,
  });
}

export class MongoUserRepository implements UserRepository {
  async byId(id: UserId): Promise<User | null> {
    await connectDb();

    const doc = await UserModel.findById(id.value).lean();

    return doc ? toDomain(doc) : null;
  }

  async byEmail(email: string): Promise<User | null> {
    await connectDb();

    const doc = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    }).lean();

    return doc ? toDomain(doc) : null;
  }

  async save(user: User): Promise<void> {
    await connectDb();

    const data = user.snapshot();

    await UserModel.updateOne(
      { _id: data.id },
      {
        $set: {
          email: data.email,
          name: data.name,
          oauthProvider: data.oauthProvider,
          oauthSubject: data.oauthSubject,
        },
      },
      { upsert: true, runValidators: true }
    );
  }

  async resolveOAuthIdentity(
    identity: OAuthIdentity
  ): Promise<User> {
    await connectDb();

    const doc = await UserModel.findOneAndUpdate(
      {
        oauthProvider: identity.provider,
        oauthSubject: identity.subject,
      },
      {
        $setOnInsert: {
          email: identity.email,
          name: identity.name,
          oauthProvider: identity.provider,
          oauthSubject: identity.subject,
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!doc) {
      throw new Error("Unable to resolve OAuth user");
    }

    return toDomain(doc);
  }
}
