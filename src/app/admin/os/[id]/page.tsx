import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import OSDetalhe from "@/modules/os/ui/OSDetalhe";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("os");
  return { title: "Ordem de serviço" };
}

export default async function OSDetalhePage(props: { params: Promise<{ id: string }> }) {
  await paginaDoModulo("os");
  const { id } = await props.params;

  return (
    <AdminLayout title="Ordem de serviço">
      <div style={{ padding: "24px" }}>
        <OSDetalhe id={id} />
      </div>
    </AdminLayout>
  );
}
