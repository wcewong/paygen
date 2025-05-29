import { TaxBracket } from '@/modules/payslip/types/payslip.types';

export interface TaxCalculationStrategy {
  calculateAnnualTaxCents(annualSalaryCents: number): number;
  getStrategyName(): string;
  getTaxBrackets(): readonly TaxBracket[];
}
