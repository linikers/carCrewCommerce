import { NextResponse } from "next/server";

async function getAccessToken(): Promise<string> {
  const email = process.env.GA4_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GA4_SERVICE_ACCOUNT_KEY?.replace(/\\n/g, "\n");

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

  // Parse PEM and sign
  const pemBody = key
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\n/g, "")
    .replace(/\s/g, "");

  const binaryKey = Buffer.from(pemBody, "base64");

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
  } catch (err: any) {
    throw new Error(`Auth failed: ${err.message}`);
  }
}

async function runReport(propertyId: string, body: any, token: string) {
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
  try {
    const propertyId = process.env.GA4_PROPERTY_ID;
    if (!propertyId || propertyId === "PLACEHOLDER") {
      return NextResponse.json({
        error: "GA4_PROPERTY_ID not configured",
        hint: "Vá em analytics.google.com → Administrador → Configurações da propriedade → ID da propriedade",
      }, { status: 400 });
    }

    const token = await getAccessToken();

    const parseMetric = (row: any, index: number) =>
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
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "date" }],
        metrics: [{ name: "activeUsers" }, { name: "screenPageViews" }],
      }, token),
    ]);

    return NextResponse.json({
      overview: {
        activeUsers: parseMetric(overview.rows?.[0], 0),
        pageViews: parseMetric(overview.rows?.[0], 1),
        sessions: parseMetric(overview.rows?.[0], 2),
        avgSessionDuration: parseMetric(overview.rows?.[0], 3),
      },
      topPages: (topPages.rows || []).map((r: any) => ({
        path: r.dimensionValues?.[0]?.value || "/",
        views: parseMetric(r, 0),
      })),
      sources: (sources.rows || []).map((r: any) => ({
        source: r.dimensionValues?.[0]?.value || "unknown",
        sessions: parseMetric(r, 0),
      })),
      devices: (devices.rows || []).map((r: any) => ({
        category: r.dimensionValues?.[0]?.value || "unknown",
        users: parseMetric(r, 0),
      })),
      daily: (daily.rows || []).map((r: any) => ({
        date: r.dimensionValues?.[0]?.value || "",
        users: parseMetric(r, 0),
        pageViews: parseMetric(r, 1),
      })),
    });
  } catch (error: any) {
    console.error("GA4 API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
