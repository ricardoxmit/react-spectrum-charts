/**
 * Cursor Tab demo
 * ----------------
 *
 * Two demos in this file. Pick one — or do both for extra impact.
 *
 * Tab is powered by Cursor's own model, Fusion. It's not autocomplete —
 * it's "next-edit prediction": Tab sees the current file, the recent edits,
 * the type definitions, and the patterns nearby, then predicts what you
 * most likely want to do next.
 */

interface DashboardCard {
  id: string;
  label: string;
  metric: 'revenue' | 'users' | 'conversion' | 'churn';
  trend: 'up' | 'down' | 'flat';
  priority: 'high' | 'medium' | 'low';
}

// ─────────────────────────────────────────────────────────────────────
// Demo 1 — pattern + type prediction
//
// Click the empty line below the last array entry, then type:
//     { id: '
// Pause for ~1 second. Tab predicts the entire next object — id, label,
// metric, trend, priority — all at once, with valid union-type values.
// ─────────────────────────────────────────────────────────────────────

const cards: DashboardCard[] = [
  { id: 'card-1', label: 'Q3 Revenue',      metric: 'revenue',    trend: 'up',   priority: 'high' },
  { id: 'card-2', label: 'Active Users',    metric: 'users',      trend: 'up',   priority: 'high' },
  { id: 'card-3', label: 'Conversion Rate', metric: 'conversion', trend: 'flat', priority: 'medium' },
  // ↓ type your new entry here
];


// ─────────────────────────────────────────────────────────────────────
// Demo 2 — comment-driven function generation
//
// Click the empty line below, type a comment describing what you want,
// then press Enter. Tab will write the entire function for you.
//
// Example comments to try:
//   // returns the count of cards with trend === 'up'
//   // returns cards filtered by metric type
//   // returns the card with the highest priority
//
// Tab reads the comment, looks at the types of `cards` and `DashboardCard`,
// and infers the full function signature and body — including the correct
// return type and a sensible implementation.
// ─────────────────────────────────────────────────────────────────────

// ↓ type your comment here, then Enter



export { cards };
export type { DashboardCard };
