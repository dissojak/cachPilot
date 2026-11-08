import { createRequire } from "node:module";
import fs from "node:fs";
const req = createRequire(new URL("../package.json", import.meta.url));
const mongoose = req("mongoose");
const env = fs.readFileSync(new URL("../../../.env", import.meta.url), "utf8");
const uri = env.split("\n").find((l) => l.startsWith("DATABASE_URL=")).split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "");
await mongoose.connect(uri);
const collections = ["companies", "users", "memberships", "parties", "invoices", "payments", "expenses", "cashmovements", "scenarios", "retainers", "auditlogs"];
for (const col of collections) {
  const count = await mongoose.connection.db.collection(col).countDocuments({});
  console.log(col, count);
}
const company = await mongoose.connection.db.collection("companies").findOne({});
console.log("company sample:", company ? { name: company.name, id: String(company._id) } : "none");
const invoice = await mongoose.connection.db.collection("invoices").findOne({});
console.log("invoice sample:", invoice ? { number: invoice.number, status: invoice.status } : "none");
const user = await mongoose.connection.db.collection("users").findOne({ email: "dissojak@gmail.com" });
console.log("real user persisted:", user ? String(user._id) : "none");
await mongoose.disconnect();
