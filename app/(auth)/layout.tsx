/**
 * Auth layout for the authentication module.
 * It isolates the login experience in a dedicated shell and keeps the rest of the application
 * visually and structurally separated from the auth flow.
 */
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-text">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_18px_45px_rgba(15,23,42,0.10)] lg:grid-cols-[1.2fr_0.8fr]">
          <section className="hidden bg-primary/5 p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">
                FlexiCRM
              </p>
              <h1 className="mt-6 max-w-sm text-3xl font-semibold leading-tight text-text">
                Gérer vos conversations clients sans friction.
              </h1>
            </div>

            <div className="max-w-sm space-y-3 text-sm text-muted">
              <p>Une vue d’ensemble claire pour votre activité commerciale.</p>
              <p>Une plateforme pensée pour la productivité, les équipes et la confiance client.</p>
            </div>
          </section>

          <section className="w-full bg-surface p-6 sm:p-8 lg:p-10">{children}</section>
        </div>
      </div>
    </main>
  );
}
