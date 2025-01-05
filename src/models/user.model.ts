import { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  password?: string;
  image?: string;
  provider?: "credentials" | "github";
  githubId?: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  password?: string;
  image?: string;
  provider?: "credentials" | "github";
  githubId?: string;
  verified?: boolean;
}

export class UserModel {
  static collection = "users";

  static async findByEmail(db: any, email: string): Promise<User | null> {
    return await db.collection(this.collection).findOne({ email });
  }

  static async findById(db: any, id: string): Promise<User | null> {
    return await db.collection(this.collection).findOne({ _id: new ObjectId(id) });
  }

  static async create(db: any, input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user = {
      ...input,
      verified: input.verified ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await db.collection(this.collection).insertOne(user);
    return {
      ...user,
      _id: result.insertedId,
    } as User;
  }

  static async update(db: any, id: string, update: Partial<User>): Promise<boolean> {
    const result = await db.collection(this.collection).updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...update,
          updatedAt: new Date(),
        },
      }
    );
    return result.matchedCount > 0;
  }

  static async delete(db: any, id: string): Promise<boolean> {
    const result = await db.collection(this.collection).deleteOne({
      _id: new ObjectId(id),
    });
    return result.deletedCount > 0;
  }

  static async findByGithubId(db: any, githubId: string): Promise<User | null> {
    return await db.collection(this.collection).findOne({ githubId });
  }
}
