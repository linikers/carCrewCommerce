import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

  // Rotas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${siteUrl}/checkout`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/sobre`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${siteUrl}/trocas`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${siteUrl}/privacidade`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  // Produtos do banco
  const productRoutes: MetadataRoute.Sitemap = [];
  try {
    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      select: { id: true },
    });
    for (const p of produtos) {
      productRoutes.push({
        url: `${siteUrl}/produto/${p.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      });
    }
  } catch {
    // Fallback silencioso
  }

  return [...staticRoutes, ...productRoutes];
}
