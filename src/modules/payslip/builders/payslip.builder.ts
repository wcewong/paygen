import {
  PayslipCalculationResult,
  PayslipBuildingData,
  FinancialMath,
} from '../types/payslip.types';

export class PayslipBuilder {
  private payslip: PayslipBuildingData = {};

  setEmployeeName(name: string): PayslipBuilder {
    this.payslip.employeeName = name?.trim();
    return this;
  }

  setGrossMonthlyIncomeCents(amountCents: number): PayslipBuilder {
    this.payslip.grossMonthlyIncomeCents = amountCents;
    return this;
  }

  setMonthlyIncomeTaxCents(amountCents: number): PayslipBuilder {
    this.payslip.monthlyIncomeTaxCents = amountCents;
    return this;
  }

  setNetMonthlyIncomeCents(amountCents: number): PayslipBuilder {
    this.payslip.netMonthlyIncomeCents = amountCents;
    return this;
  }

  setCurrencyCode(currencyCode: string): PayslipBuilder {
    this.payslip.currencyCode = currencyCode;
    return this;
  }

  setCalculatedAt(date: Date): PayslipBuilder {
    this.payslip.calculatedAt = date;
    return this;
  }

  build(): PayslipCalculationResult {
    if (!this.payslip.employeeName || this.payslip.employeeName.length === 0) {
      throw new Error('Employee name is required');
    }

    if (
      this.payslip.grossMonthlyIncomeCents === undefined ||
      this.payslip.monthlyIncomeTaxCents === undefined ||
      this.payslip.netMonthlyIncomeCents === undefined
    ) {
      throw new Error('All income amounts are required');
    }

    if (!this.payslip.currencyCode) {
      throw new Error('Currency code is required');
    }

    // amounts shouldn't be negative
    if (
      this.payslip.grossMonthlyIncomeCents < 0 ||
      this.payslip.monthlyIncomeTaxCents < 0 ||
      this.payslip.netMonthlyIncomeCents < 0
    ) {
      throw new Error('Income amounts cannot be negative');
    }

    // test calculation
    const expectedNet =
      this.payslip.grossMonthlyIncomeCents - this.payslip.monthlyIncomeTaxCents;
    if (this.payslip.netMonthlyIncomeCents !== expectedNet) {
      throw new Error('Net income must equal gross income minus tax');
    }

    // build result with display formatting
    const result: PayslipCalculationResult = {
      employeeName: this.payslip.employeeName,
      grossMonthlyIncomeCents: this.payslip.grossMonthlyIncomeCents,
      monthlyIncomeTaxCents: this.payslip.monthlyIncomeTaxCents,
      netMonthlyIncomeCents: this.payslip.netMonthlyIncomeCents,
      currencyCode: this.payslip.currencyCode,
      calculatedAt: this.payslip.calculatedAt ?? new Date(),

      // display formatting
      grossMonthlyIncomeDisplay: FinancialMath.formatCentsAsDecimal(
        this.payslip.grossMonthlyIncomeCents,
      ),
      monthlyIncomeTaxDisplay: FinancialMath.formatCentsAsDecimal(
        this.payslip.monthlyIncomeTaxCents,
      ),
      netMonthlyIncomeDisplay: FinancialMath.formatCentsAsDecimal(
        this.payslip.netMonthlyIncomeCents,
      ),
    };

    // reset builder for next use
    this.payslip = {};

    return result;
  }
}
