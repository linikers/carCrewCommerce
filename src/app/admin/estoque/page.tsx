import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import EstoqueAdmin from "@/modules/estoque/ui/EstoqueAdmin";

export const dynamic = "force-dynamic";

/** Guard no metadata: resolve antes do 200 do streaming (ver src/modules/guard.ts). */
export async function generateMetadata() {
  await paginaDoModulo("estoque");
  return { title: "Estoque" };
}

export default async function EstoquePage() {
  await paginaDoModulo("estoque");
  return (
    <AdminLayout title="Estoque">
      <div style={{ padding: "24px" }}>
        <EstoqueAdmin />
      </div>
    </AdminLayout>
  );
}
