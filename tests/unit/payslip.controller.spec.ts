import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { PayslipController } from '@/modules/payslip/controllers/payslip.controller';
import { PayslipService } from '@/modules/payslip/services/payslip.service';
import {
  PayslipRecord,
  PayslipCalculationResult,
} from '@/modules/payslip/types/payslip.types';

describe('PayslipController (TDD)', (): void => {
  let controller: PayslipController;
  let mockPayslipService: jest.Mocked<PayslipService>;

  beforeEach(async (): Promise<void> => {
    mockPayslipService = {
      generateMonthlyPayslip: jest.fn(),
      getAllSalaryComputations: jest.fn(),
      getSalaryComputationsByEmployee: jest.fn(),
      getServiceStatistics: jest.fn(),
      printPayslipToConsole: jest.fn(),
    } as unknown as jest.Mocked<PayslipService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayslipController],
      providers: [
        {
          provide: PayslipService,
          useValue: mockPayslipService,
        },
      ],
    }).compile();

    controller = module.get<PayslipController>(PayslipController);
  });

  describe('POST /payslip', (): void => {
    it('should generate payslip successfully', async (): Promise<void> => {
      const request = {
        employee_name: 'Ren',
        annual_salary: 60000,
      };

      const mockPayslip: PayslipCalculationResult = {
        employeeName: 'Ren',
        grossMonthlyIncomeCents: 500000,
        monthlyIncomeTaxCents: 50000,
        netMonthlyIncomeCents: 450000,
        currencyCode: 'MYR',
        calculatedAt: new Date(),
        grossMonthlyIncomeDisplay: '5000.00',
        monthlyIncomeTaxDisplay: '500.00',
        netMonthlyIncomeDisplay: '4500.00',
      };

      const mockGeneratePayslip = jest.fn().mockResolvedValue(mockPayslip);
      mockPayslipService.generateMonthlyPayslip = mockGeneratePayslip;

      const result = await controller.generateMonthlyPayslip(request);

      expect(result).toEqual({
        employee_name: 'Ren',
        gross_monthly_income: '5000.00',
        monthly_income_tax: '500.00',
        net_monthly_income: '4500.00',
      });

      expect(mockGeneratePayslip).toHaveBeenCalledWith(
        'Ren',
        6000000, // in cents
      );
    });

    it('should handle validation errors for empty employee name', async (): Promise<void> => {
      const request = {
        employee_name: '',
        annual_salary: 60000,
      };

      // Controller should validate and throw error before calling service
      const mockGeneratePayslip = jest
        .fn()
        .mockRejectedValue(new Error('Employee name cannot be empty'));
      mockPayslipService.generateMonthlyPayslip = mockGeneratePayslip;

      await expect(controller.generateMonthlyPayslip(request)).rejects.toThrow(
        new HttpException(
          'Failed to generate payslip: Employee name cannot be empty',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle validation errors for invalid salary', async (): Promise<void> => {
      const request = {
        employee_name: 'Ren',
        annual_salary: -1000,
      };

      // Mock service to throw validation error
      const mockGeneratePayslip = jest
        .fn()
        .mockRejectedValue(
          new Error('Annual salary must be a positive number'),
        );
      mockPayslipService.generateMonthlyPayslip = mockGeneratePayslip;

      await expect(controller.generateMonthlyPayslip(request)).rejects.toThrow(
        new HttpException(
          'Failed to generate payslip: Annual salary must be a positive number',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle service errors', async (): Promise<void> => {
      const request = {
        employee_name: 'Ren',
        annual_salary: 60000,
      };

      const mockGeneratePayslip = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      mockPayslipService.generateMonthlyPayslip = mockGeneratePayslip;

      await expect(controller.generateMonthlyPayslip(request)).rejects.toThrow(
        new HttpException(
          'Failed to generate payslip: Database error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('GET /payslip', (): void => {
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

      const mockGetAllComputations = jest.fn().mockResolvedValue(mockRecords);
      mockPayslipService.getAllSalaryComputations = mockGetAllComputations;

      const result = await controller.getAllSalaryComputations();

      expect(result.salary_computations).toHaveLength(2);
      expect(result.salary_computations[0]).toEqual({
        time_stamp: '2025-05-27T10:00:00.000Z',
        employee_name: 'Ren',
        annual_salary: '60000.00',
        monthly_income_tax: '500.00',
      });
    });

    it('should handle service errors when retrieving computations', async (): Promise<void> => {
      const mockGetAllComputations = jest
        .fn()
        .mockRejectedValue(new Error('Database connection failed'));
      mockPayslipService.getAllSalaryComputations = mockGetAllComputations;

      await expect(controller.getAllSalaryComputations()).rejects.toThrow(
        new HttpException(
          'Failed to retrieve salary computations: Database connection failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('GET /payslip/statistics', (): void => {
    it('should return service statistics', async (): Promise<void> => {
      const mockStats = {
        totalPayslipsGenerated: 42,
        currentTaxStrategy: 'Progressive Tax Strategy',
        supportedCurrencies: ['MYR', 'SGD', 'IDR'],
        version: '1.0.0',
      };

      const mockGetStatistics = jest.fn().mockResolvedValue(mockStats);
      mockPayslipService.getServiceStatistics = mockGetStatistics;

      const result = await controller.getServiceStatistics();

      expect(result).toEqual(mockStats);
      expect(mockGetStatistics).toHaveBeenCalled();
    });

    it('should handle service errors when retrieving statistics', async (): Promise<void> => {
      const mockGetStatistics = jest
        .fn()
        .mockRejectedValue(new Error('Database error'));
      mockPayslipService.getServiceStatistics = mockGetStatistics;

      await expect(controller.getServiceStatistics()).rejects.toThrow(
        new HttpException(
          'Failed to retrieve service statistics: Database error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });
});
