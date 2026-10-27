import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import ListaOS from "@/modules/os/ui/ListaOS";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("os");
  return { title: "Ordens de serviço" };
}

export default async function OSPage() {
  await paginaDoModulo("os");
  return (
    <AdminLayout title="Ordens de serviço">
      <div style={{ padding: "24px" }}>
        <ListaOS />
      </div>
    </AdminLayout>
  );
}
