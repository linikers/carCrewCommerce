import { Box, Divider, Paper, Typography } from "@mui/material";
import { calcularPreco } from "@/lib/preco";
import { formatBRL } from "@/lib/format";
import type { Produto } from "@/types";

/**
 * Grade de cards de produto usada na categoria e na busca.
 *
 * O card existia só dentro da página de categoria; a busca repetiria 70 linhas
 * de markup. A caixa 4:3 com imagem `absolute` é o que segura foto vertical de
 * anúncio (sem isso o card esticava até 1226 px — #175).
 */
export default function ProdutoGrade({ produtos }: { produtos: Produto[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2.5,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0,1fr))",
          md: "repeat(3, minmax(0,1fr))",
        },
      }}
    >
      {produtos.map((p) => {
        const semPreco = !p.preco || p.preco <= 0;
        const precoCat = calcularPreco(p.preco, p.descontoPercent);
        return (
          <Paper
            key={p.id}
            component="a"
            href={`/produto/${p.id}`}
            sx={{
              display: "flex",
              flexDirection: "column",
              textDecoration: "none",
              color: "inherit",
              borderRadius: 3,
              overflow: "hidden",
              border: "1px solid #eee",
              transition: "box-shadow .15s ease, border-color .15s ease",
              "&:hover": { borderColor: "primary.main", boxShadow: "0 6px 18px rgba(0,0,0,0.06)" },
            }}
          >
            <Box sx={{ position: "relative", aspectRatio: "4 / 3", backgroundColor: "#f7f7f7", overflow: "hidden" }}>
              <Box
                component="img"
                src={p.imgUrl || "/produtos/placeholder.svg"}
                alt={p.nome}
                loading="lazy"
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  p: 2,
                }}
              />
            </Box>
            <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 0.5, flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600, color: "#1A1A1A", lineHeight: 1.35 }}>
                {p.nome}
              </Typography>
              <Box sx={{ mt: "auto", pt: 1 }}>
                <Divider sx={{ mb: 1 }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: semPreco ? "#8a8a8a" : "#1A1A1A" }}>
                  {semPreco ? (
                    "Sob consulta"
                  ) : precoCat.temDesconto ? (
                    <Box component="span">
                      <Box component="span" sx={{ color: "#9a9a9a", textDecoration: "line-through", fontSize: "0.8rem", mr: 0.75 }}>
                        {formatBRL(precoCat.de)}
                      </Box>
                      {formatBRL(precoCat.por)}
                      <Box component="span" sx={{ backgroundColor: "#0E7A3F", color: "#fff", fontSize: "0.6rem", fontWeight: 700, px: 0.6, py: 0.2, borderRadius: 1, ml: 0.75 }}>
                        -{precoCat.percentual}%
                      </Box>
                    </Box>
                  ) : (
                    formatBRL(precoCat.por)
                  )}
                </Typography>
              </Box>
            </Box>
          </Paper>
        );
      })}
    </Box>
  );
}
