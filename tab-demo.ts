/**
 * Cursor Tab demo
 * ----------------
 *
 * To demo Tab during the kickoff:
 *   1. Click on an empty line after the last entry in the `cards` array (around line 36).
 *   2. Type:    { id: '
 *   3. Pause for ~1 second.
 *   4. Tab will predict the entire next object — id, label, metric, trend, priority — all at once.
 *   5. Hit Tab to accept.
 *
 * Why this works as a demo:
 *   - Tab sees the typed array shape and predicts ALL fields, not just one
 *   - Tab respects the TypeScript union types (it won't suggest invalid values for `metric`, `trend`, `priority`)
 *   - Tab is contextual: if the previous entries were bullish, the prediction tends toward consistent business logic
 */

interface DashboardCard {
  id: string;
  label: string;
  metric: 'revenue' | 'users' | 'conversion' | 'churn';
  trend: 'up' | 'down' | 'flat';
  priority: 'high' | 'medium' | 'low';
}

const cards: DashboardCard[] = [
  { id: 'card-1', label: 'Q3 Revenue',      metric: 'revenue',    trend: 'up',   priority: 'high' },
  { id: 'card-2', label: 'Active Users',    metric: 'users',      trend: 'up',   priority: 'high' },
  { id: 'card-3', label: 'Conversion Rate', metric: 'conversion', trend: 'flat', priority: 'medium' },
  // Type your new entry here ↓ (e.g. `{ id: 'card-4', label: '` then pause)
];

export { cards };
export type { DashboardCard };
