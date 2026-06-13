"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import type { Comment } from "@/types";

/** 단층 익명 댓글 — 목록 + 작성 폼(닉네임·내용). 댓댓글 없음. */
export function CommentSection({
  postId,
  initialComments,
}: {
  postId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          nickname: fd.get("nickname"),
          content: fd.get("content"),
        }),
      });
      if (res.status === 429) throw new Error("잠시 후 다시 시도해 주세요.");
      if (!res.ok) throw new Error("댓글 작성에 실패했습니다.");
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="text-[18px] font-medium text-foreground">
        댓글 {comments.length}
      </h2>

      <ul className="mt-4 divide-y divide-border">
        {comments.map((c) => (
          <li key={c.id} className="py-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-foreground">{c.nickname}</span>
              <span className="text-xs text-tertiary">
                {formatDate(c.created_at)}
              </span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-body">
              {c.content}
            </p>
          </li>
        ))}
      </ul>

      <form onSubmit={submit} className="mt-6 space-y-3">
        <Input name="nickname" placeholder="닉네임" maxLength={20} required />
        <Textarea
          name="content"
          placeholder="댓글을 입력하세요"
          maxLength={1000}
          required
        />
        {error && <p className="text-sm text-[#c4302b]">{error}</p>}
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting}>
            {submitting ? "등록 중…" : "댓글 등록"}
          </Button>
        </div>
      </form>
    </section>
  );
}
