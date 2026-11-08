
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
        return false;
      }

      await findOrCreateGoogleUser.execute({
        email: user.email,
        name: user.name ?? user.email,
        googleSubject: account.providerAccountId,
      });

      return true;
    } catch (error) {
      console.error("[AUTH] Synchronization failed", error);
      return false;
    }
  },

  async jwt({ token, account, user }) {
    // Le compte Google est fourni lors de la connexion initiale.
    if (
      account?.provider === "google" &&
      account.providerAccountId &&
      user.email
    ) {
      const userId = await findOrCreateGoogleUser.execute({
        email: user.email,
        name: user.name ?? user.email,
        googleSubject: account.providerAccountId,
      });

      token.cashpilotUserId = userId;
    }

    return token;
  },

  
async session({ session, token }) {
  if (
    session.user &&
    typeof token.cashpilotUserId === "string"
  ) {
    session.user.id = token.cashpilotUserId;
  }

  return session;
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
