import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import EconomiaAdmin from "@/modules/relatorios/ui/EconomiaAdmin";

// estado do módulo muda sem deploy: nada de cachear esta página
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("relatorios");
  return { title: "Custos e mídia" };
}

/**
 * Custos e mídia (#191): comissão por plataforma, imposto, embalagem e a
 * simulação do resultado de uma venda.
 *
 * Fica sob o módulo `relatorios` — e não em `/admin/marketplace` — porque o
 * módulo de marketplace pode estar desligado, e o cliente precisa cadastrar a
 * comissão que ele paga hoje de qualquer jeito.
 */
export default async function EconomiaPage() {
  await paginaDoModulo("relatorios");
  return (
    <AdminLayout title="Custos e mídia">
      <EconomiaAdmin />
    </AdminLayout>
  );
}
