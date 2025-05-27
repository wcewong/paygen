import { DataSource, Repository, Between } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { PayslipEntity } from '../entities/payslip.entity';
import { IPayslipRepository } from './payslip.repository.interface';
import { PayslipRecord } from '../types/payslip.types';

@Injectable()
export class PayslipRepository implements IPayslipRepository {
  private readonly repository: Repository<PayslipEntity>;

  constructor(private readonly dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(PayslipEntity);
  }

  async save(payslip: Omit<PayslipRecord, 'id'>): Promise<PayslipRecord> {
    try {
      // map PayslipRecord to PayslipEntity
      const entity = this.repository.create({
        employeeName: payslip.employeeName,
        annualSalaryCents: payslip.annualSalaryCents,
        monthlyIncomeTaxCents: payslip.monthlyIncomeTaxCents,
        grossMonthlyIncomeCents: payslip.grossMonthlyIncomeCents,
        netMonthlyIncomeCents: payslip.netMonthlyIncomeCents,
        currencyCode: payslip.currencyCode,
        timestamp: payslip.timestamp,
        taxStrategyUsed: 'Progressive Tax Strategy', // default
      });

      const savedEntity = await this.repository.save(entity);
      return this.entityToRecord(savedEntity);
    } catch (error) {
      throw new Error(
        `Failed to save payslip record: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findAll(): Promise<PayslipRecord[]> {
    try {
      const entities = await this.repository.find({
        order: { timestamp: 'DESC' },
      });

      return entities.map((entity) => this.entityToRecord(entity));
    } catch (error) {
      throw new Error(
        `Failed to retrieve payslip records: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findByEmployeeName(employeeName: string): Promise<PayslipRecord[]> {
    try {
      const entities = await this.repository.find({
        where: { employeeName: employeeName },
        order: { timestamp: 'DESC' },
      });

      return entities.map((entity) => this.entityToRecord(entity));
    } catch (error) {
      throw new Error(
        `Failed to find payslip records for employee ${employeeName}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
  ): Promise<PayslipRecord[]> {
    try {
      const entities = await this.repository.find({
        where: {
          timestamp: Between(startDate, endDate),
        },
        order: { timestamp: 'DESC' },
      });

      return entities.map((entity) => this.entityToRecord(entity));
    } catch (error) {
      throw new Error(
        `Failed to find payslip records in date range: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async count(): Promise<number> {
    try {
      return await this.repository.count();
    } catch (error) {
      throw new Error(
        `Failed to count payslip records: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  // maps PayslipEntity to PayslipRecord (database model to domain model)
  private entityToRecord(entity: PayslipEntity): PayslipRecord {
    return {
      id: entity.id,
      timestamp: entity.timestamp,
      employeeName: entity.employeeName,
      annualSalaryCents: Number(entity.annualSalaryCents),
      monthlyIncomeTaxCents: Number(entity.monthlyIncomeTaxCents),
      grossMonthlyIncomeCents: Number(entity.grossMonthlyIncomeCents),
      netMonthlyIncomeCents: Number(entity.netMonthlyIncomeCents),
      currencyCode: entity.currencyCode,
    };
  }
}
