/*jslint nomen: true, devel: true, browser: true, confusion: true, continue: true, sloppy: true, white: true, plusplus: true, maxerr: 50, indent: 4 */
/*globals */

/*
 * JavaScript Pretty Date
 * Copyright (c) 2008 John Resig (jquery.com)
 * Licensed under the MIT license.
 * Modified by Troy Warr.
 */


// takes an ISO time and returns a string representing how long ago the date represents
function prettyDate(time) {

  var date = new Date((time || '').replace(/-/g, '/').replace(/[TZ][^hu]/g, ' ')),
      diff = (((new Date()).getTime() - date.getTime()) / 1000),
      day_diff = Math.floor(diff / 86400),
			mth_diff = (((new Date()).getFullYear() - date.getFullYear()) * 12) - ((new Date()).getMonth() + 1) + (date.getMonth() + 1), 
      // string settings
      time_str = {
        just_now: 'a moment ago',
        one_minute_ago: '1 min ago',
        minutes_ago: 'mins ago',
        one_hour_ago: '1 hour ago',
        hours_ago: 'hours ago',
        yesterday: 'yesterday',
        days_ago: 'days ago',
        one_week_ago: '1 week ago',
        weeks_ago: 'weeks ago',
				one_month_ago: 'last month',
				months_ago: 'months ago',
				one_year_ago: 'last year',
				years_ago: 'years ago'
      };

  if (isNaN(day_diff) || day_diff < 0) {
    return time_str.just_now;
  }

  return (day_diff === 0) && (
    (diff < 60 && time_str.just_now) ||
    (diff < 120 && time_str.one_minute_ago) ||
    (diff < 3600 && Math.floor( diff / 60 ) + ' ' + time_str.minutes_ago) ||
    (diff < 7200 && time_str.one_hour_ago) ||
    (diff < 86400 && Math.floor( diff / 3600 ) + ' ' + time_str.hours_ago)
  )	|| (mth_diff === 0) && (
	  (day_diff === 1 && time_str.yesterday) ||
	  (day_diff < 7 && day_diff + ' ' + time_str.days_ago) ||
	  (day_diff < 14 && time_str.one_week_ago) ||
	  (day_diff < 31 && Math.ceil( day_diff / 7 ) + ' ' + time_str.weeks_ago)
	) ||
	(mth_diff === 1 && time_str.one_month_ago) || 
	(mth_diff < 12 && mth_diff + ' ' + time_str.months_ago) ||
	(mth_diff === 12 && time_str.one_year_ago) ||
	(Math.floor(mth_diff / 12) + ' ' + time_str.years_ago);

}
