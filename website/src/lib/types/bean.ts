export interface Bean {
	id: string;
	name: string;
	brand: string;
	price_krw: number;
	weight_g: number;
	roast_level: number;
	acidity: number;
	body: number;
	sweetness: number;
	bitterness: number;
	origin: string;
	flavor_notes: string[];
	url: string | null;
}

export interface BeanRecommendation {
	bean: Bean;
	match_score: number;
	price_per_100g_krw: number;
}

export interface BeanRecommendResponse {
	recommendations: BeanRecommendation[];
}
