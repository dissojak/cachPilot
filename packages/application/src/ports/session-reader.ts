export interface SessionActor {
  userId: string;
  companyId: string;
  role: "owner" | "finance_manager" | "collaborator";
}

export interface SessionReader {
  current(): Promise<SessionActor | null>;
}
