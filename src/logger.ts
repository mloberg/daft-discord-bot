import fs from 'fs';
import pino from 'pino';

import config from './config';

const logger = pino(
    {
        level: config.logLevel,
        prettyPrint: config.debug,
    },
    config.isTest ? fs.createWriteStream('/dev/null') : process.stderr,
);

export default logger;
