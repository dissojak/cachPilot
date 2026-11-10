import { NextResponse } from "next/server";
import { DomainError } from "@cashpilot/application";
import { useCases } from "@/container";
import { getActor } from "@/lib/session";

/** Transport only (course s.15): session → use case → PDF bytes. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getActor();
  if (!actor?.companyId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
  const { id } = await params;
  try {
    const result = await useCases.exportInvoicePdf.execute({ userId: actor.userId, companyId: actor.companyId, invoiceId: id });
    return new NextResponse(Buffer.from(result.pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${result.fileName}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof DomainError) {
      return NextResponse.json({ error: error.code }, { status: error.code === "ACCESS_DENIED" ? 403 : 404 });
    }
    throw error;
  }
}
