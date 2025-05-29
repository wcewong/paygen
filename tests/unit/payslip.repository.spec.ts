import { Between, DataSource } from 'typeorm';
import { PayslipRepository } from '@/modules/payslip/repositories/payslip.repository';
import { IPayslipRepository } from '@/modules/payslip/repositories/payslip.repository.interface';
import { PayslipEntity } from '@/modules/payslip/entities/payslip.entity';
import {
  PayslipRecord,
  FinancialMath,
} from '@/modules/payslip/types/payslip.types';

const createMockRepository = (): Record<string, jest.Mock> => ({
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  count: jest.fn(),
  delete: jest.fn(),
});

const mockDataSource = {
  getRepository: jest.fn(),
} as unknown as DataSource;

describe('PayslipRepository (TDD)', () => {
  let repository: IPayslipRepository;
  let mockRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    // reset all mocks
    jest.clearAllMocks();

    // Create fresh mock repository for each test
    mockRepo = createMockRepository();
    mockDataSource.getRepository = jest.fn().mockReturnValue(mockRepo);

    // create repository instance with properly typed mock
    repository = new PayslipRepository(mockDataSource);
  });

  describe('Save Payslip Record', () => {
    it('should save payslip record successfully', async () => {
      const payslipData: Omit<PayslipRecord, 'id'> = {
        timestamp: new Date('2025-05-15T10:30:00Z'),
        employeeName: 'Ren',
        annualSalaryCents: FinancialMath.dollarsToCents(60000),
        monthlyIncomeTaxCents: FinancialMath.dollarsToCents(500),
        grossMonthlyIncomeCents: FinancialMath.dollarsToCents(5000),
        netMonthlyIncomeCents: FinancialMath.dollarsToCents(4500),
        currencyCode: 'MYR',
      };

      const savedEntity: PayslipEntity = {
        id: 'uuid-123',
        timestamp: payslipData.timestamp,
        updatedAt: payslipData.timestamp,
        employeeName: payslipData.employeeName,
        annualSalaryCents: payslipData.annualSalaryCents,
        monthlyIncomeTaxCents: payslipData.monthlyIncomeTaxCents,
        grossMonthlyIncomeCents: payslipData.grossMonthlyIncomeCents,
        netMonthlyIncomeCents: payslipData.netMonthlyIncomeCents,
        currencyCode: payslipData.currencyCode,
        taxStrategyUsed: 'Progressive Tax Strategy',
      };

      mockRepo.create.mockReturnValue(savedEntity);
      mockRepo.save.mockResolvedValue(savedEntity);

      const result = await repository.save(payslipData);

      expect(result).toEqual({
        id: 'uuid-123',
        timestamp: payslipData.timestamp,
        employeeName: 'Ren',
        annualSalaryCents: 6000000,
        monthlyIncomeTaxCents: 50000,
        grossMonthlyIncomeCents: 500000,
        netMonthlyIncomeCents: 450000,
        currencyCode: 'MYR',
      });

      expect(mockRepo.create).toHaveBeenCalledWith({
        employeeName: 'Ren',
        annualSalaryCents: 6000000,
        monthlyIncomeTaxCents: 50000,
        grossMonthlyIncomeCents: 500000,
        netMonthlyIncomeCents: 450000,
        currencyCode: 'MYR',
        timestamp: payslipData.timestamp,
        taxStrategyUsed: 'Progressive Tax Strategy',
      });
      expect(mockRepo.save).toHaveBeenCalledWith(savedEntity);
    });

    it('should handle database save errors gracefully', async () => {
      const payslipData: Omit<PayslipRecord, 'id'> = {
        timestamp: new Date(),
        employeeName: 'Test User',
        annualSalaryCents: 6000000,
        monthlyIncomeTaxCents: 50000,
        grossMonthlyIncomeCents: 500000,
        netMonthlyIncomeCents: 450000,
        currencyCode: 'MYR',
      };

      mockRepo.create.mockReturnValue({} as PayslipEntity);
      mockRepo.save.mockRejectedValue(new Error('Database connection failed'));

      await expect(repository.save(payslipData)).rejects.toThrow(
        'Failed to save payslip record: Database connection failed',
      );
    });
  });

  describe('Find All Payslip Records', () => {
    it('should return all payslip records ordered by timestamp desc', async () => {
      const mockEntities: PayslipEntity[] = [
        {
          id: 'uuid-1',
          timestamp: new Date('2025-05-27'),
          updatedAt: new Date('2025-05-27'),
          employeeName: 'Lee',
          annualSalaryCents: 8000000,
          monthlyIncomeTaxCents: 75000,
          grossMonthlyIncomeCents: 666667,
          netMonthlyIncomeCents: 591667,
          currencyCode: 'SGD',
          taxStrategyUsed: 'Progressive Tax Strategy',
        },
        {
          id: 'uuid-2',
          timestamp: new Date('2025-05-27'),
          updatedAt: new Date('2025-05-27'),
          employeeName: 'Ren',
          annualSalaryCents: 6000000,
          monthlyIncomeTaxCents: 50000,
          grossMonthlyIncomeCents: 500000,
          netMonthlyIncomeCents: 450000,
          currencyCode: 'MYR',
          taxStrategyUsed: 'Progressive Tax Strategy',
        },
      ];

      mockRepo.find.mockResolvedValue(mockEntities);

      const result = await repository.findAll();

      expect(result).toHaveLength(2);
      expect(result[0].employeeName).toBe('Lee');
      expect(result[1].employeeName).toBe('Ren');
      expect(result[0].annualSalaryCents).toBe(8000000);

      expect(mockRepo.find).toHaveBeenCalledWith({
        order: { timestamp: 'DESC' },
      });
    });

    it('should return empty array when no records exist', async () => {
      mockRepo.find.mockResolvedValue([]);

      const result = await repository.findAll();

      expect(result).toEqual([]);
      expect(mockRepo.find).toHaveBeenCalled();
    });
  });

  describe('Find by Employee Name', () => {
    it('should return payslip records for specific employee', async () => {
      const mockEntities: PayslipEntity[] = [
        {
          id: 'uuid-1',
          timestamp: new Date('2025-05-27'),
          updatedAt: new Date('2025-05-27'),
          employeeName: 'Ren',
          annualSalaryCents: 6000000,
          monthlyIncomeTaxCents: 50000,
          grossMonthlyIncomeCents: 500000,
          netMonthlyIncomeCents: 450000,
          currencyCode: 'MYR',
          taxStrategyUsed: 'Progressive Tax Strategy',
        },
      ];

      mockRepo.find.mockResolvedValue(mockEntities);

      const result = await repository.findByEmployeeName('Ren');

      expect(result).toHaveLength(1);
      expect(result[0].employeeName).toBe('Ren');

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { employeeName: 'Ren' },
        order: { timestamp: 'DESC' },
      });
    });

    it('should handle employee names with special characters', async () => {
      mockRepo.find.mockResolvedValue([]);

      await repository.findByEmployeeName("O'Connor");

      expect(mockRepo.find).toHaveBeenCalledWith({
        where: { employeeName: "O'Connor" },
        order: { timestamp: 'DESC' },
      });
    });
  });

  describe('Find by Date Range', () => {
    it('should return payslip records within date range', async () => {
      const startDate = new Date('2025-05-01');
      const endDate = new Date('2025-05-31');
      const mockEntities: PayslipEntity[] = [
        {
          id: 'uuid-1',
          timestamp: new Date('2025-05-27'),
          updatedAt: new Date('2025-05-27'),
          employeeName: 'Ren',
          annualSalaryCents: 6000000,
          monthlyIncomeTaxCents: 50000,
          grossMonthlyIncomeCents: 500000,
          netMonthlyIncomeCents: 450000,
          currencyCode: 'MYR',
          taxStrategyUsed: 'Progressive Tax Strategy',
        },
      ];

      mockRepo.find.mockResolvedValue(mockEntities);

      const result = await repository.findByDateRange(startDate, endDate);

      expect(result).toHaveLength(1);
      expect(mockRepo.find).toHaveBeenCalledWith({
        where: {
          timestamp: Between(startDate, endDate),
        },
        order: { timestamp: 'DESC' },
      });
    });
  });

  describe('Count Records', () => {
    it('should return total count of payslip records', async () => {
      mockRepo.count.mockResolvedValue(42);

      const result = await repository.count();

      expect(result).toBe(42);
      expect(mockRepo.count).toHaveBeenCalled();
    });

    it('should return 0 when no records exist', async () => {
      mockRepo.count.mockResolvedValue(0);

      const result = await repository.count();

      expect(result).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors in findAll', async () => {
      mockRepo.find.mockRejectedValue(new Error('Connection timeout'));

      await expect(repository.findAll()).rejects.toThrow(
        'Failed to retrieve payslip records: Connection timeout',
      );
    });

    it('should handle database connection errors in count', async () => {
      mockRepo.count.mockRejectedValue(new Error('Database unavailable'));

      await expect(repository.count()).rejects.toThrow(
        'Failed to count payslip records: Database unavailable',
      );
    });
  });

  describe('Data Mapping', () => {
    it('should correctly map entity fields to PayslipRecord', async () => {
      const mockEntity: PayslipEntity = {
        id: 'uuid-123',
        timestamp: new Date('2025-05-15T10:30:00Z'),
        updatedAt: new Date('2025-05-15T10:30:00Z'),
        employeeName: 'Mohd. Ali',
        annualSalaryCents: 7500000,
        monthlyIncomeTaxCents: 87500,
        grossMonthlyIncomeCents: 625000,
        netMonthlyIncomeCents: 537500,
        currencyCode: 'SGD',
        taxStrategyUsed: 'Progressive Tax Strategy',
      };

      mockRepo.find.mockResolvedValue([mockEntity]);

      const result = await repository.findAll();
      const record = result[0];

      expect(record).toEqual({
        id: 'uuid-123',
        timestamp: new Date('2025-05-15T10:30:00Z'),
        employeeName: 'Mohd. Ali',
        annualSalaryCents: 7500000,
        monthlyIncomeTaxCents: 87500,
        grossMonthlyIncomeCents: 625000,
        netMonthlyIncomeCents: 537500,
        currencyCode: 'SGD',
      });
    });
  });
});
