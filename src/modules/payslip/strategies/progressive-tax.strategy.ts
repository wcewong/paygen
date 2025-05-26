import { TaxBracket } from '../types/payslip.types';

export class ProgressiveTaxStrategy {
  private readonly taxBrackets: readonly TaxBracket[];

  constructor(taxBrackets: TaxBracket[]) {
    this.taxBrackets = Object.freeze([...taxBrackets]);
  }

  calculateAnnualTaxCents(annualSalaryCents: number): number {
    if (annualSalaryCents < 0) {
      throw new Error('Annual salary cannot be negative');
    }

    if (annualSalaryCents === 0) {
      return 0;
    }

    let totalTaxCents = 0;
    let remainingSalaryCents = annualSalaryCents;

    for (const bracket of this.taxBrackets) {
      if (remainingSalaryCents <= 0) break;

      const bracketMin = bracket.minCents;
      const bracketMax = bracket.maxCents ?? Infinity;

      // skip if salary doesn't reach this bracket
      if (annualSalaryCents <= bracketMin) continue;

      // calculate taxable amount in this bracket
      const bracketStart = Math.max(bracketMin, 0);
      const bracketEnd = Math.min(bracketMax, annualSalaryCents);
      const taxableInBracket = Math.max(0, bracketEnd - bracketStart);

      if (taxableInBracket > 0) {
        const taxForThisBracket = Math.round(taxableInBracket * bracket.rate);
        totalTaxCents += taxForThisBracket;
      }
    }

    return Math.round(totalTaxCents);
  }

  getStrategyName(): string {
    return 'Progressive Tax Strategy';
  }

  getTaxBrackets(): readonly TaxBracket[] {
    return this.taxBrackets;
  }
}
