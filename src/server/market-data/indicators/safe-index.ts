/**
 * Indexes into an array, throwing instead of silently returning `undefined`.
 * Every call site in this directory only indexes within a range it just verified
 * with a loop bound, so this should never actually throw — it exists to satisfy
 * `noUncheckedIndexedAccess` honestly instead of scattering `!` assertions that
 * would hide a real out-of-bounds bug if the loop math is ever wrong.
 */
export function at<T>(arr: readonly T[], index: number): T {
  const value = arr[index];
  if (value === undefined) {
    throw new RangeError(`Index ${index} out of bounds (length ${arr.length})`);
  }
  return value;
}
