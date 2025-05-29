import {
  Controller,
  Post,
  Get,
  Body,
  HttpException,
  HttpStatus,
  Logger,
  UsePipes,
  ValidationPipe,
  Param,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import {
  PayslipService,
  ServiceStatistics,
} from '@/modules/payslip/services/payslip.service';
import { FinancialMath } from '@/modules/payslip/types/payslip.types';
import { SalaryComputationDto } from '@/modules/payslip/dto/salary-computation.dto';
import { SalaryComputationsResponseDto } from '@/modules/payslip/dto/salary-computations-response.dto';
import { GeneratePayslipRequestDto } from '@/modules/payslip/dto/generate-payslip-request.dto';
import { GeneratePayslipResponseDto } from '@/modules/payslip/dto/generate-payslip-response.dto';

@Controller('payslip')
export class PayslipController {
  private readonly logger = new Logger(PayslipController.name);

  constructor(private readonly payslipService: PayslipService) {}

  // POST /payslip - generate monthly payslip computation
  @Post()
  @ApiOperation({
    summary: 'Generate monthly payslip',
    description:
      'Generate a monthly payslip calculation for an employee based on their annual salary',
  })
  @ApiBody({ type: GeneratePayslipRequestDto })
  @ApiResponse({
    status: 201,
    description: 'Payslip generated successfully',
    type: GeneratePayslipResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data',
    schema: {
      example: {
        message: 'Employee name is required',
        error: 'Bad Request',
        statusCode: 400,
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    schema: {
      example: {
        message: 'Failed to generate payslip: Database error',
        error: 'Internal Server Error',
        statusCode: 500,
      },
    },
  })
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async generateMonthlyPayslip(
    @Body() request: GeneratePayslipRequestDto,
  ): Promise<GeneratePayslipResponseDto> {
    this.logger.log(
      `POST /payslip - Generating payslip for ${request.employee_name} with salary $${request.annual_salary}`,
    );

    try {
      const annualSalaryCents = FinancialMath.dollarsToCents(
        request.annual_salary,
      );

      const payslip = await this.payslipService.generateMonthlyPayslip(
        request.employee_name.trim(),
        annualSalaryCents,
      );

      // return response
      const response: GeneratePayslipResponseDto = {
        employee_name: payslip.employeeName,
        gross_monthly_income: FinancialMath.formatCentsAsDecimal(
          payslip.grossMonthlyIncomeCents,
        ),
        monthly_income_tax: FinancialMath.formatCentsAsDecimal(
          payslip.monthlyIncomeTaxCents,
        ),
        net_monthly_income: FinancialMath.formatCentsAsDecimal(
          payslip.netMonthlyIncomeCents,
        ),
      };

      this.logger.log(
        `Successfully generated payslip for ${request.employee_name}`,
      );
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to generate payslip: ${errorMessage}`,
        errorStack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      // handle errors
      throw new HttpException(
        `Failed to generate payslip: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET /payslip - retrieve all salary computations
  @Get()
  @ApiOperation({
    summary: 'Get all salary computations',
    description: 'Retrieve all previously calculated salary computations',
  })
  @ApiResponse({
    status: 200,
    description: 'Salary computations retrieved successfully',
    type: SalaryComputationsResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getAllSalaryComputations(): Promise<SalaryComputationsResponseDto> {
    this.logger.log('GET /payslip - Retrieving all salary computations');

    try {
      const records = await this.payslipService.getAllSalaryComputations();

      const salaryComputations: SalaryComputationDto[] = records.map(
        (record) => ({
          time_stamp: record.timestamp.toISOString(),
          employee_name: record.employeeName,
          annual_salary: FinancialMath.formatCentsAsDecimal(
            record.annualSalaryCents,
          ),
          monthly_income_tax: FinancialMath.formatCentsAsDecimal(
            record.monthlyIncomeTaxCents,
          ),
        }),
      );

      const response: SalaryComputationsResponseDto = {
        salary_computations: salaryComputations,
      };

      this.logger.log(
        `Retrieved ${salaryComputations.length} salary computations`,
      );
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to retrieve salary computations: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        `Failed to retrieve salary computations: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET /payslip/employee/:name - retrieve salary computations for specific employee
  @Get('employee/:name')
  @ApiOperation({
    summary: 'Get salary computations by employee',
    description: 'Retrieve salary computations for a specific employee',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee salary computations retrieved successfully',
    type: SalaryComputationsResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Employee name is required',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getSalaryComputationsByEmployee(
    @Param('name') employeeName: string,
  ): Promise<SalaryComputationsResponseDto> {
    this.logger.log(
      `GET /payslip/employee/${employeeName} - Retrieving computations for specific employee`,
    );

    try {
      if (!employeeName || employeeName.trim() === '') {
        throw new HttpException(
          'Employee name is required',
          HttpStatus.BAD_REQUEST,
        );
      }

      const records = await this.payslipService.getSalaryComputationsByEmployee(
        employeeName.trim(),
      );

      const salaryComputations: SalaryComputationDto[] = records.map(
        (record) => ({
          time_stamp: record.timestamp.toISOString(),
          employee_name: record.employeeName,
          annual_salary: FinancialMath.formatCentsAsDecimal(
            record.annualSalaryCents,
          ),
          monthly_income_tax: FinancialMath.formatCentsAsDecimal(
            record.monthlyIncomeTaxCents,
          ),
        }),
      );

      const response: SalaryComputationsResponseDto = {
        salary_computations: salaryComputations,
      };

      this.logger.log(
        `Retrieved ${salaryComputations.length} salary computations for ${employeeName}`,
      );
      return response;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to retrieve salary computations for ${employeeName}: ${errorMessage}`,
        errorStack,
      );

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        `Failed to retrieve salary computations: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // GET /payslip/statistics - get service statistics
  @Get('statistics')
  @ApiOperation({
    summary: 'Get service statistics',
    description:
      'Retrieve service statistics including total payslips generated',
  })
  @ApiResponse({
    status: 200,
    description: 'Service statistics retrieved successfully',
    schema: {
      example: {
        totalPayslipsGenerated: 42,
        currentTaxStrategy: 'Progressive Tax Strategy',
        supportedCurrencies: ['MYR', 'SGD', 'IDR'],
        version: '1.0.0',
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  async getServiceStatistics(): Promise<ServiceStatistics> {
    this.logger.log('GET /payslip/statistics - Retrieving service statistics');

    try {
      const stats = await this.payslipService.getServiceStatistics();
      this.logger.log('Successfully retrieved service statistics');
      return stats;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Failed to retrieve service statistics: ${errorMessage}`,
        errorStack,
      );

      throw new HttpException(
        `Failed to retrieve service statistics: ${errorMessage}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
