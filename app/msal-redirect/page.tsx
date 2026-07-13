"use client";

import { useEffect, useState } from "react";

/**
 * MSAL 팝업 전용 리디렉션 페이지 (/msal-redirect.html 은 rewrite로 이 라우트를 서빙).
 * msal-browser v5는 본창이 팝업 URL을 폴링하지 않고 BroadcastChannel로 응답을
 * 받으므로, 이 페이지가 broadcastResponseToMainFrame()을 실행해 인증 응답을
 * 본창에 송신해야 한다(성공 시 팝업은 자동으로 닫힘). 실행하지 않으면 본창은
 * popupBridgeTimeout 후 timed_out으로 실패한다.
 */
export default function MsalRedirectPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { broadcastResponseToMainFrame } = await import(
          "@azure/msal-browser/redirect-bridge"
        );
        await broadcastResponseToMainFrame();
      } catch (e) {
        // URL에 인증 응답이 없는 직접 방문 포함
        console.error("[msal-redirect] bridge 처리 실패:", e);
        setFailed(true);
      }
    })();
  }, []);

  return (
    <main style={{ fontFamily: "sans-serif", color: "#666", padding: 24 }}>
      {failed
        ? "로그인 응답이 없습니다. 이 창을 닫고 원래 페이지에서 다시 시도해 주세요."
        : "로그인 처리 중입니다… 이 창은 자동으로 닫힙니다."}
    </main>
  );
}
