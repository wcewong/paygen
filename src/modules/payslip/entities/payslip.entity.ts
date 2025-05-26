import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
  UpdateDateColumn,
} from 'typeorm';

@Entity('payslip_calculations')
@Index(['employeeName', 'timestamp'])
@Index(['timestamp'])
export class PayslipEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    name: 'created_at',
  })
  timestamp!: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    name: 'updated_at',
  })
  updatedAt!: Date;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    name: 'employee_name',
  })
  employeeName!: string;

  @Column({
    type: 'bigint',
    nullable: false,
    name: 'annual_salary_cents',
    comment: 'Annual salary stored in cents',
  })
  annualSalaryCents!: number;

  @Column({
    type: 'bigint',
    nullable: false,
    name: 'monthly_income_tax_cents',
    comment: 'Monthly income tax in cents',
  })
  monthlyIncomeTaxCents!: number;

  @Column({
    type: 'bigint',
    nullable: false,
    name: 'gross_monthly_income_cents',
    comment: 'Gross monthly income in cents',
  })
  grossMonthlyIncomeCents!: number;

  @Column({
    type: 'bigint',
    nullable: false,
    name: 'net_monthly_income_cents',
    comment: 'Net monthly income in cents',
  })
  netMonthlyIncomeCents!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'tax_strategy_used',
  })
  taxStrategyUsed?: string;

  @Column({
    type: 'varchar',
    length: 3,
    nullable: false,
    name: 'currency_code',
    default: "'USD'",
    comment: 'ISO 4217 currency code',
  })
  currencyCode!: string;
}
