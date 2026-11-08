import { Schema, model, models } from "mongoose";
import type { Model } from "mongoose";

function define(name: string, schema: Schema): Model<any> {
  return (models[name] as Model<any>) || model(name, schema);
}

const moneyField = { type: Number, required: true };

const companySchema = new Schema(
  {
    _id: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    openingBalanceMillimes: { ...moneyField },
    currency: { type: String, required: true, default: "DNT" },
    forecastThresholdMillimes: { type: Number, required: true, default: 0 },
  },
  { timestamps: true },
);

const userSchema = new Schema(
  {
    _id: { type: String, required: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    oauthProvider: { type: String, required: true, trim: true },
    oauthSubject: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const membershipSchema = new Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, required: true },
    companyId: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ["owner", "finance_manager", "collaborator"],
    },
  },
  { timestamps: true },
);

const partySchema = new Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true },
    type: { type: String, required: true, enum: ["customer", "supplier"] },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
  },
  { timestamps: true },
);

const invoiceLineSchema = new Schema(
  {
    description: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPriceMillimes: { ...moneyField, min: 1 },
    lineTotalMillimes: { ...moneyField, min: 1 },
  },
  { _id: false },
);

const invoiceSchema = new Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true },
    customerId: { type: String, required: true },
    number: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["draft", "validated", "partially_paid", "paid", "cancelled"],
      default: "draft",
    },
    issueDate: { type: String, required: true },
    dueDate: { type: String, required: true },
    lines: { type: [invoiceLineSchema], required: true, default: [] },
    totalMillimes: { ...moneyField, min: 1 },
    remainingMillimes: { type: Number, required: true, min: 0 },
    cancelledReason: { type: String, trim: true },
    cancelledBy: { type: String, trim: true },
  },
  { timestamps: true },
);

const paymentSchema = new Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true },
    invoiceId: { type: String, required: true },
    amountMillimes: { ...moneyField, min: 1 },
    paymentDate: { type: String, required: true },
    method: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    recordedBy: { type: String, required: true },
  },
  { timestamps: true },
);

const expenseSchema = new Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true },
    submittedBy: { type: String, required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amountMillimes: { ...moneyField, min: 1 },
    expenseDate: { type: String, required: true },
    receiptFileId: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["submitted", "approved", "refused", "paid"],
      default: "submitted",
    },
    approval: {
      approver: { type: String },
      decisionDate: { type: String },
      reason: { type: String, trim: true },
    },
    payment: {
      paidBy: { type: String },
      paidDate: { type: String },
      amountMillimes: { type: Number, min: 1 },
    },
  },
  { timestamps: true },
);

const cashMovementSchema = new Schema(
  {
    _id: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ["opening", "invoice_payment", "expense_payment", "adjustment", "reversal"],
    },
    amountMillimes: { type: Number, required: true },
    movementDate: { type: String, required: true },
    sourceType: { type: String, required: true, trim: true },
    sourceId: { type: String, required: true },
    actorId: { type: String, required: true },
    reason: { type: String, trim: true },
  },
  { timestamps: true },
);

const hypothesisSchema = new Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ["client_delay", "new_expense", "extra_income"],
    },
    invoiceId: { type: String },
    delayDays: { type: Number, min: 1 },
    amountMillimes: { type: Number, min: 1 },
    plannedDate: { type: String },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    expectedDate: { type: String },
  },
  { _id: false },
);

const scenarioSchema = new Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    baseReferenceDate: { type: String, required: true },
    hypotheses: { type: [hypothesisSchema], default: [] },
    createdBy: { type: String, required: true },
  },
  { timestamps: true },
);

const retainerSchema = new Schema(
  {
    _id: { type: String, required: true },
    companyId: { type: String, required: true },
    customerId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    amountMillimes: { ...moneyField },
    intervalDays: { type: Number, required: true, min: 1 },
    nextGenerationDate: { type: String, required: true },
    status: { type: String, required: true, enum: ["active", "paused"], default: "active" },
  },
  { timestamps: true },
);

const auditLogSchema = new Schema(
  {
    companyId: { type: String, required: true },
    actorId: { type: String, required: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: String, required: true },
    action: { type: String, required: true, trim: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String, trim: true },
  },
  { timestamps: true },
);

export const CompanyModel = define("Company", companySchema);
export const UserModel = define("User", userSchema);
export const MembershipModel = define("Membership", membershipSchema);
export const PartyModel = define("Party", partySchema);
export const InvoiceModel = define("Invoice", invoiceSchema);
export const PaymentModel = define("Payment", paymentSchema);
export const ExpenseModel = define("Expense", expenseSchema);
export const CashMovementModel = define("CashMovement", cashMovementSchema);
export const ScenarioModel = define("Scenario", scenarioSchema);
export const RetainerModel = define("Retainer", retainerSchema);
export const AuditLogModel = define("AuditLog", auditLogSchema);

companySchema.index({ name: 1 });
userSchema.index({ email: 1 }, { unique: true });
membershipSchema.index({ userId: 1, companyId: 1 }, { unique: true });
partySchema.index({ companyId: 1, type: 1, name: 1 });
invoiceSchema.index({ companyId: 1, number: 1 }, { unique: true });
invoiceSchema.index({ companyId: 1, status: 1, dueDate: 1 });
paymentSchema.index({ companyId: 1, invoiceId: 1 });
expenseSchema.index({ companyId: 1, status: 1, expenseDate: 1 });
cashMovementSchema.index({ companyId: 1, movementDate: 1 });
scenarioSchema.index({ companyId: 1, createdAt: -1 });
retainerSchema.index({ companyId: 1, status: 1 });
auditLogSchema.index({ companyId: 1, createdAt: -1 });
