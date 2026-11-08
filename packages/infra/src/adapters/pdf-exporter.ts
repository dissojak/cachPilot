import { PdfExporter } from "@cashpilot/application";

export class InMemoryPdfExporter implements PdfExporter {
  async exportInvoice() { return new Uint8Array(); }
}
