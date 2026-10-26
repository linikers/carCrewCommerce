import { requireAdmin } from "@/lib/api-auth";
import { redirect } from "next/navigation";
import { Box, Typography } from "@mui/material";
import AdminLayout from "@/components/admin/AdminLayout";
import ModulosClient from "@/modules/_nucleo/ui/ModulosClient";

export const metadata = { title: "Módulos" };

export default async function ModulosPage() {
  const denied = await requireAdmin();
  if (denied) redirect("/admin/login");

  return (
    <AdminLayout title="Módulos">
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
          Módulos do sistema
        </Typography>
        <Typography sx={{ color: "#666", fontSize: "0.875rem", mb: 3, maxWidth: 640 }}>
          Cada bloco do sistema pode ficar desligado sem apagar nada. Ligue o que a loja usa
          hoje e vá liberando o resto quando fizer sentido.
        </Typography>
        <ModulosClient />
      </Box>
    </AdminLayout>
  );
}
