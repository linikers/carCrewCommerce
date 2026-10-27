import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import ModuloEmBreve from "@/modules/_nucleo/ui/ModuloEmBreve";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("relatorios");
  return { title: "relatorios" };
}

export default async function Page() {
  await paginaDoModulo("relatorios");
  return (
    <AdminLayout title="relatorios">
      <div style={{ padding: "24px" }}>
        <ModuloEmBreve id="relatorios" />
      </div>
    </AdminLayout>
  );
}
