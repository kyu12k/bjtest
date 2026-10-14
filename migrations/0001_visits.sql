-- 방문 기록: 기기별 랜덤 ID(vid)를 하루 한 번만 저장. 개인정보 없음.
CREATE TABLE IF NOT EXISTS visits (
  day TEXT NOT NULL,   -- KST 기준 YYYY-MM-DD
  vid TEXT NOT NULL,
  PRIMARY KEY (day, vid)
);
CREATE INDEX IF NOT EXISTS idx_visits_vid_day ON visits (vid, day);
