import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import ModuloEmBreve from "@/modules/_nucleo/ui/ModuloEmBreve";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("pedidos");
  return { title: "mensagens" };
}

export default async function Page() {
  await paginaDoModulo("pedidos");
  return (
    <AdminLayout title="mensagens">
      <div style={{ padding: "24px" }}>
        <ModuloEmBreve id="pedidos" />
      </div>
    </AdminLayout>
  );
}
