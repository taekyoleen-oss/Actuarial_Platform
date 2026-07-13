"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  acquireGraphToken,
  graphErrorMessage,
  msGraphClientId,
  uploadToOneDrive,
} from "@/lib/msgraph";

type Phase = "idle" | "auth" | "fetch" | "upload" | "done" | "error";

/**
 * "Excel로 직접 작업" 패널 — 게시 워크북을 진짜 Excel로 여는 이중 동선.
 * ① 내 OneDrive에서 Web-Excel 열기: MS 로그인 → 사본을 본인 OneDrive/DataLab에
 *    업로드(rename 충돌 회피) → Excel 웹 webUrl 새 탭. 게시본에는 영향 없음.
 * ② MS Excel 열기: xlsx 다운로드(데스크톱 Excel용 — VBA 포함 전 기능).
 * NEXT_PUBLIC_MS_GRAPH_CLIENT_ID 미설정 시 ①은 비활성 + 안내 폴백.
 */
export default function ExcelLaunchPanel({
  fileUrl,
  fileName,
  version,
  hasOriginal,
}: {
  fileUrl: string;
  fileName: string;
  version: number;
  hasOriginal: boolean;
}) {
  const clientId = msGraphClientId();
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [webUrl, setWebUrl] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  const openWebExcel = useCallback(async () => {
    if (!clientId || phase === "auth" || phase === "fetch" || phase === "upload")
      return;
    setErrMsg(null);
    setWebUrl(null);
    try {
      setPhase("auth");
      const token = await acquireGraphToken(clientId);

      setPhase("fetch");
      const res = await fetch(fileUrl);
      if (!res.ok) throw new Error("fetch_failed");
      const blob = await res.blob();

      setPhase("upload");
      setProgress(0);
      const item = await uploadToOneDrive(token, blob, fileName, "DataLab", (r) =>
        setProgress(r)
      );

      setPhase("done");
      setWebUrl(item.webUrl);
      // 팝업 차단 시에도 아래 "지금 열기" 링크로 진입 가능
      window.open(item.webUrl, "_blank", "noopener");
    } catch (e) {
      setPhase("error");
      setErrMsg(graphErrorMessage(e));
    }
  }, [clientId, fileUrl, fileName, phase]);

  const busy = phase === "auth" || phase === "fetch" || phase === "upload";
  const statusLabel = (() => {
    if (phase === "auth") return "Microsoft 로그인 중…";
    if (phase === "fetch") return "게시 파일 준비 중…";
    if (phase === "upload")
      return `내 OneDrive에 사본 저장 중… ${Math.round(progress * 100)}%`;
    if (phase === "done") return "사본이 저장되었습니다.";
    if (phase === "error") return errMsg;
    return null;
  })();

  return (
    <div className="mt-6 rounded-cover border border-border bg-white p-5 shadow-card">
      <h3 className="text-base font-semibold text-foreground">
        Excel로 직접 작업하기
      </h3>
      <p className="mt-1 text-sm leading-relaxed text-tertiary">
        게시된 워크북(v{version})의 <strong>사본</strong>으로 작업합니다. 어떤
        방식이든 이 게시물의 파일은 변경되지 않습니다.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={() => void openWebExcel()}
          disabled={!clientId || busy}
        >
          {busy ? "진행 중…" : "내 OneDrive에서 Web-Excel 열기"}
        </Button>
        <Button asChild variant="secondary" size="sm">
          <a href={fileUrl} download={fileName}>
            MS Excel 열기 (다운로드)
          </a>
        </Button>
      </div>

      {statusLabel ? (
        <p
          className={`mt-2 text-sm ${
            phase === "error"
              ? "text-[#c4302b]"
              : phase === "done"
                ? "text-brand-sky"
                : "text-tertiary"
          }`}
        >
          {statusLabel}
          {phase === "done" && webUrl ? (
            <>
              {" "}
              <a
                href={webUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                새 창이 열리지 않았다면 지금 열기 ↗
              </a>
            </>
          ) : null}
          {phase === "error" ? (
            <>
              {" "}
              <button
                type="button"
                onClick={() => void openWebExcel()}
                className="font-medium text-primary hover:underline"
              >
                다시 시도
              </button>
            </>
          ) : null}
        </p>
      ) : null}

      {!clientId ? (
        <p className="mt-2 text-sm text-tertiary">
          Web-Excel 연동은 아직 설정되지 않았습니다. 지금은{" "}
          <strong>MS Excel 열기(다운로드)</strong>를 이용해 주세요.
        </p>
      ) : null}

      {/* Web-Excel 이용 조건 — 상세 고지 */}
      <div className="mt-5 rounded-cover border border-border bg-surface/50 p-4">
        <p className="text-sm font-semibold text-foreground">
          Web-Excel 이용 조건
        </p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13px] leading-relaxed text-body">
          <li>
            <strong>Microsoft 계정 로그인이 필요합니다.</strong> 무료 개인
            계정(outlook.com 등)과 회사·학교(Microsoft 365) 계정 모두
            지원합니다. 로그인 창이 팝업으로 열리므로 브라우저의 팝업 허용이
            필요합니다.
          </li>
          <li>
            버튼을 누르면 게시된 최신 워크북(v{version})의 사본이{" "}
            <strong>본인 OneDrive의 “DataLab” 폴더</strong>에 저장된 뒤 Excel
            웹에서 열립니다. 같은 이름의 파일이 이미 있으면 덮어쓰지 않고 새
            이름으로 저장되며, 사본은 본인 OneDrive 용량을 사용합니다.
          </li>
          <li>
            <strong>편집 내용은 본인 OneDrive 사본에만 저장됩니다.</strong> 이
            게시물의 파일에는 어떤 영향도 없습니다(게시 파일 갱신은 관리자
            절차로 별도 진행됩니다).
          </li>
          <li>
            통계 함수·피벗 테이블·차트 등 Excel 웹에서 제공하는 기능을 그대로
            사용할 수 있습니다.
          </li>
          <li>
            <strong>Python in Excel</strong>은 Microsoft 365 구독 계정에서 Excel
            웹으로 사용할 수 있습니다(기본 컴퓨트 포함, 프리미엄 컴퓨트는 별도
            애드온이며 조직 정책에 따라 다를 수 있습니다).
          </li>
          <li>
            <strong>VBA 매크로는 Excel 웹에서 실행되지 않습니다.</strong>{" "}
            매크로가 필요하면 “MS Excel 열기(다운로드)”로 데스크톱 Excel에서
            여세요.
          </li>
          {version > 1 ? (
            <li>
              현재 최신본 v{version}은 웹 편집 저장본으로 셀 값·수식 수준만
              보존되어 있습니다. VBA·차트가 포함된 파일이 필요하면{" "}
              {hasOriginal
                ? "원본 다운로드(v1)를 이용하세요."
                : "관리자에게 원본을 문의하세요."}
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}
