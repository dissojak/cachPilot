
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

const config: NextAuthConfig = {
  providers: [Google],
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  trustHost: true,
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
