/** Everything the PDF shows; the exporter never loads data itself (D14). */
export interface InvoicePdfData {
  companyName: string;
  customer: { name: string; email?: string; address?: string };
  invoice: {
    number: string;
    status: string;
    issueDate: string;
    dueDate: string;
    lines: { description: string; quantity: number; unitPriceMillimes: number; lineTotalMillimes: number }[];
    totalMillimes: number;
    remainingMillimes: number;
  };
  payments: { paymentDate: string; method: string; amountMillimes: number }[];
}

export interface PdfExporter {
  exportInvoice(data: InvoicePdfData): Promise<Uint8Array>;
}
