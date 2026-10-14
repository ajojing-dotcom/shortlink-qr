"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  return (
    <form action={action} className="stack" style={{ gap: 18 }}>
      <input type="hidden" name="next" value={next} />
      <div className="field">
        <label htmlFor="pw">Kata sandi</label>
        <input id="pw" name="password" type="password" className="input" style={{ height: 48 }} autoComplete="current-password" required autoFocus />
      </div>
      {state.error ? <p role="alert" className="alert">{state.error}</p> : null}
      <button type="submit" className="btn btn-primary btn-big" disabled={pending}>
        {pending ? "Sebentar…" : "Masuk"}
      </button>
    </form>
  );
}
