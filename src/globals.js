define({
  host: 'tweetriver.com'
, timeout: 10e3
, protocol: document.location.protocol === 'https:' ? 'https' : 'http'
, min_poll_interval: 5e3
, max_backoff_interval: 60e3
, backoff_rate: 1.8
, enable_failure_mode_after_errors: 0
, disable_failure_mode_after_successes: 4
, max_reqs_per_min: 5
, jsonp_param: 'jsonp'
});
