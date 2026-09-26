// build_engine.js — 22개 장 페이지의 공통 CSS/JS 를 /engine.css · /engine.js 로 뽑아낸다
//
// 왜: 페이지 하나가 44KB 인데 그중 37KB(CSS 11 + 로직 26)가 22번 복붙된 같은 코드였다.
//     버그 하나를 고치려면 22곳을 고쳐야 했고, 실제로 몇 곳이 빠져 동작이 갈렸다.
//
// 방식: 장마다 다른 것(장 번호·mp3·본문·문제묶음)만 페이지에 남기고 나머지는 엔진으로.
//       **페이지의 나머지 로직이 엔진과 한 글자라도 다르면 그 페이지는 건드리지 않는다.**
//
// 사용: node build_engine.js          (검사만, 파일은 쓰지 않음)
//       node build_engine.js --write  (실제 적용)
'use strict';
const fs = require('fs');
const path = require('path');

const WRITE = process.argv.includes('--write');
const REF = 'bjtest10';                 // 기준 페이지
const VER = '20260927';                 // 캐시 버스팅 — 엔진을 고칠 때마다 올린다
const CHAPTERS = Array.from({ length: 22 }, (_, i) => i + 1);

const reScript = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/;
const reStyle = /<style>([\s\S]*?)<\/style>/;

// 페이지에서 「설정·데이터」와 「로직」을 갈라낸다
function split(html, ch) {
  const js = (html.match(reScript) || [])[1];
  if (!js) return null;

  const grabs = {};
  let logic = js;

  // ① mp3 경로
  const mAudio = logic.match(/^[ \t]*const audioPath = "([^"]*)";[ \t]*\r?\n/m);
  if (mAudio) { grabs.audio = mAudio[1]; logic = logic.replace(mAudio[0], ''); }

  // ② 본문 배열  const versesN = [ … ];
  const mVerses = logic.match(new RegExp(`^[ \\t]*const verses${ch} = \\[[\\s\\S]*?\\n[ \\t]*\\];[ \\t]*\\r?\\n`, 'm'));
  if (!mVerses) return null;
  grabs.verses = mVerses[0].replace(new RegExp(`const verses${ch}`), 'const verses');
  logic = logic.replace(mVerses[0], '');

  // ③ 문제 묶음  const quizData = [ … ];
  const mQuiz = logic.match(/^[ \t]*const quizData = \[[\s\S]*?\n[ \t]*\];[ \t]*\r?\n/m);
  if (!mQuiz) return null;
  grabs.quiz = mQuiz[0];
  logic = logic.replace(mQuiz[0], '');

  // 로직 쪽에 남은 장 고유 표현을 일반형으로 — 이래야 장끼리 비교가 된다
  logic = logic
    .replace(new RegExp(`verses${ch}`, 'g'), 'verses')
    .replace(new RegExp(`계시록 ${ch}장`, 'g'), '계시록 ${CH}장')
    .replace(/\/\/ 📖 계시록 \d+장 원문 데이터[^\n]*\n/g, '')
    .replace(/\/\/ 🎧 오디오 플레이어 \([^)]*\)[^\n]*\n/g, '')
    .replace(/\/\/ [^\n]*절을 [^\n]*묶[^\n]*\n/g, '')
    .replace(/\/\/ \d+절씩[^\n]*\n/g, '')
    .replace(/const totalVerses = verses\.length;[^\n]*/g, 'const totalVerses = verses.length;')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n');

  return { logic, ...grabs, quiz: grabs.quiz.replace(new RegExp(`verses${ch}`, 'g'), 'verses') };
}

// 비교용: 주석·빈 줄·들여쓰기를 뺀 알맹이만 남긴다 (장마다 주석 문구가 조금씩 달라서)
//
// 아래 세 가지는 「장마다 갈린 것」이 확인되어, 옳은 쪽으로 통일한 뒤 비교한다.
// 통일 내용은 엔진에도 그대로 들어간다 (PATCHES 참고).
//   ① 채점 시 괄호 무시 — 20·21·22장만 하고 있었다 → 전부 하도록
//   ② 마스터 축하 조건 — 21개 장이 아직 3단계 기준이다. 4단계가 생겼으므로 4가 옳다 (1장만 갱신돼 있었음)
//   ③ totalVerses — 1장만 이 상수 없이 숫자를 직접 박아 두었다
function bare(js) {
  return js
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\.trim\(\)\.replace\(\/,\/g, ''\)/g, ".trim().replace(/[,()]/g, '')")          // ①
    .replace(/activeLevel === 3\) rankText = "👑/g, 'activeLevel === 4) rankText = "👑')      // ②
    .replace(/const totalVerses = verses\.length;\s*\n/g, '')                                  // ③
    .replace(/\$\{totalVerses\}/g, '${verses.length}')
    .replace(/examScore === totalVerses/g, 'examScore === verses.length')
    .replace(/currentExamIndex >= totalVerses/g, 'currentExamIndex >= verses.length')
    .replace(/`\$\{examScore\} \/ 20`/g, '`${examScore} / ${verses.length}`')                  // 1장이 절 수 20을 박아 둠
    .replace(/examScore === 20/g, 'examScore === verses.length')
    .replace(/\$\{currentExamIndex \+ 1\} \/ 20 절/g, '${currentExamIndex + 1} / ${verses.length} 절')
    .split(/\r?\n/)
    .map(function (l) { return l.replace(/^\s*\/\/.*$/, '').replace(/\s+\/\/[^'"`]*$/, '').trim(); })
    .filter(function (l) { return l; })
    .join('\n');
}

// 엔진에 적용할 수정 — 위 ①②를 실제로 반영한다
const PATCHES = [
  [/\.trim\(\)\.replace\(\/,\/g, ''\)/g, ".trim().replace(/[,()]/g, '')"],
  [/activeLevel === 3\) rankText = "👑/g, 'activeLevel === 4) rankText = "👑'],
  // ${CH} 를 넣은 문장은 큰따옴표라 그대로는 치환되지 않는다 → 템플릿 문자열로
  [/"(👑 계시록 \$\{CH\}장[^"]*)"/g, '`$1`'],
  [/\/\/ 📖 계시록 \$\{CH\}장 원문 데이터[^\n]*\n/g, ''],
];

// ── 기준 페이지에서 엔진 만들기 ──
const refHtml = fs.readFileSync(path.join(REF, 'index.html'), 'utf8');
const refCss = (refHtml.match(reStyle) || [])[1];
const refSplit = split(refHtml, 10);
if (!refSplit) { console.error('기준 페이지를 가를 수 없습니다.'); process.exit(1); }

const ENGINE_JS =
`// engine.js — 계시록 장별 학습 페이지 공통 엔진
//
// 각 페이지(bjtest{N}/index.html)가 아래 네 가지를 먼저 선언한 뒤 이 파일을 불러온다.
//   const CH     = 10;              // 장 번호
//   const AUDIO  = "mp3/10.mp3";    // 낭독 파일. 없으면 null
//   const verses = [ … ];           // 본문 (절 문자열 배열, {중괄호}는 1단계 빈칸)
//   const quizData = [ … ];         // 학습 묶음
//
// ⚠️ 이 파일을 고치면 index.html 들의 ?v= 값을 함께 올려야 브라우저 캐시가 갱신된다.
'use strict';

const audioPath = (typeof AUDIO !== 'undefined' && AUDIO) ? AUDIO : null;
${refSplit.logic.trimEnd()}
`;

// 오디오가 없는 장을 대비 — globalAudio 생성을 안전하게 + 위 PATCHES 적용
let ENGINE_JS_SAFE = ENGINE_JS.replace(
  /const globalAudio = new Audio\(audioPath\);/,
  'const globalAudio = audioPath ? new Audio(audioPath) : null;');
for (const [re, to] of PATCHES) ENGINE_JS_SAFE = ENGINE_JS_SAFE.replace(re, to);

const ENGINE_CSS =
`/* engine.css — 계시록 장별 학습 페이지 공통 스타일
   ⚠️ 고치면 index.html 들의 ?v= 값을 함께 올릴 것 */
${refCss.trim()}
`;

// ── 각 장 검사 ──
const okPages = [], badPages = [];
for (const ch of CHAPTERS) {
  const file = path.join(`bjtest${ch}`, 'index.html');
  const html = fs.readFileSync(file, 'utf8');
  const s = split(html, ch);
  if (!s) { badPages.push([ch, '설정·데이터를 가를 수 없음']); continue; }
  if (bare(s.logic) !== bare(refSplit.logic)) {
    // 어디가 다른지 첫 줄만 보고
    const a = bare(refSplit.logic).split('\n'), b = bare(s.logic).split('\n');
    let at = -1;
    for (let i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) { at = i; break; }
    badPages.push([ch, `로직이 다름 (${at + 1}행 — 기준 "${(a[at] || "(없음)").slice(0, 45)}" / 이 장 "${(b[at] || "(없음)").slice(0, 45)}")`]);
    continue;
  }
  const css = (html.match(reStyle) || [])[1] || '';
  okPages.push([ch, s, css.trim() === refCss.trim()]);
}

console.log(`기준: ${REF}`);
console.log(`엔진 JS ${(ENGINE_JS_SAFE.length / 1024).toFixed(1)}KB · CSS ${(ENGINE_CSS.length / 1024).toFixed(1)}KB\n`);
console.log(`교체 가능: ${okPages.length}개 — ${okPages.map(p => p[0] + '장').join(', ')}`);
const cssDiff = okPages.filter(p => !p[2]).map(p => p[0]);
if (cssDiff.length) console.log(`  (그중 CSS가 미세하게 다른 장: ${cssDiff.join(', ')} — 주석 차이면 무시해도 됨)`);
if (badPages.length) {
  console.log(`\n손대지 않음: ${badPages.length}개`);
  for (const [ch, why] of badPages) console.log(`  ${ch}장 — ${why}`);
}

if (!WRITE) { console.log('\n(검사만 했습니다. 적용하려면 --write)'); process.exit(0); }

// ── 적용 ──
fs.writeFileSync('engine.js', ENGINE_JS_SAFE, 'utf8');
fs.writeFileSync('engine.css', ENGINE_CSS, 'utf8');

let saved = 0;
for (const [ch, s] of okPages) {
  const file = path.join(`bjtest${ch}`, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const before = html.length;

  html = html.replace(reStyle, `<link rel="stylesheet" href="/engine.css?v=${VER}">`);
  html = html.replace(reScript,
    '<script>\n' +
    `    // 계시록 ${ch}장 — 이 페이지에만 해당하는 것\n` +
    `    const CH = ${ch};\n` +
    `    const AUDIO = ${s.audio ? JSON.stringify(s.audio) : 'null'};\n\n` +
    s.verses.trimEnd() + '\n\n' +
    s.quiz.trimEnd() + '\n' +
    '</script>\n' +
    `<script src="/engine.js?v=${VER}"></script>`);

  fs.writeFileSync(file, html, 'utf8');
  saved += before - html.length;
  console.log(`  ✔ ${ch}장  ${(before / 1024).toFixed(0)}KB → ${(html.length / 1024).toFixed(0)}KB`);
}
console.log(`\nengine.js · engine.css 생성 · ${okPages.length}개 페이지 교체 · 합계 ${(saved / 1024 / 1024).toFixed(2)}MB 감소`);
