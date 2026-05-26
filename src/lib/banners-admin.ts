// Admin CRUD — Banners via Prisma

import prisma from "@/lib/prisma";

export interface BannerData {
  id: number;
  titulo: string;
  subtitulo: string;
  imgDesktop: string;
  imgMobile: string;
  link: string;
  corFundo: string;
  corTexto: string;
  ativo: boolean;
  ordem: number;
}

export async function lerBanners(): Promise<BannerData[]> {
  const banners = await prisma.banner.findMany({
    orderBy: { ordem: "asc" },
  });

  return banners.map((b) => ({
    id: b.id,
    titulo: b.titulo,
    subtitulo: b.subtitulo || "",
    imgDesktop: b.imgDesktop || "",
    imgMobile: b.imgMobile || "",
    link: b.link || "",
    corFundo: b.corFundo || "#1A1A1A",
    corTexto: b.corTexto || "#ffffff",
    ativo: b.ativo,
    ordem: b.ordem,
  }));
}

export async function salvarBanners(banners: BannerData[]) {
  for (const b of banners) {
    await prisma.banner.upsert({
      where: { id: b.id },
      update: {
        titulo: b.titulo,
        subtitulo: b.subtitulo || null,
        imgDesktop: b.imgDesktop || null,
        imgMobile: b.imgMobile || null,
        link: b.link || null,
        corFundo: b.corFundo || "#1A1A1A",
        corTexto: b.corTexto || "#ffffff",
        ativo: b.ativo,
        ordem: b.ordem,
      },
      create: {
        id: b.id,
        titulo: b.titulo,
        subtitulo: b.subtitulo || null,
        imgDesktop: b.imgDesktop || null,
        imgMobile: b.imgMobile || null,
        link: b.link || null,
        corFundo: b.corFundo || "#1A1A1A",
        corTexto: b.corTexto || "#ffffff",
        ativo: b.ativo,
        ordem: b.ordem,
      },
    });
  }
}

export async function proximoId(): Promise<number> {
  const ultimo = await prisma.banner.findFirst({
    orderBy: { id: "desc" },
    select: { id: true },
  });
  return (ultimo?.id || 0) + 1;
}
