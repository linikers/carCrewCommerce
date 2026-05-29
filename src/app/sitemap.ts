import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrewcommerce.vercel.app";

  // Rotas estáticas
  const staticRoutes = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${siteUrl}/checkout`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${siteUrl}/login`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${siteUrl}/register`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${siteUrl}/conta`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.1 },
  ];

  // Rotas de produtos (dinâmicas)
  let productRoutes: MetadataRoute.Sitemap = [];
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/produtos`);
    if (res.ok) {
      const produtos = await res.json();
      productRoutes = produtos.map((p: any) => ({
        url: `${siteUrl}/produto/${p.id}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    }
  } catch {
    // API não disponível durante build — usa rotas estáticas apenas
  }

  return [...staticRoutes, ...productRoutes];
}
