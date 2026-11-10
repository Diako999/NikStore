/**
 * Query params arrive as strings (or undefined); coerce them into safe integers
 * so `?limit=1000000` or `?page=abc` can never reach the database.
 */
export function clampPagination(
  page: unknown,
  limit: unknown,
  { defaultLimit = 20, maxLimit = 100 } = {},
): { page: number; limit: number } {
  const p = Math.floor(Number(page));
  const l = Math.floor(Number(limit));
  return {
    page: Number.isFinite(p) && p >= 1 ? p : 1,
    limit: Number.isFinite(l) && l >= 1 ? Math.min(l, maxLimit) : defaultLimit,
  };
}
