// 카드뉴스(cards.html)·모션 슬라이드(motion.html) → PDF. 출력: _workspace/cardnews-pdf/<slug>/{cards,slides}.pdf
// 실행: node scripts/cardnews-pdf.cjs [slug...]   (Playwright는 tools/cardnews-kit 사본 사용)
const path = require("path"), fs = require("fs"), http = require("http");
const { chromium } = require(path.resolve("tools/cardnews-kit/node_modules/playwright"));
const ROOT = path.resolve("public"), OUT = path.resolve("_workspace/cardnews-pdf");
const CARD_CSS = `@page{size:640px 640px;margin:0}
html,body{background:#fff!important;padding:0!important;margin:0}
.wrap{max-width:none!important}.bar,.nav,.dots{display:none!important}.stage{margin:0!important}
.track{display:block!important;overflow:visible!important;border:0!important;border-radius:0!important;box-shadow:none!important}
.slide{width:640px!important;height:640px!important;aspect-ratio:auto!important;overflow:hidden!important;break-after:page}
.slide:last-child{break-after:auto}
.slide [data-r],.gy,.gx{opacity:1!important;transform:none!important;transition:none!important}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}`;
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split("?")[0]));
  fs.readFile(f, (e, b) => { if (e) { r.writeHead(404); return r.end(); } r.writeHead(200, { "content-type": f.endsWith(".html") ? "text/html; charset=utf-8" : "application/octet-stream" }); r.end(b); }); });
(async () => {
  await new Promise((ok) => srv.listen(0, ok)); const base = `http://127.0.0.1:${srv.address().port}`;
  const slugs = process.argv.slice(2).length ? process.argv.slice(2) : fs.readdirSync(path.join(ROOT, "cardnews"));
  const browser = await chromium.launch({ channel: "chrome" }); const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  for (const slug of slugs) {
    const dir = path.join(OUT, slug); fs.mkdirSync(dir, { recursive: true });
    await page.goto(`${base}/cardnews/${slug}/cards.html`, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: CARD_CSS }); await page.evaluate(() => document.fonts.ready);
    await page.pdf({ path: path.join(dir, "cards.pdf"), preferCSSPageSize: true, printBackground: true });
    await page.goto(`${base}/cardnews/${slug}/motion.html`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(500);
    await page.pdf({ path: path.join(dir, "slides.pdf"), preferCSSPageSize: true, printBackground: true });
    console.log("ok", slug);
  }
  await browser.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
