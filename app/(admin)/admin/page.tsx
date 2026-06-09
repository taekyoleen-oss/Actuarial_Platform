import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChangePasswordForm } from "@/components/feature/ChangePasswordForm";
import { deleteComment, deletePost, signOut } from "@/app/actions";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const admin = await requireAdmin();
  if (!admin.ok) redirect("/admin/login");

  const supabase = await createClient();
  const [{ data: posts }, { data: comments }] = await Promise.all([
    supabase
      .from("ib_posts")
      .select("id, title, is_published, view_count, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("ib_comments")
      .select("id, post_id, nickname, content, created_at")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  return (
    <div className="mx-auto max-w-container px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-medium text-foreground">관리자 대시보드</h1>
        <div className="flex gap-2">
          <Button asChild size="sm">
            <Link href="/admin/posts/new">새 게시물</Link>
          </Button>
          <form action={signOut}>
            <Button variant="ghost" size="sm" type="submit">
              로그아웃
            </Button>
          </form>
        </div>
      </div>

      {/* 게시물 관리 */}
      <section className="mt-10">
        <h2 className="text-[17px] font-medium text-foreground">게시물</h2>
        <ul className="mt-3 divide-y divide-border">
          {(posts ?? []).map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/posts/${p.id}`}
                    className="truncate text-sm font-medium text-foreground hover:text-primary"
                  >
                    {p.title}
                  </Link>
                  {!p.is_published && <Badge>비공개</Badge>}
                </div>
                <span className="text-xs text-tertiary">
                  {formatDate(p.created_at)} · 조회 {p.view_count}
                </span>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button asChild variant="secondary" size="sm">
                  <Link href={`/admin/posts/${p.id}/edit`}>수정</Link>
                </Button>
                <form action={deletePost}>
                  <input type="hidden" name="id" value={p.id} />
                  <Button variant="danger" size="sm" type="submit">
                    삭제
                  </Button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* 댓글 관리 (대시보드 내 탭/섹션) */}
      <section className="mt-12">
        <h2 className="text-[17px] font-medium text-foreground">최근 댓글</h2>
        <ul className="mt-3 divide-y divide-border">
          {(comments ?? []).map((c) => (
            <li
              key={c.id}
              className="flex items-start justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <span className="text-sm font-medium text-foreground">
                  {c.nickname}
                </span>
                <p className="truncate text-sm text-tertiary">{c.content}</p>
              </div>
              <form action={deleteComment}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="post_id" value={c.post_id} />
                <Button variant="danger" size="sm" type="submit">
                  삭제
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      {/* 계정 — 비밀번호 변경 */}
      <section className="mt-12">
        <h2 className="text-[17px] font-medium text-foreground">계정</h2>
        <p className="mt-1 text-sm text-tertiary">
          현재 로그인한 관리자 계정의 비밀번호를 변경합니다.
        </p>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
