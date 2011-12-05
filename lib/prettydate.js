/*
 * JavaScript Pretty Date
 * Copyright (c) 2008 John Resig (jquery.com)
 * Licensed under the MIT license.
 */

// Takes an ISO time and returns a string representing how
// long ago the date represents.
function prettyDate(time){
	var date = new Date((time || "").replace(/-/g,"/").replace(/[TZ][^hu]/g," ")),
		diff = (((new Date()).getTime() - date.getTime()) / 1000),
		day_diff = Math.floor(diff / 86400);
			
	if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
		return;
			
	return day_diff == 0 && (
        diff < 60 &&     _("just now") ||
        diff < 120 &&    _("1 minute ago") ||
        diff < 3600 &&   _("{{num}} minutes ago", { num: Math.floor( diff / 60 ) }) ||
        diff < 7200 &&   _("1 hour ago") ||
        diff < 86400 &&  _("{{num}} hours ago", { num: Math.floor( diff / 3600 ) }) ) ||
			day_diff == 1 && _("Yesterday") ||
			day_diff < 7 &&  _("{{num}} days ago", { num: day_diff }) ||
			day_diff < 31 && _("{{num}} weeks ago", { num: Math.ceil( day_diff / 7 ) });
}
