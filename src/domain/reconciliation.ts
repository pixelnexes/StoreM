/** Payment terminal reconciliation: system card sales vs terminal settlement. */

export interface ReconResult {
  expected: number;
  actual: number;
  difference: number; // actual - expected (negative => shortfall)
  matched: boolean;
}

export function reconcile(expected: number, actual: number): ReconResult {
  const difference = actual - expected;
  return { expected, actual, difference, matched: difference === 0 };
}
