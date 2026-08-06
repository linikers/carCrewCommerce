// Helpers de Schema.org (JSON-LD) para landing pages de categoria

export interface SchemaProduto {
  id: number;
  nome: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function serviceSchema(opts: {
  name: string;
  serviceType: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    serviceType: opts.serviceType,
    url: opts.url,
    provider: {
      "@type": "LocalBusiness",
      name: "Car Crew Garage",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Av. Dona Sophia Rasgulaeff, 2825",
        addressLocality: "Maringá",
        addressRegion: "PR",
        postalCode: "87047-300",
        addressCountry: "BR",
      },
      telephone: "+55-44-99813-3182",
    },
    areaServed: { "@type": "Country", name: "Brasil" },
    description: opts.description,
  };
}

export function itemListSchema(produtos: SchemaProduto[], baseUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: produtos.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.nome,
      url: `${baseUrl}/produto/${p.id}`,
    })),
  };
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
