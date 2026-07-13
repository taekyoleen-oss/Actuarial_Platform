import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/ui/markdown";
import { DataChip } from "@/components/feature/datalab/DataChip";
import { DataViewCounter } from "@/components/feature/datalab/DataViewCounter";
import ExcelLaunchPanel from "@/components/feature/datalab/ExcelLaunchPanel";
import { WorkbookViewer } from "@/components/feature/datalab/WorkbookLoaders";
import { formatBytes } from "@/components/feature/datalab/util";
import {
  currentWorkbook,
  dataFileUrl,
  getDataPost,
  originalWorkbook,
} from "@/lib/datalab";
import { requireAdmin } from "@/lib/auth";
import { formatDate } from "@/lib/utils";

export const revalidate = 30;

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-14">
      <h2 className="flex items-center gap-2.5 text-xl font-semibold text-foreground">
        <span aria-hidden className="h-2 w-2 shrink-0 bg-brand-sky" />
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export default async function DataPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getDataPost(slug);
  if (!post) notFound();

  const content = post.content ?? {};
  const files = post.files ?? [];
  const current = currentWorkbook(files);
  const original = originalWorkbook(files);
  const admin = await requireAdmin();
  const isAdmin = admin.ok;

  const currentUrl = current ? await dataFileUrl(current.storage_path) : null;
  const originalUrl = original
    ? await dataFileUrl(original.storage_path)
    : null;
  const showOriginal =
    original && current && original.id !== current.id && originalUrl;

  // 이미지 — content.images + kind==='image' 첨부(중복 storage_path 제거)
  const seen = new Set<string>();
  const images: { src: string; caption?: string }[] = [];
  for (const im of content.images ?? []) {
    if (im.storage_path) {
      if (seen.has(im.storage_path)) continue;
      seen.add(im.storage_path);
      images.push({
        src: await dataFileUrl(im.storage_path),
        caption: im.caption,
      });
    } else if (im.url) {
      images.push({ src: im.url, caption: im.caption });
    }
  }
  for (const f of files.filter((x) => x.kind === "image")) {
    if (seen.has(f.storage_path)) continue;
    seen.add(f.storage_path);
    images.push({
      src: await dataFileUrl(f.storage_path),
      caption: f.note ?? f.file_name,
    });
  }

  // 첨부 목록 — excel·image 제외(pdf/text/code/other)
  const attachments = await Promise.all(
    files
      .filter((f) => f.kind !== "excel" && f.kind !== "image")
      .map(async (f) => ({
        id: f.id,
        fileName: f.file_name,
        size: formatBytes(f.file_size),
        note: f.note,
        url: await dataFileUrl(f.storage_path),
      }))
  );

  const tags = [...(post.models ?? []), ...(post.tools ?? [])];
  const traits = content.dataTraits ?? [];
  const layout = content.layout ?? [];
  const keyFunctions = content.keyFunctions ?? [];
  const pythonAnalysis = content.pythonAnalysis ?? [];
  const methods = content.methods ?? [];
  const results = content.results ?? [];
  const links = content.links ?? [];

  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <DataViewCounter postId={post.id} />

      <Link
        href="/datalab"
        className="text-sm font-medium text-tertiary hover:text-foreground"
      >
        ← 데이터 예제/분석
      </Link>

      <h1 className="mt-4 text-[30px] font-medium leading-snug text-foreground sm:text-[35px]">
        {post.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-tertiary">
        {post.source_url ? (
          <a
            href={post.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary hover:underline"
          >
            {post.source_name ?? "출처"} ↗
          </a>
        ) : post.source_name ? (
          <span>{post.source_name}</span>
        ) : null}
        <span>{formatDate(post.created_at)}</span>
        <span>·</span>
        <span>조회 {post.view_count}</span>
      </div>

      {tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <DataChip key={`${t}-${i}`} label={t} />
          ))}
        </div>
      ) : null}

      {post.summary ? (
        <p className="mt-6 text-[16px] leading-relaxed text-body">
          {post.summary}
        </p>
      ) : null}

      {/* ① 데이터 개요 */}
      {content.overview || traits.length > 0 ? (
        <Section title="데이터 개요">
          {content.overview ? (
            <div className="text-[15px] leading-relaxed text-body">
              <Markdown text={content.overview} />
            </div>
          ) : null}
          {traits.length > 0 ? (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-body">
              {traits.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          ) : null}
        </Section>
      ) : null}

      {/* ② 데이터 레이아웃 */}
      {layout.length > 0 ? (
        <Section title="데이터 레이아웃">
          <div className="space-y-6">
            {layout.map((lay, i) => (
              <div key={i}>
                {lay.sheet ? (
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {lay.sheet}
                  </p>
                ) : null}
                <div className="overflow-x-auto rounded-cover border border-border">
                  <table className="w-full min-w-[460px] border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-tertiary">
                        <th className="px-3 py-2 font-medium">컬럼명</th>
                        <th className="px-3 py-2 font-medium">타입</th>
                        <th className="px-3 py-2 font-medium">설명</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lay.columns.map((col, j) => (
                        <tr
                          key={j}
                          className="border-b border-border last:border-0"
                        >
                          <td className="px-3 py-2 font-medium text-foreground">
                            {col.name}
                          </td>
                          <td className="px-3 py-2 text-tertiary">
                            {col.type}
                          </td>
                          <td className="px-3 py-2 text-body">{col.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ③ 주요 엑셀 함수 — 워크북에서 사용된 중요 함수 해설 */}
      {keyFunctions.length > 0 ? (
        <Section title="주요 엑셀 함수">
          <div className="space-y-4">
            {keyFunctions.map((fn, i) => (
              <div
                key={i}
                className="rounded-cover border border-border bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-mono text-base font-semibold text-foreground">
                    {fn.name}
                  </h3>
                  {fn.badge ? <DataChip label={fn.badge} /> : null}
                </div>
                {fn.syntax ? (
                  <p className="mt-2 font-mono text-[13px] text-tertiary">
                    {fn.syntax}
                  </p>
                ) : null}
                <div className="mt-3 text-[15px] leading-relaxed text-body">
                  <Markdown text={fn.desc} />
                </div>
                {fn.usage ? (
                  <div className="mt-3 rounded-cover border border-border bg-surface/50 p-3 text-sm leading-relaxed text-body">
                    <p className="mb-1 text-xs font-medium text-tertiary">
                      이 워크북에서의 사용
                    </p>
                    <Markdown text={fn.usage} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ④ 파이썬 코드 분석 — Python in Excel 수식/첨부 스크립트 해설 */}
      {pythonAnalysis.length > 0 ? (
        <Section title="파이썬 코드 분석">
          <div className="space-y-4">
            {pythonAnalysis.map((py, i) => (
              <div
                key={i}
                className="rounded-cover border border-border bg-white p-5 shadow-card"
              >
                <h3 className="text-base font-semibold text-foreground">
                  {py.title}
                </h3>
                {py.code ? (
                  <pre className="mt-3 overflow-x-auto rounded-cover border border-border bg-surface/60 p-4 text-[13px] leading-relaxed text-foreground">
                    <code>{py.code}</code>
                  </pre>
                ) : null}
                {py.body ? (
                  <div className="mt-3 text-[15px] leading-relaxed text-body">
                    <Markdown text={py.body} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ⑤ 분석 과정 */}
      {methods.length > 0 ? (
        <Section title="분석 과정">
          <div className="space-y-4">
            {methods.map((m, i) => (
              <div
                key={i}
                className="rounded-cover border border-border bg-white p-5 shadow-card"
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-sm font-semibold text-foreground">
                    {i + 1}
                  </span>
                  <h3 className="text-base font-semibold text-foreground">
                    {m.title}
                  </h3>
                  {m.tool ? <DataChip label={m.tool} /> : null}
                </div>
                {m.body ? (
                  <div className="mt-3 text-[15px] leading-relaxed text-body">
                    <Markdown text={m.body} />
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ⑥ 산출 결과 — 분석이 만들어낸 결과물 해설 */}
      {results.length > 0 ? (
        <Section title="산출 결과">
          <div className="space-y-5">
            {results.map((r, i) => (
              <div key={i}>
                {r.title ? (
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {r.title}
                  </p>
                ) : null}
                <div className="text-[15px] leading-relaxed text-body">
                  <Markdown text={r.body} />
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ⑦ 이미지 */}
      {images.length > 0 ? (
        <Section title="이미지">
          <div className="space-y-6">
            {images.map((img, i) => (
              <figure key={i}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.src}
                  alt={img.caption ?? `이미지 ${i + 1}`}
                  loading="lazy"
                  className="w-full rounded-cover border border-border"
                />
                {img.caption ? (
                  <figcaption className="mt-2 text-sm text-tertiary">
                    {img.caption}
                  </figcaption>
                ) : null}
              </figure>
            ))}
          </div>
        </Section>
      ) : null}

      {/* ⑧ 관련 링크 */}
      {links.length > 0 ? (
        <Section title="관련 링크">
          <ul className="space-y-2">
            {links.map((l, i) => (
              <li key={i}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {l.label} ↗
                </a>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 첨부 자료 */}
      {attachments.length > 0 ? (
        <Section title="첨부 자료">
          <ul className="divide-y divide-border rounded-cover border border-border">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {a.fileName}
                  </p>
                  {a.note ? (
                    <p className="mt-0.5 text-xs text-tertiary">{a.note}</p>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-tertiary">
                  <span>{a.size}</span>
                  <a
                    href={a.url}
                    download={a.fileName}
                    className="font-medium text-primary"
                  >
                    다운로드
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {/* 워크북 패널 — 최신 대표 엑셀이 있을 때만 (본문 마지막 섹션) */}
      {current && currentUrl ? (
        <Section title="워크북">
          <WorkbookViewer fileUrl={currentUrl} fileName={current.file_name} />

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button asChild variant="secondary" size="sm">
              <a href={currentUrl} download={current.file_name}>
                최신본 다운로드 (v{current.version})
              </a>
            </Button>
            {showOriginal && originalUrl ? (
              <Button asChild variant="secondary" size="sm">
                <a href={originalUrl} download={original!.file_name}>
                  원본 다운로드 (v1)
                </a>
              </Button>
            ) : null}
            {isAdmin ? (
              <Button asChild size="sm">
                <Link href={`/datalab/${slug}/edit`}>웹에서 편집</Link>
              </Button>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-tertiary">
            <span className="font-medium text-foreground">
              {current.file_name}
            </span>
            <span>{formatBytes(current.file_size)}</span>
            <span>·</span>
            <span>버전 v{current.version}</span>
            <span>·</span>
            <span>수정 {formatDate(current.created_at)}</span>
          </div>

          <ExcelLaunchPanel
            fileUrl={currentUrl}
            fileName={current.file_name}
            version={current.version}
            hasOriginal={Boolean(showOriginal)}
          />
        </Section>
      ) : null}

      {/* notes 안내박스 */}
      {content.notes ? (
        <div className="mt-14 rounded-cover border border-border bg-surface/50 p-5 text-sm leading-relaxed text-tertiary">
          <Markdown text={content.notes} />
        </div>
      ) : null}
    </article>
  );
}
