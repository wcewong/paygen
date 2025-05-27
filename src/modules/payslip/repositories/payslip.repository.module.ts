import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayslipEntity } from '../entities/payslip.entity';
import { PayslipRepository } from './payslip.repository';
import { IPayslipRepository } from './payslip.repository.interface';

@Module({
  imports: [TypeOrmModule.forFeature([PayslipEntity])],
  providers: [
    {
      provide: IPayslipRepository,
      useClass: PayslipRepository,
    },
  ],
  exports: [IPayslipRepository],
})
export class PayslipRepositoryModule {}
