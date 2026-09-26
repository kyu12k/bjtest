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
**데이터 구조**: `EXAMS` 객체 → 단계별(stage) → 시험별(exam key) → titleData/verseData/blankData 배열.

---

## ★ 유지보수의 핵심 — 38개 페이지를 한꺼번에 고친다

이 사이트는 **거의 같은 HTML 38장**으로 되어 있다 (장별 22 + 시험별 16). 공통 기능을 고치려면 한 장만 고쳐서는 안 되고 **전부 고쳐야 한다.** 커밋 이력에 「(36개 페이지)」「(35개 페이지)」가 붙어 있는 것이 그 흔적이다.

**방법: 일괄 적용 스크립트를 쓴다.**

```bash
node apply_stage4.js          # 예시 — 옛 문자열을 찾아 새 문자열로 바꾸고 모든 폴더에 적용
```

`apply_stage4*.js` / `apply_stage4.py`가 과거에 쓴 실물 예시다. 새 일괄 수정을 할 때는 이 패턴을 따른다:

1. 한 장(예: `bjtest3/index.html`)에서 먼저 고쳐 **동작을 확인**한다
2. 바꿀 **옛 문자열 / 새 문자열** 쌍을 스크립트에 적는다
3. 모든 `bjtest*/index.html`을 돌며 치환하고, **바뀐 개수를 출력**한다
4. 개수가 예상과 다르면 멈춘다 — 어떤 장은 문자열이 조금 다를 수 있다
5. 커밋 메시지에 **몇 개 페이지에 적용했는지 적는다** (`… (36개 페이지)`)

> 한 장만 고치고 넘어가면 나머지 37장에서 그 버그가 계속 살아 있게 된다. 실제로 여러 번 겪은 일이다.

**공통 파일은 예외** — `nav.js`(플로팅 홈 버튼)·`sw.js`·`manifest.json`은 루트에 하나뿐이라 한 번만 고치면 된다.

---

## 채점 규칙 (모든 페이지 공통)

```javascript
function normCmp(s) {
    return (s || '').normalize('NFC').replace(/[\s\u200B-\u200D\uFEFF,]/g, '');
}
```

- **띄어쓰기와 쉼표는 채점에서 무시**한다. 보이지 않는 문자(zero-width)도 제거하고 한글은 NFC로 통일
- **채점과 오답 표시가 같은 정규화를 써야 한다.** 둘이 어긋나면 "맞았다는데 빨갛게 표시"가 난다 (2026 커밋에서 실제로 통일한 이력)
- 오답 노트는 글자 단위 LCS로 **틀린 글자(빨강)·빠뜨린 글자(주황)**를 구분한다

---

## 배포

```bash
git add .
git commit -m "커밋 메시지 (N개 페이지)"
git push   # → GitHub(kyu12k/bjtest) → Cloudflare Pages 자동 빌드/배포
```

- 캐싱이 없다 (`sw.js`는 아무것도 가로채지 않는 no-op). 푸시하면 바로 반영된다
- `.nojekyll`이 있어야 `_`로 시작하는 폴더도 서빙된다

---

## 작업할 때

- 페이지 하나가 50KB 안팎, `bjtest_mock/index.html`은 119KB다. 수정 전에 어느 장에 해당하는지 먼저 확인
- 본문 데이터는 **개역한글**이다. 다른 번역 표현을 섞지 않는다
- `{중괄호}`는 1단계 빈칸 대상 표시다. 본문을 고칠 때 중괄호를 잃지 않도록 주의
- 시험 폴더(`bjtest{N}_exam`, `bjtest_mock` 등)는 학습 페이지와 구조가 조금씩 다르다. 일괄 스크립트를 돌리기 전에 대상 목록을 확인
