import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import PrecosAdmin from "@/modules/precos/ui/PrecosAdmin";

export const dynamic = "force-dynamic";

export const metadata = { title: "Preços" };

export default async function Page() {
  await paginaDoModulo("catalogo");
  return (
    <AdminLayout title="Preços">
      <div style={{ padding: "24px" }}>
        <PrecosAdmin />
      </div>
    </AdminLayout>
  );
}
