import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import ModuloEmBreve from "@/modules/_nucleo/ui/ModuloEmBreve";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("compras");
  return { title: "compras" };
}

export default async function Page() {
  await paginaDoModulo("compras");
  return (
    <AdminLayout title="compras">
      <div style={{ padding: "24px" }}>
        <ModuloEmBreve id="compras" />
      </div>
    </AdminLayout>
  );
}
