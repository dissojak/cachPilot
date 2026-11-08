import { NextResponse } from "next/server";
import { useCases } from "@/container";
import { requireActor } from "@/lib/auth-actor";
import { DomainError, DOMAIN_ERROR_CODES } from "@cashpilot/domain";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await requireActor();
  try {
    const { id } = await params;
    const result = await useCases.exportInvoicePdf.execute({
      userId: actor.userId,
      companyId: actor.companyId,
      invoiceId: id,
    });

    return new NextResponse(result.pdf as BodyInit, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (error) {
    if (error instanceof DomainError && error.code === DOMAIN_ERROR_CODES.ACCESS_DENIED) {
      return NextResponse.json({ error: error.code }, { status: 403 });
    }
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.code }, { status: 404 });
    }
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
