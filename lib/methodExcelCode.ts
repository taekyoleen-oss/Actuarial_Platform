/**
 * 분석 방법 팝업 [엑셀 적용 코드] 탭 — Python in Excel(=PY()) 적용 코드 레지스트리.
 *
 * 키는 lib/statMethods.ts `STAT_METHODS`(계리 8종 포함)의 방법 id와 1:1 대응.
 * 없는 id는 팝업이 공통 차이점 안내 + '코드 적용' 탭 참고 폴백을 보인다.
 * 데이터는 lib/methodExcelCodeData.ts(워크플로우 pie-code 산출). 확대는 그 파일에 id 키 추가.
 */

/** 필요한 패키지의 Python in Excel(Anaconda) 사용 가능 여부 */
export type ExcelPackageStatus = "available" | "partial" | "unavailable";

export interface ExcelCodeSection {
  title: string;
  level: "basic" | "advanced";
  /** 데이터 로드 줄 정도만 바뀌고 로직이 원본과 사실상 동일하면 true */
  sameAsOriginal: boolean;
  code: string;
}

export interface MethodExcelCode {
  packageStatus: ExcelPackageStatus;
  /** 코드 위에 표시할 이 방법의 Python in Excel 적용 차이점 */
  note: string;
  sections: ExcelCodeSection[];
}

/** 모든 방법 공통 — Python in Excel과 브라우저 실행기의 차이(탭 상단 고정 안내) */
export const PIE_GENERAL_NOTE =
  "엑셀의 Python(Python in Excel, =PY())은 아래 브라우저 실행기와 다릅니다. ① 데이터는 파일 읽기 대신 xl(\"범위 또는 표\", headers=True)로 시트를 참조합니다. ② print() 출력은 셀이 아니라 진단(Diagnostics) 창에 표시되고, 셀에는 코드 '마지막 식'의 값이 반환됩니다. ③ Anaconda 배포판의 큐레이션 패키지만 사용할 수 있어(pip 설치 불가) numpy·pandas·scipy·statsmodels·scikit-learn·matplotlib 등은 되지만 lifelines·xgboost·lightgbm 등은 사용할 수 없습니다.";

/**
 * 동적 생성 파이썬 코드(확률분포·모델 적합 팝업)를 Python in Excel용으로 가볍게 변환.
 * 이 코드는 scipy·numpy·matplotlib만 쓰므로 대부분 그대로 실행되며, 차이는 최소만 손댄다:
 *  · plt.show()는 불필요(셀이 마지막 그림을 반환) → 제거
 *  · 모델 적합의 임베드 데이터 옆에 xl() 대안 주석을 덧붙인다(있을 때만)
 * 나머지 차이(print→진단창, 셀당 그림 1개)는 코드 위 안내(PIE_CODE_NOTE)로 설명한다.
 */
export function toExcelPython(code: string): string {
  let out = code.replace(/;?[ \t]*plt\.show\(\)/g, "");
  out = out.replace(
    /(#\s*1\)\s*데이터 입력[^\n]*\n)/,
    `$1# ▶ Python in Excel: 임베드된 데이터 대신 시트를 참조하려면 예) x = np.asarray(xl("범위 또는 표"), float).ravel()\n`
  );
  return out;
}

/** 확률분포·모델 적합 코드 팝업의 '엑셀 적용 코드' 탭 안내(코드 위) */
export const PIE_CODE_NOTE =
  "이 코드는 scipy·numpy·matplotlib만 사용하므로 Python in Excel(=PY())에서 대부분 그대로 실행됩니다. 차이점: ① 모델 적합의 데이터는 코드에 임베드돼 있습니다 — 엑셀 시트를 쓰려면 xl(\"범위/표\")로 바꾸세요(코드 주석에 예시). ② print 결과는 셀이 아니라 진단(Diagnostics) 창에 표시되고, 셀에는 코드 '마지막 식'의 값이 반환됩니다. ③ 그림은 셀당 1개만 반환되므로, 여러 그래프는 셀을 나눠 각 셀 마지막 줄에 그림 객체(plt.gcf())를 두세요. 불필요한 plt.show()는 제거했습니다. 다른 탭(시뮬레이션 등)의 코드도 같은 규칙으로 적용하면 됩니다.";

export const PACKAGE_STATUS_META: Record<
  ExcelPackageStatus,
  { label: string; color: string }
> = {
  available: { label: "패키지 사용 가능", color: "teal" },
  partial: { label: "일부 패키지 제한", color: "amber" },
  unavailable: { label: "일부 패키지 미지원", color: "rose" },
};

export { METHOD_EXCEL_CODE } from "./methodExcelCodeData";
