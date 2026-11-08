export interface PdfExporter {
  exportInvoice(input: { invoiceId: string }): Promise<Uint8Array>;
}
