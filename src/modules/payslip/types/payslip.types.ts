export interface TaxBracket {
  readonly minCents: number;
  readonly maxCents: number | null;
  readonly rate: number; // rate is in decimal (0.1 = 10%)
}

export interface PayslipCalculationResult {
  readonly employeeName: string;
  readonly grossMonthlyIncomeCents: number;
  readonly monthlyIncomeTaxCents: number;
  readonly netMonthlyIncomeCents: number;
  readonly calculatedAt: Date;
  readonly currencyCode: string;

  // display helpers
  readonly grossMonthlyIncomeDisplay: string;
  readonly monthlyIncomeTaxDisplay: string;
  readonly netMonthlyIncomeDisplay: string;
}

// for payslip builder
export interface PayslipBuildingData {
  employeeName?: string;
  grossMonthlyIncomeCents?: number;
  monthlyIncomeTaxCents?: number;
  netMonthlyIncomeCents?: number;
  calculatedAt?: Date;
  currencyCode?: string;
}

export interface PayslipRecord {
  readonly id?: string;
  readonly timestamp: Date;
  readonly employeeName: string;
  readonly annualSalaryCents: number;
  readonly monthlyIncomeTaxCents: number;
  readonly grossMonthlyIncomeCents: number;
  readonly netMonthlyIncomeCents: number;
  readonly currencyCode: string;
}

// util functions for financial calculations
export class FinancialMath {
  private static readonly CENTS_PER_DOLLAR = 100;

  // convert dollars to cents
  static dollarsToCents(dollars: number): number {
    return Math.round(dollars * FinancialMath.CENTS_PER_DOLLAR);
  }

  // convert cents to dollars for display
  static centsToDollars(cents: number): number {
    return cents / FinancialMath.CENTS_PER_DOLLAR;
  }

  // format cents as currency string
  static formatCents(cents: number, currencyCode = 'MYR'): string {
    const dollars = FinancialMath.centsToDollars(cents);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(dollars);
  }

  // format cents as decimal string
  static formatCentsAsDecimal(cents: number): string {
    return FinancialMath.centsToDollars(cents).toFixed(2);
  }

  // safe division for tax calculations (returns cents)
  static calculatePercentage(amountCents: number, rate: number): number {
    return Math.round(amountCents * rate);
  }

  // safe monthly calculation from annual (returns cents)
  static annualToMonthly(annualCents: number): number {
    return Math.round(annualCents / 12);
  }
}
