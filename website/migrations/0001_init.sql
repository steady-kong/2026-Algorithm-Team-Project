-- 추천 엔진 영속화 스키마 (Cloudflare D1) — client_id(익명) 기준.
-- 인증/세션/OAuth 개념 없음. client_id 는 X-Client-Id(UUID v7) 익명 식별자.
-- JSON 컬럼은 직렬화된 문자열로 저장하며, 파싱 후 형태는 engine/types.ts 가 기술한다.

-- 추천 응답 이력: 한 행 = 한 번의 추천(카드 묶음).
CREATE TABLE IF NOT EXISTS recommendation_history (
	id TEXT PRIMARY KEY,
	client_id TEXT NOT NULL,
	ts INTEGER NOT NULL,
	query TEXT,
	target_json TEXT,
	cards_json TEXT
);

-- 사용자 피드백: 특정 추천 카드에 대한 좋아요/싫어요(vote) 와 5축 정보.
CREATE TABLE IF NOT EXISTS feedback (
	id TEXT PRIMARY KEY,
	client_id TEXT NOT NULL,
	recommendation_id TEXT,
	card_signature TEXT,
	axes_json TEXT,
	vote INTEGER,
	ts INTEGER NOT NULL
);

-- client_id 별 누적 취향 + 축별 통계.
CREATE TABLE IF NOT EXISTS taste_profiles (
	client_id TEXT PRIMARY KEY,
	profile_json TEXT,
	axis_stats_json TEXT,
	updated INTEGER NOT NULL
);

-- client_id 로 이력/피드백을 조회하므로 인덱스를 둔다.
CREATE INDEX IF NOT EXISTS idx_recommendation_history_client_id ON recommendation_history (client_id);
CREATE INDEX IF NOT EXISTS idx_feedback_client_id ON feedback (client_id);
