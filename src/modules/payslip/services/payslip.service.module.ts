import { Module } from '@nestjs/common';
import { PayslipService } from './payslip.service';
import { TaxStrategyFactory } from '../strategies/tax-strategy.factory';
import { PayslipBuilder } from '../builders/payslip.builder';
import { PayslipRepositoryModule } from '../repositories/payslip.repository.module';

@Module({
  imports: [PayslipRepositoryModule],
  providers: [PayslipService, TaxStrategyFactory, PayslipBuilder],
  exports: [PayslipService],
})
export class PayslipServiceModule {}
