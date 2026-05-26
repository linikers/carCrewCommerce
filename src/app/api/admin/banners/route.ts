import { NextRequest, NextResponse } from "next/server";
import { lerBanners, salvarBanners, proximoId, BannerData } from "@/lib/banners-admin";

// GET /api/admin/banners — listar todos
export async function GET() {
  const banners = await lerBanners();
  return NextResponse.json(banners);
}

// POST /api/admin/banners — criar novo
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, subtitulo, imgDesktop, imgMobile, link, corFundo, corTexto, ativo, ordem } = body;

    if (!titulo) {
      return NextResponse.json(
        { error: "Título é obrigatório" },
        { status: 400 }
      );
    }

    const id = await proximoId();
    const novo: BannerData = {
      id,
      titulo,
      subtitulo: subtitulo || "",
      imgDesktop: imgDesktop || "",
      imgMobile: imgMobile || "",
      link: link || "",
      corFundo: corFundo || "#1A1A1A",
      corTexto: corTexto || "#ffffff",
      ativo: ativo !== undefined ? ativo : true,
      ordem: ordem ?? 0,
    };

    await salvarBanners([novo]);

    return NextResponse.json(novo, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar banner:", error);
    return NextResponse.json({ error: "Erro ao criar banner" }, { status: 500 });
  }
}
