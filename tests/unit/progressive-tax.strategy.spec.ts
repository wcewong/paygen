import { ProgressiveTaxStrategy } from '../../src/modules/payslip/strategies/progressive-tax.strategy';
import {
  TaxBracket,
  FinancialMath,
} from '../../src/modules/payslip/types/payslip.types';

describe('ProgressiveTaxStrategy (TDD)', () => {
  let strategy: ProgressiveTaxStrategy;

  const defaultTaxBrackets: TaxBracket[] = [
    { minCents: 0, maxCents: 2000000, rate: 0.0 }, // 0 - 20,000
    { minCents: 2000001, maxCents: 4000000, rate: 0.1 }, // 20,001 - 40,000
    { minCents: 4000001, maxCents: 8000000, rate: 0.2 }, // 40,001 - 80,000
    { minCents: 8000001, maxCents: 18000000, rate: 0.3 }, // 80,001 - 180,000
    { minCents: 18000001, maxCents: null, rate: 0.4 }, // above 180,001
  ];

  beforeEach(() => {
    strategy = new ProgressiveTaxStrategy(defaultTaxBrackets);
  });

  // RED phase
  describe('Sample Tax Computation 1: Annual Salary $60,000', () => {
    it('should calculate total annual tax as $6,000 (600,000 cents)', () => {
      const annualSalaryCents = FinancialMath.dollarsToCents(60000);
      const expectedTaxCents = FinancialMath.dollarsToCents(6000);

      const result = strategy.calculateAnnualTaxCents(annualSalaryCents);

      expect(result).toBe(expectedTaxCents);
    });

    it('should break down tax calculation correctly for $60,000', () => {
      //    0          to  20,000:     20,000 * 0% = 0
      //    20,001     to  40,000:     20,000 * 10% = 2,000
      //    40,001     to  60,000:     20,000 * 20% = 4,000
      //    Total = 6,000

      const result = strategy.calculateAnnualTaxCents(6000000); // $60,000 in cents
      expect(result).toBe(600000); // $6,000 in cents

      expect(strategy.getStrategyName()).toBe('Progressive Tax Strategy');
    });
  });

  describe('Sample Tax Computation 2: Annual Salary $200,000', () => {
    it('should calculate total annual tax as $48,000 (4,800,000 cents)', () => {
      //    0          to   20,000:     20,000 * 0% = 0
      //    20,001     to   40,000:     20,000 * 10% =  2,000
      //    40,001     to   60,000:     40,000 * 20% =  8,000
      //    80,001     to  180,000:    100,000 * 30% = 30,000
      //   180,001     to  200,000:     20,000 * 40% =  8,000
      //    Total = 48,000

      const annualSalaryCents = FinancialMath.dollarsToCents(200000);
      const expectedTaxCents = FinancialMath.dollarsToCents(48000);

      const result = strategy.calculateAnnualTaxCents(annualSalaryCents);
      expect(result).toBe(expectedTaxCents);
    });
  });

  describe('Sample Tax Computation 3: Annual Salary $80,150', () => {
    it('should calculate total annual tax as $10,045 (1,004,500 cents)', () => {
      //    0          to   20,000:     20,000 * 0%  =      0
      //    20,001     to   40,000:     20,000 * 10% =  2,000
      //    40,001     to   80,000:     40,000 * 20% =  8,000
      //    80,001     to   80,150:        150 * 30% =     45
      //    Total = 10,045

      const annualSalaryCents = FinancialMath.dollarsToCents(80150);
      const expectedTaxCents = FinancialMath.dollarsToCents(10045);

      const result = strategy.calculateAnnualTaxCents(annualSalaryCents);
      expect(result).toBe(expectedTaxCents);
    });
  });

  describe('Edge Cases and Validation', () => {
    it('should return 0 for salary of 0', () => {
      const result = strategy.calculateAnnualTaxCents(0);
      expect(result).toBe(0);
    });

    it('should return 0 for salary within first tax-free bracket', () => {
      const result = strategy.calculateAnnualTaxCents(
        FinancialMath.dollarsToCents(15000),
      );
      expect(result).toBe(0);
    });

    it('should handle exact bracket boundaries', () => {
      // At 20,000 - in 0% bracket
      expect(strategy.calculateAnnualTaxCents(2000000)).toBe(0);

      // At 20,001 - in 10% bracket
      expect(strategy.calculateAnnualTaxCents(2000001)).toBe(0);

      // At 40,000 - in 10% bracket
      expect(strategy.calculateAnnualTaxCents(4000000)).toBe(200000); // 2,000 in cents
    });

    it('should throw error for negative salary', () => {
      expect(() => strategy.calculateAnnualTaxCents(-100000)).toThrow(
        'Annual salary cannot be negative',
      );
    });

    it('should always return whole number of cents', () => {
      const testSalaries = [
        FinancialMath.dollarsToCents(33333.33),
        FinancialMath.dollarsToCents(66666.67),
        FinancialMath.dollarsToCents(99999.99),
      ];

      testSalaries.forEach((salaryCents) => {
        const taxCents = strategy.calculateAnnualTaxCents(salaryCents);
        expect(Number.isInteger(taxCents)).toBe(true);
        expect(taxCents).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Tax Brackets and Strategy Info', () => {
    it('should return correct tax brackets', () => {
      const brackets = strategy.getTaxBrackets();
      expect(brackets).toHaveLength(5);
      expect(brackets[0]).toEqual({
        minCents: 0,
        maxCents: 2000000,
        rate: 0.0,
      });
      expect(brackets[4]).toEqual({
        minCents: 18000001,
        maxCents: null,
        rate: 0.4,
      });
    });

    it('should return readonly tax brackets', () => {
      const brackets = strategy.getTaxBrackets();
      expect(Object.isFrozen(brackets)).toBe(true);
    });
  });
});
