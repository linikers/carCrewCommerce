import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET /api/admin/banners/[id] — um banner
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const banner = await prisma.banner.findUnique({
    where: { id: Number(id) },
  });

  if (!banner) {
    return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });
  }

  return NextResponse.json(banner);
}

// PUT /api/admin/banners/[id] — atualizar
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existente = await prisma.banner.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });
    }

    const atualizado = await prisma.banner.update({
      where: { id: Number(id) },
      data: {
        titulo: body.titulo ?? existente.titulo,
        subtitulo: body.subtitulo ?? existente.subtitulo,
        imgDesktop: body.imgDesktop ?? existente.imgDesktop,
        imgMobile: body.imgMobile ?? existente.imgMobile,
        link: body.link ?? existente.link,
        corFundo: body.corFundo ?? existente.corFundo,
        corTexto: body.corTexto ?? existente.corTexto,
        ativo: body.ativo !== undefined ? body.ativo : existente.ativo,
        ordem: body.ordem ?? existente.ordem,
      },
    });

    return NextResponse.json(atualizado);
  } catch (error) {
    console.error("Erro ao atualizar banner:", error);
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

// DELETE /api/admin/banners/[id] — excluir
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existente = await prisma.banner.findUnique({
      where: { id: Number(id) },
    });

    if (!existente) {
      return NextResponse.json({ error: "Banner não encontrado" }, { status: 404 });
    }

    await prisma.banner.delete({ where: { id: Number(id) } });

    return NextResponse.json({ message: "Banner excluído" });
  } catch (error) {
    console.error("Erro ao excluir banner:", error);
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
