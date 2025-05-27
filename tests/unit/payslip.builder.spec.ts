import { PayslipBuilder } from '../../src/modules/payslip/builders/payslip.builder';

describe('PayslipBuilder (TDD)', () => {
  let builder: PayslipBuilder;

  beforeEach(() => {
    builder = new PayslipBuilder();
  });

  describe('Building Valid Payslip', () => {
    it('should build complete payslip with all required fields', () => {
      const result = builder
        .setEmployeeName('Ren')
        .setGrossMonthlyIncomeCents(500000)
        .setMonthlyIncomeTaxCents(50000)
        .setNetMonthlyIncomeCents(450000)
        .setCurrencyCode('MYR')
        .build();

      expect(result.employeeName).toBe('Ren');
      expect(result.grossMonthlyIncomeCents).toBe(500000);
      expect(result.monthlyIncomeTaxCents).toBe(50000);
      expect(result.netMonthlyIncomeCents).toBe(450000);
      expect(result.currencyCode).toBe('MYR');
      expect(result.calculatedAt).toBeInstanceOf(Date);

      // check display formatting
      expect(result.grossMonthlyIncomeDisplay).toBe('5000.00');
      expect(result.monthlyIncomeTaxDisplay).toBe('500.00');
      expect(result.netMonthlyIncomeDisplay).toBe('4500.00');
    });

    it('should allow custom calculated date', () => {
      const customDate = new Date('2025-05-27T10:30:00Z');

      const result = builder
        .setEmployeeName('Ren')
        .setGrossMonthlyIncomeCents(500000)
        .setMonthlyIncomeTaxCents(50000)
        .setNetMonthlyIncomeCents(450000)
        .setCurrencyCode('MYR')
        .setCalculatedAt(customDate)
        .build();

      expect(result.calculatedAt).toEqual(customDate);
    });

    it('should handle different currency codes', () => {
      const result = builder
        .setEmployeeName('Lee')
        .setGrossMonthlyIncomeCents(600000)
        .setMonthlyIncomeTaxCents(60000)
        .setNetMonthlyIncomeCents(540000)
        .setCurrencyCode('SGD')
        .build();

      expect(result.currencyCode).toBe('SGD');
    });
  });

  describe('Validation and Error Handling', () => {
    it('should throw error when employee name is missing', () => {
      expect(() =>
        builder
          .setGrossMonthlyIncomeCents(500000)
          .setMonthlyIncomeTaxCents(50000)
          .setNetMonthlyIncomeCents(450000)
          .setCurrencyCode('MYR')
          .build(),
      ).toThrow('Employee name is required');
    });

    it('should throw error when employee name is empty string', () => {
      expect(() =>
        builder
          .setEmployeeName('')
          .setGrossMonthlyIncomeCents(500000)
          .setMonthlyIncomeTaxCents(50000)
          .setNetMonthlyIncomeCents(450000)
          .setCurrencyCode('MYR')
          .build(),
      ).toThrow('Employee name is required');
    });

    it('should throw error when required financial amounts are missing', () => {
      expect(() =>
        builder.setEmployeeName('Ren').setCurrencyCode('MYR').build(),
      ).toThrow('All income amounts are required');
    });

    it('should throw error when only some income amounts are provided', () => {
      expect(() =>
        builder
          .setEmployeeName('Ren')
          .setGrossMonthlyIncomeCents(500000)
          .setCurrencyCode('MYR')
          .build(),
      ).toThrow('All income amounts are required');
    });

    it('should throw error when currency code is missing', () => {
      expect(() =>
        builder
          .setEmployeeName('Ren')
          .setGrossMonthlyIncomeCents(500000)
          .setMonthlyIncomeTaxCents(50000)
          .setNetMonthlyIncomeCents(450000)
          .build(),
      ).toThrow('Currency code is required');
    });

    it('should validate negative amounts', () => {
      expect(() =>
        builder
          .setEmployeeName('Ren')
          .setGrossMonthlyIncomeCents(-500000)
          .setMonthlyIncomeTaxCents(50000)
          .setNetMonthlyIncomeCents(450000)
          .setCurrencyCode('MYR')
          .build(),
      ).toThrow('Income amounts cannot be negative');
    });
  });

  describe('Builder Reset Functionality', () => {
    it('should reset builder state after build', () => {
      // build first payslip
      builder
        .setEmployeeName('Ren')
        .setGrossMonthlyIncomeCents(500000)
        .setMonthlyIncomeTaxCents(50000)
        .setNetMonthlyIncomeCents(450000)
        .setCurrencyCode('MYR')
        .build();

      // building again without setting values should fail
      expect(() => builder.build()).toThrow('Employee name is required');
    });

    it('should allow building multiple payslips with same builder instance', () => {
      const payslip1 = builder
        .setEmployeeName('Ren')
        .setGrossMonthlyIncomeCents(500000)
        .setMonthlyIncomeTaxCents(50000)
        .setNetMonthlyIncomeCents(450000)
        .setCurrencyCode('MYR')
        .build();

      const payslip2 = builder
        .setEmployeeName('Lee')
        .setGrossMonthlyIncomeCents(600000)
        .setMonthlyIncomeTaxCents(60000)
        .setNetMonthlyIncomeCents(540000)
        .setCurrencyCode('SGD')
        .build();

      expect(payslip1.employeeName).toBe('Ren');
      expect(payslip2.employeeName).toBe('Lee');
      expect(payslip1.grossMonthlyIncomeCents).toBe(500000);
      expect(payslip2.grossMonthlyIncomeCents).toBe(600000);
      expect(payslip1.currencyCode).toBe('MYR');
      expect(payslip2.currencyCode).toBe('SGD');
    });
  });

  describe('Financial Calculation Validation', () => {
    it('should validate that net income = gross - tax', () => {
      expect(() =>
        builder
          .setEmployeeName('Ren')
          .setGrossMonthlyIncomeCents(500000)
          .setMonthlyIncomeTaxCents(50000)
          .setNetMonthlyIncomeCents(400000) // introduce deliberate error (should actually be 450000)
          .setCurrencyCode('MYR')
          .build(),
      ).toThrow('Net income must equal gross income minus tax');
    });

    it('should accept valid financial calculations', () => {
      const result = builder
        .setEmployeeName('Ren')
        .setGrossMonthlyIncomeCents(500000)
        .setMonthlyIncomeTaxCents(50000)
        .setNetMonthlyIncomeCents(450000)
        .setCurrencyCode('MYR')
        .build();

      expect(result.netMonthlyIncomeCents).toBe(450000);
    });
  });
});
