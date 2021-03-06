import joi from 'joi';
import { LevelWithSilent } from 'pino';

export const schema = joi
    .object({
        NODE_ENV: joi.string().lowercase().valid('development', 'test', 'production').default('production'),
        LOG_LEVEL: joi
            .string()
            .valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent')
            .lowercase()
            .default('info'),
        APP_DEBUG: joi.boolean().default(false),
        BOT_PREFIX: joi.string().invalid('@').default('_'),
        BOT_TOKEN: joi.string().required(),
        DJ_ROLE: joi.string().default('daft-dj'),
        HOST: joi.string().default('http://localhost'),
        PORT: joi.number().default(53134),
        SECRET: joi.string().min(16).required(),
    })
    .unknown()
    .required();

const { error, value: env } = schema.validate(process.env);
if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

export default {
    isTest: env.NODE_ENV === 'test',
    env: env.NODE_ENV as 'development' | 'test' | 'production',
    logLevel: env.LOG_LEVEL as LevelWithSilent,
    debug: env.APP_DEBUG as boolean,
    prefix: env.BOT_PREFIX as string,
    token: env.BOT_TOKEN as string,
    djRole: env.DJ_ROLE as string,
    host: env.HOST as string,
    port: env.PORT as number,
    secret: env.SECRET as string,
};
