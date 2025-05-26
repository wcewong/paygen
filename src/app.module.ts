// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayslipEntity } from '@/modules/payslip/entities/payslip.entity';
// import { PayslipModule } from '@/modules/payslip/payslip.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
      isGlobal: true,
      cache: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'your_db_username'),
        password: configService.get<string>('DB_PASSWORD', 'your_db_password'),
        database:
          configService.get<string>('NODE_ENV') === 'test'
            ? configService.get<string>('DB_TEST_NAME', 'paygen_test')
            : configService.get<string>('DB_NAME', 'paygen'),
        entities: [PayslipEntity],
        migrations: ['dist/database/migrations/*.js'],
        synchronize: false,
        logging: configService.get<string>('NODE_ENV') !== 'production',
      }),
    }),
    // PayslipModule,
  ],
})
export class AppModule {}
