// app/api/email/[id]/route.ts
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { EmailStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { sentStatus } = await req.json();

  if (!Object.values(EmailStatus).includes(sentStatus)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const updated = await db.outreachEmail.update({
    where: { id: params.id },
    data: {
      sentStatus,
      sentAt: sentStatus === "SENT" ? new Date() : undefined,
    },
  });

  return NextResponse.json({ email: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await db.outreachEmail.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
