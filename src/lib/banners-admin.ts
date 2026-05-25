import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

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

const DATA_PATH = path.join(process.cwd(), "src/data/banners.json");

export function lerBanners(): BannerData[] {
  try {
    if (!existsSync(DATA_PATH)) return [];
    return JSON.parse(readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

export function salvarBanners(banners: BannerData[]) {
  writeFileSync(DATA_PATH, JSON.stringify(banners, null, 2));
}

export function proximoId(banners: BannerData[]): number {
  if (banners.length === 0) return 1;
  return Math.max(...banners.map((b) => b.id)) + 1;
}
