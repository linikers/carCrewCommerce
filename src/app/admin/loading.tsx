"use client";

import { Box, Container, Skeleton, Paper, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

/**
 * Esqueleto enquanto a rota do admin carrega.
 *
 * Sem `loading.tsx`, cada navegação entre telas do admin piscava branco até o
 * bundle do client montar.
 */
export default function AdminLoading() {
  return (
    <Container maxWidth="lg" sx={{ py: 4, mt: { xs: 6, md: 0 } }}>
      <Box sx={{ mb: 3 }}>
        <Skeleton variant="text" width={220} height={48} />
        <Skeleton variant="text" width={280} height={24} />
      </Box>

      <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} />

      <Paper sx={{ p: 2, borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableCell key={i}>
                  <Skeleton variant="text" width="70%" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {[1, 2, 3, 4, 5, 6].map((linha) => (
              <TableRow key={linha}>
                {[1, 2, 3, 4, 5].map((col) => (
                  <TableCell key={col}>
                    <Skeleton variant="text" width={col === 1 ? "40%" : "85%"} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
