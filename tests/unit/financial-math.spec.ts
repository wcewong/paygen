import { FinancialMath } from '../../src/modules/payslip/types/payslip.types';

describe('FinancialMath (TDD)', () => {
  describe('Currency Conversion', () => {
    it('should convert dollars to cents correctly', () => {
      expect(FinancialMath.dollarsToCents(60000)).toBe(6000000);
      expect(FinancialMath.dollarsToCents(60000.5)).toBe(6000050);
      expect(FinancialMath.dollarsToCents(60000.99)).toBe(6000099);
      expect(FinancialMath.dollarsToCents(0.01)).toBe(1);
      expect(FinancialMath.dollarsToCents(0)).toBe(0);
    });

    it('should convert cents to dollars correctly', () => {
      expect(FinancialMath.centsToDollars(6000000)).toBe(60000);
      expect(FinancialMath.centsToDollars(6000050)).toBe(60000.5);
      expect(FinancialMath.centsToDollars(1)).toBe(0.01);
      expect(FinancialMath.centsToDollars(0)).toBe(0);
    });

    it('should handle rounding correctly for dollars to cents', () => {
      expect(FinancialMath.dollarsToCents(10.999)).toBe(1100); // rounds to nearest cent
      expect(FinancialMath.dollarsToCents(10.001)).toBe(1000);
    });
  });

  describe('Display Formatting', () => {
    it('should format cents as decimal strings correctly', () => {
      expect(FinancialMath.formatCentsAsDecimal(500000)).toBe('5000.00');
      expect(FinancialMath.formatCentsAsDecimal(50000)).toBe('500.00');
      expect(FinancialMath.formatCentsAsDecimal(5000)).toBe('50.00');
      expect(FinancialMath.formatCentsAsDecimal(500)).toBe('5.00');
      expect(FinancialMath.formatCentsAsDecimal(50)).toBe('0.50');
      expect(FinancialMath.formatCentsAsDecimal(5)).toBe('0.05');
      expect(FinancialMath.formatCentsAsDecimal(1)).toBe('0.01');
      expect(FinancialMath.formatCentsAsDecimal(0)).toBe('0.00');
    });
  });

  describe('Financial Calculations', () => {
    it('should calculate percentage correctly', () => {
      expect(FinancialMath.calculatePercentage(100000, 0.1)).toBe(10000); // 10%
      expect(FinancialMath.calculatePercentage(100000, 0.2)).toBe(20000); // 20%
      expect(FinancialMath.calculatePercentage(100000, 0.0)).toBe(0); // 0%
    });

    it('should calculate annual to monthly correctly', () => {
      expect(FinancialMath.annualToMonthly(6000000)).toBe(500000); // $60k -> $5k
      expect(FinancialMath.annualToMonthly(8001000)).toBe(666750); // rounding
      expect(FinancialMath.annualToMonthly(0)).toBe(0);
    });

    it('should always return integers for financial calculations', () => {
      const testAmounts = [123456, 999999, 1];
      const testRates = [0.1, 0.15, 0.333];

      testAmounts.forEach((amount) => {
        testRates.forEach((rate) => {
          const result = FinancialMath.calculatePercentage(amount, rate);
          expect(Number.isInteger(result)).toBe(true);
        });
      });
    });
  });
});
