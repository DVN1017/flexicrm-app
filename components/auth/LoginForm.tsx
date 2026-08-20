/**
 * LoginForm is the presentation component used by the auth module in Sprint 1.
 * It contains only the visual fields required by the login screen and intentionally has no
 * submit logic, API calls, or business rules.
 */
export function LoginForm() {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary">Connexion</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-text">Accédez à votre espace</h2>
      </div>

      <form className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-text">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="nom@entreprise.com"
            autoComplete="email"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-text">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-base text-text placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          Se connecter
        </button>
      </form>
    </div>
  );
}
