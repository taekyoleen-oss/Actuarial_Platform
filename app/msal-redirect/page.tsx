"use client";

import { useEffect, useState } from "react";

type Mode = "processing" | "returning" | "failed";

/**
 * MSAL 리디렉션 페이지 (/msal-redirect.html 은 rewrite로 이 라우트를 서빙).
 * 두 흐름을 모두 처리한다:
 * ① 팝업(PC): msal-browser v5는 본창이 팝업 URL을 폴링하지 않고 BroadcastChannel로
 *    응답을 받으므로 broadcastResponseToMainFrame()을 실행해 인증 응답을 본창에
 *    송신한다(성공 시 팝업 자동 닫힘). 실행하지 않으면 본창은 timed_out으로 실패.
 * ② 톱레벨 리디렉션(모바일): 본창과 동일 설정(buildMsalConfig)의 PCA로
 *    handleRedirectPromise()를 실행하면 navigateToLoginRequestUrl(기본 true)에 따라
 *    응답 해시를 임시 캐시에 저장하고 로그인을 시작한 원래 페이지로 자동 복귀한다.
 *    토큰 회수는 원래 페이지의 completeRedirectLogin()이 수행.
 */
export default function MsalRedirectPage() {
  const [mode, setMode] = useState<Mode>("processing");

  useEffect(() => {
    (async () => {
      // 팝업·iframe 안에서 열렸는가(PC 팝업 흐름)
      const inPopupOrFrame = window.opener != null || window.parent !== window;
      if (inPopupOrFrame) {
        try {
          const { broadcastResponseToMainFrame } = await import(
            "@azure/msal-browser/redirect-bridge"
          );
          await broadcastResponseToMainFrame();
        } catch (e) {
          // URL에 인증 응답이 없는 직접 방문 포함
          console.error("[msal-redirect] bridge 처리 실패:", e);
          setMode("failed");
        }
        return;
      }

      // 톱레벨 복귀(모바일 리디렉션 로그인)
      const hasAuthResponse = /[#?&](code|error)=/.test(
        window.location.hash + window.location.search
      );
      const clientId = process.env.NEXT_PUBLIC_MS_GRAPH_CLIENT_ID;
      if (!hasAuthResponse || !clientId) {
        setMode("failed");
        return;
      }
      try {
        setMode("returning");
        const [{ PublicClientApplication }, { buildMsalConfig }] =
          await Promise.all([
            import("@azure/msal-browser"),
            import("@/lib/msgraph"),
          ]);
        const pca = new PublicClientApplication(buildMsalConfig(clientId));
        await pca.initialize();
        // 처리 중 원래 페이지로 replace 내비게이션이 일어난다(오류 응답 파싱도
        // 원래 페이지의 handleRedirectPromise에서 수행됨)
        await pca.handleRedirectPromise();
      } catch (e) {
        console.error("[msal-redirect] 리디렉션 응답 처리 실패:", e);
        setMode("failed");
      }
    })();
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", color: "#666", padding: 24 }}>
      {mode === "failed"
        ? "로그인 응답이 없습니다. 이 창을 닫고 원래 페이지에서 다시 시도해 주세요."
        : mode === "returning"
          ? "로그인 처리 중입니다… 원래 페이지로 돌아갑니다."
          : "로그인 처리 중입니다… 이 창은 자동으로 닫힙니다."}
    </main>
  );
}
