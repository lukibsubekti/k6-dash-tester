import { config, k6options } from './config.js';
import { streamRequest } from './lib/stream.js';

// export K6 options
export let options = k6options;

// setup task
// export function setup() {
//   return { x: 0 };
// }

// VU task
export default function (data) {
  streamRequest(config.videoOptions[3]);
}