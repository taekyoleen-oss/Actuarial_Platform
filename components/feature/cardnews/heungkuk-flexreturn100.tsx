/**
 * 흥국생명 (무)플렉스 리턴100종신보험 — 카드뉴스 모션 슬라이드.
 * 출처: content/exclusive-rights/분석보고서_흥국생명_플렉스리턴100종신보험.pdf (분석기준일 2026.9.7)
 * 수치는 보고서 값 그대로. 페이백 누적 막대는 보고서 가정(초기 23.4만원·실효 2%·20년납)으로 계산.
 */
import type { CSSProperties } from "react";
import { Chip, Item, Note, R, Slide, type Deck } from "./parts";

const S1 = "① 배타적사용권 내용·구조";
const S2 = "② 국내외 유사상품";
const S3 = "③ 리스크 진단";
const S4 = "④ 상품개선 제안";

const grow = (d: number) => ({ "--d": `${d}ms` }) as CSSProperties;

/* 20년납 보험료 배수: 5년 평준 뒤 명목 5% vs 할인 후 실효 2% */
const YEARS = Array.from({ length: 20 }, (_, k) => {
  const n = Math.max(k + 1 - 5, 0);
  return { y: k + 1, nom: 1.05 ** n, eff: 1.02 ** n };
});

/* 페이백 누적(만원): 낸 순서대로 돌려받음 */
const PAYBACK = [
  { age: "65세", paid: 0 },
  { age: "70세", paid: 1404 },
  { age: "75세", paid: 2895 },
  { age: "80세", paid: 4540 },
  { age: "85세", paid: 6357 },
];
const won = (m: number) => (m >= 10000 ? "1억원" : `${m.toLocaleString("ko-KR")}만원`);

const slides = [
  /* 0 표지 */
  <div key="cover" className="flex h-full flex-col bg-[var(--brand-navy)] p-6 text-white sm:p-8">
    <R i={0}>
      <span className="text-[12px] font-semibold tracking-[0.12em] text-[var(--brand-sky)]">
        보험 배타적사용권 분석 · 카드뉴스
      </span>
    </R>
    <R i={1}>
      <h3 className="mt-6 text-[30px] font-bold leading-tight text-white sm:text-[36px]">
        낸 보험료를
        <br />
        65세부터 <span className="text-[var(--brand-sky)]">돌려준다는</span>
        <br />
        종신보험
      </h3>
    </R>
    <R i={2}>
      <p className="mt-4 text-[15px] leading-relaxed text-white/80">
        흥국생명 <b className="font-semibold text-white">(무)플렉스 리턴100종신보험</b>은 2026년 9월 2일
        생명보험협회에서 배타적사용권 <b className="font-semibold text-white">2건(각 3개월)</b>을 받았습니다.
      </p>
    </R>
    <R i={3} className="mt-4 flex flex-wrap gap-2">
      <span className="rounded-full border border-white/30 px-3 py-1 text-[12.5px]">보험료 연동 페이백</span>
      <span className="rounded-full border border-white/30 px-3 py-1 text-[12.5px]">체증 중지 · 물가연동 할인</span>
    </R>
    <R i={4} className="mt-auto border-t border-white/20 pt-4">
      <p className="text-[12.5px] font-semibold text-white/60">이 카드뉴스의 순서</p>
      <ol className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[14px]">
        <li>① 내용·구조</li>
        <li>② 국내외 유사상품</li>
        <li>③ 리스크 진단</li>
        <li>④ 상품개선 제안</li>
      </ol>
      <p className="mt-3 text-[12px] text-white/50">넘기기: 버튼 · 드래그 · 키보드 ← →</p>
    </R>
  </div>,

  /* 1 배경 */
  <Slide
    key="bg"
    section={S1}
    title="왜 이런 상품이 나왔을까?"
    lead="종신보험은 평생 동안 사망을 보장하고, 사망하면 유족이 보험금을 받는 상품입니다. 그런데 금리가 내려가면서 보험료가 크게 올랐습니다."
  >
    <R i={3}>
      <p className="text-[12.5px] font-semibold text-foreground">월 보험료 (남자 40세 · 가입금액 1억원 · 20년납)</p>
      <div className="mt-2 flex h-32 items-end gap-5 border-b border-border px-2">
        {[
          { y: "2000년", v: 93, r: "예정이율 7.5%" },
          { y: "2010년", v: 141, r: "5.0%" },
          { y: "2020년", v: 260, r: "2.5%" },
        ].map((b, k) => (
          <div key={b.y} className="flex h-full flex-1 flex-col items-center justify-end">
            <span className="mb-1 text-[13px] font-semibold text-foreground">{(b.v / 10).toFixed(1)}만원</span>
            <div
              className="cn-grow-y w-full max-w-[64px] rounded-t bg-primary"
              style={{ height: `${(b.v / 260) * 70}%`, ...grow(200 + k * 150) }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-5 px-2 text-center text-[11.5px] text-tertiary">
        <span className="flex-1">2000년 · 7.5%</span>
        <span className="flex-1">2010년 · 5.0%</span>
        <span className="flex-1">2020년 · 2.5%</span>
      </div>
    </R>
    <Item i={4} tag="문제" tone="rose" title="보험료를 보고 가입하는데, 상품은 보장금액부터 정해요">
      고객은 &lsquo;한 달에 얼마 내나&rsquo;로 가입을 결정하지만, 기존 종신보험은 보장금액을 먼저 정하고 보험료를 나중에
      계산합니다. 부담이 커서 가입을 포기하거나 중간에 해지하는 일이 생깁니다.
    </Item>
    <Note i={5}>
      그래서 이 상품은 설계의 기준점을 <b>보장금액에서 보험료로</b> 옮겼습니다. 보험료를 소득 흐름에 맞춰 늘리고,
      낸 보험료를 노후에 돌려주는 구조입니다.
    </Note>
  </Slide>,

  /* 2 세 장치 */
  <Slide key="three" section={S1} title="세 가지 장치를 하나로 묶었어요" lead="배타적사용권 2건은 아래 장치들에 대해 각각 3개월씩 부여되었습니다.">
    <Item i={3} tag="장치 1" title="체증 납입 + 물가연동 할인">
      가입 후 5년은 보험료가 같고, 이후 매년 5%씩 오릅니다. 대신 5%와 한국은행 물가 목표치(2%)의 차이인 3%를 매월
      할인해 줍니다. → 젊을 때 덜 내고 나중에 더 내는 구조
    </Item>
    <Item i={4} tag="장치 2" tone="violet" title="보험료 체증 중지 옵션">
      5년이 지나면 계약자가 원하는 때에 보험료 인상을 멈출 수 있습니다. 대신 그만큼 사망보험금이 줄어듭니다.
    </Item>
    <Item i={5} tag="장치 3" tone="teal" title="보험료 연동 페이백">
      노후(보통 65세)부터 그동안 낸 보험료를 낸 순서 그대로 매달 돌려줍니다. 돌려받은 만큼 사망보험금이 자동으로
      줄어듭니다.
    </Item>
    <Note i={6} tone="slate">
      한 줄 정리: <b>덜 내고 시작해서 → 소득이 오르면 더 내고 → 노후에 낸 돈을 월급처럼 돌려받는</b> 종신보험
    </Note>
  </Slide>,

  /* 3 체증 + 할인 */
  <Slide
    key="rise"
    section={S1}
    title="장치 1 · 보험료가 매년 올라가요"
    lead="5년 동안은 같은 금액, 6년째부터 연 5%씩 오릅니다. 여기서 매월 3%를 할인하면 실제 인상률은 약 2%가 됩니다."
  >
    <R i={3}>
      <div className="flex items-center gap-3 text-[12px] text-tertiary">
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--chip-blue-bg)] ring-1 ring-primary/30" />할인 전(명목 5%)</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />할인 후(실효 2%)</span>
        <span className="ml-auto">20년납 · 초기 보험료 = 1</span>
      </div>
      <div className="relative mt-2 flex h-36 items-end gap-[3px] border-b border-border">
        {YEARS.map((d, k) => (
          <div key={d.y} className="relative flex h-full flex-1 items-end">
            <div className="cn-grow-y absolute bottom-0 w-full rounded-t-sm bg-[var(--chip-blue-bg)]" style={{ height: `${(d.nom / 2.1) * 100}%`, ...grow(k * 35) }} />
            <div className="cn-grow-y relative w-full rounded-t-sm bg-primary" style={{ height: `${(d.eff / 2.1) * 100}%`, ...grow(300 + k * 35) }} />
          </div>
        ))}
        <span className="absolute right-0 top-0 text-[12px] font-semibold text-[var(--chip-blue-fg)]">2.08배</span>
        <span className="absolute right-0 text-[12px] font-semibold text-primary" style={{ bottom: `${(1.35 / 2.1) * 100 + 2}%` }}>1.35배</span>
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-tertiary"><span>1년</span><span>5년</span><span>10년</span><span>15년</span><span>20년</span></div>
    </R>
    <R i={4}>
      <table className="w-full text-[12.5px]">
        <thead className="text-tertiary">
          <tr className="border-b border-border"><th className="py-1 text-left font-medium">20년납 기준</th><th className="font-medium">실효 2%</th><th className="font-medium">명목 5%</th></tr>
        </thead>
        <tbody className="text-center">
          <tr className="border-b border-border"><td className="py-1 text-left">마지막 해 보험료</td><td>1.35배</td><td>2.08배</td></tr>
          <tr className="border-b border-border"><td className="py-1 text-left">평준형 대비 첫 보험료</td><td>약 10% 낮음</td><td>약 25% 낮음</td></tr>
          <tr><td className="py-1 text-left">30년납 마지막 해</td><td>1.64배</td><td>3.39배</td></tr>
        </tbody>
      </table>
    </R>
    <Note i={5} tone="amber">
      할인이 정확히 어떻게 계산되는지는 공개 자료로 확정되지 않았습니다. 할인 없이 5%가 그대로 적용되면 납입 말기
      보험료는 처음의 두 배를 넘습니다. 가입 전 <b>연도별 보험료 추이표</b>를 꼭 받아 보세요.
    </Note>
  </Slide>,

  /* 4 체증 중지 */
  <Slide
    key="stop"
    section={S1}
    title="장치 2 · 보험료 인상을 멈출 수 있어요"
    lead="가입 5년 뒤부터는 언제든 두 길 중 하나를 고를 수 있습니다."
  >
    <R i={3} className="grid grid-cols-2 gap-3">
      <div className="rounded-lg border border-border p-3">
        <Chip>계속</Chip>
        <p className="mt-2 font-semibold text-foreground">보험료가 계속 오름</p>
        <p className="mt-1">사망보험금은 처음 정한 금액 그대로 유지됩니다.</p>
      </div>
      <div className="rounded-lg border border-primary/40 p-3">
        <Chip tone="violet">중지</Chip>
        <p className="mt-2 font-semibold text-foreground">보험료가 그 자리에서 멈춤</p>
        <p className="mt-1">덜 내는 만큼 사망보험금이 줄어듭니다.</p>
      </div>
    </R>
    <Item i={4} tag="왜 필요할까" tone="amber" title="보험료 정점과 월급 정점이 어긋나요">
      40세에 20년납으로 가입하면 보험료가 가장 비싼 시기는 55~59세입니다. 그런데 국내 임금은 대체로 50대 초·중반에
      정점을 찍고 내려갑니다. 그래서 이 옵션은 많은 계약자에게 사실상 필수가 될 수 있습니다.
    </Item>
    <Item i={5} tag="회사 입장" tone="rose" title="건강한 사람이 더 많이 멈출 수 있어요">
      건강해서 사망보장이 덜 필요하다고 느끼는 사람일수록 인상을 멈추고, 건강이 나빠진 사람은 보장을 유지하려 합니다.
      이 차이(반선택)를 감액 계산에 반영하지 않으면 회사에 손실이 쌓입니다.
    </Item>
  </Slide>,

  /* 5 페이백 */
  <Slide
    key="payback"
    section={S1}
    title="장치 3 · 낸 보험료를 매달 돌려받아요"
    lead="만 65세와 '가입나이 + 납입기간' 중 늦은 때부터, 납입기간과 같은 기간 동안 낸 보험료를 매월 돌려줍니다."
  >
    <R i={3}>
      <p className="text-[12.5px] font-semibold text-foreground">40세 · 1억원 · 20년납 → 65~85세 페이백 (추정)</p>
      <div className="mt-2 space-y-1.5">
        {PAYBACK.map((r, k) => (
          <div key={r.age} className="flex items-center gap-2">
            <span className="w-10 shrink-0 text-[12px] text-tertiary">{r.age}</span>
            <div className="flex h-5 flex-1 overflow-hidden rounded bg-[var(--chip-slate-bg)]">
              <div className="cn-grow-x h-full bg-[var(--chip-teal-fg)]" style={{ width: `${r.paid / 100}%`, ...grow(200 + k * 160) }} />
              <div className="h-full flex-1 bg-primary/80" />
            </div>
            <span className="w-[86px] shrink-0 text-right text-[11.5px] tabular-nums text-foreground">{won(10000 - r.paid)}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-4 text-[11.5px] text-tertiary">
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-[var(--chip-teal-fg)]" />돌려받은 보험료(누적)</span>
        <span className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-sm bg-primary/80" />남은 사망보험금(오른쪽 숫자)</span>
      </div>
    </R>
    <Item i={4} tag="핵심" title="돌려받는 돈 + 남은 사망보험금 = 언제나 가입금액">
      페이백은 새로 생기는 돈이 아닙니다. 사망보험금 일부를 살아 있을 때 미리 받는 것입니다. 많이 돌려받을수록
      유족이 받을 사망보험금은 그만큼 줄고, 일찍 사망하면 페이백은 덜 받는 대신 사망보험금이 더 남습니다.
    </Item>
    <Note i={5} tone="teal">
      그래서 이 상품이 실제로 주는 것은 &lsquo;더 많은 돈&rsquo;이 아니라 <b>돈을 받는 시점을 앞당기는 권리(유동성)</b>입니다.
    </Note>
  </Slide>,

  /* 6 숫자 예시 */
  <Slide key="numbers" section={S1} title="숫자로 보면 이렇습니다" lead="보고서의 개략 추정입니다(남자 40세 · 가입금액 1억원 · 20년납 · 실효 2% 체증 · 예정이율 2.5% 가정).">
    <R i={3}>
      <table className="w-full text-[13px]">
        <tbody>
          {[
            ["첫 월 보험료", "약 23.4만원", "평준형(약 26만원)의 90% 수준"],
            ["20년 동안 낸 돈", "약 6,360만원", "첫 보험료 × 271.7개월분"],
            ["페이백 받는 기간", "65세 ~ 85세", "납입기간(20년)과 같은 기간"],
            ["페이백 후 남는 사망보험금", "약 3,640만원", "가입금액의 36%"],
            ["실제로 받을 것으로 기대되는 비율", "약 75~80%", "살아 있어야 받으므로"],
            ["현재가치로 따지면", "명목의 약 65~70%", "생존확률 + 이자 반영"],
          ].map(([k, v, s]) => (
            <tr key={k} className="border-b border-border align-baseline">
              <td className="py-1.5 pr-2 text-foreground">{k}</td>
              <td className="py-1.5 pr-2 text-[11.5px] text-tertiary">{s}</td>
              <td className="py-1.5 text-right font-semibold whitespace-nowrap text-primary">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </R>
    <Item i={4} tag="주의" tone="amber" title="납입기간이 길수록 덜 돌려받아요">
      30세에 30년납으로 가입하면 페이백이 65~95세에 걸쳐 이뤄지므로, 살아서 받는 비율이 60% 안팎으로 떨어집니다.
      못 받은 몫은 사망보험금으로 유족에게 갑니다.
    </Item>
    <Note i={5} tone="slate">
      낸 보험료를 &lsquo;명목 금액 그대로&rsquo; 돌려주므로 그동안의 이자(시간가치)는 붙지 않습니다.
    </Note>
  </Slide>,

  /* 7 정정할 표현 */
  <Slide key="fix" section={S1} title="알고 보면 다른, 세 가지 표현" lead="회사의 상품 요약서와 실제 작동 방식 사이에서 보고서가 찾아낸 간극입니다.">
    <Item i={3} tag="1" tone="rose" title="&lsquo;보장은 기존과 동일&rsquo; → 정확히는 &lsquo;총 수령액이 동일&rsquo;">
      페이백을 받는 동안 사망보험금은 매달 줄어듭니다. 보장이 그대로라고 이해하면 오해이고, 저축 상품으로 잘못 팔릴
      소지가 있습니다.
    </Item>
    <Item i={4} tag="2" tone="rose" title="&lsquo;물가연동&rsquo; 할인 → 실제 물가가 아니라 한국은행 목표치">
      목표치는 2016년 이후 계속 2%입니다. 실제 소비자물가는 2022년 5%를 넘었고 2023년에도 3%대였지만 할인은 변하지
      않았습니다. 오히려 목표치가 올라가면 할인폭이 줄어 계약자 부담이 커집니다.
    </Item>
    <Item i={5} tag="3" tone="rose" title="&lsquo;돌려받는다&rsquo; → 이자 없는 원금 분할 환급">
      낸 금액을 그대로 나눠 받으므로 화폐의 시간가치만큼 계약자에게 불리하고, 그 차이가 회사의 재원이 됩니다.
    </Item>
    <Note i={6} tone="amber">가입 전에는 &lsquo;보장 금액이 언제 얼마로 줄어드는지&rsquo; 연도별 예시표로 확인하는 것이 가장 중요합니다.</Note>
  </Slide>,

  /* 8 왜 3개월 */
  <Slide key="why3" section={S1} title="배타권이 6개월이 아닌 3개월인 이유" lead="2026년 1월 2일부터 모든 생명보험사(19개사)에서 '사망보험금 유동화'를 신청할 수 있습니다. 페이백과 기능이 비슷합니다.">
    <R i={3}>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="border-b border-border text-tertiary">
            <th className="py-1 text-left font-medium" />
            <th className="py-1 text-left font-medium">사망보험금 유동화</th>
            <th className="py-1 text-left font-medium text-primary">이 상품의 페이백</th>
          </tr>
        </thead>
        <tbody className="align-top">
          {[
            ["언제 정하나", "계약 후 필요할 때 신청", "가입할 때 일정 확정"],
            ["대상", "만 55세 이상 · 납입 완료", "모든 계약자 자동"],
            ["돈의 출처", "해약환급금", "낸 보험료(사망보험금에서 차감)"],
            ["받는 금액", "적립액·공시이율 등에 따라", "낸 보험료와 같은 금액"],
            ["중단·재신청", "가능", "규정 확인 안 됨"],
            ["오래 살면", "종신연금형은 총액 증가", "총액 그대로"],
          ].map(([k, a, b]) => (
            <tr key={k} className="border-b border-border">
              <td className="py-1.5 pr-2 font-medium text-foreground">{k}</td>
              <td className="py-1.5 pr-2">{a}</td>
              <td className="py-1.5">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </R>
    <Note i={4}>
      &lsquo;살아 있을 때 사망보험금을 쓴다&rsquo;는 기능은 이미 제도로 열려 있습니다. 심사위원회는 그 기능을 <b>가입 시점에
      자동으로 정하고 1대1로 단순하게 만든 방식</b>의 독창성을 인정하되, 기간은 3개월로 판단한 것으로 보입니다.
    </Note>
  </Slide>,

  /* 9 국내 */
  <Slide key="domestic" section={S2} title="국내에는 어떤 비슷한 상품이 있을까?">
    <R i={2}>
      <p className="text-[12.5px] font-semibold text-foreground">사망보험금을 살아서 쓰는 방식</p>
      <ul className="mt-1 space-y-1">
        <li><b className="font-semibold text-foreground">사망보험금 유동화</b> — 2025.10 5개사 → 2026.1.2 전 생명보험사. 해약환급금으로 연금·분할·일시금 수령</li>
        <li><b className="font-semibold text-foreground">연금전환특약</b> — 적립금을 연금으로 전환(LTC·3대질병 연금전환 포함)</li>
        <li><b className="font-semibold text-foreground">생활자금 전환</b> — 교보3밸런스보장보험 PLUS 등, 납입 완료 후 일부를 생활비로</li>
      </ul>
    </R>
    <R i={3}>
      <p className="text-[12.5px] font-semibold text-foreground">무언가가 &lsquo;체증&rsquo;하는 종신보험</p>
      <ul className="mt-1 space-y-1">
        <li><b className="font-semibold text-foreground">한화생명 제로백H</b> — 1년 후부터 110세까지 사망보험금 매년 10% 증가</li>
        <li><b className="font-semibold text-foreground">교보밸류업 · 동양 · 신한 · iM · 푸본현대</b> — 사망보험금 20~30% 체증형</li>
        <li><b className="font-semibold text-foreground">ABL 우리WON더드림</b> — 경과기간에 따라 가입금액의 100%→최대 200%</li>
      </ul>
    </R>
    <R i={4} className="grid grid-cols-2 gap-3">
      <div className="rounded-lg bg-[var(--chip-slate-bg)] p-3">
        <p className="text-[12px] text-tertiary">시장 주류</p>
        <p className="mt-1 font-semibold text-foreground">사망보험금을 키움</p>
        <p className="mt-1 text-[12.5px]">상속·증여 재원 → 자산가 대상</p>
      </div>
      <div className="rounded-lg bg-[var(--chip-blue-bg)] p-3">
        <p className="text-[12px] text-[var(--chip-blue-fg)]">이 상품</p>
        <p className="mt-1 font-semibold text-foreground">보험료를 키우고 보장은 줄임</p>
        <p className="mt-1 text-[12.5px]">부담 이연 + 생전 현금 → 근로소득자 대상</p>
      </div>
    </R>
    <Note i={5} tone="slate">방향이 정반대라 경쟁 상대가 겹치지 않는다는 점이 실질적인 차별화 요소입니다.</Note>
  </Slide>,

  /* 10 해외 */
  <Slide key="overseas" section={S2} title="해외에서는 이미 시도됐을까?">
    <Item i={2} tag="일본" title="아카운트형(자유설계형) 종신보험">
      보험료 중 저축과 보장 몫을 계약자가 나눠 정하는 구조로 1990년대 후반 상용화. 구조가 복잡하고 갱신 때 보험료가
      올라 지금은 거의 팔리지 않습니다.
    </Item>
    <Item i={3} tag="일본" title="수입보장보험">
      사망보험금을 남은 기간 동안 매달 연금처럼 지급하고, 시간이 지날수록 총액이 줄어듭니다.
    </Item>
    <Item i={4} tag="미국" tone="violet" title="유니버설 라이프">
      보험료를 얼마나, 언제 낼지 바꾸면 보장과 적립금이 다시 계산됩니다. 다만 운용 실적에 따라 달라져 투자위험을
      계약자가 집니다.
    </Item>
    <Item i={5} tag="일본" title="저해약반려금형">
      납입 중 해약환급금을 낮춰 보험료를 줄이는 방식으로, 국내 저해지환급형과 같습니다.
    </Item>
    <Note i={6}>
      &lsquo;보험료를 먼저 정한다&rsquo;는 생각 자체는 새롭지 않습니다. 이 상품의 독창성은 그것을 <b>투자위험 없이 정액
      차감으로</b> 구현한 데 있고, 일본 사례처럼 성패는 <b>고객이 세 장치를 이해하느냐</b>에 달려 있습니다.
    </Note>
  </Slide>,

  /* 11 리스크 1 */
  <Slide key="risk1" section={S3} title="리스크 ① 계약자와 판매 현장" lead="각 리스크와 보고서가 제시한 대응을 함께 정리했습니다.">
    <Item i={3} tag="역선택" tone="rose" title="건강한 사람만 인상을 멈춘다면">
      남는 계약자의 사망률이 예상보다 나빠집니다. <b className="font-semibold text-foreground">대응</b>: 감액 계산에 선택효과 조정계수 반영,
      옵션 행사를 계약 기간 중 1회로 제한, 최소 유지기간 요건.
    </Item>
    <Item i={4} tag="모럴해저드" tone="rose" title="페이백 직전에 해지하거나 실효되는 경우">
      돈이 급해 개시 직전에 해지하거나, 무리하게 유지하다 실효될 수 있습니다. <b className="font-semibold text-foreground">대응</b>: 개시 전
      구간에 납입유예·보험료 감액 같은 유지 지원 장치.
    </Item>
    <Item i={5} tag="판매채널" tone="rose" title="수수료 기준에 따라 판매가 왜곡">
      첫 보험료가 낮아 팔기는 쉽지만, 초기 보험료 기준이면 판매 의욕이 약하고 평준 환산 기준이면 유지되지 않는 계약에
      과다 지급됩니다. <b className="font-semibold text-foreground">대응</b>: 전체 기간 현가 기준 + 유지 실적 연동 분급.
    </Item>
  </Slide>,

  /* 12 리스크 2 */
  <Slide key="risk2" section={S3} title="리스크 ② 제도·데이터·회계">
    <Item i={2} tag="재보험" tone="amber" title="계약자 행동 위험은 넘길 곳이 없어요">
      사망위험은 재보험으로 넘길 수 있지만, 옵션 행사율·해지율 같은 행동위험은 재보험 대상이 아닙니다. → 사망위험만
      표준 재보험, 행동위험은 자체 보유·자본으로 흡수.
    </Item>
    <Item i={3} tag="규제" tone="amber" title="저축으로 오인 판매될 위험">
      &lsquo;매달 돌려받는다&rsquo;는 광고는 감독당국 시정 대상이 될 수 있고, 유동화 제도와 중복 적용 문제도 정리되지 않았습니다.
      → 총 수령액 기준 표현 통일, 보험료·사망보험금 추이표 필수 안내, 유동화 중복 여부 약관 명시.
    </Item>
    <Item i={4} tag="데이터" tone="amber" title="옵션 행사 경험이 국내에 전혀 없어요">
      면접 조사로 확인한 선호와 실제 행동은 다릅니다. → 납입유예·감액완납 경험을 대리변수로 쓰고, 초기 2~3년은 가정을
      매년 재검토.
    </Item>
    <Item i={5} tag="회계" tone="amber" title="이익 인식이 늦어지고 부채 만기가 짧아져요">
      보험료가 뒤로 몰려 보험계약마진(CSM) 인식이 늦어지고, 보험료 급등 구간에 해지가 몰릴 수 있습니다. 반면
      65세 이후 확정 지급으로 부채 듀레이션은 짧아져 금리위험은 줄어듭니다.
    </Item>
  </Slide>,

  /* 13 경쟁 */
  <Slide key="compete" section={S3} title="경쟁사는 얼마나 쉽게 따라 할까?">
    <R i={2} className="grid grid-cols-3 gap-2 text-center">
      {[
        ["데이터 장벽", "없음", "새 위험률 불필요"],
        ["제휴 장벽", "없음", "외부 기관 불필요"],
        ["시스템 장벽", "중간", "실시간 재산정 엔진"],
      ].map(([k, v, s], n) => (
        <div key={k} className={`rounded-lg p-2.5 ${n === 2 ? "bg-[var(--chip-amber-bg)]" : "bg-[var(--chip-slate-bg)]"}`}>
          <p className="text-[11.5px] text-tertiary">{k}</p>
          <p className="mt-0.5 text-[17px] font-bold text-foreground">{v}</p>
          <p className="text-[11px]">{s}</p>
        </div>
      ))}
    </R>
    <R i={3}>
      <p>
        유일한 장벽은 보험료가 바뀔 때마다 사망보험금·준비금을 다시 계산하는 시스템입니다. 대형사는 3~6개월이면 만들 수
        있어 <b className="font-semibold text-foreground">배타권 종료 시점과 거의 맞물립니다</b>. 다만 이미 유동화 제도가 있어 따라 할 유인은 크지 않을 수 있습니다.
      </p>
    </R>
    <R i={4}>
      <p className="text-[12.5px] font-semibold text-foreground">예상되는 우회 진입</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        <li>유동화를 가입 때 미리 예약하는 상품 (가장 개연성 높음)</li>
        <li>목표치 대신 실제 소비자물가지수에 연동</li>
        <li>체증 중지 대신 감액·납입유예·부분 인출 조합</li>
        <li>사망보험금 체증형 + 페이백 결합</li>
      </ul>
    </R>
    <Note i={5} tone="slate">이 진입 경로가 곧 ④의 개선 제안이 먼저 선점해야 할 지점입니다.</Note>
  </Slide>,

  /* 14 가치 해체 */
  <Slide key="value" section={S4} title="이 상품이 진짜 파는 것은 '시점 선택권'" lead="개선 방향을 찾기 위해 상품의 가치를 분해했습니다.">
    <Item i={3} tag="핵심 기능" title="보험료를 소득 흐름에 맞추고, 노후에 월 현금흐름으로 돌려줌">
      보험료를 낼 시기와 돌려받을 시기를 생애 흐름에 맞춰 재배치합니다.
    </Item>
    <Item i={4} tag="고객의 고민" tone="rose" title="비싸진 보험료, 살아서는 쓸 수 없는 보험금">
      보장이 필요한 건 알지만 현금 사정 때문에 가입을 포기하거나 중도 해지합니다.
    </Item>
    <Item i={5} tag="제공 가치" tone="teal" title="사망보장을 지키면서 현금흐름의 통제권을 돌려줌">
      급부의 총량이 아니라, 받는 시점을 고를 수 있다는 것이 실제 가치입니다.
    </Item>
    <Note i={6} tone="amber">
      그런데 지금은 그 선택권이 충분히 유연하지 않습니다. <b>개시 시점은 공식으로 고정</b>, <b>지급기간은 납입기간으로 고정</b>,
      아프거나 요양이 필요해도 <b>앞당길 수 없습니다</b>. 제안은 이 폭을 넓히는 방향입니다.
    </Note>
  </Slide>,

  /* 15 제안 8 */
  <Slide key="ideas" section={S4} title="네 갈래, 여덟 가지 제안">
    <R i={2}>
      <table className="w-full text-[12.5px]">
        <tbody className="align-top">
          {[
            ["확장", "페이백 조기개시 트리거", "장기요양·중대질병이면 65세 전이라도 즉시 개시", "1순위"],
            ["확장", "페이백 수령권 배우자 승계", "개시 후 사망 시 남은 회차를 배우자가 이어받음", "2순위"],
            ["집중", "요양 가속형 페이백", "요양 진입 후 월 환급액 2배, 기간 절반", "1순위"],
            ["집중", "지출 정점 납입 완화", "자녀 교육비 구간(최대 3년) 납입유예·체증 일시정지", "2순위"],
            ["전환", "실제 소비자물가지수 연동", "목표치 대신 통계청 CPI로 할인율 재산정", "1순위"],
            ["전환", "페이백 현물 선택권", "현금 대신 요양·건강관리 바우처(10% 가산)", "3순위"],
            ["재구성", "'보험료 월급 통장' 포지셔닝", "'65세부터 매월 얼마'를 첫 화면에", "2순위"],
            ["재구성", "지출 곡선 기준 재설계", "교육비 정점 구간은 체증하지 않는 스케줄", "3순위"],
          ].map(([f, t, d, p]) => (
            <tr key={t} className="border-b border-border">
              <td className="py-1.5 pr-2"><Chip tone={f === "확장" ? "blue" : f === "집중" ? "teal" : f === "전환" ? "violet" : "slate"}>{f}</Chip></td>
              <td className="py-1.5 pr-2"><b className="font-semibold text-foreground">{t}</b><span className="block text-[12px]">{d}</span></td>
              <td className={`py-1.5 text-right whitespace-nowrap text-[12px] font-semibold ${p === "1순위" ? "text-primary" : "text-tertiary"}`}>{p}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </R>
  </Slide>,

  /* 16 1순위 상세 */
  <Slide key="top" section={S4} title="1순위 제안 세 가지, 자세히">
    <Item i={2} tag="확장" title="페이백 조기개시 트리거">
      장기요양 1·2등급 판정이나 중대질병 진단이 확정되면 나이와 관계없이 페이백을 즉시 시작합니다. 월 환급액·총액은
      그대로이고 시점만 앞당겨 추가 급부가 없습니다. 유동화 제도에는 없는 &lsquo;사건 기반 개시&rsquo;라는 점이 강점이며, 유족 보장이
      빨리 줄어드는 점은 확인서로 안내합니다.
    </Item>
    <Item i={3} tag="집중" tone="teal" title="요양 가속형 페이백">
      페이백 중 장기요양 판정을 받으면 이후 월 환급액을 2배(선택형 3배)로 늘리고 남은 회차를 줄입니다. 총액은 같고
      속도만 바뀌어, 요양비가 몰리는 시기에 현금을 집중합니다.
    </Item>
    <Item i={4} tag="전환" tone="violet" title="실제 소비자물가지수 연동">
      직전 1년 소비자물가 상승률로 매년 할인율을 다시 정합니다. 연간 조정폭은 상한 3%p·하한 0%로 묶고 누적 한도를 둡니다.
      명칭과 실제가 일치하고, 계약자가 지던 정책 변경 위험이 사라지며, 경쟁사의 우회로를 먼저 막습니다.
    </Item>
  </Slide>,

  /* 17 로드맵 */
  <Slide key="road" section={S4} title="언제, 무엇부터 할까" lead="배타권이 3개월뿐이므로 첫 단계 안에 후속 차별화를 확정해야 합니다.">
    {[
      ["1단계", "0~3개월", "실제 물가지수 연동 전환 · 월급 통장 포지셔닝 · 판매자료 표현 정정", "'총 수령액 동일'로 통일, 연도별 사망보험금 추이표를 청약 필수 안내로"],
      ["2단계", "3~9개월", "조기개시 트리거 · 요양 가속형 · 지출 정점 납입 완화", "장기요양 판정률·요양 후 사망률 확보, 부채 듀레이션 영향을 ALM에 반영"],
      ["3단계", "9~18개월", "배우자 승계 · 현물 선택권 · 지출 곡선 재설계", "상속·증여 세제 검토, 제휴 네트워크 지역 확보, 산출 시스템 확장"],
    ].map(([s, t, what, prep], k) => (
      <R key={s} i={3 + k} className="flex gap-3 border-t border-border pt-2.5">
        <div className="w-16 shrink-0">
          <p className="text-[15px] font-bold text-primary">{s}</p>
          <p className="text-[11.5px] text-tertiary">{t}</p>
        </div>
        <div>
          <p className="font-semibold text-foreground">{what}</p>
          <p className="mt-0.5 text-[12.5px]">준비: {prep}</p>
        </div>
      </R>
    ))}
    <Note i={6} tone="slate">
      보고서는 또 하나의 무기로 <b>세 장치의 상호작용을 한 장으로 보여 주는 시뮬레이터</b>를 꼽습니다. 이 계열 상품이 늘
      복잡성 때문에 실패했기 때문입니다.
    </Note>
  </Slide>,

  /* 18 마무리 */
  <Slide key="end" section="정리" title="가입을 고민한다면 이것만은 확인하세요">
    <R i={2}>
      <ol className="space-y-2">
        {[
          ["연도별 보험료 추이표", "언제, 얼마까지 오르는지 · 할인 조건이 바뀌면 어떻게 되는지"],
          ["연도별 사망보험금 추이표", "페이백을 받는 동안 유족 보장이 얼마로 줄어드는지"],
          ["총 수령액 = 가입금액", "새로 생기는 돈이 아니라 사망보험금을 미리 받는 구조"],
          ["저축 상품이 아니에요", "이자가 붙지 않는 보장성 상품, 해지하면 손해가 클 수 있음"],
        ].map(([t, d], k) => (
          <li key={t} className="flex gap-3">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-semibold text-white">{k + 1}</span>
            <span><b className="font-semibold text-foreground">{t}</b><span className="block text-[12.5px]">{d}</span></span>
          </li>
        ))}
      </ol>
    </R>
    <Note i={3}>배타적사용권: 2026년 9월 2일 부여 · 2건 각 3개월 → 2026년 12월 2일 만료</Note>
    <R i={4} className="text-[11.5px] text-tertiary">
      분석 한계: 약관·산출방법서를 확인하지 못한 공개 자료 기반 분석이며, 할인 산식·감액 산식·수치는 추정입니다.
      전체 보고서는 아래 PDF에서 볼 수 있습니다.
    </R>
  </Slide>,
];

export const heungkukFlexReturn100: Deck = {
  title: "흥국생명 플렉스 리턴100종신보험",
  sections: [
    { label: "표지", start: 0 },
    { label: "내용·구조", start: 1 },
    { label: "유사상품", start: 9 },
    { label: "리스크", start: 11 },
    { label: "개선 제안", start: 14 },
  ],
  slides,
};
