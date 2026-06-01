const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "drvnlgib2";

export type ImgTransform = {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "scale" | "pad";
  quality?: number;
  format?: "auto" | "webp" | "jpg" | "png";
};

// Gera URL otimizada do Cloudinary
export function cloudinaryUrl(
  publicId: string,
  transforms?: ImgTransform
): string {
  const base = `https://res.cloudinary.com/${CLOUD_NAME}/image/upload`;

  if (!transforms) return `${base}/f_auto,q_auto/${publicId}`;

  const params: string[] = [];
  if (transforms.width) params.push(`w_${transforms.width}`);
  if (transforms.height) params.push(`h_${transforms.height}`);
  if (transforms.crop) params.push(`c_${transforms.crop}`);
  if (transforms.quality) params.push(`q_${transforms.quality}`);
  params.push(`f_${transforms.format || "auto"}`);
  params.push("q_auto");

  return `${base}/${params.join(",")}/${publicId}`;
}

// Extrai o public_id de uma URL do Cloudinary
export function extractPublicId(url: string): string {
  if (!url.includes("cloudinary")) return url;

  const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
  return match ? match[1] : url;
}

// Detecta se uma URL é do Cloudinary
export function isCloudinaryUrl(url: string): boolean {
  return url.includes("cloudinary.com");
}

// Gera URL de thumbnail (card do produto) — sem zoom, mantém proporção original
export function thumbUrl(publicId: string): string {
  return cloudinaryUrl(publicId, {
    width: 300,
    crop: "fit",
    format: "auto",
  });
}

// Gera URL da imagem grande (página de detalhe)
export function detailUrl(publicId: string): string {
  return cloudinaryUrl(publicId, {
    width: 600,
    height: 600,
    crop: "pad",
    format: "auto",
  });
}

// Gera URL mini (carrinho)
export function miniUrl(publicId: string): string {
  return cloudinaryUrl(publicId, {
    width: 80,
    height: 80,
    crop: "pad",
    format: "auto",
  });
}
