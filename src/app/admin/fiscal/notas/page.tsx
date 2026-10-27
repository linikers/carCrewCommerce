import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import ModuloEmBreve from "@/modules/_nucleo/ui/ModuloEmBreve";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  await paginaDoModulo("fiscal");
  return { title: "Notas emitidas" };
}

export default async function Page() {
  await paginaDoModulo("fiscal");
  return (
    <AdminLayout title="Notas emitidas">
      <div style={{ padding: "24px" }}>
        <ModuloEmBreve id="fiscal" />
      </div>
    </AdminLayout>
  );
}
