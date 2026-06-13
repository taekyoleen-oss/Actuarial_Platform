import React from "react";

// 경량 마크다운 렌더러 — 관리자/AI가 만든 개조식 요약용.
// 지원: ## 헤더, '- '/'* ' 불릿, **굵게**, 빈 줄 단락. (외부 의존성 없음)

function renderInline(text: string, keyBase: string): React.ReactNode[] {
  // **굵게** 분해
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (/^\*\*[^*]+\*\*$/.test(p)) {
      return (
        <strong key={`${keyBase}-b${i}`} className="font-medium text-foreground">
          {p.slice(2, -2)}
        </strong>
      );
    }
    return <React.Fragment key={`${keyBase}-t${i}`}>{p}</React.Fragment>;
  });
}

export function Markdown({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const blocks: React.ReactNode[] = [];
  let bullets: string[] = [];
  let k = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    const items = bullets;
    blocks.push(
      <ul key={`ul-${k++}`} className="my-2 list-disc space-y-1.5 pl-5">
        {items.map((b, i) => (
          <li key={i} className="text-body">
            {renderInline(b, `li-${k}-${i}`)}
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const h = line.match(/^(#{1,3})\s+(.*)$/);

    if (bullet) {
      bullets.push(bullet[1]);
      continue;
    }
    flushBullets();

    if (h) {
      blocks.push(
        <h3
          key={`h-${k++}`}
          className="mt-4 mb-1 text-[16px] font-medium text-foreground first:mt-0"
        >
          {renderInline(h[2], `h-${k}`)}
        </h3>
      );
    } else if (line.trim() === "") {
      // 빈 줄 — 단락 간격(생략, ul/h 마진으로 처리)
    } else {
      blocks.push(
        <p key={`p-${k++}`} className="my-1.5 text-body">
          {renderInline(line, `p-${k}`)}
        </p>
      );
    }
  }
  flushBullets();

  return <div className="text-sm leading-relaxed">{blocks}</div>;
}
