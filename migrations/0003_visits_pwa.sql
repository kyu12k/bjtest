-- 그날 첫 방문을 설치한 앱(PWA, display-mode: standalone)으로 열었는지. 1 = 앱, 0 = 브라우저 또는 기록 이전
ALTER TABLE visits ADD COLUMN pwa INTEGER NOT NULL DEFAULT 0;
