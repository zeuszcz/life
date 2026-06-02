"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";
import { RegisterSchema } from "@/lib/zod-schemas";

export interface FormState {
  error?: string;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name") ?? "",
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте поля" };
  }
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "Пользователь с таким email уже зарегистрирован" };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  await prisma.user.create({
    data: { email, name: parsed.data.name || null, passwordHash },
  });

  await signIn("credentials", { email, password: parsed.data.password, redirect: false });
  redirect("/onboarding");
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirectTo: "/play" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    throw error; // re-throw NEXT_REDIRECT and others
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
