import http from 'k6/http';
import { sleep, check } from 'k6';
import { Trend, Gauge, Rate } from 'k6/metrics';
import { getChunkUrl, clog } from './helpers.js';
import { config } from '../config.js';

// define custom metrics
const xErrorPackageRate   = new Rate('x_error_package_rate');
const xErrorPackageOn     = new Gauge('x_error_package_on');
const xErrorSegmentRate   = new Rate('x_error_segment_rate');
const xErrorSegmentOn     = new Gauge('x_error_segment_on');
const xLatePackageRate    = new Rate('x_late_package_rate');
const xLatePackageOn      = new Gauge('x_late_package_on');
const xLateSegmentRate    = new Rate('x_late_segment_rate');
const xLateSegmentOn      = new Gauge('x_late_segment_on');
const xVideoDownloadDuration  = new Trend('x_video_download_duration');
const xLateVideoDownloadRate  = new Rate('x_late_video_download_rate');
const xLateVideoDownloadOn    = new Gauge('x_late_video_download_on');
const xBufferLagRate      = new Rate('x_buffer_lag_rate');
const xBufferLagOn        = new Gauge('x_buffer_lag_on');
const xBufferLagDuration  = new Trend('x_buffer_lag_duration');

export function streamRequest(video) {
  // initiation
  const httpGetParams = {
    headers: video.headers,
  };
  let bufferLength = 0; // ms
  let startedOn = Date.now();
  clog(3, 'Started On:', startedOn);

  // loop for required chunks
  let lastChunkNumber = video.chunkStartAt + video.chunkQty - 1;
  for (let chunkNumber=video.chunkStartAt; chunkNumber<=lastChunkNumber; chunkNumber++) {

    // setup batch request
    let requests = [];
    video.streams.forEach(streamId => {
      requests.push(["GET", getChunkUrl(video, streamId, chunkNumber), null, httpGetParams])
    });

    // start request
    let requestStartedOn = Date.now();
    let responses = http.batch(requests);

    // check result
    let result = true; // result of package
    let durations = [];
    let maxDuration;
    responses.forEach(response => {
      // add segment load duration
      durations.push(response.timings.duration); // float ms

      // check segment result
      let isSuccess = check(response, {
        'all requests are succeded': (r) => {return r.status == 200},
      });
      if (!isSuccess) {
        xErrorSegmentRate.add(true);
        xErrorSegmentOn.add(requestStartedOn);

        clog(2, 'Response error. Status Code:', response.status, 'Response Body:', 
          response.body.substr(0, 
            response.body.length > config.errorMessageMaxLength 
            ? config.errorMessageMaxLength 
            : response.body.length
          )
        );
      } else {
        xErrorSegmentRate.add(false);

        // check segment duration
        if (response.timings.duration > video.chunkDuration) {
          xLateSegmentRate.add(true);
          xLateSegmentOn.add(requestStartedOn);
        } else {
          xLateSegmentRate.add(false);
        }
      }

      // aggregate segment results
      result = result && isSuccess;
    });

    // get package load duration
    maxDuration = Math.ceil(Math.max(...durations)); // int ms
    
    // check package result
    if (!result) {
      xErrorPackageRate.add(true);
      xErrorPackageOn.add(requestStartedOn);

    } else {
      xErrorPackageRate.add(false);

      // check package duration
      if (maxDuration > video.chunkDuration) {
        xLatePackageRate.add(true);
        xLatePackageOn.add(requestStartedOn);
      } else {
        xLatePackageRate.add(false);
      }
    }

    // check buffer 
    let currentChunkDuration = !result ? 0 : video.chunkDuration;
    if (chunkNumber!==video.chunkStartAt && bufferLength - maxDuration < 0) { // lag occured
      xBufferLagRate.add(true);
      xBufferLagOn.add(requestStartedOn + bufferLength); // lag is detected on time of request + available buffer at that time
      xBufferLagDuration.add(maxDuration - bufferLength);

      // reset to available chunk duration if lag occured
      bufferLength = currentChunkDuration;
    } else {
      xBufferLagRate.add(false);

      // calculate current buffer 
      bufferLength = chunkNumber===video.chunkStartAt ? currentChunkDuration : bufferLength + currentChunkDuration - maxDuration;
    }

    // last chunk
    if (chunkNumber === lastChunkNumber) {
      clog(3, 'Last chunk.');
      continue;
    }

    // any package error
    if (!result) {
      clog(3, 'Continue request because of error.');
      continue;
    }

    // check requesting time
    if (bufferLength < video.minimumBuffer) {
      // continue to next request directly
      clog(3, 'Continue request because buffer is below minimum.');
    } else {
      // sleep for a while
      let sleepDuration = bufferLength - video.minimumBuffer; // ms
      let sleepDurationSec = Math.round(sleepDuration/1000) // seconds
      clog(3, `Wait request for ${sleepDurationSec}s (${sleepDuration}ms) because buffer is enough.`);
      sleep(sleepDurationSec); // seconds
      bufferLength -= (sleepDurationSec * 1000);
    }
  }

  // summarize
  let endedOn = Date.now();
  let videoDownloadDuration = endedOn - startedOn;
  xVideoDownloadDuration.add(videoDownloadDuration);
  let totalVideoLength = video.chunkDuration * video.chunkQty;
  if (videoDownloadDuration > totalVideoLength) {
    xLateVideoDownloadRate.add(true);
    xLateVideoDownloadOn.add(startedOn);
  } else {
    xLateVideoDownloadRate.add(false);
  }

  clog(3, 'Ended On:', endedOn);
  clog(2, 'Duration:', videoDownloadDuration, 'ms');
}