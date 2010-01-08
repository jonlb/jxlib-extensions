/*
Script: Date.js
	Extends the Date native object to include methods useful in managing dates.

License:
	http://www.clientcide.com/wiki/cnet-libraries#license
*/

new Native({name: 'Date', initialize: Date, protect: true});
['now','parse','UTC'].each(function(method){
	Native.genericize(Date, method, true);
});
Date.$Methods = new Hash();
["Date", "Day", "FullYear", "Hours", "Milliseconds", "Minutes", "Month", "Seconds", "Time", "TimezoneOffset", 
	"Week", "Timezone", "GMTOffset", "DayOfYear", "LastMonth", "UTCDate", "UTCDay", "UTCFullYear",
	"AMPM", "UTCHours", "UTCMilliseconds", "UTCMinutes", "UTCMonth", "UTCSeconds"].each(function(method) {
	Date.$Methods.set(method.toLowerCase(), method);
});
$each({
	ms: "Milliseconds",
	year: "FullYear",
	min: "Minutes",
	mo: "Month",
	sec: "Seconds",
	hr: "Hours"
}, function(value, key){
	Date.$Methods.set(key, value);
});


Date.implement({
	set: function(key, value) {
		key = key.toLowerCase();
		var m = Date.$Methods;
		if (m.has(key)) this['set'+m.get(key)](value);
		return this;
	},
	get: function(key) {
		key = key.toLowerCase();
		var m = Date.$Methods;
		if (m.has(key)) return this['get'+m.get(key)]();
		return null;
	},
	clone: function() {
		return new Date(this.get('time'));
	},
	increment: function(interval, times) {
		return this.multiply(interval, times);
	},
	decrement: function(interval, times) {
		return this.multiply(interval, times, false);
	},
	multiply: function(interval, times, increment){
		interval = interval || 'day';
		times = $pick(times, 1);
		increment = $pick(increment, true);
		var multiplier = increment?1:-1;
		var month = this.format("%m").toInt()-1;
		var year = this.format("%Y").toInt();
		var time = this.get('time');
		var offset = 0;
		switch (interval) {
				case 'year':
					times.times(function(val) {
						if (Date.isLeapYear(year+val) && month > 1 && multiplier > 0) val++;
						if (Date.isLeapYear(year+val) && month <= 1 && multiplier < 0) val--;
						offset += Date.$units.year(year+val);
					});
					break;
				case 'month':
					times.times(function(val){
						if (multiplier < 0) val++;
						var mo = month+(val*multiplier);
						var year = year;
						if (mo < 0) {
							year--;
							mo = 12+mo;
						}
						if (mo > 11 || mo < 0) {
							year += (mo/12).toInt()*multiplier;
							mo = mo%12;
						}
						offset += Date.$units.month(mo, year);
					});
					break;
				case 'day':
					return this.set('date', this.get('date')+(multiplier*times));
				default:
					offset = Date.$units[interval]()*times;
					break;
		}
		this.set('time', time+(offset*multiplier));
		return this;
	},
	isLeapYear: function() {
		return Date.isLeapYear(this.get('year'));
	},
	clearTime: function() {
		['hr', 'min', 'sec', 'ms'].each(function(t){
			this.set(t, 0);
		}, this);
		return this;
	},
	diff: function(d, resolution) {
		resolution = resolution || 'day';
		if($type(d) == 'string') d = Date.parse(d);
		switch (resolution) {
			case 'year':
				return d.format("%Y").toInt() - this.format("%Y").toInt();
				break;
			case 'month':
				var months = (d.format("%Y").toInt() - this.format("%Y").toInt())*12;
				return months + d.format("%m").toInt() - this.format("%m").toInt();
				break;
			default:
				var diff = d.get('time') - this.get('time');
				if (diff < 0 && Date.$units[resolution]() > (-1*(diff))) return 0;
				else if (diff >= 0 && diff < Date.$units[resolution]()) return 0;
				return ((d.get('time') - this.get('time')) / Date.$units[resolution]()).round();
		}
	},
	getWeek: function() {
		var day = (new Date(this.get('year'), 0, 1)).get('date');
		return Math.round((this.get('dayofyear') + (day > 3 ? day - 4 : day + 3)) / 7);
	},
	getTimezone: function() {
		return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
	},
	getGMTOffset: function() {
		var off = this.get('timezoneOffset');
		return ((off > 0) ? '-' : '+')
			+ Math.floor(Math.abs(off) / 60).zeroise(2)
			+ (off % 60).zeroise(2);
	},
	parse: function(str) {
		this.set('time', Date.parse(str));
		return this;
	},
	format: function(f) {
		f = f || "%x %X";
		if (!this.valueOf()) return 'invalid date';
		//replace short-hand with actual format
		if (Date.$formats[f.toLowerCase()]) f = Date.$formats[f.toLowerCase()];
		var d = this;
		return f.replace(/\%([aAbBcdHIjmMpSUWwxXyYTZ])/g,
			function($1, $2) {
				switch ($2) {
					case 'a': return Date.$days[d.get('day')].substr(0, 3);
					case 'A': return Date.$days[d.get('day')];
					case 'b': return Date.$months[d.get('month')].substr(0, 3);
					case 'B': return Date.$months[d.get('month')];
					case 'c': return d.toString();
					case 'd': return d.get('date').zeroise(2);
					case 'H': return d.get('hr').zeroise(2);
					case 'I': return ((d.get('hr') % 12) || 12);
					case 'j': return d.get('dayofyear').zeroise(3);
					case 'm': return (d.get('mo') + 1).zeroise(2);
					case 'M': return d.get('min').zeroise(2);
					case 'p': return d.get('hr') < 12 ? 'AM' : 'PM';
					case 'S': return d.get('seconds').zeroise(2);
					case 'U': return d.get('week').zeroise(2);
					case 'W': throw new Error('%W is not supported yet');
					case 'w': return d.get('day');
					case 'x': 
						var c = Date.$cultures[Date.$culture];
						//return d.format("%{0}{3}%{1}{3}%{2}".substitute(c.map(function(s){return s.substr(0,1)}))); //grr!
						return d.format('%' + c[0].substr(0,1) +
							c[3] + '%' + c[1].substr(0,1) +
							c[3] + '%' + c[2].substr(0,1).toUpperCase());
					case 'X': return d.format('%I:%M%p');
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'T': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
					case '%': return '%';
				}
				return $2;
			}
		);
	},
	setAMPM: function(ampm){
		ampm = ampm.toUpperCase();
		if (this.format("%H").toInt() > 11 && ampm == "AM") 
			return this.decrement('hour', 12);
		else if (this.format("%H").toInt() < 12 && ampm == "PM")
			return this.increment('hour', 12);
		return this;
	}
});

Date.prototype.compare = Date.prototype.diff;
Date.prototype.strftime = Date.prototype.format;

Date.$nativeParse = Date.parse;

$extend(Date, {
	$months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	$days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	$daysInMonth: function(monthIndex, year) {
		if (Date.isLeapYear(year.toInt()) && monthIndex === 1) return 29;
		return [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][monthIndex];
	},
	$epoch: -1,
	$era: -2,
	$units: {
		ms: function(){return 1},
		second: function(){return 1000},
		minute: function(){return 60000},
		hour: function(){return 3600000},
		day: function(){return 86400000},
		week: function(){return 608400000},
		month: function(monthIndex, year) {
			var d = new Date();
			return Date.$daysInMonth($pick(monthIndex,d.format("%m").toInt()), $pick(year,d.format("%Y").toInt())) * 86400000;
		},
		year: function(year){
			year = year || new Date().format("%Y").toInt();
			return Date.isLeapYear(year.toInt())?31622400000:31536000000;
		}
	},
	$formats: {
		db: '%Y-%m-%d %H:%M:%S',
		compact: '%Y%m%dT%H%M%S',
		iso8601: '%Y-%m-%dT%H:%M:%S%T',
		rfc822: '%a, %d %b %Y %H:%M:%S %Z',
		'short': '%d %b %H:%M',
		'long': '%B %d, %Y %H:%M'
	},
	
	isLeapYear: function(yr) {
		return new Date(yr,1,29).getDate()==29;
	},

	parseUTC: function(value){
		var localDate = new Date(value);
		var utcSeconds = Date.UTC(localDate.get('year'), localDate.get('mo'),
		localDate.get('date'), localDate.get('hr'), localDate.get('min'), localDate.get('sec'));
		return new Date(utcSeconds);
	},
	
	parse: function(from) {
		var type = $type(from);
		if (type == 'number') return new Date(from);
		if (type != 'string') return from;
		if (!from.length) return null;
		for (var i = 0, j = Date.$parsePatterns.length; i < j; i++) {
			var r = Date.$parsePatterns[i].re.exec(from);
			if (r) {
				try {
					return Date.$parsePatterns[i].handler(r);
				} catch(e) {
					dbug.log('date parse error: ', e);
					return null;
				}
			}
		}
		return new Date(Date.$nativeParse(from));
	},

	parseMonth: function(month, num) {
		var ret = -1;
		switch ($type(month)) {
			case 'object':
				ret = Date.$months[month.get('mo')];
				break;
			case 'number':
				ret = Date.$months[month - 1] || false;
				if (!ret) throw new Error('Invalid month index value must be between 1 and 12:' + index);
				break;
			case 'string':
				var match = Date.$months.filter(function(name) {
					return this.test(name);
				}, new RegExp('^' + month, 'i'));
				if (!match.length) throw new Error('Invalid month string');
				if (match.length > 1) throw new Error('Ambiguous month');
				ret = match[0];
		}
		return (num) ? Date.$months.indexOf(ret) : ret;
	},

	parseDay: function(day, num) {
		var ret = -1;
		switch ($type(day)) {
			case 'number':
				ret = Date.$days[day - 1] || false;
				if (!ret) throw new Error('Invalid day index value must be between 1 and 7');
				break;
			case 'string':
				var match = Date.$days.filter(function(name) {
					return this.test(name);
				}, new RegExp('^' + day, 'i'));
				if (!match.length) throw new Error('Invalid day string');
				if (match.length > 1) throw new Error('Ambiguous day');
				ret = match[0];
		}
		return (num) ? Date.$days.indexOf(ret) : ret;
	},
	
	fixY2K: function(d){
		if (!isNaN(d)) {
			var newDate = new Date(d);
			if (newDate.get('year') < 2000 && d.toString().indexOf(newDate.get('year')) < 0) {
				newDate.increment('year', 100);
			}
			return newDate;
		} else return d;
	},

	$cultures: {
		'US': ['month', 'date', 'year', '/'],
		'GB': ['date', 'month', 'year', '/']
	},

	$culture: 'US',
	
	$language: 'enUS',
	
	$cIndex: function(unit){
		return Date.$cultures[Date.$culture].indexOf(unit)+1;
	},

	$parsePatterns: [
		{
			//"12.31.08", "12-31-08", "12/31/08", "12.31.2008", "12-31-2008", "12/31/2008"
			re: /^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})$/,
			handler: function(bits){
				var d = new Date();
				var culture = Date.$cultures[Date.$culture];
				d.set('year', bits[Date.$cIndex('year')]);
				d.set('month', bits[Date.$cIndex('month')] - 1);
				d.set('date', bits[Date.$cIndex('date')]);
				return Date.fixY2K(d);
			}
		},
		//"12.31.08", "12-31-08", "12/31/08", "12.31.2008", "12-31-2008", "12/31/2008"
		//above plus "10:45pm" ex: 12.31.08 10:45pm
		{
			re: /^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})\s(\d{1,2}):(\d{1,2})(\w{2})$/,
			handler: function(bits){
				var d = new Date();
				d.set('year', bits[Date.$cIndex('year')]);
				d.set('month', bits[Date.$cIndex('month')] - 1);
				d.set('date', bits[Date.$cIndex('date')]);
				d.set('hr', bits[4]);
				d.set('min', bits[5]);
				d.set('ampm', bits[6]);
				return Date.fixY2K(d);
			}
		},
		{
			//"12.31.08 11:59:59", "12-31-08 11:59:59", "12/31/08 11:59:59", "12.31.2008 11:59:59", "12-31-2008 11:59:59", "12/31/2008 11:59:59"
			re: /^(\d{1,2})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})\s(\d{1,2}):(\d{1,2}):(\d{1,2})/,
			handler: function(bits) {
				var d = new Date();
				var culture = Date.$cultures[Date.$culture];
				d.set('year', bits[Date.$cIndex('year')]);
				d.set('month', bits[Date.$cIndex('month')] - 1);
				d.set('date', bits[Date.$cIndex('date')]);
				d.set('hours', bits[4]);
				d.set('minutes', bits[5]);
				d.set('seconds', bits[6]);
				return Date.fixY2K(d);
			}
		}
	]
});

Number.implement({
	zeroise: function(length) {
		return String(this).zeroise(length);
	}
});

String.implement({
	repeat: function(times) {
		var ret = [];
		for (var i = 0; i < times; i++) ret.push(this);
		return ret.join('');
	},
	zeroise: function(length) {
		return '0'.repeat(length - this.length) + this;
	}

});


/*
Script: Date.Extras.js
	Extends the Date native object to include extra methods (on top of those in Date.js).

License:
	http://www.clientcide.com/wiki/cnet-libraries#license
*/

["LastDayOfMonth", "Ordinal"].each(function(method) {
	Date.$Methods.set(method.toLowerCase(), method);
});

Date.implement({
	timeDiffInWords: function(){
		var relative_to = (arguments.length > 0) ? arguments[1] : new Date();
		return Date.distanceOfTimeInWords(this, relative_to);
	},
	getOrdinal: function() {
		var test = this.get('date');
		return (test > 3 && test < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(test % 10, 4)];
	},
	getDayOfYear: function() {
		return ((Date.UTC(this.getFullYear(), this.getMonth(), this.getDate() + 1, 0, 0, 0)
			- Date.UTC(this.getFullYear(), 0, 1, 0, 0, 0) ) / Date.$units.day());
	},
	getLastDayOfMonth: function() {
		var ret = this.clone();
		ret.setMonth(ret.getMonth() + 1, 0);
		return ret.getDate();
	}
});

Date.alias('timeDiffInWords', 'timeAgoInWords');

$extend(Date, {
	distanceOfTimeInWords: function(fromTime, toTime) {
		return Date.getTimePhrase(((toTime.getTime() - fromTime.getTime()) / 1000).toInt(), fromTime, toTime);
	},
	getTimePhrase: function(delta, fromTime, toTime) {
		var res = Date.$resources[Date.$language]; //saving bytes
		var getPhrase = function(){
			if (delta >= 0) {
				if (delta < 60) {
					return res.ago.lessThanMinute;
				} else if (delta < 120) {
					return res.ago.minute;
				} else if (delta < (45*60)) {
					delta = (delta / 60).round();
					return res.ago.minutes;
				} else if (delta < (90*60)) {
					return res.ago.hour;
				} else if (delta < (24*60*60)) {
					delta = (delta / 3600).round();
					return res.ago.hours;
				} else if (delta < (48*60*60)) {
					return res.ago.day;
				} else {
					delta = (delta / 86400).round();
					return res.ago.days;
				}
			}
			if (delta < 0) {
				delta = delta * -1;
				if (delta < 60) {
					return res.until.lessThanMinute;
				} else if (delta < 120) {
					return res.until.minute;
				} else if (delta < (45*60)) {
					delta = (delta / 60).round();
					return res.until.minutes;
				} else if (delta < (90*60)) {
					return res.until.hour;
				} else if (delta < (24*60*60)) {
					delta = (delta / 3600).round();
					return res.until.hours;
				} else if (delta < (48*60*60)) {
					return res.until.day;
				} else  {
					delta = (delta / 86400).round();
					return res.until.days;
				}
			}
		};
		return getPhrase().substitute({delta: delta});
	}
});

Date.$resources = {
	enUS: {
		ago: {
			lessThanMinute: 'less than a minute ago',
			minute: 'about a minute ago',
			minutes: '{delta} minutes ago',
			hour: 'about an hour ago',
			hours: 'about {delta} hours ago',
			day: '1 day ago',
			days: '{delta} days ago'
		},
		until: {
			lessThanMinute: 'less than a minute from now',
			minute: 'about a minute from now',
			minutes: '{delta} minutes from now',
			hour: 'about an hour from now',
			hours: 'about {delta} hours from now',
			day: '1 day from now',
			days: '{delta} days from now'
		}
	}
};

Date.$parsePatterns.extend([
	{
		//"1999-12-31 23:59:59"
		re: /^(\d{4})[\.\-\/](\d{1,2})[\.\-\/](\d{2,4})\s(\d{1,2}):(\d{1,2}):(\d{1,2})/,
		handler: function(bits) {			
			var d = new Date();
			var culture = Date.$cultures[Date.$culture];
			d.set('year', bits[1]);
			d.set('month', bits[2] - 1);
			d.set('date', bits[3]);
			d.set('hours', bits[4]);
			d.set('minutes', bits[5]);
			d.set('seconds', bits[6]);
			return d;
		}
	},
	{		
		// yyyy-mm-ddTHH:MM:SS-0500 (ISO8601) i.e.2007-04-17T23:15:22Z
		// inspired by: http://delete.me.uk/2005/03/iso8601.html
		re: /^(\d{4})(?:-?(\d{2})(?:-?(\d{2})(?:[T ](\d{2})(?::?(\d{2})(?::?(\d{2})(?:\.(\d+))?)?)?(?:Z|(?:([-+])(\d{2})(?::?(\d{2}))?)?)?)?)?)?$/,
		handler: function(bits) {
			var offset = 0;
			var d = new Date(bits[1], 0, 1);
			if (bits[2]) d.setMonth(bits[2] - 1);
			if (bits[3]) d.setDate(bits[3]);
			if (bits[4]) d.setHours(bits[4]);
			if (bits[5]) d.setMinutes(bits[5]);
			if (bits[6]) d.setSeconds(bits[6]);
			if (bits[7]) d.setMilliseconds(('0.' + bits[7]).toInt() * 1000);
			if (bits[9]) {
				offset = (bits[9].toInt() * 60) + bits[10].toInt();
				offset *= ((bits[8] == '-') ? 1 : -1);
			}
			//offset -= d.getTimezoneOffset();
			d.setTime((d * 1) + (offset * 60 * 1000).toInt());
			return d;
		}
	}, {
		//"today"
		re: /^tod/i,
		handler: function() {
			return new Date();
		}
	}, {
		//"tomorow"
		re: /^tom/i,
		handler: function() {
			return new Date().increment();
		}
	}, {
		//"yesterday"
		re: /^yes/i,
		handler: function() {
			return new Date().decrement();
		}
	}, {
		//4th, 23rd
		re: /^(\d{1,2})(st|nd|rd|th)?$/i,
		handler: function(bits) {
			var d = new Date();
			d.setDate(bits[1].toInt());
			return d;
		}
	}, {
		//4th Jan, 23rd May
		re: /^(\d{1,2})(?:st|nd|rd|th)? (\w+)$/i,
		handler: function(bits) {
			var d = new Date();
			d.setMonth(Date.parseMonth(bits[2], true), bits[1].toInt());
			return d;
		}
	}, {
		//4th Jan 2000, 23rd May 2004
		re: /^(\d{1,2})(?:st|nd|rd|th)? (\w+),? (\d{4})$/i,
		handler: function(bits) {
			var d = new Date();
			d.setMonth(Date.parseMonth(bits[2], true), bits[1].toInt());
			d.setYear(bits[3]);
			return d;
		}
	}, {
		//Jan 4th
		re: /^(\w+) (\d{1,2})(?:st|nd|rd|th)?,? (\d{4})$/i,
		handler: function(bits) {
			var d = new Date();
			d.setMonth(Date.parseMonth(bits[1], true), bits[2].toInt());
			d.setYear(bits[3]);
			return d;
		}
	}, {
		//Jan 4th 2003
		re: /^next (\w+)$/i,
		handler: function(bits) {
			var d = new Date();
			var day = d.getDay();
			var newDay = Date.parseDay(bits[1], true);
			var addDays = newDay - day;
			if (newDay <= day) {
				addDays += 7;
			}
			d.setDate(d.getDate() + addDays);
			return d;
		}
	}, {
		//4 May 08:12
		re: /^\d+\s[a-zA-z]..\s\d.\:\d.$/,
		handler: function(bits){
			var d = new Date();
			bits = bits[0].split(" ");
			d.setDate(bits[0]);
			var m;
			Date.$months.each(function(mo, i){
				if (new RegExp("^"+bits[1]).test(mo)) m = i;
			});
			d.setMonth(m);
			d.setHours(bits[2].split(":")[0]);
			d.setMinutes(bits[2].split(":")[1]);
			d.setMilliseconds(0);
			return d;
		}
	},
	{
		re: /^last (\w+)$/i,
		handler: function(bits) {
			return Date.parse('next ' + bits[0]).decrement('day', 7);
		}
	}
]);
