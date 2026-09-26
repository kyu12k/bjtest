// engine.js — 계시록 장별 학습 페이지 공통 엔진
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

    // 🚨 스크롤 및 모달 로직
    window.onscroll = function() { scrollFunction() };
    function scrollFunction() {
        if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) { document.getElementById("topBtn").style.display = "block"; }
        else { document.getElementById("topBtn").style.display = "none"; }
    }
    function scrollToTop() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

    document.addEventListener("DOMContentLoaded", () => {
        const modal = document.getElementById('warningModal');
        const amenBtn = document.getElementById('amenBtn');
        let timeLeft = 2; document.body.style.overflow = 'hidden';
        const timer = setInterval(() => {
            timeLeft--;
            if (timeLeft > 0) amenBtn.innerText = `아멘 (${timeLeft}초 후 활성화)`;
            else { clearInterval(timer); amenBtn.disabled = false; amenBtn.innerText = "아멘 🙏"; }
        }, 1000);
        amenBtn.addEventListener('click', () => { modal.style.opacity = '0'; setTimeout(() => { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }, 300); });
        setMode('stage', 1);
    });

        const globalAudio = audioPath ? new Audio(audioPath) : null;
    const playBtn = document.getElementById('playBtn'), loopBtn = document.getElementById('loopBtn'), progressBar = document.getElementById('progressBar'), timeDisplay = document.getElementById('timeDisplay');
    let isDragging = false, isLooping = false;
    function toggleLoop() { isLooping = !isLooping; globalAudio.loop = isLooping; isLooping ? loopBtn.classList.add('active') : loopBtn.classList.remove('active'); }
    globalAudio.addEventListener('loadedmetadata', () => { progressBar.max = globalAudio.duration; updateTimeText(); });
    function togglePlayPause() { if (globalAudio.paused) { globalAudio.play(); playBtn.innerText = "⏸"; } else { globalAudio.pause(); playBtn.innerText = "▶"; } }
    progressBar.addEventListener('input', () => { isDragging = true; updateTimeText(progressBar.value); });
    progressBar.addEventListener('change', () => { globalAudio.currentTime = parseFloat(progressBar.value); isDragging = false; });
    globalAudio.addEventListener('timeupdate', () => { if (!isDragging) { progressBar.value = globalAudio.currentTime; updateTimeText(); } });
    function updateTimeText(val = null) { let current = val !== null ? val : globalAudio.currentTime; timeDisplay.innerText = `${formatTime(current)} / ${formatTime(globalAudio.duration || 0)}`; }
    function formatTime(seconds) { if (isNaN(seconds) || !isFinite(seconds)) return "00:00"; const min = Math.floor(seconds / 60), sec = Math.floor(seconds % 60); return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`; }
    globalAudio.addEventListener('ended', () => { if (!isLooping) { playBtn.innerText = "▶"; globalAudio.currentTime = 0; progressBar.value = 0; updateTimeText(); } });


    function getChosung(str) {
        const chosung = ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"];
        let result = "";
        for(let i=0; i<str.length; i++) {
            const code = str.charCodeAt(i) - 44032;
            if(code > -1 && code < 11172) result += chosung[Math.floor(code / 588)];
            else result += str.charAt(i);
        }
        return result;
    }

    // 🎮 통합 모드 제어
    let currentMode = 'stage';
    let activeLevel = 1;
    let currentRound = 1;
    const TOTAL_ROUNDS = 2;

    function setMode(mode, level) {
        scrollToTop();
        currentMode = mode; activeLevel = level;

        // 버튼 활성화 초기화
        document.querySelectorAll('.btn-stage, .btn-exam').forEach(btn => btn.classList.remove('active'));

        if (mode === 'stage') {
            document.getElementById('btnStage' + level).classList.add('active');
            document.getElementById('quiz-list').style.display = 'block';
            document.getElementById('exam-arena').style.display = 'none';
            document.getElementById('globalControls').style.display = 'flex';
            const showRound = level === 3;
            document.getElementById('roundBtn').style.display = showRound ? 'inline-block' : 'none';
            document.getElementById('roundDisplay').style.display = showRound ? 'inline-block' : 'none';
            if (showRound) { currentRound = 1; document.getElementById('roundDisplay').innerText = `라운드 1/${TOTAL_ROUNDS}`; }
            renderQuizzes();
        } else if (mode === 'exam') {
            document.getElementById('btnExam' + level).classList.add('active');
            document.getElementById('quiz-list').style.display = 'none';
            document.getElementById('exam-arena').style.display = 'block';
            hardMode4 = false;
            const _hb = document.getElementById('hardModeBtn');
            if (_hb) { _hb.style.background = 'transparent'; _hb.style.color = '#e67e00'; _hb.textContent = '🔒 심화 모드 OFF'; }
            document.getElementById('globalControls').style.display = 'none';
            startExam();
        }
    }

    // --- [학습 모드 렌더링] ---
    function renderQuizzes() {
        const quizList = document.getElementById('quiz-list');
        quizList.innerHTML = ''; isAllAnswersShown = false;

        quizData.forEach((item, index) => {
            const card = document.createElement('div'); card.className = 'quiz-card';
            let htmlContent = '', controlsHtml = '';

            if (activeLevel === 1) {
                htmlContent = item.content.replace(/\{([^}]+)\}/g, (match, ans) => `<span class="blank" data-answer="${ans}" data-chosung="${getChosung(ans)}" onclick="toggleSingleBlank(this)">${ans}</span>`);
                controlsHtml = `<button class="btn-hint" onclick="toggleHint(${index}, this)">초성 보기</button> <button class="btn-answer" onclick="toggleAnswer(${index}, this)">정답 보기</button>`;
            } else if (activeLevel === 2) {
                let rawText = item.content.replace(/\{|\}/g, '');
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
                let rawText = item.content.replace(/\{|\}/g, '');
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
                let rawText = item.content.replace(/\{|\}/g, '');
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
            }
            card.innerHTML = `<div class="question-title">${item.title}</div><div class="question-text" id="q-${index}">${htmlContent}</div><div class="controls">${controlsHtml}</div>`;
            quizList.appendChild(card);
        });
    }

    function toggleSingleBlank(el) { if (el.classList.contains('answer-mode')) { el.classList.remove('answer-mode'); el.innerText = el.classList.contains('hint-mode') ? el.dataset.chosung : el.dataset.answer; } else { el.classList.add('answer-mode'); el.innerText = el.dataset.answer; } }
    function toggleStage2Word(el) { if (el.classList.contains('answer-mode')) { el.className = 'blank stage2-blank'; el.innerText = el.dataset.chosung; } else { el.className = 'blank stage2-blank answer-mode'; el.innerText = el.dataset.answer; } }
    let isAllAnswersShown = false;
    function toggleHint(index, btn) {
        const blanks = document.getElementById(`q-${index}`).querySelectorAll('.blank'); const isActive = btn.classList.contains('active');
        btn.nextElementSibling.classList.remove('active'); btn.nextElementSibling.innerText = "정답 보기";
        if (!isActive) { btn.classList.add('active'); btn.innerText = "초성 끄기"; blanks.forEach(b => { b.innerText = b.dataset.chosung; b.className = 'blank hint-mode'; }); }
        else { btn.classList.remove('active'); btn.innerText = "초성 보기"; blanks.forEach(b => { b.innerText = b.dataset.answer; b.className = 'blank'; }); }
    }
    function toggleAnswer(index, btn) {
        const blanks = document.getElementById(`q-${index}`).querySelectorAll('.blank'); const isActive = btn.classList.contains('active');
        if (btn.previousElementSibling && btn.previousElementSibling.classList.contains('btn-hint')) { btn.previousElementSibling.classList.remove('active'); btn.previousElementSibling.innerText = "초성 보기"; }
        if (!isActive) { btn.classList.add('active'); btn.innerText = "정답 가리기"; blanks.forEach(b => { b.innerText = b.dataset.answer; b.classList.add('answer-mode'); b.classList.remove('hint-mode'); }); }
        else { btn.classList.remove('active'); btn.innerText = (activeLevel === 2 || activeLevel === 4) ? "전체 정답 보기" : "정답 보기"; blanks.forEach(b => { if (b.classList.contains('stage2-blank')) b.innerText = b.dataset.chosung; else b.innerText = b.dataset.answer; b.classList.remove('answer-mode'); }); }
    }
    function toggleAll() { const btns = document.querySelectorAll('.btn-answer'); isAllAnswersShown = !isAllAnswersShown; btns.forEach((btn, index) => { const isActive = btn.classList.contains('active'); if (isAllAnswersShown && !isActive) toggleAnswer(index, btn); else if (!isAllAnswersShown && isActive) toggleAnswer(index, btn); }); }
    function nextRound() { currentRound = (currentRound % TOTAL_ROUNDS) + 1; document.getElementById('roundDisplay').innerText = `라운드 ${currentRound}/${TOTAL_ROUNDS}`; renderQuizzes(); }

    // --- [🏆 모의고사 보스전 로직] ---
    let currentExamIndex = 0;
    let examScore = 0;
    let examWrongData = [];
    const totalVerses = verses.length;

    function startExam() {
        currentExamIndex = 0; examScore = 0; examWrongData = []; examResults = [];
        document.getElementById('exam-play-area').style.display = 'block';
        document.getElementById('exam-result-area').style.display = 'none';
        renderExamVerse();
    }

    function retryCurrentExam() { setMode('exam', activeLevel); }

    let hardMode4 = false;
    function toggleHardMode() {
        hardMode4 = !hardMode4;
        const btn = document.getElementById('hardModeBtn');
        btn.style.background = hardMode4 ? '#e67e00' : 'transparent';
        btn.style.color = hardMode4 ? '#fff' : '#e67e00';
        btn.textContent = hardMode4 ? '🔓 심화 모드 ON' : '🔒 심화 모드 OFF';
        startExam();
    }
    function renderExamVerse() {
        const _hmRow = document.getElementById('hardModeToggleRow');
        if (_hmRow) _hmRow.style.display = activeLevel === 4 ? 'block' : 'none';
        document.getElementById('examProgressText').innerText = `[${activeLevel}단계] ${currentExamIndex + 1} / ${totalVerses} 절`;
        const verseStr = verses[currentExamIndex];
        let htmlStr = "";

        if (activeLevel === 1) {
            htmlStr = verseStr.replace(/\{([^}]+)\}/g, (match, ans) => {
                let width = (ans.length * 1.5) + 1;
                return `<input type="text" class="exam-input" style="width: ${width}em;" data-answer="${ans}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">`;
            });
        } else if (activeLevel === 3) {
            let rawText = verseStr.replace(/\{|\}/g, '');
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
        } else if (activeLevel === 4 && hardMode4) {
            let verseClean = verseStr.replace(/\{|\}/g, '');
            let ws = verseClean.split(' ');
            let vNum = ws[0] && !isNaN(ws[0]) ? ws[0] : null;
            let vBody = vNum ? ws.slice(1).join(' ') : verseClean;
            let numHtml = vNum ? `<span style="font-weight:bold;color:var(--primary-color);font-size:1.1em;margin-right:6px;">${vNum}</span>` : '';
            htmlStr = `<div style="display:flex;align-items:flex-start;gap:6px;">${numHtml}<textarea class="exam-input" data-answer="${vBody}" rows="4" style="flex:1;font-size:1rem;padding:8px;border:2px solid var(--exam-color);border-radius:8px;background:transparent;color:var(--text-color);font-family:inherit;resize:vertical;line-height:1.7;text-align:left;" onkeydown="if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();submitExamVerse();}" placeholder="절 전체를 입력하세요 (띄어쓰기 오류 허용)"></textarea></div>`;
        } else {
            let rawText = verseStr.replace(/\{|\}/g, '');
            let words = rawText.split(' ');
            htmlStr = words.map((word, i) => {
                if (i === 0 && !isNaN(word)) return `<span style="font-weight:bold; color:var(--primary-color); margin-right:5px;">${word}</span>`;
                let width = (word.length * 1.2) + 1;
                let placeholder = activeLevel === 2 ? getChosung(word) : "";
                return `<input type="text" class="exam-input" style="width: ${width}em;" placeholder="${placeholder}" data-answer="${word}" onclick="this.value=''" onkeydown="handleExamInput(event, this)">`;
            }).join(' ');
        }

        document.getElementById('examVerseText').innerHTML = htmlStr;

        setTimeout(() => {
            const firstInput = document.querySelector('.exam-input');
            if(firstInput) firstInput.focus();
        }, 100);
    }

    function handleExamInput(e, currentInput) {
        if (e.isComposing || e.keyCode === 229) return; // 한글 조합 중에는 개입하지 않음 (글자 유실 방지)
        if (e.key === 'Enter' || (e.key === ' ' && activeLevel !== 1)) {
            e.preventDefault();
            const inputs = document.querySelectorAll('.exam-input');
            const currentIndex = Array.from(inputs).indexOf(currentInput);

            if (currentIndex > -1 && currentIndex < inputs.length - 1) {
                const nextInput = inputs[currentIndex + 1];
                setTimeout(() => {
                    nextInput.focus();
                    nextInput.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 0);
            } else if (currentIndex === inputs.length - 1) {
                submitExamVerse();
            }
        }
    }
    function escapeHtml(s) {
        return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    function submitExamVerse() {
        const inputs = document.querySelectorAll('.exam-input');
        if (!confirmEmptyBlanks([...inputs])) return;
        let isVerseAllCorrect = true;
        let verseLog = [];

        inputs.forEach(input => {
            const userAnswer = input.value;
            const correctAnswer = input.dataset.answer;

            // 💡 스마트 채점 시스템: 공백 다듬기 + 쉼표(,) 완벽 무시
            const cleanUser = userAnswer.trim().replace(/[,()]/g, '');
            const cleanCorrect = correctAnswer.trim().replace(/[,()]/g, '');

if (normCmp(cleanUser) !== normCmp(cleanCorrect)) {
                isVerseAllCorrect = false;
                verseLog.push({ correct: correctAnswer, wrong: userAnswer || '(빈칸)' });
            }
        });

        const _t = collectExamTexts(document.getElementById('examVerseText'));
        examResults.push({ label: (_t.num ? _t.num + '절' : (currentExamIndex + 1) + '절'), ok: isVerseAllCorrect, user: _t.user, correct: _t.correct, correctHtml: _t.correctHtml });
        if (isVerseAllCorrect) {
            examScore++;
        } else {
            examWrongData.push({ verseNum: currentExamIndex + 1, fullVerse: verses[currentExamIndex], errors: verseLog });
        }

        currentExamIndex++;
        if (currentExamIndex >= totalVerses) showExamResult();
        else renderExamVerse();
    }

    // 일부 빈칸만 비어 있으면 표시하고 확인을 받음 (전부 비었거나 전부 채웠으면 그냥 통과). true = 계속 제출
    function confirmEmptyBlanks(inputs) {
        inputs.forEach(i => i.classList.remove('exam-empty'));
        const empty = inputs.filter(i => !i.value.trim());
        if (!empty.length || empty.length === inputs.length) return true;
        empty.forEach(i => i.classList.add('exam-empty'));
        if (confirm(`빈칸 ${empty.length}개가 비어 있습니다.\n그대로 제출할까요?`)) return true;
        empty[0].focus();
        if (empty[0].scrollIntoView) empty[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
    }
    let examResults = [];
    // 입력 블록을 문서 순서로 훑어 사용자 입력·정답을 절 단위로 재조립 (빈칸 아닌 단어는 정답 그대로)
    function collectExamTexts(block) {
        let user = '', correct = '', correctHtml = '';
        const hl = activeLevel === 1 || activeLevel === 3;
        const walk = n => {
            if (n.nodeType === 3) { user += n.textContent; correct += n.textContent; correctHtml += escapeHtml(n.textContent); return; }
            if (n.tagName === 'BR') { user += ' '; correct += ' '; correctHtml += '<br>'; return; }
            if (n.classList && n.classList.contains('exam-input')) {
                const a = n.dataset.answer || '';
                const pad = n.tagName === 'TEXTAREA' ? ' ' : '';
                user += pad + n.value + pad; correct += pad + a + pad;
                correctHtml += pad + (hl ? '<span class="correct-ans">' + escapeHtml(a) + '</span>' : escapeHtml(a)) + pad;
                return;
            }
            n.childNodes.forEach(walk);
        };
        walk(block);
        const tidy = s => s.replace(/[ \t\r\n]+/g, ' ').trim();
        user = tidy(user); correct = tidy(correct); correctHtml = tidy(correctHtml);
        const m = correct.match(/^(\d+)\s+/);
        const num = m ? m[1] : '';
        if (m) { correct = correct.slice(m[0].length); correctHtml = correctHtml.replace(/^\d+\s+/, ''); user = user.replace(/^\d+\s+/, ''); }
        return { num, user, correct, correctHtml };
    }
    // 채점·오답표시 공통 정규화: 띄어쓰기·쉼표·보이지 않는 문자 무시, 한글 NFC 통일
    function normCmp(s) {
        return (s || '').normalize('NFC').replace(/[\s​-‍⁠﻿,.·⋅、。]/g, '');
    }
    // 글자 단위 LCS 정렬: 틀린 글자(빨강)·빠뜨린 글자(주황). 쉼표·공백은 정렬에서 제외하고 공백은 정답 기준으로 복원
    function diffHtml(u, c) {
        const nu = normCmp(u);
        if (!nu) return '<span class="diff-wrong">(미입력)</span>';
        const nc = [], spaceBefore = [];
        let pend = false;
        for (const ch of (c || '').normalize('NFC').replace(/[\u200B-\u200D\uFEFF,]/g, '')) {
            if (/\s/.test(ch)) { pend = true; continue; }
            nc.push(ch); spaceBefore.push(pend); pend = false;
        }
        const m = nu.length, n = nc.length;
        const dp = Array.from({ length: m + 1 }, () => new Int32Array(n + 1));
        for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++)
            dp[i][j] = nu[i - 1] === nc[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
        const align = []; let i = m, j = n;
        while (i > 0 || j > 0) {
            if (i > 0 && j > 0 && nu[i - 1] === nc[j - 1]) { align.push([i - 1, j - 1]); i--; j--; }
            else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) { align.push([-1, j - 1]); j--; }
            else { align.push([i - 1, -1]); i--; }
        }
        align.reverse();
        return align.map(([ui, ci]) => {
            const sp = ci >= 0 && spaceBefore[ci] ? ' ' : '';
            if (ui >= 0 && ci >= 0) return sp + escapeHtml(nu[ui]);
            if (ui >= 0) return `<span class="diff-wrong">${escapeHtml(nu[ui])}</span>`;
            return sp + `<span class="diff-missing">${escapeHtml(nc[ci])}</span>`;
        }).join('');
    }
    function renderExamReview(container, results) {
        let html = `<h3 style="margin-top:0;">📋 절별 결과</h3><div class="verse-summary">`;
        results.forEach(r => {
            const st = r.status || (r.ok ? 'ok' : 'wrong');
            const icon = st === 'ok' ? '✅' : st === 'wrong' ? '❌' : '⬜';
            html += `<span class="vs-item vs-${st}">${icon} ${r.label}${st === 'skip' ? ' (미응답)' : ''}</span>`;
        });
        html += `</div>`;
        const wrong = results.filter(r => (r.status || (r.ok ? 'ok' : 'wrong')) === 'wrong');
        if (wrong.length) {
            html += `<h3>📝 오답 노트</h3><div class="diff-legend"><span class="diff-wrong">틀린 글자</span> · <span class="diff-missing">빠뜨린 글자</span> · 쉼표·띄어쓰기는 채점 제외</div>`;
            wrong.forEach(r => {
                html += `<div class="wrong-item"><strong>${r.label}</strong>`
                    + `<div class="diff-row"><span class="diff-lbl">정답</span><span>${r.correctHtml}</span></div>`
                    + `<div class="diff-row"><span class="diff-lbl">내 입력</span><span>${diffHtml(r.user, r.correct)}</span></div></div>`;
            });
        }
        container.innerHTML = html;
    }

    function showExamResult() {
        document.getElementById('exam-play-area').style.display = 'none';
        document.getElementById('exam-result-area').style.display = 'block';
        scrollToTop();

        const scoreBox = document.getElementById('finalScore');
        scoreBox.innerText = `${examScore} / ${totalVerses}`;
        scoreBox.style.color = examScore === totalVerses ? '#198754' : 'var(--exam-color)';

        let rankText = "";
        if(examScore === totalVerses && activeLevel === 4) rankText = `👑 계시록 ${CH}장 마스터! 완벽하게 인 맞았습니다!`;
        else if(examScore === totalVerses) rankText = "🎉 완벽합니다! 다음 단계 모의고사에 도전하세요!";
        else rankText = "한 절에 하나라도 틀리면 오답 처리되었습니다.";
        document.getElementById('examResultMessage').innerText = rankText;

        renderExamReview(document.getElementById('wrongListContainer'), examResults);
    }

    // 🌙 다크 모드
    function toggleTheme() {
        const body = document.body;
        const btn = document.querySelector('.btn-dark');
        if (body.getAttribute('data-theme') === 'dark') { body.setAttribute('data-theme', 'light'); btn.innerText = "🌙 다크 모드"; }
        else { body.setAttribute('data-theme', 'dark'); btn.innerText = "☀️ 라이트 모드"; }
    }
    function togglePlayer() {
        const box = document.querySelector('.audio-player-box');
        const btn = document.getElementById('collapseBtn');
        const collapsed = box.classList.toggle('collapsed');
        btn.textContent = collapsed ? '▼' : '▲';
        localStorage.setItem('playerCollapsed', collapsed);
    }
    if (localStorage.getItem('playerCollapsed') === 'true') {
        const box = document.querySelector('.audio-player-box');
        const btn = document.getElementById('collapseBtn');
        if (box) box.classList.add('collapsed');
        if (btn) btn.textContent = '▼';
    }

    // 한글 IME가 스페이스를 '조합 확정'으로 처리해 keydown이 오지 않는 경우(주로 모바일) 대비:
    // 값에 공백이 들어오면 지우고 다음 칸으로 이동
    document.addEventListener('input', e => {
        const t = e.target;
        if (!(t instanceof HTMLInputElement) || !t.classList.contains('exam-input') || activeLevel === 1) return;
        if (!/\s/.test(t.value)) return;
        t.value = t.value.replace(/\s+/g, '');
        const scope = t.closest('[data-verse-idx],[data-qidx]') || document;
        const all = [...scope.querySelectorAll('input.exam-input')];
        const i = all.indexOf(t);
        if (i > -1 && i < all.length - 1) setTimeout(() => all[i + 1].focus(), 0);
    });
