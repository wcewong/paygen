import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  PORT: Joi.number().port().default(3000),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().port().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  // Security
  JWT_SECRET: Joi.string().min(32).required(),

  // Financial
  DEFAULT_CURRENCY: Joi.string().length(3).default('MYR'),
  PRECISION_DECIMAL_PLACES: Joi.number().min(0).max(4).default(2),
});
