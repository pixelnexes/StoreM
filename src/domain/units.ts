/**
 * Unit conversion. Inventory is stored in BASE units.
 * A ProductUnit defines conversionToBase, e.g. 1 packet = 10 pieces => 10.
 */

export interface UnitDef {
  unitName: string;
  conversionToBase: number; // how many base units in 1 of this unit
}

/** Convert a quantity expressed in `unit` into base units. */
export function toBaseUnits(quantity: number, conversionToBase: number): number {
  if (!Number.isFinite(quantity) || !Number.isFinite(conversionToBase)) {
    throw new Error('INVALID_QUANTITY');
  }
  if (conversionToBase <= 0) throw new Error('INVALID_UNIT_CONVERSION');
  return quantity * conversionToBase;
}

/** Convert base units into a { whole, remainder } of the given unit. */
export function fromBaseUnits(
  baseQty: number,
  conversionToBase: number,
): { whole: number; remainder: number } {
  if (conversionToBase <= 0) throw new Error('INVALID_UNIT_CONVERSION');
  const whole = Math.floor(baseQty / conversionToBase);
  const remainder = baseQty - whole * conversionToBase;
  return { whole, remainder };
}
