import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import EmpresaAdmin from "@/modules/empresa/ui/EmpresaAdmin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Minha empresa" };

export default async function Page() {
  await paginaDoModulo("pedidos");
  return (
    <AdminLayout title="Minha empresa">
      <div style={{ padding: "24px" }}>
        <EmpresaAdmin />
      </div>
    </AdminLayout>
  );
}
