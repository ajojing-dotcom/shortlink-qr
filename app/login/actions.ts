"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/request";
import { SESSION_COOKIE, SESSION_DAYS, createSessionToken, passwordMatches } from "@/lib/session";

const MAX_FAIL = 5;
const LOCK_SECONDS = 15 * 60;

export interface LoginState {
  error?: string;
}

function safeNext(v: FormDataEntryValue | null): string {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/admin") && !s.startsWith("//") ? s : "/admin";
}

export async function login(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!process.env.ADMIN_PASSWORD) {
    return { error: "ADMIN_PASSWORD belum diatur di Vercel (Settings → Environment Variables)." };
  }
  const store = await db();
  const key = `login:fail:${await clientIp()}`;
  const fails = Number(await store.get(key)) || 0;
  if (fails >= MAX_FAIL) {
    return { error: "Kebanyakan salah, Bang. Login dikunci 15 menit dulu, ye." };
  }

  const password = String(form.get("password") ?? "");
  if (!(await passwordMatches(password))) {
    const n = await store.incr(key);
    await store.expire(key, LOCK_SECONDS);
    const left = MAX_FAIL - n;
    return {
      error: left > 0
        ? `Waduh, kata sandinye salah. Sisa ${left} kali lagi sebelum dikunci 15 menit.`
        : "Kebanyakan salah, Bang. Login dikunci 15 menit dulu, ye.",
    };
  }

  await store.del(key);
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400,
  });
  redirect(safeNext(form.get("next")));
}
