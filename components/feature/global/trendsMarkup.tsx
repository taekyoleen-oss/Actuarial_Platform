import { Fragment } from "react";

/** **굵게** + ^위첨자^ 인라인 마크업 → React 노드 (원문 텍스트 보존) */
export function InlineMarkup({ text }: { text: string }) {
  // 1) **bold** 분리
  const boldParts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {boldParts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return (
            <strong key={i} className="font-semibold text-foreground">
              <Sup text={part.slice(2, -2)} />
            </strong>
          );
        }
        return <Sup key={i} text={part} />;
      })}
    </>
  );
}

/** ^n^ → <sup> */
function Sup({ text }: { text: string }) {
  const parts = text.split(/(\^[^^]+\^)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("^") && p.endsWith("^") ? (
          <sup key={i} className="text-[0.7em] text-tertiary">
            {p.slice(1, -1)}
          </sup>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        )
      )}
    </>
  );
}
