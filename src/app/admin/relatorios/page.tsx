import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import RelatoriosAdmin from "@/modules/relatorios/ui/RelatoriosAdmin";

// módulo liga/desliga sem deploy e o número vem do banco: nada de cachear
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("relatorios");
  return { title: "Relatórios" };
}

/**
 * Relatórios — resultado do período (#191, PR-5).
 *
 * Saiu do `ModuloEmBreve`: era placeholder enquanto a conta não existia.
 */
export default async function RelatoriosPage() {
  await paginaDoModulo("relatorios");
  return (
    <AdminLayout title="Relatórios">
      <RelatoriosAdmin />
    </AdminLayout>
  );
}
