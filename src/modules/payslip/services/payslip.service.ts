import { Inject, Injectable, Logger } from '@nestjs/common';
import { TaxCalculationStrategy } from '@/modules/payslip/strategies/tax-calculation.strategy.interface';
import { TaxStrategyFactory } from '@/modules/payslip/strategies/tax-strategy.factory';
import { PayslipBuilder } from '@/modules/payslip/builders/payslip.builder';
import { IPayslipRepository } from '@/modules/payslip/repositories/payslip.repository.interface';
import {
  PayslipCalculationResult,
  PayslipRecord,
  TaxBracket,
  FinancialMath,
} from '../types/payslip.types';

export interface ServiceStatistics {
  totalPayslipsGenerated: number;
  currentTaxStrategy: string;
  supportedCurrencies: string[];
  version: string;
}

@Injectable()
export class PayslipService {
  private readonly logger = new Logger(PayslipService.name);
  private taxStrategy: TaxCalculationStrategy;

  constructor(
    private readonly taxStrategyFactory: TaxStrategyFactory,
    private readonly payslipBuilder: PayslipBuilder,
    @Inject(IPayslipRepository)
    private readonly payslipRepository: IPayslipRepository,
  ) {
    // initialise with default tax strategy
    this.taxStrategy = this.taxStrategyFactory.createDefaultStrategy();
    this.logger.log('PayslipService initialised with default tax strategy');
  }

  // generate monthly payslip for an employee
  async generateMonthlyPayslip(
    employeeName: string,
    annualSalaryCents: number,
    currencyCode: string = 'MYR',
  ): Promise<PayslipCalculationResult> {
    this.logger.log(
      `Generating payslip for ${employeeName} with annual salary ${FinancialMath.centsToDollars(annualSalaryCents)}`,
    );

    try {
      // validation
      this.validateInputs(employeeName, annualSalaryCents);

      // calculate annual tax
      const annualTaxCents =
        this.taxStrategy.calculateAnnualTaxCents(annualSalaryCents);

      // calculate monthly amounts
      const grossMonthlyIncomeCents =
        FinancialMath.annualToMonthly(annualSalaryCents);
      const monthlyIncomeTaxCents =
        FinancialMath.annualToMonthly(annualTaxCents);
      const netMonthlyIncomeCents =
        grossMonthlyIncomeCents - monthlyIncomeTaxCents;

      // build payslip
      const payslip = this.payslipBuilder
        .setEmployeeName(employeeName)
        .setGrossMonthlyIncomeCents(grossMonthlyIncomeCents)
        .setMonthlyIncomeTaxCents(monthlyIncomeTaxCents)
        .setNetMonthlyIncomeCents(netMonthlyIncomeCents)
        .setCurrencyCode(currencyCode)
        .setCalculatedAt(new Date())
        .build();

      // persist to db
      await this.payslipRepository.save({
        timestamp: payslip.calculatedAt,
        employeeName: payslip.employeeName,
        annualSalaryCents,
        monthlyIncomeTaxCents: monthlyIncomeTaxCents,
        grossMonthlyIncomeCents: grossMonthlyIncomeCents,
        netMonthlyIncomeCents: netMonthlyIncomeCents,
        currencyCode: currencyCode,
      });

      this.logger.log(`Payslip generated successfully for ${employeeName}`);
      return payslip;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to generate payslip for ${employeeName}: ${errorMessage}`,
      );
      throw new Error(`Failed to generate payslip: ${errorMessage}`);
    }
  }

  // console output (in the original requirements)
  printPayslipToConsole(employeeName: string, annualSalaryCents: number): void {
    try {
      const annualTaxCents =
        this.taxStrategy.calculateAnnualTaxCents(annualSalaryCents);
      const grossMonthlyIncomeCents =
        FinancialMath.annualToMonthly(annualSalaryCents);
      const monthlyIncomeTaxCents =
        FinancialMath.annualToMonthly(annualTaxCents);
      const netMonthlyIncomeCents =
        grossMonthlyIncomeCents - monthlyIncomeTaxCents;

      console.log(`Monthly Payslip for: "${employeeName}"`);
      console.log(
        `Gross Monthly Income: $${FinancialMath.formatCentsAsDecimal(grossMonthlyIncomeCents)}`,
      );
      console.log(
        `Monthly Income Tax: $${FinancialMath.formatCentsAsDecimal(monthlyIncomeTaxCents)}`,
      );
      console.log(
        `Net Monthly Income: $${FinancialMath.formatCentsAsDecimal(netMonthlyIncomeCents)}`,
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(`Error generating payslip: ${errorMessage}`);
    }
  }

  // get all salary computations
  async getAllSalaryComputations(): Promise<PayslipRecord[]> {
    this.logger.log('Retrieving all salary computations');
    try {
      return await this.payslipRepository.findAll();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to retrieve salary computations: ${errorMessage}`,
      );
      throw new Error(
        `Failed to retrieve salary computations: ${errorMessage}`,
      );
    }
  }

  // get salary computations for a specific employee
  async getSalaryComputationsByEmployee(
    employeeName: string,
  ): Promise<PayslipRecord[]> {
    this.logger.log(`Retrieving salary computations for ${employeeName}`);
    try {
      return await this.payslipRepository.findByEmployeeName(employeeName);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to retrieve salary computations for ${employeeName}: ${errorMessage}`,
      );
      throw new Error(
        `Failed to retrieve salary computations: ${errorMessage}`,
      );
    }
  }

  // switch to alternative tax strategy
  switchToAlternativeStrategy(): void {
    this.taxStrategy = this.taxStrategyFactory.createAlternativeStrategy();
    this.logger.log('Switched to alternative tax strategy');
  }

  // switch to custom tax strategy
  switchToCustomStrategy(taxBrackets: TaxBracket[]): void {
    this.taxStrategy =
      this.taxStrategyFactory.createCustomStrategy(taxBrackets);
    this.logger.log('Switched to custom tax strategy');
  }

  // switch to flat tax strategy
  switchToFlatTaxStrategy(rate: number): void {
    this.taxStrategy = this.taxStrategyFactory.createFlatTaxStrategy(rate);
    this.logger.log(`Switched to flat tax strategy with rate ${rate * 100}%`);
  }

  // get current tax strategy name
  getCurrentTaxStrategyName(): string {
    return this.taxStrategy.getStrategyName();
  }

  // get service statistics
  async getServiceStatistics(): Promise<ServiceStatistics> {
    const totalPayslips = await this.payslipRepository.count();

    return {
      totalPayslipsGenerated: totalPayslips,
      currentTaxStrategy: this.getCurrentTaxStrategyName(),
      supportedCurrencies: ['MYR', 'SGD', 'IDR'],
      version: '1.0.0',
    };
  }

  // input validation
  private validateInputs(
    employeeName: string,
    annualSalaryCents: number,
  ): void {
    if (!employeeName || employeeName.trim().length === 0) {
      throw new Error('Employee name cannot be empty');
    }

    if (annualSalaryCents <= 0) {
      throw new Error('Annual salary must be a positive number');
    }

    // sanity checks
    if (annualSalaryCents > FinancialMath.dollarsToCents(10000000)) {
      this.logger.warn(
        `Very high salary detected: ${FinancialMath.centsToDollars(annualSalaryCents)}`,
      );
    }
  }
}
