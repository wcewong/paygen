import { PayslipRecord } from '../types/payslip.types';

export interface IPayslipRepository {
  // save a new payslip record to the database
  save(payslip: Omit<PayslipRecord, 'id'>): Promise<PayslipRecord>;

  // retrieve all payslip records ordered by timestamp (newest first)
  findAll(): Promise<PayslipRecord[]>;

  // find payslip records for a specific employee
  findByEmployeeName(employeeName: string): Promise<PayslipRecord[]>;

  // find payslip records within a date range
  findByDateRange(startDate: Date, endDate: Date): Promise<PayslipRecord[]>;

  // get total count of payslip records
  count(): Promise<number>;
}

// provide token for DI
export const IPayslipRepository = Symbol('IPayslipRepository');
