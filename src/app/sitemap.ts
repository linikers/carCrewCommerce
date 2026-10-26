import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { POSTS } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://carcrew.com.br";

  // Rotas estáticas
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 1.0 },
    { url: `${siteUrl}/sobre`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${siteUrl}/faq`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${siteUrl}/off-road`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.7 },
    { url: `${siteUrl}/suspensao-a-ar`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${siteUrl}/rebaixamento`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${siteUrl}/suspensao-esportiva`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.8 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly" as const, priority: 0.6 },
    { url: `${siteUrl}/trocas`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${siteUrl}/privacidade`, lastModified: new Date(), changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  // Blog (páginas estáticas de conteúdo)
  const posts: MetadataRoute.Sitemap = POSTS.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.atualizadoEm),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Categorias — antes eram query string na home e não existiam para o Google
  let categoriaRoutes: MetadataRoute.Sitemap = [];
  try {
    const categorias = await prisma.categoria.findMany({ select: { slug: true } });
    categoriaRoutes = categorias.map((c) => ({
      url: `${siteUrl}/categoria/${c.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    // Fallback silencioso
  }

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

  return [...staticRoutes, ...categoriaRoutes, ...posts, ...productRoutes];
}
