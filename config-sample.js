
// Put any desired K6 options here
export const k6options = {
  vus: 1,
  iterations: 1,
  ext: {
    loadimpact: {
      projectID: 123456,
      name: "K6 Dash Video Tester"
    }
  },
  summaryTimeUnit: 'ms',

  // sample thresholds
  thresholds: {
    http_req_failed: ['rate<1'],
    x_buffer_lag_rate: ['rate<1'],
    x_buffer_lag_duration: ['max<1000', 'p(90)<100', 'p(95)<500', 'p(99.9)<1000'],
    x_late_video_download_rate: ['rate<1'],
    // x_error_package_rate
    // x_error_package_on
    // x_error_segment_rate
    // x_error_segment_on
    // x_late_package_rate
    // x_late_package_on
    // x_late_segment_rate
    // x_late_segment_on
    // x_video_download_duration
    // x_late_video_download_on
    // x_buffer_lag_on
  }
  // stages: [
  //   { duration: '30s', target: 20 },
  //   { duration: '1m30s', target: 10 },
  //   { duration: '20s', target: 0 },
  // ],
};

// Put tester program configuration here
export const config = {
  logLevel: 2,

  // Put any videos you want to test
  videoOptions: [
    {
      baseUrl: 'http://127.0.0.1:3000/stream/360/', // base URL of stream files
      streams: [0, 1], // representation IDs of chunks to be tested
      ext: '.ts',
      names: {
        stream: 'stream', // base name of a stream file
      },
      chunkDigit: 5, // number of digits of segment ID on a stream file name
      chunkDigitSeparator: '-', // separator between base name and segment ID on a stream file name
      chunkStartAt: 1, // first segment ID to be tested
      chunkQty: 5, // number of chunks to be tested
      chunkDuration: 5000, // ms
      minimumBuffer: 20000, // ms
      headers: {
        'x-token': 9,
      }
    },

  ]  
};


