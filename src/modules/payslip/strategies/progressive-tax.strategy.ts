import { TaxCalculationStrategy } from '@/modules/payslip/strategies/tax-calculation.strategy.interface';
import { TaxBracket } from '@/modules/payslip/types/payslip.types';

export class ProgressiveTaxStrategy implements TaxCalculationStrategy {
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

      // upper bound for current bracket
      const bracketMaxCents = bracket.maxCents ?? Infinity;
      const bracketWidthCents = bracketMaxCents - bracket.minCents;

      // total tax amount in current bracket
      let taxableInBracketCents = 0;

      if (annualSalaryCents > bracket.minCents) {
        // salary exceeds bracket floor
        const salaryAboveBracketMinCents = annualSalaryCents - bracket.minCents;
        taxableInBracketCents = Math.min(
          salaryAboveBracketMinCents,
          bracketWidthCents,
        );
      }

      if (taxableInBracketCents > 0) {
        const taxForBracketCents = Math.round(
          taxableInBracketCents * bracket.rate,
        );
        totalTaxCents += taxForBracketCents;
        remainingSalaryCents -= taxableInBracketCents;
      }
    }

    return totalTaxCents;
  }

  getStrategyName(): string {
    return 'Progressive Tax Strategy';
  }

  getTaxBrackets(): readonly TaxBracket[] {
    return this.taxBrackets;
  }
}
