import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT ?? 3222;
  const apiPrefix = process.env.API_PREFIX ?? 'api/v1';
  const environment = process.env.NODE_ENV ?? 'development';

  app.setGlobalPrefix(apiPrefix);

  // CORS config
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // swagger documentation
  if (process.env.SWAGGER_ENABLED === 'true') {
    const config = new DocumentBuilder()
      .setTitle('Payslip Calculator API')
      .setDescription('Monthly payslip calculation with progressive tax system')
      .setVersion('1.0')
      .addTag('payslip')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    const swaggerPath = process.env.SWAGGER_PATH ?? 'api/docs';
    SwaggerModule.setup(swaggerPath, app, document);
  }

  // test db connection
  try {
    const dataSource = app.get(DataSource);
    await dataSource.query('SELECT 1');

    console.log('\n======================================');
    console.log('\tPAYGEN API STARTED');
    console.log('======================================');
    console.log(`Server URL: http://localhost:${port}`);
    console.log(`Environment: ${environment.toUpperCase()}`);
    console.log(`API Prefix: /${apiPrefix}`);
    console.log(`PostgreSQL: Connected successfully`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

    if (process.env.SWAGGER_ENABLED === 'true') {
      const swaggerPath = process.env.SWAGGER_PATH ?? 'api/docs';
      console.log(`API Docs: http://localhost:${port}/${swaggerPath}`);
    }

    console.log(`Default Currency: ${process.env.DEFAULT_CURRENCY ?? 'USD'}`);
    console.log(`Log Level: ${process.env.LOG_LEVEL ?? 'debug'}`);
    console.log('======================================\n');

    console.log('');
  } catch (error) {
    console.log('\n====================================');
    console.log('\tSTARTUP ERROR');
    console.log('======================================');
    console.log(`Environment: ${environment.toUpperCase()}`);
    console.log(`PostgreSQL: Connection FAILED`);
    console.log(`Database: ${process.env.DB_NAME}`);
    console.log(`Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`Error: ${errorMessage}`);
    console.log('======================================\n');
    throw error;
  }

  // gentlemen, start your engines!
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
