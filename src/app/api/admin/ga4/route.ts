import { requireAdmin } from "@/lib/api-auth";
import { NextResponse } from "next/server";
import { normalizarChavePkcs8 } from "@/lib/ga4-chave";

async function getAccessToken(): Promise<string> {
  const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const key = normalizarChavePkcs8(process.env.GA4_SERVICE_ACCOUNT_KEY);

  if (!email || !key) {
    throw new Error("GA4 credentials not configured");
  }

  // Create JWT for service account
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: email,
    scope: "https://www.googleapis.com/auth/analytics.readonly",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  // Minimal JWT sign using Web Crypto
  const encoder = new TextEncoder();
  const b64 = (s: string) => Buffer.from(s).toString("base64url");
  const sigInput = b64(JSON.stringify(header)) + "." + b64(JSON.stringify(claim));

  try {
    // Dynamic import for jose (smaller than full crypto)
    const { SignJWT, importPKCS8 } = await import("jose");
    const pk = await importPKCS8(key, "RS256");
    const jwt = await new SignJWT(claim)
      .setProtectedHeader({ alg: "RS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .setIssuer(email)
      .setAudience("https://oauth2.googleapis.com/token")
      .sign(pk);

    // Exchange JWT for access token
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    });

    const tokenData = await tokenRes.json();
    return tokenData.access_token;
  } catch (err) {
    throw new Error(`Auth failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

type Ga4Row = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};

async function runReport(propertyId: string, body: Record<string, unknown>, token: string) {
  const res = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`GA4 API error (${res.status}): ${err}`);
  }
  return res.json();
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId || propertyId === "PLACEHOLDER") {
      return NextResponse.json({
        error: "GA4_PROPERTY_ID not configured",
        hint: "Vá em analytics.google.com → Administrador → Configurações da propriedade → ID da propriedade",
      }, { status: 400 });
    }

    const token = await getAccessToken();

    const parseMetric = (row: Ga4Row | undefined, index: number) =>
      Number(row?.metricValues?.[index]?.value ?? 0);

    const [overview, topPages, sources, devices, daily] = await Promise.all([
      runReport(propertyId, {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        metrics: [
          { name: "activeUsers" },
          { name: "screenPageViews" },
          { name: "sessions" },
          { name: "averageSessionDuration" },
        ],
      }, token),
      runReport(propertyId, {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }, token),
      runReport(propertyId, {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "sessionSource" }],
        metrics: [{ name: "sessions" }],
        orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
        limit: 6,
      }, token),
      runReport(propertyId, {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
      }, token),
      runReport(propertyId, {
        dateRanges: [{ startDate: "29daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
        // Sem `orderBys` o GA4 devolve as linhas em ordem indefinida — o
        // gráfico saía em ziguezague (17, 09, 29, 18...). Ordenar aqui é a
        // única forma de garantir a leitura da esquerda para a direita.
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }, token),
    ]);

    const dailyRows: { date: string; users: number; pageViews: number }[] = (daily.rows || [])
      .map((r: Ga4Row) => ({
        date: r.dimensionValues?.[0]?.value || "",
        users: parseMetric(r, 0),
        pageViews: parseMetric(r, 1),
      }))
      // segunda camada: mesmo que a API ignore o orderBys, o eixo sai em ordem
      .sort((a: { date: string }, b: { date: string }) => a.date.localeCompare(b.date));

    return NextResponse.json({
      overview: {
        activeUsers: parseMetric(overview.rows?.[0], 0),
        pageViews: parseMetric(overview.rows?.[0], 1),
        sessions: parseMetric(overview.rows?.[0], 2),
        avgSessionDuration: parseMetric(overview.rows?.[0], 3),
      },
      topPages: (topPages.rows || []).map((r: Ga4Row) => ({
        path: r.dimensionValues?.[0]?.value || "/",
        views: parseMetric(r, 0),
      })),
      sources: (sources.rows || []).map((r: Ga4Row) => ({
        source: r.dimensionValues?.[0]?.value || "unknown",
        sessions: parseMetric(r, 0),
      })),
      devices: (devices.rows || []).map((r: Ga4Row) => ({
        category: r.dimensionValues?.[0]?.value || "unknown",
        users: parseMetric(r, 0),
      })),
      daily: dailyRows,
    });
  } catch (error) {
    // Detalhe só no log: a mensagem crua do Google devolve nome de variável
    // de ambiente e resposta interna para quem chamar a rota.
    console.error("[admin/ga4] falha:", error);

    const mensagem = error instanceof Error ? error.message : "";

    // Chave do service account é problema de configuração, não instabilidade:
    // dizer "tente de novo" mandava o dono repetir o que nunca ia funcionar.
    if (mensagem.includes("GA4_KEY_FORMATO") || mensagem.includes("credentials not configured")) {
      return NextResponse.json(
        {
          error: "Analytics não configurado.",
          hint: "A chave do service account precisa estar em PKCS#8 (-----BEGIN PRIVATE KEY-----). Copie o campo private_key do JSON baixado no Google Cloud.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Não foi possível carregar o Analytics agora.", hint: "Tente de novo em alguns minutos." },
      { status: 502 }
    );
  }
}
