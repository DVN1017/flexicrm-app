import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { getDossier, getPipelineStages, listDossierNotes } from "@/services/dossier.service";
import { DossierControls } from "@/components/dossiers/DossierControls";
import { DossierNotes } from "@/components/dossiers/DossierNotes";

export default async function DossierPage({ params }: { params: Promise<{ dossierId: string }> }) {
  const { dossierId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) redirect(AUTH_ROUTES.CREATE_COMPANY);

  let dossier;
  try {
    dossier = await getDossier(supabase, access.companyId, dossierId);
  } catch {
    notFound();
  }

  const [stages, notes] = await Promise.all([
    getPipelineStages(supabase, access.companyId, dossier.pipeline_id),
    listDossierNotes(supabase, access.companyId, dossierId),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl space-y-5">
        <Link href="/dashboard/dossiers" className="text-sm text-primary hover:underline">← Dossiers</Link>
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold">{dossier.title}</h1>
              <p className="mt-1 text-sm text-muted">{dossier.client?.name ?? "Client"} · {dossier.client?.phone ?? ""}</p>
            </div>
            {dossier.source_conversation_id ? <Link href={`/dashboard/conversations/${dossier.source_conversation_id}`} className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-background">Conversation source</Link> : null}
          </div>
          <div className="mt-6"><DossierControls dossierId={dossier.id} stageId={dossier.stage_id} priority={dossier.priority} status={dossier.status} stages={stages.map((stage) => ({ id: stage.id, name: stage.name }))} /></div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div><p className="text-xs text-muted">Créé le</p><p className="mt-1 text-sm">{new Date(dossier.created_at).toLocaleString("fr-FR")}</p></div>
            <div><p className="text-xs text-muted">Clôture</p><p className="mt-1 text-sm">{dossier.closed_at ? new Date(dossier.closed_at).toLocaleString("fr-FR") : "Non clôturé"}</p></div>
            <div className="sm:col-span-2"><p className="text-xs text-muted">Notes du dossier</p><p className="mt-1 whitespace-pre-wrap text-sm">{dossier.notes ?? "Aucune note"}</p></div>
          </div>
        </div>
        <DossierNotes dossierId={dossier.id} initialNotes={notes} />
      </section>
    </main>
  );
}
