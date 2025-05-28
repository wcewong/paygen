import { Test, TestingModule } from '@nestjs/testing';
import { PayslipService } from '@/modules/payslip/services/payslip.service';
import { TaxStrategyFactory } from '@/modules/payslip/strategies/tax-strategy.factory';
import { PayslipBuilder } from '@/modules/payslip/builders/payslip.builder';
import { IPayslipRepository } from '@/modules/payslip/repositories/payslip.repository.interface';
import { TaxCalculationStrategy } from '@/modules/payslip/strategies/tax-calculation.strategy.interface';
import {
  PayslipRecord,
  FinancialMath,
} from '@/modules/payslip/types/payslip.types';

interface TestData {
  readonly employeeName: string;
  readonly annualSalaryCents: number;
  readonly expectedTaxCents: number;
  readonly currencyCode: string;
}

interface TestCaseData {
  readonly salary: number;
  readonly expectedTax: number;
  readonly expectedGrossMonthly: number;
  readonly expectedMonthlyTax: number;
  readonly expectedNetMonthly: number;
}

interface CurrencyTestData {
  readonly employeeName: string;
  readonly annualSalaryCents: number;
  readonly expectedTaxCents: number;
  readonly currencyCode: string;
  readonly testDate: Date;
}

describe('PayslipService (TDD)', (): void => {
  let service: PayslipService;
  let mockRepository: jest.Mocked<IPayslipRepository>;
  let mockTaxStrategy: jest.Mocked<TaxCalculationStrategy>;
  let mockTaxStrategyFactory: jest.Mocked<TaxStrategyFactory>;
  let mockTaxStrategyFactoryPartial: {
    createDefaultStrategy: jest.Mock;
    createCustomStrategy: jest.Mock;
    createAlternativeStrategy: jest.Mock;
    createFlatTaxStrategy: jest.Mock;
  };
  let payslipBuilder: PayslipBuilder;

  beforeEach(async (): Promise<void> => {
    mockRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findByEmployeeName: jest.fn(),
      findByDateRange: jest.fn(),
      count: jest.fn(),
    };

    mockTaxStrategy = {
      calculateAnnualTaxCents: jest.fn(),
      getStrategyName: jest.fn().mockReturnValue('Progressive Tax Strategy'),
      getTaxBrackets: jest.fn().mockReturnValue([]),
    };

    // mock public methods
    mockTaxStrategyFactoryPartial = {
      createDefaultStrategy: jest.fn().mockReturnValue(mockTaxStrategy),
      createCustomStrategy: jest.fn().mockReturnValue(mockTaxStrategy),
      createAlternativeStrategy: jest.fn().mockReturnValue(mockTaxStrategy),
      createFlatTaxStrategy: jest.fn().mockReturnValue(mockTaxStrategy),
    };

    mockTaxStrategyFactory =
      mockTaxStrategyFactoryPartial as unknown as jest.Mocked<TaxStrategyFactory>;

    payslipBuilder = new PayslipBuilder();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PayslipService,
        { provide: TaxStrategyFactory, useValue: mockTaxStrategyFactory },
        { provide: PayslipBuilder, useValue: payslipBuilder },
        { provide: IPayslipRepository, useValue: mockRepository }, // use the Symbol token directly
      ],
    }).compile();

    service = module.get<PayslipService>(PayslipService);
  });

  describe('Generate Monthly Payslip', (): void => {
    it('should generate payslip for Ren with $60,000 salary correctly', async (): Promise<void> => {
      const testData: TestData = {
        employeeName: 'Ren',
        annualSalaryCents: 6000000,
        expectedTaxCents: 600000,
        currencyCode: 'MYR',
      };

      const mockCalculateAnnualTax = jest
        .fn()
        .mockReturnValue(testData.expectedTaxCents);
      mockTaxStrategy.calculateAnnualTaxCents = mockCalculateAnnualTax;

      const mockSave = jest.fn().mockResolvedValue({
        id: 'uuid-123',
        timestamp: new Date('2025-05-27T10:30:00.000Z'),
        employeeName: testData.employeeName,
        annualSalaryCents: testData.annualSalaryCents,
        monthlyIncomeTaxCents: 50000,
        grossMonthlyIncomeCents: 500000,
        netMonthlyIncomeCents: 450000,
        currencyCode: testData.currencyCode,
      });
      mockRepository.save = mockSave;

      const result = await service.generateMonthlyPayslip(
        testData.employeeName,
        testData.annualSalaryCents,
      );

      expect(result.employeeName).toBe(testData.employeeName);
      expect(result.grossMonthlyIncomeCents).toBe(500000);
      expect(result.monthlyIncomeTaxCents).toBe(50000);
      expect(result.netMonthlyIncomeCents).toBe(450000);
      expect(result.currencyCode).toBe(testData.currencyCode);

      expect(result.grossMonthlyIncomeDisplay).toBe('5000.00');
      expect(result.monthlyIncomeTaxDisplay).toBe('500.00');
      expect(result.netMonthlyIncomeDisplay).toBe('4500.00');

      expect(
        mockTaxStrategyFactoryPartial.createDefaultStrategy,
      ).toHaveBeenCalled();
      expect(mockCalculateAnnualTax).toHaveBeenCalledWith(
        testData.annualSalaryCents,
      );
      expect(mockSave).toHaveBeenCalledTimes(1);

      const mockCalls = mockSave.mock.calls as Array<
        [Omit<PayslipRecord, 'id'>]
      >;
      const savedData = mockCalls[0]?.[0];
      expect(savedData).toBeDefined();
      if (savedData) {
        expect(savedData.employeeName).toBe(testData.employeeName);
        expect(savedData.annualSalaryCents).toBe(testData.annualSalaryCents);
        expect(savedData.monthlyIncomeTaxCents).toBe(50000);
        expect(savedData.grossMonthlyIncomeCents).toBe(500000);
        expect(savedData.netMonthlyIncomeCents).toBe(450000);
        expect(savedData.currencyCode).toBe(testData.currencyCode);
        expect(savedData.timestamp).toBeInstanceOf(Date);
      }
    });

    it('should generate payslip for different salary amounts', async (): Promise<void> => {
      const testCases: readonly TestCaseData[] = [
        {
          salary: 200000,
          expectedTax: 48000,
          expectedGrossMonthly: 1666667, // $16,666.67 in cents
          expectedMonthlyTax: 400000, // $4,000 in cents
          expectedNetMonthly: 1266667, // $12,666.67 in cents
        },
        {
          salary: 80150,
          expectedTax: 10045,
          expectedGrossMonthly: 667917, // $6,679.17 in cents (rounded)
          expectedMonthlyTax: 83708, // $837.08 in cents (rounded)
          expectedNetMonthly: 584209, // $5,842.09 in cents
        },
      ];

      for (const testCase of testCases) {
        const annualSalaryCents = FinancialMath.dollarsToCents(testCase.salary);
        const expectedTaxCents = FinancialMath.dollarsToCents(
          testCase.expectedTax,
        );
        const testDate = new Date(`2025-05-27T12:${testCase.salary % 60}:00Z`);

        const mockCalculateAnnualTax = jest
          .fn()
          .mockReturnValue(expectedTaxCents);
        mockTaxStrategy.calculateAnnualTaxCents = mockCalculateAnnualTax;

        const mockSave = jest.fn().mockResolvedValue({
          id: `uuid-test-${testCase.salary}`,
          timestamp: testDate,
          employeeName: 'Test User',
          annualSalaryCents: annualSalaryCents,
          monthlyIncomeTaxCents:
            FinancialMath.annualToMonthly(expectedTaxCents),
          grossMonthlyIncomeCents:
            FinancialMath.annualToMonthly(annualSalaryCents),
          netMonthlyIncomeCents:
            FinancialMath.annualToMonthly(annualSalaryCents) -
            FinancialMath.annualToMonthly(expectedTaxCents),
          currencyCode: 'MYR',
        });
        mockRepository.save = mockSave;

        const result = await service.generateMonthlyPayslip(
          'Test User',
          annualSalaryCents,
        );

        expect(result.grossMonthlyIncomeCents).toBe(
          FinancialMath.annualToMonthly(annualSalaryCents),
        );
        expect(result.monthlyIncomeTaxCents).toBe(
          FinancialMath.annualToMonthly(expectedTaxCents),
        );
        expect(result.netMonthlyIncomeCents).toBe(
          FinancialMath.annualToMonthly(annualSalaryCents) -
            FinancialMath.annualToMonthly(expectedTaxCents),
        );
      }
    });

    it('should handle different currency codes', async (): Promise<void> => {
      const testData: CurrencyTestData = {
        employeeName: 'Singaporean User',
        annualSalaryCents: 6000000,
        expectedTaxCents: 600000,
        currencyCode: 'SGD',
        testDate: new Date('2025-05-27T14:00:00Z'),
      };

      const mockCalculateAnnualTax = jest
        .fn()
        .mockReturnValue(testData.expectedTaxCents);
      mockTaxStrategy.calculateAnnualTaxCents = mockCalculateAnnualTax;

      const mockSave = jest.fn().mockResolvedValue({
        id: 'uuid-sgd',
        timestamp: testData.testDate,
        employeeName: testData.employeeName,
        annualSalaryCents: testData.annualSalaryCents,
        monthlyIncomeTaxCents: 50000,
        grossMonthlyIncomeCents: 500000,
        netMonthlyIncomeCents: 450000,
        currencyCode: testData.currencyCode,
      });
      mockRepository.save = mockSave;

      const result = await service.generateMonthlyPayslip(
        testData.employeeName,
        testData.annualSalaryCents,
        testData.currencyCode,
      );

      expect(result.currencyCode).toBe(testData.currencyCode);

      // Verify save was called with specific currency code
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          currencyCode: testData.currencyCode,
        }),
      );
    });
  });

  describe('Console Output (Legacy Requirement)', (): void => {
    it('should print payslip to console as required', (): void => {
      const consoleSpy = jest
        .spyOn(console, 'log')
        .mockImplementation(() => undefined);

      const mockCalculateAnnualTax = jest.fn().mockReturnValue(600000);
      mockTaxStrategy.calculateAnnualTaxCents = mockCalculateAnnualTax;

      service.printPayslipToConsole('Ren', 6000000);

      expect(consoleSpy).toHaveBeenCalledWith('Monthly Payslip for: "Ren"');
      expect(consoleSpy).toHaveBeenCalledWith('Gross Monthly Income: $5000.00');
      expect(consoleSpy).toHaveBeenCalledWith('Monthly Income Tax: $500.00');
      expect(consoleSpy).toHaveBeenCalledWith('Net Monthly Income: $4500.00');

      consoleSpy.mockRestore();
    });
  });

  describe('Retrieve Salary Computations', (): void => {
    it('should return all salary computations', async (): Promise<void> => {
      const mockRecords: PayslipRecord[] = [
        {
          id: 'uuid-1',
          timestamp: new Date('2025-05-27T10:00:00Z'),
          employeeName: 'Ren',
          annualSalaryCents: 6000000,
          monthlyIncomeTaxCents: 50000,
          grossMonthlyIncomeCents: 500000,
          netMonthlyIncomeCents: 450000,
          currencyCode: 'MYR',
        },
        {
          id: 'uuid-2',
          timestamp: new Date('2025-05-27T11:00:00Z'),
          employeeName: 'Lee',
          annualSalaryCents: 8000000,
          monthlyIncomeTaxCents: 75000,
          grossMonthlyIncomeCents: 666667,
          netMonthlyIncomeCents: 591667,
          currencyCode: 'SGD',
        },
      ];

      const mockFindAll = jest.fn().mockResolvedValue(mockRecords);
      mockRepository.findAll = mockFindAll;

      const result = await service.getAllSalaryComputations();

      expect(result).toEqual(mockRecords);
      expect(mockFindAll).toHaveBeenCalled();
      expect(mockFindAll).toHaveBeenCalledTimes(1);
    });

    it('should return computations for specific employee', async (): Promise<void> => {
      const mockRecords: PayslipRecord[] = [
        {
          id: 'uuid-ren-1',
          timestamp: new Date('2025-05-27T09:00:00Z'),
          employeeName: 'Ren',
          annualSalaryCents: 6000000,
          monthlyIncomeTaxCents: 50000,
          grossMonthlyIncomeCents: 500000,
          netMonthlyIncomeCents: 450000,
          currencyCode: 'MYR',
        },
      ];

      const mockFindByEmployee = jest.fn().mockResolvedValue(mockRecords);
      mockRepository.findByEmployeeName = mockFindByEmployee;

      const result = await service.getSalaryComputationsByEmployee('Ren');

      expect(result).toEqual(mockRecords);
      expect(mockFindByEmployee).toHaveBeenCalledWith('Ren');
      expect(mockFindByEmployee).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', (): void => {
    it('should handle tax calculation errors gracefully', async (): Promise<void> => {
      const mockCalculateAnnualTax = jest.fn().mockImplementation(() => {
        throw new Error('Invalid salary amount');
      });
      mockTaxStrategy.calculateAnnualTaxCents = mockCalculateAnnualTax;

      await expect(
        service.generateMonthlyPayslip('Ren', 6000000),
      ).rejects.toThrow('Failed to generate payslip: Invalid salary amount');
    });

    it('should validate employee name', async (): Promise<void> => {
      await expect(service.generateMonthlyPayslip('', 6000000)).rejects.toThrow(
        'Employee name cannot be empty',
      );

      await expect(
        service.generateMonthlyPayslip('   ', 6000000),
      ).rejects.toThrow('Employee name cannot be empty');
    });

    it('should validate salary amounts', async (): Promise<void> => {
      await expect(
        service.generateMonthlyPayslip('Ren', -1000),
      ).rejects.toThrow('Annual salary must be a positive number');

      await expect(service.generateMonthlyPayslip('Ren', 0)).rejects.toThrow(
        'Annual salary must be a positive number',
      );
    });
  });

  describe('Service Statistics', (): void => {
    it('should return service statistics', async (): Promise<void> => {
      const mockCount = jest.fn().mockResolvedValue(42);
      mockRepository.count = mockCount;

      const stats = await service.getServiceStatistics();

      expect(stats).toEqual({
        totalPayslipsGenerated: 42,
        currentTaxStrategy: 'Progressive Tax Strategy',
        supportedCurrencies: ['MYR', 'SGD', 'IDR'],
        version: '1.0.0',
      });

      expect(mockCount).toHaveBeenCalled();
      expect(mockCount).toHaveBeenCalledTimes(1);
    });
  });
});
