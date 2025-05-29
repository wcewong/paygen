import { Module } from '@nestjs/common';
import { PayslipService } from '@/modules/payslip/services/payslip.service';
import { PayslipController } from '@/modules/payslip/controllers/payslip.controller';
import { TaxStrategyFactory } from '@/modules/payslip/strategies/tax-strategy.factory';
import { PayslipBuilder } from '@/modules/payslip/builders/payslip.builder';
import { PayslipRepositoryModule } from '@/modules/payslip/repositories/payslip.repository.module';

@Module({
  imports: [PayslipRepositoryModule],
  controllers: [PayslipController],
  providers: [PayslipService, TaxStrategyFactory, PayslipBuilder],
  exports: [PayslipService],
})
export class PayslipModule {}
