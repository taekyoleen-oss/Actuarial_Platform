import Link from "next/link";

/** 게시판(타임라인) 한 줄에 들어가는 항목 — 게시물/정적자료를 공통 형태로 표현. */
export interface BoardItem {
  key: string;
  href: string;
  title: string;
  description: string;
  /** 날짜·조회수 또는 부제 등 보조 메타 한 줄 */
  meta?: string;
}

// 카드 격자 대신 "위에서 아래로" 나열하는 게시판형 뷰(2026-06-28 사용자 요청).
// 좌측 원형 노드 + 세로 연결선(스텝퍼) · 큰 제목 · 넓은 간격으로 또렷하게 보이도록 구성.
export function PostBoard({ items }: { items: BoardItem[] }) {
  return (
    <ol className="relative">
      {items.map((item, i) => {
        const last = i === items.length - 1;
        return (
          <li key={item.key} className="relative pb-9 pl-16 last:pb-0">
            {/* 노드 사이 세로 연결선 */}
            {!last ? (
              <span
                aria-hidden
                className="absolute bottom-0 left-[19px] top-12 w-px bg-border"
              />
            ) : null}
            {/* 순번 원형 노드 */}
            <span
              aria-hidden
              className="absolute left-0 top-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-brand-sky text-[15px] font-semibold text-white shadow-card"
            >
              {i + 1}
            </span>
            <Link
              href={item.href}
              className="group block rounded-cover px-4 py-3 transition-[background-color] duration-tesla ease-tesla hover:bg-surface"
            >
              <h3 className="text-xl font-semibold leading-snug text-brand-sky group-hover:text-primary">
                {item.title}
              </h3>
              <p className="mt-2.5 text-[15px] leading-relaxed text-body">
                {item.description}
              </p>
              {item.meta ? (
                <div className="mt-3 text-[13px] text-tertiary">{item.meta}</div>
              ) : null}
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
