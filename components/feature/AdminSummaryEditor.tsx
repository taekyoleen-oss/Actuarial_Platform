"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Markdown } from "@/components/ui/markdown";

/**
 * 관리자 AI 요약 편집기 — 생성(AI)·수동 편집·저장·리셋.
 * 저장된 요약만 공개 상세에 마크다운으로 노출된다.
 */
export function AdminSummaryEditor({
  postId,
  initialSummary,
}: {
  postId: string;
  initialSummary: string | null;
}) {
  const [text, setText] = useState(initialSummary ?? "");
  const [busy, setBusy] = useState<null | "gen" | "save" | "reset">(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function generate() {
    setBusy("gen");
    setMsg(null);
    try {
      const res = await fetch(`/api/posts/${postId}/summarize`, {
        method: "POST",
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setText(data.summary);
      setMsg({ ok: true, text: "AI 요약을 생성했습니다. 검토 후 저장하세요." });
    } catch {
      setMsg({ ok: false, text: "AI 생성 실패. 잠시 후 다시 시도하세요." });
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    setBusy("save");
    setMsg(null);
    try {
      const res = await fetch(`/api/posts/${postId}/summary`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ summary: text }),
      });
      if (!res.ok) throw new Error();
      setMsg({ ok: true, text: "저장했습니다. 공개 페이지에 반영됩니다." });
    } catch {
      setMsg({ ok: false, text: "저장 실패." });
    } finally {
      setBusy(null);
    }
  }

  async function reset() {
    setBusy("reset");
    setMsg(null);
    try {
      const res = await fetch(`/api/posts/${postId}/summary`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error();
      setText("");
      setMsg({ ok: true, text: "요약을 리셋(삭제)했습니다." });
    } catch {
      setMsg({ ok: false, text: "리셋 실패." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="border-t border-border pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px] font-medium text-foreground">AI 요약</h3>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            onClick={generate}
            disabled={busy !== null}
          >
            {busy === "gen" ? "생성 중…" : "AI 생성"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={save}
            disabled={busy !== null}
          >
            {busy === "save" ? "저장 중…" : "저장"}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={reset}
            disabled={busy !== null || !text}
          >
            리셋
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-tertiary">
        AI로 생성하거나 직접 작성·수정할 수 있습니다. 개조식 + 마크다운(**굵게**, - 불릿,
        ## 제목)을 지원합니다. <b>저장</b>해야 공개됩니다.
      </p>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="AI 생성 또는 직접 작성한 개조식 요약"
        className="mt-3 min-h-48 font-mono text-[13px]"
      />

      {msg && (
        <p className={`mt-2 text-sm ${msg.ok ? "text-primary" : "text-[#c4302b]"}`}>
          {msg.text}
        </p>
      )}

      {text.trim() && (
        <div className="mt-4">
          <p className="mb-1 text-xs text-tertiary">미리보기</p>
          <div className="rounded-cover bg-surface p-4">
            <Markdown text={text} />
          </div>
        </div>
      )}
    </div>
  );
}
