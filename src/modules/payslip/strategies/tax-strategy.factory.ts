import { TaxCalculationStrategy } from './tax-calculation.strategy.interface';
import { ProgressiveTaxStrategy } from './progressive-tax.strategy';
import { TaxBracket } from '../types/payslip.types';

export class TaxStrategyFactory {
  // default tax brackets from the original requirements
  private static readonly DEFAULT_TAX_BRACKETS: TaxBracket[] = [
    { minCents: 0, maxCents: 2000000, rate: 0.0 },
    { minCents: 2000000, maxCents: 4000000, rate: 0.1 },
    { minCents: 4000000, maxCents: 8000000, rate: 0.2 },
    { minCents: 8000000, maxCents: 18000000, rate: 0.3 },
    { minCents: 18000000, maxCents: null, rate: 0.4 },
  ];

  // alternative brackets for testing
  private static readonly ALTERNATIVE_TAX_BRACKETS: TaxBracket[] = [
    { minCents: 0, maxCents: 3000000, rate: 0.05 },
    { minCents: 3000000, maxCents: 7000000, rate: 0.15 },
    { minCents: 7000000, maxCents: null, rate: 0.25 },
  ];

  // default progressive tax strategy based on reqs
  createDefaultStrategy(): TaxCalculationStrategy {
    return new ProgressiveTaxStrategy([
      ...TaxStrategyFactory.DEFAULT_TAX_BRACKETS,
    ]);
  }

  // create a custom progressive tax strategy with provided brackets
  createCustomStrategy(taxBrackets: TaxBracket[]): TaxCalculationStrategy {
    this.validateTaxBrackets(taxBrackets);
    return new ProgressiveTaxStrategy([...taxBrackets]);
  }

  // create an alternative progressive tax strategy
  createAlternativeStrategy(): TaxCalculationStrategy {
    return new ProgressiveTaxStrategy([
      ...TaxStrategyFactory.ALTERNATIVE_TAX_BRACKETS,
    ]);
  }

  // create flat tax strategy
  createFlatTaxStrategy(rate: number): TaxCalculationStrategy {
    this.validateFlatTaxRate(rate);

    const flatTaxBracket: TaxBracket[] = [
      { minCents: 0, maxCents: null, rate },
    ];

    return new ProgressiveTaxStrategy(flatTaxBracket);
  }

  // validate tax brackets
  private validateTaxBrackets(brackets: TaxBracket[]): void {
    if (!brackets || brackets.length === 0) {
      throw new Error('Tax brackets cannot be empty');
    }

    brackets.forEach((bracket, index) => {
      // validation - minimum amount
      if (bracket.minCents < 0) {
        throw new Error(
          `Invalid tax bracket at index ${index}: minimum amount cannot be negative`,
        );
      }

      // validation - rate
      if (bracket.rate < 0) {
        throw new Error(
          `Invalid tax bracket at index ${index}: rate cannot be negative`,
        );
      }

      if (bracket.rate > 1) {
        throw new Error(
          `Invalid tax bracket at index ${index}: rate cannot exceed 100%`,
        );
      }

      // validation - bracket range
      if (bracket.maxCents !== null && bracket.minCents > bracket.maxCents) {
        throw new Error(
          `Invalid tax bracket at index ${index}: minimum cannot be greater than maximum`,
        );
      }
    });
  }

  // validate flax tax rate
  private validateFlatTaxRate(rate: number): void {
    if (rate < 0 || rate > 1) {
      throw new Error('Flat tax rate must be between 0 and 1');
    }
  }
}
