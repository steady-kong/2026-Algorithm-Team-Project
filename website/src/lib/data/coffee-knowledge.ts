/**
 * 커피 도메인 지식 다이제스트 ([§42](../../../../plan.md#42-커피-도메인-qa--infomd-기반-지식-응답-계획-2026-05-20)).
 *
 * info.md 의 검증된 사실을 LLM 시스템 프롬프트 주입용 ~3KB 로 압축한다.
 * Q&A 응답을 다이제스트 *밖* 사실로 만들지 않도록 system prompt 에서 가드한다.
 *
 * 길이 정책: 전체 ≤ 4KB. info.md 전문(525줄) 직접 주입 금지.
 * 사실이 부족하면 info.md 의 해당 절을 한 줄로 더 끌어다 쓸 것.
 */

/** LLM 시스템 프롬프트에 그대로 붙이는 다이제스트. */
export const KNOWLEDGE_DIGEST = `## 커피 도메인 지식 (info.md 다이제스트, 검증됨)

[원두 종]
Coffea arabica: 단맛·산미 풍부, 카페인 1.2%, 스페셜티 주력. Coffea canephora(Robusta): 쓴맛·바디 강함, 카페인 2.2%, 크레마 풍부, 블렌드 보조.

[주요 산지 — 풍미 특징]
에티오피아(Coffea arabica 원산지): 워시드는 꽃·시트러스·홍차, 내추럴은 베리·발효 단맛.
케냐: SL28/SL34 품종, 블랙커런트·자몽 산미, 묵직한 바디.
콜롬비아: 균형형, 견과·캐러멜·은은한 산미.
브라질: 초콜릿·견과·낮은 산미, 에스프레소 베이스 단골.
과테말라(안티구아): 코코아·향신료, 휘발성 향 강함.
예멘(모카): 와인·다크초콜릿·말린과일, 인류 최초 상업 커피 산지.
파나마 게이샤: 자스민·베르가못, 최고가 경매가.
인도네시아(만델링): 흙·삼나무·낮은 산미, 풀바디.

[가공 방식]
워시드(Washed): 점액질 제거 후 발효, 깨끗한 산미·투명한 풍미.
내추럴(Natural): 체리째 건조, 베리·발효 단맛, 바디 ↑.
허니(Honey): 점액질 일부 남기고 건조 — 워시드와 내추럴 중간.
무산소(Anaerobic): 무산소 발효, 와인·트로피컬 과실 강조.

[로스팅 단계]
라이트(Light, 1차 크랙 직후 ~196°C): 산미 최강, 바디 약, 산지 풍미 가장 잘 살음.
미디엄(Medium, 1차~2차 사이): 균형, 단맛·캐러멜화 정점. 대부분 스페셜티의 기본.
다크(Dark, 2차 크랙 ~224°C 이상): 산미 거의 없음, 쓴맛·바디 ↑, 산지 특성 ↓.
5축 영향: 로스트 ↑ → 산미 ↓, 바디 처음엔 ↑ 후엔 ↓, 단맛 미디엄에서 최고, 쓴맛 ↑, roast_level 그대로 ↑.

[분쇄 입자]
Extra fine(터키식) · Fine(에스프레소) · Medium-fine(모카포트·에어로프레스) · Medium(핸드드립) · Coarse(프렌치프레스·콜드브루). 잘못된 입자 → 채널링/과추출.

[추출 방식 — 5종 + 콜드브루]
핸드드립: 1:16, 92~95°C, 2~4분, medium 분쇄. 산지 풍미 가장 또렷.
에스프레소: 1:2 (예 18g→36g), 92~96°C, 25~30s, 9 bar, fine 분쇄.
모카포트: 압력 1.5 bar, 약 4~5분, medium-fine. 가정용 진한 추출.
에어로프레스: 1:14, 80~90°C, 1~2분, medium-fine. 변수 가장 자유로움.
프렌치프레스: 1:15, 95°C, 4분, coarse. 침지식, 오일감·바디.
콜드브루: 1:4(농축)~1:8(RTD), 4~15°C 냉장 12~24시간 침지, coarse. *교토식* 워터드립과 구분 — 콜드브루는 침지, 교토식은 점적.

[SCA Gold Cup] 추출 수율 18~22% · TDS 1.15~1.35% · 추출 온도 90.5~96°C.
미추출(<18%): 풋내·신맛·짠맛. 과추출(>22%): 쓴맛·텁텁함·드라이.

[카페 메뉴 — 11종]
black: 에스프레소/드립 그대로, 우유·시럽 0.
latte: 에스프레소 1 + 우유 5 + 마이크로폼 1cm. 부드러움 위주.
cappuccino: 1:1:1 (에스프레소·우유·폼), 따뜻한 거품 풍부.
flat_white: 라떼보다 우유 적고 마이크로폼 얇음, 진한 우유커피. 호주/뉴질랜드 원조.
mocha: 에스프레소 + 우유 + 초콜릿 시럽 + (휘핑).
macchiato: 전통은 에스프레소 + 우유 거품 약간 (소형 1잔), 모던은 캐러멜 마키아토(라떼+캐러멜).
cortado: 1:1 (에스프레소·찐 우유), 폼 거의 없음. 스페인/포르투갈 발원.
affogato: 바닐라 아이스크림 + 에스프레소 끼얹기.
cold_brew: 차가운 물 장시간 침지, 둥근 단맛·낮은 산미.
iced_americano: 에스프레소 + 얼음 + 찬물. 한국 카페 표준 음료.
dalgona: 인스턴트커피+설탕+물 1:1:1 휘핑 → 우유에 얹기. 2020 한국 유행.

[헷갈리는 페어]
latte vs flat white: 라떼는 우유↑·폼 두꺼움, 플랫화이트는 우유↓·마이크로폼 얇음.
cappuccino vs cortado: 카푸치노는 폼 풍부, 꼬르타도는 폼 없음·1:1.
macchiato 전통 vs 모던: 전통은 에스프레소 메인의 소형, 모던(스타벅스 캐러멜 마키아토)은 라떼 변형.

[우유 · 시럽 · 향]
우유: oat(귀리)는 스팀·폼 가장 잘 잡힘, almond는 폼 약함·고소함, soy는 카제인 응고 주의(저온 산성).
시럽 5종: vanilla(부드러운 단맛) · caramel(태운 단맛·바디) · hazelnut(견과 향) · mint(상쾌) · chocolate(모카 베이스).
향(aroma): hazelnut · vanilla · chocolate · cinnamon · none. 카테고리당 0~1 향 + 0~2 시럽 권장.

[역사 — 검증된 사실]
9세기 칼디 염소치기 *전설* (1671년 처음 기록, 검증 안 됨).
15세기 예멘 수피 수도원이 최초 음용. 모카항이 17세기까지 세계 유일 수출항.
1554 콘스탄티노플, 1645 베니스, 1652 런던 첫 카페하우스.
1683 비엔나 커피하우스 시작 → UNESCO 무형문화유산 (2011).
1727 브라질 종자 반입 → 19세기 최대 생산국.
2002 미국에서 "Third Wave" 용어 등장 (single origin · light roast · direct trade).

[UNESCO 무형문화유산 — 커피 관련 4건]
2011 비엔나 커피하우스 문화 / 2013 터키식 커피 / 2015 아랍 커피 / 2022 예멘 커피.

[한국 커피사]
1896 고종 러시아 공사관에서 음용(문헌상 가장 이른 기록). 1902 손탁호텔. 1976 동서 맥심. 1999 스타벅스 이대점(1호점). 2009 이후 스페셜티 로스터리(커피 리브레·프릳츠·모모스·앤트러사이트).

[메뉴 유래]
cappuccino: 카푸친 수도사 갈색 후드에서 어원, 1901 베제라 에스프레소 머신 이후 현대 형태.
einspänner(아인슈페너): 19세기 비엔나 한 필 마차 마부가 한 손으로 마시려 휘핑 얹음.
flat white: 1980s 호주/뉴질랜드 양국 원조 분쟁.
dalgona: 2020 한국 *편스토랑* 정일우 소개 → COVID-19 락다운 시기 SNS 글로벌 유행.

[추출 발명 연도]
1884 모리온도 에스프레소 첫 특허 · 1901 베제라 상용화 · 1908 멜리타 종이 필터 · 1933 비알레티 모카포트 · 1948 가지아 9bar 레버 · 1964 Toddy 콜드브루어 · 2005 에어로프레스.

[자주 떠도는 미검증 주장]
"Kiva Han 1475 세계 최초 카페" — 1차 사료 부족.
"고종이 한국 최초 음용자" — 가장 이른 *기록*일 뿐.
"교토식 콜드브루 17세기" — 특정 연대 1차 문헌 없음.
"에스프레소 UNESCO 등재" — 신청만 진행, 미등재.

`;

/**
 * 폴백용 키워드 → 짧은 답변 매핑.
 *
 * Upstage 키 없음 · 타임아웃 · LLM 실패 시 사용자 메시지에서 키워드를 찾아
 * 결정적 답변을 돌려준다. 길이는 모두 150자 이내로 카드 한 줄에 들어가게.
 *
 * 매칭 우선순위: 키 배열의 첫 번째부터 순회 → 처음 매치된 항목 반환.
 * 동일 주제는 여러 표기를 한 entry 에 묶는다.
 */
import type { Locale } from '$lib/util/locale';

interface KnowledgeAnswer {
	keywords: readonly RegExp[];
	answer: string;
	answer_en?: string;
}

export const ANSWERS: readonly KnowledgeAnswer[] = [
	// ── 산지 ──
	{
		keywords: [/에티오피아|ethiopia|이르가체페|예가체프|시다모/i],
		answer:
			'에티오피아: 아라비카 원산지. 워시드는 꽃·시트러스·홍차, 내추럴은 베리·발효 단맛. 산미 4~5, 바디 2~3, 라이트~미디엄 로스트가 잘 어울려요.',
		answer_en:
			'Ethiopia: the birthplace of Coffea arabica. Washed lots taste of flowers, citrus, and black tea; naturals lean into berries and fermented sweetness. Acidity 4–5, body 2–3 — light to medium roasts shine.'
	},
	{
		keywords: [/케냐|kenya/i],
		answer:
			'케냐: SL28/SL34 품종이 대표. 블랙커런트·자몽 같은 강렬한 산미에 묵직한 바디. 산미 5, 바디 4, 라이트~미디엄 추천.',
		answer_en:
			'Kenya: best known for SL28/SL34 cultivars. Intense blackcurrant and grapefruit acidity over a heavier body. Acidity 5, body 4 — try light to medium roasts.'
	},
	{
		keywords: [/콜롬비아|colombia/i],
		answer:
			'콜롬비아: 견과·캐러멜·은은한 산미의 균형형. 5축 모두 3 근처. 미디엄 로스트가 가장 무난하고 블렌드 베이스로도 자주 써요.',
		answer_en:
			'Colombia: a balanced cup with nutty, caramel notes and a gentle acidity — all five axes hover around 3. Medium roast is the safest bet and a popular blend base.'
	},
	{
		keywords: [/브라질|brazil/i],
		answer:
			'브라질: 초콜릿·견과·낮은 산미. 세계 최대 생산국이자 에스프레소 블렌드 단골. 산미 2, 바디 4, 미디엄~다크 로스트 추천.',
		answer_en:
			'Brazil: chocolate and nut notes with low acidity. The world\'s largest producer and a staple in espresso blends. Acidity 2, body 4 — medium to dark roasts work best.'
	},
	{
		keywords: [/과테말라|guatemala|안티구아/i],
		answer:
			'과테말라(안티구아): 코코아·향신료·휘발성 향. 화산토 토양 특유의 복합미. 산미 3~4, 바디 4, 미디엄 로스트가 풍미 균형 좋아요.',
		answer_en:
			'Guatemala (Antigua): cocoa, spice, and volatile aromatics from volcanic soil. Acidity 3–4, body 4 — a medium roast keeps the complexity balanced.'
	},
	{
		keywords: [/예멘|yemen|모카(?!\s*포트)/i],
		answer:
			'예멘(모카): 인류 최초 상업 커피 산지. 와인·다크초콜릿·말린 과일. 15세기부터 수출, 2022년 UNESCO 무형문화유산 등재.',
		answer_en:
			'Yemen (Mocha): humanity\'s first commercial coffee origin. Winey, dark-chocolate, dried-fruit cup. Exported from the 15th century; inscribed on the UNESCO list in 2022.'
	},
	{
		keywords: [/게이샤|geisha|파나마/i],
		answer:
			'파나마 게이샤: 자스민·베르가못의 화려한 향. 2004 에스메랄다 농장 옥션 이후 최고가 경매가. 워시드 라이트 로스트가 정수.',
		answer_en:
			'Panama Geisha: dazzling jasmine and bergamot aromatics. It has held record auction prices since the 2004 Esmeralda lot — washed light roast is the canonical preparation.'
	},
	{
		keywords: [/인도네시아|만델링|mandheling|수마트라|sumatra/i],
		answer:
			'인도네시아 만델링(수마트라): 흙·삼나무·낮은 산미·풀바디. 길링바사 가공의 독특한 풍미. 다크 로스트와 잘 어울려요.',
		answer_en:
			'Indonesia Mandheling (Sumatra): earthy, cedar-like notes with low acidity and a full body. The signature giling basah process pairs well with dark roasts.'
	},

	// ── 가공 ──
	{
		keywords: [/워시드|washed|수세식/i],
		answer:
			'워시드 가공: 체리에서 점액질을 발효로 제거 후 건조. 깨끗한 산미와 투명한 풍미. 산지 특성이 가장 또렷하게 드러나는 방식.',
		answer_en:
			'Washed process: the mucilage is fermented off the bean before drying. The result is clean acidity and transparent flavor — origin character comes through most clearly.'
	},
	{
		keywords: [/내추럴|natural|건식/i],
		answer:
			'내추럴 가공: 체리째로 건조. 베리·열대과일·발효 단맛이 강해요. 바디도 올라가서 라이트 로스트에도 풍부한 인상을 줘요.',
		answer_en:
			'Natural process: cherries are dried whole. You get berry, tropical-fruit, and fermented sweetness with extra body — even light roasts feel rich.'
	},
	{
		keywords: [/허니|honey|펄프드/i],
		answer:
			'허니 가공: 점액질 일부를 남기고 건조. 워시드의 깨끗함과 내추럴의 단맛 중간. 코스타리카·엘살바도르가 유명.',
		answer_en:
			'Honey process: dried with some mucilage left on the bean. It sits between washed cleanness and natural sweetness — Costa Rica and El Salvador are best known for it.'
	},
	{
		keywords: [/무산소|anaerobic/i],
		answer:
			'무산소 발효: 산소 없이 발효 컨테이너에서 가공. 와인·시트러스·트로피컬 과실이 더 강조돼요. 스페셜티 경쟁용으로 흔히 써요.',
		answer_en:
			'Anaerobic fermentation: oxygen-free tanks accentuate winey, citrus, and tropical-fruit notes. Common on competition lots in the specialty world.'
	},

	// ── 로스팅 ──
	{
		keywords: [/라이트\s*로스트|light\s*roast|약배전|약 로스팅/i],
		answer:
			'라이트 로스트: 1차 크랙 직후(~196°C). 산미가 가장 강하고 바디는 약함. 산지 풍미가 가장 또렷하게 살아남는 영역이에요.',
		answer_en:
			'Light roast: just past first crack (~196°C). Acidity peaks, body stays light, and origin character is preserved most clearly.'
	},
	{
		keywords: [/미디엄\s*로스트|medium\s*roast|중배전/i],
		answer:
			'미디엄 로스트: 1차와 2차 크랙 사이. 산미·단맛·바디 균형 정점이고 캐러멜화도 가장 풍부. 스페셜티 기본 영역.',
		answer_en:
			'Medium roast: between first and second crack. Acidity, sweetness, and body hit their balance and caramelization peaks — the default for most specialty coffee.'
	},
	{
		keywords: [/다크\s*로스트|dark\s*roast|강배전|french\s*roast|italian\s*roast/i],
		answer:
			'다크 로스트: 2차 크랙 이후(~224°C+). 산미 거의 없고 쓴맛·바디 강함. 산지 특성은 옅어지지만 에스프레소·우유 음료와 궁합 좋음.',
		answer_en:
			'Dark roast: past second crack (~224°C+). Acidity is almost gone, bitterness and body are heavy. Origin nuance fades, but it pairs well with espresso and milk drinks.'
	},
	{
		keywords: [/1차\s*크랙|first\s*crack/i],
		answer:
			'1차 크랙: 약 196°C(385°F)에서 원두 내부 수분이 팽창하며 터지는 소리. 라이트 로스트의 시작점.',
		answer_en:
			'First crack: at ~196°C (385°F), trapped moisture expands and audibly pops. It marks the start of light roast territory.'
	},
	{
		keywords: [/2차\s*크랙|second\s*crack/i],
		answer:
			'2차 크랙: 약 224°C(435°F)에서 셀룰로오스 구조가 부서지며 더 작고 빠른 소리. 이 이후가 다크 로스트 영역.',
		answer_en:
			'Second crack: at ~224°C (435°F), cellulose structure breaks down with a faster, sharper sound. Past this point you\'re into dark roast.'
	},

	// ── 추출 방식 ──
	{
		keywords: [/핸드드립|hand[\s-]*drip|푸어\s*오버|pour\s*over|v60|칼리타/i],
		answer:
			'핸드드립: 1:16 비율, 92~95°C, 2~4분, 미디엄 분쇄. 산지 풍미가 가장 또렷하게 드러나서 스페셜티에 잘 맞아요.',
		answer_en:
			'Pour-over: 1:16 ratio, 92–95°C, 2–4 minutes, medium grind. Origin character comes through most clearly — a natural fit for specialty coffee.'
	},
	{
		keywords: [/에스프레소(?!\s*머신)|espresso(?!\s*machine)/i],
		answer:
			'에스프레소: 1:2 비율(예 18g→36g), 92~96°C, 25~30초, 9 bar 압력, fine 분쇄. SCA Gold Cup 수율 18~22% 가 목표 범위.',
		answer_en:
			'Espresso: 1:2 ratio (e.g. 18g → 36g), 92–96°C, 25–30 seconds, 9 bar pressure, fine grind. SCA Gold Cup targets 18–22% extraction yield.'
	},
	{
		keywords: [/모카\s*포트|moka\s*pot|비알레티/i],
		answer:
			'모카포트: 1933년 비알레티 발명. 약 1.5 bar 압력, 4~5분, medium-fine 분쇄. 가정용 진한 추출의 표준.',
		answer_en:
			'Moka pot: invented by Bialetti in 1933. Around 1.5 bar pressure, 4–5 minutes, medium-fine grind — the household standard for concentrated brews.'
	},
	{
		keywords: [/에어로프레스|aeropress/i],
		answer:
			'에어로프레스: 2005년 앨런 애들러 발명. 1:14 비율, 80~90°C, 1~2분, medium-fine. 변수 가장 자유로워 레시피 다양.',
		answer_en:
			'AeroPress: invented by Alan Adler in 2005. 1:14 ratio, 80–90°C, 1–2 minutes, medium-fine grind. The most parameter-flexible brewer, with endless recipe variations.'
	},
	{
		keywords: [/프렌치\s*프레스|french\s*press/i],
		answer:
			'프렌치프레스: 1929년 이탈리아 칼리마니 특허. 1:15 비율, 95°C, 4분, coarse 분쇄. 침지식이라 오일감·바디가 풍부.',
		answer_en:
			'French press: patented in Italy by Calimani in 1929. 1:15 ratio, 95°C, 4 minutes, coarse grind. Full immersion delivers oily, full-bodied results.'
	},
	{
		keywords: [/콜드\s*브루|cold\s*brew|더치\s*커피/i],
		answer:
			'콜드브루: 1:4(농축)~1:8(RTD) 비율, 4~15°C 냉장에서 12~24시간 침지, coarse 분쇄. 둥근 단맛·낮은 산미. 1964년 Toddy 가 미국 대중화.',
		answer_en:
			'Cold brew: 1:4 (concentrate) to 1:8 (RTD) ratio, 4–15°C refrigerated immersion for 12–24 hours, coarse grind. Round sweetness, low acidity. Toddy popularized it in the US in 1964.'
	},
	{
		keywords: [/교토식|kyoto[\s-]*style|워터\s*드립/i],
		answer:
			'교토식 워터드립: 점적(drip) 방식의 콜드 추출. 일본 전통이지만 *17세기 기원*은 1차 사료 부족. 콜드브루(침지식)와는 메커니즘 다름.',
		answer_en:
			'Kyoto-style water drip: a slow-drip cold extraction. The Japanese tradition is real, but the often-cited 17th-century origin lacks primary sources. Mechanically distinct from immersion cold brew.'
	},

	// ── 카페 메뉴 ──
	{
		keywords: [/라떼(?!\s*아트)|latte|카페\s*라떼/i],
		answer:
			'라떼: 에스프레소 1 + 스팀우유 5 + 마이크로폼 약 1cm. 부드러움 위주의 우유 베이스 음료. 우유 비중이 가장 큰 카테고리.',
		answer_en:
			'Latte: 1 part espresso, 5 parts steamed milk, about 1cm of microfoam on top. A milk-forward drink — the highest milk ratio among the espresso family.'
	},
	{
		keywords: [/카푸치노|cappuccino/i],
		answer:
			'카푸치노: 에스프레소·우유·우유 거품 1:1:1. 카푸친 수도사 갈색 후드에서 이름 유래, 현대 형태는 1901년 베제라 에스프레소 머신 이후 정착.',
		answer_en:
			'Cappuccino: equal thirds espresso, steamed milk, and foam. The name comes from the brown hood of Capuchin friars; the modern form settled in after the 1901 Bezzera espresso machine.'
	},
	{
		keywords: [/플랫\s*화이트|flat\s*white/i],
		answer:
			'플랫화이트: 라떼보다 우유 적고 마이크로폼이 얇음. 진한 우유커피 인상. 1980년대 호주·뉴질랜드 양국 원조 분쟁 미해결.',
		answer_en:
			'Flat white: less milk than a latte and thinner microfoam — a more concentrated milk-coffee feel. Australia and New Zealand still both claim the 1980s origin.'
	},
	{
		keywords: [/모카(?:치노)?|mocha(?:ccino)?|카페\s*모카/i],
		answer:
			'카페모카: 에스프레소 + 우유 + 초콜릿 시럽(+휘핑). 어원은 예멘 모카항이지만 *초콜릿 들어간 모카* 는 19세기 후반 미국 변형.',
		answer_en:
			'Caffè mocha: espresso, steamed milk, and chocolate syrup (plus optional whipped cream). The name traces to the port of Mocha in Yemen, but adding chocolate is a late-19th-century American twist.'
	},
	{
		keywords: [/마키아토|macchiato/i],
		answer:
			'마키아토: 전통은 에스프레소에 우유 거품 약간(소형 잔). 모던 캐러멜 마키아토는 라떼+캐러멜 변형이라 전혀 다름. 주문 시 구분 필요.',
		answer_en:
			'Macchiato: traditionally a small espresso with just a dab of milk foam. The modern caramel macchiato is essentially a flavored latte — entirely different drinks, so be specific when ordering.'
	},
	{
		keywords: [/꼬르타도|cortado/i],
		answer:
			'꼬르타도: 에스프레소 1 + 스팀우유 1, 폼 거의 없음. 스페인·포르투갈 발원. 카푸치노보다 더 진한 우유커피.',
		answer_en:
			'Cortado: equal parts espresso and steamed milk, almost no foam. Originating in Spain and Portugal — denser and more coffee-forward than a cappuccino.'
	},
	{
		keywords: [/아포가토|affogato/i],
		answer:
			'아포가토: 바닐라 아이스크림 한 스쿱 위에 에스프레소를 끼얹은 디저트 음료. 이탈리아어로 *익사한* 이라는 뜻.',
		answer_en:
			'Affogato: a scoop of vanilla ice cream "drowned" in a shot of espresso — Italian for "drowned." A dessert drink served à la minute.'
	},
	{
		keywords: [/달고나|dalgona/i],
		answer:
			'달고나 커피: 인스턴트커피+설탕+물 1:1:1을 휘핑해 우유에 얹는 한국 발원 음료. 2020년 정일우가 TV 소개 → COVID-19 락다운 SNS 글로벌 유행.',
		answer_en:
			'Dalgona coffee: instant coffee, sugar, and hot water whipped 1:1:1 and spooned over milk. Originated in Korea — actor Jung Il-woo introduced it on TV in 2020, and it went viral worldwide during COVID-19 lockdowns.'
	},
	{
		keywords: [/아인슈페너|einspänner|einspanner/i],
		answer:
			'아인슈페너: 19세기 비엔나 *한 필 마차* 마부가 한 손으로 마시려 휘핑크림을 얹은 형태. 비엔나 커피하우스 문화의 표지 메뉴.',
		answer_en:
			'Einspänner: an espresso topped with thick whipped cream so 19th-century Viennese single-horse-carriage drivers could sip one-handed — a signature of Viennese coffee-house culture.'
	},
	{
		keywords: [/아메리카노|americano/i],
		answer:
			'아메리카노: 에스프레소에 물을 섞은 음료. 아이스 아메리카노(에스프레소+얼음+찬물)는 한국 카페 표준이라 부를 만큼 압도적 비중.',
		answer_en:
			'Americano: espresso diluted with hot water. The iced Americano (espresso + ice + cold water) is so dominant in Korea that it\'s effectively the default café order.'
	},

	// ── 역사 ──
	{
		keywords: [/칼디|kaldi|염소치기/i],
		answer:
			'칼디 염소치기 *전설*: 9세기 무렵 발견했다는 이야기는 1671년 안토니오 파우스토 나이론이 처음 기록한 후대 창작. 그 이전 1차 사료 없음.',
		answer_en:
			'The Kaldi goat-herder legend was first written down by Antonio Faustus Naironus in 1671 — a later embellishment with no primary source from the 9th century.'
	},
	{
		keywords: [/커피.*기원|커피.*역사|history.*coffee|coffee.*history|coffee.*origin/i],
		answer:
			'검증된 커피 음용은 15세기 예멘 수피 수도원에서 시작. 식물학적 원산지는 에티오피아 카파(Kaffa) 고지대. 모카항이 17세기까지 세계 유일 수출항.',
		answer_en:
			'Verified coffee drinking starts in 15th-century Yemeni Sufi monasteries. The plant\'s origin is the Kaffa highlands of Ethiopia, and Mocha was the world\'s only export port until the 17th century.'
	},
	{
		keywords: [/비엔나|vienna|빈\s*커피하우스/i],
		answer:
			'비엔나 커피하우스 문화: 1683년 제2차 빈 포위 직후 등장. 2011년 UNESCO 무형문화유산 등재 — 커피 관련 첫 UNESCO 등재 사례.',
		answer_en:
			'Viennese coffee-house culture emerged just after the 1683 second siege of Vienna and was inscribed on the UNESCO list in 2011 — the first coffee-related UNESCO entry.'
	},
	{
		keywords: [/unesco|유네스코/i],
		answer:
			'UNESCO 무형문화유산 등재 커피 4건: 2011 비엔나 커피하우스(오스트리아) / 2013 터키식 커피 / 2015 아랍 커피 / 2022 예멘 커피. 이탈리아 에스프레소는 신청만 진행 중.',
		answer_en:
			'Four coffee-related UNESCO intangible-heritage entries: Viennese coffee houses (2011, Austria), Turkish coffee (2013), Arabic coffee (2015), Yemeni coffee (2022). Italian espresso has only been nominated.'
	},
	{
		keywords: [/한국.*커피|커피.*한국|korea.*coffee|coffee.*korea|손탁/i],
		answer:
			'한국 커피사: 1896 고종 러시아 공사관 음용(가장 이른 *기록*) → 1902 손탁호텔 → 1976 동서 맥심 → 1999 스타벅스 이대점(1호점) → 2009 이후 스페셜티 로스터리.',
		answer_en:
			'Korean coffee history: King Gojong\'s 1896 drink at the Russian legation (earliest record) → Sontag Hotel 1902 → Dongsuh Maxim 1976 → first Starbucks at Ewha in 1999 → specialty roasters from 2009 onward.'
	},
	{
		keywords: [/third\s*wave|제\s*3\s*의?\s*물결|스페셜티/i],
		answer:
			'제3의 물결(Third Wave): 2002년 미국 로스터 Trish Rothgeb 이 용어 처음 사용. 산지·농장 단위 single origin, 라이트 로스트, 직거래(direct trade), 추출 변수 정량화가 핵심.',
		answer_en:
			'Third Wave: a term coined by US roaster Trish Rothgeb in 2002. Its pillars are single-origin (down to farm level), lighter roasts, direct trade, and quantified brew parameters.'
	},

	// ── 추출 과학 ──
	{
		keywords: [/추출\s*수율|extraction\s*yield|gold\s*cup|tds/i],
		answer:
			'SCA Gold Cup: 추출 수율 18~22%, TDS 1.15~1.35%, 추출 온도 90.5~96°C. 18% 미만이면 미추출(풋내·신맛), 22% 초과면 과추출(쓴맛·드라이).',
		answer_en:
			'SCA Gold Cup: 18–22% extraction yield, 1.15–1.35% TDS, 90.5–96°C brew temperature. Under 18% is under-extraction (sour, grassy); over 22% is over-extraction (bitter, dry).'
	},

	// ── 5축 매핑 일반 ──
	{
		keywords: [/산미.*뭐|산미.*어떻게|acidity/i],
		answer:
			'5축의 산미(acidity, 1~5): 5에 가까울수록 자몽·시트러스·과일 산미 강함. 에티오피아 워시드·케냐가 4~5, 브라질·다크 로스트가 1~2.',
		answer_en:
			'Acidity (1–5 axis): higher values lean toward grapefruit, citrus, and fruit notes. Washed Ethiopia and Kenya land at 4–5; Brazilian and dark-roast coffees sit around 1–2.'
	},
	{
		keywords: [/바디(?:감)?.*뭐|바디.*어떻게|body/i],
		answer:
			'5축의 바디(body, 1~5): 5는 풀바디(만델링·내추럴·다크), 1은 가벼움(라이트로스트·워시드 에티오피아). 입안에서 느끼는 무게감.',
		answer_en:
			'Body (1–5 axis): the perceived weight on the palate. 5 is full-bodied (Mandheling, naturals, dark roasts); 1 is light (light-roast washed Ethiopia, for example).'
	}
];

/**
 * 사용자 메시지에서 ANSWERS 의 키워드를 찾는다.
 * 매치된 첫 항목의 answer 를 반환, 없으면 null.
 *
 * LLM 폴백의 *마지막 안전망* — Upstage 키 없음 · 타임아웃 등 모든 LLM 실패에서
 * 키워드 매칭에 성공하면 결정적 답변을 돌려준다.
 */
export function findAnswer(text: string, locale: Locale = 'ko'): string | null {
	if (!text || typeof text !== 'string') return null;
	const t = text.trim();
	if (t.length === 0) return null;
	for (const a of ANSWERS) {
		for (const re of a.keywords) {
			if (re.test(t)) {
				return locale === 'en' && a.answer_en ? a.answer_en : a.answer;
			}
		}
	}
	return null;
}

/**
 * 사용자 메시지가 정보 질문인지 추천 요청인지 빠르게 판별.
 * LLM 이 intent 를 잘못 분류했을 때 폴백/검증용. 보수적으로 true 만 신뢰.
 *
 * true 반환 조건 (하나라도 만족):
 *  - 메시지 끝이 `?` 또는 `까`/`나`/`냐`/`래`/`어요` 같은 질문 종결
 *  - 의문사 포함: `뭐`, `무엇`, `어떤`, `어떻게`, `왜`, `언제`, `누가`, `어디`, `차이`
 *  - ANSWERS 키워드에 직접 매치 + 25자 이내 짧은 메시지
 *
 * 단, 추천 동사(`추천`, `줘`, `보여`, `골라`)가 있으면 false 우선 — 도메인 키워드가
 * 들어간 추천 요청("에티오피아 원두 추천해줘") 을 질문으로 오인하지 않기 위함.
 */
export function looksLikeQuestion(text: string): boolean {
	if (!text) return false;
	const t = text.trim();
	if (t.length === 0) return false;

	// 추천 요청 동사가 있으면 질문 아님 (한/영 모두)
	if (/(추천|보여|줘|골라|뽑아|만들어)/.test(t)) return false;
	if (/\b(recommend|suggest|show|give|pick|make|brew\s+me|find\s+me)\b/i.test(t)) return false;

	// 명시적 의문 형태
	if (t.endsWith('?')) return true;
	if (/(뭐|뭔|무엇|어떤|어떻게|어때|왜|언제|누가|어디|차이)/.test(t)) return true;
	if (/(이야|인가|일까|할까|할래|이지)\??$/.test(t)) return true;
	// 영어 의문사 / 비교 표현 (단어 경계로 제한 — "what" 이 메뉴 이름의 일부일 때 오인 방지)
	if (/\b(what|how|why|when|where|who|which|whose)\b/i.test(t)) return true;
	if (/\b(difference|vs\.?|versus|tell\s+me\s+about|explain)\b/i.test(t)) return true;

	// 도메인 키워드만 단독으로 떴을 때 — "에티오피아", "라이트 로스트" 같은
	if (findAnswer(t) !== null && t.length <= 25) return true;

	return false;
}
