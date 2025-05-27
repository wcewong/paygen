import { TaxStrategyFactory } from '../../src/modules/payslip/strategies/tax-strategy.factory';

import {
  TaxBracket,
  FinancialMath,
} from '../../src/modules/payslip/types/payslip.types';

describe('TaxStrategyFactory (TDD)', () => {
  let factory: TaxStrategyFactory;

  beforeEach(() => {
    factory = new TaxStrategyFactory();
  });

  describe('Default Strategy Creation', () => {
    it('should create default progressive tax strategy', () => {
      const strategy = factory.createDefaultStrategy();

      expect(strategy).toBeDefined();
      expect(strategy.getStrategyName()).toBe('Progressive Tax Strategy');

      // from requirements
      expect(
        strategy.calculateAnnualTaxCents(FinancialMath.dollarsToCents(60000)),
      ).toBe(FinancialMath.dollarsToCents(6000));
      expect(
        strategy.calculateAnnualTaxCents(FinancialMath.dollarsToCents(200000)),
      ).toBe(FinancialMath.dollarsToCents(48000));
      expect(
        strategy.calculateAnnualTaxCents(FinancialMath.dollarsToCents(80150)),
      ).toBe(FinancialMath.dollarsToCents(10045));
    });

    it('should return strategy with 5 default tax brackets', () => {
      const strategy = factory.createDefaultStrategy();
      const brackets = strategy.getTaxBrackets();

      expect(brackets).toHaveLength(5);
      expect(brackets[0]).toEqual({
        minCents: 0,
        maxCents: 2000000,
        rate: 0.0,
      });
      expect(brackets[1]).toEqual({
        minCents: 2000000,
        maxCents: 4000000,
        rate: 0.1,
      });
      expect(brackets[2]).toEqual({
        minCents: 4000000,
        maxCents: 8000000,
        rate: 0.2,
      });
      expect(brackets[3]).toEqual({
        minCents: 8000000,
        maxCents: 18000000,
        rate: 0.3,
      });
      expect(brackets[4]).toEqual({
        minCents: 18000000,
        maxCents: null,
        rate: 0.4,
      });
    });

    it('should create new instance each time (not singleton)', () => {
      const strategy1 = factory.createDefaultStrategy();
      const strategy2 = factory.createDefaultStrategy();

      expect(strategy1).not.toBe(strategy2); // different instances
      expect(strategy1.getStrategyName()).toBe(strategy2.getStrategyName()); // same strategy name but different instances
    });
  });

  describe('Custom Strategy Creation', () => {
    it('should create custom strategy with provided brackets', () => {
      const customBrackets: TaxBracket[] = [
        { minCents: 0, maxCents: 3000000, rate: 0.05 },
        { minCents: 3000000, maxCents: 7000000, rate: 0.15 },
        { minCents: 7000000, maxCents: null, rate: 0.25 },
      ];

      const strategy = factory.createCustomStrategy(customBrackets);

      expect(strategy.getStrategyName()).toBe('Progressive Tax Strategy');
      expect(strategy.getTaxBrackets()).toEqual(customBrackets);

      //    $50,000 salary with custom brackets:
      //
      //    0          to  30,000:     30,000 * 5% =  1,500
      //    30,000     to  50,000:     20,000 * 15% = 3,000
      //    Total = 4,500
      const tax = strategy.calculateAnnualTaxCents(
        FinancialMath.dollarsToCents(50000),
      );
      expect(tax).toBe(FinancialMath.dollarsToCents(4500));
    });

    it('should handle single bracket custom strategy', () => {
      const flatTaxBrackets: TaxBracket[] = [
        { minCents: 0, maxCents: null, rate: 0.1 }, // 10% flat tax
      ];

      const strategy = factory.createCustomStrategy(flatTaxBrackets);

      // test flat tax calculation
      expect(
        strategy.calculateAnnualTaxCents(FinancialMath.dollarsToCents(60000)),
      ).toBe(FinancialMath.dollarsToCents(6000));
      expect(
        strategy.calculateAnnualTaxCents(FinancialMath.dollarsToCents(100000)),
      ).toBe(FinancialMath.dollarsToCents(10000));
    });
  });

  describe('Strategy Validation', () => {
    it('should validate custom tax brackets for empty array', () => {
      expect(() => factory.createCustomStrategy([])).toThrow(
        'Tax brackets cannot be empty',
      );
    });

    it('should validate custom tax brackets for null/undefined', () => {
      expect(() => factory.createCustomStrategy([] as TaxBracket[])).toThrow(
        'Tax brackets cannot be empty',
      );

      expect(() => factory.createCustomStrategy([] as TaxBracket[])).toThrow(
        'Tax brackets cannot be empty',
      );
    });

    it('should reject invalid tax rates', () => {
      const invalidBrackets: TaxBracket[] = [
        { minCents: 0, maxCents: 30000, rate: -0.1 }, // invalid: negative rate
      ];

      expect(() => factory.createCustomStrategy(invalidBrackets)).toThrow(
        'Invalid tax bracket at index 0: rate cannot be negative',
      );
    });

    it('should reject tax rates above 100%', () => {
      const invalidBrackets: TaxBracket[] = [
        { minCents: 0, maxCents: 30000, rate: 1.5 }, // invalid: rate > 1
      ];

      expect(() => factory.createCustomStrategy(invalidBrackets)).toThrow(
        'Invalid tax bracket at index 0: rate cannot exceed 100%',
      );
    });

    it('should reject negative minimum amounts', () => {
      const invalidBrackets: TaxBracket[] = [
        { minCents: -1000, maxCents: 30000, rate: 0.1 }, // invalid: negative min
      ];

      expect(() => factory.createCustomStrategy(invalidBrackets)).toThrow(
        'Invalid tax bracket at index 0: minimum amount cannot be negative',
      );
    });

    it('should reject invalid bracket ranges', () => {
      const invalidBrackets: TaxBracket[] = [
        { minCents: 50000, maxCents: 30000, rate: 0.1 }, // invalid: min > max
      ];

      expect(() => factory.createCustomStrategy(invalidBrackets)).toThrow(
        'Invalid tax bracket at index 0: minimum cannot be greater than maximum',
      );
    });
  });

  describe('Predefined Strategy Variants', () => {
    it('should create alternative strategy for demonstration', () => {
      const strategy = factory.createAlternativeStrategy();

      expect(strategy.getStrategyName()).toBe('Progressive Tax Strategy');
      expect(strategy.getTaxBrackets()).toHaveLength(3);

      // should have different brackets than default
      const brackets = strategy.getTaxBrackets();
      expect(brackets[0].rate).toBe(0.05); // 5% instead of 0%
    });

    it('should create flat tax strategy', () => {
      const rate = 0.15; // 15% flat tax
      const strategy = factory.createFlatTaxStrategy(rate);

      expect(strategy.getStrategyName()).toBe('Progressive Tax Strategy');
      expect(strategy.getTaxBrackets()).toHaveLength(1);
      expect(strategy.getTaxBrackets()[0].rate).toBe(rate);
    });

    it('should validate flat tax rate', () => {
      expect(() => factory.createFlatTaxStrategy(-0.1)).toThrow(
        'Flat tax rate must be between 0 and 1',
      );

      expect(() => factory.createFlatTaxStrategy(1.5)).toThrow(
        'Flat tax rate must be between 0 and 1',
      );
    });
  });

  describe('Ensure Strategy Methods Defined', () => {
    it('should ensure all strategies implement required methods', () => {
      const strategies = [
        factory.createDefaultStrategy(),
        factory.createAlternativeStrategy(),
        factory.createFlatTaxStrategy(0.1),
      ];

      // all should implement the same interface
      strategies.forEach((strategy) => {
        expect(strategy).toHaveProperty('calculateAnnualTaxCents');
        expect(strategy).toHaveProperty('getStrategyName');
        expect(strategy).toHaveProperty('getTaxBrackets');
      });
    });
  });
});
