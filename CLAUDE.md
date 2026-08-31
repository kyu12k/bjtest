# 천국 인 (Cheonkuk In) — 사이트 문서

## 개요

요한계시록 전장(1~22장) 암송 학습 사이트. 개역한글 기준.  
Cloudflare Pages로 배포 (GitHub: kyu12k/bjtest).  
PWA 지원 (manifest.json + sw.js).

---

## 디렉토리 구조

```
/                          ← 루트 메인 페이지 (index.html)
  nav.js                   ← 전역 "🏠 처음으로" 플로팅 버튼 (모든 하위 페이지에서 include)
  sw.js                    ← Service Worker (no-op, 캐싱 없음)
  manifest.json            ← PWA 메타

  bjtest{N}/               ← 계시록 N장 개별 학습 페이지 (N = 1~22)
    index.html
    mp3/{N}.mp3            ← 해당 장 낭독 오디오 (일부 장만 존재)

  bjtest{N}_exam/          ← 특정 장 모의고사 단독 페이지 (일부 장)
  bjtest_mock/             ← 천국고시 종합 모의고사 (1~4단계, 1~11장 통합)
  bjtest_kingdom/          ← 왕국 관련 특별 시험
  bjtest_kingdom4a/        ← 왕국 4단계 특별 시험
  bjtest_10passage_exam/   ← 10구절 특별 시험
  bjtest_1_2_exam/         ← 1~2장 통합 시험
  bjtest_5passage/         ← 5구절 핵심 시험 (계 3·12·15·18·22장)
```

---

## 데이터 형식

각 장별 페이지의 JS 내 `verses{N}` 배열:

```javascript
const verses3 = [
    "1 {이기는 자}는 내 하나님 성전에 {기둥}이 되게 하리니 ...",
    "2 너는 일깨워 그 남은바 ...",
    // ...
];
```

- `{단어}` = 빈칸 처리 대상 핵심 단어
- 절 번호는 문자열 맨 앞 숫자로 표시
- 공백(띄어쓰기) 기준으로 단어 분리 → 초성/빈칸 처리에 사용

---

## 1~4단계 학습 시스템

| 단계 | 이름 | 방식 |
|------|------|------|
| 1단계 | 핵심 | `{...}` 단어만 빈칸 → 클릭 토글, 초성 보기 버튼 |
| 2단계 | 초성 | 절 번호 제외 전체 단어를 초성으로 표시 → 클릭 토글 |
| 3단계 | 심화 | 전체 단어를 홀수/짝수 인덱스로 2라운드 교대 빈칸 |
| 4단계 | 전체 | 절 번호 제외 모든 단어 빈칸 처리 |

각 단계마다 대응하는 **모의고사 모드** 존재:
- input 텍스트 박스에 타이핑 → 절 단위 채점
- 오답 노트 자동 생성
- 쉼표(,) 자동 보정

---

## 각 페이지의 핵심 JS 구조

```javascript
// 1. 원문 데이터
const versesN = ["1 {빈칸} 본문...", ...];

// 2. 퀴즈 그룹 (학습 단위)
const quizData = [
    { title: "1. 제목 계 N:A~B", content: versesN[0] + "<br>" + versesN[1] },
    ...
];

// 3. 모드 제어
function setMode(mode, level) { ... }   // 'stage' | 'exam', 1~4

// 4. 학습 렌더링
function renderQuizzes() { ... }        // quizData → 단계별 HTML 생성

// 5. 모의고사
function startExam() { ... }           // 절 단위 순차 진행
function submitExamVerse() { ... }      // 채점 + 다음 절
function showExamResult() { ... }       // 결과 + 오답 노트
```

---

## 초성 추출 함수

```javascript
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
```

---

## 루트 index.html 구조

`chapterData` 배열로 카드 목록 동적 생성:

```javascript
const chapterData = [
    // isSpecial: true → 붉은 강조 카드 (시험 대비)
    { isSpecial: true, link: "bjtest_5passage/index.html", icon: "...", badge: "...", ... },
    
    // 일반 장 카드
    { num: 1, icon: "📜", title: "..." },
    ...
    { num: 22, icon: "🌳", title: "..." }
];
```

특별 카드는 `isSpecial: true` + `link`로 직접 URL 지정.  
일반 카드는 `num`으로 `bjtest{num}/index.html` 자동 매핑.

---

## 천국고시 모의고사 (bjtest_mock)

`bjtest_mock/index.html` — 단일 파일 SPA.  
계 1~11장 전체를 1~4단계 종합 시험으로 구성.  
주요 기능 → `memory/bjtest-applied-features.md` 참조.

**데이터 구조**: `EXAMS` 객체 → 단계별(stage) → 시험별(exam key) → titleData/verseData/blankData 배열.

---

## 배포

```bash
git add .
git commit -m "커밋 메시지"
git push   # → GitHub → Cloudflare Pages 자동 빌드/배포
```
