define({
  host: 'tweetriver.com'
, timeout: 10e3
, protocol: document.location.protocol === 'https:' ? 'https' : 'http'
, min_poll_interval: 5e3
, max_backoff_interval: 60e3
, backoff_rate: 1.8
, jsonp_param: 'jsonp'
});
