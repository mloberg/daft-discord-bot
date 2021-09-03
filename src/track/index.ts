import { existsSync } from 'fs';
import { validateURL } from 'ytdl-core';

import { Track } from '../types';
import File from './file';
import YouTube from './youtube';

export default (url: string): Track => {
    if (existsSync(url)) {
        return new File(url);
    }

    if (validateURL(url)) {
        return new YouTube(url);
    }

    throw new Error(`Unsupported url ${url}.`);
};
