// Helpers de Schema.org (JSON-LD) para landing pages de categoria
//
// O `provider` sai do cadastro em "Minha empresa" — antes o endereço e o
// telefone estavam escritos aqui e divergiam do que a loja mostrava no resto
// do site.

import { CONTATO_PADRAO, type ContatoEmpresa } from "@/lib/empresa-contato";

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
  /** Dados da empresa; sem eles usa o padrão do código. */
  empresa?: ContatoEmpresa;
}) {
  const empresa = opts.empresa ?? CONTATO_PADRAO;

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    serviceType: opts.serviceType,
    url: opts.url,
    provider: {
      "@type": "LocalBusiness",
      name: empresa.nome,
      address: {
        "@type": "PostalAddress",
        streetAddress: empresa.endereco ?? undefined,
        addressLocality: empresa.cidade,
        addressRegion: empresa.uf,
        postalCode: empresa.cep ?? undefined,
        addressCountry: "BR",
      },
      telephone: empresa.telefoneFormatado,
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
