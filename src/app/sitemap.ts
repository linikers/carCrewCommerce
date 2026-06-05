import type { MetadataRoute } from "next";
import { readFileSync, existsSync } from "fs";
import path from "path";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

  // Rotas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${siteUrl}/checkout`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${siteUrl}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${siteUrl}/conta`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.1 },
  ];

  // Produtos lidos diretamente do JSON — sem depender de API HTTP (que falha no build)
  const productRoutes: MetadataRoute.Sitemap = [];
  try {
    const filePath = path.join(process.cwd(), "src/data/produtos.json");
    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, "utf-8");
      const produtos = JSON.parse(raw);
      for (const p of produtos) {
        if (p.ativo !== false) {
          productRoutes.push({
            url: `${siteUrl}/produto/${p.id}`,
            lastModified: new Date(),
            changeFrequency: "weekly" as const,
            priority: 0.8,
          });
        }
      }
    }
  } catch {
    // Fallback silencioso — retorna só rotas estáticas
  }

  return [...staticRoutes, ...productRoutes];
}
