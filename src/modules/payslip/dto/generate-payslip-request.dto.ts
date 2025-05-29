import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class GeneratePayslipRequestDto {
  @ApiProperty({
    description: 'Employee name',
    example: 'John Doe',
    minLength: 1,
  })
  @IsNotEmpty({ message: 'Employee name is required' })
  @IsString({ message: 'Employee name must be a string' })
  employee_name: string;

  @ApiProperty({
    description: 'Annual salary in dollars',
    example: 60000,
    minimum: 0.01,
  })
  @IsNotEmpty({ message: 'Annual salary is required' })
  @IsNumber({}, { message: 'Annual salary must be a number' })
  @IsPositive({ message: 'Annual salary must be a positive number' })
  annual_salary: number;
}
