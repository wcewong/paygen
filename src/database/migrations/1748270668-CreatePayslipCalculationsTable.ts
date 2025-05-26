import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreatePayslipCalculationsTable1727654400000
  implements MigrationInterface
{
  name = 'CreatePayslipCalculationsTable1727654400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'payslip_calculations',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
          },
          {
            name: 'created_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp with time zone',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'employee_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'annual_salary_cents',
            type: 'bigint',
            isNullable: false,
            comment: 'annual salary in cents',
          },
          {
            name: 'monthly_income_tax_cents',
            type: 'bigint',
            isNullable: false,
            comment: 'monthly income tax in cents',
          },
          {
            name: 'gross_monthly_income_cents',
            type: 'bigint',
            isNullable: false,
            comment: 'gross monthly income in cents',
          },
          {
            name: 'net_monthly_income_cents',
            type: 'bigint',
            isNullable: false,
            comment: 'net monthly income in cents',
          },
          {
            name: 'tax_strategy_used',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'tax strategy applied for the calculation',
          },
          {
            name: 'currency_code',
            type: 'varchar',
            length: '3',
            isNullable: false,
            default: "'MYR'",
            comment: 'ISO 4217 currency code',
          },
        ],
      }),
      true, // create table if not exists
    );

    // create indexes
    await queryRunner.createIndex(
      'payslip_calculations',
      new TableIndex({
        name: 'IDX_payslip_employee_timestamp',
        columnNames: ['employee_name', 'created_at'],
      }),
    );

    await queryRunner.createIndex(
      'payslip_calculations',
      new TableIndex({
        name: 'IDX_payslip_salary_range',
        columnNames: ['annual_salary_cents'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // drop indexes before dropping the table
    await queryRunner.dropIndex(
      'payslip_calculations',
      'IDX_payslip_salary_range',
    );
    await queryRunner.dropIndex(
      'payslip_calculations',
      'IDX_payslip_employee_timestamp',
    );
    await queryRunner.dropTable('payslip_calculations');
  }
}
