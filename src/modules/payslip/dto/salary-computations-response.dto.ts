import { ApiProperty } from '@nestjs/swagger';
import { SalaryComputationDto } from './salary-computation.dto';

export class SalaryComputationsResponseDto {
  @ApiProperty({
    description: 'Array of salary computations',
    type: [SalaryComputationDto],
  })
  salary_computations: SalaryComputationDto[];
}
