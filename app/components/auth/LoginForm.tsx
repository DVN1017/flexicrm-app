"use client";

export function LoginForm() {
  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>

        <input
          id="email"
          type="email"
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Mot de passe
        </label>

        <input
          id="password"
          type="password"
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        className="w-full rounded bg-black py-2 text-white"
      >
        Se connecter
      </button>
    </form>
  );
}