"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type FormState } from "@/server/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(registerAction, {});

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <form action={action} className="card w-full max-w-sm p-6">
        <h1 className="pixel text-2xl text-white">Регистрация</h1>
        <p className="mt-1 mb-5 text-sm text-[var(--muted)]">Создай героя своей жизни.</p>

        <label className="label" htmlFor="name">Имя (необязательно)</label>
        <input id="name" name="name" type="text" autoComplete="name" className="input mb-4" />

        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input mb-4" />

        <label className="label" htmlFor="password">Пароль</label>
        <input id="password" name="password" type="password" required autoComplete="new-password" minLength={8} className="input mb-1" />
        <p className="mb-4 text-xs text-[var(--muted)]">Минимум 8 символов.</p>

        {state?.error && <p className="mb-3 text-sm text-[var(--danger)]">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Создаём..." : "Создать аккаунт"}
        </button>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-[var(--accent)] hover:underline">
            Войти
          </Link>
        </p>
      </form>
    </main>
  );
}
