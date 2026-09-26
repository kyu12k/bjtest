// apply_norm_unify.js — 채점 정규화 규칙을 전 페이지에 통일한다
//
// 배경: 같은 답을 써도 페이지마다 정답/오답이 갈렸다.
//   · 표준 36개 (normCmp)      — 공백·쉼표·보이지 않는 문자 제거
//   · bjtest_mock (norm)       — 위 + 마침표·가운뎃점·한중일 문장부호까지 제거 (가장 관대)
//   · bjtest_kingdom4a (normalize) — 쉼표만 제거하고 공백은 하나로 줄이기만 함
//                                    → 띄어쓰기가 틀리면 오답이 됐다 (다른 페이지에선 정답)
//
// 통일 방향: **가장 관대한 쪽(mock)에 맞춘다.**
//   느슨해지는 방향이라 지금까지 정답이던 답이 오답으로 바뀌는 일이 없다.
//
// 사용: node apply_norm_unify.js
const fs = require('fs');
const path = require('path');

// 새 표준 — 공백 · 보이지 않는 문자 · 쉼표 · 마침표 · 가운뎃점 · 한중일 문장부호를 모두 무시
const NEW_BODY = String.raw`        return (s || '').normalize('NFC').replace(/[\s​-‍⁠﻿,.·⋅、。]/g, '');`;

const dirs = fs.readdirSync(__dirname).filter((d) =>
  d.startsWith('bjtest') && fs.existsSync(path.join(__dirname, d, 'index.html')));

let changed = 0, skipped = 0, notice = 0;
const report = [];

for (const d of dirs) {
  const file = path.join(__dirname, d, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  const notes = [];

  // ① 표준 normCmp 본문 교체
  const reNormCmp = /(function normCmp\(s\)\s*\{\s*\n)[^\n]*\n(\s*\})/;
  if (reNormCmp.test(html)) {
    html = html.replace(reNormCmp, (m, head, tail) => head + NEW_BODY + '\n' + tail);
    notes.push('normCmp');
  }

  // ② bjtest_kingdom4a 의 normalize — 비교 전용이라 표준과 같은 규칙으로 바꾼다
  const reNormalize = /function normalize\(str\)\s*\{\s*\n\s*return \(str \|\| ''\)\.trim\(\)\.replace\(\/,\/g, ''\)\.replace\(\/\\s\+\/g, ' '\);\s*\n(\s*\})/;
  if (reNormalize.test(html)) {
    html = html.replace(reNormalize, (m, tail) =>
      "function normalize(str) {\n" +
      "        // 채점 정규화 — 다른 페이지와 같은 규칙 (공백·쉼표·마침표 등 무시)\n" +
      "        return (str || '').normalize('NFC').replace(/[\\s\\u200B-\\u200D\\u2060\\uFEFF,.\\u00B7\\u22C5\\u3001\\u3002]/g, '');\n" + tail);
    notes.push('normalize(kingdom4a)');
  }

  // ③ 안내 문구 — 마침표도 제외된다는 것을 알린다
  if (html.includes('쉼표(,)와 띄어쓰기는 채점에서 제외됩니다!')) {
    html = html.split('쉼표(,)와 띄어쓰기는 채점에서 제외됩니다!').join('쉼표·마침표·띄어쓰기는 채점에서 제외됩니다!');
    notes.push('안내문구');
    notice++;
  }

  if (html !== before) {
    fs.writeFileSync(file, html, 'utf8');
    changed++; report.push(`  ✔ ${d.padEnd(24)} ${notes.join(' · ')}`);
  } else {
    skipped++; report.push(`  – ${d.padEnd(24)} (해당 없음)`);
  }
}

console.log(report.join('\n'));
console.log(`\n대상 ${dirs.length}개 · 수정 ${changed}개 · 변화 없음 ${skipped}개 · 안내문구 ${notice}개`);
