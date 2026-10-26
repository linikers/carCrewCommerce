import { paginaDoModulo } from "@/modules/guard";
import AdminLayout from "@/components/admin/AdminLayout";
import FreteAdmin from "@/modules/frete/ui/FreteAdmin";

// o estado do módulo muda sem deploy: nada de cachear esta página
export const dynamic = "force-dynamic";

/**
 * O guard roda no metadata porque é o único ponto que resolve antes de a
 * resposta começar a ser enviada. Chamado só no corpo da página, o `notFound()`
 * acontecia depois do 200 já commitado pelo streaming — o visitante via a tela
 * de "não encontrada", mas o status HTTP era 200.
 */
export async function generateMetadata() {
  await paginaDoModulo("frete");
  return { title: "Frete" };
}

/**
 * Casca da tela: o guard roda no servidor (módulo desligado = 404) e a UI do
 * módulo fica em `src/modules/frete/ui`.
 */
export default async function FretePage() {
  await paginaDoModulo("frete");
  return (
    <AdminLayout title="Frete">
      <FreteAdmin />
    </AdminLayout>
  );
}
