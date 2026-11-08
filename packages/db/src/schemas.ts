import {
  Schema,
  model,
  models,
  type Model,
  type InferSchemaType,
} from "mongoose";
const moneyField = { type: Number, required: true };

const companySchema = new Schema(
  {
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
    email: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    oauthProvider: { type: String, required: true, trim: true },
    oauthSubject: { type: String, required: true, trim: true },
  },
  { timestamps: true },
);

const membershipSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
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
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
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
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Party", required: true },
    number: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["draft", "validated", "partially_paid", "paid", "cancelled"],
      default: "draft",
    },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    lines: { type: [invoiceLineSchema], required: true, default: [] },
    totalMillimes: { ...moneyField, min: 1 },
    remainingMillimes: { ...moneyField, min: 0 },
    cancelledReason: { type: String, trim: true },
    cancelledAt: { type: Date },
    cancelledBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const paymentSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice", required: true },
    amountMillimes: { ...moneyField, min: 1 },
    paymentDate: { type: Date, required: true },
    method: { type: String, required: true, trim: true },
    note: { type: String, trim: true },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const expenseSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    amountMillimes: { ...moneyField, min: 1 },
    expenseDate: { type: Date, required: true },
    receiptFileId: { type: String, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["submitted", "approved", "refused", "paid"],
      default: "submitted",
    },
    approval: {
      approver: { type: Schema.Types.ObjectId, ref: "User" },
      decisionDate: { type: Date },
      reason: { type: String, trim: true },
    },
    payment: {
      paidBy: { type: Schema.Types.ObjectId, ref: "User" },
      paidDate: { type: Date },
      amountMillimes: { type: Number, min: 1 },
    },
  },
  { timestamps: true },
);

const cashMovementSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    type: {
      type: String,
      required: true,
      enum: ["opening", "invoice_payment", "expense_payment", "adjustment", "reversal"],
    },
    amountMillimes: { type: Number, required: true },
    movementDate: { type: Date, required: true },
    sourceType: { type: String, required: true, trim: true },
    sourceId: { type: Schema.Types.ObjectId, required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
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
    invoiceId: { type: Schema.Types.ObjectId, ref: "Invoice" },
    delayDays: { type: Number, min: 1 },
    amountMillimes: { type: Number, min: 1 },
    plannedDate: { type: Date },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    expectedDate: { type: Date },
  },
  { _id: false },
);

const scenarioSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    name: { type: String, required: true, trim: true },
    baseReferenceDate: { type: Date, required: true },
    hypotheses: { type: [hypothesisSchema], default: [] },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

const auditLogSchema = new Schema(
  {
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    actorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    entityType: { type: String, required: true, trim: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    action: { type: String, required: true, trim: true },
    before: { type: Schema.Types.Mixed },
    after: { type: Schema.Types.Mixed },
    reason: { type: String, trim: true },
  },
  { timestamps: true },
);

userSchema.index(
  { oauthProvider: 1, oauthSubject: 1 },
  { unique: true }
);

userSchema.index(
  { email: 1 },
  { unique: true }
);
export const CompanyModel = models.Company || model("Company", companySchema);

type UserRecord = InferSchemaType<typeof userSchema>;

export const UserModel: Model<UserRecord> =
  (models.User as Model<UserRecord> | undefined) ??
  model<UserRecord>("User", userSchema);
export const MembershipModel = models.Membership || model("Membership", membershipSchema);
export const PartyModel = models.Party || model("Party", partySchema);
export const InvoiceModel = models.Invoice || model("Invoice", invoiceSchema);
export const PaymentModel = models.Payment || model("Payment", paymentSchema);
export const ExpenseModel = models.Expense || model("Expense", expenseSchema);
export const CashMovementModel = models.CashMovement || model("CashMovement", cashMovementSchema);
export const ScenarioModel = models.Scenario || model("Scenario", scenarioSchema);
export const AuditLogModel = models.AuditLog || model("AuditLog", auditLogSchema);

companySchema.index({ name: 1 });
membershipSchema.index({ userId: 1, companyId: 1 }, { unique: true });
partySchema.index({ companyId: 1, type: 1, name: 1 });
invoiceSchema.index({ companyId: 1, number: 1 }, { unique: true });
invoiceSchema.index({ companyId: 1, status: 1, dueDate: 1 });
paymentSchema.index({ companyId: 1, invoiceId: 1 });
expenseSchema.index({ companyId: 1, status: 1, expenseDate: 1 });
cashMovementSchema.index({ companyId: 1, movementDate: 1 });
scenarioSchema.index({ companyId: 1, createdAt: -1 });
auditLogSchema.index({ companyId: 1, createdAt: -1 });
