"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction, type FormState } from "@/server/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(loginAction, {});

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <form action={action} className="card w-full max-w-sm p-6">
        <h1 className="pixel text-2xl text-white">Вход</h1>
        <p className="mt-1 mb-5 text-sm text-[var(--muted)]">С возвращением, игрок!</p>

        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input mb-4" />

        <label className="label" htmlFor="password">Пароль</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input mb-4" />

        {state?.error && <p className="mb-3 text-sm text-[var(--danger)]">{state.error}</p>}

        <button type="submit" disabled={pending} className="btn btn-primary w-full">
          {pending ? "Входим..." : "Войти"}
        </button>

        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[var(--accent)] hover:underline">
            Регистрация
          </Link>
        </p>
      </form>
    </main>
  );
}
