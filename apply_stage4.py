#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
1~3단계 → 1~4단계 확장 스크립트
- 기존 3단계 → 4단계로 이동
- 새 3단계: 라운드 방식 심화 학습 (전체 단어 순환)
"""

import os
import re

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ── 변경 1: 대시보드 3단계 컬럼 교체 ──────────────────────────────────────────
OLD_DASHBOARD = """            <div class="stage-column">
                <button class="btn-stage" id="btnStage3" onclick="setMode('stage', 3)">👑 3단계 (전체)</button>
                <button class="btn-exam" id="btnExam3" onclick="setMode('exam', 3)">🏆 3단계 모의고사</button>
            </div>
        </div>"""

NEW_DASHBOARD = """            <div class="stage-column">
                <button class="btn-stage" id="btnStage3" onclick="setMode('stage', 3)">💪 3단계 (심화)</button>
                <button class="btn-exam" id="btnExam3" onclick="setMode('exam', 3)">🏆 3단계 모의고사</button>
            </div>
            <div class="stage-column">
                <button class="btn-stage" id="btnStage4" onclick="setMode('stage', 4)">👑 4단계 (전체)</button>
                <button class="btn-exam" id="btnExam4" onclick="setMode('exam', 4)">🏆 4단계 모의고사</button>
            </div>
        </div>"""

# ── 변경 2: globalControls에 라운드 버튼 추가 ─────────────────────────────────
OLD_GLOBAL_CONTROLS = """        <div class="global-controls" id="globalControls">
            <button class="btn-dark" onclick="toggleTheme()">🌙 다크 모드</button>
            <button class="btn-toggle" onclick="toggleAll()">👁️ 전체 정답 보기/숨기기</button>
        </div>"""

NEW_GLOBAL_CONTROLS = """        <div class="global-controls" id="globalControls">
            <button class="btn-dark" onclick="toggleTheme()">🌙 다크 모드</button>
            <button class="btn-toggle" onclick="toggleAll()">👁️ 전체 정답 보기/숨기기</button>
            <button class="btn-toggle" id="roundBtn" onclick="nextRound()" style="display:none;">다음 라운드 →</button>
            <span id="roundDisplay" style="display:none; font-weight:bold; padding:6px 10px;">라운드 1/2</span>
        </div>"""

# ── 변경 3: 라운드 상태 변수 추가 ────────────────────────────────────────────
OLD_STATE = """    let currentMode = 'stage';
    let activeLevel = 1;

    function setMode(mode, level) {"""

NEW_STATE = """    let currentMode = 'stage';
    let activeLevel = 1;
    let currentRound = 1;
    const TOTAL_ROUNDS = 2;

    function setMode(mode, level) {"""

# ── 변경 4: setMode() - 라운드 UI 표시 처리 ─────────────────────────────────
OLD_SETMODE = """        if (mode === 'stage') {
            document.getElementById('btnStage' + level).classList.add('active');
            document.getElementById('quiz-list').style.display = 'block';
            document.getElementById('exam-arena').style.display = 'none';
            document.getElementById('globalControls').style.display = 'flex';
            renderQuizzes();"""

NEW_SETMODE = """        if (mode === 'stage') {
            document.getElementById('btnStage' + level).classList.add('active');
            document.getElementById('quiz-list').style.display = 'block';
            document.getElementById('exam-arena').style.display = 'none';
            document.getElementById('globalControls').style.display = 'flex';
            const showRound = level === 3;
            document.getElementById('roundBtn').style.display = showRound ? 'inline-block' : 'none';
            document.getElementById('roundDisplay').style.display = showRound ? 'inline-block' : 'none';
            if (showRound) { currentRound = 1; document.getElementById('roundDisplay').innerText = `라운드 1/${TOTAL_ROUNDS}`; }
            renderQuizzes();"""

# ── 변경 5: renderQuizzes() - level 2/3/4 처리 분리 ─────────────────────────
OLD_RENDER = """            } else if (activeLevel === 2 || activeLevel === 3) {
                let rawText = item.content.replace(/\\{|\\}/g, '');
                let lines = rawText.split('<br>');
                let parsedLines = lines.map(line => {
                    return line.split(' ').map((word, i) => {
                        if (!word) return '';
                        if (i === 0 && !isNaN(word)) return `<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">${word}</span>`;
                        if (activeLevel === 2) return `<span class="blank stage2-blank" data-answer="${word}" data-chosung="${getChosung(word)}" onclick="toggleStage2Word(this)">${getChosung(word)}</span>`;
                        return `<span class="blank stage3-blank" data-answer="${word}" onclick="toggleSingleBlank(this)">${word}</span>`;
                    }).join(' ');
                });
                htmlContent = parsedLines.join('<br>');
                controlsHtml = `<button class="btn-answer" onclick="toggleAnswer(${index}, this)">전체 정답 보기</button>`;
            }"""

NEW_RENDER = """            } else if (activeLevel === 2) {
                let rawText = item.content.replace(/\\{|\\}/g, '');
                let lines = rawText.split('<br>');
                let parsedLines = lines.map(line => {
                    return line.split(' ').map((word, i) => {
                        if (!word) return '';
                        if (i === 0 && !isNaN(word)) return `<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">${word}</span>`;
                        return `<span class="blank stage2-blank" data-answer="${word}" data-chosung="${getChosung(word)}" onclick="toggleStage2Word(this)">${getChosung(word)}</span>`;
                    }).join(' ');
                });
                htmlContent = parsedLines.join('<br>');
                controlsHtml = `<button class="btn-answer" onclick="toggleAnswer(${index}, this)">전체 정답 보기</button>`;
            } else if (activeLevel === 3) {
                let rawText = item.content.replace(/\\{|\\}/g, '');
                let lines = rawText.split('<br>');
                let parsedLines = lines.map(line => {
                    let wordIdx = 0;
                    return line.split(' ').map((word) => {
                        if (!word) return '';
                        if (wordIdx === 0 && !isNaN(word)) { wordIdx++; return `<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">${word}</span>`; }
                        const isBlank = (wordIdx % TOTAL_ROUNDS) === (currentRound - 1);
                        wordIdx++;
                        if (isBlank) return `<span class="blank" data-answer="${word}" data-chosung="${getChosung(word)}" onclick="toggleSingleBlank(this)">${word}</span>`;
                        return word;
                    }).join(' ');
                });
                htmlContent = parsedLines.join('<br>');
                controlsHtml = `<button class="btn-hint" onclick="toggleHint(${index}, this)">초성 보기</button> <button class="btn-answer" onclick="toggleAnswer(${index}, this)">정답 보기</button>`;
            } else if (activeLevel === 4) {
                let rawText = item.content.replace(/\\{|\\}/g, '');
                let lines = rawText.split('<br>');
                let parsedLines = lines.map(line => {
                    return line.split(' ').map((word, i) => {
                        if (!word) return '';
                        if (i === 0 && !isNaN(word)) return `<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">${word}</span>`;
                        return `<span class="blank stage3-blank" data-answer="${word}" onclick="toggleSingleBlank(this)">${word}</span>`;
                    }).join(' ');
                });
                htmlContent = parsedLines.join('<br>');
                controlsHtml = `<button class="btn-answer" onclick="toggleAnswer(${index}, this)">전체 정답 보기</button>`;
            }"""

# ── 변경 6: toggleAnswer else branch - activeLevel 4 처리 ────────────────────
OLD_TOGGLE = """        else { btn.classList.remove('active'); btn.innerText = (activeLevel === 2 || activeLevel === 3) ? "전체 정답 보기" : "정답 보기"; blanks.forEach(b => { if (b.classList.contains('stage2-blank')) b.innerText = b.dataset.chosung; else b.innerText = b.dataset.answer; b.classList.remove('answer-mode'); }); }"""

NEW_TOGGLE = """        else { btn.classList.remove('active'); btn.innerText = (activeLevel === 2 || activeLevel === 4) ? "전체 정답 보기" : "정답 보기"; blanks.forEach(b => { if (b.classList.contains('stage2-blank')) b.innerText = b.dataset.chosung; else b.innerText = b.dataset.answer; b.classList.remove('answer-mode'); }); }"""

# ── 변경 7: toggleAll() 뒤에 nextRound() 추가 ───────────────────────────────
OLD_TOGGLEALL = """    function toggleAll() { const btns = document.querySelectorAll('.btn-answer'); isAllAnswersShown = !isAllAnswersShown; btns.forEach((btn, index) => { const isActive = btn.classList.contains('active'); if (isAllAnswersShown && !isActive) toggleAnswer(index, btn); else if (!isAllAnswersShown && isActive) toggleAnswer(index, btn); }); }"""

NEW_TOGGLEALL = """    function toggleAll() { const btns = document.querySelectorAll('.btn-answer'); isAllAnswersShown = !isAllAnswersShown; btns.forEach((btn, index) => { const isActive = btn.classList.contains('active'); if (isAllAnswersShown && !isActive) toggleAnswer(index, btn); else if (!isAllAnswersShown && isActive) toggleAnswer(index, btn); }); }
    function nextRound() { currentRound = (currentRound % TOTAL_ROUNDS) + 1; document.getElementById('roundDisplay').innerText = `라운드 ${currentRound}/${TOTAL_ROUNDS}`; renderQuizzes(); }"""

# ── 변경 8: renderExamVerse() - level 3 exam 추가 ───────────────────────────
OLD_EXAM_RENDER = """        if (activeLevel === 1) {
            htmlStr = verseStr.replace(/\\{([^}]+)\\}/g, (match, ans) => {
                let width = (ans.length * 1.5) + 1;
                return `<input type="text" class="exam-input" style="width: ${width}em;" data-answer="${ans}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">`;
            });
        } else {
            let rawText = verseStr.replace(/\\{|\\}/g, '');
            let words = rawText.split(' ');
            htmlStr = words.map((word, i) => {
                if (i === 0 && !isNaN(word)) return `<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">${word}</span>`;
                let width = (word.length * 1.2) + 1;
                let placeholder = activeLevel === 2 ? getChosung(word) : "";
                return `<input type="text" class="exam-input" style="width: ${width}em;" placeholder="${placeholder}" data-answer="${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">`;
            }).join(' ');
        }"""

NEW_EXAM_RENDER = """        if (activeLevel === 1) {
            htmlStr = verseStr.replace(/\\{([^}]+)\\}/g, (match, ans) => {
                let width = (ans.length * 1.5) + 1;
                return `<input type="text" class="exam-input" style="width: ${width}em;" data-answer="${ans}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">`;
            });
        } else if (activeLevel === 3) {
            let rawText = verseStr.replace(/\\{|\\}/g, '');
            let words = rawText.split(' ');
            let wordIdx = 0;
            htmlStr = words.map((word) => {
                if (!word) return '';
                if (wordIdx === 0 && !isNaN(word)) { wordIdx++; return `<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">${word}</span>`; }
                const isBlank = (wordIdx % TOTAL_ROUNDS) === 0;
                wordIdx++;
                if (isBlank) { let width = (word.length * 1.2) + 1; return `<input type="text" class="exam-input" style="width: ${width}em;" data-answer="${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">`; }
                return word;
            }).join(' ');
        } else {
            let rawText = verseStr.replace(/\\{|\\}/g, '');
            let words = rawText.split(' ');
            htmlStr = words.map((word, i) => {
                if (i === 0 && !isNaN(word)) return `<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">${word}</span>`;
                let width = (word.length * 1.2) + 1;
                let placeholder = activeLevel === 2 ? getChosung(word) : "";
                return `<input type="text" class="exam-input" style="width: ${width}em;" placeholder="${placeholder}" data-answer="${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">`;
            }).join(' ');
        }"""

# ── 변경 9: showExamResult - activeLevel === 3 → 4 ───────────────────────────
OLD_EXAM_RESULT = """        if(examScore === 20 && activeLevel === 3) rankText = """
NEW_EXAM_RESULT = """        if(examScore === 20 && activeLevel === 4) rankText = """

# ─── 변경 목록 ──────────────────────────────────────────────────────────────
CHANGES = [
    ("대시보드 4단계 추가",       OLD_DASHBOARD,       NEW_DASHBOARD),
    ("라운드 버튼 추가",          OLD_GLOBAL_CONTROLS, NEW_GLOBAL_CONTROLS),
    ("라운드 상태 변수 추가",     OLD_STATE,           NEW_STATE),
    ("setMode 라운드 처리",       OLD_SETMODE,         NEW_SETMODE),
    ("renderQuizzes 4단계 분리",  OLD_RENDER,          NEW_RENDER),
    ("toggleAnswer 4단계 수정",   OLD_TOGGLE,          NEW_TOGGLE),
    ("nextRound 함수 추가",       OLD_TOGGLEALL,       NEW_TOGGLEALL),
    ("examVerse 3단계 추가",      OLD_EXAM_RENDER,     NEW_EXAM_RENDER),
    ("examResult 4단계 수정",     OLD_EXAM_RESULT,     NEW_EXAM_RESULT),
]


def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    results = []
    for label, old, new in CHANGES:
        if old in content:
            content = content.replace(old, new)
            results.append(f"  ✓ {label}")
        else:
            results.append(f"  ✗ {label} (패턴 없음)")

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return results, True
    return results, False


def main():
    changed = 0
    skipped = 0
    for i in range(1, 23):
        folder = os.path.join(BASE_DIR, f"bjtest{i}")
        filepath = os.path.join(folder, "index.html")
        if not os.path.exists(filepath):
            print(f"[bjtest{i}] 파일 없음, 건너뜀")
            skipped += 1
            continue
        results, modified = process_file(filepath)
        status = "수정됨" if modified else "변경 없음"
        print(f"[bjtest{i}] {status}")
        for r in results:
            print(r)
        if modified:
            changed += 1
        else:
            skipped += 1

    print(f"\n완료: {changed}개 수정, {skipped}개 건너뜀")


if __name__ == '__main__':
    main()
