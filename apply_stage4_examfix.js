// apply_stage4_examfix.js - 누락된 패턴 보완 (exam 폴더)
const fs = require('fs');
const path = require('path');
const BASE_DIR = __dirname;

function apply(c, label, old, nw, results) {
  if (c.includes(old)) { results.push('  ✓ ' + label); return c.split(old).join(nw); }
  results.push('  ✗ ' + label + ' (없음)');
  return c;
}

// ── bjtest1_2_exam: 대시보드 CRLF 버전 ──────────────────────────────────────
const OLD_DASH_12_CRLF = `            <div class="stage-column">\r\n                <button class="btn-stage" id="btnStage3" onclick="setMode('stage', 3)">👑 3단계 (전체)</button>\r\n                <button class="btn-exam" id="btnExam3" onclick="setMode('exam', 3)">🏆 3단계 모의고사</button>\r\n            </div>\r\n        </div>`;
const NEW_DASH_12_CRLF = `            <div class="stage-column">\r\n                <button class="btn-stage" id="btnStage3" onclick="setMode('stage', 3)">💪 3단계 (심화)</button>\r\n                <button class="btn-exam" id="btnExam3" onclick="setMode('exam', 3)">🏆 3단계 모의고사</button>\r\n            </div>\r\n            <div class="stage-column">\r\n                <button class="btn-stage" id="btnStage4" onclick="setMode('stage', 4)">👑 4단계 (전체)</button>\r\n                <button class="btn-exam" id="btnExam4" onclick="setMode('exam', 4)">🏆 4단계 모의고사</button>\r\n            </div>\r\n        </div>`;

// ── shuffle 버튼 있는 globalControls에 round 버튼 추가 (LF) ─────────────────
const OLD_GLOBAL_SHUFFLE_LF = `            <button class="btn-shuffle" id="shuffleBtn" onclick="reshuffleBlanks()">🔀 새 문제 만들기</button>\n        </div>`;
const NEW_GLOBAL_SHUFFLE_LF = `            <button class="btn-shuffle" id="shuffleBtn" onclick="reshuffleBlanks()">🔀 새 문제 만들기</button>\n            <button class="btn-toggle" id="roundBtn" onclick="nextRound()" style="display:none;">다음 라운드 →</button>\n            <span id="roundDisplay" style="display:none; font-weight:bold; padding:6px 10px;">라운드 1/2</span>\n        </div>`;

// ── shuffle 버튼 있는 globalControls에 round 버튼 추가 (CRLF) ────────────────
const OLD_GLOBAL_SHUFFLE_CRLF = `            <button class="btn-shuffle" id="shuffleBtn" onclick="reshuffleBlanks()">🔀 새 문제 만들기</button>\r\n        </div>`;
const NEW_GLOBAL_SHUFFLE_CRLF = `            <button class="btn-shuffle" id="shuffleBtn" onclick="reshuffleBlanks()">🔀 새 문제 만들기</button>\r\n            <button class="btn-toggle" id="roundBtn" onclick="nextRound()" style="display:none;">다음 라운드 →</button>\r\n            <span id="roundDisplay" style="display:none; font-weight:bold; padding:6px 10px;">라운드 1/2</span>\r\n        </div>`;

// ── toggleAll 뒤 nextRound 삽입 앵커 (LF) ────────────────────────────────────
const OLD_NEXT_ANCHOR_LF = `        });\n    }\n\n    // --- [🏆 모의고사 보스전 로직] ---`;
const NEW_NEXT_ANCHOR_LF = `        });\n    }\n    function nextRound() { currentRound = (currentRound % TOTAL_ROUNDS) + 1; document.getElementById('roundDisplay').innerText = \`라운드 \${currentRound}/\${TOTAL_ROUNDS}\`; renderQuizzes(); }\n\n    // --- [🏆 모의고사 보스전 로직] ---`;

// ── toggleAll 뒤 nextRound 삽입 앵커 (CRLF) ──────────────────────────────────
const OLD_NEXT_ANCHOR_CRLF = `        });\r\n    }\r\n\r\n    // --- [🏆 모의고사 보스전 로직] ---`;
const NEW_NEXT_ANCHOR_CRLF = `        });\r\n    }\r\n    function nextRound() { currentRound = (currentRound % TOTAL_ROUNDS) + 1; document.getElementById('roundDisplay').innerText = \`라운드 \${currentRound}/\${TOTAL_ROUNDS}\`; renderQuizzes(); }\r\n\r\n    // --- [🏆 모의고사 보스전 로직] ---`;

// ── bjtest12_exam: nextRound 앵커 다름 (보스전 주석 다름) ────────────────────
const OLD_NEXT_ANCHOR_12 = `        });\n    }\n\n    // --- [🏆 모의고사 보스전 로직] ---\n    const totalVerses`;
const NEW_NEXT_ANCHOR_12 = `        });\n    }\n    function nextRound() { currentRound = (currentRound % TOTAL_ROUNDS) + 1; document.getElementById('roundDisplay').innerText = \`라운드 \${currentRound}/\${TOTAL_ROUNDS}\`; renderQuizzes(); }\n\n    // --- [🏆 모의고사 보스전 로직] ---\n    const totalVerses`;

const EXAM_FOLDERS = ['bjtest1_2_exam', 'bjtest12_exam', 'bjtest13_exam', 'bjtest14_exam'];

let changed = 0;
EXAM_FOLDERS.forEach(name => {
  const filepath = path.join(BASE_DIR, name, 'index.html');
  if (!fs.existsSync(filepath)) return;
  let c = fs.readFileSync(filepath, 'utf-8');
  const original = c;
  const hasCR = c.includes('\r\n');
  const results = [];

  if (name === 'bjtest1_2_exam') {
    c = apply(c, '대시보드 CRLF',          OLD_DASH_12_CRLF,         NEW_DASH_12_CRLF,         results);
    c = apply(c, 'shuffle→round (CRLF)',  OLD_GLOBAL_SHUFFLE_CRLF,  NEW_GLOBAL_SHUFFLE_CRLF,  results);
    c = apply(c, 'nextRound (CRLF)',       OLD_NEXT_ANCHOR_CRLF,     NEW_NEXT_ANCHOR_CRLF,     results);
  } else if (name === 'bjtest12_exam') {
    c = apply(c, 'nextRound (12)',         OLD_NEXT_ANCHOR_12,       NEW_NEXT_ANCHOR_12,       results);
  } else {
    // bjtest13_exam, bjtest14_exam
    c = apply(c, 'shuffle→round (LF)',    OLD_GLOBAL_SHUFFLE_LF,    NEW_GLOBAL_SHUFFLE_LF,    results);
    c = apply(c, 'nextRound (LF)',         OLD_NEXT_ANCHOR_LF,       NEW_NEXT_ANCHOR_LF,       results);
  }

  if (c !== original) { fs.writeFileSync(filepath, c, 'utf-8'); changed++; console.log(`[${name}] 수정됨`); }
  else console.log(`[${name}] 변경 없음`);
  results.forEach(r => console.log(r));
});
console.log(`\n완료: ${changed}개 수정`);
