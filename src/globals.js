define({
  host: 'tweetriver.com'
, timeout: 10e3
, protocol: document.location.protocol === 'https:' ? 'https' : 'http'
, min_poll_interval: 5e3
});
