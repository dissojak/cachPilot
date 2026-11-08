import { NextResponse } from "next/server";
import { useCases, demo } from "@/container";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await useCases.exportInvoicePdf.execute({
    userId: demo.ownerUserId,
    companyId: demo.companyId,
    invoiceId: id,
  });

  return new NextResponse(result.pdf as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
    },
  });
}
