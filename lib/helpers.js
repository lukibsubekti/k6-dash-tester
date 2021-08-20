import { config } from '../config.js';

export function clog(level, ...rest) {
  if (level <= config.logLevel) {
    console.log(...rest);
  }
}

export function getChunkDigit(video, chunkNumber) {
  let length = ('' + chunkNumber).length;
  let digit = '';
  for (let i=0; i<video.chunkDigit-length; i++) {
    digit += 0;
  }
  return digit + chunkNumber;
}

export function getChunkUrl(video, streamId, chunkNumber) {
  return `${video.baseUrl}${video.names.stream}${streamId}${video.chunkDigitSeparator}${getChunkDigit(video,chunkNumber)}${video.ext}`;
}