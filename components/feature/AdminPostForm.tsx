"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { AdminSummaryEditor } from "@/components/feature/AdminSummaryEditor";
import { createPost, updatePost } from "@/app/actions";
import type { Attachment, Category, Post } from "@/types";

/** 게시물 작성/수정 폼. 파일 업로드는 게시물 생성 후(수정 모드)에 제공. */
export function AdminPostForm({
  categories,
  post,
  attachments = [],
}: {
  categories: Category[];
  post?: Post;
  attachments?: Attachment[];
}) {
  const isEdit = !!post;
  const [uploads, setUploads] = useState<Attachment[]>(attachments);
  const [uploading, setUploading] = useState(false);

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!post) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.set("file", file);
    fd.set("post_id", post.id);
    fd.set("category_slug", categorySlug(categories, post.category_id));
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setUploads((prev) => [...prev, data.attachment]);
    } else {
      alert("업로드 실패");
    }
    e.target.value = "";
  }

  return (
    <div className="space-y-8">
      <form action={isEdit ? updatePost : createPost} className="space-y-4">
        {isEdit && <input type="hidden" name="id" value={post!.id} />}
        <Field label="제목">
          <Input name="title" defaultValue={post?.title} required />
        </Field>
        <Field label="카테고리">
          <Select
            name="category_id"
            defaultValue={post?.category_id}
            required
          >
            <option value="">선택</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="작성자명(선택)">
          <Input name="author_name" defaultValue={post?.author_name ?? ""} />
        </Field>
        <Field label="본문">
          <Textarea
            name="content"
            defaultValue={post?.content}
            className="min-h-64"
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            name="is_published"
            defaultChecked={post ? post.is_published : true}
          />
          공개
        </label>
        <div className="flex justify-end">
          <Button type="submit">{isEdit ? "수정 저장" : "게시"}</Button>
        </div>
      </form>

      {isEdit && (
        <div className="border-t border-border pt-6">
          <h3 className="text-[15px] font-medium text-foreground">첨부 파일</h3>
          <ul className="mt-2 space-y-1 text-sm text-tertiary">
            {uploads.map((a) => (
              <li key={a.id}>{a.file_name}</li>
            ))}
          </ul>
          <label
            className={`mt-3 flex h-11 w-full items-center justify-center gap-2 rounded border border-border px-4 text-sm font-medium text-primary transition-colors hover:border-primary sm:inline-flex sm:w-auto ${
              uploading ? "pointer-events-none opacity-60" : "cursor-pointer"
            }`}
          >
            {uploading ? "업로드 중…" : "📄 파일 선택 (PDF 검색)"}
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
          <p className="mt-1.5 text-xs text-tertiary">
            탭하면 기기에서 파일을 검색·선택합니다. 드래그앤드롭 없이 모바일에서도 업로드할 수 있습니다.
          </p>
        </div>
      )}

      {isEdit && post && (
        <AdminSummaryEditor postId={post.id} initialSummary={post.summary} />
      )}
    </div>
  );
}

function categorySlug(categories: Category[], id: string): string {
  return categories.find((c) => c.id === id)?.slug || "etc";
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
