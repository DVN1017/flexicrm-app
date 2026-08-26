import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { listClients } from "@/services/client.service";
import { getPipelineStages, listDossiers, listPipelines } from "@/services/dossier.service";
import { DossierCreateForm } from "@/components/dossiers/DossierCreateForm";

export default async function DossiersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) redirect(AUTH_ROUTES.CREATE_COMPANY);

  const [clients, pipelines, dossiers] = await Promise.all([
    listClients(supabase, access.companyId),
    listPipelines(supabase, access.companyId),
    listDossiers(supabase, access.companyId),
  ]);
  const stages = await Promise.all(pipelines.map(async (pipeline) => [pipeline.id, await getPipelineStages(supabase, access.companyId, pipeline.id)] as const));
  const stagesByPipeline = Object.fromEntries(stages.map(([pipelineId, items]) => [pipelineId, items.map((item) => ({ id: item.id, name: item.name }))]));

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-6xl">
        <Link href={AUTH_ROUTES.DASHBOARD} className="text-sm text-primary hover:underline">← Tableau de bord</Link>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div><h1 className="text-3xl font-semibold tracking-tight">Dossiers</h1><p className="mt-1 text-sm text-muted">Suivez les demandes clients dans vos processus.</p></div>
          <Link href="/dashboard/pipelines" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface">Gérer les pipelines</Link>
        </div>

        <div className="mt-6 space-y-6">
          {clients.length > 0 && pipelines.length > 0 && Object.values(stagesByPipeline).some((items) => items.length > 0) ? (
            <DossierCreateForm clients={clients.map((client) => ({ id: client.id, name: client.name }))} pipelines={pipelines.map((pipeline) => ({ id: pipeline.id, name: pipeline.name }))} stagesByPipeline={stagesByPipeline} />
          ) : (
            <div className="rounded-xl border border-border bg-surface p-5 text-sm text-muted">Pour créer un dossier, il faut au moins un client, un pipeline et une étape.</div>
          )}

          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-soft">
            {dossiers.length === 0 ? <p className="p-8 text-center text-sm text-muted">Aucun dossier.</p> : (
              <div className="divide-y divide-border">
                {dossiers.map((dossier) => (
                  <Link key={dossier.id} href={`/dashboard/dossiers/${dossier.id}`} className="block p-5 hover:bg-background">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div><p className="font-semibold">{dossier.title}</p><p className="mt-1 text-sm text-muted">{dossier.client?.name ?? "Client"} · {dossier.stage?.name ?? "Étape"}</p></div>
                      <div className="text-right text-xs text-muted"><p>{dossier.status}</p><p className="mt-1">Priorité : {dossier.priority}</p></div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
