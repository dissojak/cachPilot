export interface IdentityProvider {
  findOrCreateUser(input: { email: string; name: string; provider: string; subject: string }): Promise<string>;
}
