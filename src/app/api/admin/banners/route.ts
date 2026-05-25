import { NextRequest, NextResponse } from "next/server";
import { lerBanners, salvarBanners, proximoId, BannerData } from "@/lib/banners-admin";

export async function GET() {
  return NextResponse.json(lerBanners());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { titulo, subtitulo, link, corFundo, corTexto, imgDesktop, imgMobile } = body;

    if (!titulo) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 });
    }

    const banners = lerBanners();
    const nova: BannerData = {
      id: proximoId(banners),
      titulo,
      subtitulo: subtitulo || "",
      imgDesktop: imgDesktop || `/banners/banner-default-desktop.svg`,
      imgMobile: imgMobile || `/banners/banner-default-mobile.svg`,
      link: link || "",
      corFundo: corFundo || "#1A1A1A",
      corTexto: corTexto || "#ffffff",
      ativo: true,
      ordem: banners.length + 1,
    };

    salvarBanners([...banners, nova]);
    return NextResponse.json(nova, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro ao criar banner" }, { status: 500 });
  }
}
