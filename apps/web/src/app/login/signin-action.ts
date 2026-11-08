"use server";
import { signIn } from "@/auth";

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const raw = formData.get("callbackUrl");
  const callbackUrl = typeof raw === "string" && raw.startsWith("/") ? raw : "/dashboard";
  await signIn("google", { redirectTo: callbackUrl });
}
