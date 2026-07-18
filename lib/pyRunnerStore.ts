// /datalab 파이썬 실행기의 브라우저 영속 저장 — localStorage(같은 브라우저·기기 단위).
// 새로고침·브라우저 종료·PC 재부팅 뒤에도 작업 탭·셀·데이터가 복원된다. 서버로 보내지
// 않으므로 모바일·PC·다른 PC는 각각 별도로 유지된다(계정 동기화 아님).
// 파이썬 런타임(변수)은 메모리라 복원되지 않는다 — 셀(코드)이 남으니 다시 실행하면 된다.

import type { RunPhase } from "@/lib/pyRunner";

type CellStatus = "idle" | "running" | "done" | "error";

const TABS_KEY = "datalab:pyrunner:tabs:v1";
const WS_PREFIX = "datalab:pyrunner:ws:v1:";
// localStorage는 원본당 ~5MB — 여유를 두고 4.2MB에서 무거운 것부터 덜어낸다.
const MAX_BYTES = 4_200_000;

export interface PersistedTabs {
  workspaces: { id: number; name: string }[];
  activeId: number;
  wsCounter: number;
}

export interface PersistedCell {
  id: number;
  code: string;
  output: string;
  images: string[];
  status: CellStatus;
  ms?: number;
  phase?: RunPhase;
  execOrder?: number;
}

export interface PersistedWorkspace {
  cells: PersistedCell[];
  loadedLabel: string | null;
  files: { name: string; b64: string }[];
  execCounter: number;
  nextId: number;
}

const hasLS = (): boolean =>
  typeof window !== "undefined" && !!window.localStorage;

export function loadTabs(): PersistedTabs | null {
  if (!hasLS()) return null;
  try {
    const raw = window.localStorage.getItem(TABS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as PersistedTabs;
    if (!Array.isArray(p.workspaces) || p.workspaces.length === 0) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveTabs(t: PersistedTabs): void {
  if (!hasLS()) return;
  try {
    window.localStorage.setItem(TABS_KEY, JSON.stringify(t));
  } catch {
    // 저장 실패(용량 등)는 조용히 무시 — 런타임 동작에는 영향 없음
  }
}

export function loadWorkspace(nsKey: string): PersistedWorkspace | null {
  if (!hasLS()) return null;
  try {
    const raw = window.localStorage.getItem(WS_PREFIX + nsKey);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedWorkspace;
  } catch {
    return null;
  }
}

export function saveWorkspace(nsKey: string, ws: PersistedWorkspace): void {
  if (!hasLS()) return;
  try {
    let payload = ws;
    let str = JSON.stringify(payload);
    // 용량 초과 시 무거운 것부터 순차로 덜어낸다: ① 그래프 이미지 → ② 데이터 바이트 → ③ 출력 텍스트
    if (str.length > MAX_BYTES) {
      payload = {
        ...payload,
        cells: payload.cells.map((c) => ({ ...c, images: [] })),
      };
      str = JSON.stringify(payload);
    }
    if (str.length > MAX_BYTES) {
      payload = { ...payload, files: [] };
      str = JSON.stringify(payload);
    }
    if (str.length > MAX_BYTES) {
      payload = {
        ...payload,
        cells: payload.cells.map((c) => ({
          ...c,
          output: c.output.slice(0, 2000),
        })),
      };
      str = JSON.stringify(payload);
    }
    window.localStorage.setItem(WS_PREFIX + nsKey, str);
  } catch {
    // QuotaExceededError 등 — 조용히 무시
  }
}

export function removeWorkspace(nsKey: string): void {
  if (!hasLS()) return;
  try {
    window.localStorage.removeItem(WS_PREFIX + nsKey);
  } catch {
    // 무시
  }
}

/** Uint8Array → base64 (큰 배열도 스택 초과 없이 청크로 변환) */
export function bytesToB64(bytes: Uint8Array): string {
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

export function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
