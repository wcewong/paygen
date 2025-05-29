import { ApiProperty } from '@nestjs/swagger';

export class SalaryComputationDto {
  @ApiProperty({
    description: 'Timestamp when payslip was calculated',
    example: '2025-05-27T10:00:00.000Z',
  })
  time_stamp: string;

  @ApiProperty({
    description: 'Employee name',
    example: 'Ren',
  })
  employee_name: string;

  @ApiProperty({
    description: 'Annual salary in decimal format',
    example: '60000.00',
  })
  annual_salary: string;

  @ApiProperty({
    description: 'Monthly income tax in decimal format',
    example: '500.00',
  })
  monthly_income_tax: string;
}
