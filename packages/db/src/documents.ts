/**
 * Shapes of the stored documents. They mirror the entities' snapshot() with
 * `_id` instead of `id`. Only packages/infra (mappers) reads these types.
 */
export interface CompanyDoc { _id: string; name: string; sector: string; forecastThresholdMillimes: number }
export interface UserDoc { _id: string; email: string; name: string; oauthProvider: string; oauthSubject: string }
export interface MembershipDoc { _id: string; userId: string; companyId: string; role: "owner" | "finance_manager" | "collaborator" }
export interface PartyDoc { _id: string; companyId: string; type: "customer" | "supplier"; name: string; email?: string; phone?: string; address?: string }
export interface InvoiceLineDoc { description: string; quantity: number; unitPriceMillimes: number; lineTotalMillimes: number }
export interface InvoiceDoc {
  _id: string; companyId: string; customerId: string; number: string;
  status: "draft" | "validated" | "partially_paid" | "paid" | "cancelled";
  issueDate: string; dueDate: string; lines: InvoiceLineDoc[]; totalMillimes: number; remainingMillimes: number;
  cancelledReason?: string; cancelledBy?: string; cancelledAt?: string;
}
export interface PaymentDoc { _id: string; companyId: string; invoiceId: string; amountMillimes: number; paymentDate: string; method: string; note?: string; recordedBy: string }
export interface ExpenseDoc {
  _id: string; companyId: string; submittedBy: string; category: string; description: string; amountMillimes: number;
  expenseDate: string; receiptFileId?: string; status: "submitted" | "approved" | "refused" | "paid";
  approval?: { approver?: string; decisionDate?: string; reason?: string };
  payment?: { paidBy?: string; paidDate?: string };
}
export interface CashMovementDoc {
  _id: string; companyId: string; type: "opening" | "invoice_payment" | "expense_payment" | "adjustment" | "reversal";
  amountMillimes: number; movementDate: string; sourceType: string; sourceId: string; actorId: string; reason?: string; reversesId?: string;
}
export interface HypothesisDoc {
  type: "client_delay" | "new_expense" | "extra_income";
  invoiceId?: string; delayDays?: number; amountMillimes?: number; date?: string; label?: string;
  /** older documents */ plannedDate?: string; expectedDate?: string; description?: string;
}
export interface ScenarioDoc { _id: string; companyId: string; name: string; baseReferenceDate: string; hypotheses: HypothesisDoc[]; createdBy: string }
export interface RetainerDoc {
  _id: string; companyId: string; customerId: string; name: string; amountMillimes: number;
  intervalDays: number; nextGenerationDate: string; status: "active" | "paused";
}
export interface AuditLogDoc {
  companyId: string; actorId: string; entityType: string; entityId: string; action: string;
  at: string; before?: unknown; after?: unknown; reason?: string;
}
export interface CounterDoc { _id: string; seq: number }
