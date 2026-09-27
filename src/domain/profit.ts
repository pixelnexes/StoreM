/**
 * Profit calculation using proper COGS (cost of goods actually sold),
 * NOT naive Sales - Purchases (inventory may be bought in one period and
 * sold in another).
 *
 *   Gross Profit = Revenue - COGS
 *   Net Profit   = Gross Profit - Operating Expenses
 */

export interface SoldItem {
  quantity: number;
  unitPrice: number; // revenue per unit
  unitCost: number;  // cost per unit captured at sale time
  discount?: number;
}

export interface ProfitResult {
  revenue: number;
  cogs: number;
  grossProfit: number;
  expenses: number;
  netProfit: number;
  margin: number; // gross margin % (0..100)
}

export function computeProfit(items: SoldItem[], operatingExpenses = 0): ProfitResult {
  let revenue = 0;
  let cogs = 0;
  for (const it of items) {
    revenue += it.quantity * it.unitPrice - (it.discount ?? 0);
    cogs += it.quantity * it.unitCost;
  }
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - operatingExpenses;
  const margin = revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0;
  return { revenue, cogs, grossProfit, expenses: operatingExpenses, netProfit, margin };
}

/** Convenience for aggregated totals (already summed elsewhere). */
export function profitFromTotals(revenue: number, cogs: number, expenses: number): ProfitResult {
  const grossProfit = revenue - cogs;
  const netProfit = grossProfit - expenses;
  const margin = revenue > 0 ? Math.round((grossProfit / revenue) * 10000) / 100 : 0;
  return { revenue, cogs, grossProfit, expenses, netProfit, margin };
}
