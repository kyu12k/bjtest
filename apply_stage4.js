// apply_stage4.js - 1~3단계 → 1~4단계 확장
const fs = require('fs');
const path = require('path');

const BASE_DIR = __dirname;

// ── 변경 1: 대시보드 3단계 컬럼 교체 ──────────────────────────────────────────
const OLD_DASHBOARD = `            <div class="stage-column">
                <button class="btn-stage" id="btnStage3" onclick="setMode('stage', 3)">👑 3단계 (전체)</button>
                <button class="btn-exam" id="btnExam3" onclick="setMode('exam', 3)">🏆 3단계 모의고사</button>
            </div>
        </div>`;

const NEW_DASHBOARD = `            <div class="stage-column">
                <button class="btn-stage" id="btnStage3" onclick="setMode('stage', 3)">💪 3단계 (심화)</button>
                <button class="btn-exam" id="btnExam3" onclick="setMode('exam', 3)">🏆 3단계 모의고사</button>
            </div>
            <div class="stage-column">
                <button class="btn-stage" id="btnStage4" onclick="setMode('stage', 4)">👑 4단계 (전체)</button>
                <button class="btn-exam" id="btnExam4" onclick="setMode('exam', 4)">🏆 4단계 모의고사</button>
            </div>
        </div>`;

// ── 변경 2: globalControls에 라운드 버튼 추가 ─────────────────────────────────
const OLD_GLOBAL = `        <div class="global-controls" id="globalControls">
            <button class="btn-dark" onclick="toggleTheme()">🌙 다크 모드</button>
            <button class="btn-toggle" onclick="toggleAll()">👁️ 전체 정답 보기/숨기기</button>
        </div>`;

const NEW_GLOBAL = `        <div class="global-controls" id="globalControls">
            <button class="btn-dark" onclick="toggleTheme()">🌙 다크 모드</button>
            <button class="btn-toggle" onclick="toggleAll()">👁️ 전체 정답 보기/숨기기</button>
            <button class="btn-toggle" id="roundBtn" onclick="nextRound()" style="display:none;">다음 라운드 →</button>
            <span id="roundDisplay" style="display:none; font-weight:bold; padding:6px 10px;">라운드 1/2</span>
        </div>`;

// ── 변경 3: 라운드 상태 변수 추가 ────────────────────────────────────────────
const OLD_STATE = `    let currentMode = 'stage'; \n    let activeLevel = 1; \n\n    function setMode(mode, level) {`;
const NEW_STATE = `    let currentMode = 'stage'; \n    let activeLevel = 1; \n    let currentRound = 1;\n    const TOTAL_ROUNDS = 2;\n\n    function setMode(mode, level) {`;

// ── 변경 4: setMode() - 라운드 UI 표시 ─────────────────────────────────────
const OLD_SETMODE = `        if (mode === 'stage') {
            document.getElementById('btnStage' + level).classList.add('active');
            document.getElementById('quiz-list').style.display = 'block';
            document.getElementById('exam-arena').style.display = 'none';
            document.getElementById('globalControls').style.display = 'flex';
            renderQuizzes();`;

const NEW_SETMODE = `        if (mode === 'stage') {
            document.getElementById('btnStage' + level).classList.add('active');
            document.getElementById('quiz-list').style.display = 'block';
            document.getElementById('exam-arena').style.display = 'none';
            document.getElementById('globalControls').style.display = 'flex';
            const showRound = level === 3;
            document.getElementById('roundBtn').style.display = showRound ? 'inline-block' : 'none';
            document.getElementById('roundDisplay').style.display = showRound ? 'inline-block' : 'none';
            if (showRound) { currentRound = 1; document.getElementById('roundDisplay').innerText = \`라운드 1/\${TOTAL_ROUNDS}\`; }
            renderQuizzes();`;

// ── 변경 5: renderQuizzes() - level 2/3/4 분리 ─────────────────────────────
const OLD_RENDER = `            } else if (activeLevel === 2 || activeLevel === 3) {
                let rawText = item.content.replace(/\\{|\\}/g, '');
                let lines = rawText.split('<br>');
                let parsedLines = lines.map(line => {
                    return line.split(' ').map((word, i) => {
                        if (!word) return '';
                        if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;
                        if (activeLevel === 2) return \`<span class="blank stage2-blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleStage2Word(this)">\${getChosung(word)}</span>\`;
                        return \`<span class="blank stage3-blank" data-answer="\${word}" onclick="toggleSingleBlank(this)">\${word}</span>\`;
                    }).join(' ');
                });
                htmlContent = parsedLines.join('<br>');
                controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer(\${index}, this)">전체 정답 보기</button>\`;
            }`;

const NEW_RENDER = `            } else if (activeLevel === 2) {
                let rawText = item.content.replace(/\\{|\\}/g, '');
                let lines = rawText.split('<br>');
                let parsedLines = lines.map(line => {
                    return line.split(' ').map((word, i) => {
                        if (!word) return '';
                        if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;
                        return \`<span class="blank stage2-blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleStage2Word(this)">\${getChosung(word)}</span>\`;
                    }).join(' ');
                });
                htmlContent = parsedLines.join('<br>');
                controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer(\${index}, this)">전체 정답 보기</button>\`;
            } else if (activeLevel === 3) {
                let rawText = item.content.replace(/\\{|\\}/g, '');
                let lines = rawText.split('<br>');
                let parsedLines = lines.map(line => {
                    let wordIdx = 0;
                    return line.split(' ').map((word) => {
                        if (!word) return '';
                        if (wordIdx === 0 && !isNaN(word)) { wordIdx++; return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`; }
                        const isBlank = (wordIdx % TOTAL_ROUNDS) === (currentRound - 1);
                        wordIdx++;
                        if (isBlank) return \`<span class="blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleSingleBlank(this)">\${word}</span>\`;
                        return word;
                    }).join(' ');
                });
                htmlContent = parsedLines.join('<br>');
                controlsHtml = \`<button class="btn-hint" onclick="toggleHint(\${index}, this)">초성 보기</button> <button class="btn-answer" onclick="toggleAnswer(\${index}, this)">정답 보기</button>\`;
            } else if (activeLevel === 4) {
                let rawText = item.content.replace(/\\{|\\}/g, '');
                let lines = rawText.split('<br>');
                let parsedLines = lines.map(line => {
                    return line.split(' ').map((word, i) => {
                        if (!word) return '';
                        if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;
                        return \`<span class="blank stage3-blank" data-answer="\${word}" onclick="toggleSingleBlank(this)">\${word}</span>\`;
                    }).join(' ');
                });
                htmlContent = parsedLines.join('<br>');
                controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer(\${index}, this)">전체 정답 보기</button>\`;
            }`;

// ── 변경 6: toggleAnswer else branch 수정 ───────────────────────────────────
const OLD_TOGGLE = `        else { btn.classList.remove('active'); btn.innerText = (activeLevel === 2 || activeLevel === 3) ? "전체 정답 보기" : "정답 보기"; blanks.forEach(b => { if (b.classList.contains('stage2-blank')) b.innerText = b.dataset.chosung; else b.innerText = b.dataset.answer; b.classList.remove('answer-mode'); }); }`;

const NEW_TOGGLE = `        else { btn.classList.remove('active'); btn.innerText = (activeLevel === 2 || activeLevel === 4) ? "전체 정답 보기" : "정답 보기"; blanks.forEach(b => { if (b.classList.contains('stage2-blank')) b.innerText = b.dataset.chosung; else b.innerText = b.dataset.answer; b.classList.remove('answer-mode'); }); }`;

// ── 변경 7: nextRound() 함수 추가 ───────────────────────────────────────────
const OLD_TOGGLEALL = `    function toggleAll() { const btns = document.querySelectorAll('.btn-answer'); isAllAnswersShown = !isAllAnswersShown; btns.forEach((btn, index) => { const isActive = btn.classList.contains('active'); if (isAllAnswersShown && !isActive) toggleAnswer(index, btn); else if (!isAllAnswersShown && isActive) toggleAnswer(index, btn); }); }`;

const NEW_TOGGLEALL = `    function toggleAll() { const btns = document.querySelectorAll('.btn-answer'); isAllAnswersShown = !isAllAnswersShown; btns.forEach((btn, index) => { const isActive = btn.classList.contains('active'); if (isAllAnswersShown && !isActive) toggleAnswer(index, btn); else if (!isAllAnswersShown && isActive) toggleAnswer(index, btn); }); }
    function nextRound() { currentRound = (currentRound % TOTAL_ROUNDS) + 1; document.getElementById('roundDisplay').innerText = \`라운드 \${currentRound}/\${TOTAL_ROUNDS}\`; renderQuizzes(); }`;

// ── 변경 8: showExamResult - activeLevel === 3 → 4 ───────────────────────────
const OLD_EXAM_RESULT = `        if(examScore === 20 && activeLevel === 3) rankText = `;
const NEW_EXAM_RESULT = `        if(examScore === 20 && activeLevel === 4) rankText = `;

const CHANGES = [
  ['대시보드 4단계 추가',      OLD_DASHBOARD,    NEW_DASHBOARD],
  ['라운드 버튼 추가',         OLD_GLOBAL,       NEW_GLOBAL],
  ['라운드 상태 변수 추가',    OLD_STATE,        NEW_STATE],
  ['setMode 라운드 처리',      OLD_SETMODE,      NEW_SETMODE],
  ['renderQuizzes 4단계 분리', OLD_RENDER,       NEW_RENDER],
  ['toggleAnswer 수정',        OLD_TOGGLE,       NEW_TOGGLE],
  ['nextRound 함수 추가',      OLD_TOGGLEALL,    NEW_TOGGLEALL],
  ['examResult 4단계 수정',    OLD_EXAM_RESULT,  NEW_EXAM_RESULT],
];

function processFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf-8');
  const original = content;
  const results = [];

  for (const [label, oldStr, newStr] of CHANGES) {
    if (content.includes(oldStr)) {
      content = content.split(oldStr).join(newStr);
      results.push(`  ✓ ${label}`);
    } else {
      results.push(`  ✗ ${label} (패턴 없음)`);
    }
  }

  if (content !== original) {
    fs.writeFileSync(filepath, content, 'utf-8');
    return { results, modified: true };
  }
  return { results, modified: false };
}

let changed = 0, skipped = 0;
for (let i = 1; i <= 22; i++) {
  const filepath = path.join(BASE_DIR, `bjtest${i}`, 'index.html');
  if (!fs.existsSync(filepath)) {
    console.log(`[bjtest${i}] 파일 없음, 건너뜀`);
    skipped++;
    continue;
  }
  const { results, modified } = processFile(filepath);
  console.log(`[bjtest${i}] ${modified ? '수정됨' : '변경 없음'}`);
  results.forEach(r => console.log(r));
  if (modified) changed++; else skipped++;
}
console.log(`\n완료: ${changed}개 수정, ${skipped}개 건너뜀`);
