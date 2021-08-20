# Introduction
This program is used to test a DASH video service by imitating stream requests which are requested from a video player. It requires [K6](https://k6.io/) to be run. K6 is a load testing tool that can perform any kind of load test such as stress testing. This program provides additional metrics that are related with quality of a video service.

# Setup
1. Configuration template is in `sample-config.js`. 
2. Copy `sample-config.js` into `config.js`. 
3. In `config.js`, K6 options are stored in `k6options` variable. Tester configuration is stored in `config` variable. Available `config` parameters are: 
   - `logLevel`: Maximum `clog` level whose massage will be displayed.
   - `videoOptions`: List of videos that may be used in main program.
   - `errorMessageMaxLength`: Maximum length of an error message of HTTP error response to be displayed.
   
# Running
1. Include configuration and `streamRequest` function in main program `script.js`.
```javascript
import { config, k6options } from './config.js';
import { streamRequest } from './lib/stream.js';

// export K6 options
export let options = k6options;

// VU task
export default function (data) {
  streamRequest(config.videoOptions[0]);
}
```
2. Run it using *K6*   
```bash
k6 run scripts.js
```
   
# Custom Metrics
- **Package** is collection of chunks with same segment number.  
- **Segment** is individual chunk.  
- **Late** means chunk download time longer than chunk content length.  
- `***_rate` has Rate metric type.  
- `***_on` has Gauge metric type. Its `min` property stores time of first occurance.  
- `***_duration` has Trend metric type.  
- List of custom metrics names:
  - `x_error_package_rate`
  - `x_error_package_on` 
  - `x_error_segment_rate`
  - `x_error_segment_on`
  - `x_late_package_rate`
  - `x_late_package_on`
  - `x_late_segment_rate`
  - `x_late_segment_on`
  - `x_video_download_duration`
  - `x_late_video_download_on`
  - `x_buffer_lag_rate`
  - `x_buffer_lag_on`
  - `x_buffer_lag_duration`

# To Do
[ ] Read video configuration from an MPD file   
[ ] Dynamic chunk duration based on video configuration  
[ ] Bundled as a module
