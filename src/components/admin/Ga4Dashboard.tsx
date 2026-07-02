"use client";

import { useState, useEffect } from "react";
import {
  Box, Typography, Paper, Grid, CircularProgress, Chip,
} from "@mui/material";
import { TrendingUp, Visibility, People, Schedule, Public, Devices, Smartphone, Computer, Tablet } from "@mui/icons-material";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Ga4Data {
  overview?: {
    activeUsers: number;
    pageViews: number;
    sessions: number;
    avgSessionDuration: number;
    bounceRate: number;
  };
  topPages?: { path: string; views: number }[];
  sources?: { source: string; sessions: number }[];
  devices?: { category: string; users: number }[];
  daily?: { date: string; users: number; pageViews: number }[];
  error?: string;
  hint?: string;
}

export default function Ga4Dashboard() {
  const [data, setData] = useState<Ga4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/ga4")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.hint || d.error);
        else setData(d);
        setLoading(false);
      })
      .catch(() => { setError("Erro ao carregar dados do Analytics"); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, mb: 4, textAlign: "center" }}>
        <CircularProgress size={24} sx={{ color: "#E65100", mb: 1 }} />
        <Typography variant="body2" color="#999">Carregando dados do Analytics...</Typography>
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>📊 Analytics </Typography>
        <Typography variant="body2" color="#999">{error}</Typography>
        <Typography variant="caption" color="#bbb" sx={{ mt: 1, display: "block" }}>
          Configure GA4_SERVICE_ACCOUNT_EMAIL, GA4_SERVICE_ACCOUNT_KEY e GA4_PROPERTY_ID no .env.local
        </Typography>
      </Paper>
    );
  }

  if (!data?.overview) return null;

  const { overview, topPages, sources, devices, daily } = data;

  const formatDuration = (secs: number) => {
    if (!secs) return "0s";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const deviceIcons: Record<string, React.ReactNode> = {
    desktop: <Computer fontSize="small" />,
    mobile: <Smartphone fontSize="small" />,
    tablet: <Tablet fontSize="small" />,
  };

  const dailyChart = (daily || []).map((d) => ({
    ...d,
    label: d.date?.slice(4, 6) + "/" + d.date?.slice(6, 8),
  }));

  return (
    <Paper sx={{ p: 3, borderRadius: 3, mb: 4 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>📊 Analytics (30 dias)</Typography>
        <Chip label="Google Analytics" size="small" sx={{ bgcolor: "#f0f0f0", fontSize: 11 }} />
      </Box>

      {/* Overview cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: "Visitantes", value: overview.activeUsers, icon: <People />, color: "#E65100" },
          { label: "Page Views", value: overview.pageViews, icon: <Visibility />, color: "#1565c0" },
          { label: "Sessões", value: overview.sessions, icon: <Schedule />, color: "#2e7d32" },
          { label: "Tempo Médio", value: formatDuration(overview.avgSessionDuration), icon: <TrendingUp />, color: "#6a1b9a" },
        ].map((card) => (
          <Grid size={{ xs: 6, md: 3 }} key={card.label}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, textAlign: "center" }}>
              <Box sx={{ color: card.color, mb: 0.5 }}>{card.icon}</Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{card.value}</Typography>
              <Typography variant="caption" color="#666">{card.label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Daily chart */}
      {dailyChart.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "#555" }}>
            Visitantes (7 dias)
          </Typography>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="label" stroke="#999" fontSize={12} />
              <YAxis stroke="#999" fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="users" name="Visitantes" stroke="#E65100" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Top pages */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "#555" }}>
            📄 Páginas mais acessadas
          </Typography>
          {(topPages || []).slice(0, 6).map((p, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #f5f5f5" }}>
              <Typography variant="body2" sx={{ color: "#333", maxWidth: 250, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {p.path || "/"}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1565c0" }}>{p.views}</Typography>
            </Box>
          ))}
        </Grid>

        {/* Traffic sources + devices */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: "#555" }}>
            🌐 Origem do tráfego
          </Typography>
          {(sources || []).slice(0, 5).map((s, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", py: 0.8, borderBottom: "1px solid #f5f5f5" }}>
              <Typography variant="body2" sx={{ color: "#333" }}>{s.source || "direct"}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#2e7d32" }}>{s.sessions}</Typography>
            </Box>
          ))}

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, mt: 2, color: "#555" }}>
            📱 Dispositivos
          </Typography>
          {(devices || []).map((d, i) => (
            <Box key={i} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", py: 0.8, borderBottom: "1px solid #f5f5f5" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Box sx={{ color: "#666" }}>{deviceIcons[d.category]}</Box>
                <Typography variant="body2" sx={{ color: "#333", textTransform: "capitalize" }}>{d.category}</Typography>
              </Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#6a1b9a" }}>{d.users}</Typography>
            </Box>
          ))}
        </Grid>
      </Grid>
    </Paper>
  );
}
