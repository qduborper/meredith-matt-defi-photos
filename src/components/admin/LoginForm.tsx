"use client";

import { useActionState, useId } from "react";

import { login } from "@/app/admin/actions";

export function LoginForm() {
  const passwordId = useId();
  const errorId = useId();
  const [error, formAction, pending] = useActionState(login, null);

  return (
    <form action={formAction} className="mt-7">
      <label htmlFor={passwordId} className="ml-1 text-[12.5px] font-bold text-sapin">
        Mot de passe
      </label>
      <input
        id={passwordId}
        name="password"
        type="password"
        required
        autoComplete="current-password"
        aria-describedby={error ? errorId : undefined}
        aria-invalid={error ? true : undefined}
        className="mt-1.5 w-full rounded-field border-[1.5px] border-eau bg-surface px-4 py-3 text-[15px] text-ink"
      />

      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-3 rounded-xl bg-danger/10 px-3 py-2 text-[12.5px] font-semibold text-danger"
        >
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-panel bg-sapin px-4 py-3.5 text-[15px] font-bold text-creme disabled:opacity-45"
      >
        {pending ? "Vérification…" : "Entrer"}
      </button>
    </form>
  );
}
