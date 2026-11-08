import { CompanyId, UserId, ExpenseId } from "@cashpilot/domain";
import { ExpenseRepository } from "../ports/expense-repository";
import { FileStorage } from "../ports/file-storage";
import { MembershipRepository } from "../ports/membership-repository";
import { DomainError } from "@cashpilot/domain";
import { DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export interface AttachReceiptInput {
  userId: string;
  companyId: string;
  expenseId: string;
  fileName: string;
  content: Uint8Array;
  contentType: string;
}

export class AttachReceipt {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly memberships: MembershipRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(input: AttachReceiptInput) {
    const membership = await this.memberships.byUserAndCompany(UserId.from(input.userId), CompanyId.from(input.companyId));
    if (!membership) throw new DomainError(DOMAIN_ERROR_CODES.ACCESS_DENIED, "Access denied");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");

    const file = await this.storage.save({
      companyId: input.companyId,
      fileName: input.fileName,
      content: input.content,
      contentType: input.contentType,
    });
    const snapshot = expense.snapshot();
    const updated = (await import("@cashpilot/domain")).Expense.restore({
      id: ExpenseId.from(input.expenseId),
      companyId: CompanyId.from(input.companyId),
      submittedBy: UserId.from(snapshot.submittedBy),
      category: snapshot.category,
      description: snapshot.description,
      amount: (await import("@cashpilot/domain")).Money.of(snapshot.amountMillimes),
      expenseDate: (await import("@cashpilot/domain")).DateOnly.from(snapshot.expenseDate),
      receiptFileId: file.id,
      status: snapshot.status as "submitted" | "approved" | "refused" | "paid",
      approval: snapshot.approval
        ? {
            approver: (await import("@cashpilot/domain")).UserId.from(snapshot.approval.approver),
            decisionDate: (await import("@cashpilot/domain")).DateOnly.from(snapshot.approval.decisionDate),
            reason: snapshot.approval.reason,
          }
        : undefined,
      payment: snapshot.payment
        ? {
            paidBy: (await import("@cashpilot/domain")).UserId.from(snapshot.payment.paidBy),
            paidDate: (await import("@cashpilot/domain")).DateOnly.from(snapshot.payment.paidDate),
            amount: (await import("@cashpilot/domain")).Money.of(snapshot.payment.amountMillimes),
          }
        : undefined,
    });
    await this.expenses.save(updated);
    return updated.snapshot();
  }
}
