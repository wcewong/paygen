import { ApiProperty } from '@nestjs/swagger';

export class GeneratePayslipResponseDto {
  @ApiProperty({
    description: 'Employee name',
    example: 'Ren',
  })
  employee_name: string;

  @ApiProperty({
    description: 'Gross monthly income in decimal format',
    example: '5000.00',
  })
  gross_monthly_income: string;

  @ApiProperty({
    description: 'Monthly income tax in decimal format',
    example: '500.00',
  })
  monthly_income_tax: string;

  @ApiProperty({
    description: 'Net monthly income in decimal format',
    example: '4500.00',
  })
  net_monthly_income: string;
}
