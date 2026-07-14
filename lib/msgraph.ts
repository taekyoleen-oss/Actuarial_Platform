// 클라이언트 전용: Microsoft Graph 연동(내 OneDrive로 사본 업로드 → Excel 웹 열기).
// msal-browser는 window 의존이므로 함수 내부에서 동적 import한다(SSR 안전).
// 시크릿 없음 — SPA PKCE 흐름이라 클라이언트 ID(NEXT_PUBLIC_MS_GRAPH_CLIENT_ID)만 사용.
// 로그인 흐름 2종: PC=팝업(loginPopup), 모바일=전체 리디렉션(loginRedirect) —
// 모바일 브라우저는 팝업을 차단하거나 새 탭으로 분리해 popup 흐름이 구조적으로 실패한다.
import type { Configuration, PublicClientApplication } from "@azure/msal-browser";

const GRAPH = "https://graph.microsoft.com/v1.0";
const SCOPES = ["Files.ReadWrite"];
const AUTHORITY = "https://login.microsoftonline.com/common"; // 개인+조직 계정 공용
const SIMPLE_UPLOAD_LIMIT = 4 * 1024 * 1024; // Graph 단순 업로드 상한(4MB)
const CHUNK_SIZE = 327680 * 16; // 업로드 세션 청크 — 320KiB 배수 필수(5MiB)

/** Azure 앱 등록(클라이언트 ID). 미설정이면 null — 버튼은 비활성 안내로 폴백. */
export function msGraphClientId(): string | null {
  return process.env.NEXT_PUBLIC_MS_GRAPH_CLIENT_ID || null;
}

/** 모바일 브라우저 판별 — 팝업이 차단·분리되는 환경은 리디렉션 로그인 사용. */
export function isMobileBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/Android|iPhone|iPad|iPod|Windows Phone|webOS|Mobile/i.test(ua)) return true;
  // iPadOS 13+ Safari는 Macintosh UA로 보고 — 멀티터치 지원으로 구별
  return /Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
}

/**
 * PCA 설정 단일 출처 — 본창과 리디렉션 페이지(app/msal-redirect)가 동일 설정을
 * 공유해야 sessionStorage 캐시(리디렉션 응답 임시 캐시 포함)가 호환된다.
 * redirectUri: 전용 리디렉션 페이지(rewrite로 .html 주소 유지). 팝업에서는
 * msal v5 redirect-bridge를 실행해 응답을 본창에 송신하고, 모바일 전체
 * 리디렉션에서는 handleRedirectPromise가 원래 페이지로 복귀시킨다.
 * Entra 앱 등록의 SPA 리디렉션 URI에 {origin}/msal-redirect.html 등록 필요.
 */
export function buildMsalConfig(clientId: string): Configuration {
  return {
    auth: {
      clientId,
      authority: AUTHORITY,
      redirectUri: `${window.location.origin}/msal-redirect.html`,
    },
    cache: { cacheLocation: "sessionStorage" },
    // 첫 로그인(비밀번호+2단계 인증+권한 동의)은 기본 60초를 넘기기 쉬움 → 5분
    system: { popupBridgeTimeout: 300000 },
  };
}

let pcaPromise: Promise<PublicClientApplication> | null = null;

async function getPca(clientId: string): Promise<PublicClientApplication> {
  if (!pcaPromise) {
    pcaPromise = (async () => {
      const { PublicClientApplication } = await import("@azure/msal-browser");
      const pca = new PublicClientApplication(buildMsalConfig(clientId));
      await pca.initialize();
      return pca;
    })();
  }
  return pcaPromise;
}

/**
 * 이전 팝업이 비정상 종료(에러 페이지에서 강제 닫힘 등)되면 MSAL이 남긴
 * "진행 중" 플래그(interaction.status) 때문에 이후 시도가 전부
 * interaction_in_progress로 실패한다. 공식 초기화 API가 없어 키를 직접 제거한다.
 */
function clearStaleInteraction(): void {
  try {
    for (const storage of [window.sessionStorage, window.localStorage]) {
      const stale: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const k = storage.key(i);
        if (k && k.includes("interaction.status")) stale.push(k);
      }
      stale.forEach((k) => storage.removeItem(k));
    }
  } catch {
    // storage 접근 불가 환경은 무시(재시도 시 사용자 안내로 폴백)
  }
}

/** 기존 계정의 조용한 토큰 갱신만 시도 — 실패하면 null(사용자 상호작용 없음). */
export async function acquireTokenSilentOnly(
  clientId: string
): Promise<string | null> {
  const pca = await getPca(clientId);
  const accounts = pca.getAllAccounts();
  if (accounts.length === 0) return null;
  try {
    const r = await pca.acquireTokenSilent({
      scopes: SCOPES,
      account: accounts[0],
    });
    return r.accessToken;
  } catch {
    return null;
  }
}

/**
 * 모바일: 전체 페이지 리디렉션 로그인 시작 — 호출하면 페이지가 Microsoft
 * 로그인으로 이동한다(돌아오지 않음). 복귀 지점은 redirectStartPage(현재 URL) —
 * msal이 리디렉션 페이지 경유 후 이 주소로 자동 복귀시키고, 원래 페이지의
 * completeRedirectLogin()이 토큰을 회수한다.
 */
export async function beginRedirectLogin(clientId: string): Promise<void> {
  const pca = await getPca(clientId);
  const request = { scopes: SCOPES, redirectStartPage: window.location.href };
  try {
    await pca.loginRedirect(request);
  } catch (e) {
    // 잔류 플래그로 인한 실패는 플래그 제거 후 1회 자동 재시도 (팝업 흐름과 동일)
    if ((e as { errorCode?: string })?.errorCode === "interaction_in_progress") {
      clearStaleInteraction();
      await pca.loginRedirect(request);
      return;
    }
    throw e;
  }
}

/**
 * 리디렉션 복귀 처리 — 대기 중인 인증 응답이 있으면 토큰을 반환한다.
 * 응답이 없으면(직접 방문·취소 후 재방문) 기존 계정 silent 갱신을 시도하고,
 * 그것도 없으면 null. 사용자 취소 등 오류 응답은 그대로 throw된다.
 */
export async function completeRedirectLogin(
  clientId: string
): Promise<string | null> {
  const pca = await getPca(clientId);
  const result = await pca.handleRedirectPromise();
  if (result?.accessToken) return result.accessToken;
  return acquireTokenSilentOnly(clientId);
}

/** Files.ReadWrite 토큰 — 기존 계정은 silent, 아니면 로그인 팝업(PC 전용). */
export async function acquireGraphToken(clientId: string): Promise<string> {
  const pca = await getPca(clientId);
  const accounts = pca.getAllAccounts();
  if (accounts.length > 0) {
    try {
      const r = await pca.acquireTokenSilent({
        scopes: SCOPES,
        account: accounts[0],
      });
      return r.accessToken;
    } catch {
      // 갱신 실패 → 팝업으로 폴백
    }
  }
  try {
    const r = await pca.loginPopup({ scopes: SCOPES });
    return r.accessToken;
  } catch (e) {
    // 잔류 플래그로 인한 실패는 플래그 제거 후 1회 자동 재시도
    if ((e as { errorCode?: string })?.errorCode === "interaction_in_progress") {
      clearStaleInteraction();
      const r = await pca.loginPopup({ scopes: SCOPES });
      return r.accessToken;
    }
    throw e;
  }
}

/** OneDrive 파일명 금지 문자 치환. */
function sanitizeName(name: string): string {
  const cleaned = name.replace(/[\\/:*?"<>|#%]/g, "_").trim();
  return cleaned || "workbook.xlsx";
}

export interface UploadedItem {
  webUrl: string;
  name: string;
}

interface DriveItemResponse {
  webUrl?: string;
  name?: string;
}

/**
 * 게시 워크북 사본을 사용자 OneDrive의 {folder}/ 아래에 업로드하고
 * Excel 웹에서 열 수 있는 webUrl을 반환한다.
 * 동일 파일명이 있으면 덮어쓰지 않고 자동 개명(conflictBehavior=rename).
 * 4MB 이하는 단순 PUT, 초과는 업로드 세션(청크, onProgress 0~1 콜백).
 */
export async function uploadToOneDrive(
  token: string,
  blob: Blob,
  fileName: string,
  folder = "DataLab",
  onProgress?: (ratio: number) => void
): Promise<UploadedItem> {
  const name = sanitizeName(fileName);
  const encodedPath = `${encodeURIComponent(folder)}/${encodeURIComponent(name)}`;

  if (blob.size <= SIMPLE_UPLOAD_LIMIT) {
    const res = await fetch(
      `${GRAPH}/me/drive/root:/${encodedPath}:/content?@microsoft.graph.conflictBehavior=rename`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        },
        body: blob,
      }
    );
    if (!res.ok) throw new Error(`upload_failed_${res.status}`);
    const item = (await res.json()) as DriveItemResponse;
    if (!item.webUrl) throw new Error("upload_incomplete");
    onProgress?.(1);
    return { webUrl: item.webUrl, name: item.name ?? name };
  }

  // 대용량 — 업로드 세션(청크)
  const sess = await fetch(
    `${GRAPH}/me/drive/root:/${encodedPath}:/createUploadSession`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        item: { "@microsoft.graph.conflictBehavior": "rename", name },
      }),
    }
  );
  if (!sess.ok) throw new Error(`session_failed_${sess.status}`);
  const { uploadUrl } = (await sess.json()) as { uploadUrl?: string };
  if (!uploadUrl) throw new Error("session_incomplete");

  let offset = 0;
  let item: DriveItemResponse | null = null;
  while (offset < blob.size) {
    const end = Math.min(offset + CHUNK_SIZE, blob.size);
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Range": `bytes ${offset}-${end - 1}/${blob.size}`,
      },
      body: blob.slice(offset, end),
    });
    if (!res.ok) throw new Error(`chunk_failed_${res.status}`);
    if (res.status === 200 || res.status === 201) {
      item = (await res.json()) as DriveItemResponse;
    }
    offset = end;
    onProgress?.(offset / blob.size);
  }
  if (!item?.webUrl) throw new Error("upload_incomplete");
  return { webUrl: item.webUrl, name: item.name ?? name };
}

/** MSAL/업로드 오류 → 사용자 문구(미분류 오류는 원인 코드를 함께 표기). */
export function graphErrorMessage(e: unknown): string {
  const code =
    (e as { errorCode?: string })?.errorCode ??
    (e instanceof Error ? e.message : "");
  if (code.includes("user_cancelled")) return "로그인이 취소되었습니다.";
  if (code.includes("popup_window_error") || code.includes("empty_window_error"))
    return "팝업이 차단되었습니다. 브라우저에서 팝업을 허용한 뒤 다시 시도해 주세요.";
  if (code.includes("interaction_in_progress"))
    return "이미 로그인 창이 열려 있습니다. 열린 창을 완료하거나 닫아 주세요.";
  if (code.includes("monitor_window_timeout"))
    return "로그인 창 응답 대기가 시간 초과되었습니다. 팝업 안에 오류 문구가 표시되지 않았는지 확인하고 다시 시도해 주세요.";
  if (code.includes("state_not_found") || code.includes("no_cached_authority_error"))
    return "로그인 복귀 정보가 유실되었습니다. 다시 시도해 주세요.";
  if (code.includes("_507")) return "OneDrive 저장 공간이 부족합니다.";
  if (code.includes("upload_failed_403") || code.includes("upload_failed_401"))
    return "OneDrive 접근 권한이 거부되었습니다. 로그인 시 권한 동의(Files.ReadWrite)를 수락했는지 확인해 주세요.";
  if (code.includes("fetch_failed"))
    return "게시 파일을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
  const detail = code ? ` (원인: ${code.slice(0, 90)})` : "";
  return `처리에 실패했습니다 — 잠시 후 다시 시도해 주세요.${detail}`;
}
