// a javascript port of wikipedia's example C implementation of the fletcher checksum
// https://gist.github.com/jed/1200689
define([], function() {
  return function(a,b,c,d,e){for(b=c=d=0;e=a.charCodeAt(d++);c=(c+b)%255)b=(b+e)%255;return c<<8|b};
});
