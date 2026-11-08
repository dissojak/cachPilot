
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";
import { findOrCreateGoogleUser } from "@/container/auth";



const config: NextAuthConfig = {
  providers: [Google],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },

  trustHost: true,

  
callbacks: {
  async signIn({ user, account }) {
    try {
      if (
        account?.provider !== "google" ||
        !account.providerAccountId ||
        !user.email
      ) {
        console.error(
          "[AUTH] Missing Google identity information"
        );

        return false;
      }

      console.log("[AUTH] Google identity received");

      const userId = await findOrCreateGoogleUser.execute({
        email: user.email,
        name: user.name ?? user.email,
        googleSubject: account.providerAccountId,
      });

      console.log("[AUTH] User resolved successfully:", userId);

      return true;
    } catch (error) {
      console.error("[AUTH] User synchronization failed");

      if (error instanceof Error) {
        console.error("[AUTH] Error type:", error.name);
        console.error("[AUTH] Error message:", error.message);
      }

      return false;
    }
  },
},

};


type AuthResult = ReturnType<typeof NextAuth>;

const nextAuth = NextAuth(config);

export const handlers: AuthResult["handlers"] =
  nextAuth.handlers;

export const auth: AuthResult["auth"] =
  nextAuth.auth;

export const signIn: AuthResult["signIn"] =
  nextAuth.signIn;

export const signOut: AuthResult["signOut"] =
  nextAuth.signOut;
