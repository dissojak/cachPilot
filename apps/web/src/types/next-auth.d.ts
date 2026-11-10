import type { DefaultSession } from "next-auth";

// From Sana's feature/google-oauth-auth: the session carries the Google account id.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}
