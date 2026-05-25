import { NextRequest, NextResponse } from "next/server";
import { lerBanners, salvarBanners } from "@/lib/banners-admin";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const banners = lerBanners();
    const index = banners.findIndex((b) => b.id === Number(id));
    if (index === -1) return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });

    banners[index] = { ...banners[index], ...body };
    salvarBanners(banners);
    return NextResponse.json(banners[index]);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const banners = lerBanners();
  const index = banners.findIndex((b) => b.id === Number(id));
  if (index === -1) return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });

  banners.splice(index, 1);
  salvarBanners(banners);
  return NextResponse.json({ message: "Banner excluído" });
}
