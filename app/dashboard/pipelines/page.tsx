import Link from "next/link";
import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getCurrentUserCompanyAccess } from "@/services/company.service";
import { getPipelineStages, listPipelines } from "@/services/dossier.service";
import { PipelineManager } from "@/components/dossiers/PipelineManager";

export default async function PipelinesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(AUTH_ROUTES.LOGIN);

  const access = await getCurrentUserCompanyAccess(supabase, user.id);
  if (!access) redirect(AUTH_ROUTES.CREATE_COMPANY);

  const pipelines = await listPipelines(supabase, access.companyId);
  const enriched = await Promise.all(pipelines.map(async (pipeline) => ({
    ...pipeline,
    stages: await getPipelineStages(supabase, access.companyId, pipeline.id),
  })));

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-text sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-5xl">
        <Link href={AUTH_ROUTES.DASHBOARD} className="text-sm text-primary hover:underline">← Tableau de bord</Link>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Pipelines</h1>
        <p className="mt-1 text-sm text-muted">Configurez les étapes de travail propres à votre entreprise.</p>
        <div className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <PipelineManager initialPipelines={enriched} canManage={access.role !== "member"} />
        </div>
      </section>
    </main>
  );
}
