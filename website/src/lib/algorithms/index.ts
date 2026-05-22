/**
 * Hand-rolled algorithm toolkit for the coffee recommender.
 * See ALGORITHMS.md (repo root) for what each one does and where it is used.
 */
export { matchScore, tasteDistance, type AxisWeights } from './similarity';
export { mergeSort, quickSort } from './sort';
export { lowerBound, upperBound } from './search';
export { diversify, affordableTopK } from './greedy';
export { knapsackFlight, knapsack01, type KnapsackResult } from './knapsack';
export {
	buildTasteGraph,
	dijkstra,
	MinHeap,
	type TasteGraph,
	type Edge,
	type DijkstraResult
} from './graph';
export { blendProfiles, interpolationSteps } from './interpolate';
