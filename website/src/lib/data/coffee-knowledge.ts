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
			'에티오피아는 아라비카의 원산지예요. 워시드는 꽃·시트러스·홍차 향이, 내추럴은 베리와 발효된 단맛이 도드라져요. 산미가 4~5로 높고 바디는 2~3로 가벼운 편이라 라이트~미디엄 로스트가 잘 어울려요.',
		answer_en:
			'Ethiopia: the birthplace of Coffea arabica. Washed lots taste of flowers, citrus, and black tea; naturals lean into berries and fermented sweetness. Acidity 4–5, body 2–3 — light to medium roasts shine.'
	},
	{
		keywords: [/케냐|kenya/i],
		answer:
			'케냐는 SL28·SL34 품종이 대표적이에요. 블랙커런트·자몽 같은 강렬한 산미에 묵직한 바디가 받쳐줘요. 산미 5, 바디 4 정도라 라이트~미디엄 로스트를 추천드려요.',
		answer_en:
			'Kenya: best known for SL28/SL34 cultivars. Intense blackcurrant and grapefruit acidity over a heavier body. Acidity 5, body 4 — try light to medium roasts.'
	},
	{
		keywords: [/콜롬비아|colombia/i],
		answer:
			'콜롬비아는 견과·캐러멜 풍미에 은은한 산미가 어우러진 균형형이에요. 5축이 모두 3 근처라 미디엄 로스트가 가장 무난하고, 블렌드 베이스로도 자주 쓰여요.',
		answer_en:
			'Colombia: a balanced cup with nutty, caramel notes and a gentle acidity — all five axes hover around 3. Medium roast is the safest bet and a popular blend base.'
	},
	{
		keywords: [/브라질|brazil/i],
		answer:
			'브라질은 초콜릿·견과 풍미에 산미가 낮은 편이에요. 세계 최대 생산국이자 에스프레소 블렌드의 단골이죠. 산미 2, 바디 4 정도라 미디엄~다크 로스트가 잘 맞아요.',
		answer_en:
			'Brazil: chocolate and nut notes with low acidity. The world\'s largest producer and a staple in espresso blends. Acidity 2, body 4 — medium to dark roasts work best.'
	},
	{
		keywords: [/과테말라|guatemala|안티구아/i],
		answer:
			'과테말라 안티구아는 화산토 토양에서 오는 코코아·향신료 향과 복합적인 풍미가 특징이에요. 산미 3~4, 바디 4 정도라 미디엄 로스트가 풍미 균형이 좋아요.',
		answer_en:
			'Guatemala (Antigua): cocoa, spice, and volatile aromatics from volcanic soil. Acidity 3–4, body 4 — a medium roast keeps the complexity balanced.'
	},
	{
		keywords: [/예멘|yemen|모카(?!\s*포트)/i],
		answer:
			'예멘 모카는 인류 최초의 상업 커피 산지예요. 와인·다크초콜릿·말린 과일 같은 풍미가 나죠. 15세기부터 수출됐고, 2022년 유네스코 무형문화유산에 등재됐어요.',
		answer_en:
			'Yemen (Mocha): humanity\'s first commercial coffee origin. Winey, dark-chocolate, dried-fruit cup. Exported from the 15th century; inscribed on the UNESCO list in 2022.'
	},
	{
		keywords: [/게이샤|geisha|파나마/i],
		answer:
			'파나마 게이샤는 자스민·베르가못 같은 화려한 향이 매력이에요. 2004년 에스메랄다 농장 옥션 이후로 최고가 경매가를 이어오고 있고, 워시드 라이트 로스트가 그 진가를 가장 잘 보여줘요.',
		answer_en:
			'Panama Geisha: dazzling jasmine and bergamot aromatics. It has held record auction prices since the 2004 Esmeralda lot — washed light roast is the canonical preparation.'
	},
	{
		keywords: [/인도네시아|만델링|mandheling|수마트라|sumatra/i],
		answer:
			'인도네시아 만델링(수마트라)은 흙·삼나무 같은 향에 산미가 낮고 바디가 풀바디예요. 길링바사라는 독특한 가공 방식에서 오는 개성으로, 다크 로스트와 잘 어울려요.',
		answer_en:
			'Indonesia Mandheling (Sumatra): earthy, cedar-like notes with low acidity and a full body. The signature giling basah process pairs well with dark roasts.'
	},

	// ── 가공 ──
	{
		keywords: [/워시드|washed|수세식/i],
		answer:
			'워시드 가공은 체리에서 점액질을 발효로 제거한 뒤 건조해요. 깨끗한 산미와 투명한 풍미가 살아나서, 산지 특성이 가장 또렷하게 드러나는 방식이에요.',
		answer_en:
			'Washed process: the mucilage is fermented off the bean before drying. The result is clean acidity and transparent flavor — origin character comes through most clearly.'
	},
	{
		keywords: [/내추럴|natural|건식/i],
		answer:
			'내추럴 가공은 체리째로 건조해요. 베리·열대과일 같은 발효 단맛이 강하게 올라오고 바디도 좋아져서, 라이트 로스트에서도 풍부한 인상을 줘요.',
		answer_en:
			'Natural process: cherries are dried whole. You get berry, tropical-fruit, and fermented sweetness with extra body — even light roasts feel rich.'
	},
	{
		keywords: [/허니|honey|펄프드/i],
		answer:
			'허니 가공은 점액질을 일부 남기고 건조해요. 워시드의 깨끗함과 내추럴의 단맛 중간쯤이고, 코스타리카와 엘살바도르가 특히 유명해요.',
		answer_en:
			'Honey process: dried with some mucilage left on the bean. It sits between washed cleanness and natural sweetness — Costa Rica and El Salvador are best known for it.'
	},
	{
		keywords: [/무산소|anaerobic/i],
		answer:
			'무산소 발효는 산소를 차단한 탱크에서 가공해요. 와인·시트러스·트로피컬 과일 풍미가 더 강조돼서, 스페셜티 대회용 로트에 흔히 쓰여요.',
		answer_en:
			'Anaerobic fermentation: oxygen-free tanks accentuate winey, citrus, and tropical-fruit notes. Common on competition lots in the specialty world.'
	},

	// ── 로스팅 ──
	{
		keywords: [/라이트\s*로스트|light\s*roast|약배전|약 로스팅/i],
		answer:
			'라이트 로스트는 1차 크랙 직후(약 196°C) 단계예요. 산미가 가장 강하고 바디는 가벼우며, 산지 고유의 풍미가 가장 또렷하게 살아나요.',
		answer_en:
			'Light roast: just past first crack (~196°C). Acidity peaks, body stays light, and origin character is preserved most clearly.'
	},
	{
		keywords: [/미디엄\s*로스트|medium\s*roast|중배전/i],
		answer:
			'미디엄 로스트는 1차와 2차 크랙 사이예요. 산미·단맛·바디의 균형과 캐러멜화가 정점에 올라서, 대부분의 스페셜티가 기본으로 삼는 단계예요.',
		answer_en:
			'Medium roast: between first and second crack. Acidity, sweetness, and body hit their balance and caramelization peaks — the default for most specialty coffee.'
	},
	{
		keywords: [/다크\s*로스트|dark\s*roast|강배전|french\s*roast|italian\s*roast/i],
		answer:
			'다크 로스트는 2차 크랙 이후(약 224°C 이상)예요. 산미는 거의 사라지고 쓴맛과 바디가 강해져요. 산지 특성은 옅어지지만 에스프레소나 우유 음료와는 궁합이 좋아요.',
		answer_en:
			'Dark roast: past second crack (~224°C+). Acidity is almost gone, bitterness and body are heavy. Origin nuance fades, but it pairs well with espresso and milk drinks.'
	},
	{
		keywords: [/1차\s*크랙|first\s*crack/i],
		answer:
			'1차 크랙은 약 196°C(385°F)에서 원두 속 수분이 팽창하며 터지는 소리예요. 라이트 로스트가 시작되는 지점이에요.',
		answer_en:
			'First crack: at ~196°C (385°F), trapped moisture expands and audibly pops. It marks the start of light roast territory.'
	},
	{
		keywords: [/2차\s*크랙|second\s*crack/i],
		answer:
			'2차 크랙은 약 224°C(435°F)에서 셀룰로오스 구조가 부서지며 나는 더 작고 빠른 소리예요. 이 지점을 넘어서면 다크 로스트 영역이에요.',
		answer_en:
			'Second crack: at ~224°C (435°F), cellulose structure breaks down with a faster, sharper sound. Past this point you\'re into dark roast.'
	},

	// ── 추출 방식 ──
	{
		keywords: [/핸드드립|hand[\s-]*drip|푸어\s*오버|pour\s*over|v60|칼리타/i],
		answer:
			'핸드드립은 1:16 비율로 92~95°C 물을 2~4분에 걸쳐 내리고, 미디엄으로 분쇄해요. 산지 풍미가 가장 또렷하게 드러나서 스페셜티와 잘 맞아요.',
		answer_en:
			'Pour-over: 1:16 ratio, 92–95°C, 2–4 minutes, medium grind. Origin character comes through most clearly — a natural fit for specialty coffee.'
	},
	{
		keywords: [/에스프레소(?!\s*머신)|espresso(?!\s*machine)/i],
		answer:
			'에스프레소는 1:2 비율(예: 18g로 36g 추출), 92~96°C, 25~30초, 9 bar 압력에 곱게 분쇄해요. SCA 골드컵 기준 수율 18~22%가 목표 범위예요.',
		answer_en:
			'Espresso: 1:2 ratio (e.g. 18g → 36g), 92–96°C, 25–30 seconds, 9 bar pressure, fine grind. SCA Gold Cup targets 18–22% extraction yield.'
	},
	{
		keywords: [/모카\s*포트|moka\s*pot|비알레티/i],
		answer:
			'모카포트는 1933년 비알레티가 발명했어요. 약 1.5 bar 압력으로 4~5분, 중간보다 살짝 곱게 분쇄해요. 가정에서 진하게 내리는 표준 도구예요.',
		answer_en:
			'Moka pot: invented by Bialetti in 1933. Around 1.5 bar pressure, 4–5 minutes, medium-fine grind — the household standard for concentrated brews.'
	},
	{
		keywords: [/에어로프레스|aeropress/i],
		answer:
			'에어로프레스는 2005년 앨런 애들러가 발명했어요. 1:14 비율, 80~90°C, 1~2분, 중간보다 살짝 곱게 분쇄해요. 변수를 가장 자유롭게 조절할 수 있어 레시피가 다양해요.',
		answer_en:
			'AeroPress: invented by Alan Adler in 2005. 1:14 ratio, 80–90°C, 1–2 minutes, medium-fine grind. The most parameter-flexible brewer, with endless recipe variations.'
	},
	{
		keywords: [/프렌치\s*프레스|french\s*press/i],
		answer:
			'프렌치프레스는 1929년 이탈리아의 칼리마니가 특허를 냈어요. 1:15 비율로 95°C, 4분, 굵게 분쇄해요. 침지식이라 오일감과 바디가 풍부해요.',
		answer_en:
			'French press: patented in Italy by Calimani in 1929. 1:15 ratio, 95°C, 4 minutes, coarse grind. Full immersion delivers oily, full-bodied results.'
	},
	{
		keywords: [/콜드\s*브루|cold\s*brew|더치\s*커피/i],
		answer:
			'콜드브루는 1:4(농축)에서 1:8(바로 마시는 농도) 비율로, 4~15°C 냉장에서 12~24시간 침지하고 굵게 분쇄해요. 둥근 단맛에 산미가 낮은 게 특징이고, 1964년 Toddy가 미국에서 대중화했어요.',
		answer_en:
			'Cold brew: 1:4 (concentrate) to 1:8 (RTD) ratio, 4–15°C refrigerated immersion for 12–24 hours, coarse grind. Round sweetness, low acidity. Toddy popularized it in the US in 1964.'
	},
	{
		keywords: [/교토식|kyoto[\s-]*style|워터\s*드립/i],
		answer:
			'교토식 워터드립은 한 방울씩 떨어뜨리는 점적 방식의 콜드 추출이에요. 일본 전통이긴 하지만 흔히 말하는 17세기 기원설은 1차 사료가 부족해요. 침지식인 콜드브루와는 추출 메커니즘이 달라요.',
		answer_en:
			'Kyoto-style water drip: a slow-drip cold extraction. The Japanese tradition is real, but the often-cited 17th-century origin lacks primary sources. Mechanically distinct from immersion cold brew.'
	},

	// ── 카페 메뉴 ──
	{
		keywords: [/라떼(?!\s*아트)|latte|카페\s*라떼/i],
		answer:
			'라떼는 에스프레소 1에 스팀 우유 5, 위에 마이크로폼을 약 1cm 올린 음료예요. 부드러움 위주의 우유 베이스로, 에스프레소 음료 중 우유 비중이 가장 커요.',
		answer_en:
			'Latte: 1 part espresso, 5 parts steamed milk, about 1cm of microfoam on top. A milk-forward drink — the highest milk ratio among the espresso family.'
	},
	{
		keywords: [/카푸치노|cappuccino/i],
		answer:
			'카푸치노는 에스프레소·스팀 우유·우유 거품을 1:1:1로 맞춘 음료예요. 이름은 카푸친 수도사의 갈색 후드에서 유래했고, 지금의 형태는 1901년 베제라 에스프레소 머신 이후에 자리 잡았어요.',
		answer_en:
			'Cappuccino: equal thirds espresso, steamed milk, and foam. The name comes from the brown hood of Capuchin friars; the modern form settled in after the 1901 Bezzera espresso machine.'
	},
	{
		keywords: [/플랫\s*화이트|flat\s*white/i],
		answer:
			'플랫화이트는 라떼보다 우유가 적고 마이크로폼이 얇아서 더 진한 우유 커피 느낌이에요. 1980년대 호주와 뉴질랜드가 서로 원조라 주장하는데 아직 결론은 없어요.',
		answer_en:
			'Flat white: less milk than a latte and thinner microfoam — a more concentrated milk-coffee feel. Australia and New Zealand still both claim the 1980s origin.'
	},
	{
		keywords: [/모카(?:치노)?|mocha(?:ccino)?|카페\s*모카/i],
		answer:
			'카페모카는 에스프레소에 우유와 초콜릿 시럽을 더하고, 취향에 따라 휘핑크림을 올려요. 이름은 예멘 모카항에서 왔지만, 초콜릿을 넣는 방식은 19세기 후반 미국에서 변형된 거예요.',
		answer_en:
			'Caffè mocha: espresso, steamed milk, and chocolate syrup (plus optional whipped cream). The name traces to the port of Mocha in Yemen, but adding chocolate is a late-19th-century American twist.'
	},
	{
		keywords: [/마키아토|macchiato/i],
		answer:
			'전통 마키아토는 작은 잔에 에스프레소를 담고 우유 거품을 살짝 얹은 음료예요. 요즘의 캐러멜 마키아토는 라떼에 캐러멜을 더한 변형이라 전혀 다르니, 주문할 때 구분하시는 게 좋아요.',
		answer_en:
			'Macchiato: traditionally a small espresso with just a dab of milk foam. The modern caramel macchiato is essentially a flavored latte — entirely different drinks, so be specific when ordering.'
	},
	{
		keywords: [/꼬르타도|cortado/i],
		answer:
			'꼬르타도는 에스프레소 1에 스팀 우유 1을 더하고 거품은 거의 없는 음료예요. 스페인·포르투갈에서 시작됐고, 카푸치노보다 더 진한 우유 커피예요.',
		answer_en:
			'Cortado: equal parts espresso and steamed milk, almost no foam. Originating in Spain and Portugal — denser and more coffee-forward than a cappuccino.'
	},
	{
		keywords: [/아포가토|affogato/i],
		answer:
			'아포가토는 바닐라 아이스크림 한 스쿱 위에 에스프레소를 끼얹어 먹는 디저트 음료예요. 이탈리아어로 \'익사한\'이라는 뜻이에요.',
		answer_en:
			'Affogato: a scoop of vanilla ice cream "drowned" in a shot of espresso — Italian for "drowned." A dessert drink served à la minute.'
	},
	{
		keywords: [/달고나|dalgona/i],
		answer:
			'달고나 커피는 인스턴트커피·설탕·물을 1:1:1로 휘핑해 우유 위에 얹는 한국 발원 음료예요. 2020년 배우 정일우가 TV에서 소개한 뒤, 코로나19 봉쇄 시기에 SNS를 타고 전 세계로 퍼졌어요.',
		answer_en:
			'Dalgona coffee: instant coffee, sugar, and hot water whipped 1:1:1 and spooned over milk. Originated in Korea — actor Jung Il-woo introduced it on TV in 2020, and it went viral worldwide during COVID-19 lockdowns.'
	},
	{
		keywords: [/아인슈페너|einspänner|einspanner/i],
		answer:
			'아인슈페너는 19세기 비엔나에서 한 마리 말이 끄는 마차의 마부가 한 손으로 마시려고 에스프레소에 휘핑크림을 두껍게 얹은 데서 비롯됐어요. 비엔나 커피하우스 문화를 상징하는 메뉴예요.',
		answer_en:
			'Einspänner: an espresso topped with thick whipped cream so 19th-century Viennese single-horse-carriage drivers could sip one-handed — a signature of Viennese coffee-house culture.'
	},
	{
		keywords: [/아메리카노|americano/i],
		answer:
			'아메리카노는 에스프레소에 물을 섞은 음료예요. 특히 아이스 아메리카노(에스프레소에 얼음과 찬물)는 한국 카페의 사실상 기본이라 할 만큼 비중이 압도적이에요.',
		answer_en:
			'Americano: espresso diluted with hot water. The iced Americano (espresso + ice + cold water) is so dominant in Korea that it\'s effectively the default café order.'
	},

	// ── 역사 ──
	{
		keywords: [/칼디|kaldi|염소치기/i],
		answer:
			'칼디 염소치기 전설은 9세기 무렵 커피를 발견했다는 이야기지만, 1671년 안토니오 파우스토 나이론이 처음 기록한 후대 창작이에요. 그 이전의 1차 사료는 없어요.',
		answer_en:
			'The Kaldi goat-herder legend was first written down by Antonio Faustus Naironus in 1671 — a later embellishment with no primary source from the 9th century.'
	},
	{
		keywords: [/커피.*기원|커피.*역사|history.*coffee|coffee.*history|coffee.*origin/i],
		answer:
			'검증된 커피 음용은 15세기 예멘의 수피 수도원에서 시작됐어요. 식물학적 원산지는 에티오피아 카파(Kaffa) 고지대이고, 모카항이 17세기까지 세계 유일의 수출항이었어요.',
		answer_en:
			'Verified coffee drinking starts in 15th-century Yemeni Sufi monasteries. The plant\'s origin is the Kaffa highlands of Ethiopia, and Mocha was the world\'s only export port until the 17th century.'
	},
	{
		keywords: [/비엔나|vienna|빈\s*커피하우스/i],
		answer:
			'비엔나 커피하우스 문화는 1683년 제2차 빈 포위 직후에 등장했어요. 2011년 유네스코 무형문화유산에 등재됐는데, 커피 관련으로는 첫 등재 사례예요.',
		answer_en:
			'Viennese coffee-house culture emerged just after the 1683 second siege of Vienna and was inscribed on the UNESCO list in 2011 — the first coffee-related UNESCO entry.'
	},
	{
		keywords: [/unesco|유네스코/i],
		answer:
			'유네스코 무형문화유산에 등재된 커피는 네 건이에요. 2011년 비엔나 커피하우스(오스트리아), 2013년 터키식 커피, 2015년 아랍 커피, 2022년 예멘 커피죠. 이탈리아 에스프레소는 아직 신청 단계예요.',
		answer_en:
			'Four coffee-related UNESCO intangible-heritage entries: Viennese coffee houses (2011, Austria), Turkish coffee (2013), Arabic coffee (2015), Yemeni coffee (2022). Italian espresso has only been nominated.'
	},
	{
		keywords: [/한국.*커피|커피.*한국|korea.*coffee|coffee.*korea|손탁/i],
		answer:
			'한국 커피의 역사를 짚어보면, 1896년 고종이 러시아 공사관에서 마신 게 가장 이른 기록이에요. 이후 1902년 손탁호텔, 1976년 동서 맥심, 1999년 스타벅스 이대점(1호점)을 거쳐 2009년부터 스페셜티 로스터리가 자리 잡았어요.',
		answer_en:
			'Korean coffee history: King Gojong\'s 1896 drink at the Russian legation (earliest record) → Sontag Hotel 1902 → Dongsuh Maxim 1976 → first Starbucks at Ewha in 1999 → specialty roasters from 2009 onward.'
	},
	{
		keywords: [/third\s*wave|제\s*3\s*의?\s*물결|스페셜티/i],
		answer:
			'제3의 물결(Third Wave)은 2002년 미국 로스터 트리시 로스겝이 처음 쓴 말이에요. 농장 단위까지 따지는 싱글 오리진, 라이트 로스트, 직거래, 추출 변수의 정량화가 핵심이에요.',
		answer_en:
			'Third Wave: a term coined by US roaster Trish Rothgeb in 2002. Its pillars are single-origin (down to farm level), lighter roasts, direct trade, and quantified brew parameters.'
	},

	// ── 추출 과학 ──
	{
		keywords: [/추출\s*수율|extraction\s*yield|gold\s*cup|tds/i],
		answer:
			'SCA 골드컵 기준은 추출 수율 18~22%, TDS 1.15~1.35%, 추출 온도 90.5~96°C예요. 18% 미만이면 덜 뽑혀 풋내·신맛이 나고, 22%를 넘으면 과하게 뽑혀 쓰고 텁텁해져요.',
		answer_en:
			'SCA Gold Cup: 18–22% extraction yield, 1.15–1.35% TDS, 90.5–96°C brew temperature. Under 18% is under-extraction (sour, grassy); over 22% is over-extraction (bitter, dry).'
	},

	// ── 5축 매핑 일반 ──
	{
		keywords: [/산미.*뭐|산미.*어떻게|acidity/i],
		answer:
			'5축 중 산미(1~5)는 5에 가까울수록 자몽·시트러스 같은 과일 산미가 강해요. 에티오피아 워시드와 케냐가 4~5로 높고, 브라질이나 다크 로스트는 1~2로 낮아요.',
		answer_en:
			'Acidity (1–5 axis): higher values lean toward grapefruit, citrus, and fruit notes. Washed Ethiopia and Kenya land at 4–5; Brazilian and dark-roast coffees sit around 1–2.'
	},
	{
		keywords: [/바디(?:감)?.*뭐|바디.*어떻게|body/i],
		answer:
			'5축 중 바디(1~5)는 입안에서 느끼는 무게감이에요. 5는 풀바디로 만델링·내추럴·다크 로스트가 해당하고, 1은 가벼운 쪽으로 라이트 로스트나 워시드 에티오피아가 해당해요.',
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

	// 추천 요청 동사가 있으면 질문 아님 (한/영 모두). "만들고 싶어"·"마시고 싶어" 같은
	// 욕구 표현도 추천 의도다 — 단 "알고 싶어"(질문) 오인을 피하려 만들/마시 어간에 한정 (fix.md #1).
	if (/(추천|보여|골라|뽑아|만들|마시|마실래|먹고\s*싶|줘)/.test(t)) return false;
	if (/\b(recommend|suggest|show|give|pick|make|brew\s+me|find\s+me|craving|in\s+the\s+mood|i\s+want\s+(a|an|some|something))\b/i.test(t)) return false;

	// 명시적 의문 형태
	if (t.endsWith('?')) return true;
	if (/(뭐|뭔|무엇|어떤|어떻게|어때|왜|언제|누가|어디|차이)/.test(t)) return true;
	if (/(이야|인가|일까|할까|할래|이지)\??$/.test(t)) return true;
	// 영어 의문사 / 비교 표현 (단어 경계로 제한 — "what" 이 메뉴 이름의 일부일 때 오인 방지)
	if (/\b(what|how|why|when|where|who|which|whose)\b/i.test(t)) return true;
	if (/\b(difference|vs\.?|versus|tell\s+me\s+about|explain)\b/i.test(t)) return true;

	// 도메인 키워드만 단독으로 떴을 때 — "에티오피아", "라이트 로스트" 같은 짧은 단서만 질문으로.
	// 단, 온도·취향 묘사나 "~거/것/한 잔" 이 붙으면 추천 요청이므로 제외 (fix.md #1:
	// "바닐라 라떼 따뜻한 거" 가 메뉴 정의 설명으로 새던 회귀 차단).
	const hasRecommendDescriptor =
		/(따뜻|뜨거|시원|차가|아이스|핫|달콤|단맛|진한|진하게|연한|부드|쓴|마실|한\s*잔|거$|것$|거\s|것\s)/.test(t) ||
		/\b(hot|iced|cold|sweet|strong|bold|smooth|mild|creamy)\b/i.test(t);
	if (!hasRecommendDescriptor && findAnswer(t) !== null && t.length <= 16) return true;

	return false;
}
