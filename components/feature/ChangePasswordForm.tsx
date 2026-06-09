"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

/** 로그인한 관리자가 자기 비밀번호를 변경한다 (본인 세션 — service key 불필요). */
export function ChangePasswordForm() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const pw = String(fd.get("pw"));
    const pw2 = String(fd.get("pw2"));

    if (pw.length < 8) {
      setMsg({ ok: false, text: "비밀번호는 8자 이상이어야 합니다." });
      return;
    }
    if (pw !== pw2) {
      setMsg({ ok: false, text: "두 비밀번호가 일치하지 않습니다." });
      return;
    }

    setLoading(true);
    setMsg(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    setLoading(false);

    if (error) {
      setMsg({ ok: false, text: `변경 실패: ${error.message}` });
    } else {
      setMsg({ ok: true, text: "비밀번호가 변경되었습니다." });
      form.reset();
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-3 max-w-sm space-y-3">
      <Input
        name="pw"
        type="password"
        placeholder="새 비밀번호 (8자 이상)"
        autoComplete="new-password"
        required
      />
      <Input
        name="pw2"
        type="password"
        placeholder="새 비밀번호 확인"
        autoComplete="new-password"
        required
      />
      {msg && (
        <p className={`text-sm ${msg.ok ? "text-primary" : "text-[#c4302b]"}`}>
          {msg.text}
        </p>
      )}
      <Button type="submit" variant="secondary" size="sm" disabled={loading}>
        {loading ? "변경 중…" : "비밀번호 변경"}
      </Button>
    </form>
  );
}
