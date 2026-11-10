import { authorize } from "../access/authorize";
import { CompanyId, ExpenseId } from "@cashpilot/domain";
import type { ExpenseRepository } from "../ports/expense-repository";
import type { FileStorage } from "../ports/file-storage";
import type { MembershipRepository } from "../ports/membership-repository";
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

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export class AttachReceipt {
  constructor(
    private readonly expenses: ExpenseRepository,
    private readonly memberships: MembershipRepository,
    private readonly storage: FileStorage,
  ) {}

  async execute(input: AttachReceiptInput) {
    await authorize(this.memberships, input, "expenses.submit");
    const expense = await this.expenses.byId(ExpenseId.from(input.expenseId));
    if (!expense || !expense.companyId.equals(CompanyId.from(input.companyId))) throw new DomainError(DOMAIN_ERROR_CODES.EXPENSE_NOT_FOUND, "Expense not found");
    if (!ALLOWED_RECEIPT_TYPES.includes(input.contentType)) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Receipt must be an image or a PDF");
    }
    if (input.content.byteLength > MAX_RECEIPT_BYTES) {
      throw new DomainError(DOMAIN_ERROR_CODES.INVALID_INPUT, "Receipt must be 5 MB or smaller");
    }

    const file = await this.storage.save({
      companyId: input.companyId,
      fileName: input.fileName,
      content: input.content,
      contentType: input.contentType,
    });
    expense.attachReceipt(file.id);
    await this.expenses.save(expense);
    return expense.snapshot();
  }
}
