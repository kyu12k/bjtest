// apply_stage4_examfolders.js - 4개 exam 폴더에 1~4단계 확장 적용
const fs = require('fs');
const path = require('path');
const BASE_DIR = __dirname;

const EXAM_FOLDERS = ['bjtest1_2_exam', 'bjtest12_exam', 'bjtest13_exam', 'bjtest14_exam'];

// ── 공통: 대시보드 3단계 컬럼 교체 ──────────────────────────────────────────
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

// ── 공통: globalControls에 라운드 버튼 추가 ──────────────────────────────────
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

// ── 공통: setMode에서 renderQuizzes 호출 직전에 라운드 제어 삽입 (LF) ─────────
const OLD_SETMODE_RENDER_LF = `            renderQuizzes();\n        } else if (mode === 'exam')`;
const NEW_SETMODE_RENDER_LF = `            const showRound = activeLevel === 3;\n            document.getElementById('roundBtn').style.display = showRound ? 'inline-block' : 'none';\n            document.getElementById('roundDisplay').style.display = showRound ? 'inline-block' : 'none';\n            if (showRound) { currentRound = 1; document.getElementById('roundDisplay').innerText = \`라운드 1/\${TOTAL_ROUNDS}\`; }\n            renderQuizzes();\n        } else if (mode === 'exam')`;

// ── 공통: setMode에서 renderQuizzes 호출 직전에 라운드 제어 삽입 (CRLF) ────────
const OLD_SETMODE_RENDER_CRLF = `            renderQuizzes();\r\n        } else if (mode === 'exam')`;
const NEW_SETMODE_RENDER_CRLF = `            const showRound = activeLevel === 3;\r\n            document.getElementById('roundBtn').style.display = showRound ? 'inline-block' : 'none';\r\n            document.getElementById('roundDisplay').style.display = showRound ? 'inline-block' : 'none';\r\n            if (showRound) { currentRound = 1; document.getElementById('roundDisplay').innerText = \`라운드 1/\${TOTAL_ROUNDS}\`; }\r\n            renderQuizzes();\r\n        } else if (mode === 'exam')`;

// ── 공통: nextRound 함수 추가 (toggleAll 뒤, LF) ─────────────────────────────
const OLD_TOGGLEALL_LF = `    function toggleAll() { const btns = document.querySelectorAll('.btn-answer'); isAllAnswersShown = !isAllAnswersShown; btns.forEach((btn, index) => { const isActive = btn.classList.contains('active'); if (isAllAnswersShown && !isActive) toggleAnswer(index, btn); else if (!isAllAnswersShown && isActive) toggleAnswer(index, btn); }); }`;
const NEW_TOGGLEALL_LF = `    function toggleAll() { const btns = document.querySelectorAll('.btn-answer'); isAllAnswersShown = !isAllAnswersShown; btns.forEach((btn, index) => { const isActive = btn.classList.contains('active'); if (isAllAnswersShown && !isActive) toggleAnswer(index, btn); else if (!isAllAnswersShown && isActive) toggleAnswer(index, btn); }); }\n    function nextRound() { currentRound = (currentRound % TOTAL_ROUNDS) + 1; document.getElementById('roundDisplay').innerText = \`라운드 \${currentRound}/\${TOTAL_ROUNDS}\`; renderQuizzes(); }`;

// ──────────────────────────────────────────────────────────────────────────────
// 그룹 A: bjtest13_exam, bjtest14_exam (LF, level 파라미터, 트레일링 스페이스 없음)
// ──────────────────────────────────────────────────────────────────────────────

// 상태 변수 (트레일링 스페이스 없음)
const OLD_STATE_NOSPACE_LF = `    let currentMode = 'stage';\n    let activeLevel = 1;\n\n    function setMode(mode, level) {`;
const NEW_STATE_NOSPACE_LF = `    let currentMode = 'stage';\n    let activeLevel = 1;\n    let currentRound = 1;\n    const TOTAL_ROUNDS = 2;\n\n    function setMode(mode, level) {`;

// renderSingleCard else 블록 (level 파라미터)
const OLD_RENDER_LEVEL_LF = `        } else {\n            let rawText = item.content.replace(/\\{|\\}/g, '');\n            let lines = rawText.split('<br>');\n            let parsedLines = lines.map(line => {\n                return line.split(' ').map((word, i) => {\n                    if (!word) return '';\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                    if (level === 2) return \`<span class="blank stage2-blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleStage2Word(this)">\${getChosung(word)}</span>\`;\n                    return \`<span class="blank stage3-blank" data-answer="\${word}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\n                }).join(' ');\n            });\n            htmlContent = parsedLines.join('<br>');\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\n        }\n`;

const NEW_RENDER_LEVEL_LF = `        } else if (level === 2) {\n            let rawText = item.content.replace(/\\{|\\}/g, '');\n            let lines = rawText.split('<br>');\n            let parsedLines = lines.map(line => {\n                return line.split(' ').map((word, i) => {\n                    if (!word) return '';\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                    return \`<span class="blank stage2-blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleStage2Word(this)">\${getChosung(word)}</span>\`;\n                }).join(' ');\n            });\n            htmlContent = parsedLines.join('<br>');\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\n        } else if (level === 3) {\n            let rawText = item.content.replace(/\\{|\\}/g, '');\n            let lines = rawText.split('<br>');\n            let parsedLines = lines.map(line => {\n                let wordIdx = 0;\n                return line.split(' ').map((word) => {\n                    if (!word) return '';\n                    if (wordIdx === 0 && !isNaN(word)) { wordIdx++; return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`; }\n                    const isBlank = (wordIdx % TOTAL_ROUNDS) === (currentRound - 1);\n                    wordIdx++;\n                    if (isBlank) return \`<span class="blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\n                    return word;\n                }).join(' ');\n            });\n            htmlContent = parsedLines.join('<br>');\n            controlsHtml = \`<button class="btn-hint" onclick="toggleHint('\${id}', this)">초성 보기</button> <button class="btn-answer" onclick="toggleAnswer('\${id}', this)">정답 보기</button>\`;\n        } else if (level === 4) {\n            let rawText = item.content.replace(/\\{|\\}/g, '');\n            let lines = rawText.split('<br>');\n            let parsedLines = lines.map(line => {\n                return line.split(' ').map((word, i) => {\n                    if (!word) return '';\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                    return \`<span class="blank stage3-blank" data-answer="\${word}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\n                }).join(' ');\n            });\n            htmlContent = parsedLines.join('<br>');\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\n        }\n`;

// toggleAnswer: (activeLevel >= 2) → (activeLevel === 2 || activeLevel === 4)
const OLD_TOGGLE_GTE2 = `(activeLevel >= 2) ? "전체 정답 보기" : "정답 보기"`;
const NEW_TOGGLE_GTE2 = `(activeLevel === 2 || activeLevel === 4) ? "전체 정답 보기" : "정답 보기"`;

// ──────────────────────────────────────────────────────────────────────────────
// 그룹 B: bjtest1_2_exam (CRLF, level 파라미터, 트레일링 스페이스 없음)
// ──────────────────────────────────────────────────────────────────────────────

const OLD_STATE_NOSPACE_CRLF = `    let currentMode = 'stage';\r\n    let activeLevel = 1;\r\n\r\n    function setMode(mode, level) {`;
const NEW_STATE_NOSPACE_CRLF = `    let currentMode = 'stage';\r\n    let activeLevel = 1;\r\n    let currentRound = 1;\r\n    const TOTAL_ROUNDS = 2;\r\n\r\n    function setMode(mode, level) {`;

const OLD_RENDER_LEVEL_CRLF = `        } else {\r\n            let rawText = item.content.replace(/\\{|\\}/g, '');\r\n            let lines = rawText.split('<br>');\r\n            let parsedLines = lines.map(line => {\r\n                return line.split(' ').map((word, i) => {\r\n                    if (!word) return '';\r\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\r\n                    if (level === 2) return \`<span class="blank stage2-blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleStage2Word(this)">\${getChosung(word)}</span>\`;\r\n                    return \`<span class="blank stage3-blank" data-answer="\${word}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\r\n                }).join(' ');\r\n            });\r\n            htmlContent = parsedLines.join('<br>');\r\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\r\n        }\r\n`;

const NEW_RENDER_LEVEL_CRLF = `        } else if (level === 2) {\r\n            let rawText = item.content.replace(/\\{|\\}/g, '');\r\n            let lines = rawText.split('<br>');\r\n            let parsedLines = lines.map(line => {\r\n                return line.split(' ').map((word, i) => {\r\n                    if (!word) return '';\r\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\r\n                    return \`<span class="blank stage2-blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleStage2Word(this)">\${getChosung(word)}</span>\`;\r\n                }).join(' ');\r\n            });\r\n            htmlContent = parsedLines.join('<br>');\r\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\r\n        } else if (level === 3) {\r\n            let rawText = item.content.replace(/\\{|\\}/g, '');\r\n            let lines = rawText.split('<br>');\r\n            let parsedLines = lines.map(line => {\r\n                let wordIdx = 0;\r\n                return line.split(' ').map((word) => {\r\n                    if (!word) return '';\r\n                    if (wordIdx === 0 && !isNaN(word)) { wordIdx++; return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`; }\r\n                    const isBlank = (wordIdx % TOTAL_ROUNDS) === (currentRound - 1);\r\n                    wordIdx++;\r\n                    if (isBlank) return \`<span class="blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\r\n                    return word;\r\n                }).join(' ');\r\n            });\r\n            htmlContent = parsedLines.join('<br>');\r\n            controlsHtml = \`<button class="btn-hint" onclick="toggleHint('\${id}', this)">초성 보기</button> <button class="btn-answer" onclick="toggleAnswer('\${id}', this)">정답 보기</button>\`;\r\n        } else if (level === 4) {\r\n            let rawText = item.content.replace(/\\{|\\}/g, '');\r\n            let lines = rawText.split('<br>');\r\n            let parsedLines = lines.map(line => {\r\n                return line.split(' ').map((word, i) => {\r\n                    if (!word) return '';\r\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\r\n                    return \`<span class="blank stage3-blank" data-answer="\${word}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\r\n                }).join(' ');\r\n            });\r\n            htmlContent = parsedLines.join('<br>');\r\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\r\n        }\r\n`;

// ──────────────────────────────────────────────────────────────────────────────
// 그룹 C: bjtest12_exam (LF, activeLevel 파라미터, 트레일링 스페이스 있음)
// ──────────────────────────────────────────────────────────────────────────────

// 상태 변수 (트레일링 스페이스 있음)
const OLD_STATE_SPACE_LF = `    let currentMode = 'stage'; \n    let activeLevel = 1; \n\n    function setMode(mode, level) {`;
const NEW_STATE_SPACE_LF = `    let currentMode = 'stage'; \n    let activeLevel = 1; \n    let currentRound = 1;\n    const TOTAL_ROUNDS = 2;\n\n    function setMode(mode, level) {`;

// renderSingleCard else if 블록 (activeLevel 파라미터)
const OLD_RENDER_ACTIVELEVEL = `        } else if (activeLevel === 2 || activeLevel === 3) {\n            let rawText = item.content.replace(/\\{|\\}/g, '');\n            let lines = rawText.split('<br>');\n            let parsedLines = lines.map(line => {\n                return line.split(' ').map((word, i) => {\n                    if (!word) return '';\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                    if (activeLevel === 2) return \`<span class="blank stage2-blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleStage2Word(this)">\${getChosung(word)}</span>\`;\n                    return \`<span class="blank stage3-blank" data-answer="\${word}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\n                }).join(' ');\n            });\n            htmlContent = parsedLines.join('<br>');\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\n        }`;

const NEW_RENDER_ACTIVELEVEL = `        } else if (activeLevel === 2) {\n            let rawText = item.content.replace(/\\{|\\}/g, '');\n            let lines = rawText.split('<br>');\n            let parsedLines = lines.map(line => {\n                return line.split(' ').map((word, i) => {\n                    if (!word) return '';\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                    return \`<span class="blank stage2-blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleStage2Word(this)">\${getChosung(word)}</span>\`;\n                }).join(' ');\n            });\n            htmlContent = parsedLines.join('<br>');\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\n        } else if (activeLevel === 3) {\n            let rawText = item.content.replace(/\\{|\\}/g, '');\n            let lines = rawText.split('<br>');\n            let parsedLines = lines.map(line => {\n                let wordIdx = 0;\n                return line.split(' ').map((word) => {\n                    if (!word) return '';\n                    if (wordIdx === 0 && !isNaN(word)) { wordIdx++; return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`; }\n                    const isBlank = (wordIdx % TOTAL_ROUNDS) === (currentRound - 1);\n                    wordIdx++;\n                    if (isBlank) return \`<span class="blank" data-answer="\${word}" data-chosung="\${getChosung(word)}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\n                    return word;\n                }).join(' ');\n            });\n            htmlContent = parsedLines.join('<br>');\n            controlsHtml = \`<button class="btn-hint" onclick="toggleHint('\${id}', this)">초성 보기</button> <button class="btn-answer" onclick="toggleAnswer('\${id}', this)">정답 보기</button>\`;\n        } else if (activeLevel === 4) {\n            let rawText = item.content.replace(/\\{|\\}/g, '');\n            let lines = rawText.split('<br>');\n            let parsedLines = lines.map(line => {\n                return line.split(' ').map((word, i) => {\n                    if (!word) return '';\n                    if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                    return \`<span class="blank stage3-blank" data-answer="\${word}" onclick="toggleSingleBlank(this)">\${word}</span>\`;\n                }).join(' ');\n            });\n            htmlContent = parsedLines.join('<br>');\n            controlsHtml = \`<button class="btn-answer" onclick="toggleAnswer('\${id}', this)">전체 정답 보기</button>\`;\n        }`;

// toggleAnswer: (activeLevel === 2 || activeLevel === 3) → (activeLevel === 2 || activeLevel === 4)
const OLD_TOGGLE_ACTIVE3 = `(activeLevel === 2 || activeLevel === 3) ? "전체 정답 보기" : "정답 보기"`;
const NEW_TOGGLE_ACTIVE4 = `(activeLevel === 2 || activeLevel === 4) ? "전체 정답 보기" : "정답 보기"`;

// renderExamVerse (bjtest12_exam 전용, bjtest1-22와 동일 패턴)
const OLD_EXAM_RENDER_LF = `        if (activeLevel === 1) {\n            htmlStr = verseStr.replace(/\\{([^}]+)\\}/g, (match, ans) => {\n                let width = (ans.length * 1.5) + 1; \n                return \`<input type="text" class="exam-input" style="width: \${width}em;" data-answer="\${ans}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`;\n            });\n        } else {\n            let rawText = verseStr.replace(/\\{|\\}/g, '');\n            let words = rawText.split(' ');\n            htmlStr = words.map((word, i) => {\n                if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                let width = (word.length * 1.2) + 1;\n                let placeholder = activeLevel === 2 ? getChosung(word) : ""; \n                return \`<input type="text" class="exam-input" style="width: \${width}em;" placeholder="\${placeholder}" data-answer="\${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`;\n            }).join(' ');\n        }\n`;

const NEW_EXAM_RENDER_LF = `        if (activeLevel === 1) {\n            htmlStr = verseStr.replace(/\\{([^}]+)\\}/g, (match, ans) => {\n                let width = (ans.length * 1.5) + 1; \n                return \`<input type="text" class="exam-input" style="width: \${width}em;" data-answer="\${ans}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`;\n            });\n        } else if (activeLevel === 3) {\n            let rawText = verseStr.replace(/\\{|\\}/g, '');\n            let words = rawText.split(' ');\n            let wordIdx = 0;\n            htmlStr = words.map((word) => {\n                if (!word) return '';\n                if (wordIdx === 0 && !isNaN(word)) { wordIdx++; return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`; }\n                const isBlank = (wordIdx % TOTAL_ROUNDS) === 0;\n                wordIdx++;\n                if (isBlank) { let width = (word.length * 1.2) + 1; return \`<input type="text" class="exam-input" style="width: \${width}em;" data-answer="\${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`; }\n                return word;\n            }).join(' ');\n        } else {\n            let rawText = verseStr.replace(/\\{|\\}/g, '');\n            let words = rawText.split(' ');\n            htmlStr = words.map((word, i) => {\n                if (i === 0 && !isNaN(word)) return \`<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">\${word}</span>\`;\n                let width = (word.length * 1.2) + 1;\n                let placeholder = activeLevel === 2 ? getChosung(word) : ""; \n                return \`<input type="text" class="exam-input" style="width: \${width}em;" placeholder="\${placeholder}" data-answer="\${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">\`;\n            }).join(' ');\n        }\n`;

// ── 메인 처리 ────────────────────────────────────────────────────────────────

function processFile(filepath) {
  let c = fs.readFileSync(filepath, 'utf-8');
  const original = c;
  const hasCR = c.includes('\r\n');
  const results = [];

  const apply = (label, old, nw) => {
    if (c.includes(old)) { c = c.split(old).join(nw); results.push('  ✓ ' + label); }
    else results.push('  ✗ ' + label + ' (패턴 없음)');
  };

  // 공통 변경
  apply('대시보드 4단계', OLD_DASHBOARD, NEW_DASHBOARD);
  apply('라운드 버튼', OLD_GLOBAL, NEW_GLOBAL);
  apply('setMode 라운드 제어', hasCR ? OLD_SETMODE_RENDER_CRLF : OLD_SETMODE_RENDER_LF, hasCR ? NEW_SETMODE_RENDER_CRLF : NEW_SETMODE_RENDER_LF);
  apply('nextRound 추가', OLD_TOGGLEALL_LF, NEW_TOGGLEALL_LF);

  // 그룹별 변경
  if (hasCR) {
    // 그룹 B: bjtest1_2_exam
    apply('상태 변수 (CRLF)', OLD_STATE_NOSPACE_CRLF, NEW_STATE_NOSPACE_CRLF);
    apply('renderSingleCard level분리 (CRLF)', OLD_RENDER_LEVEL_CRLF, NEW_RENDER_LEVEL_CRLF);
    apply('toggleAnswer (activeLevel>=2)', OLD_TOGGLE_GTE2, NEW_TOGGLE_GTE2);
  } else if (c.includes("let currentMode = 'stage'; \n")) {
    // 그룹 C: bjtest12_exam
    apply('상태 변수 (LF+space)', OLD_STATE_SPACE_LF, NEW_STATE_SPACE_LF);
    apply('renderSingleCard activeLevel분리', OLD_RENDER_ACTIVELEVEL, NEW_RENDER_ACTIVELEVEL);
    apply('toggleAnswer (activeLevel===3)', OLD_TOGGLE_ACTIVE3, NEW_TOGGLE_ACTIVE4);
    apply('renderExamVerse level3', OLD_EXAM_RENDER_LF, NEW_EXAM_RENDER_LF);
  } else {
    // 그룹 A: bjtest13_exam, bjtest14_exam
    apply('상태 변수 (LF)', OLD_STATE_NOSPACE_LF, NEW_STATE_NOSPACE_LF);
    apply('renderSingleCard level분리 (LF)', OLD_RENDER_LEVEL_LF, NEW_RENDER_LEVEL_LF);
    apply('toggleAnswer (activeLevel>=2)', OLD_TOGGLE_GTE2, NEW_TOGGLE_GTE2);
  }

  if (c !== original) { fs.writeFileSync(filepath, c, 'utf-8'); return { results, modified: true }; }
  return { results, modified: false };
}

let changed = 0;
EXAM_FOLDERS.forEach(name => {
  const filepath = path.join(BASE_DIR, name, 'index.html');
  if (!fs.existsSync(filepath)) { console.log(`[${name}] 파일 없음`); return; }
  const { results, modified } = processFile(filepath);
  console.log(`[${name}] ${modified ? '수정됨' : '변경 없음'}`);
  results.forEach(r => console.log(r));
  if (modified) changed++;
});
console.log(`\n완료: ${changed}개 수정`);
