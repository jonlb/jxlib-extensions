/******************************************************************************
 * MooTools 1.2.2
 * Copyright (c) 2006-2007 [Valerio Proietti](http://mad4milk.net/).
 * MooTools is distributed under an MIT-style license.
 ******************************************************************************
 * reset.css - Copyright (c) 2006, Yahoo! Inc. All rights reserved.
 * Code licensed under the BSD License: http://developer.yahoo.net/yui/license.txt
 ******************************************************************************
 * Jx UI Library, 2.0.1
 * Copyright (c) 2006-2008, DM Solutions Group Inc. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *****************************************************************************/
/*
Script: Core.js
	MooTools - My Object Oriented JavaScript Tools.

License:
	MIT-style license.

Copyright:
	Copyright (c) 2006-2008 [Valerio Proietti](http://mad4milk.net/).

Code & Documentation:
	[The MooTools production team](http://mootools.net/developers/).

Inspiration:
	- Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
	- Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)
*/

var MooTools = {
	'version': '1.2.3',
	'build': '4980aa0fb74d2f6eb80bcd9f5b8e1fd6fbb8f607'
};

var Native = function(options){
	options = options || {};
	var name = options.name;
	var legacy = options.legacy;
	var protect = options.protect;
	var methods = options.implement;
	var generics = options.generics;
	var initialize = options.initialize;
	var afterImplement = options.afterImplement || function(){};
	var object = initialize || legacy;
	generics = generics !== false;

	object.constructor = Native;
	object.$family = {name: 'native'};
	if (legacy && initialize) object.prototype = legacy.prototype;
	object.prototype.constructor = object;

	if (name){
		var family = name.toLowerCase();
		object.prototype.$family = {name: family};
		Native.typize(object, family);
	}

	var add = function(obj, name, method, force){
		if (!protect || force || !obj.prototype[name]) obj.prototype[name] = method;
		if (generics) Native.genericize(obj, name, protect);
		afterImplement.call(obj, name, method);
		return obj;
	};

	object.alias = function(a1, a2, a3){
		if (typeof a1 == 'string'){
			var pa1 = this.prototype[a1];
			if ((a1 = pa1)) return add(this, a2, a1, a3);
		}
		for (var a in a1) this.alias(a, a1[a], a2);
		return this;
	};

	object.implement = function(a1, a2, a3){
		if (typeof a1 == 'string') return add(this, a1, a2, a3);
		for (var p in a1) add(this, p, a1[p], a2);
		return this;
	};

	if (methods) object.implement(methods);

	return object;
};

Native.genericize = function(object, property, check){
	if ((!check || !object[property]) && typeof object.prototype[property] == 'function') object[property] = function(){
		var args = Array.prototype.slice.call(arguments);
		return object.prototype[property].apply(args.shift(), args);
	};
};

Native.implement = function(objects, properties){
	for (var i = 0, l = objects.length; i < l; i++) objects[i].implement(properties);
};

Native.typize = function(object, family){
	if (!object.type) object.type = function(item){
		return ($type(item) === family);
	};
};

(function(){
	var natives = {'Array': Array, 'Date': Date, 'Function': Function, 'Number': Number, 'RegExp': RegExp, 'String': String};
	for (var n in natives) new Native({name: n, initialize: natives[n], protect: true});

	var types = {'boolean': Boolean, 'native': Native, 'object': Object};
	for (var t in types) Native.typize(types[t], t);

	var generics = {
		'Array': ["concat", "indexOf", "join", "lastIndexOf", "pop", "push", "reverse", "shift", "slice", "sort", "splice", "toString", "unshift", "valueOf"],
		'String': ["charAt", "charCodeAt", "concat", "indexOf", "lastIndexOf", "match", "replace", "search", "slice", "split", "substr", "substring", "toLowerCase", "toUpperCase", "valueOf"]
	};
	for (var g in generics){
		for (var i = generics[g].length; i--;) Native.genericize(natives[g], generics[g][i], true);
	}
})();

var Hash = new Native({

	name: 'Hash',

	initialize: function(object){
		if ($type(object) == 'hash') object = $unlink(object.getClean());
		for (var key in object) this[key] = object[key];
		return this;
	}

});

Hash.implement({

	forEach: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key)) fn.call(bind, this[key], key, this);
		}
	},

	getClean: function(){
		var clean = {};
		for (var key in this){
			if (this.hasOwnProperty(key)) clean[key] = this[key];
		}
		return clean;
	},

	getLength: function(){
		var length = 0;
		for (var key in this){
			if (this.hasOwnProperty(key)) length++;
		}
		return length;
	}

});

Hash.alias('forEach', 'each');

Array.implement({

	forEach: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++) fn.call(bind, this[i], i, this);
	}

});

Array.alias('forEach', 'each');

function $A(iterable){
	if (iterable.item){
		var l = iterable.length, array = new Array(l);
		while (l--) array[l] = iterable[l];
		return array;
	}
	return Array.prototype.slice.call(iterable);
};

function $arguments(i){
	return function(){
		return arguments[i];
	};
};

function $chk(obj){
	return !!(obj || obj === 0);
};

function $clear(timer){
	clearTimeout(timer);
	clearInterval(timer);
	return null;
};

function $defined(obj){
	return (obj != undefined);
};

function $each(iterable, fn, bind){
	var type = $type(iterable);
	((type == 'arguments' || type == 'collection' || type == 'array') ? Array : Hash).each(iterable, fn, bind);
};

function $empty(){};

function $extend(original, extended){
	for (var key in (extended || {})) original[key] = extended[key];
	return original;
};

function $H(object){
	return new Hash(object);
};

function $lambda(value){
	return ($type(value) == 'function') ? value : function(){
		return value;
	};
};

function $merge(){
	var args = Array.slice(arguments);
	args.unshift({});
	return $mixin.apply(null, args);
};

function $mixin(mix){
	for (var i = 1, l = arguments.length; i < l; i++){
		var object = arguments[i];
		if ($type(object) != 'object') continue;
		for (var key in object){
			var op = object[key], mp = mix[key];
			mix[key] = (mp && $type(op) == 'object' && $type(mp) == 'object') ? $mixin(mp, op) : $unlink(op);
		}
	}
	return mix;
};

function $pick(){
	for (var i = 0, l = arguments.length; i < l; i++){
		if (arguments[i] != undefined) return arguments[i];
	}
	return null;
};

function $random(min, max){
	return Math.floor(Math.random() * (max - min + 1) + min);
};

function $splat(obj){
	var type = $type(obj);
	return (type) ? ((type != 'array' && type != 'arguments') ? [obj] : obj) : [];
};

var $time = Date.now || function(){
	return +new Date;
};

function $try(){
	for (var i = 0, l = arguments.length; i < l; i++){
		try {
			return arguments[i]();
		} catch(e){}
	}
	return null;
};

function $type(obj){
	if (obj == undefined) return false;
	if (obj.$family) return (obj.$family.name == 'number' && !isFinite(obj)) ? false : obj.$family.name;
	if (obj.nodeName){
		switch (obj.nodeType){
			case 1: return 'element';
			case 3: return (/\S/).test(obj.nodeValue) ? 'textnode' : 'whitespace';
		}
	} else if (typeof obj.length == 'number'){
		if (obj.callee) return 'arguments';
		else if (obj.item) return 'collection';
	}
	return typeof obj;
};

function $unlink(object){
	var unlinked;
	switch ($type(object)){
		case 'object':
			unlinked = {};
			for (var p in object) unlinked[p] = $unlink(object[p]);
		break;
		case 'hash':
			unlinked = new Hash(object);
		break;
		case 'array':
			unlinked = [];
			for (var i = 0, l = object.length; i < l; i++) unlinked[i] = $unlink(object[i]);
		break;
		default: return object;
	}
	return unlinked;
};
/*
Script: Browser.js
	The Browser Core. Contains Browser initialization, Window and Document, and the Browser Hash.

License:
	MIT-style license.
*/

var Browser = $merge({

	Engine: {name: 'unknown', version: 0},

	Platform: {name: (window.orientation != undefined) ? 'ipod' : (navigator.platform.match(/mac|win|linux/i) || ['other'])[0].toLowerCase()},

	Features: {xpath: !!(document.evaluate), air: !!(window.runtime), query: !!(document.querySelector)},

	Plugins: {},

	Engines: {

		presto: function(){
			return (!window.opera) ? false : ((arguments.callee.caller) ? 960 : ((document.getElementsByClassName) ? 950 : 925));
		},

		trident: function(){
			return (!window.ActiveXObject) ? false : ((window.XMLHttpRequest) ? 5 : 4);
		},

		webkit: function(){
			return (navigator.taintEnabled) ? false : ((Browser.Features.xpath) ? ((Browser.Features.query) ? 525 : 420) : 419);
		},

		gecko: function(){
			return (document.getBoxObjectFor == undefined) ? false : ((document.getElementsByClassName) ? 19 : 18);
		}

	}

}, Browser || {});

Browser.Platform[Browser.Platform.name] = true;

Browser.detect = function(){

	for (var engine in this.Engines){
		var version = this.Engines[engine]();
		if (version){
			this.Engine = {name: engine, version: version};
			this.Engine[engine] = this.Engine[engine + version] = true;
			break;
		}
	}

	return {name: engine, version: version};

};

Browser.detect();

Browser.Request = function(){
	return $try(function(){
		return new XMLHttpRequest();
	}, function(){
		return new ActiveXObject('MSXML2.XMLHTTP');
	});
};

Browser.Features.xhr = !!(Browser.Request());

Browser.Plugins.Flash = (function(){
	var version = ($try(function(){
		return navigator.plugins['Shockwave Flash'].description;
	}, function(){
		return new ActiveXObject('ShockwaveFlash.ShockwaveFlash').GetVariable('$version');
	}) || '0 r0').match(/\d+/g);
	return {version: parseInt(version[0] || 0 + '.' + version[1], 10) || 0, build: parseInt(version[2], 10) || 0};
})();

function $exec(text){
	if (!text) return text;
	if (window.execScript){
		window.execScript(text);
	} else {
		var script = document.createElement('script');
		script.setAttribute('type', 'text/javascript');
		script[(Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerText' : 'text'] = text;
		document.head.appendChild(script);
		document.head.removeChild(script);
	}
	return text;
};

Native.UID = 1;

var $uid = (Browser.Engine.trident) ? function(item){
	return (item.uid || (item.uid = [Native.UID++]))[0];
} : function(item){
	return item.uid || (item.uid = Native.UID++);
};

var Window = new Native({

	name: 'Window',

	legacy: (Browser.Engine.trident) ? null: window.Window,

	initialize: function(win){
		$uid(win);
		if (!win.Element){
			win.Element = $empty;
			if (Browser.Engine.webkit) win.document.createElement("iframe"); //fixes safari 2
			win.Element.prototype = (Browser.Engine.webkit) ? window["[[DOMElement.prototype]]"] : {};
		}
		win.document.window = win;
		return $extend(win, Window.Prototype);
	},

	afterImplement: function(property, value){
		window[property] = Window.Prototype[property] = value;
	}

});

Window.Prototype = {$family: {name: 'window'}};

new Window(window);

var Document = new Native({

	name: 'Document',

	legacy: (Browser.Engine.trident) ? null: window.Document,

	initialize: function(doc){
		$uid(doc);
		doc.head = doc.getElementsByTagName('head')[0];
		doc.html = doc.getElementsByTagName('html')[0];
		if (Browser.Engine.trident && Browser.Engine.version <= 4) $try(function(){
			doc.execCommand("BackgroundImageCache", false, true);
		});
		if (Browser.Engine.trident) doc.window.attachEvent('onunload', function() {
			doc.window.detachEvent('onunload', arguments.callee);
			doc.head = doc.html = doc.window = null;
		});
		return $extend(doc, Document.Prototype);
	},

	afterImplement: function(property, value){
		document[property] = Document.Prototype[property] = value;
	}

});

Document.Prototype = {$family: {name: 'document'}};

new Document(document);
/*
Script: Array.js
	Contains Array Prototypes like each, contains, and erase.

License:
	MIT-style license.
*/

Array.implement({

	every: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (!fn.call(bind, this[i], i, this)) return false;
		}
		return true;
	},

	filter: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) results.push(this[i]);
		}
		return results;
	},

	clean: function() {
		return this.filter($defined);
	},

	indexOf: function(item, from){
		var len = this.length;
		for (var i = (from < 0) ? Math.max(0, len + from) : from || 0; i < len; i++){
			if (this[i] === item) return i;
		}
		return -1;
	},

	map: function(fn, bind){
		var results = [];
		for (var i = 0, l = this.length; i < l; i++) results[i] = fn.call(bind, this[i], i, this);
		return results;
	},

	some: function(fn, bind){
		for (var i = 0, l = this.length; i < l; i++){
			if (fn.call(bind, this[i], i, this)) return true;
		}
		return false;
	},

	associate: function(keys){
		var obj = {}, length = Math.min(this.length, keys.length);
		for (var i = 0; i < length; i++) obj[keys[i]] = this[i];
		return obj;
	},

	link: function(object){
		var result = {};
		for (var i = 0, l = this.length; i < l; i++){
			for (var key in object){
				if (object[key](this[i])){
					result[key] = this[i];
					delete object[key];
					break;
				}
			}
		}
		return result;
	},

	contains: function(item, from){
		return this.indexOf(item, from) != -1;
	},

	extend: function(array){
		for (var i = 0, j = array.length; i < j; i++) this.push(array[i]);
		return this;
	},
	
	getLast: function(){
		return (this.length) ? this[this.length - 1] : null;
	},

	getRandom: function(){
		return (this.length) ? this[$random(0, this.length - 1)] : null;
	},

	include: function(item){
		if (!this.contains(item)) this.push(item);
		return this;
	},

	combine: function(array){
		for (var i = 0, l = array.length; i < l; i++) this.include(array[i]);
		return this;
	},

	erase: function(item){
		for (var i = this.length; i--; i){
			if (this[i] === item) this.splice(i, 1);
		}
		return this;
	},

	empty: function(){
		this.length = 0;
		return this;
	},

	flatten: function(){
		var array = [];
		for (var i = 0, l = this.length; i < l; i++){
			var type = $type(this[i]);
			if (!type) continue;
			array = array.concat((type == 'array' || type == 'collection' || type == 'arguments') ? Array.flatten(this[i]) : this[i]);
		}
		return array;
	},

	hexToRgb: function(array){
		if (this.length != 3) return null;
		var rgb = this.map(function(value){
			if (value.length == 1) value += value;
			return value.toInt(16);
		});
		return (array) ? rgb : 'rgb(' + rgb + ')';
	},

	rgbToHex: function(array){
		if (this.length < 3) return null;
		if (this.length == 4 && this[3] == 0 && !array) return 'transparent';
		var hex = [];
		for (var i = 0; i < 3; i++){
			var bit = (this[i] - 0).toString(16);
			hex.push((bit.length == 1) ? '0' + bit : bit);
		}
		return (array) ? hex : '#' + hex.join('');
	}

});
/*
Script: Function.js
	Contains Function Prototypes like create, bind, pass, and delay.

License:
	MIT-style license.
*/

Function.implement({

	extend: function(properties){
		for (var property in properties) this[property] = properties[property];
		return this;
	},

	create: function(options){
		var self = this;
		options = options || {};
		return function(event){
			var args = options.arguments;
			args = (args != undefined) ? $splat(args) : Array.slice(arguments, (options.event) ? 1 : 0);
			if (options.event) args = [event || window.event].extend(args);
			var returns = function(){
				return self.apply(options.bind || null, args);
			};
			if (options.delay) return setTimeout(returns, options.delay);
			if (options.periodical) return setInterval(returns, options.periodical);
			if (options.attempt) return $try(returns);
			return returns();
		};
	},

	run: function(args, bind){
		return this.apply(bind, $splat(args));
	},

	pass: function(args, bind){
		return this.create({bind: bind, arguments: args});
	},

	bind: function(bind, args){
		return this.create({bind: bind, arguments: args});
	},

	bindWithEvent: function(bind, args){
		return this.create({bind: bind, arguments: args, event: true});
	},

	attempt: function(args, bind){
		return this.create({bind: bind, arguments: args, attempt: true})();
	},

	delay: function(delay, bind, args){
		return this.create({bind: bind, arguments: args, delay: delay})();
	},

	periodical: function(periodical, bind, args){
		return this.create({bind: bind, arguments: args, periodical: periodical})();
	}

});
/*
Script: Number.js
	Contains Number Prototypes like limit, round, times, and ceil.

License:
	MIT-style license.
*/

Number.implement({

	limit: function(min, max){
		return Math.min(max, Math.max(min, this));
	},

	round: function(precision){
		precision = Math.pow(10, precision || 0);
		return Math.round(this * precision) / precision;
	},

	times: function(fn, bind){
		for (var i = 0; i < this; i++) fn.call(bind, i, this);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	}

});

Number.alias('times', 'each');

(function(math){
	var methods = {};
	math.each(function(name){
		if (!Number[name]) methods[name] = function(){
			return Math[name].apply(null, [this].concat($A(arguments)));
		};
	});
	Number.implement(methods);
})(['abs', 'acos', 'asin', 'atan', 'atan2', 'ceil', 'cos', 'exp', 'floor', 'log', 'max', 'min', 'pow', 'sin', 'sqrt', 'tan']);
/*
Script: String.js
	Contains String Prototypes like camelCase, capitalize, test, and toInt.

License:
	MIT-style license.
*/

String.implement({

	test: function(regex, params){
		return ((typeof regex == 'string') ? new RegExp(regex, params) : regex).test(this);
	},

	contains: function(string, separator){
		return (separator) ? (separator + this + separator).indexOf(separator + string + separator) > -1 : this.indexOf(string) > -1;
	},

	trim: function(){
		return this.replace(/^\s+|\s+$/g, '');
	},

	clean: function(){
		return this.replace(/\s+/g, ' ').trim();
	},

	camelCase: function(){
		return this.replace(/-\D/g, function(match){
			return match.charAt(1).toUpperCase();
		});
	},

	hyphenate: function(){
		return this.replace(/[A-Z]/g, function(match){
			return ('-' + match.charAt(0).toLowerCase());
		});
	},

	capitalize: function(){
		return this.replace(/\b[a-z]/g, function(match){
			return match.toUpperCase();
		});
	},

	escapeRegExp: function(){
		return this.replace(/([-.*+?^${}()|[\]\/\\])/g, '\\$1');
	},

	toInt: function(base){
		return parseInt(this, base || 10);
	},

	toFloat: function(){
		return parseFloat(this);
	},

	hexToRgb: function(array){
		var hex = this.match(/^#?(\w{1,2})(\w{1,2})(\w{1,2})$/);
		return (hex) ? hex.slice(1).hexToRgb(array) : null;
	},

	rgbToHex: function(array){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHex(array) : null;
	},

	stripScripts: function(option){
		var scripts = '';
		var text = this.replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, function(){
			scripts += arguments[1] + '\n';
			return '';
		});
		if (option === true) $exec(scripts);
		else if ($type(option) == 'function') option(scripts, text);
		return text;
	},

	substitute: function(object, regexp){
		return this.replace(regexp || (/\\?\{([^{}]+)\}/g), function(match, name){
			if (match.charAt(0) == '\\') return match.slice(1);
			return (object[name] != undefined) ? object[name] : '';
		});
	}

});
/*
Script: Hash.js
	Contains Hash Prototypes. Provides a means for overcoming the JavaScript practical impossibility of extending native Objects.

License:
	MIT-style license.
*/

Hash.implement({

	has: Object.prototype.hasOwnProperty,

	keyOf: function(value){
		for (var key in this){
			if (this.hasOwnProperty(key) && this[key] === value) return key;
		}
		return null;
	},

	hasValue: function(value){
		return (Hash.keyOf(this, value) !== null);
	},

	extend: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.set(this, key, value);
		}, this);
		return this;
	},

	combine: function(properties){
		Hash.each(properties || {}, function(value, key){
			Hash.include(this, key, value);
		}, this);
		return this;
	},

	erase: function(key){
		if (this.hasOwnProperty(key)) delete this[key];
		return this;
	},

	get: function(key){
		return (this.hasOwnProperty(key)) ? this[key] : null;
	},

	set: function(key, value){
		if (!this[key] || this.hasOwnProperty(key)) this[key] = value;
		return this;
	},

	empty: function(){
		Hash.each(this, function(value, key){
			delete this[key];
		}, this);
		return this;
	},

	include: function(key, value){
		if (this[key] == undefined) this[key] = value;
		return this;
	},

	map: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			results.set(key, fn.call(bind, value, key, this));
		}, this);
		return results;
	},

	filter: function(fn, bind){
		var results = new Hash;
		Hash.each(this, function(value, key){
			if (fn.call(bind, value, key, this)) results.set(key, value);
		}, this);
		return results;
	},

	every: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && !fn.call(bind, this[key], key)) return false;
		}
		return true;
	},

	some: function(fn, bind){
		for (var key in this){
			if (this.hasOwnProperty(key) && fn.call(bind, this[key], key)) return true;
		}
		return false;
	},

	getKeys: function(){
		var keys = [];
		Hash.each(this, function(value, key){
			keys.push(key);
		});
		return keys;
	},

	getValues: function(){
		var values = [];
		Hash.each(this, function(value){
			values.push(value);
		});
		return values;
	},

	toQueryString: function(base){
		var queryString = [];
		Hash.each(this, function(value, key){
			if (base) key = base + '[' + key + ']';
			var result;
			switch ($type(value)){
				case 'object': result = Hash.toQueryString(value, key); break;
				case 'array':
					var qs = {};
					value.each(function(val, i){
						qs[i] = val;
					});
					result = Hash.toQueryString(qs, key);
				break;
				default: result = key + '=' + encodeURIComponent(value);
			}
			if (value != undefined) queryString.push(result);
		});

		return queryString.join('&');
	}

});

Hash.alias({keyOf: 'indexOf', hasValue: 'contains'});
/*
Script: Event.js
	Contains the Event Native, to make the event object completely crossbrowser.

License:
	MIT-style license.
*/

var Event = new Native({

	name: 'Event',

	initialize: function(event, win){
		win = win || window;
		var doc = win.document;
		event = event || win.event;
		if (event.$extended) return event;
		this.$extended = true;
		var type = event.type;
		var target = event.target || event.srcElement;
		while (target && target.nodeType == 3) target = target.parentNode;

		if (type.test(/key/)){
			var code = event.which || event.keyCode;
			var key = Event.Keys.keyOf(code);
			if (type == 'keydown'){
				var fKey = code - 111;
				if (fKey > 0 && fKey < 13) key = 'f' + fKey;
			}
			key = key || String.fromCharCode(code).toLowerCase();
		} else if (type.match(/(click|mouse|menu)/i)){
			doc = (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
			var page = {
				x: event.pageX || event.clientX + doc.scrollLeft,
				y: event.pageY || event.clientY + doc.scrollTop
			};
			var client = {
				x: (event.pageX) ? event.pageX - win.pageXOffset : event.clientX,
				y: (event.pageY) ? event.pageY - win.pageYOffset : event.clientY
			};
			if (type.match(/DOMMouseScroll|mousewheel/)){
				var wheel = (event.wheelDelta) ? event.wheelDelta / 120 : -(event.detail || 0) / 3;
			}
			var rightClick = (event.which == 3) || (event.button == 2);
			var related = null;
			if (type.match(/over|out/)){
				switch (type){
					case 'mouseover': related = event.relatedTarget || event.fromElement; break;
					case 'mouseout': related = event.relatedTarget || event.toElement;
				}
				if (!(function(){
					while (related && related.nodeType == 3) related = related.parentNode;
					return true;
				}).create({attempt: Browser.Engine.gecko})()) related = false;
			}
		}

		return $extend(this, {
			event: event,
			type: type,

			page: page,
			client: client,
			rightClick: rightClick,

			wheel: wheel,

			relatedTarget: related,
			target: target,

			code: code,
			key: key,

			shift: event.shiftKey,
			control: event.ctrlKey,
			alt: event.altKey,
			meta: event.metaKey
		});
	}

});

Event.Keys = new Hash({
	'enter': 13,
	'up': 38,
	'down': 40,
	'left': 37,
	'right': 39,
	'esc': 27,
	'space': 32,
	'backspace': 8,
	'tab': 9,
	'delete': 46
});

Event.implement({

	stop: function(){
		return this.stopPropagation().preventDefault();
	},

	stopPropagation: function(){
		if (this.event.stopPropagation) this.event.stopPropagation();
		else this.event.cancelBubble = true;
		return this;
	},

	preventDefault: function(){
		if (this.event.preventDefault) this.event.preventDefault();
		else this.event.returnValue = false;
		return this;
	}

});
/*
Script: Class.js
	Contains the Class Function for easily creating, extending, and implementing reusable Classes.

License:
	MIT-style license.
*/

function Class(params){
	
	if (params instanceof Function) params = {initialize: params};
	
	var newClass = function(){
		Object.reset(this);
		if (newClass._prototyping) return this;
		this._current = $empty;
		var value = (this.initialize) ? this.initialize.apply(this, arguments) : this;
		delete this._current; delete this.caller;
		return value;
	}.extend(this);
	
	newClass.implement(params);
	
	newClass.constructor = Class;
	newClass.prototype.constructor = newClass;

	return newClass;

};

Function.prototype.protect = function(){
	this._protected = true;
	return this;
};

Object.reset = function(object, key){
		
	if (key == null){
		for (var p in object) Object.reset(object, p);
		return object;
	}
	
	delete object[key];
	
	switch ($type(object[key])){
		case 'object':
			var F = function(){};
			F.prototype = object[key];
			var i = new F;
			object[key] = Object.reset(i);
		break;
		case 'array': object[key] = $unlink(object[key]); break;
	}
	
	return object;
	
};

new Native({name: 'Class', initialize: Class}).extend({

	instantiate: function(F){
		F._prototyping = true;
		var proto = new F;
		delete F._prototyping;
		return proto;
	},
	
	wrap: function(self, key, method){
		if (method._origin) method = method._origin;
		
		return function(){
			if (method._protected && this._current == null) throw new Error('The method "' + key + '" cannot be called.');
			var caller = this.caller, current = this._current;
			this.caller = current; this._current = arguments.callee;
			var result = method.apply(this, arguments);
			this._current = current; this.caller = caller;
			return result;
		}.extend({_owner: self, _origin: method, _name: key});

	}
	
});

Class.implement({
	
	implement: function(key, value){
		
		if ($type(key) == 'object'){
			for (var p in key) this.implement(p, key[p]);
			return this;
		}
		
		var mutator = Class.Mutators[key];
		
		if (mutator){
			value = mutator.call(this, value);
			if (value == null) return this;
		}
		
		var proto = this.prototype;

		switch ($type(value)){
			
			case 'function':
				if (value._hidden) return this;
				proto[key] = Class.wrap(this, key, value);
			break;
			
			case 'object':
				var previous = proto[key];
				if ($type(previous) == 'object') $mixin(previous, value);
				else proto[key] = $unlink(value);
			break;
			
			case 'array':
				proto[key] = $unlink(value);
			break;
			
			default: proto[key] = value;

		}
		
		return this;

	}
	
});

Class.Mutators = {
	
	Extends: function(parent){

		this.parent = parent;
		this.prototype = Class.instantiate(parent);

		this.implement('parent', function(){
			var name = this.caller._name, previous = this.caller._owner.parent.prototype[name];
			if (!previous) throw new Error('The method "' + name + '" has no parent.');
			return previous.apply(this, arguments);
		}.protect());

	},

	Implements: function(items){
		$splat(items).each(function(item){
			if (item instanceof Function) item = Class.instantiate(item);
			this.implement(item);
		}, this);

	}
	
};
/*
Script: Class.Extras.js
	Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

License:
	MIT-style license.
*/

var Chain = new Class({

	$chain: [],

	chain: function(){
		this.$chain.extend(Array.flatten(arguments));
		return this;
	},

	callChain: function(){
		return (this.$chain.length) ? this.$chain.shift().apply(this, arguments) : false;
	},

	clearChain: function(){
		this.$chain.empty();
		return this;
	}

});

var Events = new Class({

	$events: {},

	addEvent: function(type, fn, internal){
		type = Events.removeOn(type);
		if (fn != $empty){
			this.$events[type] = this.$events[type] || [];
			this.$events[type].include(fn);
			if (internal) fn.internal = true;
		}
		return this;
	},

	addEvents: function(events){
		for (var type in events) this.addEvent(type, events[type]);
		return this;
	},

	fireEvent: function(type, args, delay){
		type = Events.removeOn(type);
		if (!this.$events || !this.$events[type]) return this;
		this.$events[type].each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},

	removeEvent: function(type, fn){
		type = Events.removeOn(type);
		if (!this.$events[type]) return this;
		if (!fn.internal) this.$events[type].erase(fn);
		return this;
	},

	removeEvents: function(events){
		var type;
		if ($type(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		if (events) events = Events.removeOn(events);
		for (type in this.$events){
			if (events && events != type) continue;
			var fns = this.$events[type];
			for (var i = fns.length; i--; i) this.removeEvent(type, fns[i]);
		}
		return this;
	}

});

Events.removeOn = function(string){
	return string.replace(/^on([A-Z])/, function(full, first) {
		return first.toLowerCase();
	});
};

var Options = new Class({

	setOptions: function(){
		this.options = $merge.run([this.options].extend(arguments));
		if (!this.addEvent) return this;
		for (var option in this.options){
			if ($type(this.options[option]) != 'function' || !(/^on[A-Z]/).test(option)) continue;
			this.addEvent(option, this.options[option]);
			delete this.options[option];
		}
		return this;
	}

});
/*
Script: Element.js
	One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser,
	time-saver methods to let you easily work with HTML Elements.

License:
	MIT-style license.
*/

var Element = new Native({

	name: 'Element',

	legacy: window.Element,

	initialize: function(tag, props){
		var konstructor = Element.Constructors.get(tag);
		if (konstructor) return konstructor(props);
		if (typeof tag == 'string') return document.newElement(tag, props);
		return document.id(tag).set(props);
	},

	afterImplement: function(key, value){
		Element.Prototype[key] = value;
		if (Array[key]) return;
		Elements.implement(key, function(){
			var items = [], elements = true;
			for (var i = 0, j = this.length; i < j; i++){
				var returns = this[i][key].apply(this[i], arguments);
				items.push(returns);
				if (elements) elements = ($type(returns) == 'element');
			}
			return (elements) ? new Elements(items) : items;
		});
	}

});

Element.Prototype = {$family: {name: 'element'}};

Element.Constructors = new Hash;

var IFrame = new Native({

	name: 'IFrame',

	generics: false,

	initialize: function(){
		var params = Array.link(arguments, {properties: Object.type, iframe: $defined});
		var props = params.properties || {};
		var iframe = document.id(params.iframe);
		var onload = props.onload || $empty;
		delete props.onload;
		props.id = props.name = $pick(props.id, props.name, iframe ? (iframe.id || iframe.name) : 'IFrame_' + $time());
		iframe = new Element(iframe || 'iframe', props);
		var onFrameLoad = function(){
			var host = $try(function(){
				return iframe.contentWindow.location.host;
			});
			if (!host || host == window.location.host){
				var win = new Window(iframe.contentWindow);
				new Document(iframe.contentWindow.document);
				$extend(win.Element.prototype, Element.Prototype);
			}
			onload.call(iframe.contentWindow, iframe.contentWindow.document);
		};
		var contentWindow = $try(function(){
			return iframe.contentWindow;
		});
		((contentWindow && contentWindow.document.body) || window.frames[props.id]) ? onFrameLoad() : iframe.addListener('load', onFrameLoad);
		return iframe;
	}

});

var Elements = new Native({

	initialize: function(elements, options){
		options = $extend({ddup: true, cash: true}, options);
		elements = elements || [];
		if (options.ddup || options.cash){
			var uniques = {}, returned = [];
			for (var i = 0, l = elements.length; i < l; i++){
				var el = document.id(elements[i], !options.cash);
				if (options.ddup){
					if (uniques[el.uid]) continue;
					uniques[el.uid] = true;
				}
				returned.push(el);
			}
			elements = returned;
		}
		return (options.cash) ? $extend(elements, this) : elements;
	}

});

Elements.implement({

	filter: function(filter, bind){
		if (!filter) return this;
		return new Elements(Array.filter(this, (typeof filter == 'string') ? function(item){
			return item.match(filter);
		} : filter, bind));
	}

});

Document.implement({

	newElement: function(tag, props){
		if (Browser.Engine.trident && props){
			['name', 'type', 'checked'].each(function(attribute){
				if (!props[attribute]) return;
				tag += ' ' + attribute + '="' + props[attribute] + '"';
				if (attribute != 'checked') delete props[attribute];
			});
			tag = '<' + tag + '>';
		}
		return document.id(this.createElement(tag)).set(props);
	},

	newTextNode: function(text){
		return this.createTextNode(text);
	},

	getDocument: function(){
		return this;
	},

	getWindow: function(){
		return this.window;
	},
	
	id: (function(){
		
		var types = {

			string: function(id, nocash, doc){
				id = doc.getElementById(id);
				return (id) ? types.element(id, nocash) : null;
			},
			
			element: function(el, nocash){
				$uid(el);
				if (!nocash && !el.$family && !(/^object|embed$/i).test(el.tagName)){
					var proto = Element.Prototype;
					for (var p in proto) el[p] = proto[p];
				};
				return el;
			},
			
			object: function(obj, nocash, doc){
				if (obj.toElement) return types.element(obj.toElement(doc), nocash);
				return null;
			}
			
		};

		types.textnode = types.whitespace = types.window = types.document = $arguments(0);
		
		return function(el, nocash, doc){
			if (el && el.$family && el.uid) return el;
			var type = $type(el);
			return (types[type]) ? types[type](el, nocash, doc || document) : null;
		};

	})()

});

if (window.$ == null) Window.implement({
	$: function(el, nc){
		return document.id(el, nc, this.document);
	}
});

Window.implement({

	$$: function(selector){
		if (arguments.length == 1 && typeof selector == 'string') return this.document.getElements(selector);
		var elements = [];
		var args = Array.flatten(arguments);
		for (var i = 0, l = args.length; i < l; i++){
			var item = args[i];
			switch ($type(item)){
				case 'element': elements.push(item); break;
				case 'string': elements.extend(this.document.getElements(item, true));
			}
		}
		return new Elements(elements);
	},

	getDocument: function(){
		return this.document;
	},

	getWindow: function(){
		return this;
	}

});

Native.implement([Element, Document], {

	getElement: function(selector, nocash){
		return document.id(this.getElements(selector, true)[0] || null, nocash);
	},

	getElements: function(tags, nocash){
		tags = tags.split(',');
		var elements = [];
		var ddup = (tags.length > 1);
		tags.each(function(tag){
			var partial = this.getElementsByTagName(tag.trim());
			(ddup) ? elements.extend(partial) : elements = partial;
		}, this);
		return new Elements(elements, {ddup: ddup, cash: !nocash});
	}

});

(function(){

var collected = {}, storage = {};
var props = {input: 'checked', option: 'selected', textarea: (Browser.Engine.webkit && Browser.Engine.version < 420) ? 'innerHTML' : 'value'};

var get = function(uid){
	return (storage[uid] || (storage[uid] = {}));
};

var clean = function(item, retain){
	if (!item) return;
	var uid = item.uid;
	if (Browser.Engine.trident){
		if (item.clearAttributes){
			var clone = retain && item.cloneNode(false);
			item.clearAttributes();
			if (clone) item.mergeAttributes(clone);
		} else if (item.removeEvents){
			item.removeEvents();
		}
		if ((/object/i).test(item.tagName)){
			for (var p in item){
				if (typeof item[p] == 'function') item[p] = $empty;
			}
			Element.dispose(item);
		}
	}	
	if (!uid) return;
	collected[uid] = storage[uid] = null;
};

var purge = function(){
	Hash.each(collected, clean);
	if (Browser.Engine.trident) $A(document.getElementsByTagName('object')).each(clean);
	if (window.CollectGarbage) CollectGarbage();
	collected = storage = null;
};

var walk = function(element, walk, start, match, all, nocash){
	var el = element[start || walk];
	var elements = [];
	while (el){
		if (el.nodeType == 1 && (!match || Element.match(el, match))){
			if (!all) return document.id(el, nocash);
			elements.push(el);
		}
		el = el[walk];
	}
	return (all) ? new Elements(elements, {ddup: false, cash: !nocash}) : null;
};

var attributes = {
	'html': 'innerHTML',
	'class': 'className',
	'for': 'htmlFor',
	'defaultValue': 'defaultValue',
	'text': (Browser.Engine.trident || (Browser.Engine.webkit && Browser.Engine.version < 420)) ? 'innerText' : 'textContent'
};
var bools = ['compact', 'nowrap', 'ismap', 'declare', 'noshade', 'checked', 'disabled', 'readonly', 'multiple', 'selected', 'noresize', 'defer'];
var camels = ['value', 'type', 'defaultValue', 'accessKey', 'cellPadding', 'cellSpacing', 'colSpan', 'frameBorder', 'maxLength', 'readOnly', 'rowSpan', 'tabIndex', 'useMap'];

bools = bools.associate(bools);

Hash.extend(attributes, bools);
Hash.extend(attributes, camels.associate(camels.map(String.toLowerCase)));

var inserters = {

	before: function(context, element){
		if (element.parentNode) element.parentNode.insertBefore(context, element);
	},

	after: function(context, element){
		if (!element.parentNode) return;
		var next = element.nextSibling;
		(next) ? element.parentNode.insertBefore(context, next) : element.parentNode.appendChild(context);
	},

	bottom: function(context, element){
		element.appendChild(context);
	},

	top: function(context, element){
		var first = element.firstChild;
		(first) ? element.insertBefore(context, first) : element.appendChild(context);
	}

};

inserters.inside = inserters.bottom;

Hash.each(inserters, function(inserter, where){

	where = where.capitalize();

	Element.implement('inject' + where, function(el){
		inserter(this, document.id(el, true));
		return this;
	});

	Element.implement('grab' + where, function(el){
		inserter(document.id(el, true), this);
		return this;
	});

});

Element.implement({

	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				var property = Element.Properties.get(prop);
				(property && property.set) ? property.set.apply(this, Array.slice(arguments, 1)) : this.setProperty(prop, value);
		}
		return this;
	},

	get: function(prop){
		var property = Element.Properties.get(prop);
		return (property && property.get) ? property.get.apply(this, Array.slice(arguments, 1)) : this.getProperty(prop);
	},

	erase: function(prop){
		var property = Element.Properties.get(prop);
		(property && property.erase) ? property.erase.apply(this) : this.removeProperty(prop);
		return this;
	},

	setProperty: function(attribute, value){
		var key = attributes[attribute];
		if (value == undefined) return this.removeProperty(attribute);
		if (key && bools[attribute]) value = !!value;
		(key) ? this[key] = value : this.setAttribute(attribute, '' + value);
		return this;
	},

	setProperties: function(attributes){
		for (var attribute in attributes) this.setProperty(attribute, attributes[attribute]);
		return this;
	},

	getProperty: function(attribute){
		var key = attributes[attribute];
		var value = (key) ? this[key] : this.getAttribute(attribute, 2);
		return (bools[attribute]) ? !!value : (key) ? value : value || null;
	},

	getProperties: function(){
		var args = $A(arguments);
		return args.map(this.getProperty, this).associate(args);
	},

	removeProperty: function(attribute){
		var key = attributes[attribute];
		(key) ? this[key] = (key && bools[attribute]) ? false : '' : this.removeAttribute(attribute);
		return this;
	},

	removeProperties: function(){
		Array.each(arguments, this.removeProperty, this);
		return this;
	},

	hasClass: function(className){
		return this.className.contains(className, ' ');
	},

	addClass: function(className){
		if (!this.hasClass(className)) this.className = (this.className + ' ' + className).clean();
		return this;
	},

	removeClass: function(className){
		this.className = this.className.replace(new RegExp('(^|\\s)' + className + '(?:\\s|$)'), '$1');
		return this;
	},

	toggleClass: function(className){
		return this.hasClass(className) ? this.removeClass(className) : this.addClass(className);
	},

	adopt: function(){
		Array.flatten(arguments).each(function(element){
			element = document.id(element, true);
			if (element) this.appendChild(element);
		}, this);
		return this;
	},

	appendText: function(text, where){
		return this.grab(this.getDocument().newTextNode(text), where);
	},

	grab: function(el, where){
		inserters[where || 'bottom'](document.id(el, true), this);
		return this;
	},

	inject: function(el, where){
		inserters[where || 'bottom'](this, document.id(el, true));
		return this;
	},

	replaces: function(el){
		el = document.id(el, true);
		el.parentNode.replaceChild(this, el);
		return this;
	},

	wraps: function(el, where){
		el = document.id(el, true);
		return this.replaces(el).grab(el, where);
	},

	getPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, false, nocash);
	},

	getAllPrevious: function(match, nocash){
		return walk(this, 'previousSibling', null, match, true, nocash);
	},

	getNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, false, nocash);
	},

	getAllNext: function(match, nocash){
		return walk(this, 'nextSibling', null, match, true, nocash);
	},

	getFirst: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, false, nocash);
	},

	getLast: function(match, nocash){
		return walk(this, 'previousSibling', 'lastChild', match, false, nocash);
	},

	getParent: function(match, nocash){
		return walk(this, 'parentNode', null, match, false, nocash);
	},

	getParents: function(match, nocash){
		return walk(this, 'parentNode', null, match, true, nocash);
	},
	
	getSiblings: function(match, nocash) {
		return this.getParent().getChildren(match, nocash).erase(this);
	},

	getChildren: function(match, nocash){
		return walk(this, 'nextSibling', 'firstChild', match, true, nocash);
	},

	getWindow: function(){
		return this.ownerDocument.window;
	},

	getDocument: function(){
		return this.ownerDocument;
	},

	getElementById: function(id, nocash){
		var el = this.ownerDocument.getElementById(id);
		if (!el) return null;
		for (var parent = el.parentNode; parent != this; parent = parent.parentNode){
			if (!parent) return null;
		}
		return document.id(el, nocash);
	},

	getSelected: function(){
		return new Elements($A(this.options).filter(function(option){
			return option.selected;
		}));
	},

	getComputedStyle: function(property){
		if (this.currentStyle) return this.currentStyle[property.camelCase()];
		var computed = this.getDocument().defaultView.getComputedStyle(this, null);
		return (computed) ? computed.getPropertyValue([property.hyphenate()]) : null;
	},

	toQueryString: function(){
		var queryString = [];
		this.getElements('input, select, textarea', true).each(function(el){
			if (!el.name || el.disabled || el.type == 'submit' || el.type == 'reset' || el.type == 'file') return;
			var value = (el.tagName.toLowerCase() == 'select') ? Element.getSelected(el).map(function(opt){
				return opt.value;
			}) : ((el.type == 'radio' || el.type == 'checkbox') && !el.checked) ? null : el.value;
			$splat(value).each(function(val){
				if (typeof val != 'undefined') queryString.push(el.name + '=' + encodeURIComponent(val));
			});
		});
		return queryString.join('&');
	},

	clone: function(contents, keepid){
		contents = contents !== false;
		var clone = this.cloneNode(contents);
		var clean = function(node, element){
			if (!keepid) node.removeAttribute('id');
			if (Browser.Engine.trident){
				node.clearAttributes();
				node.mergeAttributes(element);
				node.removeAttribute('uid');
				if (node.options){
					var no = node.options, eo = element.options;
					for (var j = no.length; j--;) no[j].selected = eo[j].selected;
				}
			}
			var prop = props[element.tagName.toLowerCase()];
			if (prop && element[prop]) node[prop] = element[prop];
		};

		if (contents){
			var ce = clone.getElementsByTagName('*'), te = this.getElementsByTagName('*');
			for (var i = ce.length; i--;) clean(ce[i], te[i]);
		}

		clean(clone, this);
		return document.id(clone);
	},

	destroy: function(){
		Element.empty(this);
		Element.dispose(this);
		clean(this, true);
		return null;
	},

	empty: function(){
		$A(this.childNodes).each(function(node){
			Element.destroy(node);
		});
		return this;
	},

	dispose: function(){
		return (this.parentNode) ? this.parentNode.removeChild(this) : this;
	},

	hasChild: function(el){
		el = document.id(el, true);
		if (!el) return false;
		if (Browser.Engine.webkit && Browser.Engine.version < 420) return $A(this.getElementsByTagName(el.tagName)).contains(el);
		return (this.contains) ? (this != el && this.contains(el)) : !!(this.compareDocumentPosition(el) & 16);
	},

	match: function(tag){
		return (!tag || (tag == this) || (Element.get(this, 'tag') == tag));
	}

});

Native.implement([Element, Window, Document], {

	addListener: function(type, fn){
		if (type == 'unload'){
			var old = fn, self = this;
			fn = function(){
				self.removeListener('unload', fn);
				old();
			};
		} else {
			collected[this.uid] = this;
		}
		if (this.addEventListener) this.addEventListener(type, fn, false);
		else this.attachEvent('on' + type, fn);
		return this;
	},

	removeListener: function(type, fn){
		if (this.removeEventListener) this.removeEventListener(type, fn, false);
		else this.detachEvent('on' + type, fn);
		return this;
	},

	retrieve: function(property, dflt){
		var storage = get(this.uid), prop = storage[property];
		if (dflt != undefined && prop == undefined) prop = storage[property] = dflt;
		return $pick(prop);
	},

	store: function(property, value){
		var storage = get(this.uid);
		storage[property] = value;
		return this;
	},

	eliminate: function(property){
		var storage = get(this.uid);
		delete storage[property];
		return this;
	}

});

window.addListener('unload', purge);

})();

Element.Properties = new Hash;

Element.Properties.style = {

	set: function(style){
		this.style.cssText = style;
	},

	get: function(){
		return this.style.cssText;
	},

	erase: function(){
		this.style.cssText = '';
	}

};

Element.Properties.tag = {

	get: function(){
		return this.tagName.toLowerCase();
	}

};

Element.Properties.html = (function(){
	var wrapper = document.createElement('div');

	var translations = {
		table: [1, '<table>', '</table>'],
		select: [1, '<select>', '</select>'],
		tbody: [2, '<table><tbody>', '</tbody></table>'],
		tr: [3, '<table><tbody><tr>', '</tr></tbody></table>']
	};
	translations.thead = translations.tfoot = translations.tbody;

	var html = {
		set: function(){
			var html = Array.flatten(arguments).join('');
			var wrap = Browser.Engine.trident && translations[this.get('tag')];
			if (wrap){
				var first = wrapper;
				first.innerHTML = wrap[1] + html + wrap[2];
				for (var i = wrap[0]; i--;) first = first.firstChild;
				this.empty().adopt(first.childNodes);
			} else {
				this.innerHTML = html;
			}
		}
	};

	html.erase = html.set;

	return html;
})();

if (Browser.Engine.webkit && Browser.Engine.version < 420) Element.Properties.text = {
	get: function(){
		if (this.innerText) return this.innerText;
		var temp = this.ownerDocument.newElement('div', {html: this.innerHTML}).inject(this.ownerDocument.body);
		var text = temp.innerText;
		temp.destroy();
		return text;
	}
};
/*
Script: Element.Event.js
	Contains Element methods for dealing with events, and custom Events.

License:
	MIT-style license.
*/

Element.Properties.events = {set: function(events){
	this.addEvents(events);
}};

Native.implement([Element, Window, Document], {

	addEvent: function(type, fn){
		var events = this.retrieve('events', {});
		events[type] = events[type] || {'keys': [], 'values': []};
		if (events[type].keys.contains(fn)) return this;
		events[type].keys.push(fn);
		var realType = type, custom = Element.Events.get(type), condition = fn, self = this;
		if (custom){
			if (custom.onAdd) custom.onAdd.call(this, fn);
			if (custom.condition){
				condition = function(event){
					if (custom.condition.call(this, event)) return fn.call(this, event);
					return true;
				};
			}
			realType = custom.base || realType;
		}
		var defn = function(){
			return fn.call(self);
		};
		var nativeEvent = Element.NativeEvents[realType];
		if (nativeEvent){
			if (nativeEvent == 2){
				defn = function(event){
					event = new Event(event, self.getWindow());
					if (condition.call(self, event) === false) event.stop();
				};
			}
			this.addListener(realType, defn);
		}
		events[type].values.push(defn);
		return this;
	},

	removeEvent: function(type, fn){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		var pos = events[type].keys.indexOf(fn);
		if (pos == -1) return this;
		events[type].keys.splice(pos, 1);
		var value = events[type].values.splice(pos, 1)[0];
		var custom = Element.Events.get(type);
		if (custom){
			if (custom.onRemove) custom.onRemove.call(this, fn);
			type = custom.base || type;
		}
		return (Element.NativeEvents[type]) ? this.removeListener(type, value) : this;
	},

	addEvents: function(events){
		for (var event in events) this.addEvent(event, events[event]);
		return this;
	},

	removeEvents: function(events){
		var type;
		if ($type(events) == 'object'){
			for (type in events) this.removeEvent(type, events[type]);
			return this;
		}
		var attached = this.retrieve('events');
		if (!attached) return this;
		if (!events){
			for (type in attached) this.removeEvents(type);
			this.eliminate('events');
		} else if (attached[events]){
			while (attached[events].keys[0]) this.removeEvent(events, attached[events].keys[0]);
			attached[events] = null;
		}
		return this;
	},

	fireEvent: function(type, args, delay){
		var events = this.retrieve('events');
		if (!events || !events[type]) return this;
		events[type].keys.each(function(fn){
			fn.create({'bind': this, 'delay': delay, 'arguments': args})();
		}, this);
		return this;
	},

	cloneEvents: function(from, type){
		from = document.id(from);
		var fevents = from.retrieve('events');
		if (!fevents) return this;
		if (!type){
			for (var evType in fevents) this.cloneEvents(from, evType);
		} else if (fevents[type]){
			fevents[type].keys.each(function(fn){
				this.addEvent(type, fn);
			}, this);
		}
		return this;
	}

});

Element.NativeEvents = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, //form elements
	load: 1, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	error: 1, abort: 1, scroll: 1 //misc
};

(function(){

var $check = function(event){
	var related = event.relatedTarget;
	if (related == undefined) return true;
	if (related === false) return false;
	return ($type(this) != 'document' && related != this && related.prefix != 'xul' && !this.hasChild(related));
};

Element.Events = new Hash({

	mouseenter: {
		base: 'mouseover',
		condition: $check
	},

	mouseleave: {
		base: 'mouseout',
		condition: $check
	},

	mousewheel: {
		base: (Browser.Engine.gecko) ? 'DOMMouseScroll' : 'mousewheel'
	}

});

})();
/*
Script: Element.Style.js
	Contains methods for interacting with the styles of Elements in a fashionable way.

License:
	MIT-style license.
*/

Element.Properties.styles = {set: function(styles){
	this.setStyles(styles);
}};

Element.Properties.opacity = {

	set: function(opacity, novisibility){
		if (!novisibility){
			if (opacity == 0){
				if (this.style.visibility != 'hidden') this.style.visibility = 'hidden';
			} else {
				if (this.style.visibility != 'visible') this.style.visibility = 'visible';
			}
		}
		if (!this.currentStyle || !this.currentStyle.hasLayout) this.style.zoom = 1;
		if (Browser.Engine.trident) this.style.filter = (opacity == 1) ? '' : 'alpha(opacity=' + opacity * 100 + ')';
		this.style.opacity = opacity;
		this.store('opacity', opacity);
	},

	get: function(){
		return this.retrieve('opacity', 1);
	}

};

Element.implement({

	setOpacity: function(value){
		return this.set('opacity', value, true);
	},

	getOpacity: function(){
		return this.get('opacity');
	},

	setStyle: function(property, value){
		switch (property){
			case 'opacity': return this.set('opacity', parseFloat(value));
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		if ($type(value) != 'string'){
			var map = (Element.Styles.get(property) || '@').split(' ');
			value = $splat(value).map(function(val, i){
				if (!map[i]) return '';
				return ($type(val) == 'number') ? map[i].replace('@', Math.round(val)) : val;
			}).join(' ');
		} else if (value == String(Number(value))){
			value = Math.round(value);
		}
		this.style[property] = value;
		return this;
	},

	getStyle: function(property){
		switch (property){
			case 'opacity': return this.get('opacity');
			case 'float': property = (Browser.Engine.trident) ? 'styleFloat' : 'cssFloat';
		}
		property = property.camelCase();
		var result = this.style[property];
		if (!$chk(result)){
			result = [];
			for (var style in Element.ShortStyles){
				if (property != style) continue;
				for (var s in Element.ShortStyles[style]) result.push(this.getStyle(s));
				return result.join(' ');
			}
			result = this.getComputedStyle(property);
		}
		if (result){
			result = String(result);
			var color = result.match(/rgba?\([\d\s,]+\)/);
			if (color) result = result.replace(color[0], color[0].rgbToHex());
		}
		if (Browser.Engine.presto || (Browser.Engine.trident && !$chk(parseInt(result, 10)))){
			if (property.test(/^(height|width)$/)){
				var values = (property == 'width') ? ['left', 'right'] : ['top', 'bottom'], size = 0;
				values.each(function(value){
					size += this.getStyle('border-' + value + '-width').toInt() + this.getStyle('padding-' + value).toInt();
				}, this);
				return this['offset' + property.capitalize()] - size + 'px';
			}
			if ((Browser.Engine.presto) && String(result).test('px')) return result;
			if (property.test(/(border(.+)Width|margin|padding)/)) return '0px';
		}
		return result;
	},

	setStyles: function(styles){
		for (var style in styles) this.setStyle(style, styles[style]);
		return this;
	},

	getStyles: function(){
		var result = {};
		Array.flatten(arguments).each(function(key){
			result[key] = this.getStyle(key);
		}, this);
		return result;
	}

});

Element.Styles = new Hash({
	left: '@px', top: '@px', bottom: '@px', right: '@px',
	width: '@px', height: '@px', maxWidth: '@px', maxHeight: '@px', minWidth: '@px', minHeight: '@px',
	backgroundColor: 'rgb(@, @, @)', backgroundPosition: '@px @px', color: 'rgb(@, @, @)',
	fontSize: '@px', letterSpacing: '@px', lineHeight: '@px', clip: 'rect(@px @px @px @px)',
	margin: '@px @px @px @px', padding: '@px @px @px @px', border: '@px @ rgb(@, @, @) @px @ rgb(@, @, @) @px @ rgb(@, @, @)',
	borderWidth: '@px @px @px @px', borderStyle: '@ @ @ @', borderColor: 'rgb(@, @, @) rgb(@, @, @) rgb(@, @, @) rgb(@, @, @)',
	zIndex: '@', 'zoom': '@', fontWeight: '@', textIndent: '@px', opacity: '@'
});

Element.ShortStyles = {margin: {}, padding: {}, border: {}, borderWidth: {}, borderStyle: {}, borderColor: {}};

['Top', 'Right', 'Bottom', 'Left'].each(function(direction){
	var Short = Element.ShortStyles;
	var All = Element.Styles;
	['margin', 'padding'].each(function(style){
		var sd = style + direction;
		Short[style][sd] = All[sd] = '@px';
	});
	var bd = 'border' + direction;
	Short.border[bd] = All[bd] = '@px @ rgb(@, @, @)';
	var bdw = bd + 'Width', bds = bd + 'Style', bdc = bd + 'Color';
	Short[bd] = {};
	Short.borderWidth[bdw] = Short[bd][bdw] = All[bdw] = '@px';
	Short.borderStyle[bds] = Short[bd][bds] = All[bds] = '@';
	Short.borderColor[bdc] = Short[bd][bdc] = All[bdc] = 'rgb(@, @, @)';
});
/*
Script: Element.Dimensions.js
	Contains methods to work with size, scroll, or positioning of Elements and the window object.

License:
	MIT-style license.

Credits:
	- Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
	- Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).
*/

(function(){

Element.implement({

	scrollTo: function(x, y){
		if (isBody(this)){
			this.getWindow().scrollTo(x, y);
		} else {
			this.scrollLeft = x;
			this.scrollTop = y;
		}
		return this;
	},

	getSize: function(){
		if (isBody(this)) return this.getWindow().getSize();
		return {x: this.offsetWidth, y: this.offsetHeight};
	},

	getScrollSize: function(){
		if (isBody(this)) return this.getWindow().getScrollSize();
		return {x: this.scrollWidth, y: this.scrollHeight};
	},

	getScroll: function(){
		if (isBody(this)) return this.getWindow().getScroll();
		return {x: this.scrollLeft, y: this.scrollTop};
	},

	getScrolls: function(){
		var element = this, position = {x: 0, y: 0};
		while (element && !isBody(element)){
			position.x += element.scrollLeft;
			position.y += element.scrollTop;
			element = element.parentNode;
		}
		return position;
	},

	getOffsetParent: function(){
		var element = this;
		if (isBody(element)) return null;
		if (!Browser.Engine.trident) return element.offsetParent;
		while ((element = element.parentNode) && !isBody(element)){
			if (styleString(element, 'position') != 'static') return element;
		}
		return null;
	},

	getOffsets: function(){		
		if (this.getBoundingClientRect){
			var bound = this.getBoundingClientRect(),
			html = document.id(this.getDocument().documentElement),
			scroll = html.getScroll(),
			isFixed = (styleString(this, 'position') == 'fixed');
			return {
				x: parseInt(bound.left, 10) + ((isFixed) ? 0 : scroll.x) - html.clientLeft,
				y: parseInt(bound.top, 10) +  ((isFixed) ? 0 : scroll.y) - html.clientTop
			};
		}

		var element = this, position = {x: 0, y: 0};
		if (isBody(this)) return position;

		while (element && !isBody(element)){
			position.x += element.offsetLeft;
			position.y += element.offsetTop;

			if (Browser.Engine.gecko){
				if (!borderBox(element)){
					position.x += leftBorder(element);
					position.y += topBorder(element);
				}
				var parent = element.parentNode;
				if (parent && styleString(parent, 'overflow') != 'visible'){
					position.x += leftBorder(parent);
					position.y += topBorder(parent);
				}
			} else if (element != this && Browser.Engine.webkit){
				position.x += leftBorder(element);
				position.y += topBorder(element);
			}

			element = element.offsetParent;
		}
		if (Browser.Engine.gecko && !borderBox(this)){
			position.x -= leftBorder(this);
			position.y -= topBorder(this);
		}
		return position;
	},

	getPosition: function(relative){
		if (isBody(this)) return {x: 0, y: 0};
		var offset = this.getOffsets(), scroll = this.getScrolls();
		var position = {x: offset.x - scroll.x, y: offset.y - scroll.y};
		var relativePosition = (relative && (relative = document.id(relative))) ? relative.getPosition() : {x: 0, y: 0};
		return {x: position.x - relativePosition.x, y: position.y - relativePosition.y};
	},

	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element), size = this.getSize();
		var obj = {left: position.x, top: position.y, width: size.x, height: size.y};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},

	computePosition: function(obj){
		return {left: obj.x - styleNumber(this, 'margin-left'), top: obj.y - styleNumber(this, 'margin-top')};
	},

	setPosition: function(obj){
		return this.setStyles(this.computePosition(obj));
	}

});


Native.implement([Document, Window], {

	getSize: function(){
		if (Browser.Engine.presto || Browser.Engine.webkit) {
			var win = this.getWindow();
			return {x: win.innerWidth, y: win.innerHeight};
		}
		var doc = getCompatElement(this);
		return {x: doc.clientWidth, y: doc.clientHeight};
	},

	getScroll: function(){
		var win = this.getWindow(), doc = getCompatElement(this);
		return {x: win.pageXOffset || doc.scrollLeft, y: win.pageYOffset || doc.scrollTop};
	},

	getScrollSize: function(){
		var doc = getCompatElement(this), min = this.getSize();
		return {x: Math.max(doc.scrollWidth, min.x), y: Math.max(doc.scrollHeight, min.y)};
	},

	getPosition: function(){
		return {x: 0, y: 0};
	},

	getCoordinates: function(){
		var size = this.getSize();
		return {top: 0, left: 0, bottom: size.y, right: size.x, height: size.y, width: size.x};
	}

});

// private methods

var styleString = Element.getComputedStyle;

function styleNumber(element, style){
	return styleString(element, style).toInt() || 0;
};

function borderBox(element){
	return styleString(element, '-moz-box-sizing') == 'border-box';
};

function topBorder(element){
	return styleNumber(element, 'border-top-width');
};

function leftBorder(element){
	return styleNumber(element, 'border-left-width');
};

function isBody(element){
	return (/^(?:body|html)$/i).test(element.tagName);
};

function getCompatElement(element){
	var doc = element.getDocument();
	return (!doc.compatMode || doc.compatMode == 'CSS1Compat') ? doc.html : doc.body;
};

})();

//aliases
Element.alias('setPosition', 'position'); //compatability

Native.implement([Window, Document, Element], {

	getHeight: function(){
		return this.getSize().y;
	},

	getWidth: function(){
		return this.getSize().x;
	},

	getScrollTop: function(){
		return this.getScroll().y;
	},

	getScrollLeft: function(){
		return this.getScroll().x;
	},

	getScrollHeight: function(){
		return this.getScrollSize().y;
	},

	getScrollWidth: function(){
		return this.getScrollSize().x;
	},

	getTop: function(){
		return this.getPosition().y;
	},

	getLeft: function(){
		return this.getPosition().x;
	}

});
/*
Script: Selectors.js
	Adds advanced CSS Querying capabilities for targeting elements. Also includes pseudoselectors support.

License:
	MIT-style license.
*/

Native.implement([Document, Element], {

	getElements: function(expression, nocash){
		expression = expression.split(',');
		var items, local = {};
		for (var i = 0, l = expression.length; i < l; i++){
			var selector = expression[i], elements = Selectors.Utils.search(this, selector, local);
			if (i != 0 && elements.item) elements = $A(elements);
			items = (i == 0) ? elements : (items.item) ? $A(items).concat(elements) : items.concat(elements);
		}
		return new Elements(items, {ddup: (expression.length > 1), cash: !nocash});
	}

});

Element.implement({

	match: function(selector){
		if (!selector || (selector == this)) return true;
		var tagid = Selectors.Utils.parseTagAndID(selector);
		var tag = tagid[0], id = tagid[1];
		if (!Selectors.Filters.byID(this, id) || !Selectors.Filters.byTag(this, tag)) return false;
		var parsed = Selectors.Utils.parseSelector(selector);
		return (parsed) ? Selectors.Utils.filter(this, parsed, {}) : true;
	}

});

var Selectors = {Cache: {nth: {}, parsed: {}}};

Selectors.RegExps = {
	id: (/#([\w-]+)/),
	tag: (/^(\w+|\*)/),
	quick: (/^(\w+|\*)$/),
	splitter: (/\s*([+>~\s])\s*([a-zA-Z#.*:\[])/g),
	combined: (/\.([\w-]+)|\[(\w+)(?:([!*^$~|]?=)(["']?)([^\4]*?)\4)?\]|:([\w-]+)(?:\(["']?(.*?)?["']?\)|$)/g)
};

Selectors.Utils = {

	chk: function(item, uniques){
		if (!uniques) return true;
		var uid = $uid(item);
		if (!uniques[uid]) return uniques[uid] = true;
		return false;
	},

	parseNthArgument: function(argument){
		if (Selectors.Cache.nth[argument]) return Selectors.Cache.nth[argument];
		var parsed = argument.match(/^([+-]?\d*)?([a-z]+)?([+-]?\d*)?$/);
		if (!parsed) return false;
		var inta = parseInt(parsed[1], 10);
		var a = (inta || inta === 0) ? inta : 1;
		var special = parsed[2] || false;
		var b = parseInt(parsed[3], 10) || 0;
		if (a != 0){
			b--;
			while (b < 1) b += a;
			while (b >= a) b -= a;
		} else {
			a = b;
			special = 'index';
		}
		switch (special){
			case 'n': parsed = {a: a, b: b, special: 'n'}; break;
			case 'odd': parsed = {a: 2, b: 0, special: 'n'}; break;
			case 'even': parsed = {a: 2, b: 1, special: 'n'}; break;
			case 'first': parsed = {a: 0, special: 'index'}; break;
			case 'last': parsed = {special: 'last-child'}; break;
			case 'only': parsed = {special: 'only-child'}; break;
			default: parsed = {a: (a - 1), special: 'index'};
		}

		return Selectors.Cache.nth[argument] = parsed;
	},

	parseSelector: function(selector){
		if (Selectors.Cache.parsed[selector]) return Selectors.Cache.parsed[selector];
		var m, parsed = {classes: [], pseudos: [], attributes: []};
		while ((m = Selectors.RegExps.combined.exec(selector))){
			var cn = m[1], an = m[2], ao = m[3], av = m[5], pn = m[6], pa = m[7];
			if (cn){
				parsed.classes.push(cn);
			} else if (pn){
				var parser = Selectors.Pseudo.get(pn);
				if (parser) parsed.pseudos.push({parser: parser, argument: pa});
				else parsed.attributes.push({name: pn, operator: '=', value: pa});
			} else if (an){
				parsed.attributes.push({name: an, operator: ao, value: av});
			}
		}
		if (!parsed.classes.length) delete parsed.classes;
		if (!parsed.attributes.length) delete parsed.attributes;
		if (!parsed.pseudos.length) delete parsed.pseudos;
		if (!parsed.classes && !parsed.attributes && !parsed.pseudos) parsed = null;
		return Selectors.Cache.parsed[selector] = parsed;
	},

	parseTagAndID: function(selector){
		var tag = selector.match(Selectors.RegExps.tag);
		var id = selector.match(Selectors.RegExps.id);
		return [(tag) ? tag[1] : '*', (id) ? id[1] : false];
	},

	filter: function(item, parsed, local){
		var i;
		if (parsed.classes){
			for (i = parsed.classes.length; i--; i){
				var cn = parsed.classes[i];
				if (!Selectors.Filters.byClass(item, cn)) return false;
			}
		}
		if (parsed.attributes){
			for (i = parsed.attributes.length; i--; i){
				var att = parsed.attributes[i];
				if (!Selectors.Filters.byAttribute(item, att.name, att.operator, att.value)) return false;
			}
		}
		if (parsed.pseudos){
			for (i = parsed.pseudos.length; i--; i){
				var psd = parsed.pseudos[i];
				if (!Selectors.Filters.byPseudo(item, psd.parser, psd.argument, local)) return false;
			}
		}
		return true;
	},

	getByTagAndID: function(ctx, tag, id){
		if (id){
			var item = (ctx.getElementById) ? ctx.getElementById(id, true) : Element.getElementById(ctx, id, true);
			return (item && Selectors.Filters.byTag(item, tag)) ? [item] : [];
		} else {
			return ctx.getElementsByTagName(tag);
		}
	},

	search: function(self, expression, local){
		var splitters = [];

		var selectors = expression.trim().replace(Selectors.RegExps.splitter, function(m0, m1, m2){
			splitters.push(m1);
			return ':)' + m2;
		}).split(':)');

		var items, filtered, item;

		for (var i = 0, l = selectors.length; i < l; i++){

			var selector = selectors[i];

			if (i == 0 && Selectors.RegExps.quick.test(selector)){
				items = self.getElementsByTagName(selector);
				continue;
			}

			var splitter = splitters[i - 1];

			var tagid = Selectors.Utils.parseTagAndID(selector);
			var tag = tagid[0], id = tagid[1];

			if (i == 0){
				items = Selectors.Utils.getByTagAndID(self, tag, id);
			} else {
				var uniques = {}, found = [];
				for (var j = 0, k = items.length; j < k; j++) found = Selectors.Getters[splitter](found, items[j], tag, id, uniques);
				items = found;
			}

			var parsed = Selectors.Utils.parseSelector(selector);

			if (parsed){
				filtered = [];
				for (var m = 0, n = items.length; m < n; m++){
					item = items[m];
					if (Selectors.Utils.filter(item, parsed, local)) filtered.push(item);
				}
				items = filtered;
			}

		}

		return items;

	}

};

Selectors.Getters = {

	' ': function(found, self, tag, id, uniques){
		var items = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = items.length; i < l; i++){
			var item = items[i];
			if (Selectors.Utils.chk(item, uniques)) found.push(item);
		}
		return found;
	},

	'>': function(found, self, tag, id, uniques){
		var children = Selectors.Utils.getByTagAndID(self, tag, id);
		for (var i = 0, l = children.length; i < l; i++){
			var child = children[i];
			if (child.parentNode == self && Selectors.Utils.chk(child, uniques)) found.push(child);
		}
		return found;
	},

	'+': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (Selectors.Utils.chk(self, uniques) && Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
				break;
			}
		}
		return found;
	},

	'~': function(found, self, tag, id, uniques){
		while ((self = self.nextSibling)){
			if (self.nodeType == 1){
				if (!Selectors.Utils.chk(self, uniques)) break;
				if (Selectors.Filters.byTag(self, tag) && Selectors.Filters.byID(self, id)) found.push(self);
			}
		}
		return found;
	}

};

Selectors.Filters = {

	byTag: function(self, tag){
		return (tag == '*' || (self.tagName && self.tagName.toLowerCase() == tag));
	},

	byID: function(self, id){
		return (!id || (self.id && self.id == id));
	},

	byClass: function(self, klass){
		return (self.className && self.className.contains(klass, ' '));
	},

	byPseudo: function(self, parser, argument, local){
		return parser.call(self, argument, local);
	},

	byAttribute: function(self, name, operator, value){
		var result = Element.prototype.getProperty.call(self, name);
		if (!result) return (operator == '!=');
		if (!operator || value == undefined) return true;
		switch (operator){
			case '=': return (result == value);
			case '*=': return (result.contains(value));
			case '^=': return (result.substr(0, value.length) == value);
			case '$=': return (result.substr(result.length - value.length) == value);
			case '!=': return (result != value);
			case '~=': return result.contains(value, ' ');
			case '|=': return result.contains(value, '-');
		}
		return false;
	}

};

Selectors.Pseudo = new Hash({

	// w3c pseudo selectors

	checked: function(){
		return this.checked;
	},
	
	empty: function(){
		return !(this.innerText || this.textContent || '').length;
	},

	not: function(selector){
		return !Element.match(this, selector);
	},

	contains: function(text){
		return (this.innerText || this.textContent || '').contains(text);
	},

	'first-child': function(){
		return Selectors.Pseudo.index.call(this, 0);
	},

	'last-child': function(){
		var element = this;
		while ((element = element.nextSibling)){
			if (element.nodeType == 1) return false;
		}
		return true;
	},

	'only-child': function(){
		var prev = this;
		while ((prev = prev.previousSibling)){
			if (prev.nodeType == 1) return false;
		}
		var next = this;
		while ((next = next.nextSibling)){
			if (next.nodeType == 1) return false;
		}
		return true;
	},

	'nth-child': function(argument, local){
		argument = (argument == undefined) ? 'n' : argument;
		var parsed = Selectors.Utils.parseNthArgument(argument);
		if (parsed.special != 'n') return Selectors.Pseudo[parsed.special].call(this, parsed.a, local);
		var count = 0;
		local.positions = local.positions || {};
		var uid = $uid(this);
		if (!local.positions[uid]){
			var self = this;
			while ((self = self.previousSibling)){
				if (self.nodeType != 1) continue;
				count ++;
				var position = local.positions[$uid(self)];
				if (position != undefined){
					count = position + count;
					break;
				}
			}
			local.positions[uid] = count;
		}
		return (local.positions[uid] % parsed.a == parsed.b);
	},

	// custom pseudo selectors

	index: function(index){
		var element = this, count = 0;
		while ((element = element.previousSibling)){
			if (element.nodeType == 1 && ++count > index) return false;
		}
		return (count == index);
	},

	even: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n+1', local);
	},

	odd: function(argument, local){
		return Selectors.Pseudo['nth-child'].call(this, '2n', local);
	},
	
	selected: function(){
		return this.selected;
	},
	
	enabled: function(){
		return (this.disabled === false);
	}

});
/*
Script: Domready.js
	Contains the domready custom event.

License:
	MIT-style license.
*/

Element.Events.domready = {

	onAdd: function(fn){
		if (Browser.loaded) fn.call(this);
	}

};

(function(){

	var domready = function(){
		if (Browser.loaded) return;
		Browser.loaded = true;
		window.fireEvent('domready');
		document.fireEvent('domready');
	};

	if (Browser.Engine.trident){
		var temp = document.createElement('div');
		(function(){
			($try(function(){
				temp.doScroll(); // Technique by Diego Perini
				return document.id(temp).inject(document.body).set('html', 'temp').dispose();
			})) ? domready() : arguments.callee.delay(50);
		})();
	} else if (Browser.Engine.webkit && Browser.Engine.version < 525){
		(function(){
			(['loaded', 'complete'].contains(document.readyState)) ? domready() : arguments.callee.delay(50);
		})();
	} else {
		window.addEvent('load', domready);
		document.addEvent('DOMContentLoaded', domready);
	}

})();
/*
Script: JSON.js
	JSON encoder and decoder.

License:
	MIT-style license.

See Also:
	<http://www.json.org/>
*/

var JSON = new Hash({

	$specialChars: {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'},

	$replaceChars: function(chr){
		return JSON.$specialChars[chr] || '\\u00' + Math.floor(chr.charCodeAt() / 16).toString(16) + (chr.charCodeAt() % 16).toString(16);
	},

	encode: function(obj){
		switch ($type(obj)){
			case 'string':
				return '"' + obj.replace(/[\x00-\x1f\\"]/g, JSON.$replaceChars) + '"';
			case 'array':
				return '[' + String(obj.map(JSON.encode).clean()) + ']';
			case 'object': case 'hash':
				var string = [];
				Hash.each(obj, function(value, key){
					var json = JSON.encode(value);
					if (json) string.push(JSON.encode(key) + ':' + json);
				});
				return '{' + string + '}';
			case 'number': case 'boolean': return String(obj);
			case false: return 'null';
		}
		return null;
	},

	decode: function(string, secure){
		if ($type(string) != 'string' || !string.length) return null;
		if (secure && !(/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(string.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, ''))) return null;
		return eval('(' + string + ')');
	}

});

Native.implement([Hash, Array, String, Number], {

	toJSON: function(){
		return JSON.encode(this);
	}

});
/*
Script: Cookie.js
	Class for creating, loading, and saving browser Cookies.

License:
	MIT-style license.

Credits:
	Based on the functions by Peter-Paul Koch (http://quirksmode.org).
*/

var Cookie = new Class({

	Implements: Options,

	options: {
		path: false,
		domain: false,
		duration: false,
		secure: false,
		document: document
	},

	initialize: function(key, options){
		this.key = key;
		this.setOptions(options);
	},

	write: function(value){
		value = encodeURIComponent(value);
		if (this.options.domain) value += '; domain=' + this.options.domain;
		if (this.options.path) value += '; path=' + this.options.path;
		if (this.options.duration){
			var date = new Date();
			date.setTime(date.getTime() + this.options.duration * 24 * 60 * 60 * 1000);
			value += '; expires=' + date.toGMTString();
		}
		if (this.options.secure) value += '; secure';
		this.options.document.cookie = this.key + '=' + value;
		return this;
	},

	read: function(){
		var value = this.options.document.cookie.match('(?:^|;)\\s*' + this.key.escapeRegExp() + '=([^;]*)');
		return (value) ? decodeURIComponent(value[1]) : null;
	},

	dispose: function(){
		new Cookie(this.key, $merge(this.options, {duration: -1})).write('');
		return this;
	}

});

Cookie.write = function(key, value, options){
	return new Cookie(key, options).write(value);
};

Cookie.read = function(key){
	return new Cookie(key).read();
};

Cookie.dispose = function(key, options){
	return new Cookie(key, options).dispose();
};
/*
Script: Swiff.js
	Wrapper for embedding SWF movies. Supports (and fixes) External Interface Communication.

License:
	MIT-style license.

Credits:
	Flash detection & Internet Explorer + Flash Player 9 fix inspired by SWFObject.
*/

var Swiff = new Class({

	Implements: [Options],

	options: {
		id: null,
		height: 1,
		width: 1,
		container: null,
		properties: {},
		params: {
			quality: 'high',
			allowScriptAccess: 'always',
			wMode: 'transparent',
			swLiveConnect: true
		},
		callBacks: {},
		vars: {}
	},

	toElement: function(){
		return this.object;
	},

	initialize: function(path, options){
		this.instance = 'Swiff_' + $time();

		this.setOptions(options);
		options = this.options;
		var id = this.id = options.id || this.instance;
		var container = document.id(options.container);

		Swiff.CallBacks[this.instance] = {};

		var params = options.params, vars = options.vars, callBacks = options.callBacks;
		var properties = $extend({height: options.height, width: options.width}, options.properties);

		var self = this;

		for (var callBack in callBacks){
			Swiff.CallBacks[this.instance][callBack] = (function(option){
				return function(){
					return option.apply(self.object, arguments);
				};
			})(callBacks[callBack]);
			vars[callBack] = 'Swiff.CallBacks.' + this.instance + '.' + callBack;
		}

		params.flashVars = Hash.toQueryString(vars);
		if (Browser.Engine.trident){
			properties.classid = 'clsid:D27CDB6E-AE6D-11cf-96B8-444553540000';
			params.movie = path;
		} else {
			properties.type = 'application/x-shockwave-flash';
			properties.data = path;
		}
		var build = '<object id="' + id + '"';
		for (var property in properties) build += ' ' + property + '="' + properties[property] + '"';
		build += '>';
		for (var param in params){
			if (params[param]) build += '<param name="' + param + '" value="' + params[param] + '" />';
		}
		build += '</object>';
		this.object = ((container) ? container.empty() : new Element('div')).set('html', build).firstChild;
	},

	replaces: function(element){
		element = document.id(element, true);
		element.parentNode.replaceChild(this.toElement(), element);
		return this;
	},

	inject: function(element){
		document.id(element, true).appendChild(this.toElement());
		return this;
	},

	remote: function(){
		return Swiff.remote.apply(Swiff, [this.toElement()].extend(arguments));
	}

});

Swiff.CallBacks = {};

Swiff.remote = function(obj, fn){
	var rs = obj.CallFunction('<invoke name="' + fn + '" returntype="javascript">' + __flash__argumentsToXML(arguments, 2) + '</invoke>');
	return eval(rs);
};
/*
Script: Fx.js
	Contains the basic animation logic to be extended by all other Fx Classes.

License:
	MIT-style license.
*/

var Fx = new Class({

	Implements: [Chain, Events, Options],

	options: {
		/*
		onStart: $empty,
		onCancel: $empty,
		onComplete: $empty,
		*/
		fps: 50,
		unit: false,
		duration: 500,
		link: 'ignore'
	},

	initialize: function(options){
		this.subject = this.subject || this;
		this.setOptions(options);
		this.options.duration = Fx.Durations[this.options.duration] || this.options.duration.toInt();
		var wait = this.options.wait;
		if (wait === false) this.options.link = 'cancel';
	},

	getTransition: function(){
		return function(p){
			return -(Math.cos(Math.PI * p) - 1) / 2;
		};
	},

	step: function(){
		var time = $time();
		if (time < this.time + this.options.duration){
			var delta = this.transition((time - this.time) / this.options.duration);
			this.set(this.compute(this.from, this.to, delta));
		} else {
			this.set(this.compute(this.from, this.to, 1));
			this.complete();
		}
	},

	set: function(now){
		return now;
	},

	compute: function(from, to, delta){
		return Fx.compute(from, to, delta);
	},

	check: function(){
		if (!this.timer) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	start: function(from, to){
		if (!this.check(from, to)) return this;
		this.from = from;
		this.to = to;
		this.time = 0;
		this.transition = this.getTransition();
		this.startTimer();
		this.onStart();
		return this;
	},

	complete: function(){
		if (this.stopTimer()) this.onComplete();
		return this;
	},

	cancel: function(){
		if (this.stopTimer()) this.onCancel();
		return this;
	},

	onStart: function(){
		this.fireEvent('start', this.subject);
	},

	onComplete: function(){
		this.fireEvent('complete', this.subject);
		if (!this.callChain()) this.fireEvent('chainComplete', this.subject);
	},

	onCancel: function(){
		this.fireEvent('cancel', this.subject).clearChain();
	},

	pause: function(){
		this.stopTimer();
		return this;
	},

	resume: function(){
		this.startTimer();
		return this;
	},

	stopTimer: function(){
		if (!this.timer) return false;
		this.time = $time() - this.time;
		this.timer = $clear(this.timer);
		return true;
	},

	startTimer: function(){
		if (this.timer) return false;
		this.time = $time() - this.time;
		this.timer = this.step.periodical(Math.round(1000 / this.options.fps), this);
		return true;
	}

});

Fx.compute = function(from, to, delta){
	return (to - from) * delta + from;
};

Fx.Durations = {'short': 250, 'normal': 500, 'long': 1000};
/*
Script: Fx.CSS.js
	Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

License:
	MIT-style license.
*/

Fx.CSS = new Class({

	Extends: Fx,

	//prepares the base from/to object

	prepare: function(element, property, values){
		values = $splat(values);
		var values1 = values[1];
		if (!$chk(values1)){
			values[1] = values[0];
			values[0] = element.getStyle(property);
		}
		var parsed = values.map(this.parse);
		return {from: parsed[0], to: parsed[1]};
	},

	//parses a value into an array

	parse: function(value){
		value = $lambda(value)();
		value = (typeof value == 'string') ? value.split(' ') : $splat(value);
		return value.map(function(val){
			val = String(val);
			var found = false;
			Fx.CSS.Parsers.each(function(parser, key){
				if (found) return;
				var parsed = parser.parse(val);
				if ($chk(parsed)) found = {value: parsed, parser: parser};
			});
			found = found || {value: val, parser: Fx.CSS.Parsers.String};
			return found;
		});
	},

	//computes by a from and to prepared objects, using their parsers.

	compute: function(from, to, delta){
		var computed = [];
		(Math.min(from.length, to.length)).times(function(i){
			computed.push({value: from[i].parser.compute(from[i].value, to[i].value, delta), parser: from[i].parser});
		});
		computed.$family = {name: 'fx:css:value'};
		return computed;
	},

	//serves the value as settable

	serve: function(value, unit){
		if ($type(value) != 'fx:css:value') value = this.parse(value);
		var returned = [];
		value.each(function(bit){
			returned = returned.concat(bit.parser.serve(bit.value, unit));
		});
		return returned;
	},

	//renders the change to an element

	render: function(element, property, value, unit){
		element.setStyle(property, this.serve(value, unit));
	},

	//searches inside the page css to find the values for a selector

	search: function(selector){
		if (Fx.CSS.Cache[selector]) return Fx.CSS.Cache[selector];
		var to = {};
		Array.each(document.styleSheets, function(sheet, j){
			var href = sheet.href;
			if (href && href.contains('://') && !href.contains(document.domain)) return;
			var rules = sheet.rules || sheet.cssRules;
			Array.each(rules, function(rule, i){
				if (!rule.style) return;
				var selectorText = (rule.selectorText) ? rule.selectorText.replace(/^\w+/, function(m){
					return m.toLowerCase();
				}) : null;
				if (!selectorText || !selectorText.test('^' + selector + '$')) return;
				Element.Styles.each(function(value, style){
					if (!rule.style[style] || Element.ShortStyles[style]) return;
					value = String(rule.style[style]);
					to[style] = (value.test(/^rgb/)) ? value.rgbToHex() : value;
				});
			});
		});
		return Fx.CSS.Cache[selector] = to;
	}

});

Fx.CSS.Cache = {};

Fx.CSS.Parsers = new Hash({

	Color: {
		parse: function(value){
			if (value.match(/^#[0-9a-f]{3,6}$/i)) return value.hexToRgb(true);
			return ((value = value.match(/(\d+),\s*(\d+),\s*(\d+)/))) ? [value[1], value[2], value[3]] : false;
		},
		compute: function(from, to, delta){
			return from.map(function(value, i){
				return Math.round(Fx.compute(from[i], to[i], delta));
			});
		},
		serve: function(value){
			return value.map(Number);
		}
	},

	Number: {
		parse: parseFloat,
		compute: Fx.compute,
		serve: function(value, unit){
			return (unit) ? value + unit : value;
		}
	},

	String: {
		parse: $lambda(false),
		compute: $arguments(1),
		serve: $arguments(0)
	}

});
/*
Script: Fx.Tween.js
	Formerly Fx.Style, effect to transition any CSS property for an element.

License:
	MIT-style license.
*/

Fx.Tween = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(property, now){
		if (arguments.length == 1){
			now = property;
			property = this.property || this.options.property;
		}
		this.render(this.element, property, now, this.options.unit);
		return this;
	},

	start: function(property, from, to){
		if (!this.check(property, from, to)) return this;
		var args = Array.flatten(arguments);
		this.property = this.options.property || args.shift();
		var parsed = this.prepare(this.element, this.property, args);
		return this.parent(parsed.from, parsed.to);
	}

});

Element.Properties.tween = {

	set: function(options){
		var tween = this.retrieve('tween');
		if (tween) tween.cancel();
		return this.eliminate('tween').store('tween:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('tween')){
			if (options || !this.retrieve('tween:options')) this.set('tween', options);
			this.store('tween', new Fx.Tween(this, this.retrieve('tween:options')));
		}
		return this.retrieve('tween');
	}

};

Element.implement({

	tween: function(property, from, to){
		this.get('tween').start(arguments);
		return this;
	},

	fade: function(how){
		var fade = this.get('tween'), o = 'opacity', toggle;
		how = $pick(how, 'toggle');
		switch (how){
			case 'in': fade.start(o, 1); break;
			case 'out': fade.start(o, 0); break;
			case 'show': fade.set(o, 1); break;
			case 'hide': fade.set(o, 0); break;
			case 'toggle':
				var flag = this.retrieve('fade:flag', this.get('opacity') == 1);
				fade.start(o, (flag) ? 0 : 1);
				this.store('fade:flag', !flag);
				toggle = true;
			break;
			default: fade.start(o, arguments);
		}
		if (!toggle) this.eliminate('fade:flag');
		return this;
	},

	highlight: function(start, end){
		if (!end){
			end = this.retrieve('highlight:original', this.getStyle('background-color'));
			end = (end == 'transparent') ? '#fff' : end;
		}
		var tween = this.get('tween');
		tween.start('background-color', start || '#ffff88', end).chain(function(){
			this.setStyle('background-color', this.retrieve('highlight:original'));
			tween.callChain();
		}.bind(this));
		return this;
	}

});
/*
Script: Fx.Morph.js
	Formerly Fx.Styles, effect to transition any number of CSS properties for an element using an object of rules, or CSS based selector rules.

License:
	MIT-style license.
*/

Fx.Morph = new Class({

	Extends: Fx.CSS,

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
	},

	set: function(now){
		if (typeof now == 'string') now = this.search(now);
		for (var p in now) this.render(this.element, p, now[p], this.options.unit);
		return this;
	},

	compute: function(from, to, delta){
		var now = {};
		for (var p in from) now[p] = this.parent(from[p], to[p], delta);
		return now;
	},

	start: function(properties){
		if (!this.check(properties)) return this;
		if (typeof properties == 'string') properties = this.search(properties);
		var from = {}, to = {};
		for (var p in properties){
			var parsed = this.prepare(this.element, p, properties[p]);
			from[p] = parsed.from;
			to[p] = parsed.to;
		}
		return this.parent(from, to);
	}

});

Element.Properties.morph = {

	set: function(options){
		var morph = this.retrieve('morph');
		if (morph) morph.cancel();
		return this.eliminate('morph').store('morph:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('morph')){
			if (options || !this.retrieve('morph:options')) this.set('morph', options);
			this.store('morph', new Fx.Morph(this, this.retrieve('morph:options')));
		}
		return this.retrieve('morph');
	}

};

Element.implement({

	morph: function(props){
		this.get('morph').start(props);
		return this;
	}

});
/*
Script: Fx.Transitions.js
	Contains a set of advanced transitions to be used with any of the Fx Classes.

License:
	MIT-style license.

Credits:
	Easing Equations by Robert Penner, <http://www.robertpenner.com/easing/>, modified and optimized to be used with MooTools.
*/

Fx.implement({

	getTransition: function(){
		var trans = this.options.transition || Fx.Transitions.Sine.easeInOut;
		if (typeof trans == 'string'){
			var data = trans.split(':');
			trans = Fx.Transitions;
			trans = trans[data[0]] || trans[data[0].capitalize()];
			if (data[1]) trans = trans['ease' + data[1].capitalize() + (data[2] ? data[2].capitalize() : '')];
		}
		return trans;
	}

});

Fx.Transition = function(transition, params){
	params = $splat(params);
	return $extend(transition, {
		easeIn: function(pos){
			return transition(pos, params);
		},
		easeOut: function(pos){
			return 1 - transition(1 - pos, params);
		},
		easeInOut: function(pos){
			return (pos <= 0.5) ? transition(2 * pos, params) / 2 : (2 - transition(2 * (1 - pos), params)) / 2;
		}
	});
};

Fx.Transitions = new Hash({

	linear: $arguments(0)

});

Fx.Transitions.extend = function(transitions){
	for (var transition in transitions) Fx.Transitions[transition] = new Fx.Transition(transitions[transition]);
};

Fx.Transitions.extend({

	Pow: function(p, x){
		return Math.pow(p, x[0] || 6);
	},

	Expo: function(p){
		return Math.pow(2, 8 * (p - 1));
	},

	Circ: function(p){
		return 1 - Math.sin(Math.acos(p));
	},

	Sine: function(p){
		return 1 - Math.sin((1 - p) * Math.PI / 2);
	},

	Back: function(p, x){
		x = x[0] || 1.618;
		return Math.pow(p, 2) * ((x + 1) * p - x);
	},

	Bounce: function(p){
		var value;
		for (var a = 0, b = 1; 1; a += b, b /= 2){
			if (p >= (7 - 4 * a) / 11){
				value = b * b - Math.pow((11 - 6 * a - 11 * p) / 4, 2);
				break;
			}
		}
		return value;
	},

	Elastic: function(p, x){
		return Math.pow(2, 10 * --p) * Math.cos(20 * p * Math.PI * (x[0] || 1) / 3);
	}

});

['Quad', 'Cubic', 'Quart', 'Quint'].each(function(transition, i){
	Fx.Transitions[transition] = new Fx.Transition(function(p){
		return Math.pow(p, [i + 2]);
	});
});
/*
Script: Request.js
	Powerful all purpose Request Class. Uses XMLHTTPRequest.

License:
	MIT-style license.
*/

var Request = new Class({

	Implements: [Chain, Events, Options],

	options: {/*
		onRequest: $empty,
		onComplete: $empty,
		onCancel: $empty,
		onSuccess: $empty,
		onFailure: $empty,
		onException: $empty,*/
		url: '',
		data: '',
		headers: {
			'X-Requested-With': 'XMLHttpRequest',
			'Accept': 'text/javascript, text/html, application/xml, text/xml, */*'
		},
		async: true,
		format: false,
		method: 'post',
		link: 'ignore',
		isSuccess: null,
		emulation: true,
		urlEncoded: true,
		encoding: 'utf-8',
		evalScripts: false,
		evalResponse: false,
		noCache: false
	},

	initialize: function(options){
		this.xhr = new Browser.Request();
		this.setOptions(options);
		this.options.isSuccess = this.options.isSuccess || this.isSuccess;
		this.headers = new Hash(this.options.headers);
	},

	onStateChange: function(){
		if (this.xhr.readyState != 4 || !this.running) return;
		this.running = false;
		this.status = 0;
		$try(function(){
			this.status = this.xhr.status;
		}.bind(this));
		this.xhr.onreadystatechange = $empty;
		if (this.options.isSuccess.call(this, this.status)){
			this.response = {text: this.xhr.responseText, xml: this.xhr.responseXML};
			this.success(this.response.text, this.response.xml);
		} else {
			this.response = {text: null, xml: null};
			this.failure();
		}
	},

	isSuccess: function(){
		return ((this.status >= 200) && (this.status < 300));
	},

	processScripts: function(text){
		if (this.options.evalResponse || (/(ecma|java)script/).test(this.getHeader('Content-type'))) return $exec(text);
		return text.stripScripts(this.options.evalScripts);
	},

	success: function(text, xml){
		this.onSuccess(this.processScripts(text), xml);
	},

	onSuccess: function(){
		this.fireEvent('complete', arguments).fireEvent('success', arguments).callChain();
	},

	failure: function(){
		this.onFailure();
	},

	onFailure: function(){
		this.fireEvent('complete').fireEvent('failure', this.xhr);
	},

	setHeader: function(name, value){
		this.headers.set(name, value);
		return this;
	},

	getHeader: function(name){
		return $try(function(){
			return this.xhr.getResponseHeader(name);
		}.bind(this));
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	send: function(options){
		if (!this.check(options)) return this;
		this.running = true;

		var type = $type(options);
		if (type == 'string' || type == 'element') options = {data: options};

		var old = this.options;
		options = $extend({data: old.data, url: old.url, method: old.method}, options);
		var data = options.data, url = options.url, method = options.method.toLowerCase();

		switch ($type(data)){
			case 'element': data = document.id(data).toQueryString(); break;
			case 'object': case 'hash': data = Hash.toQueryString(data);
		}

		if (this.options.format){
			var format = 'format=' + this.options.format;
			data = (data) ? format + '&' + data : format;
		}

		if (this.options.emulation && !['get', 'post'].contains(method)){
			var _method = '_method=' + method;
			data = (data) ? _method + '&' + data : _method;
			method = 'post';
		}

		if (this.options.urlEncoded && method == 'post'){
			var encoding = (this.options.encoding) ? '; charset=' + this.options.encoding : '';
			this.headers.set('Content-type', 'application/x-www-form-urlencoded' + encoding);
		}

		if (this.options.noCache){
			var noCache = 'noCache=' + new Date().getTime();
			data = (data) ? noCache + '&' + data : noCache;
		}

		var trimPosition = url.lastIndexOf('/');
		if (trimPosition > -1 && (trimPosition = url.indexOf('#')) > -1) url = url.substr(0, trimPosition);

		if (data && method == 'get'){
			url = url + (url.contains('?') ? '&' : '?') + data;
			data = null;
		}

		this.xhr.open(method.toUpperCase(), url, this.options.async);

		this.xhr.onreadystatechange = this.onStateChange.bind(this);

		this.headers.each(function(value, key){
			try {
				this.xhr.setRequestHeader(key, value);
			} catch (e){
				this.fireEvent('exception', [key, value]);
			}
		}, this);

		this.fireEvent('request');
		this.xhr.send(data);
		if (!this.options.async) this.onStateChange();
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.xhr.abort();
		this.xhr.onreadystatechange = $empty;
		this.xhr = new Browser.Request();
		this.fireEvent('cancel');
		return this;
	}

});

(function(){

var methods = {};
['get', 'post', 'put', 'delete', 'GET', 'POST', 'PUT', 'DELETE'].each(function(method){
	methods[method] = function(){
		var params = Array.link(arguments, {url: String.type, data: $defined});
		return this.send($extend(params, {method: method}));
	};
});

Request.implement(methods);

})();

Element.Properties.send = {

	set: function(options){
		var send = this.retrieve('send');
		if (send) send.cancel();
		return this.eliminate('send').store('send:options', $extend({
			data: this, link: 'cancel', method: this.get('method') || 'post', url: this.get('action')
		}, options));
	},

	get: function(options){
		if (options || !this.retrieve('send')){
			if (options || !this.retrieve('send:options')) this.set('send', options);
			this.store('send', new Request(this.retrieve('send:options')));
		}
		return this.retrieve('send');
	}

};

Element.implement({

	send: function(url){
		var sender = this.get('send');
		sender.send({data: this, url: url || sender.options.url});
		return this;
	}

});
/*
Script: Request.HTML.js
	Extends the basic Request Class with additional methods for interacting with HTML responses.

License:
	MIT-style license.
*/

Request.HTML = new Class({

	Extends: Request,

	options: {
		update: false,
		append: false,
		evalScripts: true,
		filter: false
	},

	processHTML: function(text){
		var match = text.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
		text = (match) ? match[1] : text;

		var container = new Element('div');

		return $try(function(){
			var root = '<root>' + text + '</root>', doc;
			if (Browser.Engine.trident){
				doc = new ActiveXObject('Microsoft.XMLDOM');
				doc.async = false;
				doc.loadXML(root);
			} else {
				doc = new DOMParser().parseFromString(root, 'text/xml');
			}
			root = doc.getElementsByTagName('root')[0];
			if (!root) return null;
			for (var i = 0, k = root.childNodes.length; i < k; i++){
				var child = Element.clone(root.childNodes[i], true, true);
				if (child) container.grab(child);
			}
			return container;
		}) || container.set('html', text);
	},

	success: function(text){
		var options = this.options, response = this.response;

		response.html = text.stripScripts(function(script){
			response.javascript = script;
		});

		var temp = this.processHTML(response.html);

		response.tree = temp.childNodes;
		response.elements = temp.getElements('*');

		if (options.filter) response.tree = response.elements.filter(options.filter);
		if (options.update) document.id(options.update).empty().set('html', response.html);
		else if (options.append) document.id(options.append).adopt(temp.getChildren());
		if (options.evalScripts) $exec(response.javascript);

		this.onSuccess(response.tree, response.elements, response.html, response.javascript);
	}

});

Element.Properties.load = {

	set: function(options){
		var load = this.retrieve('load');
		if (load) load.cancel();
		return this.eliminate('load').store('load:options', $extend({data: this, link: 'cancel', update: this, method: 'get'}, options));
	},

	get: function(options){
		if (options || ! this.retrieve('load')){
			if (options || !this.retrieve('load:options')) this.set('load', options);
			this.store('load', new Request.HTML(this.retrieve('load:options')));
		}
		return this.retrieve('load');
	}

};

Element.implement({

	load: function(){
		this.get('load').send(Array.link(arguments, {data: Object.type, url: String.type}));
		return this;
	}

});
/*
Script: Request.JSON.js
	Extends the basic Request Class with additional methods for sending and receiving JSON data.

License:
	MIT-style license.
*/

Request.JSON = new Class({

	Extends: Request,

	options: {
		secure: true
	},

	initialize: function(options){
		this.parent(options);
		this.headers.extend({'Accept': 'application/json', 'X-Request': 'JSON'});
	},

	success: function(text){
		this.response.json = JSON.decode(text, this.options.secure);
		this.onSuccess(this.response.json, text);
	}

});
MooTools.More = {
	'version': '1.2.3.1'
};/*
Script: MooTools.Lang.js
	Provides methods for localization.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

(function(){

	var data = {
		language: 'en-US',
		languages: {
			'en-US': {}
		},
		cascades: ['en-US']
	};
	
	var cascaded;

	MooTools.lang = new Events();

	$extend(MooTools.lang, {

		setLanguage: function(lang){
			if (!data.languages[lang]) return this;
			data.language = lang;
			this.load();
			this.fireEvent('langChange', lang);
			return this;
		},

		load: function() {
			var langs = this.cascade(this.getCurrentLanguage());
			cascaded = {};
			$each(langs, function(set, setName){
				cascaded[setName] = this.lambda(set);
			}, this);
		},

		getCurrentLanguage: function(){
			return data.language;
		},

		addLanguage: function(lang){
			data.languages[lang] = data.languages[lang] || {};
			return this;
		},

		cascade: function(lang){
			var cascades = (data.languages[lang] || {}).cascades || [];
			cascades.combine(data.cascades);
			cascades.erase(lang).push(lang);
			var langs = cascades.map(function(lng){
				return data.languages[lng];
			}, this);
			return $merge.apply(this, langs);
		},

		lambda: function(set) {
			(set || {}).get = function(key, args){
				return $lambda(set[key]).apply(this, $splat(args));
			};
			return set;
		},

		get: function(set, key, args){
			if (cascaded && cascaded[set]) return (key ? cascaded[set].get(key, args) : cascaded[set]);
		},

		set: function(lang, set, members){
			this.addLanguage(lang);
			langData = data.languages[lang];
			if (!langData[set]) langData[set] = {};
			$extend(langData[set], members);
			if (lang == this.getCurrentLanguage()){
				this.load();
				this.fireEvent('langChange', lang);
			}
			return this;
		},

		list: function(){
			return Hash.getKeys(data.languages);
		}

	});

})();/*
Script: Log.js
	Provides basic logging functionality for plugins to implement.

	License:
		MIT-style license.

	Authors:
		Guillermo Rauch
*/

var Log = new Class({
	
	log: function(){
		Log.logger.call(this, arguments);
	}
	
});

Log.logged = [];

Log.logger = function(){
	if(window.console && console.log) console.log.apply(console, arguments);
	else Log.logged.push(arguments);
};/*
Script: Class.Refactor.js
	Extends a class onto itself with new property, preserving any items attached to the class's namespace.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

Class.refactor = function(original, refactors){

	$each(refactors, function(item, name){
		var origin = original.prototype[name];
		if (origin && (origin = origin._origin) && typeof item == 'function') original.implement(name, function(){
			var old = this.previous;
			this.previous = origin;
			var value = item.apply(this, arguments);
			this.previous = old;
			return value;
		}); else original.implement(name, item);
	});

	return original;

};/*
Script: Class.Binds.js
	Automagically binds specified methods in a class to the instance of the class.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

Class.Mutators.Binds = function(binds){
    return binds;
};

Class.Mutators.initialize = function(initialize){
	return function(){
		$splat(this.Binds).each(function(name){
			var original = this[name];
			if (original) this[name] = original.bind(this);
		}, this);
		return initialize.apply(this, arguments);
	};
};/*
Script: Class.Occlude.js
	Prevents a class from being applied to a DOM element twice.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

Class.Occlude = new Class({

	occlude: function(property, element){
		element = document.id(element || this.element);
		var instance = element.retrieve(property || this.property);
		if (instance && !$defined(this.occluded)){
			this.occluded = instance;
		} else {
			this.occluded = false;
			element.store(property || this.property, this);
		}
		return this.occluded;
	}

});/*
Script: Chain.Wait.js
	Adds a method to inject pauses between chained events.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

(function(){

	var wait = {
		wait: function(duration){
			return this.chain(function(){
				this.callChain.delay($pick(duration, 500), this);
			}.bind(this));
		}
	};

	Chain.implement(wait);

	if (window.Fx){
		Fx.implement(wait);
		['Css', 'Tween', 'Elements'].each(function(cls){
			if (Fx[cls]) Fx[cls].implement(wait);
		});
	}

	try {
		Element.implement({
			chains: function(effects){
				$splat($pick(effects, ['tween', 'morph', 'reveal'])).each(function(effect){
					effect = this.get(effect);
					if (!effect) return;
					effect.setOptions({
						link:'chain'
					});
				}, this);
				return this;
			},
			pauseFx: function(duration, effect){
				this.chains(effect).get($pick(effect, 'tween')).wait(duration);
				return this;
			}
		});
	} catch(e){}

})();/*
Script: Array.Extras.js
	Extends the Array native object to include useful methods to work with arrays.

	License:
		MIT-style license.

	Authors:
		Christoph Pojer

*/
Array.implement({

	min: function(){
		return Math.min.apply(null, this);
	},

	max: function(){
		return Math.max.apply(null, this);
	},

	average: function(){
		return this.length ? this.sum() / this.length : 0;
	},

	sum: function(){
		var result = 0, l = this.length;
		if (l){
			do {
				result += this[--l];
			} while (l);
		}
		return result;
	},

	unique: function(){
		return [].combine(this);
	}

});/*
Script: Date.English.US.js
	Date messages for US English.

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

MooTools.lang.set('en-US', 'Date', {

	months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
	days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
	//culture's date order: MM/DD/YYYY
	dateOrder: ['month', 'date', 'year'],
	shortDate: '%m/%d/%Y',
	shortTime: '%I:%M%p',
	AM: 'AM',
	PM: 'PM',

	/* Date.Extras */
	ordinal: function(dayOfMonth){
		//1st, 2nd, 3rd, etc.
		return (dayOfMonth > 3 && dayOfMonth < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(dayOfMonth % 10, 4)];
	},

	lessThanMinuteAgo: 'less than a minute ago',
	minuteAgo: 'about a minute ago',
	minutesAgo: '{delta} minutes ago',
	hourAgo: 'about an hour ago',
	hoursAgo: 'about {delta} hours ago',
	dayAgo: '1 day ago',
	daysAgo: '{delta} days ago',
	lessThanMinuteUntil: 'less than a minute from now',
	minuteUntil: 'about a minute from now',
	minutesUntil: '{delta} minutes from now',
	hourUntil: 'about an hour from now',
	hoursUntil: 'about {delta} hours from now',
	dayUntil: '1 day from now',
	daysUntil: '{delta} days from now'

});/*
Script: Date.js
	Extends the Date native object to include methods useful in managing dates.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
		Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
		Harald Kirshner - mail [at] digitarald.de; http://digitarald.de
		Scott Kyle - scott [at] appden.com; http://appden.com

*/

(function(){

if (!Date.now) Date.now = $time;

Date.Methods = {};

['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'LastDayOfMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'Ordinal', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds'].each(function(method){
	Date.Methods[method.toLowerCase()] = method;
});

$each({
	ms: 'Milliseconds',
	year: 'FullYear',
	min: 'Minutes',
	mo: 'Month',
	sec: 'Seconds',
	hr: 'Hours'
}, function(value, key){
	Date.Methods[key] = value;
});

var zeroize = function(what, length){
	return new Array(length - what.toString().length + 1).join('0') + what;
};

Date.implement({

	set: function(prop, value){
		switch ($type(prop)){
			case 'object':
				for (var p in prop) this.set(p, prop[p]);
				break;
			case 'string':
				prop = prop.toLowerCase();
				var m = Date.Methods;
				if (m[prop]) this['set' + m[prop]](value);
		}
		return this;
	},

	get: function(prop){
		prop = prop.toLowerCase();
		var m = Date.Methods;
		if (m[prop]) return this['get' + m[prop]]();
		return null;
	},

	clone: function(){
		return new Date(this.get('time'));
	},

	increment: function(interval, times){
		interval = interval || 'day';
		times = $pick(times, 1);

		switch (interval){
			case 'year':
				return this.increment('month', times * 12);
			case 'month':
				var d = this.get('date');
				this.set('date', 1).set('mo', this.get('mo') + times);
				return this.set('date', d.min(this.get('lastdayofmonth')));
			case 'week':
				return this.increment('day', times * 7);
			case 'day':
				return this.set('date', this.get('date') + times);
		}

		if (!Date.units[interval]) throw new Error(interval + ' is not a supported interval');

		return this.set('time', this.get('time') + times * Date.units[interval]());
	},

	decrement: function(interval, times){
		return this.increment(interval, -1 * $pick(times, 1));
	},

	isLeapYear: function(){
		return Date.isLeapYear(this.get('year'));
	},

	clearTime: function(){
		return this.set({hr: 0, min: 0, sec: 0, ms: 0});
	},

	diff: function(d, resolution){
		resolution = resolution || 'day';
		if ($type(d) == 'string') d = Date.parse(d);

		switch (resolution){
			case 'year':
				return d.get('year') - this.get('year');
			case 'month':
				var months = (d.get('year') - this.get('year')) * 12;
				return months + d.get('mo') - this.get('mo');
			default:
				var diff = d.get('time') - this.get('time');
				if (Date.units[resolution]() > diff.abs()) return 0;
				return ((d.get('time') - this.get('time')) / Date.units[resolution]()).round();
		}

		return null;
	},

	getLastDayOfMonth: function(){
		return Date.daysInMonth(this.get('mo'), this.get('year'));
	},

	getDayOfYear: function(){
		return (Date.UTC(this.get('year'), this.get('mo'), this.get('date') + 1) 
			- Date.UTC(this.get('year'), 0, 1)) / Date.units.day();
	},

	getWeek: function(){
		return (this.get('dayofyear') / 7).ceil();
	},
	
	getOrdinal: function(day){
		return Date.getMsg('ordinal', day || this.get('date'));
	},

	getTimezone: function(){
		return this.toString()
			.replace(/^.*? ([A-Z]{3}).[0-9]{4}.*$/, '$1')
			.replace(/^.*?\(([A-Z])[a-z]+ ([A-Z])[a-z]+ ([A-Z])[a-z]+\)$/, '$1$2$3');
	},

	getGMTOffset: function(){
		var off = this.get('timezoneOffset');
		return ((off > 0) ? '-' : '+') + zeroize((off.abs() / 60).floor(), 2) + zeroize(off % 60, 2);
	},

	setAMPM: function(ampm){
		ampm = ampm.toUpperCase();
		var hr = this.get('hr');
		if (hr > 11 && ampm == 'AM') return this.decrement('hour', 12);
		else if (hr < 12 && ampm == 'PM') return this.increment('hour', 12);
		return this;
	},

	getAMPM: function(){
		return (this.get('hr') < 12) ? 'AM' : 'PM';
	},

	parse: function(str){
		this.set('time', Date.parse(str));
		return this;
	},

	isValid: function(date) {
		return !!(date || this).valueOf();
	},

	format: function(f){
		if (!this.isValid()) return 'invalid date';
		f = f || '%x %X';
		f = formats[f.toLowerCase()] || f; // replace short-hand with actual format
		var d = this;
		return f.replace(/%([a-z%])/gi,
			function($1, $2){
				switch ($2){
					case 'a': return Date.getMsg('days')[d.get('day')].substr(0, 3);
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months')[d.get('month')].substr(0, 3);
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.toString();
					case 'd': return zeroize(d.get('date'), 2);
					case 'H': return zeroize(d.get('hr'), 2);
					case 'I': return ((d.get('hr') % 12) || 12);
					case 'j': return zeroize(d.get('dayofyear'), 3);
					case 'm': return zeroize((d.get('mo') + 1), 2);
					case 'M': return zeroize(d.get('min'), 2);
					case 'o': return d.get('ordinal');
					case 'p': return Date.getMsg(d.get('ampm'));
					case 'S': return zeroize(d.get('seconds'), 2);
					case 'U': return zeroize(d.get('week'), 2);
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'T': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
				}
				return $2;
			}
		);
	},

	toISOString: function(){
		return this.format('iso8601');
	}

});

Date.alias('diff', 'compare');
Date.alias('format', 'strftime');

var formats = {
	db: '%Y-%m-%d %H:%M:%S',
	compact: '%Y%m%dT%H%M%S',
	iso8601: '%Y-%m-%dT%H:%M:%S%T',
	rfc822: '%a, %d %b %Y %H:%M:%S %Z',
	'short': '%d %b %H:%M',
	'long': '%B %d, %Y %H:%M'
};

var nativeParse = Date.parse;

var parseWord = function(type, word, num){
	var ret = -1;
	var translated = Date.getMsg(type + 's');

	switch ($type(word)){
		case 'object':
			ret = translated[word.get(type)];
			break;
		case 'number':
			ret = translated[month - 1];
			if (!ret) throw new Error('Invalid ' + type + ' index: ' + index);
			break;
		case 'string':
			var match = translated.filter(function(name){
				return this.test(name);
			}, new RegExp('^' + word, 'i'));
			if (!match.length)    throw new Error('Invalid ' + type + ' string');
			if (match.length > 1) throw new Error('Ambiguous ' + type);
			ret = match[0];
	}

	return (num) ? translated.indexOf(ret) : ret;
};


Date.extend({

	getMsg: function(key, args) {
		return MooTools.lang.get('Date', key, args);
	},

	units: {
		ms: $lambda(1),
		second: $lambda(1000),
		minute: $lambda(60000),
		hour: $lambda(3600000),
		day: $lambda(86400000),
		week: $lambda(608400000),
		month: function(month, year){
			var d = new Date;
			return Date.daysInMonth($pick(month, d.get('mo')), $pick(year, d.get('year'))) * 86400000;
		},
		year: function(year){
			year = year || new Date().get('year');
			return Date.isLeapYear(year) ? 31622400000 : 31536000000;
		}
	},

	daysInMonth: function(month, year){
		return [31, Date.isLeapYear(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
	},

	isLeapYear: function(year){
		return new Date(year, 1, 29).get('date') == 29;
	},

	parse: function(from){
		var t = $type(from);
		if (t == 'number') return new Date(from);
		if (t != 'string') return from;
		from = from.clean();
		if (!from.length) return null;

		var parsed;
		Date.parsePatterns.some(function(pattern){
			var r = pattern.re.exec(from);
			return (r) ? (parsed = pattern.handler(r)) : false;
		});

		return parsed || new Date(nativeParse(from));
	},

	parseDay: function(day, num){
		return parseWord('day', day, num);
	},

	parseMonth: function(month, num){
		return parseWord('month', month, num);
	},

	parseUTC: function(value){
		var localDate = new Date(value);
		var utcSeconds = Date.UTC(localDate.get('year'), 
		localDate.get('mo'),
		localDate.get('date'), 
		localDate.get('hr'), 
		localDate.get('min'), 
		localDate.get('sec'));
		return new Date(utcSeconds);
	},

	orderIndex: function(unit){
		return Date.getMsg('dateOrder').indexOf(unit) + 1;
	},

	defineFormat: function(name, format){
		formats[name] = format;
	},

	defineFormats: function(formats){
		for (var name in formats) Date.defineFormat(name, formats[f]);
	},

	parsePatterns: [],
	
	defineParser: function(pattern){
		Date.parsePatterns.push( pattern.re && pattern.handler ? pattern : build(pattern) );
	},
	
	defineParsers: function(){
		Array.flatten(arguments).each(Date.defineParser);
	},
	
	define2DigitYearStart: function(year){
		yr_start = year % 100;
		yr_base = year - yr_start;
	}

});

var yr_base = 1900;
var yr_start = 70;

var replacers = function(key){
	switch(key){
		case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
			return (Date.orderIndex('month') == 1) ? '%m[.-/]%d([.-/]%y)?' : '%d[.-/]%m([.-/]%y)?';
		case 'X':
			return '%H([.:]%M)?([.:]%S([.:]%s)?)?\\s?%p?\\s?%T?';
		case 'o':
			return '[^\\d\\s]*';
	}
	return null;
};

var keys = {
	a: /[a-z]{3,}/,
	d: /[0-2]?[0-9]|3[01]/,
	H: /[01]?[0-9]|2[0-3]/,
	I: /0?[1-9]|1[0-2]/,
	M: /[0-5]?\d/,
	s: /\d+/,
	p: /[ap]\.?m\.?/,
	y: /\d{2}|\d{4}/,
	Y: /\d{4}/,
	T: /Z|[+-]\d{2}(?::?\d{2})?/
};

keys.B = keys.b = keys.A = keys.a;
keys.m = keys.I;
keys.S = keys.M;

var lang;

var build = function(format){
	if (!lang) return {format: format}; // wait until language is set
	
	var parsed = [null];

	var re = (format.source || format) // allow format to be regex
	 .replace(/%([a-z])/gi,
		function($1, $2){
			return replacers($2) || $1;
		}
	).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
	 .replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
	 .replace(/%([a-z%])/gi,
		function($1, $2){
			var p = keys[$2];
			if (!p) return $2;
			parsed.push($2);
			return '(' + p.source + ')';
		}
	);

	return {
		format: format,
		re: new RegExp('^' + re + '$', 'i'),
		handler: function(bits){
			var date = new Date().clearTime();
			for (var i = 1; i < parsed.length; i++)
				date = handle.call(date, parsed[i], bits[i]);
			return date;
		}
	};
};

var handle = function(key, value){
	if (!value){
		if (key == 'm' || key == 'd') value = 1;
		else return this;
	}

	switch(key){
		case 'a': case 'A': return this.set('day', Date.parseDay(value, true));
		case 'b': case 'B': return this.set('mo', Date.parseMonth(value, true));
		case 'd': return this.set('date', value);
		case 'H': case 'I': return this.set('hr', value);
		case 'm': return this.set('mo', value - 1);
		case 'M': return this.set('min', value);
		case 'p': return this.set('ampm', value.replace(/\./g, ''));
		case 'S': return this.set('sec', value);
		case 's': return this.set('ms', ('0.' + value) * 1000);
		case 'w': return this.set('day', value);
		case 'Y': return this.set('year', value);
		case 'y':
			value = +value;
			if (value < 100) value += yr_base + (value < yr_start ? 100 : 0);
			return this.set('year', value);
		case 'T':
			if (value == 'Z') value = '+00';
			var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
			offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
			return this.set('time', (this * 1) - offset * 60000);
	}

	return this;
};

Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
	'%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b %d%o?( %Y)?( %X)?', // Same as above with month and day switched
	'%b %Y' // "December 1999"
);

MooTools.lang.addEvent('langChange', function(language){
	if (!MooTools.lang.get('Date')) return;

	lang = language;
	Date.parsePatterns.each(function(pattern, i){
		if (pattern.format) Date.parsePatterns[i] = build(pattern.format);
	});

}).fireEvent('langChange', MooTools.lang.getCurrentLanguage());

})();/*
Script: Date.Extras.js
	Extends the Date native object to include extra methods (on top of those in Date.js).

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

Date.implement({

	timeDiffInWords: function(relative_to){
		return Date.distanceOfTimeInWords(this, relative_to || new Date);
	}

});

Date.alias('timeDiffInWords', 'timeAgoInWords');

Date.extend({

	distanceOfTimeInWords: function(from, to){
		return Date.getTimePhrase(((to - from) / 1000).toInt());
	},

	getTimePhrase: function(delta){
		var suffix = (delta < 0) ? 'Until' : 'Ago';
		if (delta < 0) delta *= -1;
		
		var msg = (delta < 60) ? 'lessThanMinute' :
				  (delta < 120) ? 'minute' :
				  (delta < (45 * 60)) ? 'minutes' :
				  (delta < (90 * 60)) ? 'hour' :
				  (delta < (24 * 60 * 60)) ? 'hours' :
				  (delta < (48 * 60 * 60)) ? 'day' :
				  'days';
		
		switch(msg){
			case 'minutes': delta = (delta / 60).round(); break;
			case 'hours':   delta = (delta / 3600).round(); break;
			case 'days': 	delta = (delta / 86400).round();
		}
		
		return Date.getMsg(msg + suffix, delta).substitute({delta: delta});
	}

});


Date.defineParsers(

	{
		// "today", "tomorrow", "yesterday"
		re: /^tod|tom|yes/i,
		handler: function(bits){
			var d = new Date().clearTime();
			switch(bits[0]){
				case 'tom': return d.increment();
				case 'yes': return d.decrement();
				default: 	return d;
			}
		}
	},

	{
		// "next Wednesday", "last Thursday"
		re: /^(next|last) ([a-z]+)$/i,
		handler: function(bits){
			var d = new Date().clearTime();
			var day = d.getDay();
			var newDay = Date.parseDay(bits[2], true);
			var addDays = newDay - day;
			if (newDay <= day) addDays += 7;
			if (bits[1] == 'last') addDays -= 7;
			return d.set('date', d.getDate() + addDays);
		}
	}

);
/*
Script: Hash.Extras.js
	Extends the Hash native object to include getFromPath which allows a path notation to child elements.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

Hash.implement({

	getFromPath: function(notation){
		var source = this.getClean();
		notation.replace(/\[([^\]]+)\]|\.([^.[]+)|[^[.]+/g, function(match){
			if (!source) return null;
			var prop = arguments[2] || arguments[1] || arguments[0];
			source = (prop in source) ? source[prop] : null;
			return match;
		});
		return source;
	},

	cleanValues: function(method){
		method = method || $defined;
		this.each(function(v, k){
			if (!method(v)) this.erase(k);
		}, this);
		return this;
	},

	run: function(){
		var args = arguments;
		this.each(function(v, k){
			if ($type(v) == 'function') v.run(args);
		});
	}

});/*
Script: String.Extras.js
	Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

	License:
		MIT-style license.

	Authors:
		Aaron Newton
		Guillermo Rauch

*/

(function(){
  
var special = ['À','à','Á','á','Â','â','Ã','ã','Ä','ä','Å','å','Ă','ă','Ą','ą','Ć','ć','Č','č','Ç','ç', 'Ď','ď','Đ','đ', 'È','è','É','é','Ê','ê','Ë','ë','Ě','ě','Ę','ę', 'Ğ','ğ','Ì','ì','Í','í','Î','î','Ï','ï', 'Ĺ','ĺ','Ľ','ľ','Ł','ł', 'Ñ','ñ','Ň','ň','Ń','ń','Ò','ò','Ó','ó','Ô','ô','Õ','õ','Ö','ö','Ø','ø','ő','Ř','ř','Ŕ','ŕ','Š','š','Ş','ş','Ś','ś', 'Ť','ť','Ť','ť','Ţ','ţ','Ù','ù','Ú','ú','Û','û','Ü','ü','Ů','ů', 'Ÿ','ÿ','ý','Ý','Ž','ž','Ź','ź','Ż','ż', 'Þ','þ','Ð','ð','ß','Œ','œ','Æ','æ','µ'];

var standard = ['A','a','A','a','A','a','A','a','Ae','ae','A','a','A','a','A','a','C','c','C','c','C','c','D','d','D','d', 'E','e','E','e','E','e','E','e','E','e','E','e','G','g','I','i','I','i','I','i','I','i','L','l','L','l','L','l', 'N','n','N','n','N','n', 'O','o','O','o','O','o','O','o','Oe','oe','O','o','o', 'R','r','R','r', 'S','s','S','s','S','s','T','t','T','t','T','t', 'U','u','U','u','U','u','Ue','ue','U','u','Y','y','Y','y','Z','z','Z','z','Z','z','TH','th','DH','dh','ss','OE','oe','AE','ae','u'];

var tidymap = {
	"[\xa0\u2002\u2003\u2009]": " ",
	"\xb7": "*",
	"[\u2018\u2019]": "'",
	"[\u201c\u201d]": '"',
	"\u2026": "...",
	"\u2013": "-",
	"\u2014": "--",
	"\uFFFD": "&raquo;"
};

String.implement({

	standardize: function(){
		var text = this;
		special.each(function(ch, i){
			text = text.replace(new RegExp(ch, 'g'), standard[i]);
		});
		return text;
	},

	repeat: function(times){
		return new Array(times + 1).join(this);
	},

	pad: function(length, str, dir){
		if (this.length >= length) return this;
		str = str || ' ';
		var pad = str.repeat(length - this.length).substr(0, length - this.length);
		if (!dir || dir == 'right') return this + pad;
		if (dir == 'left') return pad + this;
		return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
	},

	stripTags: function(){
		return this.replace(/<\/?[^>]+>/gi, '');
	},

	tidy: function(){
		var txt = this.toString();
		$each(tidymap, function(value, key){
			txt = txt.replace(new RegExp(key, 'g'), value);
		});
		return txt;
	}

});

})();/*
Script: String.QueryString.js
	...

	License:
		MIT-style license.

	Authors:
		Sebastian Markbåge, Aaron Newton, Lennart Pilon, Valerio Proietti
*/

String.implement({

	parseQueryString: function(){
		var vars = this.split(/[&;]/), res = {};
		if (vars.length) vars.each(function(val){
			var index = val.indexOf('='),
				keys = index < 0 ? [''] : val.substr(0, index).match(/[^\]\[]+/g),
				value = decodeURIComponent(val.substr(index + 1)),
				obj = res;
			keys.each(function(key, i){
				var current = obj[key];
				if(i < keys.length - 1)
					obj = obj[key] = current || {};
				else if($type(current) == 'array')
					current.push(value);
				else
					obj[key] = $defined(current) ? [current, value] : value;
			});
		});
		return res;
	},

	cleanQueryString: function(method){
		return this.split('&').filter(function(val){
			var index = val.indexOf('='),
			key = index < 0 ? '' : val.substr(0, index),
			value = val.substr(index + 1);
			return method ? method.run([key, value]) : $chk(value);
		}).join('&');
	}

});/*
Script: URI.js
	Provides methods useful in managing the window location and uris.

	License:
		MIT-style license.

	Authors:
		Sebastian Markb�ge, Aaron Newton
*/

var URI = new Class({

	Implements: Options,

	/*
	options: {
		base: false
	},
	*/

	regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
	parts: ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'],
	schemes: { http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: 0 },

	initialize: function(uri, options){
		this.setOptions(options);
		var base = this.options.base || URI.base;
		uri = uri || base;
		if (uri && uri.parsed)
			this.parsed = $unlink(uri.parsed);
		else
			this.set('value', uri.href || uri.toString(), base ? new URI(base) : false);
	},

	parse: function(value, base){
		var bits = value.match(this.regex);
		if (!bits) return false;
		bits.shift();
		return this.merge(bits.associate(this.parts), base);
	},

	merge: function(bits, base){
		if ((!bits || !bits.scheme) && (!base || !base.scheme)) return false;
		if (base){
			this.parts.every(function(part){
				if (bits[part]) return false;
				bits[part] = base[part] || '';
				return true;
			});
		}
		bits.port = bits.port || this.schemes[bits.scheme.toLowerCase()];
		bits.directory = bits.directory ? this.parseDirectory(bits.directory, base ? base.directory : '') : '/';
		return bits;
	},

	parseDirectory: function(directory, baseDirectory) {
		directory = (directory.substr(0, 1) == '/' ? '' : (baseDirectory || '/')) + directory;
		if (!directory.test(URI.regs.directoryDot)) return directory;
		var result = [];
		directory.replace(URI.regs.endSlash, '').split('/').each(function(dir){
			if (dir == '..' && result.length > 0) result.pop();
			else if (dir != '.') result.push(dir);
		});
		return result.join('/') + '/';
	},

	combine: function(bits){
		return bits.value || bits.scheme + '://' +
			(bits.user ? bits.user + (bits.password ? ':' + bits.password : '') + '@' : '') +
			(bits.host || '') + (bits.port && bits.port != this.schemes[bits.scheme] ? ':' + bits.port : '') +
			(bits.directory || '/') + (bits.file || '') +
			(bits.query ? '?' + bits.query : '') +
			(bits.fragment ? '#' + bits.fragment : '');
	},

	set: function(part, value, base){
		if (part == 'value'){
			var scheme = value.match(URI.regs.scheme);
			if (scheme) scheme = scheme[1];
			if (scheme && !$defined(this.schemes[scheme.toLowerCase()])) this.parsed = { scheme: scheme, value: value };
			else this.parsed = this.parse(value, (base || this).parsed) || (scheme ? { scheme: scheme, value: value } : { value: value });
		} else if (part == 'data') {
			this.setData(value);
		} else {
			this.parsed[part] = value;
		}
		return this;
	},

	get: function(part, base){
		switch(part){
			case 'value': return this.combine(this.parsed, base ? base.parsed : false);
			case 'data' : return this.getData();
		}
		return this.parsed[part] || undefined;
	},

	go: function(){
		document.location.href = this.toString();
	},

	toURI: function(){
		return this;
	},

	getData: function(key, part){
		var qs = this.get(part || 'query');
		if (!$chk(qs)) return key ? null : {};
		var obj = qs.parseQueryString();
		return key ? obj[key] : obj;
	},

	setData: function(values, merge, part){
		if ($type(arguments[0]) == 'string'){ 
			values = this.getData(); 
			values[arguments[0]] = arguments[1]; 
		} else if (merge) {
			values = $merge(this.getData(), values);
		}
		return this.set(part || 'query', Hash.toQueryString(values));
	},

	clearData: function(part){
		return this.set(part || 'query', '');
	}

});

['toString', 'valueOf'].each(function(method){
	URI.prototype[method] = function(){
		return this.get('value');
	};
});


URI.regs = {
	endSlash: /\/$/,
	scheme: /^(\w+):/,
	directoryDot: /\.\/|\.$/
};

URI.base = new URI($$('base[href]').getLast(), { base: document.location });

String.implement({

	toURI: function(options){ return new URI(this, options); }

});/*
Script: URI.Relative.js
	Extends the URI class to add methods for computing relative and absolute urls.

	License:
		MIT-style license.

	Authors:
		Sebastian Markbåge
*/

URI = Class.refactor(URI, {

	combine: function(bits, base){
		if (!base || bits.scheme != base.scheme || bits.host != base.host || bits.port != base.port)
			return this.previous.apply(this, arguments);
		var end = bits.file + (bits.query ? '?' + bits.query : '') + (bits.fragment ? '#' + bits.fragment : '');

		if (!base.directory) return (bits.directory || (bits.file ? '' : './')) + end;

		var baseDir = base.directory.split('/'),
			relDir = bits.directory.split('/'),
			path = '',
			offset;

		var i = 0;
		for(offset = 0; offset < baseDir.length && offset < relDir.length && baseDir[offset] == relDir[offset]; offset++);
		for(i = 0; i < baseDir.length - offset - 1; i++) path += '../';
		for(i = offset; i < relDir.length - 1; i++) path += relDir[i] + '/';

		return (path || (bits.file ? '' : './')) + end;
	},

	toAbsolute: function(base){
		base = new URI(base);
		if (base) base.set('directory', '').set('file', '');
		return this.toRelative(base);
	},

	toRelative: function(base){
		return this.get('value', new URI(base));
	}

});/*
Script: Element.Forms.js
	Extends the Element native object to include methods useful in managing inputs.

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

Element.implement({

	tidy: function(){
		this.set('value', this.get('value').tidy());
	},

	getTextInRange: function(start, end){
		return this.get('value').substring(start, end);
	},

	getSelectedText: function(){
		if (this.setSelectionRange) return this.getTextInRange(this.getSelectionStart(), this.getSelectionEnd());
		return document.selection.createRange().text;
	},

	getSelectedRange: function() {
		if ($defined(this.selectionStart)) return {start: this.selectionStart, end: this.selectionEnd};
		var pos = {start: 0, end: 0};
		var range = this.getDocument().selection.createRange();
		if (!range || range.parentElement() != this) return pos;
		var dup = range.duplicate();
		if (this.type == 'text') {
			pos.start = 0 - dup.moveStart('character', -100000);
			pos.end = pos.start + range.text.length;
		} else {
			var value = this.get('value');
			var offset = value.length - value.match(/[\n\r]*$/)[0].length;
			dup.moveToElementText(this);
			dup.setEndPoint('StartToEnd', range);
			pos.end = offset - dup.text.length;
			dup.setEndPoint('StartToStart', range);
			pos.start = offset - dup.text.length;
		}
		return pos;
	},

	getSelectionStart: function(){
		return this.getSelectedRange().start;
	},

	getSelectionEnd: function(){
		return this.getSelectedRange().end;
	},

	setCaretPosition: function(pos){
		if (pos == 'end') pos = this.get('value').length;
		this.selectRange(pos, pos);
		return this;
	},

	getCaretPosition: function(){
		return this.getSelectedRange().start;
	},

	selectRange: function(start, end){
		if (this.setSelectionRange) {
			this.focus();
			this.setSelectionRange(start, end);
		} else {
			var value = this.get('value');
			var diff = value.substr(start, end - start).replace(/\r/g, '').length;
			start = value.substr(0, start).replace(/\r/g, '').length;
			var range = this.createTextRange();
			range.collapse(true);
			range.moveEnd('character', start + diff);
			range.moveStart('character', start);
			range.select();
		}
		return this;
	},

	insertAtCursor: function(value, select){
		var pos = this.getSelectedRange();
		var text = this.get('value');
		this.set('value', text.substring(0, pos.start) + value + text.substring(pos.end, text.length));
		if ($pick(select, true)) this.selectRange(pos.start, pos.start + value.length);
		else this.setCaretPosition(pos.start + value.length);
		return this;
	},

	insertAroundCursor: function(options, select){
		options = $extend({
			before: '',
			defaultMiddle: '',
			after: ''
		}, options);
		var value = this.getSelectedText() || options.defaultMiddle;
		var pos = this.getSelectedRange();
		var text = this.get('value');
		if (pos.start == pos.end){
			this.set('value', text.substring(0, pos.start) + options.before + value + options.after + text.substring(pos.end, text.length));
			this.selectRange(pos.start + options.before.length, pos.end + options.before.length + value.length);
		} else {
			var current = text.substring(pos.start, pos.end);
			this.set('value', text.substring(0, pos.start) + options.before + current + options.after + text.substring(pos.end, text.length));
			var selStart = pos.start + options.before.length;
			if ($pick(select, true)) this.selectRange(selStart, selStart + current.length);
			else this.setCaretPosition(selStart + text.length);
		}
		return this;
	}

});/*
Script: Element.Measure.js
	Extends the Element native object to include methods useful in measuring dimensions.

	Element.measure / .expose methods by Daniel Steigerwald
	License: MIT-style license.
	Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

Element.implement({

	measure: function(fn){
		var vis = function(el) {
			return !!(!el || el.offsetHeight || el.offsetWidth);
		};
		if (vis(this)) return fn.apply(this);
		var parent = this.getParent(),
			toMeasure = [], 
			restorers = [];
		while (!vis(parent) && parent != document.body) {
			toMeasure.push(parent.expose());
			parent = parent.getParent();
		}
		var restore = this.expose();
		var result = fn.apply(this);
		restore();
		toMeasure.each(function(restore){
			restore();
		});
		return result;
	},

	expose: function(){
		if (this.getStyle('display') != 'none') return $empty;
		var before = this.style.cssText;
		this.setStyles({
			display: 'block',
			position: 'absolute',
			visibility: 'hidden'
		});
		return function(){
			this.style.cssText = before;
		}.bind(this);
	},

	getDimensions: function(options){
		options = $merge({computeSize: false},options);
		var dim = {};
		var getSize = function(el, options){
			return (options.computeSize)?el.getComputedSize(options):el.getSize();
		};
		if (this.getStyle('display') == 'none'){
			dim = this.measure(function(){
				return getSize(this, options);
			});
		} else {
			try { //safari sometimes crashes here, so catch it
				dim = getSize(this, options);
			}catch(e){}
		}
		return $chk(dim.x) ? $extend(dim, {width: dim.x, height: dim.y}) : $extend(dim, {x: dim.width, y: dim.height});
	},

	getComputedSize: function(options){
		options = $merge({
			styles: ['padding','border'],
			plains: {
				height: ['top','bottom'],
				width: ['left','right']
			},
			mode: 'both'
		}, options);
		var size = {width: 0,height: 0};
		switch (options.mode){
			case 'vertical':
				delete size.width;
				delete options.plains.width;
				break;
			case 'horizontal':
				delete size.height;
				delete options.plains.height;
				break;
		}
		var getStyles = [];
		//this function might be useful in other places; perhaps it should be outside this function?
		$each(options.plains, function(plain, key){
			plain.each(function(edge){
				options.styles.each(function(style){
					getStyles.push((style == 'border') ? style + '-' + edge + '-' + 'width' : style + '-' + edge);
				});
			});
		});
		var styles = {};
		getStyles.each(function(style){ styles[style] = this.getComputedStyle(style); }, this);
		var subtracted = [];
		$each(options.plains, function(plain, key){ //keys: width, height, plains: ['left', 'right'], ['top','bottom']
			var capitalized = key.capitalize();
			size['total' + capitalized] = 0;
			size['computed' + capitalized] = 0;
			plain.each(function(edge){ //top, left, right, bottom
				size['computed' + edge.capitalize()] = 0;
				getStyles.each(function(style, i){ //padding, border, etc.
					//'padding-left'.test('left') size['totalWidth'] = size['width'] + [padding-left]
					if (style.test(edge)){
						styles[style] = styles[style].toInt() || 0; //styles['padding-left'] = 5;
						size['total' + capitalized] = size['total' + capitalized] + styles[style];
						size['computed' + edge.capitalize()] = size['computed' + edge.capitalize()] + styles[style];
					}
					//if width != width (so, padding-left, for instance), then subtract that from the total
					if (style.test(edge) && key != style &&
						(style.test('border') || style.test('padding')) && !subtracted.contains(style)){
						subtracted.push(style);
						size['computed' + capitalized] = size['computed' + capitalized]-styles[style];
					}
				});
			});
		});

		['Width', 'Height'].each(function(value){
			var lower = value.toLowerCase();
			if(!$chk(size[lower])) return;

			size[lower] = size[lower] + this['offset' + value] + size['computed' + value];
			size['total' + value] = size[lower] + size['total' + value];
			delete size['computed' + value];
		}, this);

		return $extend(styles, size);
	}

});/*
Script: Element.Pin.js
	Extends the Element native object to include the pin method useful for fixed positioning for elements.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

(function(){
	var supportsPositionFixed = false;
	window.addEvent('domready', function(){
		var test = new Element('div').setStyles({
			position: 'fixed',
			top: 0,
			right: 0
		}).inject(document.body);
		supportsPositionFixed = (test.offsetTop === 0);
		test.dispose();
	});

	Element.implement({

		pin: function(enable){
			if (this.getStyle('display') == 'none') return null;
			
			var p;
			if (enable !== false){
				p = this.getPosition();
				if (!this.retrieve('pinned')){
					var pos = {
						top: p.y - window.getScroll().y,
						left: p.x - window.getScroll().x
					};
					if (supportsPositionFixed){
						this.setStyle('position', 'fixed').setStyles(pos);
					} else {
						this.store('pinnedByJS', true);
						this.setStyles({
							position: 'absolute',
							top: p.y,
							left: p.x
						});
						this.store('scrollFixer', (function(){
							if (this.retrieve('pinned'))
								this.setStyles({
									top: pos.top.toInt() + window.getScroll().y,
									left: pos.left.toInt() + window.getScroll().x
								});
						}).bind(this));
						window.addEvent('scroll', this.retrieve('scrollFixer'));
					}
					this.store('pinned', true);
				}
			} else {
				var op;
				if (!Browser.Engine.trident){
					if (this.getParent().getComputedStyle('position') != 'static') op = this.getParent();
					else op = this.getParent().getOffsetParent();
				}
				p = this.getPosition(op);
				this.store('pinned', false);
				var reposition;
				if (supportsPositionFixed && !this.retrieve('pinnedByJS')){
					reposition = {
						top: p.y + window.getScroll().y,
						left: p.x + window.getScroll().x
					};
				} else {
					this.store('pinnedByJS', false);
					window.removeEvent('scroll', this.retrieve('scrollFixer'));
					reposition = {
						top: p.y,
						left: p.x
					};
				}
				this.setStyles($merge(reposition, {position: 'absolute'}));
			}
			return this.addClass('isPinned');
		},

		unpin: function(){
			return this.pin(false).removeClass('isPinned');
		},

		togglepin: function(){
			this.pin(!this.retrieve('pinned'));
		}

	});

})();/*
Script: Element.Position.js
	Extends the Element native object to include methods useful positioning elements relative to others.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

(function(){

var original = Element.prototype.position;

Element.implement({

	position: function(options){
		//call original position if the options are x/y values
		if (options && ($defined(options.x) || $defined(options.y))) return original ? original.apply(this, arguments) : this;
		$each(options||{}, function(v, k){ if (!$defined(v)) delete options[k]; });
		options = $merge({
			relativeTo: document.body,
			position: {
				x: 'center', //left, center, right
				y: 'center' //top, center, bottom
			},
			edge: false,
			offset: {x: 0, y: 0},
			returnPos: false,
			relFixedPosition: false,
			ignoreMargins: false,
			allowNegative: false
		}, options);
		//compute the offset of the parent positioned element if this element is in one
		var parentOffset = {x: 0, y: 0};
		var parentPositioned = false;
		/* dollar around getOffsetParent should not be necessary, but as it does not return
		 * a mootools extended element in IE, an error occurs on the call to expose. See:
		 * http://mootools.lighthouseapp.com/projects/2706/tickets/333-element-getoffsetparent-inconsistency-between-ie-and-other-browsers */
		var offsetParent = this.measure(function(){
			return document.id(this.getOffsetParent());
		});
		if (offsetParent && offsetParent != this.getDocument().body){
			parentOffset = offsetParent.measure(function(){
				return this.getPosition();
			});
			parentPositioned = true;
			options.offset.x = options.offset.x - parentOffset.x;
			options.offset.y = options.offset.y - parentOffset.y;
		}
		//upperRight, bottomRight, centerRight, upperLeft, bottomLeft, centerLeft
		//topRight, topLeft, centerTop, centerBottom, center
		var fixValue = function(option){
			if ($type(option) != 'string') return option;
			option = option.toLowerCase();
			var val = {};
			if (option.test('left')) val.x = 'left';
			else if (option.test('right')) val.x = 'right';
			else val.x = 'center';
			if (option.test('upper') || option.test('top')) val.y = 'top';
			else if (option.test('bottom')) val.y = 'bottom';
			else val.y = 'center';
			return val;
		};
		options.edge = fixValue(options.edge);
		options.position = fixValue(options.position);
		if (!options.edge){
			if (options.position.x == 'center' && options.position.y == 'center') options.edge = {x:'center', y:'center'};
			else options.edge = {x:'left', y:'top'};
		}

		this.setStyle('position', 'absolute');
		var rel = document.id(options.relativeTo) || document.body;
		var calc = rel == document.body ? window.getScroll() : rel.getPosition();
		var top = calc.y;
		var left = calc.x;

		if (Browser.Engine.trident){
			var scrolls = rel.getScrolls();
			top += scrolls.y;
			left += scrolls.x;
		}

		var dim = this.getDimensions({computeSize: true, styles:['padding', 'border','margin']});
		if (options.ignoreMargins){
			options.offset.x = options.offset.x - dim['margin-left'];
			options.offset.y = options.offset.y - dim['margin-top'];
		}
		var pos = {};
		var prefY = options.offset.y;
		var prefX = options.offset.x;
		var winSize = window.getSize();
		switch(options.position.x){
			case 'left':
				pos.x = left + prefX;
				break;
			case 'right':
				pos.x = left + prefX + rel.offsetWidth;
				break;
			default: //center
				pos.x = left + ((rel == document.body ? winSize.x : rel.offsetWidth)/2) + prefX;
				break;
		}
		switch(options.position.y){
			case 'top':
				pos.y = top + prefY;
				break;
			case 'bottom':
				pos.y = top + prefY + rel.offsetHeight;
				break;
			default: //center
				pos.y = top + ((rel == document.body ? winSize.y : rel.offsetHeight)/2) + prefY;
				break;
		}

		if (options.edge){
			var edgeOffset = {};

			switch(options.edge.x){
				case 'left':
					edgeOffset.x = 0;
					break;
				case 'right':
					edgeOffset.x = -dim.x-dim.computedRight-dim.computedLeft;
					break;
				default: //center
					edgeOffset.x = -(dim.x/2);
					break;
			}
			switch(options.edge.y){
				case 'top':
					edgeOffset.y = 0;
					break;
				case 'bottom':
					edgeOffset.y = -dim.y-dim.computedTop-dim.computedBottom;
					break;
				default: //center
					edgeOffset.y = -(dim.y/2);
					break;
			}
			pos.x = pos.x + edgeOffset.x;
			pos.y = pos.y + edgeOffset.y;
		}
		pos = {
			left: ((pos.x >= 0 || parentPositioned || options.allowNegative) ? pos.x : 0).toInt(),
			top: ((pos.y >= 0 || parentPositioned || options.allowNegative) ? pos.y : 0).toInt()
		};
		if (rel.getStyle('position') == 'fixed' || options.relFixedPosition){
			var winScroll = window.getScroll();
			pos.top = pos.top.toInt() + winScroll.y;
			pos.left = pos.left.toInt() + winScroll.x;
		}

		if (options.returnPos) return pos;
		else this.setStyles(pos);
		return this;
	}

});

})();/*
Script: Element.Shortcuts.js
	Extends the Element native object to include some shortcut methods.

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

Element.implement({

	isDisplayed: function(){
		return this.getStyle('display') != 'none';
	},

	toggle: function(){
		return this[this.isDisplayed() ? 'hide' : 'show']();
	},

	hide: function(){
		var d;
		try {
			//IE fails here if the element is not in the dom
			if ('none' != this.getStyle('display')) d = this.getStyle('display');
		} catch(e){}

		return this.store('originalDisplay', d || 'block').setStyle('display', 'none');
	},

	show: function(display){
		return this.setStyle('display', display || this.retrieve('originalDisplay') || 'block');
	},

	swapClass: function(remove, add){
		return this.removeClass(remove).addClass(add);
	}

});
/*
Script: FormValidator.English.js
	Date messages for English.

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

MooTools.lang.set('en-US', 'FormValidator', {

	required:'This field is required.',
	minLength:'Please enter at least {minLength} characters (you entered {length} characters).',
	maxLength:'Please enter no more than {maxLength} characters (you entered {length} characters).',
	integer:'Please enter an integer in this field. Numbers with decimals (e.g. 1.25) are not permitted.',
	numeric:'Please enter only numeric values in this field (i.e. "1" or "1.1" or "-1" or "-1.1").',
	digits:'Please use numbers and punctuation only in this field (for example, a phone number with dashes or dots is permitted).',
	alpha:'Please use letters only (a-z) with in this field. No spaces or other characters are allowed.',
	alphanum:'Please use only letters (a-z) or numbers (0-9) only in this field. No spaces or other characters are allowed.',
	dateSuchAs:'Please enter a valid date such as {date}',
	dateInFormatMDY:'Please enter a valid date such as MM/DD/YYYY (i.e. "12/31/1999")',
	email:'Please enter a valid email address. For example "fred@domain.com".',
	url:'Please enter a valid URL such as http://www.google.com.',
	currencyDollar:'Please enter a valid $ amount. For example $100.00 .',
	oneRequired:'Please enter something for at least one of these inputs.',
	errorPrefix: 'Error: ',
	warningPrefix: 'Warning: ',

	//FormValidator.Extras

	noSpace: 'There can be no spaces in this input.',
	reqChkByNode: 'No items are selected.',
	requiredChk: 'This field is required.',
	reqChkByName: 'Please select a {label}.',
	match: 'This field needs to match the {matchName} field',
	startDate: 'the start date',
	endDate: 'the end date',
	currendDate: 'the current date',
	afterDate: 'The date should be the same or after {label}.',
	beforeDate: 'The date should be the same or before {label}.',
	startMonth: 'Please select a start month',
	sameMonth: 'These two dates must be in the same month - you must change one or the other.'

});/*
Script: FormValidator.js
	A css-class based form validation system.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/
var InputValidator = new Class({

	Implements: [Options],

	options: {
		errorMsg: 'Validation failed.',
		test: function(field){return true;}
	},

	initialize: function(className, options){
		this.setOptions(options);
		this.className = className;
	},

	test: function(field, props){
		if (document.id(field)) return this.options.test(document.id(field), props||this.getProps(field));
		else return false;
	},

	getError: function(field, props){
		var err = this.options.errorMsg;
		if ($type(err) == 'function') err = err(document.id(field), props||this.getProps(field));
		return err;
	},

	getProps: function(field){
		if (!document.id(field)) return {};
		return field.get('validatorProps');
	}

});

Element.Properties.validatorProps = {

	set: function(props){
		return this.eliminate('validatorProps').store('validatorProps', props);
	},

	get: function(props){
		if (props) this.set(props);
		if (this.retrieve('validatorProps')) return this.retrieve('validatorProps');
		if (this.getProperty('validatorProps')){
			try {
				this.store('validatorProps', JSON.decode(this.getProperty('validatorProps')));
			}catch(e){
				return {};
			}
		} else {
			var vals = this.get('class').split(' ').filter(function(cls){
				return cls.test(':');
			});
			if (!vals.length){
				this.store('validatorProps', {});
			} else {
				props = {};
				vals.each(function(cls){
					var split = cls.split(':');
					if (split[1]) {
						try {
							props[split[0]] = JSON.decode(split[1]);
						} catch(e) {}
					}
				});
				this.store('validatorProps', props);
			}
		}
		return this.retrieve('validatorProps');
	}

};

var FormValidator = new Class({

	Implements:[Options, Events],

	Binds: ['onSubmit'],

	options: {/*
		onFormValidate: $empty(isValid, form, event),
		onElementValidate: $empty(isValid, field, className, warn),
		onElementPass: $empty(field),
		onElementFail: $empty(field, validatorsFailed) */
		fieldSelectors: 'input, select, textarea',
		ignoreHidden: true,
		useTitles: false,
		evaluateOnSubmit: true,
		evaluateFieldsOnBlur: true,
		evaluateFieldsOnChange: true,
		serial: true,
		stopOnFailure: true,
		warningPrefix: function(){
			return FormValidator.getMsg('warningPrefix') || 'Warning: ';
		},
		errorPrefix: function(){
			return FormValidator.getMsg('errorPrefix') || 'Error: ';
		}
	},

	initialize: function(form, options){
		this.setOptions(options);
		this.element = document.id(form);
		this.element.store('validator', this);
		this.warningPrefix = $lambda(this.options.warningPrefix)();
		this.errorPrefix = $lambda(this.options.errorPrefix)();
		if (this.options.evaluateOnSubmit) this.element.addEvent('submit', this.onSubmit);
		if (this.options.evaluateFieldsOnBlur || this.options.evaluateFieldsOnChange) this.watchFields(this.getFields());
	},

	toElement: function(){
		return this.element;
	},

	getFields: function(){
		return (this.fields = this.element.getElements(this.options.fieldSelectors));
	},

	watchFields: function(fields){
		fields.each(function(el){
			if (this.options.evaluateFieldsOnBlur)
				el.addEvent('blur', this.validationMonitor.pass([el, false], this));
			if (this.options.evaluateFieldsOnChange)
				el.addEvent('change', this.validationMonitor.pass([el, true], this));
		}, this);
	},

	validationMonitor: function(){
		$clear(this.timer);
		this.timer = this.validateField.delay(50, this, arguments);
	},

	onSubmit: function(event){
		if (!this.validate(event) && event) event.preventDefault();
		else this.reset();
	},

	reset: function(){
		this.getFields().each(this.resetField, this);
		return this;
	},

	validate: function(event){
		var result = this.getFields().map(function(field){
			return this.validateField(field, true);
		}, this).every(function(v){ return v;});
		this.fireEvent('formValidate', [result, this.element, event]);
		if (this.options.stopOnFailure && !result && event) event.preventDefault();
		return result;
	},

	validateField: function(field, force){
		if (this.paused) return true;
		field = document.id(field);
		var passed = !field.hasClass('validation-failed');
		var failed, warned;
		if (this.options.serial && !force){
			failed = this.element.getElement('.validation-failed');
			warned = this.element.getElement('.warning');
		}
		if (field && (!failed || force || field.hasClass('validation-failed') || (failed && !this.options.serial))){
			var validators = field.className.split(' ').some(function(cn){
				return this.getValidator(cn);
			}, this);
			var validatorsFailed = [];
			field.className.split(' ').each(function(className){
				if (className && !this.test(className, field)) validatorsFailed.include(className);
			}, this);
			passed = validatorsFailed.length === 0;
			if (validators && !field.hasClass('warnOnly')){
				if (passed){
					field.addClass('validation-passed').removeClass('validation-failed');
					this.fireEvent('elementPass', field);
				} else {
					field.addClass('validation-failed').removeClass('validation-passed');
					this.fireEvent('elementFail', [field, validatorsFailed]);
				}
			}
			if (!warned){
				var warnings = field.className.split(' ').some(function(cn){
					if (cn.test('^warn-') || field.hasClass('warnOnly'))
						return this.getValidator(cn.replace(/^warn-/,''));
					else return null;
				}, this);
				field.removeClass('warning');
				var warnResult = field.className.split(' ').map(function(cn){
					if (cn.test('^warn-') || field.hasClass('warnOnly'))
						return this.test(cn.replace(/^warn-/,''), field, true);
					else return null;
				}, this);
			}
		}
		return passed;
	},

	test: function(className, field, warn){
		var validator = this.getValidator(className);
		field = document.id(field);
		if (field.hasClass('ignoreValidation')) return true;
		warn = $pick(warn, false);
		if (field.hasClass('warnOnly')) warn = true;
		var isValid = validator ? validator.test(field) : true;
		if (validator && this.isVisible(field)) this.fireEvent('elementValidate', [isValid, field, className, warn]);
		if (warn) return true;
		return isValid;
	},

	isVisible : function(field){
		if (!this.options.ignoreHidden) return true;
		while(field != document.body){
			if (document.id(field).getStyle('display') == 'none') return false;
			field = field.getParent();
		}
		return true;
	},

	resetField: function(field){
		field = document.id(field);
		if (field){
			field.className.split(' ').each(function(className){
				if (className.test('^warn-')) className = className.replace(/^warn-/, '');
				field.removeClass('validation-failed');
				field.removeClass('warning');
				field.removeClass('validation-passed');
			}, this);
		}
		return this;
	},

	stop: function(){
		this.paused = true;
		return this;
	},

	start: function(){
		this.paused = false;
		return this;
	},

	ignoreField: function(field, warn){
		field = document.id(field);
		if (field){
			this.enforceField(field);
			if (warn) field.addClass('warnOnly');
			else field.addClass('ignoreValidation');
		}
		return this;
	},

	enforceField: function(field){
		field = document.id(field);
		if (field) field.removeClass('warnOnly').removeClass('ignoreValidation');
		return this;
	}

});

FormValidator.getMsg = function(key){
	return MooTools.lang.get('FormValidator', key);
};

FormValidator.adders = {

	validators:{},

	add : function(className, options){
		this.validators[className] = new InputValidator(className, options);
		//if this is a class (this method is used by instances of FormValidator and the FormValidator namespace)
		//extend these validators into it
		//this allows validators to be global and/or per instance
		if (!this.initialize){
			this.implement({
				validators: this.validators
			});
		}
	},

	addAllThese : function(validators){
		$A(validators).each(function(validator){
			this.add(validator[0], validator[1]);
		}, this);
	},

	getValidator: function(className){
		return this.validators[className.split(':')[0]];
	}

};

$extend(FormValidator, FormValidator.adders);

FormValidator.implement(FormValidator.adders);

FormValidator.add('IsEmpty', {

	errorMsg: false,
	test: function(element){
		if (element.type == 'select-one' || element.type == 'select')
			return !(element.selectedIndex >= 0 && element.options[element.selectedIndex].value != '');
		else
			return ((element.get('value') == null) || (element.get('value').length == 0));
	}

});

FormValidator.addAllThese([

	['required', {
		errorMsg: function(){
			return FormValidator.getMsg('required');
		},
		test: function(element){
			return !FormValidator.getValidator('IsEmpty').test(element);
		}
	}],

	['minLength', {
		errorMsg: function(element, props){
			if ($type(props.minLength))
				return FormValidator.getMsg('minLength').substitute({minLength:props.minLength,length:element.get('value').length });
			else return '';
		},
		test: function(element, props){
			if ($type(props.minLength)) return (element.get('value').length >= $pick(props.minLength, 0));
			else return true;
		}
	}],

	['maxLength', {
		errorMsg: function(element, props){
			//props is {maxLength:10}
			if ($type(props.maxLength))
				return FormValidator.getMsg('maxLength').substitute({maxLength:props.maxLength,length:element.get('value').length });
			else return '';
		},
		test: function(element, props){
			//if the value is <= than the maxLength value, element passes test
			return (element.get('value').length <= $pick(props.maxLength, 10000));
		}
	}],

	['validate-integer', {
		errorMsg: FormValidator.getMsg.pass('integer'),
		test: function(element){
			return FormValidator.getValidator('IsEmpty').test(element) || (/^(-?[1-9]\d*|0)$/).test(element.get('value'));
		}
	}],

	['validate-numeric', {
		errorMsg: FormValidator.getMsg.pass('numeric'),
		test: function(element){
			return FormValidator.getValidator('IsEmpty').test(element) ||
				(/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/).test(element.get('value'));
		}
	}],

	['validate-digits', {
		errorMsg: FormValidator.getMsg.pass('digits'),
		test: function(element){
			return FormValidator.getValidator('IsEmpty').test(element) || (/^[\d() .:\-\+#]+$/.test(element.get('value')));
		}
	}],

	['validate-alpha', {
		errorMsg: FormValidator.getMsg.pass('alpha'),
		test: function(element){
			return FormValidator.getValidator('IsEmpty').test(element) ||  (/^[a-zA-Z]+$/).test(element.get('value'));
		}
	}],

	['validate-alphanum', {
		errorMsg: FormValidator.getMsg.pass('alphanum'),
		test: function(element){
			return FormValidator.getValidator('IsEmpty').test(element) || !(/\W/).test(element.get('value'));
		}
	}],

	['validate-date', {
		errorMsg: function(element, props){
			if (Date.parse){
				var format = props.dateFormat || '%x';
				return FormValidator.getMsg('dateSuchAs').substitute({date: new Date().format(format)});
			} else {
				return FormValidator.getMsg('dateInFormatMDY');
			}
		},
		test: function(element, props){
			if (FormValidator.getValidator('IsEmpty').test(element)) return true;
			var d;
			if (Date.parse){
				var format = props.dateFormat || '%x';
				d = Date.parse(element.get('value'));
				var formatted = d.format(format);
				if (formatted != 'invalid date') element.set('value', formatted);
				return !isNaN(d);
			} else {
				var regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
				if (!regex.test(element.get('value'))) return false;
				d = new Date(element.get('value').replace(regex, '$1/$2/$3'));
				return (parseInt(RegExp.$1, 10) == (1 + d.getMonth())) &&
					(parseInt(RegExp.$2, 10) == d.getDate()) &&
					(parseInt(RegExp.$3, 10) == d.getFullYear());
			}
		}
	}],

	['validate-email', {
		errorMsg: FormValidator.getMsg.pass('email'),
		test: function(element){
			return FormValidator.getValidator('IsEmpty').test(element) || (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i).test(element.get('value'));
		}
	}],

	['validate-url', {
		errorMsg: FormValidator.getMsg.pass('url'),
		test: function(element){
			return FormValidator.getValidator('IsEmpty').test(element) || (/^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i).test(element.get('value'));
		}
	}],

	['validate-currency-dollar', {
		errorMsg: FormValidator.getMsg.pass('currencyDollar'),
		test: function(element){
			// [$]1[##][,###]+[.##]
			// [$]1###+[.##]
			// [$]0.##
			// [$].##
			return FormValidator.getValidator('IsEmpty').test(element) ||  (/^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(element.get('value'));
		}
	}],

	['validate-one-required', {
		errorMsg: FormValidator.getMsg.pass('oneRequired'),
		test: function(element, props){
			var p = document.id(props['validate-one-required']) || element.parentNode;
			return p.getElements('input').some(function(el){
				if (['checkbox', 'radio'].contains(el.get('type'))) return el.get('checked');
				return el.get('value');
			});
		}
	}]

]);

Element.Properties.validator = {

	set: function(options){
		var validator = this.retrieve('validator');
		if (validator) validator.setOptions(options);
		return this.store('validator:options');
	},

	get: function(options){
		if (options || !this.retrieve('validator')){
			if (options || !this.retrieve('validator:options')) this.set('validator', options);
			this.store('validator', new FormValidator(this, this.retrieve('validator:options')));
		}
		return this.retrieve('validator');
	}

};

Element.implement({

	validate: function(options){
		this.set('validator', options);
		return this.get('validator', options).validate();
	}

});/*
Script: FormValidator.Inline.js
	Extends FormValidator to add inline messages.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

FormValidator.Inline = new Class({

	Extends: FormValidator,

	options: {
		scrollToErrorsOnSubmit: true,
		scrollFxOptions: {
			transition: 'quad:out',
			offset: {
				y: -20
			}
		}
	},

	initialize: function(form, options){
		this.parent(form, options);
		this.addEvent('onElementValidate', function(isValid, field, className, warn){
			var validator = this.getValidator(className);
			if (!isValid && validator.getError(field)){
				if (warn) field.addClass('warning');
				var advice = this.makeAdvice(className, field, validator.getError(field), warn);
				this.insertAdvice(advice, field);
				this.showAdvice(className, field);
			} else {
				this.hideAdvice(className, field);
			}
		});
	},

	makeAdvice: function(className, field, error, warn){
		var errorMsg = (warn)?this.warningPrefix:this.errorPrefix;
			errorMsg += (this.options.useTitles) ? field.title || error:error;
		var cssClass = (warn) ? 'warning-advice' : 'validation-advice';
		var advice = this.getAdvice(className, field);
		if(advice) {
			advice = advice.clone(true, true).set('html', errorMsg).replaces(advice);
		} else {
			advice = new Element('div', {
				html: errorMsg,
				styles: { display: 'none' },
				id: 'advice-' + className + '-' + this.getFieldId(field)
			}).addClass(cssClass);
		}
		field.store('advice-' + className, advice);
		return advice;
	},

	getFieldId : function(field){
		return field.id ? field.id : field.id = 'input_' + field.name;
	},

	showAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (advice && !field.retrieve(this.getPropName(className))
				&& (advice.getStyle('display') == 'none'
				|| advice.getStyle('visiblity') == 'hidden'
				|| advice.getStyle('opacity') == 0)){
			field.store(this.getPropName(className), true);
			if (advice.reveal) advice.reveal();
			else advice.setStyle('display', 'block');
		}
	},

	hideAdvice: function(className, field){
		var advice = this.getAdvice(className, field);
		if (advice && field.retrieve(this.getPropName(className))){
			field.store(this.getPropName(className), false);
			//if Fx.Reveal.js is present, transition the advice out
			if (advice.dissolve) advice.dissolve();
			else advice.setStyle('display', 'none');
		}
	},

	getPropName: function(className){
		return 'advice' + className;
	},

	resetField: function(field){
		field = document.id(field);
		if (!field) return this;
		this.parent(field);
		field.className.split(' ').each(function(className){
			this.hideAdvice(className, field);
		}, this);
		return this;
	},

	getAllAdviceMessages: function(field, force){
		var advice = [];
		if (field.hasClass('ignoreValidation') && !force) return advice;
		var validators = field.className.split(' ').some(function(cn){
			var warner = cn.test('^warn-') || field.hasClass('warnOnly');
			if (warner) cn = cn.replace(/^warn-/, '');
			var validator = this.getValidator(cn);
			if (!validator) return;
			advice.push({
				message: validator.getError(field),
				warnOnly: warner,
				passed: validator.test(),
				validator: validator
			});
		}, this);
		return advice;
	},

	getAdvice: function(className, field){
		return field.retrieve('advice-' + className);
	},

	insertAdvice: function(advice, field){
		//Check for error position prop
		var props = field.get('validatorProps');
		//Build advice
		if (!props.msgPos || !document.id(props.msgPos)){
			if(field.type.toLowerCase() == 'radio') field.getParent().adopt(advice);
			else advice.inject(document.id(field), 'after');
		} else {
			document.id(props.msgPos).grab(advice);
		}
	},

	validateField: function(field, force){
		var result = this.parent(field, force);
		if (this.options.scrollToErrorsOnSubmit && !result){
			var failed = document.id(this).getElement('.validation-failed');
			var par = document.id(this).getParent();
			while (par != document.body && par.getScrollSize().y == par.getSize().y){
				par = par.getParent();
			}
			var fx = par.retrieve('fvScroller');
			if (!fx && window.Fx && Fx.Scroll){
				fx = new Fx.Scroll(par, this.options.scrollFxOptions);
				par.store('fvScroller', fx);
			}
			if (failed){
				if (fx) fx.toElement(failed);
				else par.scrollTo(par.getScroll().x, failed.getPosition(par).y - 20);
			}
		}
		return result;
	}

});
/*
Script: FormValidator.Extras.js
	Additional validators for the FormValidator class.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/
FormValidator.addAllThese([

	['validate-enforce-oncheck', {
		test: function(element, props){
			if (element.checked){
				var fv = element.getParent('form').retrieve('validator');
				if (!fv) return true;
				(props.toEnforce || document.id(props.enforceChildrenOf).getElements('input, select, textarea')).map(function(item){
					fv.enforceField(item);
				});
			}
			return true;
		}
	}],

	['validate-ignore-oncheck', {
		test: function(element, props){
			if (element.checked){
				var fv = element.getParent('form').retrieve('validator');
				if (!fv) return true;
				(props.toIgnore || document.id(props.ignoreChildrenOf).getElements('input, select, textarea')).each(function(item){
					fv.ignoreField(item);
					fv.resetField(item);
				});
			}
			return true;
		}
	}],

	['validate-nospace', {
		errorMsg: function(){
			return FormValidator.getMsg('noSpace');
		},
		test: function(element, props){
			return !element.get('value').test(/\s/);
		}
	}],

	['validate-toggle-oncheck', {
		test: function(element, props){
			var fv = element.getParent('form').retrieve('validator');
			if (!fv) return true;
			var eleArr = props.toToggle || document.id(props.toToggleChildrenOf).getElements('input, select, textarea');
			if (!element.checked){
				eleArr.each(function(item){
					fv.ignoreField(item);
					fv.resetField(item);
				});
			} else {
				eleArr.each(function(item){
					fv.enforceField(item);
				});
			}
			return true;
		}
	}],

	['validate-reqchk-bynode', {
		errorMsg: function(){
			return FormValidator.getMsg('reqChkByNode');
		},
		test: function(element, props){
			return (document.id(props.nodeId).getElements(props.selector || 'input[type=checkbox], input[type=radio]')).some(function(item){
				return item.checked;
			});
		}
	}],

	['validate-required-check', {
		errorMsg: function(element, props){
			return props.useTitle ? element.get('title') : FormValidator.getMsg('requiredChk');
		},
		test: function(element, props){
			return !!element.checked;
		}
	}],

	['validate-reqchk-byname', {
		errorMsg: function(element, props){
			return FormValidator.getMsg('reqChkByName').substitute({label: props.label || element.get('type')});
		},
		test: function(element, props){
			var grpName = props.groupName || element.get('name');
			var oneCheckedItem = $$(document.getElementsByName(grpName)).some(function(item, index){
				return item.checked;
			});
			var fv = element.getParent('form').retrieve('validator');
			if (oneCheckedItem && fv) fv.resetField(element);
			return oneCheckedItem;
		}
	}],

	['validate-match', {
		errorMsg: function(element, props){
			return FormValidator.getMsg('match').substitute({matchName: props.matchName || document.id(props.matchInput).get('name')});
		},
		test: function(element, props){
			var eleVal = element.get('value');
			var matchVal = document.id(props.matchInput) && document.id(props.matchInput).get('value');
			return eleVal && matchVal ? eleVal == matchVal : true;
		}
	}],

	['validate-after-date', {
		errorMsg: function(element, props){
			return FormValidator.getMsg('afterDate').substitute({
				label: props.afterLabel || (props.afterElement ? FormValidator.getMsg('startDate') : FormValidator.getMsg('currentDate'))
			});
		},
		test: function(element, props){
			var start = document.id(props.afterElement) ? Date.parse(document.id(props.afterElement).get('value')) : new Date();
			var end = Date.parse(element.get('value'));
			return end && start ? end >= start : true;
		}
	}],

	['validate-before-date', {
		errorMsg: function(element, props){
			return FormValidator.getMsg('beforeDate').substitute({
				label: props.beforeLabel || (props.beforeElement ? FormValidator.getMsg('endDate') : FormValidator.getMsg('currentDate'))
			});
		},
		test: function(element, props){
			var start = Date.parse(element.get('value'));
			var end = document.id(props.beforeElement) ? Date.parse(document.id(props.beforeElement).get('value')) : new Date();
			return end && start ? end >= start : true;
		}
	}],

	['validate-custom-required', {
		errorMsg: function(){
			return FormValidator.getMsg('required');
		},
		test: function(element, props){
			return element.get('value') != props.emptyValue;
		}
	}],

	['validate-same-month', {
		errorMsg: function(element, props){
			var startMo = document.id(props.sameMonthAs) && document.id(props.sameMonthAs).get('value');
			var eleVal = element.get('value');
			if (eleVal != '') return FormValidator.getMsg(startMo ? 'sameMonth' : 'startMonth');
		},
		test: function(element, props){
			var d1 = Date.parse(element.get('value'));
			var d2 = Date.parse(document.id(props.sameMonthAs) && document.id(props.sameMonthAs).get('value'));
			return d1 && d2 ? d1.format('%B') == d2.format('%B') : true;
		}
	}]

]);/*
Script: OverText.js
	Shows text over an input that disappears when the user clicks into it. The text remains hidden if the user adds a value.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

var OverText = new Class({

	Implements: [Options, Events, Class.Occlude],

	Binds: ['reposition', 'assert', 'focus'],

	options: {/*
		textOverride: null,
		onFocus: $empty()
		onTextHide: $empty(textEl, inputEl),
		onTextShow: $empty(textEl, inputEl), */
		element: 'label',
		positionOptions: {
			position: 'upperLeft',
			edge: 'upperLeft',
			offset: {
				x: 4,
				y: 2
			}
		},
		poll: false,
		pollInterval: 250
	},

	property: 'OverText',

	initialize: function(element, options){
		this.element = document.id(element);
		if (this.occlude()) return this.occluded;
		this.setOptions(options);
		this.attach(this.element);
		OverText.instances.push(this);
		if (this.options.poll) this.poll();
		return this;
	},

	toElement: function(){
		return this.element;
	},

	attach: function(){
		var val = this.options.textOverride || this.element.get('alt') || this.element.get('title');
		if (!val) return;
		this.text = new Element(this.options.element, {
			'class': 'overTxtLabel',
			styles: {
				lineHeight: 'normal',
				position: 'absolute'
			},
			html: val,
			events: {
				click: this.hide.pass(true, this)
			}
		}).inject(this.element, 'after');
		if (this.options.element == 'label') this.text.set('for', this.element.get('id'));
		this.element.addEvents({
			focus: this.focus,
			blur: this.assert,
			change: this.assert
		}).store('OverTextDiv', this.text);
		window.addEvent('resize', this.reposition.bind(this));
		this.assert(true);
		this.reposition();
	},

	startPolling: function(){
		this.pollingPaused = false;
		return this.poll();
	},

	poll: function(stop){
		//start immediately
		//pause on focus
		//resumeon blur
		if (this.poller && !stop) return this;
		var test = function(){
			if (!this.pollingPaused) this.assert(true);
		}.bind(this);
		if (stop) $clear(this.poller);
		else this.poller = test.periodical(this.options.pollInterval, this);
		return this;
	},

	stopPolling: function(){
		this.pollingPaused = true;
		return this.poll(true);
	},

	focus: function(){
		if (!this.text.isDisplayed() || this.element.get('disabled')) return;
		this.hide();
	},

	hide: function(suppressFocus){
		if (this.text.isDisplayed() && !this.element.get('disabled')){
			this.text.hide();
			this.fireEvent('textHide', [this.text, this.element]);
			this.pollingPaused = true;
			try {
				if (!suppressFocus) this.element.fireEvent('focus').focus();
			} catch(e){} //IE barfs if you call focus on hidden elements
		}
		return this;
	},

	show: function(){
		if (!this.text.isDisplayed()){
			this.text.show();
			this.reposition();
			this.fireEvent('textShow', [this.text, this.element]);
			this.pollingPaused = false;
		}
		return this;
	},

	assert: function(suppressFocus){
		this[this.test() ? 'show' : 'hide'](suppressFocus);
	},

	test: function(){
		var v = this.element.get('value');
		return !v;
	},

	reposition: function(){
		this.assert(true);
		if (!this.element.getParent() || !this.element.offsetHeight) return this.stopPolling().hide();
		if (this.test()) this.text.position($merge(this.options.positionOptions, {relativeTo: this.element}));
		return this;
	}

});

OverText.instances = [];

OverText.update = function(){

	return OverText.instances.map(function(ot){
		if (ot.element && ot.text) return ot.reposition();
		return null; //the input or the text was destroyed
	});

};

if (window.Fx && Fx.Reveal) {
	Fx.Reveal.implement({
		hideInputs: Browser.Engine.trident ? 'select, input, textarea, object, embed, .overTxtLabel' : false
	});
}/*
Script: Fx.Elements.js
	Effect to change any number of CSS properties of any number of Elements.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

Fx.Elements = new Class({

	Extends: Fx.CSS,

	initialize: function(elements, options){
		this.elements = this.subject = $$(elements);
		this.parent(options);
	},

	compute: function(from, to, delta){
		var now = {};
		for (var i in from){
			var iFrom = from[i], iTo = to[i], iNow = now[i] = {};
			for (var p in iFrom) iNow[p] = this.parent(iFrom[p], iTo[p], delta);
		}
		return now;
	},

	set: function(now){
		for (var i in now){
			var iNow = now[i];
			for (var p in iNow) this.render(this.elements[i], p, iNow[p], this.options.unit);
		}
		return this;
	},

	start: function(obj){
		if (!this.check(obj)) return this;
		var from = {}, to = {};
		for (var i in obj){
			var iProps = obj[i], iFrom = from[i] = {}, iTo = to[i] = {};
			for (var p in iProps){
				var parsed = this.prepare(this.elements[i], p, iProps[p]);
				iFrom[p] = parsed.from;
				iTo[p] = parsed.to;
			}
		}
		return this.parent(from, to);
	}

});/*
Script: Fx.Accordion.js
	An Fx.Elements extension which allows you to easily create accordion type controls.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

var Accordion = Fx.Accordion = new Class({

	Extends: Fx.Elements,

	options: {/*
		onActive: $empty(toggler, section),
		onBackground: $empty(toggler, section),*/
		display: 0,
		show: false,
		height: true,
		width: false,
		opacity: true,
		fixedHeight: false,
		fixedWidth: false,
		wait: false,
		alwaysHide: false,
		trigger: 'click',
		initialDisplayFx: true
	},

	initialize: function(){
		var params = Array.link(arguments, {'container': Element.type, 'options': Object.type, 'togglers': $defined, 'elements': $defined});
		this.parent(params.elements, params.options);
		this.togglers = $$(params.togglers);
		this.container = document.id(params.container);
		this.previous = -1;
		if (this.options.alwaysHide) this.options.wait = true;
		if ($chk(this.options.show)){
			this.options.display = false;
			this.previous = this.options.show;
		}
		if (this.options.start){
			this.options.display = false;
			this.options.show = false;
		}
		this.effects = {};
		if (this.options.opacity) this.effects.opacity = 'fullOpacity';
		if (this.options.width) this.effects.width = this.options.fixedWidth ? 'fullWidth' : 'offsetWidth';
		if (this.options.height) this.effects.height = this.options.fixedHeight ? 'fullHeight' : 'scrollHeight';
		for (var i = 0, l = this.togglers.length; i < l; i++) this.addSection(this.togglers[i], this.elements[i]);
		this.elements.each(function(el, i){
			if (this.options.show === i){
				this.fireEvent('active', [this.togglers[i], el]);
			} else {
				for (var fx in this.effects) el.setStyle(fx, 0);
			}
		}, this);
		if ($chk(this.options.display)) this.display(this.options.display, this.options.initialDisplayFx);
	},

	addSection: function(toggler, element){
		toggler = document.id(toggler);
		element = document.id(element);
		var test = this.togglers.contains(toggler);
		this.togglers.include(toggler);
		this.elements.include(element);
		var idx = this.togglers.indexOf(toggler);
		toggler.addEvent(this.options.trigger, this.display.bind(this, idx));
		if (this.options.height) element.setStyles({'padding-top': 0, 'border-top': 'none', 'padding-bottom': 0, 'border-bottom': 'none'});
		if (this.options.width) element.setStyles({'padding-left': 0, 'border-left': 'none', 'padding-right': 0, 'border-right': 'none'});
		element.fullOpacity = 1;
		if (this.options.fixedWidth) element.fullWidth = this.options.fixedWidth;
		if (this.options.fixedHeight) element.fullHeight = this.options.fixedHeight;
		element.setStyle('overflow', 'hidden');
		if (!test){
			for (var fx in this.effects) element.setStyle(fx, 0);
		}
		return this;
	},

	display: function(index, useFx){
		useFx = $pick(useFx, true);
		index = ($type(index) == 'element') ? this.elements.indexOf(index) : index;
		if ((this.timer && this.options.wait) || (index === this.previous && !this.options.alwaysHide)) return this;
		this.previous = index;
		var obj = {};
		this.elements.each(function(el, i){
			obj[i] = {};
			var hide = (i != index) || (this.options.alwaysHide && (el.offsetHeight > 0));
			this.fireEvent(hide ? 'background' : 'active', [this.togglers[i], el]);
			for (var fx in this.effects) obj[i][fx] = hide ? 0 : el[this.effects[fx]];
		}, this);
		return useFx ? this.start(obj) : this.set(obj);
	}

});/*
Script: Fx.Move.js
	Defines Fx.Move, a class that works with Element.Position.js to transition an element from one location to another.

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

Fx.Move = new Class({

	Extends: Fx.Morph,

	options: {
		relativeTo: document.body,
		position: 'center',
		edge: false,
		offset: {x: 0, y: 0}
	},

	start: function(destination){
		return this.parent(this.element.position($merge(this.options, destination, {returnPos: true})));
	}

});

Element.Properties.move = {

	set: function(options){
		var morph = this.retrieve('move');
		if (morph) morph.cancel();
		return this.eliminate('move').store('move:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('move')){
			if (options || !this.retrieve('move:options')) this.set('move', options);
			this.store('move', new Fx.Move(this, this.retrieve('move:options')));
		}
		return this.retrieve('move');
	}

};

Element.implement({

	move: function(options){
		this.get('move').start(options);
		return this;
	}

});
/*
Script: Fx.Reveal.js
	Defines Fx.Reveal, a class that shows and hides elements with a transition.

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

Fx.Reveal = new Class({

	Extends: Fx.Morph,

	options: {/*	  
		onShow: $empty(thisElement),
		onHide: $empty(thisElement),
		onComplete: $empty(thisElement),
		heightOverride: null,
		widthOverride: null, */
		styles: ['padding', 'border', 'margin'],
		transitionOpacity: !Browser.Engine.trident4,
		mode: 'vertical',
		display: 'block',
		hideInputs: Browser.Engine.trident ? 'select, input, textarea, object, embed' : false
	},

	dissolve: function(){
		try {
			if (!this.hiding && !this.showing){
				if (this.element.getStyle('display') != 'none'){
					this.hiding = true;
					this.showing = false;
					this.hidden = true;
					var startStyles = this.element.getComputedSize({
						styles: this.options.styles,
						mode: this.options.mode
					});
					var setToAuto = (this.element.style.height === ''||this.element.style.height == 'auto');
					this.element.setStyle('display', 'block');
					if (this.options.transitionOpacity) startStyles.opacity = 1;
					var zero = {};
					$each(startStyles, function(style, name){
						zero[name] = [style, 0];
					}, this);
					var overflowBefore = this.element.getStyle('overflow');
					this.element.setStyle('overflow', 'hidden');
					var hideThese = this.options.hideInputs ? this.element.getElements(this.options.hideInputs) : null;
					this.$chain.unshift(function(){
						if (this.hidden){
							this.hiding = false;
							$each(startStyles, function(style, name){
								startStyles[name] = style;
							}, this);
							this.element.setStyles($merge({display: 'none', overflow: overflowBefore}, startStyles));
							if (setToAuto){
								if (['vertical', 'both'].contains(this.options.mode)) this.element.style.height = '';
								if (['width', 'both'].contains(this.options.mode)) this.element.style.width = '';
							}
							if (hideThese) hideThese.setStyle('visibility', 'visible');
						}
						this.fireEvent('hide', this.element);
						this.callChain();
					}.bind(this));
					if (hideThese) hideThese.setStyle('visibility', 'hidden');
					this.start(zero);
				} else {
					this.callChain.delay(10, this);
					this.fireEvent('complete', this.element);
					this.fireEvent('hide', this.element);
				}
			} else if (this.options.link == 'chain'){
				this.chain(this.dissolve.bind(this));
			} else if (this.options.link == 'cancel' && !this.hiding){
				this.cancel();
				this.dissolve();
			}
		} catch(e){
			this.hiding = false;
			this.element.setStyle('display', 'none');
			this.callChain.delay(10, this);
			this.fireEvent('complete', this.element);
			this.fireEvent('hide', this.element);
		}
		return this;
	},

	reveal: function(){
		try {
			if (!this.showing && !this.hiding){
				if (this.element.getStyle('display') == 'none' ||
					 this.element.getStyle('visiblity') == 'hidden' ||
					 this.element.getStyle('opacity') == 0){
					this.showing = true;
					this.hiding = false;
					this.hidden = false;
					var setToAuto, startStyles;
					//toggle display, but hide it
					this.element.measure(function(){
						setToAuto = (this.element.style.height === '' || this.element.style.height == 'auto');
						//create the styles for the opened/visible state
						startStyles = this.element.getComputedSize({
							styles: this.options.styles,
							mode: this.options.mode
						});
					}.bind(this));
					$each(startStyles, function(style, name){
						startStyles[name] = style;
					});
					//if we're overridding height/width
					if ($chk(this.options.heightOverride)) startStyles.height = this.options.heightOverride.toInt();
					if ($chk(this.options.widthOverride)) startStyles.width = this.options.widthOverride.toInt();
					if (this.options.transitionOpacity) {
						this.element.setStyle('opacity', 0);
						startStyles.opacity = 1;
					}
					//create the zero state for the beginning of the transition
					var zero = {
						height: 0,
						display: this.options.display
					};
					$each(startStyles, function(style, name){ zero[name] = 0; });
					var overflowBefore = this.element.getStyle('overflow');
					//set to zero
					this.element.setStyles($merge(zero, {overflow: 'hidden'}));
					//hide inputs
					var hideThese = this.options.hideInputs ? this.element.getElements(this.options.hideInputs) : null;
					if (hideThese) hideThese.setStyle('visibility', 'hidden');
					//start the effect
					this.start(startStyles);
					this.$chain.unshift(function(){
						this.element.setStyle('overflow', overflowBefore);
						if (!this.options.heightOverride && setToAuto){
							if (['vertical', 'both'].contains(this.options.mode)) this.element.style.height = '';
							if (['width', 'both'].contains(this.options.mode)) this.element.style.width = '';
						}
						if (!this.hidden) this.showing = false;
						if (hideThese) hideThese.setStyle('visibility', 'visible');
						this.callChain();
						this.fireEvent('show', this.element);
					}.bind(this));
				} else {
					this.callChain();
					this.fireEvent('complete', this.element);
					this.fireEvent('show', this.element);
				}
			} else if (this.options.link == 'chain'){
				this.chain(this.reveal.bind(this));
			} else if (this.options.link == 'cancel' && !this.showing){
				this.cancel();
				this.reveal();
			}
		} catch(e){
			this.element.setStyles({
				display: this.options.display,
				visiblity: 'visible',
				opacity: 1
			});
			this.showing = false;
			this.callChain.delay(10, this);
			this.fireEvent('complete', this.element);
			this.fireEvent('show', this.element);
		}
		return this;
	},

	toggle: function(){
		if (this.element.getStyle('display') == 'none' ||
			 this.element.getStyle('visiblity') == 'hidden' ||
			 this.element.getStyle('opacity') == 0){
			this.reveal();
		} else {
			this.dissolve();
		}
		return this;
	}

});

Element.Properties.reveal = {

	set: function(options){
		var reveal = this.retrieve('reveal');
		if (reveal) reveal.cancel();
		return this.eliminate('reveal').store('reveal:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('reveal')){
			if (options || !this.retrieve('reveal:options')) this.set('reveal', options);
			this.store('reveal', new Fx.Reveal(this, this.retrieve('reveal:options')));
		}
		return this.retrieve('reveal');
	}

};

Element.Properties.dissolve = Element.Properties.reveal;

Element.implement({

	reveal: function(options){
		this.get('reveal', options).reveal();
		return this;
	},

	dissolve: function(options){
		this.get('reveal', options).dissolve();
		return this;
	},

	nix: function(){
		var params = Array.link(arguments, {destroy: Boolean.type, options: Object.type});
		this.get('reveal', params.options).dissolve().chain(function(){
			this[params.destroy ? 'destroy' : 'dispose']();
		}.bind(this));
		return this;
	},

	wink: function(){
		var params = Array.link(arguments, {duration: Number.type, options: Object.type});
		var reveal = this.get('reveal', params.options);
		reveal.reveal().chain(function(){
			(function(){
				reveal.dissolve();
			}).delay(params.duration || 2000);
		});
	}


});/*
Script: Fx.Scroll.js
	Effect to smoothly scroll any element, including the window.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

Fx.Scroll = new Class({

	Extends: Fx,

	options: {
		offset: {x: 0, y: 0},
		wheelStops: true
	},

	initialize: function(element, options){
		this.element = this.subject = document.id(element);
		this.parent(options);
		var cancel = this.cancel.bind(this, false);

		if ($type(this.element) != 'element') this.element = document.id(this.element.getDocument().body);

		var stopper = this.element;

		if (this.options.wheelStops){
			this.addEvent('start', function(){
				stopper.addEvent('mousewheel', cancel);
			}, true);
			this.addEvent('complete', function(){
				stopper.removeEvent('mousewheel', cancel);
			}, true);
		}
	},

	set: function(){
		var now = Array.flatten(arguments);
		this.element.scrollTo(now[0], now[1]);
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(x, y){
		if (!this.check(x, y)) return this;
		var offsetSize = this.element.getSize(), scrollSize = this.element.getScrollSize();
		var scroll = this.element.getScroll(), values = {x: x, y: y};
		for (var z in values){
			var max = scrollSize[z] - offsetSize[z];
			if ($chk(values[z])) values[z] = ($type(values[z]) == 'number') ? values[z].limit(0, max) : max;
			else values[z] = scroll[z];
			values[z] += this.options.offset[z];
		}
		return this.parent([scroll.x, scroll.y], [values.x, values.y]);
	},

	toTop: function(){
		return this.start(false, 0);
	},

	toLeft: function(){
		return this.start(0, false);
	},

	toRight: function(){
		return this.start('right', false);
	},

	toBottom: function(){
		return this.start(false, 'bottom');
	},

	toElement: function(el){
		var position = document.id(el).getPosition(this.element);
		return this.start(position.x, position.y);
	},

	scrollIntoView: function(el, axes, offset){
		axes = axes ? $splat(axes) : ['x','y'];
		var to = {};
		el = document.id(el);
		var pos = el.getPosition(this.element);
		var size = el.getSize();
		var scroll = this.element.getScroll();
		var containerSize = this.element.getSize();
		var edge = {
			x: pos.x + size.x,
			y: pos.y + size.y
		};
		['x','y'].each(function(axis) {
			if (axes.contains(axis)) {
				if (edge[axis] > scroll[axis] + containerSize[axis]) to[axis] = edge[axis] - containerSize[axis];
				if (pos[axis] < scroll[axis]) to[axis] = pos[axis];
			}
			if (to[axis] == null) to[axis] = scroll[axis];
			if (offset && offset[axis]) to[axis] = to[axis] + offset[axis];
		}, this);
		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);
		return this;
	}

});
/*
Script: Fx.Slide.js
	Effect to slide an element in and out of view.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

Fx.Slide = new Class({

	Extends: Fx,

	options: {
		mode: 'vertical'
	},

	initialize: function(element, options){
		this.addEvent('complete', function(){
			this.open = (this.wrapper['offset' + this.layout.capitalize()] != 0);
			if (this.open && Browser.Engine.webkit419) this.element.dispose().inject(this.wrapper);
		}, true);
		this.element = this.subject = document.id(element);
		this.parent(options);
		var wrapper = this.element.retrieve('wrapper');
		this.wrapper = wrapper || new Element('div', {
			styles: $extend(this.element.getStyles('margin', 'position'), {overflow: 'hidden'})
		}).wraps(this.element);
		this.element.store('wrapper', this.wrapper).setStyle('margin', 0);
		this.now = [];
		this.open = true;
	},

	vertical: function(){
		this.margin = 'margin-top';
		this.layout = 'height';
		this.offset = this.element.offsetHeight;
	},

	horizontal: function(){
		this.margin = 'margin-left';
		this.layout = 'width';
		this.offset = this.element.offsetWidth;
	},

	set: function(now){
		this.element.setStyle(this.margin, now[0]);
		this.wrapper.setStyle(this.layout, now[1]);
		return this;
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(how, mode){
		if (!this.check(how, mode)) return this;
		this[mode || this.options.mode]();
		var margin = this.element.getStyle(this.margin).toInt();
		var layout = this.wrapper.getStyle(this.layout).toInt();
		var caseIn = [[margin, layout], [0, this.offset]];
		var caseOut = [[margin, layout], [-this.offset, 0]];
		var start;
		switch (how){
			case 'in': start = caseIn; break;
			case 'out': start = caseOut; break;
			case 'toggle': start = (layout == 0) ? caseIn : caseOut;
		}
		return this.parent(start[0], start[1]);
	},

	slideIn: function(mode){
		return this.start('in', mode);
	},

	slideOut: function(mode){
		return this.start('out', mode);
	},

	hide: function(mode){
		this[mode || this.options.mode]();
		this.open = false;
		return this.set([-this.offset, 0]);
	},

	show: function(mode){
		this[mode || this.options.mode]();
		this.open = true;
		return this.set([0, this.offset]);
	},

	toggle: function(mode){
		return this.start('toggle', mode);
	}

});

Element.Properties.slide = {

	set: function(options){
		var slide = this.retrieve('slide');
		if (slide) slide.cancel();
		return this.eliminate('slide').store('slide:options', $extend({link: 'cancel'}, options));
	},

	get: function(options){
		if (options || !this.retrieve('slide')){
			if (options || !this.retrieve('slide:options')) this.set('slide', options);
			this.store('slide', new Fx.Slide(this, this.retrieve('slide:options')));
		}
		return this.retrieve('slide');
	}

};

Element.implement({

	slide: function(how, mode){
		how = how || 'toggle';
		var slide = this.get('slide'), toggle;
		switch (how){
			case 'hide': slide.hide(mode); break;
			case 'show': slide.show(mode); break;
			case 'toggle':
				var flag = this.retrieve('slide:flag', slide.open);
				slide[flag ? 'slideOut' : 'slideIn'](mode);
				this.store('slide:flag', !flag);
				toggle = true;
			break;
			default: slide.start(how, mode);
		}
		if (!toggle) this.eliminate('slide:flag');
		return this;
	}

});
/*
Script: Fx.SmoothScroll.js
	Class for creating a smooth scrolling effect to all internal links on the page.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

var SmoothScroll = Fx.SmoothScroll = new Class({

	Extends: Fx.Scroll,

	initialize: function(options, context){
		context = context || document;
		this.doc = context.getDocument();
		var win = context.getWindow();
		this.parent(this.doc, options);
		this.links = this.options.links ? $$(this.options.links) : $$(this.doc.links);
		var location = win.location.href.match(/^[^#]*/)[0] + '#';
		this.links.each(function(link){
			if (link.href.indexOf(location) != 0) {return;}
			var anchor = link.href.substr(location.length);
			if (anchor) this.useLink(link, anchor);
		}, this);
		if (!Browser.Engine.webkit419) {
			this.addEvent('complete', function(){
				win.location.hash = this.anchor;
			}, true);
		}
	},

	useLink: function(link, anchor){
		var el;
		link.addEvent('click', function(event){
			if (el !== false && !el) el = document.id(anchor) || this.doc.getElement('a[name=' + anchor + ']');
			if (el) {
				event.preventDefault();
				this.anchor = anchor;
				this.toElement(el);
				link.blur();
			}
		}.bind(this));
	}

});/*
Script: Fx.Sort.js
	Defines Fx.Sort, a class that reorders lists with a transition.

	License:
		MIT-style license.

	Authors:
		Aaron Newton

*/

Fx.Sort = new Class({

	Extends: Fx.Elements,

	options: {
		mode: 'vertical'
	},

	initialize: function(elements, options){
		this.parent(elements, options);
		this.elements.each(function(el){
			if (el.getStyle('position') == 'static') el.setStyle('position', 'relative');
		});
		this.setDefaultOrder();
	},

	setDefaultOrder: function(){
		this.currentOrder = this.elements.map(function(el, index){
			return index;
		});
	},

	sort: function(newOrder){
		if ($type(newOrder) != 'array') return false;
		var top = 0;
		var left = 0;
		var zero = {};
		var vert = this.options.mode == 'vertical';
		var current = this.elements.map(function(el, index){
			var size = el.getComputedSize({styles: ['border', 'padding', 'margin']});
			var val;
			if (vert){
				val = {
					top: top,
					margin: size['margin-top'],
					height: size.totalHeight
				};
				top += val.height - size['margin-top'];
			} else {
				val = {
					left: left,
					margin: size['margin-left'],
					width: size.totalWidth
				};
				left += val.width;
			}
			var plain = vert ? 'top' : 'left';
			zero[index] = {};
			var start = el.getStyle(plain).toInt();
			zero[index][plain] = start || 0;
			return val;
		}, this);
		this.set(zero);
		newOrder = newOrder.map(function(i){ return i.toInt(); });
		if (newOrder.length != this.elements.length){
			this.currentOrder.each(function(index){
				if (!newOrder.contains(index)) newOrder.push(index);
			});
			if (newOrder.length > this.elements.length)
				newOrder.splice(this.elements.length-1, newOrder.length - this.elements.length);
		}
		top = 0;
		left = 0;
		var margin = 0;
		var next = {};
		newOrder.each(function(item, index){
			var newPos = {};
			if (vert){
				newPos.top = top - current[item].top - margin;
				top += current[item].height;
			} else {
				newPos.left = left - current[item].left;
				left += current[item].width;
			}
			margin = margin + current[item].margin;
			next[item]=newPos;
		}, this);
		var mapped = {};
		$A(newOrder).sort().each(function(index){
			mapped[index] = next[index];
		});
		this.start(mapped);
		this.currentOrder = newOrder;
		return this;
	},

	rearrangeDOM: function(newOrder){
		newOrder = newOrder || this.currentOrder;
		var parent = this.elements[0].getParent();
		var rearranged = [];
		this.elements.setStyle('opacity', 0);
		//move each element and store the new default order
		newOrder.each(function(index){
			rearranged.push(this.elements[index].inject(parent).setStyles({
				top: 0,
				left: 0
			}));
		}, this);
		this.elements.setStyle('opacity', 1);
		this.elements = $$(rearranged);
		this.setDefaultOrder();
		return this;
	},

	getDefaultOrder: function(){
		return this.elements.map(function(el, index){
			return index;
		});
	},

	forward: function(){
		return this.sort(this.getDefaultOrder());
	},

	backward: function(){
		return this.sort(this.getDefaultOrder().reverse());
	},

	reverse: function(){
		return this.sort(this.currentOrder.reverse());
	},

	sortByElements: function(elements){
		return this.sort(elements.map(function(el){
			return this.elements.indexOf(el);
		}, this));
	},

	swap: function(one, two){
		if ($type(one) == 'element') one = this.elements.indexOf(one);
		if ($type(two) == 'element') two = this.elements.indexOf(two);
		
		var newOrder = $A(this.currentOrder);
		newOrder[this.currentOrder.indexOf(one)] = two;
		newOrder[this.currentOrder.indexOf(two)] = one;
		this.sort(newOrder);
	}

});/*
Script: Drag.js
	The base Drag Class. Can be used to drag and resize Elements using mouse events.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
		Tom Occhinno
		Jan Kassens
*/

var Drag = new Class({

	Implements: [Events, Options],

	options: {/*
		onBeforeStart: $empty(thisElement),
		onStart: $empty(thisElement, event),
		onSnap: $empty(thisElement)
		onDrag: $empty(thisElement, event),
		onCancel: $empty(thisElement),
		onComplete: $empty(thisElement, event),*/
		snap: 6,
		unit: 'px',
		grid: false,
		style: true,
		limit: false,
		handle: false,
		invert: false,
		preventDefault: false,
		modifiers: {x: 'left', y: 'top'}
	},

	initialize: function(){
		var params = Array.link(arguments, {'options': Object.type, 'element': $defined});
		this.element = document.id(params.element);
		this.document = this.element.getDocument();
		this.setOptions(params.options || {});
		var htype = $type(this.options.handle);
		this.handles = ((htype == 'array' || htype == 'collection') ? $$(this.options.handle) : document.id(this.options.handle)) || this.element;
		this.mouse = {'now': {}, 'pos': {}};
		this.value = {'start': {}, 'now': {}};

		this.selection = (Browser.Engine.trident) ? 'selectstart' : 'mousedown';

		this.bound = {
			start: this.start.bind(this),
			check: this.check.bind(this),
			drag: this.drag.bind(this),
			stop: this.stop.bind(this),
			cancel: this.cancel.bind(this),
			eventStop: $lambda(false)
		};
		this.attach();
	},

	attach: function(){
		this.handles.addEvent('mousedown', this.bound.start);
		return this;
	},

	detach: function(){
		this.handles.removeEvent('mousedown', this.bound.start);
		return this;
	},

	start: function(event){
		if (this.options.preventDefault) event.preventDefault();
		this.mouse.start = event.page;
		this.fireEvent('beforeStart', this.element);
		var limit = this.options.limit;
		this.limit = {x: [], y: []};
		for (var z in this.options.modifiers){
			if (!this.options.modifiers[z]) continue;
			if (this.options.style) this.value.now[z] = this.element.getStyle(this.options.modifiers[z]).toInt();
			else this.value.now[z] = this.element[this.options.modifiers[z]];
			if (this.options.invert) this.value.now[z] *= -1;
			this.mouse.pos[z] = event.page[z] - this.value.now[z];
			if (limit && limit[z]){
				for (var i = 2; i--; i){
					if ($chk(limit[z][i])) this.limit[z][i] = $lambda(limit[z][i])();
				}
			}
		}
		if ($type(this.options.grid) == 'number') this.options.grid = {x: this.options.grid, y: this.options.grid};
		this.document.addEvents({mousemove: this.bound.check, mouseup: this.bound.cancel});
		this.document.addEvent(this.selection, this.bound.eventStop);
	},

	check: function(event){
		if (this.options.preventDefault) event.preventDefault();
		var distance = Math.round(Math.sqrt(Math.pow(event.page.x - this.mouse.start.x, 2) + Math.pow(event.page.y - this.mouse.start.y, 2)));
		if (distance > this.options.snap){
			this.cancel();
			this.document.addEvents({
				mousemove: this.bound.drag,
				mouseup: this.bound.stop
			});
			this.fireEvent('start', [this.element, event]).fireEvent('snap', this.element);
		}
	},

	drag: function(event){
		if (this.options.preventDefault) event.preventDefault();
		this.mouse.now = event.page;
		for (var z in this.options.modifiers){
			if (!this.options.modifiers[z]) continue;
			this.value.now[z] = this.mouse.now[z] - this.mouse.pos[z];
			if (this.options.invert) this.value.now[z] *= -1;
			if (this.options.limit && this.limit[z]){
				if ($chk(this.limit[z][1]) && (this.value.now[z] > this.limit[z][1])){
					this.value.now[z] = this.limit[z][1];
				} else if ($chk(this.limit[z][0]) && (this.value.now[z] < this.limit[z][0])){
					this.value.now[z] = this.limit[z][0];
				}
			}
			if (this.options.grid[z]) this.value.now[z] -= ((this.value.now[z] - (this.limit[z][0]||0)) % this.options.grid[z]);
			if (this.options.style) this.element.setStyle(this.options.modifiers[z], this.value.now[z] + this.options.unit);
			else this.element[this.options.modifiers[z]] = this.value.now[z];
		}
		this.fireEvent('drag', [this.element, event]);
	},

	cancel: function(event){
		this.document.removeEvent('mousemove', this.bound.check);
		this.document.removeEvent('mouseup', this.bound.cancel);
		if (event){
			this.document.removeEvent(this.selection, this.bound.eventStop);
			this.fireEvent('cancel', this.element);
		}
	},

	stop: function(event){
		this.document.removeEvent(this.selection, this.bound.eventStop);
		this.document.removeEvent('mousemove', this.bound.drag);
		this.document.removeEvent('mouseup', this.bound.stop);
		if (event) this.fireEvent('complete', [this.element, event]);
	}

});

Element.implement({

	makeResizable: function(options){
		var drag = new Drag(this, $merge({modifiers: {x: 'width', y: 'height'}}, options));
		this.store('resizer', drag);
		return drag.addEvent('drag', function(){
			this.fireEvent('resize', drag);
		}.bind(this));
	}

});
/*
Script: Drag.Move.js
	A Drag extension that provides support for the constraining of draggables to containers and droppables.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
		Tom Occhinno
		Jan Kassens*/

Drag.Move = new Class({

	Extends: Drag,

	options: {/*
		onEnter: $empty(thisElement, overed),
		onLeave: $empty(thisElement, overed),
		onDrop: $empty(thisElement, overed, event),*/
		droppables: [],
		container: false,
		precalculate: false,
		includeMargins: true,
		checkDroppables: true
	},

	initialize: function(element, options){
		this.parent(element, options);
		this.droppables = $$(this.options.droppables);
		this.container = document.id(this.options.container);
		if (this.container && $type(this.container) != 'element') this.container = document.id(this.container.getDocument().body);

		var position = this.element.getStyle('position');
		if (position=='static') position = 'absolute';
		if ([this.element.getStyle('left'), this.element.getStyle('top')].contains('auto')) this.element.position(this.element.getPosition(this.element.offsetParent));
		this.element.setStyle('position', position);

		this.addEvent('start', this.checkDroppables, true);

		this.overed = null;
	},

	start: function(event){
		if (this.container){
			var ccoo = this.container.getCoordinates(this.element.getOffsetParent()), cbs = {}, ems = {};

			['top', 'right', 'bottom', 'left'].each(function(pad){
				cbs[pad] = this.container.getStyle('border-' + pad).toInt();
				ems[pad] = this.element.getStyle('margin-' + pad).toInt();
			}, this);

			var width = this.element.offsetWidth + ems.left + ems.right;
			var height = this.element.offsetHeight + ems.top + ems.bottom;

			if (this.options.includeMargins) {
				$each(ems, function(value, key) {
					ems[key] = 0;
				});
			}
			if (this.container == this.element.getOffsetParent()) {
				this.options.limit = {
					x: [0 - ems.left, ccoo.right - cbs.left - cbs.right - width + ems.right],
					y: [0 - ems.top, ccoo.bottom - cbs.top - cbs.bottom - height + ems.bottom]
				};
			} else {
				this.options.limit = {
					x: [ccoo.left + cbs.left - ems.left, ccoo.right - cbs.right - width + ems.right],
					y: [ccoo.top + cbs.top - ems.top, ccoo.bottom - cbs.bottom - height + ems.bottom]
				};
			}

		}
		if (this.options.precalculate){
			this.positions = this.droppables.map(function(el) {
				return el.getCoordinates();
			});
		}
		this.parent(event);
	},

	checkAgainst: function(el, i){
		el = (this.positions) ? this.positions[i] : el.getCoordinates();
		var now = this.mouse.now;
		return (now.x > el.left && now.x < el.right && now.y < el.bottom && now.y > el.top);
	},

	checkDroppables: function(){
		var overed = this.droppables.filter(this.checkAgainst, this).getLast();
		if (this.overed != overed){
			if (this.overed) this.fireEvent('leave', [this.element, this.overed]);
			if (overed) this.fireEvent('enter', [this.element, overed]);
			this.overed = overed;
		}
	},

	drag: function(event){
		this.parent(event);
		if (this.options.checkDroppables && this.droppables.length) this.checkDroppables();
	},

	stop: function(event){
		this.checkDroppables();
		this.fireEvent('drop', [this.element, this.overed, event]);
		this.overed = null;
		return this.parent(event);
	}

});

Element.implement({

	makeDraggable: function(options){
		var drag = new Drag.Move(this, options);
		this.store('dragger', drag);
		return drag;
	}

});
/*
Script: Slider.js
	Class for creating horizontal and vertical slider controls.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

var Slider = new Class({

	Implements: [Events, Options],

	Binds: ['clickedElement', 'draggedKnob', 'scrolledElement'],

	options: {/*
		onTick: $empty(intPosition),
		onChange: $empty(intStep),
		onComplete: $empty(strStep),*/
		onTick: function(position){
			if (this.options.snap) position = this.toPosition(this.step);
			this.knob.setStyle(this.property, position);
		},
		snap: false,
		offset: 0,
		range: false,
		wheel: false,
		steps: 100,
		mode: 'horizontal'
	},

	initialize: function(element, knob, options){
		this.setOptions(options);
		this.element = document.id(element);
		this.knob = document.id(knob);
		this.previousChange = this.previousEnd = this.step = -1;
		var offset, limit = {}, modifiers = {'x': false, 'y': false};
		switch (this.options.mode){
			case 'vertical':
				this.axis = 'y';
				this.property = 'top';
				offset = 'offsetHeight';
				break;
			case 'horizontal':
				this.axis = 'x';
				this.property = 'left';
				offset = 'offsetWidth';
		}
		this.half = this.knob[offset] / 2;
		this.full = this.element[offset] - this.knob[offset] + (this.options.offset * 2);
		this.min = $chk(this.options.range[0]) ? this.options.range[0] : 0;
		this.max = $chk(this.options.range[1]) ? this.options.range[1] : this.options.steps;
		this.range = this.max - this.min;
		this.steps = this.options.steps || this.full;
		this.stepSize = Math.abs(this.range) / this.steps;
		this.stepWidth = this.stepSize * this.full / Math.abs(this.range) ;

		this.knob.setStyle('position', 'relative').setStyle(this.property, - this.options.offset);
		modifiers[this.axis] = this.property;
		limit[this.axis] = [- this.options.offset, this.full - this.options.offset];

		this.bound = {
			clickedElement: this.clickedElement.bind(this),
			scrolledElement: this.scrolledElement.bindWithEvent(this),
			draggedKnob: this.draggedKnob.bind(this)
		};

		var dragOptions = {
			snap: 0,
			limit: limit,
			modifiers: modifiers,
			onDrag: this.bound.draggedKnob,
			onStart: this.bound.draggedKnob,
			onBeforeStart: (function(){
				this.isDragging = true;
			}).bind(this),
			onComplete: function(){
				this.isDragging = false;
				this.draggedKnob();
				this.end();
			}.bind(this)
		};
		if (this.options.snap){
			dragOptions.grid = Math.ceil(this.stepWidth);
			dragOptions.limit[this.axis][1] = this.full;
		}

		this.drag = new Drag(this.knob, dragOptions);
		this.attach();
	},

	attach: function(){
		this.element.addEvent('mousedown', this.bound.clickedElement);
		if (this.options.wheel) this.element.addEvent('mousewheel', this.bound.scrolledElement);
		this.drag.attach();
		return this;
	},

	detach: function(){
		this.element.removeEvent('mousedown', this.bound.clickedElement);
		this.element.removeEvent('mousewheel', this.bound.scrolledElement);
		this.drag.detach();
		return this;
	},

	set: function(step){
		if (!((this.range > 0) ^ (step < this.min))) step = this.min;
		if (!((this.range > 0) ^ (step > this.max))) step = this.max;

		this.step = Math.round(step);
		this.checkStep();
		this.fireEvent('tick', this.toPosition(this.step));
		this.end();
		return this;
	},

	clickedElement: function(event){
		if (this.isDragging || event.target == this.knob) return;

		var dir = this.range < 0 ? -1 : 1;
		var position = event.page[this.axis] - this.element.getPosition()[this.axis] - this.half;
		position = position.limit(-this.options.offset, this.full -this.options.offset);

		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep();
		this.fireEvent('tick', position);
		this.end();
	},

	scrolledElement: function(event){
		var mode = (this.options.mode == 'horizontal') ? (event.wheel < 0) : (event.wheel > 0);
		this.set(mode ? this.step - this.stepSize : this.step + this.stepSize);
		event.stop();
	},

	draggedKnob: function(){
		var dir = this.range < 0 ? -1 : 1;
		var position = this.drag.value.now[this.axis];
		position = position.limit(-this.options.offset, this.full -this.options.offset);
		this.step = Math.round(this.min + dir * this.toStep(position));
		this.checkStep();
	},

	checkStep: function(){
		if (this.previousChange != this.step){
			this.previousChange = this.step;
			this.fireEvent('change', this.step);
		}
	},

	end: function(){
		if (this.previousEnd !== this.step){
			this.previousEnd = this.step;
			this.fireEvent('complete', this.step + '');
		}
	},

	toStep: function(position){
		var step = (position + this.options.offset) * this.stepSize / this.full * this.steps;
		return this.options.steps ? Math.round(step -= step % this.stepSize) : step;
	},

	toPosition: function(step){
		return (this.full * Math.abs(this.min - step)) / (this.steps * this.stepSize) - this.options.offset;
	}

});/*
Script: Sortables.js
	Class for creating a drag and drop sorting interface for lists of items.

	License:
		MIT-style license.

	Authors:
		Tom Occhino
*/

var Sortables = new Class({

	Implements: [Events, Options],

	options: {/*
		onSort: $empty(element, clone),
		onStart: $empty(element, clone),
		onComplete: $empty(element),*/
		snap: 4,
		opacity: 1,
		clone: false,
		revert: false,
		handle: false,
		constrain: false
	},

	initialize: function(lists, options){
		this.setOptions(options);
		this.elements = [];
		this.lists = [];
		this.idle = true;

		this.addLists($$(document.id(lists) || lists));
		if (!this.options.clone) this.options.revert = false;
		if (this.options.revert) this.effect = new Fx.Morph(null, $merge({duration: 250, link: 'cancel'}, this.options.revert));
	},

	attach: function(){
		this.addLists(this.lists);
		return this;
	},

	detach: function(){
		this.lists = this.removeLists(this.lists);
		return this;
	},

	addItems: function(){
		Array.flatten(arguments).each(function(element){
			this.elements.push(element);
			var start = element.retrieve('sortables:start', this.start.bindWithEvent(this, element));
			(this.options.handle ? element.getElement(this.options.handle) || element : element).addEvent('mousedown', start);
		}, this);
		return this;
	},

	addLists: function(){
		Array.flatten(arguments).each(function(list){
			this.lists.push(list);
			this.addItems(list.getChildren());
		}, this);
		return this;
	},

	removeItems: function(){
		return $$(Array.flatten(arguments).map(function(element){
			this.elements.erase(element);
			var start = element.retrieve('sortables:start');
			(this.options.handle ? element.getElement(this.options.handle) || element : element).removeEvent('mousedown', start);
			
			return element;
		}, this));
	},

	removeLists: function(){
		return $$(Array.flatten(arguments).map(function(list){
			this.lists.erase(list);
			this.removeItems(list.getChildren());
			
			return list;
		}, this));
	},

	getClone: function(event, element){
		if (!this.options.clone) return new Element('div').inject(document.body);
		if ($type(this.options.clone) == 'function') return this.options.clone.call(this, event, element, this.list);
		return element.clone(true).setStyles({
			margin: '0px',
			position: 'absolute',
			visibility: 'hidden',
			'width': element.getStyle('width')
		}).inject(this.list).position(element.getPosition(element.getOffsetParent()));
	},

	getDroppables: function(){
		var droppables = this.list.getChildren();
		if (!this.options.constrain) droppables = this.lists.concat(droppables).erase(this.list);
		return droppables.erase(this.clone).erase(this.element);
	},

	insert: function(dragging, element){
		var where = 'inside';
		if (this.lists.contains(element)){
			this.list = element;
			this.drag.droppables = this.getDroppables();
		} else {
			where = this.element.getAllPrevious().contains(element) ? 'before' : 'after';
		}
		this.element.inject(element, where);
		this.fireEvent('sort', [this.element, this.clone]);
	},

	start: function(event, element){
		if (!this.idle) return;
		this.idle = false;
		this.element = element;
		this.opacity = element.get('opacity');
		this.list = element.getParent();
		this.clone = this.getClone(event, element);

		this.drag = new Drag.Move(this.clone, {
			snap: this.options.snap,
			container: this.options.constrain && this.element.getParent(),
			droppables: this.getDroppables(),
			onSnap: function(){
				event.stop();
				this.clone.setStyle('visibility', 'visible');
				this.element.set('opacity', this.options.opacity || 0);
				this.fireEvent('start', [this.element, this.clone]);
			}.bind(this),
			onEnter: this.insert.bind(this),
			onCancel: this.reset.bind(this),
			onComplete: this.end.bind(this)
		});

		this.clone.inject(this.element, 'before');
		this.drag.start(event);
	},

	end: function(){
		this.drag.detach();
		this.element.set('opacity', this.opacity);
		if (this.effect){
			var dim = this.element.getStyles('width', 'height');
			var pos = this.clone.computePosition(this.element.getPosition(this.clone.offsetParent));
			this.effect.element = this.clone;
			this.effect.start({
				top: pos.top,
				left: pos.left,
				width: dim.width,
				height: dim.height,
				opacity: 0.25
			}).chain(this.reset.bind(this));
		} else {
			this.reset();
		}
	},

	reset: function(){
		this.idle = true;
		this.clone.destroy();
		this.fireEvent('complete', this.element);
	},

	serialize: function(){
		var params = Array.link(arguments, {modifier: Function.type, index: $defined});
		var serial = this.lists.map(function(list){
			return list.getChildren().map(params.modifier || function(element){
				return element.get('id');
			}, this);
		}, this);

		var index = params.index;
		if (this.lists.length == 1) index = 0;
		return $chk(index) && index >= 0 && index < this.lists.length ? serial[index] : serial;
	}

});
/*
Script: Request.JSONP.js
	Defines Request.JSONP, a class for cross domain javascript via script injection.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
		Guillermo Rauch
*/

Request.JSONP = new Class({

	Implements: [Chain, Events, Options, Log],

	options: {/*
		onRetry: $empty(intRetries),
		onRequest: $empty(scriptElement),
		onComplete: $empty(data),
		onSuccess: $empty(data),
		onCancel: $empty(),*/
		url: '',
		data: {},
		retries: 0,
		timeout: 0,
		link: 'ignore',
		callbackKey: 'callback',
		injectScript: document.head
	},

	initialize: function(options){
		this.setOptions(options);
		this.running = false;
		this.requests = 0;
		this.triesRemaining = [];
	},

	check: function(){
		if (!this.running) return true;
		switch (this.options.link){
			case 'cancel': this.cancel(); return true;
			case 'chain': this.chain(this.caller.bind(this, arguments)); return false;
		}
		return false;
	},

	send: function(options){
		if (!$chk(arguments[1]) && !this.check(options)) return this;

		var type = $type(options), old = this.options, index = $chk(arguments[1]) ? arguments[1] : this.requests++;
		if (type == 'string' || type == 'element') options = {data: options};

		options = $extend({data: old.data, url: old.url}, options);

		if (!$chk(this.triesRemaining[index])) this.triesRemaining[index] = this.options.retries;
		var remaining = this.triesRemaining[index];

		(function(){
			var script = this.getScript(options);
			this.log('JSONP retrieving script with url: ' + script.get('src'));
			this.fireEvent('request', script);
			this.running = true;

			(function(){
				if (remaining){
					this.triesRemaining[index] = remaining - 1;
					if (script){
						script.destroy();
						this.send(options, index);
						this.fireEvent('retry', this.triesRemaining[index]);
					}
				} else if(script && this.options.timeout){
					script.destroy();
					this.cancel();
					this.fireEvent('failure');
				}
			}).delay(this.options.timeout, this);
		}).delay(Browser.Engine.trident ? 50 : 0, this);
		return this;
	},

	cancel: function(){
		if (!this.running) return this;
		this.running = false;
		this.fireEvent('cancel');
		return this;
	},

	getScript: function(options){
		var index = Request.JSONP.counter, data;
		Request.JSONP.counter++;

		switch ($type(options.data)){
			case 'element': data = document.id(options.data).toQueryString(); break;
			case 'object': case 'hash': data = Hash.toQueryString(options.data);
		}

		var src = options.url + 
			 (options.url.test('\\?') ? '&' :'?') + 
			 (options.callbackKey || this.options.callbackKey) + 
			 '=Request.JSONP.request_map.request_'+ index + 
			 (data ? '&' + data : '');
		if (src.length > 2083) this.log('JSONP '+ src +' will fail in Internet Explorer, which enforces a 2083 bytes length limit on URIs');

		var script = new Element('script', {type: 'text/javascript', src: src});
		Request.JSONP.request_map['request_' + index] = function(data){ this.success(data, script); }.bind(this);
		return script.inject(this.options.injectScript);
	},

	success: function(data, script){
		if (script) script.destroy();
		this.running = false;
		this.log('JSONP successfully retrieved: ', data);
		this.fireEvent('complete', [data]).fireEvent('success', [data]).callChain();
	}

});

Request.JSONP.counter = 0;
Request.JSONP.request_map = {};/*
Script: Request.Queue.js
	Controls several instances of Request and its variants to run only one request at a time.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

Request.Queue = new Class({

	Implements: [Options, Events],

	Binds: ['attach', 'request', 'complete', 'cancel', 'success', 'failure', 'exception'],

	options: {/*
		onRequest: $empty(argsPassedToOnRequest),
		onSuccess: $empty(argsPassedToOnSuccess),
		onComplete: $empty(argsPassedToOnComplete),
		onCancel: $empty(argsPassedToOnCancel),
		onException: $empty(argsPassedToOnException),
		onFailure: $empty(argsPassedToOnFailure),*/
		stopOnFailure: true,
		autoAdvance: true,
		concurrent: 1,
		requests: {}
	},

	initialize: function(options){
		this.setOptions(options);
		this.requests = new Hash;
		this.addRequests(this.options.requests);
		this.queue = [];
		this.reqBinders = {};
	},

	addRequest: function(name, request){
		this.requests.set(name, request);
		this.attach(name, request);
		return this;
	},

	addRequests: function(obj){
		$each(obj, function(req, name){
			this.addRequest(name, req);
		}, this);
		return this;
	},

	getName: function(req){
		return this.requests.keyOf(req);
	},

	attach: function(name, req){
		if (req._groupSend) return this;
		['request', 'complete', 'cancel', 'success', 'failure', 'exception'].each(function(evt){
			if(!this.reqBinders[name]) this.reqBinders[name] = {};
			this.reqBinders[name][evt] = function(){
				this['on' + evt.capitalize()].apply(this, [name, req].extend(arguments));
			}.bind(this);
			req.addEvent(evt, this.reqBinders[name][evt]);
		}, this);
		req._groupSend = req.send;
		req.send = function(options){
			this.send(name, options);
			return req;
		}.bind(this);
		return this;
	},

	removeRequest: function(req){
		var name = $type(req) == 'object' ? this.getName(req) : req;
		if (!name && $type(name) != 'string') return this;
		req = this.requests.get(name);
		if (!req) return this;
		['request', 'complete', 'cancel', 'success', 'failure', 'exception'].each(function(evt){
			req.removeEvent(evt, this.reqBinders[name][evt]);
		}, this);
		req.send = req._groupSend;
		delete req._groupSend;
		return this;
	},

	getRunning: function(){
		return this.requests.filter(function(r){ return r.running; });
	},

	isRunning: function(){
		return !!this.getRunning().getKeys().length;
	},

	send: function(name, options){
		var q = function(){
			this.requests.get(name)._groupSend(options);
			this.queue.erase(q);
		}.bind(this);
		q.name = name;
		if (this.getRunning().getKeys().length >= this.options.concurrent || (this.error && this.options.stopOnFailure)) this.queue.push(q);
		else q();
		return this;
	},

	hasNext: function(name){
		return (!name) ? !!this.queue.length : !!this.queue.filter(function(q){ return q.name == name; }).length;
	},

	resume: function(){
		this.error = false;
		(this.options.concurrent - this.getRunning().getKeys().length).times(this.runNext, this);
		return this;
	},

	runNext: function(name){
		if (!this.queue.length) return this;
		if (!name){
			this.queue[0]();
		} else {
			var found;
			this.queue.each(function(q){
				if (!found && q.name == name){
					found = true;
					q();
				}
			});
		}
		return this;
	},

	runAll: function() {
		this.queue.each(function(q) {
			q();
		});
		return this;
	},

	clear: function(name){
		if (!name){
			this.queue.empty();
		} else {
			this.queue = this.queue.map(function(q){
				if (q.name != name) return q;
				else return false;
			}).filter(function(q){ return q; });
		}
		return this;
	},

	cancel: function(name){
		this.requests.get(name).cancel();
		return this;
	},

	onRequest: function(){
		this.fireEvent('request', arguments);
	},

	onComplete: function(){
		this.fireEvent('complete', arguments);
	},

	onCancel: function(){
		if (this.options.autoAdvance && !this.error) this.runNext();
		this.fireEvent('cancel', arguments);
	},

	onSuccess: function(){
		if (this.options.autoAdvance && !this.error) this.runNext();
		this.fireEvent('success', arguments);
	},

	onFailure: function(){
		this.error = true;
		if (!this.options.stopOnFailure && this.options.autoAdvance) this.runNext();
		this.fireEvent('failure', arguments);
	},

	onException: function(){
		this.error = true;
		if (!this.options.stopOnFailure && this.options.autoAdvance) this.runNext();
		this.fireEvent('exception', arguments);
	}

});
/*
Script: Request.Periodical.js
	Requests the same url at a time interval that increases when no data is returned from the requested server

	License:
		MIT-style license.

	Authors:
		Christoph Pojer

*/

Request.implement({

	options: {
		initialDelay: 5000,
		delay: 5000,
		limit: 60000
	},

	startTimer: function(data){
		var fn = (function(){
			if (!this.running) this.send({data: data});
		});
		this.timer = fn.delay(this.options.initialDelay, this);
		this.lastDelay = this.options.initialDelay;
		this.completeCheck = function(j){
			$clear(this.timer);
			if (j) this.lastDelay = this.options.delay;
			else this.lastDelay = (this.lastDelay+this.options.delay).min(this.options.limit);
			this.timer = fn.delay(this.lastDelay, this);
		};
		this.addEvent('complete', this.completeCheck);
		return this;
	},

	stopTimer: function(){
		$clear(this.timer);
		this.removeEvent('complete', this.completeCheck);
		return this;
	}

});/*
Script: Assets.js
	Provides methods to dynamically load JavaScript, CSS, and Image files into the document.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

var Asset = {

	javascript: function(source, properties){
		properties = $extend({
			onload: $empty,
			document: document,
			check: $lambda(true)
		}, properties);

		var script = new Element('script', {src: source, type: 'text/javascript'});

		var load = properties.onload.bind(script), check = properties.check, doc = properties.document;
		delete properties.onload; delete properties.check; delete properties.document;

		script.addEvents({
			load: load,
			readystatechange: function(){
				if (['loaded', 'complete'].contains(this.readyState)) load();
			}
		}).set(properties);

		if (Browser.Engine.webkit419) var checker = (function(){
			if (!$try(check)) return;
			$clear(checker);
			load();
		}).periodical(50);

		return script.inject(doc.head);
	},

	css: function(source, properties){
		return new Element('link', $merge({
			rel: 'stylesheet', media: 'screen', type: 'text/css', href: source
		}, properties)).inject(document.head);
	},

	image: function(source, properties){
		properties = $merge({
			onload: $empty,
			onabort: $empty,
			onerror: $empty
		}, properties);
		var image = new Image();
		var element = document.id(image) || new Element('img');
		['load', 'abort', 'error'].each(function(name){
			var type = 'on' + name;
			var event = properties[type];
			delete properties[type];
			image[type] = function(){
				if (!image) return;
				if (!element.parentNode){
					element.width = image.width;
					element.height = image.height;
				}
				image = image.onload = image.onabort = image.onerror = null;
				event.delay(1, element, element);
				element.fireEvent(name, element, 1);
			};
		});
		image.src = element.src = source;
		if (image && image.complete) image.onload.delay(1);
		return element.set(properties);
	},

	images: function(sources, options){
		options = $merge({
			onComplete: $empty,
			onProgress: $empty,
			onError: $empty,
			properties: {}
		}, options);
		sources = $splat(sources);
		var images = [];
		var counter = 0;
		return new Elements(sources.map(function(source){
			return Asset.image(source, $extend(options.properties, {
				onload: function(){
					options.onProgress.call(this, counter, sources.indexOf(source));
					counter++;
					if (counter == sources.length) options.onComplete();
				},
				onerror: function(){
					options.onError.call(this, counter, sources.indexOf(source));
					counter++;
					if (counter == sources.length) options.onComplete();
				}
			}));
		}));
	}

};/*
Script: Color.js
	Class for creating and manipulating colors in JavaScript. Supports HSB -> RGB Conversions and vice versa.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

var Color = new Native({

	initialize: function(color, type){
		if (arguments.length >= 3){
			type = 'rgb'; color = Array.slice(arguments, 0, 3);
		} else if (typeof color == 'string'){
			if (color.match(/rgb/)) color = color.rgbToHex().hexToRgb(true);
			else if (color.match(/hsb/)) color = color.hsbToRgb();
			else color = color.hexToRgb(true);
		}
		type = type || 'rgb';
		switch (type){
			case 'hsb':
				var old = color;
				color = color.hsbToRgb();
				color.hsb = old;
			break;
			case 'hex': color = color.hexToRgb(true); break;
		}
		color.rgb = color.slice(0, 3);
		color.hsb = color.hsb || color.rgbToHsb();
		color.hex = color.rgbToHex();
		return $extend(color, this);
	}

});

Color.implement({

	mix: function(){
		var colors = Array.slice(arguments);
		var alpha = ($type(colors.getLast()) == 'number') ? colors.pop() : 50;
		var rgb = this.slice();
		colors.each(function(color){
			color = new Color(color);
			for (var i = 0; i < 3; i++) rgb[i] = Math.round((rgb[i] / 100 * (100 - alpha)) + (color[i] / 100 * alpha));
		});
		return new Color(rgb, 'rgb');
	},

	invert: function(){
		return new Color(this.map(function(value){
			return 255 - value;
		}));
	},

	setHue: function(value){
		return new Color([value, this.hsb[1], this.hsb[2]], 'hsb');
	},

	setSaturation: function(percent){
		return new Color([this.hsb[0], percent, this.hsb[2]], 'hsb');
	},

	setBrightness: function(percent){
		return new Color([this.hsb[0], this.hsb[1], percent], 'hsb');
	}

});

var $RGB = function(r, g, b){
	return new Color([r, g, b], 'rgb');
};

var $HSB = function(h, s, b){
	return new Color([h, s, b], 'hsb');
};

var $HEX = function(hex){
	return new Color(hex, 'hex');
};

Array.implement({

	rgbToHsb: function(){
		var red = this[0], green = this[1], blue = this[2];
		var hue, saturation, brightness;
		var max = Math.max(red, green, blue), min = Math.min(red, green, blue);
		var delta = max - min;
		brightness = max / 255;
		saturation = (max != 0) ? delta / max : 0;
		if (saturation == 0){
			hue = 0;
		} else {
			var rr = (max - red) / delta;
			var gr = (max - green) / delta;
			var br = (max - blue) / delta;
			if (red == max) hue = br - gr;
			else if (green == max) hue = 2 + rr - br;
			else hue = 4 + gr - rr;
			hue /= 6;
			if (hue < 0) hue++;
		}
		return [Math.round(hue * 360), Math.round(saturation * 100), Math.round(brightness * 100)];
	},

	hsbToRgb: function(){
		var br = Math.round(this[2] / 100 * 255);
		if (this[1] == 0){
			return [br, br, br];
		} else {
			var hue = this[0] % 360;
			var f = hue % 60;
			var p = Math.round((this[2] * (100 - this[1])) / 10000 * 255);
			var q = Math.round((this[2] * (6000 - this[1] * f)) / 600000 * 255);
			var t = Math.round((this[2] * (6000 - this[1] * (60 - f))) / 600000 * 255);
			switch (Math.floor(hue / 60)){
				case 0: return [br, t, p];
				case 1: return [q, br, p];
				case 2: return [p, br, t];
				case 3: return [p, q, br];
				case 4: return [t, p, br];
				case 5: return [br, p, q];
			}
		}
		return false;
	}

});

String.implement({

	rgbToHsb: function(){
		var rgb = this.match(/\d{1,3}/g);
		return (rgb) ? rgb.rgbToHsb() : null;
	},

	hsbToRgb: function(){
		var hsb = this.match(/\d{1,3}/g);
		return (hsb) ? hsb.hsbToRgb() : null;
	}

});
/*
Script: Group.js
	Class for monitoring collections of events

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

var Group = new Class({

	initialize: function(){
		this.instances = Array.flatten(arguments);
		this.events = {};
		this.checker = {};
	},

	addEvent: function(type, fn){
		this.checker[type] = this.checker[type] || {};
		this.events[type] = this.events[type] || [];
		if (this.events[type].contains(fn)) return false;
		else this.events[type].push(fn);
		this.instances.each(function(instance, i){
			instance.addEvent(type, this.check.bind(this, [type, instance, i]));
		}, this);
		return this;
	},

	check: function(type, instance, i){
		this.checker[type][i] = true;
		var every = this.instances.every(function(current, j){
			return this.checker[type][j] || false;
		}, this);
		if (!every) return;
		this.checker[type] = {};
		this.events[type].each(function(event){
			event.call(this, this.instances, instance);
		}, this);
	}

});
/*
Script: Hash.Cookie.js
	Class for creating, reading, and deleting Cookies in JSON format.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
		Aaron Newton
*/

Hash.Cookie = new Class({

	Extends: Cookie,

	options: {
		autoSave: true
	},

	initialize: function(name, options){
		this.parent(name, options);
		this.load();
	},

	save: function(){
		var value = JSON.encode(this.hash);
		if (!value || value.length > 4096) return false; //cookie would be truncated!
		if (value == '{}') this.dispose();
		else this.write(value);
		return true;
	},

	load: function(){
		this.hash = new Hash(JSON.decode(this.read(), true));
		return this;
	}

});

Hash.each(Hash.prototype, function(method, name){
	if (typeof method == 'function') Hash.Cookie.implement(name, function(){
		var value = method.apply(this.hash, arguments);
		if (this.options.autoSave) this.save();
		return value;
	});
});/*
Script: IframeShim.js
	Defines IframeShim, a class for obscuring select lists and flash objects in IE.

	License:
		MIT-style license.

	Authors:
		Aaron Newton
*/

var IframeShim = new Class({

	Implements: [Options, Events, Class.Occlude],

	options: {
		className: 'iframeShim',
		display: false,
		zIndex: null,
		margin: 0,
		offset: {x: 0, y: 0},
		browsers: (Browser.Engine.trident4 || (Browser.Engine.gecko && !Browser.Engine.gecko19 && Browser.Platform.mac))
	},

	property: 'IframeShim',

	initialize: function(element, options){
		this.element = document.id(element);
		if (this.occlude()) return this.occluded;
		this.setOptions(options);
		this.makeShim();
		return this;
	},

	makeShim: function(){
		if(this.options.browsers){
			var zIndex = this.element.getStyle('zIndex').toInt();

			if (!zIndex){
				zIndex = 1;
				var pos = this.element.getStyle('position');
				if (pos == 'static' || !pos) this.element.setStyle('position', 'relative');
				this.element.setStyle('zIndex', zIndex);
			}
			zIndex = ($chk(this.options.zIndex) && zIndex > this.options.zIndex) ? this.options.zIndex : zIndex - 1;
			if (zIndex < 0) zIndex = 1;
			this.shim = new Element('iframe', {
				src:'javascript:false;document.write("");',
				scrolling: 'no',
				frameborder: 0,
				styles: {
					zIndex: zIndex,
					position: 'absolute',
					border: 'none',
					filter: 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)'
				},
				'class': this.options.className
			}).store('IframeShim', this);
			var inject = (function(){
				this.shim.inject(this.element, 'after');
				this[this.options.display ? 'show' : 'hide']();
				this.fireEvent('inject');
			}).bind(this);
			if (Browser.Engine.trident && !IframeShim.ready) window.addEvent('load', inject);
			else inject();
		} else {
			this.position = this.hide = this.show = this.dispose = $lambda(this);
		}
	},

	position: function(){
		if (!IframeShim.ready) return this;
		var size = this.element.measure(function(){ return this.getSize(); });
		if ($type(this.options.margin)){
			size.x = size.x - (this.options.margin * 2);
			size.y = size.y - (this.options.margin * 2);
			this.options.offset.x += this.options.margin;
			this.options.offset.y += this.options.margin;
		}
		if (this.shim) {
			this.shim.set({width: size.x, height: size.y}).position({
				relativeTo: this.element,
				offset: this.options.offset
			});
		}
		return this;
	},

	hide: function(){
		if (this.shim) this.shim.setStyle('display', 'none');
		return this;
	},

	show: function(){
		if (this.shim) this.shim.setStyle('display', 'block');
		return this.position();
	},

	dispose: function(){
		if (this.shim) this.shim.dispose();
		return this;
	},

	destroy: function(){
		if (this.shim) this.shim.destroy();
		return this;
	}

});

window.addEvent('load', function(){
	IframeShim.ready = true;
});/*
Script: Scroller.js
	Class which scrolls the contents of any Element (including the window) when the mouse reaches the Element's boundaries.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
*/

var Scroller = new Class({

	Implements: [Events, Options],

	options: {
		area: 20,
		velocity: 1,
		onChange: function(x, y){
			this.element.scrollTo(x, y);
		},
		fps: 50
	},

	initialize: function(element, options){
		this.setOptions(options);
		this.element = document.id(element);
		this.listener = ($type(this.element) != 'element') ? document.id(this.element.getDocument().body) : this.element;
		this.timer = null;
		this.bound = {
			attach: this.attach.bind(this),
			detach: this.detach.bind(this),
			getCoords: this.getCoords.bind(this)
		};
	},

	start: function(){
		this.listener.addEvents({
			mouseenter: this.bound.attach,
			mouseleave: this.bound.detach
		});
	},

	stop: function(){
		this.listener.removeEvents({
			mouseenter: this.bound.attach,
			mouseleave: this.bound.detach
		});
		this.timer = $clear(this.timer);
	},

	attach: function(){
		this.listener.addEvent('mousemove', this.bound.getCoords);
	},

	detach: function(){
		this.listener.removeEvent('mousemove', this.bound.getCoords);
		this.timer = $clear(this.timer);
	},

	getCoords: function(event){
		this.page = (this.listener.get('tag') == 'body') ? event.client : event.page;
		if (!this.timer) this.timer = this.scroll.periodical(Math.round(1000 / this.options.fps), this);
	},

	scroll: function(){
		var size = this.element.getSize(), 
			scroll = this.element.getScroll(), 
			pos = this.element.getOffsets(), 
			scrollSize = this.element.getScrollSize(), 
			change = {x: 0, y: 0};
		for (var z in this.page){
			if (this.page[z] < (this.options.area + pos[z]) && scroll[z] != 0)
				change[z] = (this.page[z] - this.options.area - pos[z]) * this.options.velocity;
			else if (this.page[z] + this.options.area > (size[z] + pos[z]) && scroll[z] + size[z] != scrollSize[z])
				change[z] = (this.page[z] - size[z] + this.options.area - pos[z]) * this.options.velocity;
		}
		if (change.y || change.x) this.fireEvent('change', [scroll.x + change.x, scroll.y + change.y]);
	}

});/*
Script: Tips.js
	Class for creating nice tips that follow the mouse cursor when hovering an element.

	License:
		MIT-style license.

	Authors:
		Valerio Proietti
		Christoph Pojer
*/

var Tips = new Class({

	Implements: [Events, Options],

	options: {
		onShow: function(tip){
			tip.setStyle('visibility', 'visible');
		},
		onHide: function(tip){
			tip.setStyle('visibility', 'hidden');
		},
		title: 'title',
		text: function(el){
			return el.get('rel') || el.get('href');
		},
		showDelay: 100,
		hideDelay: 100,
		className: null,
		offset: {x: 16, y: 16},
		fixed: false
	},

	initialize: function(){
		var params = Array.link(arguments, {options: Object.type, elements: $defined});
		if (params.options && params.options.offsets) params.options.offset = params.options.offsets;
		this.setOptions(params.options);
		this.container = new Element('div', {'class': 'tip'});
		this.tip = this.getTip();
		
		if (params.elements) this.attach(params.elements);
	},

	getTip: function(){
		return new Element('div', {
			'class': this.options.className,
			styles: {
				visibility: 'hidden',
				display: 'none',
				position: 'absolute',
				top: 0,
				left: 0
			}
		}).adopt(
			new Element('div', {'class': 'tip-top'}),
			this.container,
			new Element('div', {'class': 'tip-bottom'})
		).inject(document.body);
	},

	attach: function(elements){
		var read = function(option, element){
			if (option == null) return '';
			return $type(option) == 'function' ? option(element) : element.get(option);
		};
		$$(elements).each(function(element){
			var title = read(this.options.title, element);
			element.erase('title').store('tip:native', title).retrieve('tip:title', title);
			element.retrieve('tip:text', read(this.options.text, element));
			
			var events = ['enter', 'leave'];
			if (!this.options.fixed) events.push('move');
			
			events.each(function(value){
				element.addEvent('mouse' + value, element.retrieve('tip:' + value, this['element' + value.capitalize()].bindWithEvent(this, element)));
			}, this);
		}, this);
		
		return this;
	},

	detach: function(elements){
		$$(elements).each(function(element){
			['enter', 'leave', 'move'].each(function(value){
				element.removeEvent('mouse' + value, element.retrieve('tip:' + value) || $empty);
			});
			
			element.eliminate('tip:enter').eliminate('tip:leave').eliminate('tip:move');
			
			if ($type(this.options.title) == 'string' && this.options.title == 'title'){
				var original = element.retrieve('tip:native');
				if (original) element.set('title', original);
			}
		}, this);
		
		return this;
	},

	elementEnter: function(event, element){
		$A(this.container.childNodes).each(Element.dispose);
		
		['title', 'text'].each(function(value){
			var content = element.retrieve('tip:' + value);
			if (!content) return;
			
			this[value + 'Element'] = new Element('div', {'class': 'tip-' + value}).inject(this.container);
			this.fill(this[value + 'Element'], content);
		}, this);
		
		this.timer = $clear(this.timer);
		this.timer = this.show.delay(this.options.showDelay, this, element);
		this.tip.setStyle('display', 'block');
		this.position((!this.options.fixed) ? event : {page: element.getPosition()});
	},

	elementLeave: function(event, element){
		$clear(this.timer);
		this.tip.setStyle('display', 'none');
		this.timer = this.hide.delay(this.options.hideDelay, this, element);
	},

	elementMove: function(event){
		this.position(event);
	},

	position: function(event){
		var size = window.getSize(), scroll = window.getScroll(),
			tip = {x: this.tip.offsetWidth, y: this.tip.offsetHeight},
			props = {x: 'left', y: 'top'},
			obj = {};
		
		for (var z in props){
			obj[props[z]] = event.page[z] + this.options.offset[z];
			if ((obj[props[z]] + tip[z] - scroll[z]) > size[z]) obj[props[z]] = event.page[z] - this.options.offset[z] - tip[z];
		}
		
		this.tip.setStyles(obj);
	},

	fill: function(element, contents){
		if(typeof contents == 'string') element.set('html', contents);
		else element.adopt(contents);
	},

	show: function(el){
		this.fireEvent('show', [this.tip, el]);
	},

	hide: function(el){
		this.fireEvent('hide', [this.tip, el]);
	}

});// $Id: common.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx
 * Jx is a global singleton object that contains the entire Jx library
 * within it.  All Jx functions, attributes and classes are accessed
 * through the global Jx object.  Jx should not create any other
 * global variables, if you discover that it does then please report
 * it as a bug
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
 
/* firebug console supressor for IE/Safari/Opera */
window.addEvent('load', function() {
    if (!("console" in window) || !("firebug" in window.console)) {
        var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
        "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

        window.console = {};
        for (var i = 0; i < names.length; ++i) {
            window.console[names[i]] = function() {};
        }
    }
});
/* inspired by extjs, apparently removes css image flicker and related problems in IE 6 */
/* This is already done in mootools Source/Core/Browser.js  KASI*/
/*
(function() {
    var ua = navigator.userAgent.toLowerCase();
    var isIE = ua.indexOf("msie") > -1,
        isIE7 = ua.indexOf("msie 7") > -1;
    if(isIE && !isIE7) {
        try {
            document.execCommand("BackgroundImageCache", false, true);
        } catch(e) {}
    }    
})();
*/

Class.Mutators.Family = function(self,name) {
    if ($defined(name)){
        self.jxFamily = name;
        return self;
    }
    else {   
        this.implement({'jxFamily':self});
    }
};
function $unlink(object){
    if (object && object.jxFamily){
        return object
    }    
    var unlinked;
    switch ($type(object)){
        case 'object':
            unlinked = {};
            for (var p in object) unlinked[p] = $unlink(object[p]);
        break;
        case 'hash':
            unlinked = new Hash(object);
        break;
        case 'array':
            unlinked = [];
            for (var i = 0, l = object.length; i < l; i++) unlinked[i] = $unlink(object[i]);
        break;
        default: return object;
    }
    return unlinked;
};

/* Setup global namespace
 * If jxcore is loaded by jx.js, then the namespace and baseURL are
 * already established
 */
if (typeof Jx === 'undefined') {
    var Jx = {};
    (function() {
        var aScripts = document.getElementsByTagName('SCRIPT');
        for (var i=0; i<aScripts.length; i++) {
            var s = aScripts[i].src;
            var matches = /(.*[jx|js|lib])\/jxlib(.*)/.exec(s);
            if (matches && matches[0]) {
                /**
                 * Property: {String} baseURL
                 * This is the URL that Jx was loaded from, it is 
                 * automatically calculated from the script tag
                 * src property that included Jx.
                 *
                 * Note that this assumes that you are loading Jx
                 * from a js/ or lib/ folder in parallel to the
                 * images/ folder that contains the various images
                 * needed by Jx components.  If you have a different
                 * folder structure, you can define Jx's base
                 * by including the following before including
                 * the jxlib javascript file:
                 *
                 * (code)
                 * Jx = {
                 *    baseURL: 'some/path'
                 * }
                 * (end)
                 */ 
                 Jx.aPixel = document.createElement('img', {alt:'',title:''});
                 Jx.aPixel.src = matches[1]+'/a_pixel.png';
                 Jx.baseURL = Jx.aPixel.src.substring(0,
                     Jx.aPixel.src.indexOf('a_pixel.png'));
                
            }
        }
       
    })();
} 

(function(){
	/**
     * Determine if we're running in Adobe AIR. Run this regardless of whether the above runs
     * or not.
     */
    var aScripts = document.getElementsByTagName('SCRIPT');
    var src = aScripts[0].src;
    if (src.contains('app:')){
    	Jx.isAir = true;
    } else {
        Jx.isAir = false;
    }
})();

/**
 * Method: applyPNGFilter
 *
 * Static method that applies the PNG Filter Hack for IE browsers
 * when showing 24bit PNG's.  Used automatically for img tags with
 * a class of png24.
 *
 * The filter is applied using a nifty feature of IE that allows javascript to
 * be executed as part of a CSS style rule - this ensures that the hack only
 * gets applied on IE browsers.
 *
 * The CSS that triggers this hack is only in the ie6.css files of the various
 * themes.
 *
 * Parameters:
 * object {Object} the object (img) to which the filter needs to be applied.
 */
Jx.applyPNGFilter = function(o)  {
   var t=Jx.aPixel.src;
   if( o.src != t ) {
       var s=o.src;
       o.src = t;
       o.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+s+"',sizingMethod='scale')";
   }
};

/**
 * NOTE: We should consider moving the image loading code into a separate
 * class. Perhaps as Jx.Preloader which could extend Jx.Object
 */
Jx.imgQueue = [];   //The queue of images to be loaded
Jx.imgLoaded = {};  //a hash table of images that have been loaded and cached
Jx.imagesLoading = 0; //counter for number of concurrent image loads 

/**
 * Method: addToImgQueue
 * Request that an image be set to a DOM IMG element src attribute.  This puts 
 * the image into a queue and there are private methods to manage that queue
 * and limit image loading to 2 at a time.
 *
 * Parameters:
 * obj - {Object} an object containing an element and src
 * property, where element is the element to update and src
 * is the url to the image.
 */
Jx.addToImgQueue = function(obj) {
    if (Jx.imgLoaded[obj.src]) {
        //if this image was already requested (i.e. it's in cache) just set it directly
        obj.element.src = obj.src;
    } else {
        //otherwise stick it in the queue
        Jx.imgQueue.push(obj);
        Jx.imgLoaded[obj.src] = true;
    }
    //start the queue management process
    Jx.checkImgQueue();
};

/**
 * Method: checkImgQueue
 *
 * An internal method that ensures no more than 2 images are loading at a time.
 */
Jx.checkImgQueue = function() {
    while (Jx.imagesLoading < 2 && Jx.imgQueue.length > 0) {
        Jx.loadNextImg();
    }
};

/**
 * Method: loadNextImg
 *
 * An internal method actually populate the DOM element with the image source.
 */
Jx.loadNextImg = function() {
    var obj = Jx.imgQueue.shift();
    if (obj) {
        ++Jx.imagesLoading;
        obj.element.onload = function(){--Jx.imagesLoading; Jx.checkImgQueue();};
        obj.element.onerror = function(){--Jx.imagesLoading; Jx.checkImgQueue();};
        obj.element.src = obj.src;
    }
};

/**
 * Method: createIframeShim
 * Creates a new iframe element that is intended to fill a container
 * to mask out other operating system controls (scrollbars, inputs, 
 * buttons, etc) when HTML elements are supposed to be above them.
 *
 * Returns:
 * an HTML iframe element that can be inserted into the DOM.
 */
/**
 * NOTE: This could be replaced by Mootools-more's IFrameShim class.
 */
Jx.createIframeShim = function() {
    return new Element('iframe', {
        'class':'jxIframeShim',
        'scrolling':'no',
        'frameborder':0
    });
};
/**
 * Method: getNumber
 * safely parse a number and return its integer value.  A NaN value 
 * returns 0.  CSS size values are also parsed correctly.
 *
 * Parameters: 
 * n - {Mixed} the string or object to parse.
 *
 * Returns:
 * {Integer} the integer value that the parameter represents
 */
Jx.getNumber = function(n, def) {
  var result = n===null||isNaN(parseInt(n,10))?(def||0):parseInt(n,10);
  return result;
}

/**
 * Method: getPageDimensions
 * return the dimensions of the browser client area.
 *
 * Returns:
 * {Object} an object containing a width and height property 
 * that represent the width and height of the browser client area.
 */
Jx.getPageDimensions = function() {
    return {width: window.getWidth(), height: window.getHeight()};
}

Jx.type = function(obj){
    if (typeof obj == undefined){
        return false;
    }
    return obj.jxFamily ? obj.jxFamily : $type(obj);
}
/**
 * Class: Element
 *
 * Element is a global object provided by the mootools library.  The
 * functions documented here are extensions to the Element object provided
 * by Jx to make cross-browser compatibility easier to achieve.  Most of the
 * methods are measurement related.
 *
 * While the code in these methods has been converted to use MooTools methods,
 * there may be better MooTools methods to use to accomplish these things.
 * Ultimately, it would be nice to eliminate most or all of these and find the
 * MooTools equivalent or convince MooTools to add them.
 * 
 * NOTE: Many of these methods can be replaced with mootools-more's 
 * Element.Measure
 */
 
 
;(function($){ // Wrapper for document.id

    
Element.implement({
    /**
     * Method: getBoxSizing
     * return the box sizing of an element, one of 'content-box' or 
     *'border-box'.
     *
     * Parameters: 
     * elem - {Object} the element to get the box sizing of.
     *
     * Returns:
     * {String} the box sizing of the element.
     */
    getBoxSizing : function() {
      var result = 'content-box';
      if (Browser.Engine.trident || Browser.Engine.presto) { 
          var cm = document["compatMode"];
          if (cm == "BackCompat" || cm == "QuirksMode") { 
              result = 'border-box'; 
          } else {
              result = 'content-box'; 
        }
      } else {
          if (arguments.length === 0) {
              node = document.documentElement; 
          }
          var sizing = this.getStyle("-moz-box-sizing");
          if (!sizing) { 
              sizing = this.getStyle("box-sizing"); 
          }
          result = (sizing ? sizing : 'content-box');
      }
      return result;
    },
    /**
     * Method: getContentBoxSize
     * return the size of the content area of an element.  This is the size of
     * the element less margins, padding, and borders.
     *
     * Parameters: 
     * elem - {Object} the element to get the content size of.
     *
     * Returns:
     * {Object} an object with two properties, width and height, that
     * are the size of the content area of the measured element.
     */
    getContentBoxSize : function() {
        var w = this.offsetWidth;
        var h = this.offsetHeight;
        var s = this.getSizes(['padding','border']);
        w = w - s.padding.left - s.padding.right - s.border.left - s.border.right;
        h = h - s.padding.bottom - s.padding.top - s.border.bottom - s.border.top;
        return {width: w, height: h};
    },
    /**
     * Method: getBorderBoxSize
     * return the size of the border area of an element.  This is the size of
     * the element less margins.
     *
     * Parameters: 
     * elem - {Object} the element to get the border sizing of.
     *
     * Returns:
     * {Object} an object with two properties, width and height, that
     * are the size of the border area of the measured element.
     */
    getBorderBoxSize: function() {
        var w = this.offsetWidth;
        var h = this.offsetHeight;
        return {width: w, height: h}; 
    },
    
    /**
     * Method: getMarginBoxSize
     * return the size of the margin area of an element.  This is the size of
     * the element plus margins.
     *
     * Parameters: 
     * elem - {Object} the element to get the margin sizing of.
     *
     * Returns:
     * {Object} an object with two properties, width and height, that
     * are the size of the margin area of the measured element.
     */
    getMarginBoxSize: function() {
        var s = this.getSizes(['margin']);
        var w = this.offsetWidth + s.margin.left + s.margin.right;
        var h = this.offsetHeight + s.margin.top + s.margin.bottom;
        return {width: w, height: h};
    },
    /**
     * Method: getSizes
     * measure the size of various styles on various edges and return
     * the values.
     *
     * Parameters:
     * styles - array, the styles to compute.  By default, this is ['padding',
     *     'border','margin'].  If you don't need all the styles, just request
     *     the ones you need to minimize compute time required.
     * edges - array, the edges to compute styles for.  By default,  this is
     *     ['top','right','bottom','left'].  If you don't need all the edges,
     *     then request the ones you need to minimize compute time.
     *
     * Returns:
     * {Object} an object with one member for each requested style.  Each
     * style member is an object containing members for each requested edge.
     * Values are the computed style for each edge in pixels.
     */
    getSizes: function(which, edges) {
      which = which || ['padding','border','margin'];
      edges = edges || ['left','top','right','bottom'];
      var result={};
      which.each(function(style) {
        result[style]={};
        edges.each(function(edge) {
            var e = (style == 'border') ? edge + '-width' : edge;
            var n = this.getStyle(style+'-'+e);
            result[style][edge] = n===null||isNaN(parseInt(n,10))?0:parseInt(n,10);
        }, this);
      }, this);
      return result;
    },    
    /**
     * Method: setContentBoxSize
     * set either or both of the width and height of an element to
     * the provided size.  This function ensures that the content
     * area of the element is the requested size and the resulting
     * size of the element may be larger depending on padding and
     * borders.
     *
     * Parameters: 
     * elem - {Object} the element to set the content area of.
     * size - {Object} an object with a width and/or height property that is the size to set
     * the content area of the element to.
     */
    setContentBoxSize : function(size) {
        if (this.getBoxSizing() == 'border-box') {
            var m = this.measure(function() {
                return this.getSizes(['padding','border']);
            });
            if ($defined(size.width)) {
                var width = size.width + m.padding.left + m.padding.right + m.border.left + m.border.right;
                if (width < 0) {
                    width = 0;
                }
                this.style.width = width + 'px';
            }
            if ($defined(size.height)) {
                var height = size.height + m.padding.top + m.padding.bottom + m.border.top + m.border.bottom;
                if (height < 0) {
                    height = 0;
                }
                this.style.height = height + 'px';
            }
        } else {
            if ($defined(size.width) && size.width >= 0) {
                this.style.width = size.width + 'px';
            }
            if ($defined(size.height) && size.height >= 0) {
                this.style.height = size.height + 'px';
            }
        }
    },
    /**
     * Method: setBorderBoxSize
     * set either or both of the width and height of an element to
     * the provided size.  This function ensures that the border
     * size of the element is the requested size and the resulting
     * content areaof the element may be larger depending on padding and
     * borders.
     *
     * Parameters: 
     * elem - {Object} the element to set the border size of.
     * size - {Object} an object with a width and/or height property that is the size to set
     * the content area of the element to.
     */
    setBorderBoxSize : function(size) {
      if (this.getBoxSizing() == 'content-box') {
          var m = this.measure(function() {
              return this.getSizes();
          });
          
        if ($defined(size.width)) {
          var width = size.width - m.padding.left - m.padding.right - m.border.left - m.border.right - m.margin.left - m.margin.right;
          if (width < 0) {
            width = 0;
          }
          this.style.width = width + 'px';
        }
        if ($defined(size.height)) {
          var height = size.height - m.padding.top - m.padding.bottom - m.border.top - m.border.bottom - m.margin.top - m.margin.bottom;
          if (height < 0) {
            height = 0;
          }
          this.style.height = height + 'px';
        }
      } else {
        if ($defined(size.width) && size.width >= 0) {
          this.style.width = size.width + 'px';
        }
        if ($defined(size.height) && size.height >= 0) {
          this.style.height = size.height + 'px';
        }
      }
    },
    
    /**
     * Method: descendantOf
     * determines if the element is a descendent of the reference node.
     *
     * Parameters:
     * node - {HTMLElement} the reference node
     *
     * Returns:
     * {Boolean} true if the element is a descendent, false otherwise.
     */
    descendantOf: function(node) {
        var parent = document.id(this.parentNode);
        while (parent != node && parent && parent.parentNode && parent.parentNode != parent) {
            parent = document.id(parent.parentNode);
        }
        return parent == node;
    },
    
    /**
     * Method: findElement
     * search the parentage of the element to find an element of the given
     * tag name.
     *
     * Parameters:
     * type - {String} the tag name of the element type to search for
     *
     * Returns:
     * {HTMLElement} the first node (this one or first parent) with the
     * requested tag name or false if none are found.
     */
    findElement: function(type) {
        var o = this;
        var tagName = o.tagName;
        while (o.tagName != type && o && o.parentNode && o.parentNode != o) {
            o = document.id(o.parentNode);
        }
        return o.tagName == type ? o : false;
    }
} );

Array.implement({
    
    /**
     * Method: swap
     * swaps 2 elements of an array
     * 
     * Parameters:
     * a - the first position to swap
     * b - the second position to swap
     */
    'swap': function(a,b){
        var temp;
        temp = this[a];
        this[a] = this[b];
        this[b] = temp;
    }
    
});

})(document.id || $); // End Wrapper for document.id 

/**
 * Class: Jx.Styles
 * Dynamic stylesheet class. Used for creating and manipulating dynamic 
 * stylesheets.
 *
 * TBD: should we handle the case of putting the same selector in a stylesheet
 * twice?  Right now the code that stores the index of each rule on the
 * stylesheet is not really safe for that when combined with delete or get
 *
 * This is a singleton and should be called directly, like so:
 *
 * (code)
 *   // create a rule that turns all para text red and 15px.
 *   var rule = Jx.Styles.insertCssRule("p", "color: red;", "myStyle");
 *   rule.style.fontSize = "15px";
 * (end)
 *
 * License:
 * Copyright (c) 2009, Jon Bomgardner.
 * Additional code by Paul Spencer
 * 
 * This file is licensed under an MIT style license
 *
 * Inspired by dojox.html.styles, VisitSpy by nwhite,
 * http://www.hunlock.com/blogs/Totally_Pwn_CSS_with_Javascript
 *
 */
Jx.Styles = new(new Class({
    /**
     * dynamicStyleMap - <Hash> used to keep a reference to dynamically created
     * style sheets for quick access
     */
    dynamicStyleMap: new Hash(),
    /**
     * Method: getCssRule
     * retrieve a reference to a CSS rule in a specific style sheet based on its
     * selector.  If the rule does not exist, create it.
     *
     * Parameters:
     * selector - <String> the CSS selector for the rule
     * styleSheetName - <String> the name of the sheet to get the rule from
     *
     * Returns:
     * <CSSRule> - the requested rule
     */
    getCssRule: function(selector, styleSheetName) {
        var ss = this.getDynamicStyleSheet(styleSheetName);
        var rule = null;
        if (ss.indicies) {
            var i = ss.indicies.indexOf(selector);
            if (i == -1) {
                rule = this.insertCssRule(selector, '', styleSheetName);
            } else {
                if (Browser.Engine.name === 'trident') {
                    rule = ss.sheet.rules[i];
                } else {
                    rule = ss.sheet.cssRules[i];
                }
            }
        }
        return rule;
    },
    /**
     * Method: insertCssRule
     * insert a new dynamic rule into the given stylesheet.  If no name is
     * given for the stylesheet then the default stylesheet is used.
     *
     * Parameters:
     * selector - <String> the CSS selector for the rule
     * declaration - <String> CSS-formatted rules to include.  May be empty, in
     * which case you may want to use the returned rule object to manipulate
     * styles
     * styleSheetName - <String> the name of the sheet to place the rules in, 
     * or empty to put them in a default sheet.
     *
     * Returns:
     * <CSSRule> - a CSS Rule object with properties that are browser
     * dependent.  In general, you can use rule.styles to set any CSS properties
     * in the same way that you would set them on a DOM object.
     */
    insertCssRule: function (selector, declaration, styleSheetName) {
        var ss = this.getDynamicStyleSheet(styleSheetName);
        var rule;
        var text = selector + " {" + declaration + "}";
        if (Browser.Engine.name === 'trident') {
            ss.styleSheet.cssText += text;
            rule = ss.sheet.rules[ss.insertRule.length];
        } else {
            ss.sheet.insertRule(text, ss.indicies.length);
            rule = ss.sheet.cssRules[ss.indicies.length];
        }
        ss.indicies.push(selector);
        return rule;
    },
    /**
     * Method: removeCssRule
     * removes a CSS rule from the named stylesheet.
     *
     * Parameters:
     * selector - <String> the CSS selector for the rule
     * styleSheetName - <String> the name of the sheet to remove the rule from, 
     * or empty to remove them from the default sheet.
     *
     * Returns:
     * <Boolean> true if the rule was removed, false if it was not.
     */
    removeCssRule: function (selector, styleSheetName) {
        var ss = this.getDynamicStyleSheet(styleSheetName);
        var i = ss.indicies.indexOf(selector);
        ss.indicies.splice(i, 1);
        if (Browser.Engine.name === 'trident') {
            ss.removeRule(i);
            return true;
        } else {
            ss.sheet.deleteRule(i);
            return true;
        }
        return false;
    },
    /**
     * Method: getDynamicStyleSheet
     * return a reference to a styleSheet based on its title.  If the sheet
     * does not already exist, it is created.
     *
     * Parameter:
     * name - <String> the title of the stylesheet to create or obtain
     *
     * Returns: 
     * <StyleSheet> a StyleSheet object with browser dependent capabilities.
     */
    getDynamicStyleSheet: function (name) {
        name = (name) ? name : 'default';
        if (!this.dynamicStyleMap.has(name)) {
            var sheet = new Element('style').set('type', 'text/css').set('title', name).inject(document.head);
            sheet.indicies = [];
            this.dynamicStyleMap.set(name, sheet);
        }
        return this.dynamicStyleMap.get(name);
    },
    /* Method: enableStyleSheet
     * enable a style sheet
     *
     * Parameters:
     * name - <String> the title of the stylesheet to enable
     */
    enableStyleSheet: function (name) {
        this.getDynamicStyleSheet(name).disabled = false;
    },
    /* Method: disableStyleSheet
     * enable a style sheet
     *
     * Parameters:
     * name - <String> the title of the stylesheet to disable
     */
    disableStyleSheet: function (name) {
        this.getDynamicStyleSheet(name).disabled = true;
    }
}))();// $Id: $
/**
 * Class: Jx.Object
 * Base class for all other object in the JxLib framework. This class
 * implements both mootools mixins Events and Options so the rest of the
 * classes don't need to. 
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Object = new Class({
	
    Implements: [Options, Events],
	
    Family: "Jx.Object",
	
	initialize: function(options){
        this.setOptions(options);
    }

});
 // $Id: $
/**
 * Class: Jx.Widget
 * Base class for all widgets (visual classes) in the JxLib Framework. This 
 * class extends <Jx.Object> and adds the Chrome, ContentLoader, Addable, and 
 * AutoPosition mixins from the original framework.
 * 
 * ContentLoader:
 * 
 * ContentLoader functionality provides a consistent
 * mechanism for descendants of Jx.Widget to load content in one of
 * four different ways:
 *
 * o using an existing element, by id
 *
 * o using an existing element, by object reference
 *
 * o using an HTML string
 *
 * o using a URL to get the content remotely
 *
 * Chrome:
 * 
 * Chrome is the extraneous visual element that provides the look and feel to some elements
 * i.e. dialogs.  Chrome is added inside the element specified but may
 * bleed outside the element to provide drop shadows etc.  This is done by
 * absolutely positioning the chrome objects in the container based on
 * calculations using the margins, borders, and padding of the jxChrome
 * class and the element it is added to.
 *
 * Chrome can consist of either pure CSS border and background colors, or
 * a background-image on the jxChrome class.  Using a background-image on
 * the jxChrome class creates four images inside the chrome container that
 * are positioned in the top-left, top-right, bottom-left and bottom-right
 * corners of the chrome container and are sized to fill 50% of the width
 * and height.  The images are positioned and clipped such that the 
 * appropriate corners of the chrome image are displayed in those locations.
 *
 *
 */
Jx.Widget = new Class({
	
	Extends: Jx.Object,
	
	options: {
		content: null,
		contentURL: null
	},
	
	/**
	 * Property: domObj
	 * The HTMLElement that represents this widget.
	 */
	domObj: null,
	
	/**
     * Property: contentIsLoaded
     *
     * tracks the load state of the content, specifically useful
     * in the case of remote content.
     */ 
    contentIsLoaded: false,
    
    /**
     * Property: chrome
     * the DOM element that contains the chrome
     */
    chrome: null,
    
    
    /**
     * Constructor: Jx.Widget
     * 
     * Options:
     * content - content may be an HTML element reference, the id of an HTML element
     * 		already in the DOM, or an HTML string that becomes the inner HTML of
     * 		the element.
     * contentURL - the URL to load content from
     */
    initialize: function(options){
		this.parent(options);
	},
    
    
    /**
     * Method: loadContent
     *
     * triggers loading of content based on options set for the current
     * object.
     *
     * Parameters: 
     * element - {Object} the element to insert the content into
     *
     * Events:
     *
     * ContentLoader adds the following events to an object.  You can
     * register for these events using the addEvent method or by providing
     * callback functions via the on{EventName} properties in the options 
     * object
     *
     * contentLoaded - called when the content has been loaded.  If the
     *     content is not asynchronous then this is called before loadContent
     *     returns.
     * contentLoadFailed - called if the content fails to load, primarily
     *     useful when using the contentURL method of loading content.
     */     
    loadContent: function(element) {
        element = document.id(element);
        if (this.options.content) {
            var c;
            if (this.options.content.domObj) {
                c = document.id(this.options.content.domObj);
            } else {
                c = document.id(this.options.content);
            }
            if (c) {
                if (this.options.content.addTo) {
                    this.options.content.addTo(element);
                } else {
                    element.appendChild(c);                    
                }
                this.contentIsLoaded = true;                
            } else {
                element.innerHTML = this.options.content;
                this.contentIsLoaded = true;
            }
        } else if (this.options.contentURL) {
            this.contentIsLoaded = false;
            this.req = new Request({
                url: this.options.contentURL, 
                method:'get',
                evalScripts:true,
                onSuccess:(function(html) {
                    element.innerHTML = html;
                    this.contentIsLoaded = true;
                    if (Jx.isAir){
                        $clear(this.reqTimeout);
                    }
                    this.fireEvent('contentLoaded', this);
                }).bind(this), 
                onFailure: (function(){
                    this.contentIsLoaded = true;
                    this.fireEvent('contentLoadFailed', this);
                }).bind(this),
                headers: {'If-Modified-Since': 'Sat, 1 Jan 2000 00:00:00 GMT'}
            });
            this.req.send();
            if (Jx.isAir) {
                var timeout = $defined(this.options.timeout) ? this.options.timeout : 10000;
                this.reqTimeout = this.checkRequest.delay(timeout, this);
            }
        } else {
            this.contentIsLoaded = true;
        }
        if (this.options.contentId) {
            element.id = this.options.contentId;
        }
        if (this.contentIsLoaded) {
            this.fireEvent('contentLoaded', this);
        }
    },
    
    processContent: function(element) {
        $A(element.childNodes).each(function(node){
            if (node.tagName == 'INPUT' || node.tagName == 'SELECT' || node.tagName == 'TEXTAREA') {
                if (node.type == 'button') {
                    node.addEvent('click', function(){
                        this.fireEvent('click', this, node);
                    });
                } else {
                    node.addEvent('change', function(){
                        this.fireEvent('change',node);
                    });
                }
            } else {
                if (node.childNodes) {
                    this.processContent(node);
                }
            }
        }, this);
    },
    
    /**
     * Method: position
     * positions an element relative to another element
     * based on the provided options.  Positioning rules are
     * a string with two space-separated values.  The first value
     * references the parent element and the second value references
     * the thing being positioned.  In general, multiple rules can be
     * considered by passing an array of rules to the horizontal and
     * vertical options.  The position method will attempt to position
     * the element in relation to the relative element using the rules
     * specified in the options.  If the element does not fit in the
     * viewport using the rule, then the next rule is attempted.  If
     * all rules fail, the last rule is used and element may extend
     * outside the viewport.  Horizontal and vertical rules are
     * processed independently.
     *
     * Horizontal Positioning:
     * Horizontal values are 'left', 'center', 'right', and numeric values.
     * Some common rules are:
     * o 'left left' is interpreted as aligning the left
     * edge of the element to be positioned with the left edge of the
     * reference element.  
     * o 'right right' aligns the two right edges.  
     * o 'right left' aligns the left edge of the element to the right of
     * the reference element.  
     * o 'left right' aligns the right edge of the element to the left
     * edge of the reference element.
     *
     * Vertical Positioning:
     * Vertical values are 'top', 'center', 'bottom', and numeric values.
     * Some common rules are:
     * o 'top top' is interpreted as aligning the top
     * edge of the element to be positioned with the top edge of the
     * reference element.  
     * o 'bottom bottom' aligns the two bottom edges.  
     * o 'bottom top' aligns the top edge of the element to the bottom of
     * the reference element.  
     * o 'top bottom' aligns the bottom edge of the element to the top
     * edge of the reference element.
     * 
     * Parameters:
     * element - the element to position
     * relative - the element to position relative to
     * options - the positioning options, see list below.
     *
     * Options:
     * horizontal - the horizontal positioning rule to use to position the 
     *    element.  Valid values are 'left', 'center', 'right', and a numeric
     *    value.  The default value is 'center center'.
     * vertical - the vertical positioning rule to use to position the 
     *    element.  Valid values are 'top', 'center', 'bottom', and a numeric
     *    value.  The default value is 'center center'.
     * offsets - an object containing numeric pixel offset values for the object
     *    being positioned as top, right, bottom and left properties.
     */
    position: function(element, relative, options) {
        element = document.id(element);
        relative = document.id(relative);
        var hor = $splat(options.horizontal || ['center center']);
        var ver = $splat(options.vertical || ['center center']);
        var offsets = $merge({top:0,right:0,bottom:0,left:0}, options.offsets || {});
        
        var coords = relative.getCoordinates(); //top, left, width, height
        var page;
        var scroll;
        if (!document.id(element.parentNode) || element.parentNode ==  document.body) {
            page = Jx.getPageDimensions();
            scroll = document.id(document.body).getScroll();
        } else {
            page = document.id(element.parentNode).getContentBoxSize(); //width, height
            scroll = document.id(element.parentNode).getScroll();
        }
        if (relative == document.body) {
            // adjust coords for the scroll offsets to make the object
            // appear in the right part of the page.
            coords.left += scroll.x;
            coords.top += scroll.y;            
        } else if (element.parentNode == relative) {
            // if the element is opening *inside* its relative, we want
            // it to position correctly within it so top/left becomes
            // the reference system.
            coords.left = 0;
            coords.top = 0;
        }
        var size = element.getMarginBoxSize(); //width, height
        var left;
        var right;
        var top;
        var bottom;
        var n;
        if (!hor.some(function(opt) {
            var parts = opt.split(' ');
            if (parts.length != 2) {
                return false;
            }
            if (!isNaN(parseInt(parts[0],10))) {
                n = parseInt(parts[0],10);
                if (n>=0) {
                    left = n;                    
                } else {
                    left = coords.left + coords.width + n;
                }
            } else {
                switch(parts[0]) {
                    case 'right':
                        left = coords.left + coords.width;
                        break;
                    case 'center':
                        left = coords.left + Math.round(coords.width/2);
                        break;
                    case 'left':
                    default:
                        left = coords.left;
                        break;
                }                
            }
            if (!isNaN(parseInt(parts[1],10))) {
                n = parseInt(parts[1],10);
                if (n<0) {
                    right = left + n;
                    left = right - size.width;
                } else {
                    left += n;
                    right = left + size.width;
                }
                right = coords.left + coords.width + parseInt(parts[1],10);
                left = right - size.width;
            } else {
                switch(parts[1]) {
                    case 'left':
                        left -= offsets.left;
                        right = left + size.width;
                        break;
                    case 'right':
                        left += offsets.right;
                        right = left;
                        left = left - size.width;
                        break;
                    case 'center':
                    default:
                        left = left - Math.round(size.width/2);
                        right = left + size.width;
                        break;
                }                
            }
            return (left >= scroll.x && right <= scroll.x + page.width);
        })) {
            // all failed, snap the last position onto the page as best
            // we can - can't do anything if the element is wider than the
            // space available.
            if (right > page.width) {
                left = scroll.x + page.width - size.width;
            }
            if (left < 0) {
                left = 0;
            }
        }
        element.setStyle('left', left);
        
        if (!ver.some(function(opt) {
                var parts = opt.split(' ');
                if (parts.length != 2) {
                    return false;
                }
                if (!isNaN(parseInt(parts[0],10))) {
                    top = parseInt(parts[0],10);
                } else {
                    switch(parts[0]) {
                        case 'bottom':
                            top = coords.top + coords.height;
                            break;
                        case 'center':
                            top = coords.top + Math.round(coords.height/2);
                            break;
                        case 'top':
                        default:
                            top = coords.top;
                            break;
                    }
                }
                if (!isNaN(parseInt(parts[1],10))) {
                    var n = parseInt(parts[1],10);
                    if (n>=0) {
                        top += n;
                        bottom = top + size.height;
                    } else {
                        bottom = top + n;
                        top = bottom - size.height; 
                    }
                } else {
                    switch(parts[1]) {
                        case 'top':
                            top -= offsets.top;
                            bottom = top + size.height;
                            break;
                        case 'bottom':
                            top += offsets.bottom;
                            bottom = top;
                            top = top - size.height;
                            break;
                        case 'center':
                        default:
                            top = top - Math.round(size.height/2);
                            bottom = top + size.height;
                            break;
                    }                    
                }
                return (top >= scroll.y && bottom <= scroll.y + page.height);
            })) {
                // all failed, snap the last position onto the page as best
                // we can - can't do anything if the element is higher than the
                // space available.
                if (bottom > page.height) {
                    top = scroll.y + page.height - size.height;
                }
                if (top < 0) {
                    top = 0;
                }
            }
            element.setStyle('top', top);
            
            /* update the jx layout if necessary */
            var jxl = element.retrieve('jxLayout');
            if (jxl) {
                jxl.options.left = left;
                jxl.options.top = top;
            }
    },
    
    /**
     * Method: makeChrome
     * create chrome on an element.
     *
     * Parameters:
     * element - {HTMLElement} the element to put the chrome on.
     */
    makeChrome: function(element) {
        var c = new Element('div', {
            'class':'jxChrome',
            events: {
                contextmenu: function(e) { e.stop(); }
            }      
        });
        
        /* add to element so we can get the background image style */
        element.adopt(c);
        
        /* pick up any offset because of chrome, set
         * through padding on the chrome object.  Other code can then
         * make use of these offset values to fix positioning.
         */
        this.chromeOffsets = c.measure(function() {
            return this.getSizes(['padding']).padding;
        });
        c.setStyle('padding', 0);
        
        /* get the chrome image from the background image of the element */
        /* the app: protocol check is for adobe air support */
        var src = c.getStyle('backgroundImage');
        if (!(src.contains('http://') || src.contains('https://') || src.contains('file://') || src.contains('app:/'))) {
            src = null;
        } else {
            src = src.slice(4,-1);
            /* this only seems to be IE and Opera, but they add quotes
             * around the url - yuck
             */
            if (src.charAt(0) == '"') {
                src = src.slice(1,-1);
            }

            /* and remove the background image */
            c.setStyle('backgroundImage', 'none');

            /* make chrome */
            ['TR','TL','BL','BR'].each(function(s){
                c.adopt(
                    new Element('div',{
                        'class':'jxChrome'+s
                    }).adopt(
                    new Element('img',{
                        'class':'png24',
                        src:src,
                        alt: '',
                        title: ''
                    })));
            }, this);
        }
        if (!window.opera) {
            c.adopt(Jx.createIframeShim());
        }
        
        /* remove from DOM so the other resizing logic works as expected */
        c.dispose();    
        this.chrome = c;
    },
    
    /**
     * Method: showChrome
     * show the chrome on an element.  This creates the chrome if necessary.
     * If the chrome has been previously created and not removed, you can
     * call this without an element and it will just resize the chrome within
     * its existing element.  You can also pass in a different element from
     * which the chrome was previously attached to and it will move the chrome
     * to the new element.
     *
     * Parameters:
     * element - {HTMLElement} the element to show the chrome on.
     */
    showChrome: function(element) {
        element = document.id(element);
        if (!this.chrome) {
            this.makeChrome(element);
        }
        this.resizeChrome(element);
        if (element && this.chrome.parentNode !== element) {
            element.adopt(this.chrome);
        }
    },
    
    /**
     * Method: hideChrome
     * removes the chrome from the DOM.  If you do this, you can't
     * call showChrome with no arguments.
     */
    hideChrome: function() {
        if (this.chrome) {
            this.chrome.dispose();
        }
    },
    
    resizeChrome: function(o) {
        if (this.chrome && Browser.Engine.trident4) {
            this.chrome.setContentBoxSize(document.id(o).getBorderBoxSize());
        }
    },
    
    /**
     * Method: addTo
     * adds the object to the DOM relative to another element.  If you use
     * 'top' or 'bottom' then the element is added to the relative
     * element (becomes a child node).  If you use 'before' or 'after'
     * then the element is inserted adjacent to the reference node. 
     *
     * Parameters:
     * reference - {Object} the DOM element or id of a DOM element
     * to append the object relative to
     * where - {String} where to append the element in relation to the
     * reference node.  Can be 'top', 'bottom', 'before' or 'after'.
     * The default is 'bottom'.
     *
     * Returns:
     * the object itself, which is useful for chaining calls together
     */
    addTo: function(reference, where) {
        var el = document.id(this.addable) || document.id(this.domObj);
        if (el) {
            ref = document.id(reference);
            el.inject(ref,where);
            this.fireEvent('addTo',this);            
        }
        return this;
    },
    
    toElement: function() {
        return this.domObj;
    },
    
    /**
     * APIMethod: processTemplate
     * This function pulls the needed elements from a provided template
     * 
     * Parameters:
     * template - the template to use in grabbing elements
     * classes - an array of class names to use in grabbing elements
     * container - the container to add the template into
     * 
     * Returns:
     * a hash object containing the requested Elements keyed by the class names
     */
    processTemplate: function(template,classes,container){
        
        var h = new Hash();
        var element;
        if ($defined(container)){
            element = container.set('html',template);
        } else {
            element = new Element('div',{html:template});
        }
        classes.each(function(klass){
            var el = element.getElement('.'+klass);
            if ($defined(el)){
                h.set(klass,el);
            }
        });
        
        return h;
        
    },
    
    /**
     * Method: generateId
     * Used to generate a unique ID for Jx Widgets.
     */
    generateId: function(prefix){
        prefix = (prefix) ? prefix : 'jx-';
        var uid = $uid(this);
        delete this.uid;
        return prefix + uid;
    }
});


/**
 * It seems AIR never returns an XHR that "fails" by not finding the 
 * appropriate file when run in the application sandbox and retrieving a local
 * file. This affects Jx.ContentLoader in that a "failed" event is never fired. 
 * 
 * To fix this, I've added a timeout that waits about 10 seconds or so in the code above
 * for the XHR to return, if it hasn't returned at the end of the timeout, we cancel the
 * XHR and fire the failure event.
 *
 * This code only gets added if we're in AIR.
 */
if (Jx.isAir){
    Jx.Widget.implement({
        /**
         * Method: checkRequest
         * Is fired after a delay to check the request to make sure it's not
         * failing in AIR.
         */
        checkRequest: function(){
            if (this.req.xhr.readyState === 1) {
                //we still haven't gotten the file. Cancel and fire the
                //failure
                $clear(this.reqTimeout);
                this.req.cancel();
                this.contentIsLoaded = true;
                this.fireEvent('contentLoadFailed', this);
            }
        }
    });
}// $Id: $
/**
 * Class: Jx.Compare
 * 
 * Extends: <Jx.Object>
 * 
 * Class that holds functions for doing comparison operations.
 * This class requires the clientside Date() extensions (deps/date.js).
 * 
 * notes:
 * Each function that does a comparison returns
 * 
 * 0 - if equal.
 * 1 - if the first value is greater that the second.
 * -1 - if the first value is less than the second.
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */

Jx.Compare = new Class({
    Extends: Jx.Object,
	
    options: { separator: '.' },
	
    /**
     * Constructor: Jx.Compare
     * initializes this class
     * 
     * Parameters: 
     * options - <Jx.Compare.Options>
     */
    initialize: function (options) {
        this.parent(options);
    },
	
    /**
     * APIMethod: alphanumeric
     * Compare alphanumeric variables. This is case sensitive
     * 
     * Parameters:
     * a - a value
     * b - another value
     */
    alphanumeric: function (a, b) {
        return (a === b) ? 0 :(a < b) ? -1 : 1;
    },
	
    /**
     * APIMethod: numeric
     * Compares numbers
     *
     * Parameters:
     * a - a number
     * b - another number
     */
    numeric: function (a, b) {
        return this.alphanumeric(this.convert(a), this.convert(b));
    },
	
    /**
     * Method: _convert
     * Normalizes numbers relative to the separator.
     * 
     * Parameters:
     * val - the number to normalize
     * 
     * Returns:
     * the normalized value
     */
    convert: function (val) {
        if (Jx.type(val) === 'string') {
            val = parseFloat(val.replace(/^[^\d\.]*([\d., ]+).*/g, "$1").replace(new RegExp("[^\\\d" + this.options.separator + "]", "g"), '').replace(/,/, '.')) || 0;
        }
        return val || 0;
    },
	
    /**
     * APIMethod: ignorecase
     * Compares to alphanumeric strings without regard to case.
     * 
     * Parameters:
     * a - a value
     * b - another value
     */
    ignorecase: function (a, b) {
        return this.alphanumeric(("" + a).toLowerCase(), ("" + b).toLowerCase());
    },
	
    /**
     * APIMethod: currency
     * Compares to currency values.
     * 
     * Parameters:
     * a - a currency value without the $
     * b - another currency value without the $
     */
    currency: function (a, b) {
        return this.numeric(a, b);
    },
	
    /**
     * APIMethod: date
     * Compares 2 date values (either a string or an object)
     * 
     * Parameters:
     * a - a date value 
     * b - another date value
     */
    date: function (a, b) {
        var x = new Date().parse(a);
        var y = new Date().parse(b);
        return (x < y) ? -1 : (x > y) ? 1 : 0;
    },
    /**
     * APIMethod: boolean
     * Compares 2 bolean values 
     * 
     * Parameters:
     * a - a boolean value 
     * b - another boolean value
     */
    'boolean': function (a, b) {
        return (a === true && b === false) ? -1 : (a === b) ? 0 : 1;
    }
	
});// $Id: $
/**
 * Class: Jx.Sort Base class for all of the sorting algorithm classes.
 * 
 * Extends: <Jx.Object>
 * 
 * Events: 
 * onStart() - called when the sort starts 
 * onEnd() - called when the sort stops
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Sort = new Class({

    Family : 'Jx.Sort',

    Extends : Jx.Object,

    options : {
        /**
         * Option: timeIt
         * whether to time the sort
         */
        timeIt : false,
        /**
         * Event: onStart
         */
        onStart : $empty,
        /**
         * Event: onEnd
         */
        onEnd : $empty
    },
    
    /**
     * Property: timer
     * holds the timer instance
     */
    timer : null,
    /**
     * Property: data
     * The data to sort
     */
    data : null,
    /**
     * Property: Comparator
     * The comparator to use in sorting
     */
    comparator : $empty,
    /**
     * Property: col
     * The column to sort by
     */
    col : null,

    /**
     * Constructor: Jx.Sort Initializes the class
     * 
     * Parameters: 
     * arr - the array to sort 
     * fn - the function to use in sorting
     * col - the column to sort by 
     * options - <Jx.Sort.Options> 
     */
    initialize : function (arr, fn, col, options) {
        this.parent(options);
        if (this.options.timeIt) {
            this.addEvent('start', this.startTimer.bind(this));
            this.addEvent('stop', this.stopTimer.bind(this));
        }
        this.data = arr;
        this.comparator = fn;
        this.col = col;
    },

    /**
     * APIMethod: sort 
     * Actually does the sorting. Must be overridden by subclasses.
     */
    sort : $empty,

    /**
     * Method: startTimer 
     * Saves the starting time of the sort
     */
    startTimer : function () {
        this.timer = new Date();
    },

    /**
     * Method: stopTimer 
     * Determines the time the sort took.
     */
    stopTimer : function () {
        this.end = new Date();
        this.dif = this.timer.diff(this.end, 'ms');
    },

    /**
     * APIMethod: setData 
     * sets the data to sort
     * 
     * Parameters: 
     * data - the data to sort
     */
    setData : function (data) {
        if ($defined(data)) {
            this.data = data;
        }
    },

    /**
     * APIMethod: setColumn 
     * Sets the column to sort by
     * 
     * Parameters: 
     * col - the column to sort by
     */
    setColumn : function (col) {
        if ($defined(col)) {
            this.col = col;
        }
    },

    /**
     * APIMethod: setComparator
     * Sets the comparator to use in sorting
     * 
     * Parameters: 
     * fn - the function to use as the comparator
     */
    setComparator : function (fn) {
        this.comparator = fn;
    }
});
// $Id: $
/**
 * Class: Jx.Store 
 * 
 * Extends: <Jx.Object>
 * 
 * This class is the base store. It keeps track of data. It
 * allows adding, deleting, iterating, sorting etc...
 * 
 * Events: onLoadFinished(store) - fired when the store finishes loading the
 * data onLoadError(store,data) - fired when there is an error loading the data
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */

Jx.Store = new Class({

    Extends : Jx.Object,

    Family : "Jx.Store",

    options : {
        /**
         * Option: id
         * the identifier for this store
         */
        id : null,
        /**
         * Option: columns
         * an array listing the columns of the store in order of their 
         * appearance in the data object formatted as an object 
         *      {name: 'column name', type: 'column type'} 
         * where type can be one of alphanumeric, numeric, date, boolean, 
         * or currency.
         */
        columns : [], 
        /**
         * Option: defaultSort
         * The default sorting type, currently set to merge but can be any of the
         * sorters available
         */
        defaultSort : 'merge',
        /**
         * Option: separator
         * The separator to pass to the comparator
         * constructor (<Jx.Compare>) - defaults to '.'
         */
        separator : '.',
        /**
         * Option: sortCols
         * An array of columns to sort by arranged in the order you want 
         * them sorted.
         */
        sortCols : [], 
        /**
         * Event: onLoadFinished(store)
         * event for a completed, successful data load
         */
        onLoadFinished : $empty,
        /**
         * Event: onLoadError(store,data)
         * event for an unsuccessful load
         */
        onLoadError : $empty, 
        /**
         * Event: onColumnChanged
         * event fired for changes to a column
         */
        onColumnChanged : $empty
   
    },

    /**
     * Property: sorters
     * an object listing the different sorters available
     */
    sorters : {
        quick : "Quicksort",
        merge : "Mergesort",
        heap : "Heapsort",
        'native' : "Nativesort"
    },
    /**
     * Property: data
     * Holds the data for this store
     */
    data : null,
    /**
     * Property: index
     * Holds the current position of the store relative to the data.
     * Zero-based index.
     */
    index : 0,
    /**
     * Property: dirty
     * Tells us if the store is dirty
     */
    dirty : false,
    /**
     * Property: id
     * The id of this store.
     */
    id : null,

    /**
     * Constructor: Jx.Store 
     * Initializes this class
     * 
     * Parameters: 
     * options - <Jx.Store.Options>
     */
    initialize : function (options) {
        this.parent(options);
    },

    /**
     * APIMethod: load 
     * Loads data into the store.
     * 
     * Parameters: 
     * data - the data to load
     */
    load : function (data) {
        if ($defined(data)) {
            this.processData(data);
        }
    },

    /**
     * APIMethod: hasNext 
     * Determines if there are more records past the current
     * one.
     * 
     * Returns: true | false (Null if there's a problem)
     */
    hasNext : function () {
        if ($defined(this.data)) {
            if (this.index < this.data.length - 1) {
                return true;
            } else {
                return false;
            }
        } else {
            return null;
        }
    },

    /**
     * APIMethod: hasPrevious 
     * Determines if there are records before the current
     * one.
     * 
     * Returns: true | false
     */
    hasPrevious : function () {
        if ($defined(this.data)) {
            if (this.index > 0) {
                return true;
            } else {
                return false;
            }
        } else {
            return null;
        }
    },

    /**
     * APIMethod: valid 
     * Tells us if the current index has any data (i.e. that the
     * index is valid).
     * 
     * Returns: true | false
     */
    valid : function () {
        return ($defined(this.data[this.index]));
    },

    /**
     * APIMethod: next 
     * Moves the store to the next record
     * 
     * Returns: nothing | null if error
     */
    next : function () {
        if ($defined(this.data)) {
            this.index++;
            if (this.index === this.data.length) {
                this.index = this.data.length - 1;
            }
            this.fireEvent('storeMove', this);
        } else {
            return null;
        }
    },

    /**
     * APIMethod: previous 
     * moves the store to the previous record
     * 
     * Returns: nothing | null if error
     * 
     */
    previous : function () {
        if ($defined(this.data)) {
            this.index--;
            if (this.index === -1) {
                this.index = 0;
            }
            this.fireEvent('storeMove', this);
        } else {
            return null;
        }
    },

    /**
     * APIMethod: first 
     * Moves the store to the first record
     * 
     * Returns: nothing | null if error
     * 
     */
    first : function () {
        if ($defined(this.data)) {
            this.index = 0;
            this.fireEvent('storeMove', this);
        } else {
            return null;
        }
    },

    /**
     * APIMethod: last 
     * Moves to the last record in the store
     * 
     * Returns: nothing | null if error
     */
    last : function () {
        if ($defined(this.data)) {
            this.index = this.data.length - 1;
            this.fireEvent('storeMove', this);
        } else {
            return null;
        }
    },

    /**
     * APIMethod: count 
     * Returns the number of records in the store
     * 
     * Returns: an integer indicating the number of records in the store or null
     * if there's an error
     */
    count : function () {
        if ($defined(this.data)) {
            return this.data.length;
        } else {
            return null;
        }
    },

    /**
     * APIMethod: getPosition 
     * Tells us where we are in the store
     * 
     * Returns: an integer indicating the position in the store or null if
     * there's an error
     */
    getPosition : function () {
        if ($defined(this.data)) {
            return this.index;
        } else {
            return null;
        }
    },

    /**
     * APIMethod: moveTo 
     * Moves the index to a specific record in the store
     * 
     * Parameters: 
     * index - the record to move to
     * 
     * Returns: true - if successful false - if not successful null - on error
     */
    moveTo : function (index) {
        if ($defined(this.data) && index >= 0 && index < this.data.length) {
            this.index = index;
            this.fireEvent('storeMove', this);
            return true;
        } else if (!$defined(this.data)) {
            return null;
        } else {
            return false;
        }
    },

    /**
     * APIMethod: get 
     * Retrieves the data for a specific column of the current
     * record
     * 
     * Parameters: 
     * col - the column to get (either an integer or a string)
     * 
     * Returns: the data in the column or null if the column doesn't exist
     */
    get : function (col) {
        if ($defined(this.data)) {
            col = this.resolveCol(col);
            var h = this.data[this.index];
            if (h.has(col.name)) {
                return h.get(col.name);
            } else {
                return null;
            }
        } else {
            return null;
        }
    },

    /**
     * APIMethod: set 
     * Puts a value into a specific column of the current record and
     * sets the dirty flag.
     * 
     * Parameters: 
     * column - the column to put the value in value - the data to put
     * into the column
     * 
     * returns: nothing | null if an error
     */
    set : function (column, value) {
        if ($defined(this.data)) {
            // set the column to the value and set the dirty flag

            if (Jx.type(column) === 'number' || Jx.type(column) === 'string') {
                column = this.resolveCol(column);
            }

            var oldValue = this.data[this.index].get(column.name);
            this.data[this.index].set(column.name, value);
            this.data[this.index].set('dirty', true);
            this.fireEvent('columnChanged', [ this.index, column, oldValue, value ]);
        } else {
            return null;
        }
    },
    
    /**
     * APIMethod: refresh 
     * Sets new data into the store
     * 
     * Parameters: 
     * data - the data to set 
     * reset - flag as to whether to reset the index to 0
     * 
     * Returns: nothing or null if no data is passed
     */
    refresh : function (data, reset) {
        if ($defined(data)) {
            this.processData(data);
            if (reset) {
                this.index = 0;
            }
        } else {
            return null;
        }
    },
    
    /**
     * APIMethod: isDirty 
     * Tells us if the store is dirty and needs to be saved
     * 
     * Returns: true | false | null on error
     */
    isDirty : function () {
        if ($defined(this.data)) {
            var dirty = false;
            this.data.each(function (row) {
                if (this.isRowDirty(row)) {
                    dirty = true;
                    return;
                }
            }, this);
            return dirty;
        } else {
            return null;
        }
    },
    
    /**
     * APIMethod: newRow 
     * Adds a new row to the store. It can either be empty or made
     * from an array of data
     * 
     * Parameters: 
     * data - data to use in the new row (optional)
     */
    newRow : function (data) {
        // check if array is not defined
        if (!$defined(this.data)) {
            // if not, then create a new array
            this.data = [];
        }
        
        var d;
        
        if (!$defined(data)) {
            d = new Hash();
        } else {
            var t = Jx.type(data);
            switch (t) {
            case 'object':
                d = new Hash(data);
                break;
            case 'hash':
                d = data;
                break;
            }
        }
        d.set('dirty', true);
        this.data[this.data.length] = d;
        this.index = this.data.length - 1;
        this.fireEvent('newrow', this);
    },
    
    /**
     * APIMethod: sort 
     * Runs the sorting and grouping
     * 
     * Parameters: 
     * cols - Optional. An array of columns to sort/group by 
     * sort - the sort type (quick,heap,merge,native),defaults to options.defaultSort
     * dir - the direction to sort. Set to "desc" for descending,
     * anything else implies ascending (even null). 
     */
    sort : function (cols, sort, dir) {
        
        if (this.count()) {
        
            this.fireEvent('sortStart', this);
            
            var c;
            if ($defined(cols) && Jx.type(cols) === 'array') {
                c = this.options.sortCols = cols;
            } else if ($defined(cols) && Jx.type(cols) === 'string') {
                this.options.sortCols = [];
                this.options.sortCols.push(cols);
                c = this.options.sortCols;
            } else if ($defined(this.options.sortCols)) {
                c = this.options.sortCols;
            } else {
                return null;
            }
            
            this.sortType = sort;
            // first sort on the first array item
            this.doSort(c[0], sort);
        
            if (c.length > 1) {
                   this.data = this.subSort(this.data, 0, 1);
            }
        
            if ($defined(dir) && dir === 'desc') {
                this.data.reverse();
            }
        
            this.fireEvent('sortFinished', this);
        }
    },
    
    /**
     * Method: subSort 
     * Does the actual group sorting.
     * 
     * Parameters: 
     * data - what to sort 
     * groupByCol - the column that determines the groups 
     * sortCol - the column to sort by
     * 
     * returns: the result of the grouping/sorting
     */
    subSort : function (data, groupByCol, sortByCol) {
        
        if (sortByCol >= this.options.sortCols.length) {
            return data;
        }
        /**
         *  loop through the data array and create another array with just the
         *  items for each group. Sort that sub-array and then concat it 
         *  to the result.
         */
        var result = [];
        var sub = [];
        
        var groupCol = this.options.sortCols[groupByCol];
        var sortCol = this.options.sortCols[sortByCol];
    
        var group = data[0].get(groupCol);
        this.sorter.setColumn(sortCol);
        for (var i = 0; i < data.length; i++) {
            if (group === (data[i]).get(groupCol)) {
                sub.push(data[i]);
            } else {
                // sort
    
                if (sub.length > 1) {
                    result = result.concat(this.subSort(this.doSort(sortCol, this.sortType, sub, true),groupByCol + 1,sortByCol + 1));
                } else {
                    result = result.concat(sub);
                }
            
                // change group
                group = (data[i]).get(groupCol);
                // clear sub
                sub.empty();
                // add to sub
                sub.push(data[i]);
            }
        }
        
        if (sub.length > 1) {
            this.sorter.setData(sub);
            result = result.concat(this.subSort(this.doSort(sortCol, this.sortType, sub, true),groupByCol + 1,sortByCol + 1));
        } else {
            result = result.concat(sub);
        }
        
        //this.data = result;
        
        return result;
    },
    
    /**
     * Method: doSort 
     * Called to change the sorting of the data
     * 
     * Parameters: 
     * col - the column to sort by 
     * sort - the kind of sort to use (see list above) 
     * data - the data to sort (leave blank or pass null to sort data
     * existing in the store) 
     * ret - flag that tells the function whether to pass
     * back the sorted data or store it in the store 
     * options - any options needed to pass to the sorter upon creation
     * 
     * returns: nothing or the data depending on the value of ret parameter.
     */
    doSort : function (col, sort, data, ret, options) {
        options = {} || options;
        
        sort = (sort) ? this.sorters[sort] : this.sorters[this.options.defaultSort];
        data = data ? data : this.data;
        ret = ret ? true : false;
        
        if (!$defined(this.comparator)) {
            this.comparator = new Jx.Compare({
                separator : this.options.separator
            });
        }
        
        this.col = col = this.resolveCol(col);
        
        var fn = this.comparator[col.type].bind(this.comparator);
        if (!$defined(this.sorter)) {
            this.sorter = new Jx.Sort[sort](data, fn, col.name, options);
        } else {
            this.sorter.setComparator(fn);
            this.sorter.setColumn(col.name);
            this.sorter.setData(data);
        }
        var d = this.sorter.sort();
        
        if (ret) {
            return d;
        } else {
            this.data = d;
        }
    },
    
    /**
     * Method: isRowDirty 
     * Helps determine if a row is dirty
     * 
     * Parameters: 
     * row - the row to check
     * 
     * Returns: true | false
     */
    isRowDirty : function (row) {
        if (row.has('dirty')) {
            return row.get('dirty');
        } else {
            return false;
        }
    },
    
    /**
     * Method: resolveCol 
     * Determines which array index this column refers to
     * 
     * Parameters: 
     * col - a number referencing a column in the store
     * 
     * Returns: the name of the column
     */
    resolveCol : function (col) {
        var t = Jx.type(col);
        if (t === 'number') {
            col = this.options.columns[col];
        } else if (t === 'string') {
            this.options.columns.each(function (column) {
                if (column.name === col) {
                    col = column;
                }
            }, this);
        }
        return col;
    },
    
    /**
     * Method: processData 
     * Processes the data passed into the function into the store.
     * 
     * Parameters: 
     * data - the data to put into the store
     */
    processData : function (data) {
        this.fireEvent('preload', [ this, data ]);
    
        if (!$defined(this.data)) {
            this.data = [];
        }
        if ($defined(data)) {
            this.data.empty();
            var type = Jx.type(data);
            // is this an array?
            if (type === 'array') {
                data.each(function (item, index) {
                    this.data.include(new Hash(item));
                }, this);
            } else if (type === 'object') {
                // is this an object?
                this.data.include(new Hash(data));
            } else if (type === 'string') {
                // is this a string?
                try {
                    this.data.include(new Hash(JSON.decode(data)));
                } catch (e) {
                    this.fireEvent('loadError', [ this, data ]);
                }
            }
            this.fireEvent('loadFinished', this);
        } else {
            this.fireEvent('loadError', [ this, data ]);
        }
    },
    
    /**
     * APIMethod: getColumns
     * Allows retrieving the columns array
     */
    getColumns: function () {
        return this.options.columns;
    },
    
    /**
     * APIMethod: findByColumn
     * Used to find a specific record by the value in a specific column. This
     * is particularly useful for finding records by a unique id column. The search
     * will stop on the first instance of the value
     * 
     * Parameters:
     * column - the name of the column to search by
     * value - the value to look for
     */
    findByColumn: function (column, value) {
        
        if (!$defined(this.comparator)) {
            this.comparator = new Jx.Compare({
                separator : this.options.separator
            });
        }
        
        column = this.resolveCol(column);
        
        var fn = this.comparator[column.type].bind(this.comparator);
        
        
        var i = 0;
        var index = null; 
        this.data.each(function (record) {
            if (fn(record.get(column.name), value) === 0) {
                index = i;
            }
            i++;
        }, this);
        return index;
    },
    
    /**
     * APIMethod: getRowObject
     * Allows the user to get all of the data for the current row as an object.
     * 
     */
    getRowObject: function () {
        return this.data[this.index].getClean();
    }
});
// $Id: $
/**
 * Class: Jx.Store.Remote
 * 
 * Extends: <Jx.Store>
 * 
 * This class adds the ability to load/save data remotely.
 *  
 * Events:
 * onSaveSuccess() - event fired when all saving happens successfully
 * onSaveError() - event fired when the server returns an error during saving
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Remote = new Class({

    Extends : Jx.Store,

    options : {
        /**
         * Option: dataUrl
         * The URL to get data from
         */
        dataUrl : '',
        /**
         * Option: autoSave
         * Whether to automatically save data changes
         */
        autoSave : false,
        /**
         * Option: saveUrl
         * The URL to send data to to be saved
         */
        saveUrl : ''
    },

    saveCount : 0,
    continueSaving : true,
    /**
     * Constructor: Jx.Store.Remote
     * Creates the Remote Store.
     * 
     * Parameters: 
     * options - <Jx.Store.Remote.Options> and <Jx.Store.Options>
     */
    initialize : function (options) {
        this.parent(options);
        this.addEvent('newrow', this.onNewRow.bind(this));
    },

    /**
     * APIMethod: load
     * Used to load data either locally or remote
     * 
     * Parameters:
     * params - an object of params to pass to load. These will be sent in the request. 
     */
    load : function (params) {
        this.remoteLoad(params);
    },

    /** 
     * APIMethod: refresh
     * Override of base function <Jx.Store#refresh>. Allow refreshing data from the server
     * 
     * Parameters:
     * reset - whether to reset the counter after the refresh
     */
    refresh : function (reset) {
        //Call the load function to get the data
        //from the server and reset the counter if requested
        if ($defined(this.options.dataUrl)) {
            this.load();
        } else {
            return null;
        }
        if (reset) {
            this.index = 0;
        }
    
    },
    
    /** 
     * APIMethod: save
     * Determines if a row is dirty and needs to be saved to the server.
     */
    save : function () {
        if ($defined(this.data)) {
            //count how many rows to save
            this.data.each(function (row, index) {
                if (this.isRowDirty(row)) {
                    this.saveCount++;
                }
            }, this);
            //save all dirty rows
            this.data.each(function (row, index) {
                if (this.isRowDirty(row) && this.continueSaving) {
                    row.erase('dirty');
                    this.remoteSave(row);
                }
            }, this);
        } else {
            return null;
        }
    },
    
    /**
     * Method: onNewRow
     * Called when a new row is added (event listener). If autoSave is set, this will
     * fire off the save method.
     */
    onNewRow : function () {
        if (this.options.autoSave) {
            this.save();
        }
    },
    
    /** 
     * Method: remoteSave
     * Actually does the work of sending the row to the server for saving.
     * 
     * Parameters:
     * data - the row to save
     */
    remoteSave : function (data) {
        //save the data passed in.
        if (Jx.type(data) === 'hash' && this.continueSaving) {
            // save it
            var req = new Request.JSON({
                data : JSON.encode(data),
                url : this.options.saveUrl,
                onSuccess : this.processReturn.bind(this),
                onFailure : this.handleSaveError.bind(this),
                method : 'post'
            });
            req.send();
        } else {
            //don't save it
            return false;
        }
    },
    
    /** 
     * Method: remoteLoad
     * Calls the server to get data
     */
    remoteLoad : function (params) {
        params = $defined(params) ? params : {};
        var req = new Request.JSON({
            url : this.options.dataUrl,
            data: params,
            onSuccess : this.processGetReturn.bind(this),
            onFailure : this.handleLoadError.bind(this),
            method : 'get'
        });
        req.send();
    },
    
    /**
     * Method: processReturn
     * processes the return from the save request
     * 
     * Parameters:
     * data - decoded JSON object
     * text - the JSON object as a string
     */
    processReturn : function (data, text) {
        if ($defined(data) && $defined(data.success) && data.success === true) {
            this.processSaveReturn(data.data);
        } else {
            this.handleSaveError(data, text);
        }
    },
    /**
     * Method: processGetReturn
     * Processes returned data from the get request
     * 
     * Parameters:
     * data - decoded JSON object
     * text - the JSON object as a string
     */
    processGetReturn : function (data, text) {
        if ($defined(data) && $defined(data.success) && data.success === true) {
            this.processGetData(data.data);
        } else {
            this.handleLoadError(data, text);
        }
    },
    /** 
     * Method: processSaveReturn
     * Private function. Decreases save counter and fires saveSuccess event when all rows are saved
     * 
     * Parameters:
     * data - json data returned from server
     */
    processSaveReturn : function (data) {
        this.saveCount--;
        if (this.saveCount === 0) {
            this.fireEvent('saveSuccess', this);
        }
    },
    
    /** 
     * Method: handleSaveError
     * Private function. Handles the case where the server returns an error (no JSON object, usually a 500 or 404 type error)
     * Fires saveError event in this case and sets continue saving to false.
     * 
     * Parameters:
     * data - the data returned from the server
     * text - the text version of the data
     */
    handleSaveError : function (data, text) {
        this.continueSaving = false;
        this.fireEvent('saveError', [ this, data, text ]);
    },
    
    /**
     * Method: handleLoadError
     * Private function. Handles problems with loading data by firing the loadError event.
     * 
     * Parameters:
     * data - the data returned from the server
     * text - the text version of the data
     */
    handleLoadError : function (data, text) {
        this.fireEvent('loadError', [ this, data ]);
    },
    
    /** 
     * Method: processGetData
     * Private function. Used to process data retrieved from the server
     * 
     * Parameters:
     * data - the data returned from the server
     * text - the text version of the data
     */
    processGetData : function (data) {
        if ($defined(data.columns)) {
            this.options.columns = data.columns;
        }
        this.processData(data.data);
    }

});
// $Id: $
/**
 * class: Jx.Sort.Mergesort 
 * 
 * Extends: <Jx.Sort>
 * 
 * Implementation of a mergesort algorithm designed to
 * work on <Jx.Store> data.
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Sort.Mergesort = new Class({

    Extends : Jx.Sort,

    name : 'mergesort',

    /**
     * APIMethod: sort 
     * Actually runs the sort on the data
     * 
     * returns: the sorted data
     */
    sort : function () {
        this.fireEvent('start');
        var d = this.mergeSort(this.data);
        this.fireEvent('stop');
        return d;

    },

    /**
     * Method: mergeSort 
     * Does the physical sorting. Called
     * recursively.
     * 
     * Parameters: 
     * arr - the array to sort
     * 
     * returns: the sorted array
     */
    mergeSort : function (arr) {
        if (arr.length <= 1) {
            return arr;
        }

        var middle = (arr.length) / 2;
        var left = arr.slice(0, middle);
        var right = arr.slice(middle);
        left = this.mergeSort(left);
        right = this.mergeSort(right);
        var result = this.merge(left, right);
        return result;
    },

    /**
     * Method: merge 
     * Does the work of merging to arrays in order.
     * 
     * parameters: 
     * left - the left hand array 
     * right - the right hand array
     * 
     * returns: the merged array
     */
    merge : function (left, right) {
        var result = [];

        while (left.length > 0 && right.length > 0) {
            if (this.comparator((left[0]).get(this.col), (right[0])
                    .get(this.col)) <= 0) {
                result.push(left[0]);
                left = left.slice(1);
            } else {
                result.push(right[0]);
                right = right.slice(1);
            }
        }
        while (left.length > 0) {
            result.push(left[0]);
            left = left.slice(1);
        }
        while (right.length > 0) {
            result.push(right[0]);
            right = right.slice(1);
        }
        return result;
    }

});
// $Id: $
/**
 * Class: Jx.Sort.Heapsort 
 * 
 * Extends: <Jx.Sort>
 * 
 * Implementation of a heapsort algorithm designed to
 * work on <Jx.Store> data.
 * 
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Sort.Heapsort = new Class({

    Extends : Jx.Sort,

    name : 'heapsort',

    /**
     * APIMethod: sort 
     * Actually runs the sort on the data
     * 
     * Returns: the sorted data
     */
    sort : function () {
        this.fireEvent('start');

        var count = this.data.length;

        if (count === 1) {
            return this.data;
        }

        if (count > 2) {
            this.heapify(count);

            var end = count - 1;
            while (end > 1) {
                this.data.swap(end, 0);
                end = end - 1;
                this.siftDown(0, end);
            }
        } else {
            // check then order the two we have
            if ((this.comparator((this.data[0]).get(this.col), (this.data[1])
                    .get(this.col)) > 0)) {
                this.data.swap(0, 1);
            }
        }

        this.fireEvent('stop');
        return this.data;
    },

    /**
     * Method: heapify 
     * Puts the data in Max-heap order
     * 
     * Parameters: count - the number of records we're sorting
     */
    heapify : function (count) {
        var start = Math.round((count - 2) / 2);

        while (start >= 0) {
            this.siftDown(start, count - 1);
            start = start - 1;
        }
    },

    /**
     * Method: siftDown 
     * 
     * Parameters: start - the beginning of the sort range end - the end of the
     * sort range
     */
    siftDown : function (start, end) {
        var root = start;

        while (root * 2 <= end) {
            var child = root * 2;
            if ((child + 1 < end) && (this.comparator((this.data[child]).get(this.col),
                            (this.data[child + 1]).get(this.col)) < 0)) {
                child = child + 1;
            }
            if ((this.comparator((this.data[root]).get(this.col),
                    (this.data[child]).get(this.col)) < 0)) {
                this.data.swap(root, child);
                root = child;
            } else {
                return;
            }
        }
    }

});
// $Id: $
/**
 * Class: Jx.Sort.Quicksort 
 * 
 * Extends: <Jx.Sort>
 * 
 * Implementation of a quicksort algorithm designed to
 * work on <Jx.Store> data.
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Sort.Quicksort = new Class({

    Extends : Jx.Sort,

    name : 'quicksort',

    /**
     * APIMethod: sort 
     * Actually runs the sort on the data
     * 
     * returns: the sorted data
     */
    sort : function (left, right) {
        this.fireEvent('start');

        if (!$defined(left)) {
            left = 0;
        }
        if (!$defined(right)) {
            right = this.data.length - 1;
        }

        this.quicksort(left, right);

        this.fireEvent('stop');

        return this.data;

    },

    /**
     * Method: quicksort 
     * Initiates the sorting. Is
     * called recursively
     * 
     * Parameters: 
     * left - the left hand, or lower, bound of the sort
     * right - the right hand, or upper, bound of the sort
     */
    quicksort : function (left, right) {
        if (left >= right) {
            return;
        }

        var index = this.partition(left, right);
        this.quicksort(left, index - 1);
        this.quicksort(index + 1, right);
    },

    /**
     * Method: partition
     * 
     * Parameters: 
     * left - the left hand, or lower, bound of the sort
     * right - the right hand, or upper, bound of the sort
     */
    partition : function (left, right) {
        this.findMedianOfMedians(left, right);
        var pivotIndex = left;
        var pivotValue = (this.data[pivotIndex]).get(this.col);
        var index = left;
        var i;

        this.data.swap(pivotIndex, right);
        for (i = left; i < right; i++) {
            if (this.comparator((this.data[i]).get(this.col),
                    pivotValue) < 0) {
                this.data.swap(i, index);
                index = index + 1;
            }
        }
        this.data.swap(right, index);

        return index;

    },

    /**
     * Method: findMedianOfMedians
     * 
     * Parameters: l
     * eft - the left hand, or lower, bound of the sort
     * right - the right hand, or upper, bound of the sort
     */
    findMedianOfMedians : function (left, right) {
        if (left === right) {
            return this.data[left];
        }

        var i;
        var shift = 1;
        while (shift <= (right - left)) {
            for (i = left; i <= right; i += shift * 5) {
                var endIndex = (i + shift * 5 - 1 < right) ? i + shift * 5 - 1 : right;
                var medianIndex = this.findMedianIndex(i, endIndex,
                        shift);

                this.data.swap(i, medianIndex);
            }
            shift *= 5;
        }

        return this.data[left];
    },

    /**
     * Method: findMedianIndex 
     * 
     * Parameters: 
     * left - the left hand, or lower, bound of the sort
     * right - the right hand, or upper, bound of the sort
     */
    findMedianIndex : function (left, right, shift) {
        var groups = Math.round((right - left) / shift + 1);
        var k = Math.round(left + groups / 2 * shift);
        if (k > this.data.length - 1) {
            k = this.data.length - 1;
        }
        for (var i = left; i < k; i += shift) {
            var minIndex = i;
            var v = this.data[minIndex];
            var minValue = v.get(this.col);

            for (var j = i; j <= right; j += shift) {
                if (this.comparator((this.data[j]).get(this.col),
                        minValue) < 0) {
                    minIndex = j;
                    minValue = (this.data[minIndex]).get(this.col);
                }
            }
            this.data.swap(i, minIndex);
        }

        return k;
    }
});
// $Id: $
/**
 * Class: Jx.Sort.Nativesort
 * 
 * Extends: <Jx.Sort>
 * 
 * Implementation of a native sort algorithm designed to work on <Jx.Store> data.
 * 
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Sort.Nativesort = new Class({

    Extends : Jx.Sort,

    name : 'nativesort',

    /**
     * Method: sort
     * Actually runs the sort on the data
     * 
     * Returns:
     * the sorted data
     */
    sort : function () {
        this.fireEvent('start');

        var compare = function (a, b) {
            return this.comparator((this.data[a]).get(this.col), (this.data[b])
                    .get(this.col));
        };

        this.data.sort(compare);
        this.fireEvent('stop');
        return this.data;
    }

});
// $Id: button.js 491 2009-07-24 22:05:00Z pagameba $
/**
 * Class: Jx.Button
 *
 * Extends: <Jx.Widget>
 *
 * Jx.Button creates a clickable element that can be added to a web page.
 * When the button is clicked, it fires a 'click' event.
 *
 * The CSS styling for a button is controlled by several classes related
 * to the various objects in the button's HTML structure:
 *
 * (code)
 * <div class="jxButtonContainer">
 *  <a class="jxButton">
 *   <span class="jxButtonContent">
 *    <img class="jxButtonIcon" src="image_url">
 *    <span class="jxButtonLabel">button label</span>
 *   </span>
 *  </a>
 * </div>
 * (end)
 *
 * The CSS classes will change depending on the type option passed to the
 * constructor of the button.  The default type is Button.  Passing another
 * value such as Tab will cause all the CSS classes to change from jxButton
 * to jxTab.  For example:
 *
 * (code)
 * <div class="jxTabContainer">
 *  <a class="jxTab">
 *   <span class="jxTabContent">
 *    <img class="jxTabIcon" src="image_url">
 *    <span class="jxTabLabel">tab label</span>
 *   </span>
 *  </a>
 * </div>
 * (end)
 *
 * When you construct a new instance of Jx.Button, the button does not
 * automatically get inserted into the web page.  Typically a button
 * is used as part of building another capability such as a Jx.Toolbar.
 * However, if you want to manually insert the button into your application,
 * you may use the addTo method to append or insert the button into the 
 * page.  
 *
 * There are two modes for a button, normal and toggle.  A toggle button
 * has an active state analogous to a checkbox.  A toggle button generates
 * different events (down and up) from a normal button (click).  To create
 * a toggle button, pass toggle: true to the Jx.Button constructor.
 *
 * To use a Jx.Button in an application, you should to register for the
 * 'click' event.  You can pass a function in the 'onClick' option when
 * constructing a button or you can call the addEvent('click', myFunction)
 * method.  The addEvent method can be called several times, allowing more
 * than one function to be called when a button is clicked.  You can use the 
 * removeEvent('click', myFunction) method to stop receiving click events.
 *
 * Example:
 *
 * (code)
 * var button = new Jx.Button(options);
 * button.addTo('myListItem'); // the id of an LI in the page.
 * (end)
 *
 * (code)
 * Example:
 * var options = {
 *     imgPath: 'images/mybutton.png',
 *     tooltip: 'click me!',
 *     label: 'click me',
 *     onClick: function() {
 *         alert('you clicked me');
 *     }
 * };
 * var button = new Jx.Button(options);
 * button.addEvent('click', anotherFunction);
 *
 * function anotherFunction() {
 *   alert('a second alert for a single click');
 * }
 * (end)
 *
 * Events:
 * click - the button was pressed and released (only if type is not 'toggle').
 * down - the button is down (only if type is 'toggle')
 * up - the button is up (only if the type is 'toggle').
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Button = new Class({
    Family: 'Jx.Button',
    Extends: Jx.Widget,
    
    /**
     * the HTML element that is inserted into the DOM for this button.  You
     * may reference this object to append it to the DOM or remove it from
     * the DOM if necessary.
     */
    domObj: null,
    
    options: {
        /* Option: id
         * optional.  A string value to use as the ID of the button
         * container.
         */
        id: '',
        /* Option: image
         * optional.  A string value that is the url to load the image to
         * display in this button.  The default styles size this image to 16 x
         * 16.  If not provided, then the button will have no icon.
         */
        image: '',
        /* Option: tooltip
         * optional.  A string value to use as the alt/title attribute of the
         * <A> tag that wraps the button, resulting in a tooltip that appears
         * when the user hovers the mouse over a button in most browsers.  If
         * not provided, the button will have no tooltip.
         */
        tooltip: '',
        /* Option: label
         * optional, default is no label.  A string value that is used as a
         * label on the button.
         */
        label: '',
        /* Option: toggle
         * default true, whether the button is a toggle button or not.
         */
        toggle: false,
        /* Option: active
         * optional, default false.  Controls the initial state of toggle
         * buttons.
         */
        active: false,
        /* Option: enabled
         * whether the button is enabled or not.
         */
        enabled: true,
        /* Option: template
         * the HTML structure of the button.  As a minimum, there must be a
         * containing element with a class of jxButtonContainer and an internal
         * element with a class of jxButton.  jxButtonIcon and jxButtonLabel are
         * used if present to put the image and label into the button.
         */
        template: '<span class="jxButtonContainer"><a class="jxButton"><span class="jxButtonContent"><img class="jxButtonIcon" src="'+Jx.aPixel.src+'"><span class="jxButtonLabel"></span></span></a></span>'
    },
    type: 'Button',
    classes: ['jxButtonContainer', 'jxButton','jxButtonIcon','jxButtonLabel'],
    elements: null,
    /**
     * Constructor: Jx.Button
     * create a new button.
     *
     * Parameters:
     * options - {Object} an object containing optional properties for this
     * button as below.
     */
    initialize : function( options ) {
        this.setOptions(options);
        
        this.elements = this.processTemplate(this.options.template, this.classes);
        
        this.domObj = this.elements.get('jx'+this.type+'Container');
        this.domA = this.elements.get('jx'+this.type);
        this.domImg = this.elements.get('jx'+this.type+'Icon');
        this.domLabel = this.elements.get('jx'+this.type + 'Label');
        
        /* is the button toggle-able? */
        if (this.options.toggle) {
            this.domObj.addClass('jx'+this.type+'Toggle');
        }
        
        // the clickable part of the button
        if (this.domA) {
            var hasFocus;
            var mouseDown;
            this.domA.set({
                href: 'javascript:void(0)', 
                title: this.options.tooltip, 
                alt: this.options.tooltip
            });
            this.domA.addEvents({
                click: this.clicked.bindWithEvent(this),
                drag: (function(e) {e.stop();}).bindWithEvent(this),
                mousedown: (function(e) {
                    this.domA.addClass('jx'+this.type+'Pressed');
                    hasFocus = true;
                    mouseDown = true;
                    this.focus();
                }).bindWithEvent(this),
                mouseup: (function(e) {
                    this.domA.removeClass('jx'+this.type+'Pressed');
                    mouseDown = false;
                }).bindWithEvent(this),
                mouseleave: (function(e) {
                    this.domA.removeClass('jx'+this.type+'Pressed');
                }).bindWithEvent(this),
                mouseenter: (function(e) {
                    if (hasFocus && mouseDown) {
                        this.domA.addClass('jx'+this.type+'Pressed');
                    }
                }).bindWithEvent(this),
                keydown: (function(e) {
                    if (e.key == 'enter') {
                        this.domA.addClass('jx'+this.type+'Pressed');
                    }
                }).bindWithEvent(this),
                keyup: (function(e) {
                    if (e.key == 'enter') {
                        this.domA.removeClass('jx'+this.type+'Pressed');
                    }
                }).bindWithEvent(this),
                blur: function() { hasFocus = false; }
            });

            if (typeof Drag != 'undefined') {
                new Drag(this.domA, {
                    onStart: function() {this.stop();}
                });
            }
        }

        if (this.domImg) {
            if (this.options.image || !this.options.label) {
                this.domImg.set({
                    title: this.options.tooltip, 
                    alt: this.options.tooltip
                });
                if (this.options.image && this.options.image.indexOf('a_pixel.png') == -1) {
                    this.domImg.setStyle('backgroundImage',"url("+this.options.image+")");
                }
                if (this.options.imageClass) {
                    this.domImg.addClass(this.options.imageClass);
                }
            } else {
                //remove the image if we don't need it
                this.domImg.setStyle('display','none');
            }
        }
        
        if (this.domLabel) {
            if (this.options.label) {
                this.domLabel.set('html',this.options.label);
            } else {
                this.domLabel.removeClass('jx'+this.type+'Label');
            }
        }
        
        if (this.options.id) {
            this.domObj.set('id', this.options.id);
        }
        
        //update the enabled state
        this.setEnabled(this.options.enabled);
        
        //update the active state if necessary
        if (this.options.active) {
            this.options.active = false;
            this.setActive(true);
        }
        
    },
    /**
     * Method: clicked
     * triggered when the user clicks the button, processes the
     * actionPerformed event
     *
     * Parameters:
     * evt - {Event} the user click event
     */
    clicked : function(evt) {
        if (this.options.enabled) {
            if (this.options.toggle) {
                this.setActive(!this.options.active);
            } else {
                this.fireEvent('click', {obj: this, event: evt});
            }
        }
        //return false;
    },
    /**
     * Method: isEnabled
     * This returns true if the button is enabled, false otherwise
     *
     * Returns:
     * {Boolean} whether the button is enabled or not
     */
    isEnabled: function() { 
        return this.options.enabled; 
    },
    
    /**
     * Method: setEnabled
     * enable or disable the button.
     *
     * Parameters:
     * enabled - {Boolean} the new enabled state of the button
     */
    setEnabled: function(enabled) {
        this.options.enabled = enabled;
        if (this.options.enabled) {
            this.domObj.removeClass('jxDisabled');
        } else {
            this.domObj.addClass('jxDisabled');
        }
    },
    /**
     * Method: isActive
     * For toggle buttons, this returns true if the toggle button is
     * currently active and false otherwise.
     *
     * Returns:
     * {Boolean} the active state of a toggle button
     */
    isActive: function() { 
        return this.options.active; 
    },
    /**
     * Method: setActive
     * Set the active state of the button
     *
     * Parameters:
     * active - {Boolean} the new active state of the button
     */
    setActive: function(active) {
        if (this.options.active == active) {
            return;
        }
        this.options.active = active;
        if (this.options.active) {
            this.domA.addClass('jx'+this.type+'Active');
            this.fireEvent('down', this);
        } else {
            this.domA.removeClass('jx'+this.type+'Active');
            this.fireEvent('up', this);
        }
    },
    /**
     * Method: setImage
     * set the image of this button to a new image URL
     *
     * Parameters:
     * path - {String} the new url to use as the image for this button
     */
    setImage: function(path) {
        this.options.image = path;
        if (this.domImg) {
            this.domImg.setStyle('backgroundImage',
                                 "url("+this.options.image+")");
            this.domImg.setStyle('display', path ? null : 'none');
        }
    },
    /**
     * Method: setLabel
     * 
     * sets the text of the button.
     *
     * Parameters: 
     *
     * label - {String} the new label for the button
     */
    setLabel: function(label) {
        this.options.label = label;
        if (this.domLabel) {
            this.domLabel.set('html', label);
            if (!label && this.domLabel.hasClass('jxButtonLabel')) {
                this.domLabel.removeClass('jxButtonLabel');
            } else if (label && !this.domLabel.hasClass('jxButtonLabel')) {
                this.domLabel.addClass('jxButtonLabel');
            }
        }
    },
    /**
     * Method: getLabel
     * 
     * returns the text of the button.
     */
    getLabel: function() {
        return this.options.label;
    },
    /**
     * Method: setTooltip
     * sets the tooltip displayed by the button
     *
     * Parameters: 
     * tooltip - {String} the new tooltip
     */
    setTooltip: function(tooltip) {
        if (this.domA) {
            this.domA.set({
                'title':tooltip,
                'alt':tooltip
            });
        }
    },
    /**
     * Method: focus
     * capture the keyboard focus on this button
     */
    focus: function() {
        this.domA.focus();
    },
    /**
     * Method: blur
     * remove the keyboard focus from this button
     */
    blur: function() {
        this.domA.blur();
    }
});
// $Id: flyout.js 489 2009-07-24 21:22:26Z pagameba $
/**
 * Class: Jx.Button.Flyout
 *
 * Extends: <Jx.Button>
 *
 * Implements: <Jx.ContentLoader>, <Jx.AutoPosition>, <Jx.Chrome>
 *
 * Flyout buttons expose a panel when the user clicks the button.  The
 * panel can have arbitrary content.  You must provide any necessary 
 * code to hook up elements in the panel to your application.
 *
 * When the panel is opened, the 'open' event is fired.  When the panel is
 * closed, the 'close' event is fired.  You can register functions to handle
 * these events in the options passed to the constructor (onOpen, onClose).
 * 
 * The user can close the flyout panel by clicking the button again, by
 * clicking anywhere outside the panel and other buttons, or by pressing the
 * 'esc' key.
 *
 * Flyout buttons implement <Jx.ContentLoader> which provides the hooks to
 * insert content into the Flyout element.  Note that the Flyout element
 * is not appended to the DOM until the first time it is opened, and it is
 * removed from the DOM when closed.
 *
 * It is generally best to specify a width and height for your flyout content
 * area through CSS to ensure that it works correctly across all browsers.
 * You can do this for all flyouts using the .jxFlyout CSS selector, or you
 * can apply specific styles to your content elements.
 *
 * A flyout closes other flyouts when it is opened.  It is possible to embed
 * flyout buttons inside the content area of another flyout button.  In this
 * case, opening the inner flyout will not close the outer flyout but it will
 * close any other flyouts that are siblings.
 *
 * Example:
 * (code)
 * var flyout = new Jx.Button.Flyout({
 *      label: 'flyout',
 *      content: 'flyoutContent',
 *      onOpen: function(flyout) {
 *          console.log('flyout opened');
 *      },
 *      onClose: function(flyout) {
 *          console.log('flyout closed');
 *      }
 * });
 * (end)
 *
 * Events:
 * open - this event is triggered when the flyout is opened.
 * close - this event is triggered when the flyout is closed.
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Button.Flyout = new Class({
    Family: 'Jx.Button.Flyout',
    Extends: Jx.Button,
    
    /**
     * Property: content
     * the HTML element that contains the flyout content
     */
    content: null,
    /**
     * Constructor: initialize
     * construct a new instance of a flyout button.  The single options
     * argument takes a combination of options that apply to <Jx.Button>,
     * <Jx.ContentLoader>, and <Jx.AutoPosition>.
     *
     * Parameters: 
     * options - an options object used to initialize the button, see 
     * <Jx.Button.Options>, <Jx.ContentLoader.Options>, and
     * <Jx.AutoPosition.Options> for details.
     */
    initialize: function(options) {
        if (!Jx.Button.Flyout.Stack) {
            Jx.Button.Flyout.Stack = [];
        }
        this.parent(options);
        this.domA.addClass('jx'+this.type+'Flyout');
        
        this.contentContainer = new Element('div',{
            'class':'jxFlyout'
        });
        
        this.content = new Element('div', {
            'class': 'jxFlyoutContent'
        });
        if (this.options.contentClass) {
            this.content.addClass(this.options.contentClass);
        }
        this.contentContainer.adopt(this.content);
        
        this.content.store('jxFlyout', this);
        this.loadContent(this.content);
        this.keypressWatcher = this.keypressHandler.bindWithEvent(this);
        this.hideWatcher = this.clickHandler.bindWithEvent(this);
    },
    /**
     * Method: clicked
     * Override <Jx.Button::clicked> to hide/show the content area of the
     * flyout.
     *
     * Parameters:
     * e - {Event} the user event
     */ 
    clicked: function(e) {
        if (!this.options.enabled) {
            return;
        }
        /* find out what we are contained by if we don't already know */
        if (!this.owner) {
            this.owner = document.body;
            var node = document.id(this.domObj.parentNode);
            while (node != document.body && this.owner == document.body) {
                var flyout = node.retrieve('jxFlyout');
                if (flyout) {
                    this.owner = flyout;
                    break;
                } else {
                    node = document.id(node.parentNode);
                }
            }
        }
        if (Jx.Button.Flyout.Stack[Jx.Button.Flyout.Stack.length - 1] == this) {
            this.hide();
            return;
        } else if (this.owner != document.body) {
            /* if we are part of another flyout, close any open flyouts
             * inside the parent and register this as the current flyout
             */
            if (this.owner.currentFlyout == this) {
                /* if the flyout to close is this flyout,
                 * hide this and return */
                this.hide();
                return;
            } else if (this.owner.currentFlyout) {
                this.owner.currentFlyout.hide();
            }
            this.owner.currentFlyout = this;                
        } else {
            /* if we are at the top level, close the entire stack before
             * we open
             */
            while (Jx.Button.Flyout.Stack.length) {
                Jx.Button.Flyout.Stack[Jx.Button.Flyout.Stack.length - 1].hide();
            }
        }
        // now we go on the stack.
        Jx.Button.Flyout.Stack.push(this);

        this.options.active = true;
        this.domA.addClass('jx'+this.type+'Active');
        this.contentContainer.setStyle('visibility','hidden');
        document.id(document.body).adopt(this.contentContainer);
        this.content.getChildren().each(function(child) {
            if (child.resize) { 
                child.resize(); 
            }
        });
        this.showChrome(this.contentContainer);
        
        this.position(this.contentContainer, this.domObj, {
            horizontal: ['left left', 'right right'],
            vertical: ['bottom top', 'top bottom'],
            offsets: this.chromeOffsets
        });
        
        /* we have to size the container for IE to render the chrome correctly
         * there is some horrible peekaboo bug in IE 6
         */
        this.contentContainer.setContentBoxSize(document.id(this.content).getMarginBoxSize());
        
        this.contentContainer.setStyle('visibility','');

        document.addEvent('keydown', this.keypressWatcher);
        document.addEvent('click', this.hideWatcher);
        this.fireEvent('open', this);
    },
    /**
     * Method: hide
     * Closes the flyout if open
     */
    hide: function() {
        if (this.owner != document.body) {
            this.owner.currentFlyout = null;            
        }
        Jx.Button.Flyout.Stack.pop();
        this.setActive(false);
        this.contentContainer.dispose();
        document.removeEvent('keydown', this.keypressWatcher);    
        document.removeEvent('click', this.hideWatcher);
        this.fireEvent('close', this);
    },
    /* hide flyout if the user clicks outside of the flyout */
    clickHandler: function(e) {
        e = new Event(e);
        var elm = document.id(e.target);
        var flyout = Jx.Button.Flyout.Stack[Jx.Button.Flyout.Stack.length - 1];
        if (!elm.descendantOf(flyout.content) &&
            !elm.descendantOf(flyout.domObj)) {
            flyout.hide();
        }
    },
    /* hide flyout if the user presses the ESC key */
    keypressHandler: function(e) {
        e = new Event(e);
        if (e.key == 'esc') {
            Jx.Button.Flyout.Stack[Jx.Button.Flyout.Stack.length - 1].hide();
        }
    }
});// $Id: layout.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.Layout
 *
 * Extends: <Jx.Object>
 * 
 * Jx.Layout is used to provide more flexible layout options for applications
 *
 * Jx.Layout wraps an existing DOM element (typically a div) and provides
 * extra functionality for sizing that element within its parent and sizing
 * elements contained within it that have a 'resize' function attached to them.
 *
 * To create a Jx.Layout, pass the element or id plus an options object to
 * the constructor.
 *
 * Example:
 * (code)
 * var myContainer = new Jx.Layout('myDiv', options);
 * (end)
 *
 * Events:
 * sizeChange - fired when the size of the container changes
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
 
Jx.Layout = new Class({
    Family: 'Jx.Layout',
    Extends: Jx.Object,
    
    options: {
        /* Option: propagate
         * boolean, controls propogation of resize to child nodes.
         * True by default. If set to false, changes in size will not be
         * propogated to child nodes.
         */
        propagate: true,
        /* Option: position
         * how to position the element, either 'absolute' or 'relative'.
         * The default (if not passed) is 'absolute'.  When using
         * 'absolute' positioning, both the width and height are
         * controlled by Jx.Layout.  If 'relative' positioning is used
         * then only the width is controlled, allowing the height to
         * be controlled by its content.
         */
        position: 'absolute',
        /* Option: left
         * the distance (in pixels) to maintain the left edge of the element
         * from its parent element.  The default value is 0.  If this is set
         * to 'null', then the left edge can be any distance from its parent
         * based on other parameters.
         */
        left: 0,
        /* Option: right
         * the distance (in pixels) to maintain the right edge of the element
         * from its parent element.  The default value is 0.  If this is set
         * to 'null', then the right edge can be any distance from its parent
         * based on other parameters.
         */
        right: 0,
        /* Option: top
         * the distance (in pixels) to maintain the top edge of the element
         * from its parent element.  The default value is 0.  If this is set
         * to 'null', then the top edge can be any distance from its parent
         * based on other parameters.
         */
        top: 0,
        /* Option: bottom
         * the distance (in pixels) to maintain the bottom edge of the element
         * from its parent element.  The default value is 0.  If this is set
         * to 'null', then the bottom edge can be any distance from its parent
         * based on other parameters.
         */
        bottom: 0,
        /* Option: width
         * the width (in pixels) of the element.  The default value is null.
         * If this is set to 'null', then the width can be any value based on
         * other parameters.
         */
        width: null,
        /* Option: height
         * the height (in pixels) of the element.  The default value is null.
         * If this is set to 'null', then the height can be any value based on
         * other parameters.
         */
        height: null,
        /* Option: minWidth
         * the minimum width that the element can be sized to.  The default
         * value is 0.
         */
        minWidth: 0,
        /* Option: minHeight
         * the minimum height that the element can be sized to.  The
         * default value is 0.
         */
        minHeight: 0,
        /* Option: maxWidth
         * the maximum width that the element can be sized to.  The default
         * value is -1, which means no maximum.
         */
        maxWidth: -1,
        /* Option: maxHeight
         * the maximum height that the element can be sized to.  The
         * default value is -1, which means no maximum.
         */
        maxHeight: -1
    },
    /**
     * Constructor: Jx.Layout
     * Create a new instance of Jx.Layout.
     *
     * Parameters:
     * domObj - {HTMLElement} element or id to apply the layout to
     * options - <Jx.Layout.Options>
     */
    initialize: function(domObj, options) {
        this.setOptions(options);
        this.domObj = document.id(domObj);
        this.domObj.resize = this.resize.bind(this);
        this.domObj.setStyle('position', this.options.position);
        this.domObj.store('jxLayout', this);

        if (document.body == this.domObj.parentNode) {
            window.addEvent('resize', this.windowResize.bindWithEvent(this));
            window.addEvent('load', this.windowResize.bind(this));                
        }
        //this.resize();
    },
    
    /**
     * Method: windowResize
     * when the window is resized, any Jx.Layout controlled elements that are
     * direct children of the BODY element are resized
     */
     windowResize: function() {
         this.resize();
         if (this.resizeTimer) {
             $clear(this.resizeTimer);
             this.resizeTimer = null;
         }
         this.resizeTimer = this.resize.delay(50, this);
    },
    
    /**
     * Method: resize
     * resize the element controlled by this Jx.Layout object.
     *
     * Parameters:
     * options - new options to apply, see <Jx.Layout.Options>
     */
    resize: function(options) {
         /* this looks like a really big function but actually not
          * much code gets executed in the two big if statements
          */
        this.resizeTimer = null;
        var needsResize = false;
        if (options) {
            for (var i in options) {
                //prevent forceResize: false from causing a resize
                if (i == 'forceResize') {
                    continue;
                }
                if (this.options[i] != options[i]) {
                    needsResize = true;
                    this.options[i] = options[i];
                }
            }
            if (options.forceResize) {
                needsResize = true;
            }
        }
        if (!document.id(this.domObj.parentNode)) {
            return;
        }
        
        var parentSize;
        if (this.domObj.parentNode.tagName == 'BODY') {
            parentSize = Jx.getPageDimensions();
        } else {
            parentSize = document.id(this.domObj.parentNode).getContentBoxSize();
        }
    
        if (this.lastParentSize && !needsResize) {
            needsResize = (this.lastParentSize.width != parentSize.width || 
                          this.lastParentSize.height != parentSize.height);
        } else {
            needsResize = true;
        }
        this.lastParentSize = parentSize;            
        
        if (!needsResize) {
            return;
        }
        
        var l, t, w, h;
        
        /* calculate left and width */
        if (this.options.left != null) {
            /* fixed left */
            l = this.options.left;
            if (this.options.right == null) {
                /* variable right */
                if (this.options.width == null) {
                    /* variable right and width
                     * set right to min, stretch width */
                    w = parentSize.width - l;
                    if (w < this.options.minWidth ) {
                        w = this.options.minWidth;
                    }
                    if (this.options.maxWidth >= 0 && w > this.options.maxWidth) {
                        w = this.options.maxWidth;
                    }
                } else {
                    /* variable right, fixed width
                     * use width
                     */
                    w = this.options.width;
                }
            } else {
                /* fixed right */
                if (this.options.width == null) {
                    /* fixed right, variable width
                     * stretch width
                     */
                    w = parentSize.width - l - this.options.right;
                    if (w < this.options.minWidth) {
                        w = this.options.minWidth;
                    }
                    if (this.options.maxWidth >= 0 && w > this.options.maxWidth) {
                        w = this.options.maxWidth;
                    }
                } else {
                    /* fixed right, fixed width
                     * respect left and width, allow right to stretch
                     */
                    w = this.options.width;
                }
            }
            
        } else {
            if (this.options.right == null) {
                if (this.options.width == null) {
                    /* variable left, width and right
                     * set left, right to min, stretch width
                     */
                     l = 0;
                     w = parentSize.width;
                     if (this.options.maxWidth >= 0 && w > this.options.maxWidth) {
                         l = l + parseInt(w - this.options.maxWidth)/2;
                         w = this.options.maxWidth;
                     }
                } else {
                    /* variable left, fixed width, variable right
                     * distribute space between left and right
                     */
                    w = this.options.width;
                    l = parseInt((parentSize.width - w)/2);
                    if (l < 0) {
                        l = 0;
                    }
                }
            } else {
                if (this.options.width != null) {
                    /* variable left, fixed width, fixed right
                     * left is calculated directly
                     */
                    w = this.options.width;
                    l = parentSize.width - w - this.options.right;
                    if (l < 0) {
                        l = 0;
                    }
                } else {
                    /* variable left and width, fixed right
                     * set left to min value and stretch width
                     */
                    l = 0;
                    w = parentSize.width - this.options.right;
                    if (w < this.options.minWidth) {
                        w = this.options.minWidth;
                    }
                    if (this.options.maxWidth >= 0 && w > this.options.maxWidth) {
                        l = w - this.options.maxWidth - this.options.right;
                        w = this.options.maxWidth;                        
                    }
                }
            }
        }
        
        /* calculate the top and height */
        if (this.options.top != null) {
            /* fixed top */
            t = this.options.top;
            if (this.options.bottom == null) {
                /* variable bottom */
                if (this.options.height == null) {
                    /* variable bottom and height
                     * set bottom to min, stretch height */
                    h = parentSize.height - t;
                    if (h < this.options.minHeight) {
                        h = this.options.minHeight;
                    }
                    if (this.options.maxHeight >= 0 && h > this.options.maxHeight) {
                        h = this.options.maxHeight;
                    }
                } else {
                    /* variable bottom, fixed height
                     * stretch height
                     */
                    h = this.options.height;
                    if (this.options.maxHeight >= 0 && h > this.options.maxHeight) {
                        t = h - this.options.maxHeight;
                        h = this.options.maxHeight;
                    }
                }
            } else {
                /* fixed bottom */
                if (this.options.height == null) {
                    /* fixed bottom, variable height
                     * stretch height
                     */
                    h = parentSize.height - t - this.options.bottom;
                    if (h < this.options.minHeight) {
                        h = this.options.minHeight;
                    }
                    if (this.options.maxHeight >= 0 && h > this.options.maxHeight) {
                        h = this.options.maxHeight;
                    }                
                } else {
                    /* fixed bottom, fixed height
                     * respect top and height, allow bottom to stretch
                     */
                    h = this.options.height;
                }
            }
        } else {
            if (this.options.bottom == null) {
                if (this.options.height == null) {
                    /* variable top, height and bottom
                     * set top, bottom to min, stretch height
                     */
                     t = 0;
                     h = parentSize.height;
                     if (h < this.options.minHeight) {
                         h = this.options.minHeight;
                     }
                     if (this.options.maxHeight >= 0 && h > this.options.maxHeight) {
                         t = parseInt((parentSize.height - this.options.maxHeight)/2);
                         h = this.options.maxHeight;
                     }
                } else {
                    /* variable top, fixed height, variable bottom
                     * distribute space between top and bottom
                     */
                    h = this.options.height;
                    t = parseInt((parentSize.height - h)/2);
                    if (t < 0) {
                        t = 0;
                    }
                }
            } else {
                if (this.options.height != null) {
                    /* variable top, fixed height, fixed bottom
                     * top is calculated directly
                     */
                    h = this.options.height;
                    t = parentSize.height - h - this.options.bottom;
                    if (t < 0) {
                        t = 0;
                    }
                } else {
                    /* variable top and height, fixed bottom
                     * set top to min value and stretch height
                     */
                    t = 0;
                    h = parentSize.height - this.options.bottom;
                    if (h < this.options.minHeight) {
                        h = this.options.minHeight;
                    }
                    if (this.options.maxHeight >= 0 && h > this.options.maxHeight) {
                        t = parentSize.height - this.options.maxHeight - this.options.bottom;
                        h = this.options.maxHeight;
                    }
                }
            }
        }
        
        //TODO: check left, top, width, height against current styles
        // and only apply changes if they are not the same.
        
        /* apply the new sizes */
        var sizeOpts = {width: w};
        if (this.options.position == 'absolute') {
            var m = document.id(this.domObj.parentNode).measure(function(){
                return this.getSizes(['padding'],['left','top']).padding;
            });
            this.domObj.setStyles({
                position: this.options.position,
                left: l+m.left,
                top: t+m.top
            });
            sizeOpts.height = h;
        } else {
            if (this.options.height) {
                sizeOpts.height = this.options.height;
            }
        }
        this.domObj.setBorderBoxSize(sizeOpts);
        
        if (this.options.propagate) {
            // propogate changes to children
            var o = {forceResize: options ? options.forceResize : false};
            $A(this.domObj.childNodes).each(function(child){
                if (child.resize && child.getStyle('display') != 'none') {
                    child.resize.delay(0,child,o);                
                }
            });
        }

        this.fireEvent('sizeChange',this);
    }
});// $Id: tab.js 489 2009-07-24 21:22:26Z pagameba $
/**
 * Class: Jx.Button.Tab
 *
 * Extends: <Jx.Button>
 *
 * A single tab in a tab set.  A tab has a label (displayed in the tab) and a
 * content area that is displayed when the tab is active.  A tab has to be
 * added to both a <Jx.TabSet> (for the content) and <Jx.Toolbar> (for the
 * actual tab itself) in order to be useful.  Alternately, you can use
 * a <Jx.TabBox> which combines both into a single control at the cost of
 * some flexibility in layout options.
 *
 * A tab is a <Jx.ContentLoader> and you can specify the initial content of
 * the tab using any of the methods supported by 
 * <Jx.ContentLoader::loadContent>.  You can acccess the actual DOM element
 * that contains the content (if you want to dynamically insert content
 * for instance) via the <Jx.Tab::content> property.
 *
 * A tab is a button of type *toggle* which means that it emits the *up*
 * and *down* events.
 *
 * Example:
 * (code)
 * var tab1 = new Jx.Button.Tab({
 *     label: 'tab 1', 
 *     content: 'content1',
 *     onDown: function(tab) {
 *         console.log('tab became active');
 *     },
 *     onUp: function(tab) {
 *         console.log('tab became inactive');
 *     }
 * });
 * (end)
 *
 * 
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Button.Tab = new Class({
    Family: 'Jx.Button.Tab',
    Extends: Jx.Button,
    /**
     * Property: content
     * {HTMLElement} The content area that is displayed when the tab is active.
     */
    content: null,
    
    options: {
        template: '<div class="jxTabContainer"><a class="jxTab"><span class="jxTabContent"><img class="jxTabIcon"><span class="jxTabLabel"></span></span></a><a class="jxTabClose"><img src="'+Jx.aPixel.src+'"></a></div>'
    },
    type: 'Tab',
    classes: ['jxTabContainer','jxTab','jxTabIcon','jxTabLabel','jxTabClose'],
    
    /**
     * Constructor: Jx.Button.Tab
     * Create a new instance of Jx.Button.Tab.  Any layout options passed are used
     * to create a <Jx.Layout> for the tab content area.
     *
     * Parameters:
     * options - {Object} an object containing options that are used
     * to control the appearance of the tab.  See <Jx.Button>,
     * <Jx.ContentLoader::loadContent> and <Jx.Layout::Jx.Layout> for
     * valid options.
     */
    initialize : function( options) {
        this.parent($merge(options, {toggle:true}));
        this.content = new Element('div', {'class':'tabContent'});
        new Jx.Layout(this.content, options);
        this.loadContent(this.content);
        var that = this;
        this.addEvent('down', function(){that.content.addClass('tabContentActive');});
        this.addEvent('up', function(){that.content.removeClass('tabContentActive');});
        
        //remove the close button if necessary
        var closer = this.elements.get('jx'+this.type+'Close');
        if (closer) {
            if (this.options.close) {
                this.domObj.addClass('jx'+this.type+'Close');
                closer.addEvent('click', (function(){
                    this.fireEvent('close');
                }).bind(this));
            } else {
                closer.dispose();
            }
        }
    },
    /**
     * Method: clicked
     * triggered when the user clicks the button, processes the
     * actionPerformed event
     */
    clicked : function(evt) {
        if (this.options.enabled) {
            this.setActive(true);            
        }
    }
});// $Id: colorpalette.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.ColorPalette
 *
 * Extends: <Jx.Widget>
 *
 * A Jx.ColorPalette presents a user interface for selecting colors.
 * Currently, the user can either enter a HEX colour value or select from a
 * palette of web-safe colours.  The user can also enter an opacity value.
 *
 * A Jx.ColorPalette can be embedded anywhere in a web page using its addTo
 * method.  However, a <Jx.Button> subclass is provided (<Jx.Button.Color>)
 * that embeds a colour panel inside a button for easy use in toolbars.
 *
 * Colour changes are propogated via a change event.  To be notified 
 * of changes in a Jx.ColorPalette, use the addEvent method.
 *
 * Example:
 * (code)
 * (end)
 *
 * Events:
 * change - triggered when the color changes.
 * click - the user clicked on a color swatch (emitted after a change event)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.ColorPalette = new Class({
    Family: 'Jx.ColorPalette',
    Extends: Jx.Widget,
    /**
     * Property: {HTMLElement} domObj
     * the HTML element representing the color panel
     */
    domObj: null,
    options: {
        /* Option: parent
         * default null, the DOM element to add the palette to.
         */
        parent: null,
        /* Option: color
         * default #000000, the initially selected color
         */
        color: '#000000',
        /* Option: alpha
         * default 100, the initial alpha value
         */
        alpha: 1,
        /* Option: hexColors
         * an array of hex colors for creating the palette, defaults to a
         * set of web safe colors.
         */
        hexColors: ['00', '33', '66', '99', 'CC', 'FF'],
        /* Option: alphaLabel
         * the text to display next to the alpha input for i18n.
         */
        alphaLabel: 'alpha (%)'
    },
    /**
     * Constructor: Jx.ColorPalette
     * initialize a new instance of Jx.ColorPalette
     *
     * Parameters:
     * options - <Jx.ColorPalette.Options>
     */
    initialize: function(options) {
        this.setOptions(options);

        this.domObj = new Element('div', {
            id: this.options.id,
            'class':'jxColorPalette'
        });

        var top = new Element('div', {'class':'jxColorBar'});
        var d = new Element('div', {'class':'jxColorPreview'});

        this.selectedSwatch = new Element('div', {'class':'jxColorSelected'});
        this.previewSwatch = new Element('div', {'class':'jxColorHover'});
        d.adopt(this.selectedSwatch);
        d.adopt(this.previewSwatch);
        
        top.adopt(d);

        this.colorInputLabel = new Element('label', {'class':'jxColorLabel', html:'#'});
        top.adopt(this.colorInputLabel);

        var cc = this.changed.bind(this);
        this.colorInput = new Element('input', {
            'class':'jxHexInput',
            'type':'text',
            'maxLength':6,
            events: {
                'keyup':cc,
                'blur':cc,
                'change':cc
            }
        });

        top.adopt(this.colorInput);

        this.alphaLabel = new Element('label', {'class':'jxAlphaLabel', 'html':this.options.alphaLabel});
        top.adopt(this.alphaLabel);

        this.alphaInput = new Element('input', {
            'class':'jxAlphaInput',
            'type':'text',
            'maxLength':3,
            events: {
                'keyup': this.alphaChanged.bind(this)
            }
        });
        top.adopt(this.alphaInput);

        this.domObj.adopt(top);

        var swatchClick = this.swatchClick.bindWithEvent(this);
        var swatchOver = this.swatchOver.bindWithEvent(this);

        var table = new Element('table', {'class':'jxColorGrid'});
        var tbody = new Element('tbody');
        table.adopt(tbody);
        for (var i=0; i<12; i++) {
            var tr = new Element('tr');
            for (var j=-3; j<18; j++) {
                var bSkip = false;
                var r, g, b;
                /* hacky approach to building first three columns
                 * because I couldn't find a good way to do it
                 * programmatically
                 */

                if (j < 0) {
                    if (j == -3 || j == -1) {
                        r = g = b = 0;
                        bSkip = true;
                    } else {
                        if (i<6) {
                            r = g = b = i;
                        } else {
                            if (i == 6) {
                                r = 5; g = 0; b = 0;
                            } else if (i == 7) {
                                r = 0; g = 5; b = 0;
                            } else if (i == 8) {
                                r = 0; g = 0; b = 5;
                            } else if (i == 9) {
                                r = 5; g = 5; b = 0;
                            } else if (i == 10) {
                                r = 0; g = 5; b = 5;
                            } else if (i == 11) {
                                r = 5; g = 0; b = 5;
                            }
                        }
                    }
                } else {
                    /* remainder of the columns are built
                     * based on the current row/column
                     */
                    r = parseInt(i/6)*3 + parseInt(j/6);
                    g = j%6;
                    b = i%6;
                }
                var bgColor = '#'+this.options.hexColors[r]+this.options.hexColors[g]+this.options.hexColors[b];

                var td = new Element('td');
                if (!bSkip) {
                    td.setStyle('backgroundColor', bgColor);

                    var a = new Element('a', {
                        'class': 'colorSwatch ' + (((r > 2 && g > 2) || (r > 2 && b > 2) || (g > 2 && b > 2)) ? 'borderBlack': 'borderWhite'),
                        'href':'javascript:void(0)',
                        'title':bgColor,
                        'alt':bgColor,
                        events: {
                            'mouseover': swatchOver,
                            'click': swatchClick
                        }
                    });
                    a.store('swatchColor', bgColor);
                    td.adopt(a);
                } else {
                    var span = new Element('span', {'class':'emptyCell'});
                    td.adopt(span);
                }
                tr.adopt(td);
            }
            tbody.adopt(tr);
        }
        this.domObj.adopt(table);
        this.updateSelected();
        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
    },

    /**
     * Method: swatchOver
     * handle the mouse moving over a colour swatch by updating the preview
     *
     * Parameters:
     * e - {Event} the mousemove event object
     */
    swatchOver: function(e) {
        var a = e.target;

        this.previewSwatch.setStyle('backgroundColor', a.retrieve('swatchColor'));
    },

    /**
     * Method: swatchClick
     * handle mouse click on a swatch by updating the color and hiding the
     * panel.
     *
     * Parameters:
     * e - {Event} the mouseclick event object
     */
    swatchClick: function(e) {
        var a = e.target;

        this.options.color = a.retrieve('swatchColor');
        this.updateSelected();
        this.fireEvent('click', this);
    },

    /**
     * Method: changed
     * handle the user entering a new colour value manually by updating the
     * selected colour if the entered value is valid HEX.
     */
    changed: function() {
        var color = this.colorInput.value;
        if (color.substring(0,1) == '#') {
            color = color.substring(1);
        }
        if (color.toLowerCase().match(/^[0-9a-f]{6}$/)) {
            this.options.color = '#' +color.toUpperCase();
            this.updateSelected();
        }
    },

    /**
     * Method: alphaChanged
     * handle the user entering a new alpha value manually by updating the
     * selected alpha if the entered value is valid alpha (0-100).
     */
    alphaChanged: function() {
        var alpha = this.alphaInput.value;
        if (alpha.match(/^[0-9]{1,3}$/)) {
            this.options.alpha = parseFloat(alpha/100);
            this.updateSelected();
        }
    },

    /**
     * Method: setColor
     * set the colour represented by this colour panel
     *
     * Parameters:
     * color - {String} the new hex color value
     */
    setColor: function( color ) {
        this.colorInput.value = color;
        this.changed();
    },

    /**
     * Method: setAlpha
     * set the alpha represented by this colour panel
     *
     * Parameters:
     * alpha - {Integer} the new alpha value (between 0 and 100)
     */
    setAlpha: function( alpha ) {
        this.alphaInput.value = alpha;
        this.alphaChanged();
    },

    /**
     * Method: updateSelected
     * update the colour panel user interface based on the current
     * colour and alpha values
     */
    updateSelected: function() {
        var styles = {'backgroundColor':this.options.color};

        this.colorInput.value = this.options.color.substring(1);

        this.alphaInput.value = parseInt(this.options.alpha*100);
        if (this.options.alpha < 1) {
            styles.opacity = this.options.alpha;
            styles.filter = 'Alpha(opacity='+(this.options.alpha*100)+')';
        } else {
            styles.opacity = '';
            styles.filter = '';
        }
        this.selectedSwatch.setStyles(styles);
        this.previewSwatch.setStyles(styles);
        this.fireEvent('change', this);
    }
});

// $Id: color.js 423 2009-05-12 12:37:56Z pagameba $ 
/**
 * Class: Jx.Button.Color
 *
 * Extends: <Jx.Button.Flyout>
 *
 * A <Jx.ColorPalette> wrapped up in a Jx.Button.  The button includes a
 * preview of the currently selected color.  Clicking the button opens
 * the color panel.
 *
 * A color button is essentially a <Jx.Button.Flyout> where the content
 * of the flyout is a <Jx.ColorPalette>.  For performance, all color buttons
 * share an instance of <Jx.ColorPalette> which means only one button can be
 * open at a time.  This isn't a huge restriction as flyouts already close
 * each other when opened.
 *
 * Example:
 * (code)
 * var colorButton = new Jx.Button.Color({
 *     onChange: function(button) {
 *         console.log('color:' + button.options.color + ' alpha: ' +
 *                     button.options.alpha);
 *     }
 * });
 * (end)
 *
 * Events:
 * change - fired when the color is changed.
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Button.Color = new Class({
    Family: 'Jx.Button.Color',
    Extends: Jx.Button.Flyout,
    
    swatch: null,
     
    options: {
        /**
         * Option: color
         * a color to initialize the panel with, defaults to #000000
         * (black) if not specified.
         */
        color: '#000000',
        /**
         * Option: alpha
         * an alpha value to initialize the panel with, defaults to 1
         *  (opaque) if not specified.
         *
         */
        alpha: 100
    },

    /**
     * Constructor: Jx.Button.Color
     * initialize a new color button.
     *
     * Parameters:
     * options - <Jx.Button.Color.Options> initialize instance options.
     *
     */
    initialize: function(options) {
        if (!Jx.Button.Color.ColorPalette) {
            Jx.Button.Color.ColorPalette = new Jx.ColorPalette(this.options);
        }
        var d = new Element('span', {'class':'jxButtonSwatch'});

        this.selectedSwatch = new Element('span');
        d.appendChild(this.selectedSwatch);

        this.colorChangeFn = this.changed.bind(this);
        this.hideFn = this.hide.bind(this);
        /* we need to have an image to replace, but if a label is 
           requested, there wouldn't normally be an image. */
        options.image = Jx.aPixel.src;

        /* now we can safely initialize */
        this.parent(options);
        
        // now replace the image with our swatch
        d.replaces(this.domImg);
        this.updateSwatch();
    },

    /**
     * Method: clicked
     * override <Jx.Button.Flyout> to use a singleton color palette.
     */
    clicked: function() {
        if (Jx.Button.Color.ColorPalette.currentButton) {
            Jx.Button.Color.ColorPalette.currentButton.hide();
        }
        Jx.Button.Color.ColorPalette.currentButton = this;
        Jx.Button.Color.ColorPalette.addEvent('change', this.colorChangeFn);
        Jx.Button.Color.ColorPalette.addEvent('click', this.hideFn);
        this.content.appendChild(Jx.Button.Color.ColorPalette.domObj);
        Jx.Button.Color.ColorPalette.domObj.setStyle('display', 'block');
        Jx.Button.Flyout.prototype.clicked.apply(this, arguments);
        /* setting these before causes an update problem when clicking on
         * a second color button when another one is open - the color
         * wasn't updating properly
         */
         
        Jx.Button.Color.ColorPalette.options.color = this.options.color;
        Jx.Button.Color.ColorPalette.options.alpha = this.options.alpha/100;
        Jx.Button.Color.ColorPalette.updateSelected();
},

    /**
     * Method: hide
     * hide the color panel
     */
    hide: function() {
        this.setActive(false);
        Jx.Button.Color.ColorPalette.removeEvent('change', this.colorChangeFn);
        Jx.Button.Color.ColorPalette.removeEvent('click', this.hideFn);
        Jx.Button.Flyout.prototype.hide.apply(this, arguments);
        Jx.Button.Color.ColorPalette.currentButton = null;
    },

    /**
     * Method: setColor
     * set the color represented by this color panel
     *
     * Parameters:
     * color - {String} the new hex color value
     */
    setColor: function(color) {
        this.options.color = color;
        this.updateSwatch();
    },

    /**
     * Method: setAlpha
     * set the alpha represented by this color panel
     *
     * Parameters:
     * alpha - {Integer} the new alpha value (between 0 and 100)
     */
    setAlpha: function(alpha) {
        this.options.alpha = alpha;
        this.updateSwatch();
    },

    /**
     * Method: changed
     * handle the color changing in the palette by updating the preview swatch
     * in the button and firing the change event.
     *
     * Parameters:
     * panel - <Jx.ColorPalette> the palette that changed.
     */
    changed: function(panel) {
        var changed = false;
        if (this.options.color != panel.options.color) {
            this.options.color = panel.options.color;
            changed = true;
        }
        if (this.options.alpha != panel.options.alpha * 100) {
            this.options.alpha = panel.options.alpha * 100;
            changed = true;
        }
        if (changed) {
            this.updateSwatch();
            this.fireEvent('change',this);
        }
    },

    /**
     * Method: updateSwatch
     * Update the swatch color for the current color
     */
    updateSwatch: function() {
        var styles = {'backgroundColor':this.options.color};
        if (this.options.alpha < 100) {
            styles.filter = 'Alpha(opacity='+(this.options.alpha)+')';
            styles.opacity = this.options.alpha / 100;
            
        } else {
            styles.opacity = '';
            styles.filter = '';
        }
        this.selectedSwatch.setStyles(styles);
    }
});
// $Id: menu.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.Menu
 *
 * Extends: <Jx.Widget>
 *
 * A main menu as opposed to a sub menu that lives inside the menu.
 *
 * TODO: Jx.Menu
 * revisit this to see if Jx.Menu and Jx.SubMenu can be merged into
 * a single implementation.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Menu = new Class({
    Family: 'Jx.Menu',
    Extends: Jx.Widget,
    /**
     * Property: domObj
     * {HTMLElement} The HTML element containing the menu.
     */
    domObj : null,
    /**
     * Property: button
     * {<Jx.Button>} The button that represents this menu in a toolbar and
     * opens the menu.
     */
    button : null,
    /**
     * Property: subDomObj
     * {HTMLElement} the HTML element that contains the menu items
     * within the menu.
     */
    subDomObj : null,
    /**
     * Property: items
     * {Array} the items in this menu
     */
    items : null,
    /**
     * Constructor: Jx.Menu
     * Create a new instance of Jx.Menu.
     *
     * Parameters:
     * options - see <Jx.Button.Options>.  If no options are provided then
     * no button is created.
     */
    initialize : function(options) {
        this.setOptions(options);
        if (!Jx.Menu.Menus) {
            Jx.Menu.Menus = [];
        }
        /* stores menu items and sub menus */
        this.items = [];
        
        this.contentContainer = new Element('div',{
            'class':'jxMenuContainer',
            events: {
                contextmenu: function(e){e.stop();}
            }
        });
        
        /* the DOM element that holds the actual menu */
        this.subDomObj = new Element('ul',{
            'class':'jxMenu'
        });
        
        this.contentContainer.adopt(this.subDomObj);
        
        /* if options are passed, make a button inside an LI so the
           menu can be embedded inside a toolbar */
        if (options) {
            this.button = new Jx.Button($merge(options,{
                onClick:this.show.bind(this)
            }));
            this.button.domA.addClass('jxButtonMenu');
            this.button.domA.addEvent('mouseover', this.onMouseOver.bindWithEvent(this));
            
            this.domObj = this.button.domObj;
        }
        
        /* pre-bind the hide function for efficiency */
        this.hideWatcher = this.hide.bindWithEvent(this);
        this.keypressWatcher = this.keypressHandler.bindWithEvent(this);
        
        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
    },
    /**
     * Method: add
     * Add menu items to the sub menu.
     *
     * Parameters:
     * item - {<Jx.MenuItem>} the menu item to add.  Multiple menu items
     * can be added by passing multiple arguments to this function.
     */
    add : function() {
        $A(arguments).flatten().each(function(item){
            this.items.push(item);
            item.setOwner(this);
            this.subDomObj.adopt(item.domObj);
        }, this);
        return this;
    },
    /**
     * Method: deactivate
     * Deactivate the menu by hiding it.
     */
    deactivate: function() {this.hide();},
    /**
     * Method: onMouseOver
     * Handle the user moving the mouse over the button for this menu
     * by showing this menu and hiding the other menu.
     *
     * Parameters:
     * e - {Event} the mouse event
     */
    onMouseOver: function(e) {
        if (Jx.Menu.Menus[0] && Jx.Menu.Menus[0] != this) {
            this.show({event:e});
        }
    },
    
    /**
     * Method: eventInMenu
     * determine if an event happened inside this menu or a sub menu
     * of this menu.
     *
     * Parameters:
     * e - {Event} the mouse event
     *
     * Returns:
     * {Boolean} true if the event happened in the menu or
     * a sub menu of this menu, false otherwise
     */
    eventInMenu: function(e) {
        var target = document.id(e.target);
        if (!target) {
            return false;
        }
        if (target.descendantOf(this.domObj) ||
            target.descendantOf(this.subDomObj)) {
            return true;
        } else {
            var ul = target.findElement('ul');
            if (ul) {
                var sm = ul.retrieve('jxSubMenu');
                if (sm) {
                    var owner = sm.owner;
                    while (owner) {
                        if (owner == this) {
                            return true;
                        }
                        owner = owner.owner;
                    }
                }
            }
            return false;
        }
    },
    
    /**
     * Method: hide
     * Hide the menu.
     *
     * Parameters:
     * e - {Event} the mouse event
     */
    hide: function(e) {
        if (e) {
            if (this.visibleItem && this.visibleItem.eventInMenu) {
                if (this.visibleItem.eventInMenu(e)) {
                    return;
                }
            } else if (this.eventInMenu(e)) {
                return;
            }
        }
        if (Jx.Menu.Menus[0] && Jx.Menu.Menus[0] == this) {
            Jx.Menu.Menus[0] = null;
        }
        if (this.button && this.button.domA) {
            this.button.domA.removeClass('jx'+this.button.options.type+'Active');            
        }
        this.items.each(function(item){item.hide(e);});
        document.removeEvent('mousedown', this.hideWatcher);
        document.removeEvent('keydown', this.keypressWatcher);
        this.contentContainer.setStyle('display','none');
        this.fireEvent('hide', this); 
    },
    /**
     * Method: show
     * Show the menu
     *
     * Parameters:
     * e - {Event} the mouse event
     */
    show : function(o) {
        var e = o.event;
        if (Jx.Menu.Menus[0]) {
            if (Jx.Menu.Menus[0] != this) {
                Jx.Menu.Menus[0].button.blur();
                Jx.Menu.Menus[0].hide(e);
            } else {
                this.hide();
                return;
            }  
        } 
        if (this.items.length === 0) {
            return;
        }
        Jx.Menu.Menus[0] = this;
        this.button.focus();
        this.contentContainer.setStyle('visibility','hidden');
        this.contentContainer.setStyle('display','block');
        document.id(document.body).adopt(this.contentContainer);            
        /* we have to size the container for IE to render the chrome correctly
         * but just in the menu/sub menu case - there is some horrible peekaboo
         * bug in IE related to ULs that we just couldn't figure out
         */
        this.contentContainer.setContentBoxSize(this.subDomObj.getMarginBoxSize());
        this.showChrome(this.contentContainer);
        
        this.position(this.contentContainer, this.button.domObj, {
            horizontal: ['left left'],
            vertical: ['bottom top', 'top bottom'],
            offsets: this.chromeOffsets
        });

        this.contentContainer.setStyle('visibility','');
        
        if (this.button && this.button.domA) {
            this.button.domA.addClass('jx'+this.button.options.type+'Active');            
        }
        if (e) {
            //why were we doing this? it is affecting the closing of
            //other elements like flyouts (issue 13)
            //e.stop();
        }
        /* fix bug in IE that closes the menu as it opens because of bubbling */
        document.addEvent('mousedown', this.hideWatcher);
        document.addEvent('keydown', this.keypressWatcher);
        this.fireEvent('show', this); 
    },
    /**
     * Method: setVisibleItem
     * Set the sub menu that is currently open
     *
     * Parameters:
     * obj- {<Jx.SubMenu>} the sub menu that just became visible
     */
    setVisibleItem: function(obj) {
        if (this.visibleItem != obj) {
            if (this.visibleItem && this.visibleItem.hide) {
                this.visibleItem.hide();
            }
            this.visibleItem = obj;
            this.visibleItem.show();
        }
    },

    /* hide flyout if the user presses the ESC key */
    keypressHandler: function(e) {
        e = new Event(e);
        if (e.key == 'esc') {
            this.hide();
        }
    }
});

// $Id: set.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.ButtonSet
 *
 * Extends: <Jx.Object>
 *
 * A ButtonSet manages a set of <Jx.Button> instances by ensuring that only one
 * of the buttons is active.  All the buttons need to have been created with
 * the toggle option set to true for this to work.
 *
 * Example:
 * (code)
 * var toolbar = new Jx.Toolbar('bar');
 * var buttonSet = new Jx.ButtonSet();
 * 
 * var tab1 = new Jx.Button({label: 'b1', toggle:true, contentID: 'content1'});
 * var tab2 = new Jx.Button({label: 'b2', toggle:true, contentID: 'content2'});
 * var tab3 = new Jx.Button({label: 'b3', toggle:true, contentID: 'content3'});
 * var tab4 = new Jx.Button({label: 'b4', toggle:true, contentURL: 'test_content.html'});
 * 
 * buttonSet.add(b1,b2,b3,b4);
 * (end)
 *
 * Events:
 * change - the current button has changed
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.ButtonSet = new Class({
    Family: 'Jx.ButtonSet',
    Extends: Jx.Object,
    /**
     * Property: buttons
     * {Array} array of buttons that are managed by this button set
     */
    buttons: null,
    /**
     * Constructor: Jx.ButtonSet
     * Create a new instance of <Jx.ButtonSet>
     *
     * Parameters:
     * options - an options object, only event handlers are supported
     * as options at this time.
     */
    initialize : function(options) {
        this.setOptions(options);
        this.buttons = [];
        this.buttonChangedHandler = this.buttonChanged.bind(this);
    },
    
    /**
     * Method: add
     * Add one or more <Jx.Button>s to the ButtonSet.
     *
     * Parameters:
     * button - {<Jx.Button>} an instance of <Jx.Button> to add to the button set.  More
     * than one button can be added by passing extra parameters to this method.
     */
    add : function() {
        $A(arguments).each(function(button) {
            if (button.domObj.hasClass('jx'+button.options.type+'Toggle')) {
                button.domObj.removeClass('jx'+button.options.type+'Toggle');
                button.domObj.addClass('jx'+button.options.type+'Set');                
            }
            button.addEvent('down',this.buttonChangedHandler);
            var that = this;
            button.setActive = function(active) {
                if (this.options.active && that.activeButton == this) {
                    return;
                } else {
                    Jx.Button.prototype.setActive.apply(this, [active]);
                }
            };
            if (!this.activeButton || button.options.active) {
                button.options.active = false;
                button.setActive(true);
            }
            this.buttons.push(button);
        }, this);
        return this;
    },
    /**
     * Method: remove
     * Remove a button from this Button.
     *
     * Parameters:
     * button - {<Jx.Button>} the button to remove.
     */
    remove : function(button) {
        this.buttons.erase(button);
        if (this.activeButton == button) {
            if (this.buttons.length) {
                this.buttons[0].setActive(true);
            }
            button.removeEvent('down',this.buttonChangedHandler);
            button.setActive = Jx.Button.prototype.setActive;
        }
    },
    /**
     * Method: setActiveButton
     * Set the active button to the one passed to this method
     *
     * Parameters:
     * button - {<Jx.Button>} the button to make active.
     */
    setActiveButton: function(button) {
        var b = this.activeButton;
        this.activeButton = button;
        if (b && b != button) {
            b.setActive(false);
        }
    },
    /**
     * Method: selectionChanged
     * Handle selection changing on the buttons themselves and activate the
     * appropriate button in response.
     *
     * Parameters:
     * button - {<Jx.Button>} the button to make active.
     */
    buttonChanged: function(button) {
        this.setActiveButton(button);
        this.fireEvent('change', this);
    }
});



// $Id: multi.js 492 2009-07-24 22:06:49Z pagameba $
/**
 * Class: Jx.Button.Multi
 *
 * Extends: <Jx.Button>
 *
 * Implements:
 *
 * Multi buttons are used to contain multiple buttons in a drop down list
 * where only one button is actually visible and clickable in the interface.
 *
 * When the user clicks the active button, it performs its normal action.
 * The user may also click a drop-down arrow to the right of the button and
 * access the full list of buttons.  Clicking a button in the list causes
 * that button to replace the active button in the toolbar and performs
 * the button's regular action.
 *
 * Other buttons can be added to the Multi button using the add method.
 *
 * This is not really a button, but rather a container for buttons.  The
 * button structure is a div containing two buttons, a normal button and
 * a flyout button.  The flyout contains a toolbar into which all the
 * added buttons are placed.  The main button content is cloned from the
 * last button clicked (or first button added).
 *
 * The Multi button does not trigger any events itself, only the contained
 * buttons trigger events.
 *
 * Example:
 * (code)
 * var b1 = new Jx.Button({
 *     label: 'b1',
 *     onClick: function(button) {
 *         console.log('b1 clicked');
 *     }
 * });
 * var b2 = new Jx.Button({
 *     label: 'b2',
 *     onClick: function(button) {
 *         console.log('b2 clicked');
 *     }
 * });
 * var b3 = new Jx.Button({
 *     label: 'b3',
 *     onClick: function(button) {
 *         console.log('b3 clicked');
 *     }
 * });
 * var multiButton = new Jx.Button.Multi();
 * multiButton.add(b1, b2, b3);
 * (end)
 *
 * License:
 * Copyright (c) 2008, DM Solutions Group Inc.
 *
 * This file is licensed under an MIT style license
 */
Jx.Button.Multi = new Class({
    Family: 'Jx.Button.Multi',

    Extends: Jx.Button,
    /**
     * Property: {<Jx.Button>} activeButton
     * the currently selected button
     */
    activeButton: null,
    /**
     * Property: buttons
     * {Array} the buttons added to this multi button
     */
    buttons: null,

    options: {
        template: '<span class="jxButtonContainer"><a class="jxButton jxButtonMulti"><span class="jxButtonContent"><img src="'+Jx.aPixel.src+'" class="jxButtonIcon"><span class="jxButtonLabel"></span></span></a><a class="jxButtonDisclose" href="javascript:void(0)"><img src="'+Jx.aPixel.src+'"></a></span>'
    },
    classes: ['jxButtonContainer','jxButton','jxButtonIcon','jxButtonLabel','jxButtonDisclose'],

    /**
     * Constructor: Jx.Button.Multi
     * construct a new instance of Jx.Button.Multi.
     */
    initialize: function(opts) {
        this.parent(opts);

        this.buttons = [];

        this.menu = new Jx.Menu();
        this.menu.button = this;
        this.buttonSet = new Jx.ButtonSet();

        this.clickHandler = this.clicked.bind(this);

        var a = this.elements.get('jxButtonDisclose');
        if (a) {
            var button = this;
            var hasFocus;

            a.addEvents({
                'click': (function(e) {
                    if (this.items.length === 0) {
                        return;
                    }
                    if (!button.options.enabled) {
                        return;
                    }
                    this.contentContainer.setStyle('visibility','hidden');
                    this.contentContainer.setStyle('display','block');
                    document.id(document.body).adopt(this.contentContainer);
                    /* we have to size the container for IE to render the chrome correctly
                     * but just in the menu/sub menu case - there is some horrible peekaboo
                     * bug in IE related to ULs that we just couldn't figure out
                     */
                    this.contentContainer.setContentBoxSize(this.subDomObj.getMarginBoxSize());

                    this.showChrome(this.contentContainer);

                    this.position(this.contentContainer, this.button.domObj, {
                        horizontal: ['right right'],
                        vertical: ['bottom top', 'top bottom'],
                        offsets: this.chromeOffsets
                    });

                    this.contentContainer.setStyle('visibility','');

                    document.addEvent('mousedown', this.hideWatcher);
                    document.addEvent('keyup', this.keypressWatcher);

                    this.fireEvent('show', this);
                }).bindWithEvent(this.menu),
                'mouseenter':(function(){
                    document.id(this.domObj.firstChild).addClass('jxButtonHover');
                    if (hasFocus) {
                        a.addClass('jx'+this.type+'Pressed');
                    }
                }).bind(this),
                'mouseleave':(function(){
                    document.id(this.domObj.firstChild).removeClass('jxButtonHover');
                    a.removeClass('jx'+this.type+'Pressed');
                }).bind(this),
                mousedown: (function(e) {
                    a.addClass('jx'+this.type+'Pressed');
                    hasFocus = true;
                    this.focus();
                }).bindWithEvent(this),
                mouseup: (function(e) {
                    a.removeClass('jx'+this.type+'Pressed');
                }).bindWithEvent(this),
                keydown: (function(e) {
                    if (e.key == 'enter') {
                        a.addClass('jx'+this.type+'Pressed');
                    }
                }).bindWithEvent(this),
                keyup: (function(e) {
                    if (e.key == 'enter') {
                        a.removeClass('jx'+this.type+'Pressed');
                    }
                }).bindWithEvent(this),
                blur: function() { hasFocus = false; }

            });
            if (typeof Drag != 'undefined') {
                new Drag(a, {
                    onStart: function() {this.stop();}
                });
            }
            this.discloser = a;
        }

        this.menu.addEvents({
            'show': (function() {
                this.domA.addClass('jx'+this.type+'Active');
            }).bind(this),
            'hide': (function() {
                if (this.options.active) {
                    this.domA.addClass('jx'+this.type+'Active');
                }
            }).bind(this)
        });
        if (this.options.items) {
            this.add(this.options.items);
        }
    },
    /**
     * Method: add
     * adds one or more buttons to the Multi button.  The first button
     * added becomes the active button initialize.  This function
     * takes a variable number of arguments, each of which is expected
     * to be an instance of <Jx.Button>.
     *
     * Parameters:
     * button - {<Jx.Button>} a <Jx.Button> instance, may be repeated in the parameter list
     */
    add: function() {
        $A(arguments).flatten().each(function(theButton){
            if (!theButton instanceof Jx.Button) {
                return;
            }
            this.buttons.push(theButton);
            var f = this.setButton.bind(this, theButton);
            var opts = {
                image: theButton.options.image,
                imageClass: theButton.options.imageClass,
                label: theButton.options.label || '&nbsp;',
                enabled: theButton.options.enabled,
                tooltip: theButton.options.tooltip,
                toggle: true,
                onClick: f
            };
            if (!opts.image || opts.image.indexOf('a_pixel') != -1) {
                delete opts.image;
            }
            var button = new Jx.Menu.Item(opts);
            this.buttonSet.add(button);
            this.menu.add(button);
            theButton.multiButton = button;
            theButton.domA.addClass('jxButtonMulti');
            if (!this.activeButton) {
                this.domA.dispose();
                this.setActiveButton(theButton);
            }
        }, this);
    },
    /**
     * Method: remove
     * remove a button from a multi button
     *
     * Parameters:
     * button - {<Jx.Button>} the button to remove
     */
    remove: function(button) {
        if (!button || !button.multiButton) {
            return;
        }
        // the toolbar will only remove the li.toolItem, which is
        // the parent node of the multiButton's domObj.
        if (this.menu.remove(button.multiButton)) {
            button.multiButton = null;
            if (this.activeButton == button) {
                // if any buttons are left that are not this button
                // then set the first one to be the active button
                // otherwise set the active button to nothing
                if (!this.buttons.some(function(b) {
                    if (b != button) {
                        this.setActiveButton(b);
                        return true;
                    } else {
                        return false;
                    }
                }, this)) {
                    this.setActiveButton(null);
                }
            }
            this.buttons.erase(button);
        }
    },
    /**
     * Method: setActiveButton
     * update the menu item to be the requested button.
     *
     * Parameters:
     * button - {<Jx.Button>} a <Jx.Button> instance that was added to this multi button.
     */
    setActiveButton: function(button) {
        if (this.activeButton) {
            this.activeButton.domA.dispose();
            this.activeButton.domA.removeEvent(this.clickHandler);
        }
        if (button && button.domA) {
            this.domObj.grab(button.domA, 'top');
            this.domA = button.domA;
            this.domA.addEvent('click', this.clickHandler);
            if (this.options.toggle) {
                this.options.active = false;
                this.setActive(true);
            }
        }
        this.activeButton = button;
    },
    /**
     * Method: setButton
     * update the active button in the menu item, trigger the button's action
     * and hide the flyout that contains the buttons.
     *
     * Parameters:
     * button - {<Jx.Button>} The button to set as the active button
     */
    setButton: function(button) {
        this.setActiveButton(button);
        button.clicked();
    }
});// $Id: menu.item.js 489 2009-07-24 21:22:26Z pagameba $
/**
 * Class: Jx.Menu.Item
 *
 * Extends: <Jx.Button>
 *
 * A menu item is a single entry in a menu.  It is typically composed of
 * a label and an optional icon.  Selecting the menu item emits an event.
 *
 * Jx.Menu.Item is represented by a <Jx.Button> with type MenuItem and the
 * associated CSS changes noted in <Jx.Button>.  The container of a MenuItem
 * is an 'li' element.
 *
 * Example:
 * (code)
 * (end)
 *
 * Events:
 * click - fired when the menu item is clicked.
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Menu.Item = new Class({
    Family: 'Jx.Menu.Item',
    Extends: Jx.Button,
    /**
     * Property: owner
     * {<Jx.SubMenu> or <Jx.Menu>} the menu that contains the menu item.
     */
    owner: null,
    options: {
        image: null,
        label: '&nbsp;',
        /* Option: template
         * the HTML structure of the button.  As a minimum, there must be a
         * containing element with a class of jxMenuItemContainer and an
         * internal element with a class of jxMenuItem.  jxMenuItemIcon and
         * jxMenuItemLabel are used if present to put the image and label into
         * the button.
         */
        template: '<li class="jxMenuItemContainer"><a class="jxMenuItem"><span class="jxMenuItemContent"><img class="jxMenuItemIcon" src="'+Jx.aPixel.src+'"><span class="jxMenuItemLabel"></span></span></a></li>'
    },
    classes: ['jxMenuItemContainer', 'jxMenuItem','jxMenuItemIcon','jxMenuItemLabel'],
    type: 'MenuItem',
    /**
     * Constructor: Jx.Menu.Item
     * Create a new instance of Jx.Menu.Item
     *
     * Parameters:
     * options - See <Jx.Button.Options>
     */
    initialize: function(options) {
        this.parent($merge({image: Jx.aPixel.src}, options));
        if (options.image) {
            this.domObj.removeClass('jx'+this.type+'Toggle');
        }
        this.domObj.addEvent('mouseover', this.onMouseOver.bindWithEvent(this));
    },
    /**
     * Method: setOwner
     * Set the owner of this menu item
     *
     * Parameters:
     * obj - {Object} the new owner
     */
    setOwner: function(obj) {
        this.owner = obj;
    },
    /**
     * Method: hide
     * Hide the menu item.
     */
    hide: function() {this.blur();},
    /**
     * Method: show
     * Show the menu item
     */
    show: $empty,
    /**
     * Method: clicked
     * Handle the user clicking on the menu item, overriding the <Jx.Button::clicked>
     * method to facilitate menu tracking
     *
     * Parameters:
     * obj - {Object} an object containing an event property that was the user
     * event.
     */
    clicked: function(obj) {
        if (this.options.enabled) {
            if (this.options.toggle) {
                this.setActive(!this.options.active);
            }
            this.fireEvent('click', this);
            if (this.owner && this.owner.deactivate) {
                this.owner.deactivate(obj.event);
            }
        }
    },
    /**
     * Method: onmouseover
     * handle the mouse moving over the menu item
     *
     * Parameters:
     * e - {Event} the mousemove event
     */
    onMouseOver: function(e) {
        if (this.owner && this.owner.setVisibleItem) {
            this.owner.setVisibleItem(this);
        }
        this.show(e);
    }
});

// $Id: combo.js 492 2009-07-24 22:06:49Z pagameba $
/**
 * Class: Jx.Button.Combo
 *
 * Extends: <Jx.Button.Multi>
 *
 * A drop down list of selectable items.  Items can be either a string, an image or both.
 *
 * Example:
 * (code)
 * new Jx.Button.Combo({
 *     label: 'Choose a symbol',
 *     items: [
 *         {label: 'Star', image: 'images/swatches.png', imageClass: 'comboStar'},
 *         {label: 'Square', image: 'images/swatches.png', imageClass: 'comboSquare'},
 *         {label: 'Triangle', image: 'images/swatches.png', imageClass: 'comboTriangle'},
 *         {label: 'Circle', image: 'images/swatches.png', imageClass: 'comboCircle'},
 *         {label: 'Plus', image: 'images/swatches.png', imageClass: 'comboPlus'},
 *         {label: 'Cross', image: 'images/swatches.png', imageClass: 'comboCross'}
 *     ],
 *     onChange: function(combo) { alert('you selected ' + combo.getValue()) }
 * })
 * (end)
 *
 * Events:
 * change - triggered when the user selects a new item from the list
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Button.Combo = new Class({
    Family: 'Jx.Button.Combo',
    Extends: Jx.Button,
    ul : null,
    /**
     * Property: currentSelection
     * {Object} current selection in the list 
     */
    currentSelection : null,
    
    options: {
        /* Option: label
         * string, default ''.  The label to display next to the combo.
         */
        label: '',
        /* Option: template
         */
         template: '<span class="jxButtonContainer"><a class="jxButton jxButtonCombo"><span class="jxButtonContent"><img class="jxButtonIcon" src="'+Jx.aPixel.src+'"><span class="jxButtonLabel"></span></span></a></span>'
     },
        
    /** 
     * Constructor: Jx.Combo
     * create a new instance of Jx.Combo
     *
     * Parameters:
     * options - <Jx.button.Combo.Options>
     */
    initialize: function(options) {
        this.parent(options);

        this.menu = new Jx.Menu();
        this.menu.button = this;
        this.buttonSet = new Jx.ButtonSet();

        this.buttonSet = new Jx.ButtonSet({
            onChange: (function(set) {
                var button = set.activeButton;            
                var l = button.options.label;
                if (l == '&nbsp;') {
                    l = '';
                }
                this.setLabel(l);
                var img = button.options.image;
                if (img.indexOf('a_pixel') != -1) {
                    img = '';
                }
                this.setImage(img);
                if (this.options.imageClass && this.domImg) {
                    this.domImg.removeClass(this.options.imageClass);
                }
                if (button.options.imageClass && this.domImg) {
                    this.options.imageClass = button.options.imageClass;
                    this.domImg.addClass(button.options.imageClass);
                }
                this.fireEvent('change', this);
            }).bind(this)
        });
        if (this.options.items) {
            this.add(this.options.items);
        }
        var button = this;
        this.addEvent('click', (function(e) {
            if (this.items.length === 0) {
                return;
            }
            if (!button.options.enabled) {
                return;
            }
            this.contentContainer.setStyle('visibility','hidden');
            this.contentContainer.setStyle('display','block');
            $(document.body).adopt(this.contentContainer);            
            /* we have to size the container for IE to render the chrome correctly
             * but just in the menu/sub menu case - there is some horrible peekaboo
             * bug in IE related to ULs that we just couldn't figure out
             */
            this.contentContainer.setContentBoxSize(this.subDomObj.getMarginBoxSize());

            this.showChrome(this.contentContainer);

            this.position(this.contentContainer, this.button.domObj, {
                horizontal: ['right right'],
                vertical: ['bottom top', 'top bottom'],
                offsets: this.chromeOffsets
            });

            this.contentContainer.setStyle('visibility','');

            document.addEvent('mousedown', this.hideWatcher);
            document.addEvent('keyup', this.keypressWatcher);
            
            this.fireEvent('show', this);
        }).bindWithEvent(this.menu));
        
        this.menu.addEvents({
            'show': (function() {
                this.domA.addClass('jxButtonActive');                    
            }).bind(this),
            'hide': (function() {
                if (this.options.active) {
                    this.domA.addClass('jxButtonActive');                    
                }
            }).bind(this)
        });
        
    },
    
    /**
     * Method: valueChanged
     * invoked when the current value is changed
     */
    valueChanged: function() {
        this.fireEvent('change', this);
    },
    
    /**
     * Method: getValue
     * returns the currently selected value
     */
    getValue: function() {
        return this.options.label;
    },
    
    setValue: function() {
        
    },
    
    /**
     * Method: onKeyPress
     * Handle the user pressing a key by looking for an ENTER key to set the
     * value.
     *
     * Parameters:
     * e - {Event} the keypress event
     */
    onKeyPress: function(e) {
        if (e.key == 'enter') {
            this.valueChanged();
        }
    },
    
    /**
     * Method: add
     * add a new item to the pick list
     *
     * Parameters:
     * options - {Object} object with properties suitable to be passed to
     * a <Jx.Menu.Item.Options> object.  More than one options object can be
     * passed, comma separated or in an array.
     */
    add: function() {
        $A(arguments).flatten().each(function(opt) {
            var button = new Jx.Menu.Item($merge(opt,{
                toggle: true
            }));
            this.menu.add(button);
            this.buttonSet.add(button);
        }, this);
    },
    
    /**
     * Method: remove
     * Remove the item at the given index.  Not implemented.
     *
     * Parameters:
     * idx - {Integer} the item to remove.
     */
    remove: function(idx) {
        //TODO: implement remove?
    }
});// $Id: toolbar.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.Toolbar
 *
 * Extends: <Jx.Widget>
 *
 * A toolbar is a container object that contains other objects such as
 * buttons.  The toolbar organizes the objects it contains automatically,
 * wrapping them as necessary.  Multiple toolbars may be placed within
 * the same containing object.
 *
 * Jx.Toolbar includes CSS classes for styling the appearance of a
 * toolbar to be similar to traditional desktop application toolbars.
 *
 * There is one special object, Jx.ToolbarSeparator, that provides
 * a visual separation between objects in a toolbar.
 *
 * While a toolbar is generally a *dumb* container, it serves a special
 * purpose for menus by providing some infrastructure so that menus can behave
 * properly.
 *
 * In general, almost anything can be placed in a Toolbar, and mixed with 
 * anything else.
 *
 * Example:
 * The following example shows how to create a Jx.Toolbar instance and place
 * two objects in it.
 *
 * (code)
 * //myToolbarContainer is the id of a <div> in the HTML page.
 * function myFunction() {}
 * var myToolbar = new Jx.Toolbar('myToolbarContainer');
 * 
 * var myButton = new Jx.Button(buttonOptions);
 *
 * var myElement = document.createElement('select');
 *
 * myToolbar.add(myButton, new Jx.ToolbarSeparator(), myElement);
 * (end)
 *
 * Events:
 * add - fired when one or more buttons are added to a toolbar
 * remove - fired when on eor more buttons are removed from a toolbar
 *
 * Implements: 
 * Options
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Toolbar = new Class({
    Family: 'Jx.Toolbar',
    Extends: Jx.Widget,
    /**
     * Property: items
     * {Array} an array of the things in the toolbar.
     */
    items : null,
    /**
     * Property: domObj
     * {HTMLElement} the HTML element that the toolbar lives in
     */
    domObj : null,
    /**
     * Property: isActive
     * When a toolbar contains <Jx.Menu> instances, they want to know
     * if any menu in the toolbar is active and this is how they
     * find out.
     */
    isActive : false,
    options: {
        type: 'Toolbar',
        /* Option: position
         * the position of this toolbar in the container.  The position
         * affects some items in the toolbar, such as menus and flyouts, which
         * need to open in a manner sensitive to the position.  May be one of
         * 'top', 'right', 'bottom' or 'left'.  Default is 'top'.
         */
        position: 'top',
        /* Option: parent
         * a DOM element to add this toolbar to
         */
        parent: null,
        /* Option: autoSize
         * if true, the toolbar will attempt to set its size based on the
         * things it contains.  Default is false.
         */
        autoSize: false,
        /* Option: scroll
         * if true, the toolbar may scroll if the contents are wider than
         * the size of the toolbar
         */
        scroll: true
    },
    /**
     * Constructor: Jx.Toolbar
     * Create a new instance of Jx.Toolbar.
     *
     * Parameters:
     * options - <Jx.Toolbar.Options>
     */
    initialize : function(options) {
        this.setOptions(options);
        this.items = [];
        
        this.domObj = new Element('ul', {
            id: this.options.id,
            'class':'jx'+this.options.type
        });
        
        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
        this.deactivateWatcher = this.deactivate.bindWithEvent(this);
        if (this.options.items) {
            this.add(this.options.items);
        }
    },
    
    /**
     * Method: addTo
     * add this toolbar to a DOM element automatically creating a toolbar
     * container if necessary
     *
     * Parameters:
     * parent - the DOM element or toolbar container to add this toolbar to.
     */
    addTo: function(parent) {
        var tbc = document.id(parent).retrieve('jxBarContainer');
        if (!tbc) {
            tbc = new Jx.Toolbar.Container({
                parent: parent, 
                position: this.options.position, 
                autoSize: this.options.autoSize,
                scroll: this.options.scroll
            });
        }
        tbc.add(this);
        return this;
    },
    
    /**
     * Method: add
     * Add an item to the toolbar.  If the item being added is a Jx component
     * with a domObj property, the domObj is added.  If the item being added
     * is an LI element, then it is given a CSS class of *jxToolItem*.
     * Otherwise, the thing is wrapped in a <Jx.ToolbarItem>.
     *
     * Parameters:
     * thing - {Object} the thing to add.  More than one thing can be added
     * by passing multiple arguments.
     */
    add: function( ) {
        $A(arguments).flatten().each(function(thing) {
            if (thing.domObj) {
                thing = thing.domObj;
            }
            if (thing.tagName == 'LI') {
                if (!thing.hasClass('jxToolItem')) {
                    thing.addClass('jxToolItem');
                }
                this.domObj.appendChild(thing);
            } else {
                var item = new Jx.Toolbar.Item(thing);
                this.domObj.appendChild(item.domObj);
            }            
        }, this);

        if (arguments.length > 0) {
            this.fireEvent('add', this);
        }
        return this;
    },
    /**
     * Method: remove
     * remove an item from a toolbar.  If the item is not in this toolbar
     * nothing happens
     *
     * Parameters:
     * item - {Object} the object to remove
     *
     * Returns:
     * {Object} the item that was removed, or null if the item was not
     * removed.
     */
    remove: function(item) {
        if (item.domObj) {
            item = item.domObj;
        }
        var li = item.findElement('LI');
        if (li && li.parentNode == this.domObj) {
            item.dispose();
            li.dispose();
            this.fireEvent('remove', this);
        } else {
            return null;
        }
    },
    /**
     * Method: deactivate
     * Deactivate the Toolbar (when it is acting as a menu bar).
     */
    deactivate: function() {
        this.items.each(function(o){o.hide();});
        this.setActive(false);
    },
    /**
     * Method: isActive
     * Indicate if the toolbar is currently active (as a menu bar)
     *
     * Returns:
     * {Boolean}
     */
    isActive: function() { 
        return this.isActive; 
    },
    /**
     * Method: setActive
     * Set the active state of the toolbar (for menus)
     *
     * Parameters: 
     * b - {Boolean} the new state
     */
    setActive: function(b) { 
        this.isActive = b;
        if (this.isActive) {
            document.addEvent('click', this.deactivateWatcher);
        } else {
            document.removeEvent('click', this.deactivateWatcher);
        }
    },
    /**
     * Method: setVisibleItem
     * For menus, they want to know which menu is currently open.
     *
     * Parameters:
     * obj - {<Jx.Menu>} the menu that just opened.
     */
    setVisibleItem: function(obj) {
        if (this.visibleItem && this.visibleItem.hide && this.visibleItem != obj) {
            this.visibleItem.hide();
        }
        this.visibleItem = obj;
        if (this.isActive()) {
            this.visibleItem.show();
        }
    },
    showItem: function(item) {
        this.fireEvent('show', item);
    }
});
// $Id: container.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.Toolbar.Container
 *
 * Extends: <Jx.Widget>
 *
 * A toolbar container contains toolbars.  A single toolbar container fills
 * the available space horizontally.  Toolbars placed in a toolbar container
 * do not wrap when they exceed the available space.
 *
 * Events:
 * add - fired when one or more toolbars are added to a container
 * remove - fired when one or more toolbars are removed from a container
 *
 * Implements: 
 * Options
 * Events
 * {<Jx.Addable>}
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Toolbar.Container = new Class({
    Family: 'Jx.Toolbar.Container',
    Extends: Jx.Widget,
    /**
     * Property: domObj
     * {HTMLElement} the HTML element that the container lives in
     */
    domObj : null,
    options: {
        /* Option: parent
         * a DOM element to add this to
         */
        parent: null,
        /* Option: position
         * the position of the toolbar container in its parent, one of 'top',
         * 'right', 'bottom', or 'left'.  Default is 'top'
         */
        position: 'top',
        /* Option: autoSize
         * automatically size the toolbar container to fill its container.
         * Default is false
         */
        autoSize: false,
        /* Option: scroll
         * Control whether the user can scroll of the content of the
         * container if the content exceeds the size of the container.  
         * Default is true.
         */
        scroll: true
    },
    /**
     * Constructor: Jx.Toolbar.Container
     * Create a new instance of Jx.Toolbar.Container
     *
     * Parameters:
     * options - <Jx.Toolbar.Options>
     */
    initialize : function(options) {
        this.setOptions(options);
        
        var d = document.id(this.options.parent);
        this.domObj = d || new Element('div');
        this.domObj.addClass('jxBarContainer');
        
        if (this.options.scroll) {
            this.scroller = new Element('div', {'class':'jxBarScroller'});
            this.domObj.adopt(this.scroller);
        }

        /* this allows toolbars to add themselves to this bar container
         * once it already exists without requiring an explicit reference
         * to the toolbar container
         */
        this.domObj.store('jxBarContainer', this);
        
        if (['top','right','bottom','left'].contains(this.options.position)) {
            this.domObj.addClass('jxBar' +
                           this.options.position.capitalize());            
        } else {
            this.domObj.addClass('jxBarTop');
            this.options.position = 'top';
        }

        if (this.options.scroll && ['top','bottom'].contains(this.options.position)) {
            // make sure we update our size when we get added to the DOM
            this.addEvent('addTo', this.update.bind(this));
            
            //making Fx.Tween optional
            if (typeof Fx != 'undefined' && typeof Fx.Tween != 'undefined'){
                this.scrollFx = scrollFx = new Fx.Tween(this.scroller, {
                    link: 'chain'
                });
            }

            this.scrollLeft = new Jx.Button({
                image: Jx.aPixel.src
            }).addTo(this.domObj);
            this.scrollLeft.domObj.addClass('jxBarScrollLeft');
            this.scrollLeft.addEvents({
               click: (function(){
                   var from = this.scroller.getStyle('left').toInt();
                   if (isNaN(from)) { from = 0; }
                   var to = Math.min(from+100, 0);
                   if (to >= 0) {
                       this.scrollLeft.domObj.setStyle('visibility', 'hidden');
                   }
                   this.scrollRight.domObj.setStyle('visibility', '');
                   if ($defined(this.scrollFx)){
                       this.scrollFx.start('left', from, to);
                   } else {
                       this.scroller.setStyle('left',to);
                   }
               }).bind(this)
            });
            
            this.scrollRight = new Jx.Button({
                image: Jx.aPixel.src
            }).addTo(this.domObj);
            this.scrollRight.domObj.addClass('jxBarScrollRight');
            this.scrollRight.addEvents({
               click: (function(){
                   var from = this.scroller.getStyle('left').toInt();
                   if (isNaN(from)) { from = 0; }
                   var to = Math.max(from - 100, this.scrollWidth);
                   if (to == this.scrollWidth) {
                       this.scrollRight.domObj.setStyle('visibility', 'hidden');
                   }
                   this.scrollLeft.domObj.setStyle('visibility', '');
                   if ($defined(this.scrollFx)){
                       this.scrollFx.start('left', from, to);
                   } else {
                       this.scroller.setStyle('left',to);
                   }
               }).bind(this)
            });         
            
        } else {
            this.options.scroll = false;
        }

        if (this.options.toolbars) {
            this.add(this.options.toolbars);
        }
    },
    
    update: function() {
        if (this.options.autoSize) {
            /* delay the size update a very small amount so it happens
             * after the current thread of execution finishes.  If the
             * current thread is part of a window load event handler,
             * rendering hasn't quite finished yet and the sizes are
             * all wrong
             */
            (function(){
                var x = 0;
                this.scroller.getChildren().each(function(child){
                    x+= child.getSize().x;
                });
                this.domObj.setStyles({width:x});
                this.measure();
            }).delay(1,this);
        } else {
            this.measure();
        }
    },
    
    measure: function() {
        if ((!this.scrollLeftSize || !this.scrollLeftSize.x) && this.domObj.parentNode) {
            this.scrollLeftSize = this.scrollLeft.domObj.getSize();
            this.scrollRightSize = this.scrollRight.domObj.getSize();
        }
        /* decide if we need to show the scroller buttons and
         * do some calculations that will make it faster
         */
        this.scrollWidth = this.domObj.getSize().x;
        this.scroller.getChildren().each(function(child){
            this.scrollWidth -= child.getSize().x;
        }, this);
        if (this.scrollWidth < 0) {
            /* we need to show scrollers on at least one side */
            var l = this.scroller.getStyle('left').toInt();
            if (l < 0) {
                this.scrollLeft.domObj.setStyle('visibility','');
            } else {
                this.scrollLeft.domObj.setStyle('visibility','hidden');
            }
            if (l <= this.scrollWidth) {
                this.scrollRight.domObj.setStyle('visibility', 'hidden');
                if (l < this.scrollWidth) {
                    if ($defined(this.scrollFx)){
                        this.scrollFx.start('left', l, this.scrollWidth);
                    } else {
                        this.scroller.setStyle('left',this.scrollWidth);
                    }
                }
            } else {
                this.scrollRight.domObj.setStyle('visibility', '');                
            }
            
        } else {
            /* don't need any scrollers but we might need to scroll
             * the toolbar into view
             */
            this.scrollLeft.domObj.setStyle('visibility','hidden');
            this.scrollRight.domObj.setStyle('visibility','hidden');
            var from = this.scroller.getStyle('left').toInt();
            if (!isNaN(from) && from !== 0) {
                if ($defined(this.scrollFx)) {
                    this.scrollFx.start('left', 0);
                } else {
                    this.scroller.setStyle('left',0);
                }
            }
        }            
    },
    
    /**
     * Method: add
     * Add a toolbar to the container.
     *
     * Parameters:
     * toolbar - {Object} the toolbar to add.  More than one toolbar
     *    can be added by passing multiple arguments.
     */
    add: function( ) {
        $A(arguments).flatten().each(function(thing) {
            if (this.options.scroll) {
                /* we potentially need to show or hide scroller buttons
                 * when the toolbar contents change
                 */
                thing.addEvent('add', this.update.bind(this));
                thing.addEvent('remove', this.update.bind(this));                
                thing.addEvent('show', this.scrollIntoView.bind(this));                
            }
            if (this.scroller) {
                this.scroller.adopt(thing.domObj);
            } else {
                this.domObj.adopt(thing.domObj);
            }
            this.domObj.addClass('jx'+thing.options.type+this.options.position.capitalize());
        }, this);
        if (this.options.scroll) {
            this.update();            
        }
        if (arguments.length > 0) {
            this.fireEvent('add', this);
        }
        return this;
    },
    /**
     * Method: remove
     * remove an item from a toolbar.  If the item is not in this toolbar
     * nothing happens
     *
     * Parameters:
     * item - {Object} the object to remove
     *
     * Returns:
     * {Object} the item that was removed, or null if the item was not
     * removed.
     */
    remove: function(item) {
        
    },
    /**
     * Method: scrollIntoView
     * scrolls an item in one of the toolbars into the currently visible
     * area of the container if it is not already fully visible
     *
     * Parameters:
     * item - the item to scroll.
     */
    scrollIntoView: function(item) {
        var width = this.domObj.getSize().x;
        var coords = item.domObj.getCoordinates(this.scroller);
        
        //left may be set to auto or even a zero length string. 
        //In the previous version, in air, this would evaluate to
        //NaN which would cause the right hand scroller to show when 
        //the component was first created.
        
        //So, get the left value first
        var l = this.scroller.getStyle('left');
        //then check to see if it's auto or a zero length string 
        if (l === 'auto' || l.length <= 0) {
            //If so, set to 0.
            l = 0;
        } else {
            //otherwise, convert to int
            l = l.toInt();
        }
        var slSize = this.scrollLeftSize ? this.scrollLeftSize.x : 0;
        var srSize = this.scrollRightSize ? this.scrollRightSize.x : 0;
        
        var left = l;
        if (l < -coords.left + slSize) {
            /* the left edge of the item is not visible */
            left = -coords.left + slSize;
            if (left >= 0) {
                left = 0;
            }
        } else if (width - coords.right - srSize< l) {
            /* the right edge of the item is not visible */
            left =  width - coords.right - srSize;
            if (left < this.scrollWidth) {
                left = this.scrollWidth;
            }
        }
                
        if (left < 0) {
            this.scrollLeft.domObj.setStyle('visibility','');                
        } else {
            this.scrollLeft.domObj.setStyle('visibility','hidden');
        }
        if (left <= this.scrollWidth) {
            this.scrollRight.domObj.setStyle('visibility', 'hidden');
        } else {
            this.scrollRight.domObj.setStyle('visibility', '');                
        }
        if (left != l) {
            if ($defined(this.scrollFx)) {
                this.scrollFx.start('left', left);
            } else {
                this.scroller.setStyle('left',left);
            }
        }
    }
});
// $Id: panel.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.Panel
 *
 * Extends: <Jx.Widget>
 *
 * A panel is a fundamental container object that has a content
 * area and optional toolbars around the content area.  It also
 * has a title bar area that contains an optional label and
 * some user controls as determined by the options passed to the
 * constructor.
 *
 * Example:
 * (code)
 * (end)
 *
 * Events:
 * close - fired when the panel is closed
 * collapse - fired when the panel is collapsed
 * expand - fired when the panel is opened
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Panel = new Class({
    Family: 'Jx.Panel',
    Extends: Jx.Widget,
    
    toolbarContainers: {
        top: null,
        right: null,
        bottom: null,
        left: null
    },
    
     options: {
        position: 'absolute',
        type: 'Panel',
        /* Option: id
         * String, an id to assign to the panel's container
         */
        id: '',
        /* Option: label
         * String, the title of the Jx Panel
         */
        label: '&nbsp;',
        /* Option: height
         * integer, fixed height to give the panel - no fixed height by
         * default.
         */
        height: null,
        /* Option: collapse
         * boolean, determine if the panel can be collapsed and expanded
         * by the user.  This puts a control into the title bar for the user
         * to control the state of the panel.
         */
        collapse: true,
        /* Option: collapseTooltip
         * the tooltip to display over the collapse button
         */
        collapseTooltip: 'Collapse/Expand Panel',
        /* Option: collapseLabel
         * the label to use for the collapse menu item
         */
        collapseLabel: 'Collapse',
        /* Option: expandLabel
         * the label to use for the expand menu item
         */
        expandLabel: 'Expand',
        /* Option: maximizeTooltip
         * the tooltip to display over the maximize button
         */
        maximizeTooltip: 'Maximize Panel',
        /* Option: maximizeLabel
         * the label to use for the maximize menu item
         */
        maximizeLabel: 'Maximize',
        /* Option: close
         * boolean, determine if the panel can be closed (hidden) by the user.
         * The application needs to provide a way to re-open the panel after
         * it is closed.  The closeable property extends to dialogs created by
         * floating panels.  This option puts a control in the title bar of
         * the panel.
         */
        close: false,
        /* Option: closeTooltip
         * the tooltip to display over the close button
         */
        closeTooltip: 'Close Panel',
        /* Option: closeLabel
         * the label to use for the close menu item
         */
        closeLabel: 'Close',
        /* Option: closed
         * boolean, initial state of the panel (true to start the panel
         *  closed), default is false
         */
        closed: false,
        /* Option: hideTitle
         * Boolean, hide the title bar if true.  False by default.
         */
        hideTitle: false,
        /* Option: toolbars
         * array of Jx.Toolbar objects to put in the panel.  The position
         * of each toolbar is used to position the toolbar within the panel.
         */
        toolbars: []
    },
    
    /** 
     * Constructor: Jx.Panel
     * Initialize a new Jx.Panel instance
     *
     * Options: <Jx.Panel.Options>, <Jx.ContentLoader.Options>
     */
    initialize : function(options){
        this.setOptions(options);
        this.toolbars = options ? options.toolbars || [] : [];
        
        if ($defined(this.options.height) && !$defined(options.position)) {
            this.options.position = 'relative';
        }

        /* set up the title object */
        this.title = new Element('div', {
            'class': 'jx'+this.options.type+'Title'
        });
        
        var i = new Element('img', {
            'class': 'jx'+this.options.type+'Icon',
            src: Jx.aPixel.src,
            alt: '',
            title: ''
        });
        if (this.options.image) {
            i.setStyle('backgroundImage', 'url('+this.options.image+')');
        }
        this.title.adopt(i);
        
        this.labelObj = new Element('span', {
            'class': 'jx'+this.options.type+'Label',
            html: this.options.label
        });
        this.title.adopt(this.labelObj);
        
        var controls = new Element('div', {
            'class': 'jx'+this.options.type+'Controls'
        });
        var tbDiv = new Element('div');
        controls.adopt(tbDiv);
        this.toolbar = new Jx.Toolbar({parent:tbDiv});
        this.title.adopt(controls);
        
        var that = this;
        
        if (this.options.menu) {
            this.menu = new Jx.Menu({
                image: Jx.aPixel.src
            });
            this.menu.domObj.addClass('jx'+this.options.type+'Menu');
            this.menu.domObj.addClass('jxButtonContentLeft');
            this.toolbar.add(this.menu);
        }
        
        if (this.options.collapse) {
            var b = new Jx.Button({
                image: Jx.aPixel.src,
                tooltip: this.options.collapseTooltip,
                onClick: function() {
                    that.toggleCollapse();
                }
            });
            b.domObj.addClass('jx'+this.options.type+'Collapse');
            this.toolbar.add(b);
            if (this.menu) {
                var item = new Jx.Menu.Item({
                    label: this.options.collapseLabel,
                    onClick: function() { that.toggleCollapse(); }
                });
                this.addEvents({
                    collapse: function() {
                        item.setLabel(this.options.expandLabel);
                    },
                    expand: function() {
                        item.setLabel(this.options.collapseLabel);
                    }
                });
                this.menu.add(item);
            }
        }
        
        if (this.options.maximize) {
            var b = new Jx.Button({
                image: Jx.aPixel.src,
                tooltip: this.options.maximizeTooltip,
                onClick: function() {
                    that.maximize();
                }
            });
            b.domObj.addClass('jx'+this.options.type+'Maximize');
            this.toolbar.add(b);
            if (this.menu) {
                var item = new Jx.Menu.Item({
                    label: this.options.maximizeLabel,
                    onClick: function() { that.maximize(); }
                });
                this.menu.add(item);
            }
        }
        
        if (this.options.close) {
            var b = new Jx.Button({
                image: Jx.aPixel.src,
                tooltip: this.options.closeTooltip,
                onClick: function() {
                    that.close();
                }
            });
            b.domObj.addClass('jx'+this.options.type+'Close');
            this.toolbar.add(b);
            if (this.menu) {
                var item = new Jx.Menu.Item({
                    label: this.options.closeLabel,
                    onClick: function() {
                        that.close();
                    }
                });
                this.menu.add(item);
            }
            
        }
        
        this.title.addEvent('dblclick', function() {
            that.toggleCollapse();
        });
        
        this.domObj = new Element('div', {
            'class': 'jx'+this.options.type
        });
        if (this.options.id) {
            this.domObj.id = this.options.id;
        }
        var jxl = new Jx.Layout(this.domObj, $merge(this.options, {propagate:false}));
        var layoutHandler = this.layoutContent.bind(this);
        jxl.addEvent('sizeChange', layoutHandler);
        
        if (!this.options.hideTitle) {
            this.domObj.adopt(this.title);
        }
        
        this.contentContainer = new Element('div', {
            'class': 'jx'+this.options.type+'ContentContainer'
        });
        this.domObj.adopt(this.contentContainer);
        
        if (Jx.type(this.options.toolbars) == 'array') {
            this.options.toolbars.each(function(tb){
                var position = tb.options.position;
                var tbc = this.toolbarContainers[position];
                if (!tbc) {
                    var tbc = new Element('div');
                    new Jx.Layout(tbc);
                    this.contentContainer.adopt(tbc);
                    this.toolbarContainers[position] = tbc;
                }
                tb.addTo(tbc);
            }, this);
        }
        
        this.content = new Element('div', {
            'class': 'jx'+this.options.type+'Content'
        });
        
        this.contentContainer.adopt(this.content);
        new Jx.Layout(this.contentContainer);
        new Jx.Layout(this.content);
        
        this.loadContent(this.content);

        this.toggleCollapse(this.options.closed);
        
        this.addEvent('addTo', function() {
            this.domObj.resize();
        });
        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
    },
    
    /**
     * Method: layoutContent
     * the sizeChange event of the <Jx.Layout> that manages the outer container
     * is intercepted and passed through this method to handle resizing of the
     * panel contents because we need to do some calculations if the panel
     * is collapsed and if there are toolbars to put around the content area.
     */
    layoutContent: function() {
        var titleHeight = 0;
        var top = 0;
        var bottom = 0;
        var left = 0;
        var right = 0;
        var tbc;
        var tb;
        var position;
        if (!this.options.hideTitle && this.title.parentNode == this.domObj) {
            titleHeight = this.title.getMarginBoxSize().height;
        }
        var domSize = this.domObj.getContentBoxSize();
        if (domSize.height > titleHeight) {
            this.contentContainer.setStyle('display','block');
            this.options.closed = false;
            this.contentContainer.resize({
                top: titleHeight, 
                height: null, 
                bottom: 0
            });
            ['left','right'].each(function(position){
                if (this.toolbarContainers[position]) {
                    this.toolbarContainers[position].style.width = 'auto';
                }
            }, this);
            ['top','bottom'].each(function(position){
                if (this.toolbarContainers[position]) {
                    this.toolbarContainers[position].style.height = '';                
                }
            }, this);
            if (Jx.type(this.options.toolbars) == 'array') {
                this.options.toolbars.each(function(tb){
                    position = tb.options.position;
                    tbc = this.toolbarContainers[position];
                    // IE 6 doesn't seem to want to measure the width of 
                    // things correctly
                    if (Browser.Engine.trident4) {
                        var oldParent = document.id(tbc.parentNode);
                        tbc.style.visibility = 'hidden';
                        document.id(document.body).adopt(tbc);                    
                    }
                    var size = tbc.getBorderBoxSize();
                    // put it back into its real parent now we are done 
                    // measuring
                    if (Browser.Engine.trident4) {
                        oldParent.adopt(tbc);
                        tbc.style.visibility = '';
                    }
                    switch(position) {
                        case 'top':
                            top = size.height;
                            break;
                        case 'bottom':
                            bottom = size.height;
                            break;
                        case 'left':
                            left = size.width;
                            break;
                        case 'right':
                            right = size.width;
                            break;
                    }                    
                },this);
            }
            tbc = this.toolbarContainers['top'];
            if (tbc) {
                tbc.resize({top: 0, left: left, right: right, bottom: null, height: top, width: null});
            }
            tbc = this.toolbarContainers['bottom'];
            if (tbc) {
                tbc.resize({top: null, left: left, right: right, bottom: 0, height: bottom, width: null});
            }
            tbc = this.toolbarContainers['left'];
            if (tbc) {
                tbc.resize({top: top, left: 0, right: null, bottom: bottom, height: null, width: left});
            }
            tbc = this.toolbarContainers['right'];
            if (tbc) {
                tbc.resize({top: top, left: null, right: 0, bottom: bottom, height: null, width: right});
            }
            this.content.resize({top: top, bottom: bottom, left: left, right: right});
        } else {
            this.contentContainer.setStyle('display','none');
            this.options.closed = true;
        }
        this.fireEvent('sizeChange', this);
    },
    
    /**
     * Method: setLabel
     * Set the label in the title bar of this panel
     *
     * Parameters:
     * s - {String} the new label
     */
    setLabel: function(s) {
        this.labelObj.innerHTML = s;
    },
    /**
     * Method: getLabel
     * Get the label of the title bar of this panel
     *
     * Returns: 
     * {String} the label
     */
    getLabel: function() {
        return this.labelObj.innerHTML;
    },
    /**
     * Method: finalize
     * Clean up the panel
     */
    finalize: function() {
        this.domObj = null;
        this.deregisterIds();
    },
    /**
     * Method: maximize
     * Maximize this panel
     */
    maximize: function() {
        if (this.manager) {
            this.manager.maximizePanel(this);
        }
    },
    /**
     * Method: setContent
     * set the content of this panel to some HTML
     *
     * Parameters:
     * html - {String} the new HTML to go in the panel
     */
    setContent : function (html) {
        this.content.innerHTML = html;
        this.bContentReady = true;
    },
    /**
     * Method: setContentURL
     * Set the content of this panel to come from some URL.
     *
     * Parameters:
     * url - {String} URL to some HTML content for this panel
     */
    setContentURL : function (url) {
        this.bContentReady = false;
        this.setBusy(true);
        if (arguments[1]) {
            this.onContentReady = arguments[1];
        }
        if (url.indexOf('?') == -1) {
            url = url + '?';
        }
        var a = new Request({
            url: url,
            method: 'get',
            evalScripts:true,
            onSuccess:this.panelContentLoaded.bind(this),
            requestHeaders: ['If-Modified-Since', 'Sat, 1 Jan 2000 00:00:00 GMT']
        }).send();
    },
    /**
     * Method: panelContentLoaded
     * When the content of the panel is loaded from a remote URL, this 
     * method is called when the ajax request returns.
     *
     * Parameters:
     * html - {String} the html return from xhr.onSuccess
     */
    panelContentLoaded: function(html) {
        this.content.innerHTML = html;
        this.bContentReady = true;
        this.setBusy(false);
        if (this.onContentReady) {
            window.setTimeout(this.onContentReady.bind(this),1);
        }
    },
    /**
     * Method: setBusy
     * Set the panel as busy or not busy, which displays a loading image
     * in the title bar.
     *
     * Parameters:
     * isBusy - {Boolean} the busy state
     */
    setBusy : function(isBusy) {
        this.busyCount += isBusy?1:-1;
        if (this.loadingObj){
            this.loadingObj.img.style.visibility = (this.busyCount>0)?'visible':'hidden';
        }
    },
    
    /**
     * Method: toggleCollapse
     * sets or toggles the collapsed state of the panel.  If a
     * new state is passed, it is used, otherwise the current
     * state is toggled.    
     *
     * Parameters:
     * state - optional, if passed then the state is used, 
     * otherwise the state is toggled.
     */
    toggleCollapse: function(state) {
        if ($defined(state)) {
            this.options.closed = state;
        } else {
            this.options.closed = !this.options.closed;
        }
        if (this.options.closed) {
            if (!this.domObj.hasClass('jx'+this.options.type+'Min')) {
                this.domObj.addClass('jx'+this.options.type+'Min');
                this.contentContainer.setStyle('display','none');
                var m = this.domObj.measure(function(){
                    return this.getSizes(['margin'],['top','bottom']).margin;
                });
                var height = m.top + m.bottom;
                if (this.title.parentNode == this.domObj) {
                    height += this.title.getMarginBoxSize().height;
                }
                this.domObj.resize({height: height});
                this.fireEvent('collapse', this);
            }
        } else {
            if (this.domObj.hasClass('jx'+this.options.type+'Min')) {
                this.domObj.removeClass('jx'+this.options.type+'Min');
                this.contentContainer.setStyle('display','block');
                this.domObj.resize({height: this.options.height});            
                this.fireEvent('expand', this);
            }
        }
    },
    
    /**
     * Method: close
     * Closes the panel (completely hiding it).
     */
    close: function() {
        this.domObj.dispose();
        this.fireEvent('close', this);
    }
    
});// $Id: dialog.js 514 2009-08-13 19:43:15Z kasi@arielgrafik.de $
/**
 * Class: Jx.Dialog
 *
 * Extends: <Jx.Panel>
 *
 * A Jx.Dialog implements a floating dialog.  Dialogs represent a useful way
 * to present users with certain information or application controls.
 * Jx.Dialog is designed to provide the same types of features as traditional
 * operating system dialog boxes, including:
 *
 * - dialogs may be modal (user must dismiss the dialog to continue) or 
 * non-modal
 *
 * - dialogs are movable (user can drag the title bar to move the dialog
 * around)
 *
 * - dialogs may be a fixed size or allow user resizing.
 *
 * Jx.Dialog uses <Jx.ContentLoader> to load content into the content area
 * of the dialog.  Refer to the <Jx.ContentLoader> documentation for details
 * on content options.
 *
 * Example:
 * (code)
 * var dialog = new Jx.Dialog();
 * (end)
 *
 * Events:
 * open - triggered when the dialog is opened
 * close - triggered when the dialog is closed
 * change - triggered when the value of an input in the dialog is changed
 * resize - triggered when the dialog is resized
 *
 * Extends:
 * Jx.Dialog extends <Jx.Panel>, please go there for more details.
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Dialog = new Class({
    Family: 'Jx.Dialog',
    Extends: Jx.Panel,
    Implements: [Jx.AutoPosition, Jx.Chrome],
    
    /**
     * Property: {HTMLElement} blanket
     * modal dialogs prevent interaction with the rest of the application
     * while they are open, this element is displayed just under the
     * dialog to prevent the user from clicking anything.
     */
    blanket: null,
    
    options: {
        /* Option: modal
         * (optional) {Boolean} controls whether the dialog will be modal
         * or not.  The default is to create modal dialogs.
         */
        modal: true,
        /* just overrides default position of panel, don't document this */
        position: 'absolute',
        /* Option: width
         * (optional) {Integer} the initial width in pixels of the dialog.
         * The default value is 250 if not specified.
         */
        width: 250,
        /* Option: height
         * (optional) {Integer} the initial height in pixels of the 
         * dialog. The default value is 250 if not specified.
         */
        height: 250,
        /* Option: horizontal
         * (optional) {String} the horizontal rule for positioning the
         * dialog.  The default is 'center center' meaning the dialog will be
         * centered on the page.  See {<Jx.AutoPosition>} for details.
         */
        horizontal: 'center center',
        /* Option: vertical
         * (optional) {String} the vertical rule for positioning the
         * dialog.  The default is 'center center' meaning the dialog will be
         * centered on the page.  See {<Jx.AutoPosition>} for details.
         */
        vertical: 'center center',
        /* Option: label
         * (optional) {String} the title of the dialog box.  "New Dialog"
         * is the default value.
         */
        label: 'New Dialog',
        /* Option: id
         * (optional) {String} an HTML ID to assign to the dialog, primarily
         * used for applying CSS styles to specific dialogs
         */
        id: '',
        /* Option: parent
         * (optional) {HTMLElement} a reference to an HTML element that
         * the dialog is to be contained by.  The default value is for the dialog
         * to be contained by the body element.
         */
        parent: null,
        /* Option: resize
         * (optional) {Boolean} determines whether the dialog is
         * resizeable by the user or not.  Default is false.
         */
        resize: false,
        /* Option: resizeTooltip
         * the tooltip to display for the resize handle, empty by default.
         */
        resizeTooltip: '',
        /* Option: move
         * (optional) {Boolean} determines whether the dialog is
         * moveable by the user or not.  Default is true.
         */
        move: true,
        /* Option: close
         * (optional) {Boolean} determines whether the dialog is
         * closeable by the user or not.  Default is true.
         */
        close: true
    },
    /**
     * Constructor: Jx.Dialog
     * Construct a new instance of Jx.Dialog
     *
     * Parameters: 
     * options - {Object} an object containing options for the dialog.
     *
     * Options: <Jx.Dialog.Options>, <Jx.Panel.Options>, <Jx.ContentLoader.Options>
     */
    initialize: function(options) {
        this.isOpening = false;
        this.firstShow = true;
        
        /* initialize the panel overriding the type and position */
        this.parent($merge(
            {parent:document.body}, // these are defaults that can be overridden
            options,
            {type:'Dialog', position: 'absolute'} // these override anything passed to the options
        ));
        this.openOnLoaded = this.open.bind(this);
        this.options.parent = document.id(this.options.parent);
        
        if (this.options.modal) {
            this.blanket = new Element('div',{
                'class':'jxDialogModal',
                styles:{
                    display:'none',
                    zIndex: -1
                }
            });
            this.blanket.resize = (function() {
                var ss = document.id(document.body).getScrollSize();
                this.setStyles({
                    width: ss.x,
                    height: ss.y
                });
            }).bind(this.blanket);
            this.options.parent.adopt(this.blanket);
            window.addEvent('resize', this.blanket.resize);
            
        }

        this.domObj.setStyle('display','none');
        this.options.parent.adopt(this.domObj);
        
        /* the dialog is moveable by its title bar */
        if (this.options.move && typeof Drag != 'undefined') {
            this.title.addClass('jxDialogMoveable');
            new Drag(this.domObj, {
                handle: this.title,
                onBeforeStart: (function(){
                    Jx.Dialog.orderDialogs(this);
                }).bind(this),
                onStart: (function() {
                    this.contentContainer.setStyle('visibility','hidden');
                    this.chrome.addClass('jxChromeDrag');
                }).bind(this),
                onComplete: (function() {
                    this.chrome.removeClass('jxChromeDrag');
                    this.contentContainer.setStyle('visibility','');
                    var left = Math.max(this.chromeOffsets.left, parseInt(this.domObj.style.left,10));
                    var top = Math.max(this.chromeOffsets.top, parseInt(this.domObj.style.top,10));
                    this.options.horizontal = left + ' left';
                    this.options.vertical = top + ' top';
                    this.position(this.domObj, this.options.parent, this.options);
                    this.options.left = parseInt(this.domObj.style.left,10);
                    this.options.top = parseInt(this.domObj.style.top,10);
                    if (!this.options.closed) {
                        this.domObj.resize(this.options);                        
                    }
                }).bind(this)
            });            
        }
        
        /* the dialog is resizeable */
        if (this.options.resize && typeof Drag != 'undefined') {
            this.resizeHandle = new Element('div', {
                'class':'jxDialogResize',
                title: this.options.resizeTooltip,
                styles: {
                    'display':this.options.closed?'none':'block'
                }
            });
            this.domObj.appendChild(this.resizeHandle);

            this.resizeHandleSize = this.resizeHandle.getSize(); 
            this.resizeHandle.setStyles({
                bottom: this.resizeHandleSize.height,
                right: this.resizeHandleSize.width
            });
            this.domObj.makeResizable({
                handle:this.resizeHandle,
                onStart: (function() {
                    this.contentContainer.setStyle('visibility','hidden');
                    this.chrome.addClass('jxChromeDrag');
                }).bind(this),
                onDrag: (function() {
                    this.resizeChrome(this.domObj);
                }).bind(this),
                onComplete: (function() {
                    this.chrome.removeClass('jxChromeDrag');
                    var size = this.domObj.getMarginBoxSize();
                    this.options.width = size.width;
                    this.options.height = size.height;
                    this.layoutContent();
                    this.domObj.resize(this.options);
                    this.contentContainer.setStyle('visibility','');
                    this.fireEvent('resize');
                    this.resizeChrome(this.domObj);
                    
                }).bind(this)
            });
        }
        /* this adjusts the zIndex of the dialogs when activated */
        this.domObj.addEvent('mousedown', (function(){
            Jx.Dialog.orderDialogs(this);
        }).bind(this));
    },
    
    /**
     * Method: resize
     * resize the dialog.  This can be called when the dialog is closed
     * or open.
     *
     * Parameters:
     * width - the new width
     * height - the new height
     * autoPosition - boolean, false by default, if resizing an open dialog
     * setting this to true will reposition it according to its position
     * rules.
     */
    resize: function(width, height, autoPosition) {
        this.options.width = width;
        this.options.height = height;
        if (this.domObj.getStyle('display') != 'none') {
            this.layoutContent();
            this.domObj.resize(this.options);
            this.fireEvent('resize');
            this.resizeChrome(this.domObj);
            if (autoPosition) {
                this.position(this.domObj, this.options.parent, this.options);                
            }
        } else {
            this.firstShow = false;
        }
    },
    
    /**
     * Method: sizeChanged
     * overload panel's sizeChanged method
     */
    sizeChanged: function() {
        if (!this.options.closed) {
            this.layoutContent();
        }
    },
    
    /**
     * Method: toggleCollapse
     * sets or toggles the collapsed state of the panel.  If a
     * new state is passed, it is used, otherwise the current
     * state is toggled.    
     *
     * Parameters:
     * state - optional, if passed then the state is used, 
     * otherwise the state is toggled.
     */
    toggleCollapse: function(state) {
        if ($defined(state)) {
            this.options.closed = state;
        } else {
            this.options.closed = !this.options.closed;
        }
        if (this.options.closed) {
            if (!this.domObj.hasClass('jx'+this.options.type+'Min')) {
                this.domObj.addClass('jx'+this.options.type+'Min');
            }
            this.contentContainer.setStyle('display','none');
            if (this.resizeHandle) {
                this.resizeHandle.setStyle('display','none');
            }
        } else {
            if (this.domObj.hasClass('jx'+this.options.type+'Min')) {
                this.domObj.removeClass('jx'+this.options.type+'Min');
            }
            this.contentContainer.setStyle('display','block');
            if (this.resizeHandle) {
                this.resizeHandle.setStyle('display','block');
            }
        }
        
        if (this.options.closed) {
            var m = this.domObj.measure(function(){
                return this.getSizes(['margin'],['top','bottom']).margin;
            });
            var size = this.title.getMarginBoxSize();
            this.domObj.resize({height: m.top + size.height + m.bottom});
            this.fireEvent('collapse');
        } else {
            this.domObj.resize(this.options);
            this.fireEvent('expand');
        }
        this.showChrome(this.domObj);
    },
    
    /**
     * Method: show
     * show the dialog, external code should use the <Jx.Dialog::open> method
     * to make the dialog visible.
     */
    show : function( ) {
        /* prepare the dialog for display */
        this.domObj.setStyles({
            'display': 'block',
            'visibility': 'hidden'
        });
        
        if (this.blanket) {
            this.blanket.resize();            
        }

        Jx.Dialog.orderDialogs(this);
        
        /* do the modal thing */
        if (this.blanket) {
            this.blanket.setStyles({
                visibility: 'visible',
                display: 'block'
            });
        }
        
        if (this.options.closed) {
            var m = this.domObj.measure(function(){
                return this.getSizes(['margin'],['top','bottom']).margin;
            });
            var size = this.title.getMarginBoxSize();
            this.domObj.resize({height: m.top + size.height + m.bottom});
        } else {
            this.domObj.resize(this.options);            
        }
        if (this.firstShow) {
            this.contentContainer.resize({forceResize: true});
            this.layoutContent();
            this.firstShow = false;
            /* if the chrome got built before the first dialog show, it might
             * not have been properly created and we should clear it so it
             * does get built properly
             */
            if (this.chrome) {
                this.chrome.dispose();
                this.chrome = null;
            }
        }
        /* update or create the chrome */
        this.showChrome(this.domObj);
        /* put it in the right place using auto-positioning */
        this.position(this.domObj, this.options.parent, this.options);
        this.domObj.setStyle('visibility', '');
    },
    /**
     * Method: hide
     * hide the dialog, external code should use the <Jx.Dialog::close>
     * method to hide the dialog.
     */
    hide : function() {
        Jx.Dialog.Stack.erase(this);
        Jx.Dialog.ZIndex--;
        this.domObj.setStyle('display','none');
        if (this.blanket) {
            this.blanket.setStyle('visibility', 'hidden');
            Jx.Dialog.ZIndex--;
        }
        
    },
    /**
     * Method: openURL
     * open the dialog and load content from the provided url.  If you don't
     * provide a URL then the dialog opens normally.
     *
     * Parameters:
     * url - <String> the url to load when opening.
     */
    openURL: function(url) {
        if (url) {
            this.options.contentURL = url;
            this.options.content = null;  //force Url loading
            this.loadContent(this.content);
            this.addEvent('contentLoaded', this.openOnLoaded); 
        }
        else {
            this.open();
        }
    },
    
    /**
     * Method: open
     * open the dialog.  This may be delayed depending on the 
     * asynchronous loading of dialog content.  The onOpen
     * callback function is called when the dialog actually
     * opens
     */
    open: function() {
        if (!this.isOpening) {
            this.isOpening = true;
        }
        if (this.contentIsLoaded) {
            this.removeEvent('contentLoaded', this.openOnLoaded);
            this.show();
            this.fireEvent('open', this);
            this.isOpening = false;
        } else {
            this.addEvent('contentLoaded', this.openOnLoaded);
        }
    },
    /**
     * Method: close
     * close the dialog and trigger the onClose callback function
     * if necessary
     */
    close: function() {
        this.isOpening = false;
        this.hide();
        this.fireEvent('close');
    }
});

Jx.Dialog.Stack = [];
Jx.Dialog.BaseZIndex = null;
Jx.Dialog.orderDialogs = function(d) {
    Jx.Dialog.Stack.erase(d).push(d);
    if (Jx.Dialog.BaseZIndex === null) {
        Jx.Dialog.BaseZIndex = Math.max(Jx.Dialog.Stack[0].domObj.getStyle('zIndex').toInt(), 1);
    }
    Jx.Dialog.Stack.each(function(d, i) {
        var z = Jx.Dialog.BaseZIndex+i;
        if (d.blanket) {
            d.blanket.setStyle('zIndex',z);
        }
        d.domObj.setStyle('zIndex',z);
    });
    
};
// $Id: splitter.js 505 2009-08-05 15:48:39Z kasi@arielgrafik.de $
/**
 * Class: Jx.Splitter
 *
 * Extends: <Jx.Object>
 *
 * a Jx.Splitter creates two or more containers within a parent container
 * and provides user control over the size of the containers.  The split
 * can be made horizontally or vertically.
 * 
 * A horizontal split creates containers that divide the space horizontally
 * with vertical bars between the containers.  A vertical split divides
 * the space vertically and creates horizontal bars between the containers.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
 
Jx.Splitter = new Class({
    Family: 'Jx.Splitter',
    Extends: Jx.Object,
    /**
     * Property: domObj
     * {HTMLElement} the element being split
     */
    domObj: null,
    /**
     * Property: elements
     * {Array} an array of elements that are displayed in each of the split 
     * areas
     */
    elements: null,
    /**
     * Property: bars
     * {Array} an array of the bars between each of the elements used to
     * resize the split areas.
     */
    bars: null,
    /**
     * Property: firstUpdate
     * {Boolean} track the first resize event so that unexposed Jx things
     * can be forced to calculate their size the first time they are exposed.
     */
    firstUpdate: true,
    options: {
        /* Option: useChildren
         * {Boolean} if set to true, then the children of the
         * element to be split are used as the elements.  The default value is
         * false.  If this is set, then the elements and splitInto options
         * are ignored.
         */
        useChildren: false,
        /* Option: splitInto
         * {Integer} the number of elements to split the domObj into.
         * If not set, then the length of the elements option is used, or 2 if
         * elements is not specified.  If splitInto is specified and elements
         * is specified, then splitInto is used.  If there are more elements than
         * splitInto specifies, then the extras are ignored.  If there are less
         * elements than splitInto specifies, then extras are created.
         */
        splitInto: 2,
        /* Option: elements
         * {Array} an array of elements to put into the split areas.
         * If splitInto is not set, then it is calculated from the length of
         * this array.
         */
        elements: null,
        /* Option: containerOptions
         * {Array} an array of objects that provide options
         *  for the <Jx.Layout> constraints on each element.
         */
        containerOptions: [],
        /* Option: barOptions
         * {Array} an array of object that provide options for the bars,
         * this array should be one less than the number of elements in the
         * splitter.  The barOptions objects can contain a snap property indicating
         * that a default snap object should be created in the bar and the value
         * of 'before' or 'after' indicates which element it snaps open/shut.
         */
        barOptions: [],
        /* Option: layout
         * {String} either 'horizontal' or 'vertical', indicating the
         * direction in which the domObj is to be split.
         */
        layout: 'horizontal',
        /* Option: snaps
         * {Array} an array of objects which can be used to snap
         * elements open or closed.
         */
        snaps: [],
        /* Option: barTooltip
         * the tooltip to display when the mouse hovers over a split bar, 
         * used for i18n.
         */
        barTooltip: 'drag this bar to resize',
        /* Option: onStart
         * an optional function to call when a bar starts dragging
         */
        onStart: null,
        /* Option: onFinish
         * an optional function to call when a bar finishes dragging
         */
        onFinish: null
    },
    /**
     * Constructor: Jx.Splitter
     * Create a new instance of Jx.Splitter
     *
     * Parameters:
     * domObj - {HTMLElement} the element or id of the element to split
     * options - <Jx.Splitter.Options>
     */
    initialize: function(domObj, options) {
        this.setOptions(options);  
        
        this.domObj = document.id(domObj);
        this.domObj.addClass('jxSplitContainer');
        var jxLayout = this.domObj.retrieve('jxLayout');
        if (jxLayout) {
            jxLayout.addEvent('sizeChange', this.sizeChanged.bind(this));
        }
       
        this.elements = [];
        this.bars = [];
        
        var nSplits = 2;
        if (this.options.useChildren) {
            this.elements = this.domObj.getChildren();
            nSplits = this.elements.length;
        } else {
            nSplits = this.options.elements ? 
                            this.options.elements.length : 
                            this.options.splitInto;
            for (var i=0; i<nSplits; i++) {
                var el;
                if (this.options.elements && this.options.elements[i]) {
                    if (options.elements[i].domObj) {
                        el = options.elements[i].domObj;
                    } else {
                        el = document.id(this.options.elements[i]);                        
                    }
                    if (!el) {
                        el = this.prepareElement();
                        el.id = this.options.elements[i];
                    }
                } else {
                    el = this.prepareElement();
                }
                this.elements[i] = el;
                this.domObj.adopt(this.elements[i]);
            }
        }
        this.elements.each(function(el) { el.addClass('jxSplitArea'); });
        for (var i=0; i<nSplits; i++) {
            var jxl = this.elements[i].retrieve('jxLayout');
            if (!jxl) {
                new Jx.Layout(this.elements[i], this.options.containerOptions[i]);
            } else {
                jxl.resize({position: 'absolute'});
            }
        }
        
        for (var i=1; i<nSplits; i++) {
            var bar;
            if (this.options.prepareBar) {
                bar = this.options.prepareBar(i-1);                
            } else {
                bar = this.prepareBar();                
            }
            bar.store('splitterObj', this);
            bar.store('leftSide',this.elements[i-1]);
            bar.store('rightSide', this.elements[i]);
            this.elements[i-1].store('rightBar', bar);
            this.elements[i].store('leftBar', bar);
            this.domObj.adopt(bar);
            this.bars[i-1] = bar;
        }
        
        //making dragging dependent on mootools Drag class
        if ($defined(Drag)) {
        	this.establishConstraints();
        }
        
        for (var i=0; i<this.options.barOptions.length; i++) {
            if (!this.bars[i]) {
                continue;
            }
            var opt = this.options.barOptions[i];
            if (opt && opt.snap && (opt.snap == 'before' || opt.snap == 'after')) {
                var element;
                if (opt.snap == 'before') {
                    element = this.bars[i].retrieve('leftSide');
                } else if (opt.snap == 'after') {
                    element = this.bars[i].retrieve('rightSide');
                }
                var snap;
                var snapEvents;
                if (opt.snapElement) {
                    snap = opt.snapElement;
                    snapEvents = opt.snapEvents || ['click', 'dblclick'];                    
                } else {
                    snap = this.bars[i];
                    snapEvents = opt.snapEvents || ['dblclick'];
                }
                if (!snap.parentNode) {
                    this.bars[i].adopt(snap);             
                }
                new Jx.Splitter.Snap(snap, element, this, snapEvents);
            }
        }
        
        for (var i=0; i<this.options.snaps.length; i++) {
            if (this.options.snaps[i]) {
                new Jx.Splitter.Snap(this.options.snaps[i], this.elements[i], this);
            }
        }
        
        this.sizeChanged();
    },
    /**
     * Method: prepareElement
     * Prepare a new, empty element to go into a split area.
     *
     * Returns:
     * {HTMLElement} an HTMLElement that goes into a split area.
     */
    prepareElement: function(){
        var o = new Element('div', {styles:{position:'absolute'}});
        return o;
    },
    
    /**
     * Method: prepareBar
     * Prepare a new, empty bar to go into between split areas.
     *
     * Returns:
     * {HTMLElement} an HTMLElement that becomes a bar.
     */
    prepareBar: function() {
        var o = new Element('div', {
            'class': 'jxSplitBar'+this.options.layout.capitalize(),
            'title': this.options.barTitle
        });
        return o;
    },
    
    /**
     * Method: establishConstraints
     * Setup the initial set of constraints that set the behaviour of the
     * bars between the elements in the split area.
     */
    establishConstraints: function() {
        var modifiers = {x:null,y:null};
        var fn;
        if (this.options.layout == 'horizontal') {
            modifiers.x = "left";
            fn = this.dragHorizontal;
        } else {
            modifiers.y = "top";
            fn = this.dragVertical;
        }
        if (typeof Drag != 'undefined') {
            this.bars.each(function(bar){
                var mask;
                new Drag(bar, {
                    //limit: limit,
                    modifiers: modifiers,
                    onSnap : (function(obj) {
                        obj.addClass('jxSplitBarDrag');
                        this.fireEvent('snap',[obj]);
                    }).bind(this),
                    onCancel: (function(obj){
                        mask.destroy();  
                        this.fireEvent('cancel',[obj]);
                    }).bind(this),
                    onDrag: (function(obj, event){
                        this.fireEvent('drag',[obj,event]);
                    }).bind(this),
                    onComplete : (function(obj) {
                        mask.destroy();
                        obj.removeClass('jxSplitBarDrag');
                        if (obj.retrieve('splitterObj') != this) {
                            return;
                        }
                        fn.apply(this,[obj]);
                        this.fireEvent('complete',[obj]);
                        this.fireEvent('finish',[obj]);
                    }).bind(this),
                    onBeforeStart: (function(obj) {
                        this.fireEvent('beforeStart',[obj]);
                        mask = new Element('div',{'class':'jxSplitterMask'}).inject(obj, 'after');
                    }).bind(this),
                    onStart: (function(obj, event) {
                        this.fireEvent('start',[obj, event]);
                    }).bind(this)
                });
            }, this);            
        }
    },
    
    /**
     * Method: dragHorizontal
     * In a horizontally split container, handle a bar being dragged left or
     * right by resizing the elements on either side of the bar.
     *
     * Parameters:
     * obj - {HTMLElement} the bar that was dragged
     */
    dragHorizontal: function(obj) {
        var leftEdge = parseInt(obj.style.left);
        var leftSide = obj.retrieve('leftSide');
        var rightSide = obj.retrieve('rightSide');
        var leftJxl = leftSide.retrieve('jxLayout');
        var rightJxl = rightSide.retrieve('jxLayout');
        
        var paddingLeft = this.domObj.measure(function(){
            var m = this.getSizes(['padding'], ['left']);
            return m.padding.left;
        });
        
        /* process right side first */
        var rsLeft, rsWidth, rsRight;
        
        var size = obj.retrieve('size');
        if (!size) {
            size = obj.getBorderBoxSize();
            obj.store('size',size);
        }
        rsLeft = leftEdge + size.width - paddingLeft;
        
        var parentSize = this.domObj.getContentBoxSize();
        
        if (rightJxl.options.width != null) {
            rsWidth = rightJxl.options.width + rightJxl.options.left - rsLeft;
            rsRight = parentSize.width - rsLeft - rsWidth;
        } else {
            rsWidth = parentSize.width - rightJxl.options.right - rsLeft;
            rsRight = rightJxl.options.right;
        }
        
        /* enforce constraints on right side */
        if (rsWidth < 0) {
            rsWidth = 0;
        }
        
        if (rsWidth < rightJxl.options.minWidth) {
            rsWidth = rightJxl.options.minWidth;
        }
        if (rightJxl.options.maxWidth >= 0 && rsWidth > rightJxl.options.maxWidth) {
            rsWidth = rightJxl.options.maxWidth;
        }
                
        rsLeft = parentSize.width - rsRight - rsWidth;
        leftEdge = rsLeft - size.width;
        
        /* process left side */
        var lsLeft, lsWidth;
        lsLeft = leftJxl.options.left;
        lsWidth = leftEdge - lsLeft;
        
        /* enforce constraints on left */
        if (lsWidth < 0) {
            lsWidth = 0;
        }
        if (lsWidth < leftJxl.options.minWidth) {
            lsWidth = leftJxl.options.minWidth;
        }
        if (leftJxl.options.maxWidth >= 0 && 
            lsWidth > leftJxl.options.maxWidth) {
            lsWidth = leftJxl.options.maxWidth;
        }
        
        /* update the leftEdge to accomodate constraints */
        if (lsLeft + lsWidth != leftEdge) {
            /* need to update right side, ignoring constraints because left side
               constraints take precedence (arbitrary decision)
             */
            leftEdge = lsLeft + lsWidth;
            var delta = leftEdge + size.width - rsLeft;
            rsLeft += delta;
            rsWidth -= delta; 
        }
        
        /* put bar in its final location based on constraints */
        obj.style.left = paddingLeft + leftEdge + 'px';
        
        /* update leftSide positions */
        if (leftJxl.options.width == null) {
            var parentSize = this.domObj.getContentBoxSize();
            leftSide.resize({right: parentSize.width - lsLeft-lsWidth});
        } else {
            leftSide.resize({width: lsWidth});
        }
        
        /* update rightSide position */
        if (rightJxl.options.width == null) {
            rightSide.resize({left:rsLeft});
        } else {
            rightSide.resize({left: rsLeft, width: rsWidth});
        }
    },
    
    /**
     * Method: dragVertical
     * In a vertically split container, handle a bar being dragged up or
     * down by resizing the elements on either side of the bar.
     *
     * Parameters:
     * obj - {HTMLElement} the bar that was dragged
     */
    dragVertical: function(obj) {
        /* top edge of the bar */
        var topEdge = parseInt(obj.style.top);
        
        /* the containers on either side of the bar */
        var topSide = obj.retrieve('leftSide');
        var bottomSide = obj.retrieve('rightSide');
        var topJxl = topSide.retrieve('jxLayout');
        var bottomJxl = bottomSide.retrieve('jxLayout');
        
        var paddingTop = this.domObj.measure(function(){
            var m = this.getSizes(['padding'], ['top']);
            return m.padding.top;
        });
        
        
        /* measure the bar and parent container for later use */
        var size = obj.retrieve('size');
        if (!size) {
            size = obj.getBorderBoxSize();
            obj.store('size', size);
        }
        var parentSize = this.domObj.getContentBoxSize();

        /* process top side first */
        var bsTop, bsHeight, bsBottom;
        
        /* top edge of bottom side is the top edge of bar plus the height of the bar */
        bsTop = topEdge + size.height - paddingTop;
        
        if (bottomJxl.options.height != null) {
            /* bottom side height is fixed */
            bsHeight = bottomJxl.options.height + bottomJxl.options.top - bsTop;
            bsBottom = parentSize.height - bsTop - bsHeight;
        } else {
            /* bottom side height is not fixed. */
            bsHeight = parentSize.height - bottomJxl.options.bottom - bsTop;
            bsBottom = bottomJxl.options.bottom;
        }
        
        /* enforce constraints on bottom side */
        if (bsHeight < 0) {
            bsHeight = 0;
        }
        
        if (bsHeight < bottomJxl.options.minHeight) {
            bsHeight = bottomJxl.options.minHeight;
        }
        
        if (bottomJxl.options.maxHeight >= 0 && bsHeight > bottomJxl.options.maxHeight) {
            bsHeight = bottomJxl.options.maxHeight;
        }
        
        /* recalculate the top of the bottom side in case it changed
           due to a constraint.  The bar may have moved also.
         */
        bsTop = parentSize.height - bsBottom - bsHeight;
        topEdge = bsTop - size.height;
                
        /* process left side */
        var tsTop, tsHeight;
        tsTop = topJxl.options.top;
        tsHeight = topEdge - tsTop;
                        
        /* enforce constraints on left */
        if (tsHeight < 0) {
            tsHeight = 0;
        }
        if (tsHeight < topJxl.options.minHeight) {
            tsHeight = topJxl.options.minHeight;
        }
        if (topJxl.options.maxHeight >= 0 && 
            tsHeight > topJxl.options.maxHeight) {
            tsHeight = topJxl.options.maxHeight;
        }
        
        /* update the topEdge to accomodate constraints */
        if (tsTop + tsHeight != topEdge) {
            /* need to update right side, ignoring constraints because left side
               constraints take precedence (arbitrary decision)
             */
            topEdge = tsTop + tsHeight;
            var delta = topEdge + size.height - bsTop;
            bsTop += delta;
            bsHeight -= delta; 
        }
        
        /* put bar in its final location based on constraints */
        obj.style.top = paddingTop + topEdge + 'px';
        
        /* update topSide positions */
        if (topJxl.options.height == null) {
            topSide.resize({bottom: parentSize.height - tsTop-tsHeight});
        } else {
            topSide.resize({height: tsHeight});
        }
        
        /* update bottomSide position */
        if (bottomJxl.options.height == null) {
            bottomSide.resize({top:bsTop});
        } else {
            bottomSide.resize({top: bsTop, height: bsHeight});
        }
    },
    
    /**
     * Method: sizeChanged
     * handle the size of the container being changed.
     */
    sizeChanged: function() {
        if (this.options.layout == 'horizontal') {
            this.horizontalResize();
        } else {
            this.verticalResize();
        }
    },
    
    /**
     * Method: horizontalResize
     * Resize a horizontally layed-out container
     */
    horizontalResize: function() {
        var availableSpace = this.domObj.getContentBoxSize().width;
        var overallWidth = availableSpace;

        for (var i=0; i<this.bars.length; i++) {
            var bar = this.bars[i];
            var size = bar.retrieve('size');
            if (!size || size.width == 0) {
                size = bar.getBorderBoxSize();
                bar.store('size',size);
            }
            availableSpace -= size.width;
        }

        var nVariable = 0;
        var jxo;
        for (var i=0; i<this.elements.length; i++) {
            var e = this.elements[i];
            jxo = e.retrieve('jxLayout').options;
            if (jxo.width != null) {
                availableSpace -= parseInt(jxo.width);
            } else {
                var w = 0;
                if (jxo.right != 0 || 
                    jxo.left != 0) {
                    w = e.getBorderBoxSize().width;
                }
                
                availableSpace -= w;
                nVariable++;
            }
        }

        if (nVariable == 0) { /* all fixed */
            /* stick all available space in the last one */
            availableSpace += jxo.width;
            jxo.width = null;
            nVariable = 1;
        }

        var amount = parseInt(availableSpace / nVariable);
        /* account for rounding errors */
        var remainder = availableSpace % nVariable;
        
        var leftPadding = this.domObj.measure(function(){
            var m = this.getSizes(['padding'], ['left']);
            return m.padding.left;
        });

        var currentPosition = 0;

        for (var i=0; i<this.elements.length; i++) {
             var e = this.elements[i];
             var jxl = e.retrieve('jxLayout');
             var jxo = jxl.options;
             if (jxo.width != null) {
                 jxl.resize({left: currentPosition});
                 currentPosition += jxo.width;
             } else {
                 var a = amount;
                 if (nVariable == 1) {
                     a += remainder;
                 }
                 nVariable--;
                 
                 var w = 0;
                 if (jxo.right != 0 || jxo.left != 0) {
                     w = e.getBorderBoxSize().width + a;
                 } else {
                     w = a;
                 }
                 
                 if (w < 0) {
                     if (nVariable > 0) {
                         amount = amount + w/nVariable;
                     }
                     w = 0;
                 }
                 if (w < jxo.minWidth) {
                     if (nVariable > 0) {
                         amount = amount + (w - jxo.minWidth)/nVariable;
                     }
                     w = jxo.minWidth;
                 }
                 if (jxo.maxWidth >= 0 && w > jxo.maxWidth) {
                     if (nVariable > 0) {
                         amount = amount + (w - jxo.maxWidth)/nVariable;
                     }
                     w = e.options.maxWidth;
                 }
                 
                 var r = overallWidth - currentPosition - w;
                 jxl.resize({left: currentPosition, right: r});
                 currentPosition += w;
             }
             var rightBar = e.retrieve('rightBar');
             if (rightBar) {
                 rightBar.setStyle('left', leftPadding + currentPosition);
                 currentPosition += rightBar.retrieve('size').width;
             }
         }
    },
    
    /**
     * Method: verticalResize
     * Resize a vertically layed out container.
     */
    verticalResize: function() { 
        var availableSpace = this.domObj.getContentBoxSize().height;
        var overallHeight = availableSpace;

        for (var i=0; i<this.bars.length; i++) {
            var bar = this.bars[i];
            var size = bar.retrieve('size');
            if (!size || size.height == 0) {
                size = bar.getBorderBoxSize();
                bar.store('size', size);
            }
            availableSpace -= size.height;
        }

        var nVariable = 0;
        
        var jxo;
        for (var i=0; i<this.elements.length; i++) {
            var e = this.elements[i];
            jxo = e.retrieve('jxLayout').options;
            if (jxo.height != null) {
                availableSpace -= parseInt(jxo.height);
            } else {
                var h = 0;
                if (jxo.bottom != 0 || jxo.top != 0) {
                    h = e.getBorderBoxSize().height;
                }
                
                availableSpace -= h;
                nVariable++;
            }
        }

        if (nVariable == 0) { /* all fixed */
            /* stick all available space in the last one */
            availableSpace += jxo.height;
            jxo.height = null;
            nVariable = 1;
        }

        var amount = parseInt(availableSpace / nVariable);
        /* account for rounding errors */
        var remainder = availableSpace % nVariable;

        var paddingTop = this.domObj.measure(function(){
            var m = this.getSizes(['padding'], ['top']);
            return m.padding.top;
        });
        
        var currentPosition = 0;

        for (var i=0; i<this.elements.length; i++) {
             var e = this.elements[i];
             var jxl = e.retrieve('jxLayout');
             var jxo = jxl.options;
             if (jxo.height != null) {
                 jxl.resize({top: currentPosition});
                 currentPosition += jxo.height;
             } else {
                 var a = amount;
                 if (nVariable == 1) {
                     a += remainder;
                 }
                 nVariable--;
                 
                 var h = 0;
                 if (jxo.bottom != 0 || jxo.top != 0) {
                     h = e.getBorderBoxSize().height + a;
                 } else {
                     h = a;
                 }
                 
                 if (h < 0) {
                     if (nVariable > 0) {
                         amount = amount + h/nVariable;
                     }
                     h = 0;
                 }
                 if (h < jxo.minHeight) {
                     if (nVariable > 0) {
                         amount = amount + (h - jxo.minHeight)/nVariable;
                     }
                     h = jxo.minHeight;
                 }
                 if (jxo.maxHeight >= 0 && h > jxo.maxHeight) {
                     if (nVariable > 0) {
                         amount = amount + (h - jxo.maxHeight)/nVariable;
                     }
                     h = jxo.maxHeight;
                 }
                 
                 var r = overallHeight - currentPosition - h;
                 jxl.resize({top: currentPosition, bottom: r});
                 currentPosition += h;
             }
             var rightBar = e.retrieve('rightBar');
             if (rightBar) {
                 rightBar.style.top = paddingTop + currentPosition + 'px';
                 currentPosition += rightBar.retrieve('size').height;
             }
         }
    }
});// $Id: panelset.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.PanelSet
 *
 * Extends: <Jx.Widget>
 *
 * A panel set manages a set of panels within a DOM element.  The PanelSet fills
 * its container by resizing the panels in the set to fill the width and then
 * distributing the height of the container across all the panels.  Panels
 * can be resized by dragging their respective title bars to make them taller
 * or shorter.  The maximize button on the panel title will cause all other
 * panels to be closed and the target panel to be expanded to fill the remaining
 * space.  In this respect, PanelSet works like a traditional Accordion control.
 *
 * When creating panels for use within a panel set, it is important to use the
 * proper options.  You must override the collapse option and set it to false
 * and add a maximize option set to true.  You must also not include options
 * for menu and close.
 *
 * Example:
 * (code)
 * var p1 = new Jx.Panel({collapse: false, maximize: true, content: 'content1'});
 * var p2 = new Jx.Panel({collapse: false, maximize: true, content: 'content2'});
 * var p3 = new Jx.Panel({collapse: false, maximize: true, content: 'content3'});
 * var panelSet = new Jx.PanelSet('panels', [p1,p2,p3]);
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.PanelSet = new Class({
    Family: 'Jx.PanelSet',
    Extends: Jx.Widget,
    
    options: {
        /* Option: parent
         * the object to add the panel set to
         */
        parent: null,
        /* Option: panels
         * an array of <Jx.Panel> objects that will be managed by the set.
         */
        panels: [],
        /* Option: barTooltip
         * the tooltip to place on the title bars of each panel
         */
        barTooltip: 'drag this bar to resize'
    },
    
    /**
     * Property: panels
     * {Array} the panels being managed by the set
     */
    panels: null,
    /**
     * Property: height
     * {Integer} the height of the container, cached for speed
     */
    height: null,
    /**
     * Property: firstLayout
     * {Boolean} true until the panel set has first been resized
     */
    firstLayout: true,
    /**
     * Constructor: Jx.PanelSet
     * Create a new instance of Jx.PanelSet.
     *
     * Parameters:
     * options - <Jx.PanelSet.Options>
     *
     * TODO: Jx.PanelSet.initialize
     * Remove the panels parameter in favour of an add method.
     */
    initialize: function(options) {
        if (options && options.panels) {
            this.panels = options.panels;
            options.panels = null;
        }
        this.setOptions(options);
        this.domObj = new Element('div');
        new Jx.Layout(this.domObj);
        
        //make a fake panel so we get the right number of splitters
        var d = new Element('div', {styles:{position:'absolute'}});
        new Jx.Layout(d, {minHeight:0,maxHeight:0,height:0});
        var elements = [d];
        this.panels.each(function(panel){
            elements.push(panel.domObj);
            panel.options.hideTitle = true;
            panel.contentContainer.resize({top:0});
            panel.toggleCollapse = this.maximizePanel.bind(this,panel);
            panel.domObj.store('Jx.Panel', panel);
            panel.manager = this;
        }, this);
        
        this.splitter = new Jx.Splitter(this.domObj, {
            splitInto: this.panels.length+1,
            layout: 'vertical',
            elements: elements,
            prepareBar: (function(i) {
                var bar = new Element('div', {
                    'class': 'jxPanelBar',
                    'title': this.options.barTooltip
                });
                
                var panel = this.panels[i];
                panel.title.setStyle('visibility', 'hidden');
                document.id(document.body).adopt(panel.title);
                var size = panel.title.getBorderBoxSize();
                bar.adopt(panel.title);
                panel.title.setStyle('visibility','');
                
                bar.setStyle('height', size.height);
                bar.store('size', size);
                
                return bar;
            }).bind(this)
        });
        this.addEvent('addTo', function() {
            document.id(this.domObj.parentNode).setStyle('overflow', 'hidden');
            this.domObj.resize();
        });
        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
    },
    
    /**
     * Method: maximizePanel
     * Maximize a panel, taking up all available space (taking into
     * consideration any minimum or maximum values)
     */
    maximizePanel: function(panel) {
        var domHeight = this.domObj.getContentBoxSize().height;
        var space = domHeight;
        var panelSize = panel.domObj.retrieve('jxLayout').options.maxHeight;
        var panelIndex;
        
        /* calculate how much space might be left after setting all the panels to
         * their minimum height (except the one we are resizing of course)
         */
        for (var i=1; i<this.splitter.elements.length; i++) {
            var p = this.splitter.elements[i];
            space -= p.retrieve('leftBar').getBorderBoxSize().height;
            if (p !== panel.domObj) {
                var thePanel = p.retrieve('Jx.Panel');
                var o = p.retrieve('jxLayout').options;
                space -= o.minHeight;
            } else {
                panelIndex = i;
            }
        }

        // calculate how much space the panel will take and what will be left over
        if (panelSize == -1 || panelSize >= space) {
            panelSize = space;
            space = 0;
        } else {
            space = space - panelSize;
        }
        var top = 0;
        for (var i=1; i<this.splitter.elements.length; i++) {
            var p = this.splitter.elements[i];
            top += p.retrieve('leftBar').getBorderBoxSize().height;
            if (p !== panel.domObj) {
                var thePanel = p.retrieve('Jx.Panel');
                var o = p.retrieve('jxLayout').options;
                var panelHeight = $chk(o.height) ? o.height : p.getBorderBoxSize().height;
                if (space > 0) {
                    if (space >= panelHeight) {
                        // this panel can stay open at its current height
                        space -= panelHeight;
                        p.resize({top: top, height: panelHeight});
                        top += panelHeight;
                    } else {
                        // this panel needs to shrink some
                        if (space > o.minHeight) {
                            // it can use all the space
                            p.resize({top: top, height: space});
                            top += space;
                            space = 0;
                        } else {
                            p.resize({top: top, height: o.minHeight});
                            top += o.minHeight;
                        }
                    }
                } else {
                    // no more space, just shrink away
                    p.resize({top:top, height: o.minHeight});
                    top += o.minHeight;
                }
                p.retrieve('rightBar').style.top = top + 'px';
            } else {
                break;
            }
        }
        
        /* now work from the bottom up */
        var bottom = domHeight;
        for (var i=this.splitter.elements.length - 1; i > 0; i--) {
            p = this.splitter.elements[i];
            if (p !== panel.domObj) {
                var o = p.retrieve('jxLayout').options;
                var panelHeight = $chk(o.height) ? o.height : p.getBorderBoxSize().height;
                if (space > 0) {
                    if (space >= panelHeight) {
                        // panel can stay open
                        bottom -= panelHeight;
                        space -= panelHeight;
                        p.resize({top: bottom, height: panelHeight});
                    } else {
                        if (space > o.minHeight) {
                            bottom -= space;
                            p.resize({top: bottom, height: space});
                            space = 0;
                        } else {
                            bottom -= o.minHeight;
                            p.resize({top: bottom, height: o.minHeight});
                        }
                    }
                } else {
                    bottom -= o.minHeight;
                    p.resize({top: bottom, height: o.minHeight, bottom: null});                    
                }
                bottom -= p.retrieve('leftBar').getBorderBoxSize().height;
                p.retrieve('leftBar').style.top = bottom + 'px';
                
            } else {
                break;
            }
        }
        panel.domObj.resize({top: top, height:panelSize, bottom: null});
    }
});// $Id: $
/**
 * Class: Jx.Column
 * 
 * Extends: <Jx.Object>
 * 
 * The class used for defining columns for grids.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Column = new Class({

    Extends: Jx.Object,

    options: {
        /**
         * Option: header
         * The text to be used as a header for this column
         */
        header: null,
        /**
         * Option: modelField
         * The field of the model that this column is keyed to
         */
        modelField: null,
        /**
         * Option: width
         * Determines the width of the column. Set to 'null' or 'auto'
         * to allow the column to autocalculate it's width based on its
         * contents
         */
        width: null,
        /**
         * Option: isEditable
         * allows/disallows editing of the column contents
         */
        isEditable: false,
        /**
         * Option: isSortable
         * allows/disallows sorting based on this column
         */
        isSortable: false,
        /**
         * Option: isResizable
         * allows/disallows resizing this column dynamically
         */
        isResizable: false,
        /**
         * Option: isHidden
         * determines if this column can be shown or not
         */
        isHidden: false,
        /**
         * Option: formatter
         * an instance of <Jx.Formatter> or one of its subclasses which 
         * will be used to format the data in this column. It can also be 
         * an object containing the name (This should be the part after 
         * Jx.Formatter in the class name. For instance, to get a currency 
         * formatter, specify 'Currency' as the name.) and options for the 
         * needed formatter (see individual formatters for options). 
         * (code)
         * {
         *    name: 'formatter name',
         *    options: {}
         * }
         * (end)
         */
        formatter: null,
        /**
         * Option: name
         * The name given to this column
         */
        name: '',
        /**
         * Option: dataType
         * The type of the data in this column, used for sorting. Can be 
         * alphanumeric, numeric, currency, boolean, or date
         */
        dataType: 'alphanumeric',
        /**
         * Option: templates
         * objects used to determine the type of tag and css class to 
         * assign to a header cell and a regular cell. The css class can 
         * also be a function that returns a string to assign as the css 
         * class. The function will be passed the text to be formatted.
         */
        templates: {
            header: {
                tag: 'span',
                cssClass: null
            },
            cell: {
                tag: 'span',
                cssClass: null
            }
        }
    
    },
    /**
     * Property: model
     * holds a reference to the model (an instance of <Jx.Store> or subclass)
     */
    model: null,
    /**
     * Constructor: Jx.Column
     * initializes the column object
     * 
     * Parameters:
     * options - <Jx.Column.Options> and <Jx.Object.Options>
     * grid - a reference to the grid this column is associated with. 
     *          Must be a <Jx.Grid> or subclass. 
     */
    initialize : function (options, grid) {
        this.parent(options);
        if ($defined(grid) && grid instanceof Jx.Grid) {
            this.grid = grid;
        }
        this.name = this.options.name;
        //we need to check the formatter
        if ($defined(this.options.formatter)
                && !(this.options.formatter instanceof Jx.Formatter)) {
            var t = Jx.type(this.options.formatter);
            if (t === 'object') {
                this.options.formatter = new Jx.Formatter[this.options.formatter.name](
                        this.options.formatter.options);
            }
        }
    },
    /**
     * APIMethod: getHeaderHTML
     * Returns the header text wrapped in the tag specified in 
     * options.templates.hedaer.tag
     */
    getHeaderHTML : function () {
        var text = this.options.header ? this.options.header
                : this.options.modelField;
        var ht = this.options.templates.header;
        var el = new Element(ht.tag, {
            'class' : 'jxGridCellContent',
            'html' : text
        });
        if ($defined(ht.cssClass)) {
            if (Jx.type(ht.cssClass) === 'function') {
                el.addClass(ht.cssClass.run(text));
            } else {
                el.addClass(ht.cssClass);
            }
        }
        this.header = el;
        return el;
    },
    
    setWidth: function(newWidth) {
        if (this.rule && parseInt(newWidth) >= 0) {
            this.width = parseInt(newWidth);
            this.rule.style.width = parseInt(newWidth) + "px";
        }
    },
    /**
     * APIMethod: getWidth
     * returns the width of the column. 
     * 
     * Parameters:
     * recalculate - {boolean} determines if the width should be recalculated 
     *          if the column is set to autocalculate. Has no effect if the width is 
     *          preset
     */
    getWidth : function (recalculate) {
        //check for null width or for "auto" setting and measure all contents in this column
        //in the entire model as well as the header (really only way to do it).
        if (!$defined(this.width) || recalculate) {
            if (this.options.width !== null
                    && this.options.width !== 'auto') {
                this.width = Jx.getNumber(this.options.width);
            } else {
                //calculate the width
                var model = this.grid.getModel();
                var oldPos = model.getPosition();
                var maxWidth = 0;
                model.first();
                while (model.valid()) {
                    //check size by placing text into a TD and measuring it.
                    //TODO: this should add .jxGridRowHead/.jxGridColHead if 
                    //      this is a header to get the correct measurement.
                    var text = model.get(this.name);
                    var klass = 'jxGridCell';
                    if (this.grid.row.useHeaders()
                            && this.options.modelField === this.grid.row
                            .getRowHeaderField()) {
                        klass = 'jxGridRowHead';
                    }
                    var s = this.measure(text, klass);
                    if (s.width > maxWidth) {
                        maxWidth = s.width;
                    }
                    if (model.hasNext()) {
                        model.next();
                    } else {
                        break;
                    }
                }
    
                //check the column header as well (unless this is the row header)
                if (!(this.grid.row.useHeaders() && this.options.modelField === this.grid.row
                        .getRowHeaderField())) {
                    klass = 'jxGridColHead';
                    if (this.isEditable()) {
                        klass += ' jxColEditable';
                    }
                    if (this.isResizable()) {
                        klass += ' jxColResizable';
                    }
                    if (this.isSortable()) {
                        klass += ' jxColSortable';
                    }
                    s = this.measure(this.options.header, klass);
                    if (s.width > maxWidth) {
                        maxWidth = s.width;
                    }
                }
                this.width = maxWidth;
                model.moveTo(oldPos);
            }
        }
        return this.width;
    },
    /**
     * Method: measure
     * This method does the dirty work of actually measuring a cell
     * 
     * Parameters:
     * text - the text to measure
     * klass - a string indicating and extra classes to add so that 
     *          css classes can be taken into account.
     */
    measure : function (text, klass) {
        if ($defined(this.options.formatter)
                && text !== this.options.header) {
            text = this.options.formatter.format(text);
        }
        var d = new Element('span', {
            'class' : klass
        });
        var el = new Element('span', {
            'html' : text
        }).inject(d);
        d.setStyle('height', this.grid.row.getHeight());
        d.setStyles({
            'visibility' : 'hidden',
            'width' : 'auto',
            'font-family' : 'Arial'
        });
        d.inject(document.body, 'bottom');
        var s = d.measure(function () {
            return this.getMarginBoxSize();
        });
        d.destroy();
        return s;
    },
    /**
     * APIMethod: isEditable
     * Returns whether this column can be edited
     */
    isEditable : function () {
        return this.options.isEditable;
    },
    /**
     * APIMethod: isSortable
     * Returns whether this column can be sorted
     */
    isSortable : function () {
        return this.options.isSortable;
    },
    /**
     * APIMethod: isResizable
     * Returns whether this column can be resized
     */
    isResizable : function () {
        return this.options.isResizable;
    },
    /**
     * APIMethod: isHidden
     * Returns whether this column is hidden
     */
    isHidden : function () {
        return this.options.isHidden;
    },
    /**
     * APIMethod: getHTML
     * returns the content of the current model row wrapped in the tag
     * specified by options.templates.cell.tag and with the appropriate classes
     * added
     */
    getHTML : function () {
        var text = this.grid.getModel().get(this.options.modelField);
        var ct = this.options.templates.cell;
        if ($defined(this.options.formatter)) {
            text = this.options.formatter.format(text);
        }
        var el = new Element(ct.tag, {
            'html' : text,
            'class' : 'jxGridCellContent',
            styles: {
                // width: this.getWidth()
            }
        });
        if ($defined(ct.cssClass)) {
            if (Jx.type(ct.cssClass) === 'function') {
                el.addClass(ct.cssClass.run(text));
            } else {
                el.addClass(ct.cssClass);
            }
        }
        return el;
    }

});// $Id: $
/**
 * Class: Jx.Columns
 *
 * Extends: <Jx.Object>
 *
 * This class is the container for all columns needed for a grid. It
 * consolidates many functions that didn't make sense to put directly
 * in the column class. Think of it as a model for columns.
 *
 * License:
 * Copyright (c) 2009, Jon Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Columns = new Class({

    Extends : Jx.Object,

    options : {
        /**
         * Option: headerRowHeight
         * the default height of the header row. Set to null or 'auto' to
         * have this class attempt to figure out a suitable height.
         */
        headerRowHeight : 20,
        /**
         * Option: useHeaders
         * Determines if the column headers should be displayed or not
         */
        useHeaders : false,
        /**
         * Option: columns
         * an array holding all of the column instances or objects containing
         * configuration info for the column
         */
        columns : []
    },
    /**
     * Property: columns
     * an array holding the actual instantiated column objects
     */
    columns : [],
    
    /**
     * Constructor: Jx.Columns
     * Creates the class.
     *
     * Parameters:
     * options - <Jx.Columns.Options> and <Jx.Object.Options>
     * grid - a reference to the <Jx.Grid> that this class is associated with
     */
    initialize : function (options, grid) {
        this.parent(options);

        if ($defined(grid) && grid instanceof Jx.Grid) {
            this.grid = grid;
        }

        this.options.columns.each(function (col) {
            //check the column to see if it's a Jx.Grid.Column or an object
                if (col instanceof Jx.Column) {
                    this.columns.push(col);
                } else if (Jx.type(col) === "object") {
                    this.columns.push(new Jx.Column(col, grid));
                }

            }, this);
    },
    /**
     * APIMethod: getHeaderHeight
     * returns the height of the column header row
     *
     * Parameters:
     * recalculate - determines if we should recalculate the height. Currently does nothing.
     */
    getHeaderHeight : function (recalculate) {
        if (!$defined(this.height) || recalculate) {
            if ($defined(this.options.headerRowHeight)
                    && this.options.headerRowHeight !== 'auto') {
                this.height = this.options.headerRowHeight;
            } else {
                //figure out a height.
            }
        }
        return this.height;
    },
    /**
     * APIMethod: useHeaders
     * returns whether the grid is/should display headers or not
     */
    useHeaders : function () {
        return this.options.useHeaders;
    },
    /**
     * APIMethod: getByName
     * Used to get a column object by the name of the column
     *
     * Parameters:
     * colName - the name of the column
     */
    getByName : function (colName) {
        var ret;
        this.columns.each(function (col) {
            if (col.name === colName) {
                ret = col;
            }
        }, this);
        return ret;
    },
    /**
     * APIMethod: getByField
     * Used to get a column by the model field it represents
     *
     *  Parameters:
     *  field - the field name to search by
     */
    getByField : function (field) {
        var ret;
        this.columns.each(function (col) {
            if (col.options.modelField === field) {
                ret = col;
            }
        }, this);
        return ret;
    },
    /**
     * APIMethod: getByGridIndex
     * Used to get a column when all you know is the cell index in the grid
     *
     * Parameters:
     * index - an integer denoting the placement of the column in the grid (zero-based)
     */
    getByGridIndex : function (index) {
        var headers = this.grid.colTableBody.getFirst().getChildren();
        var cell = headers[index];
        var hClasses = cell.get('class').split(' ').filter(function (cls) {
            return cls.test('jxColHead-');
        });
        var parts = hClasses[0].split('-');
        return this.getByName(parts[1]);
    },
    
    /**
     * APIMethod: getHeaders
     * Returns a row with the headers in it.
     *
     * Parameters:
     * row - the row to add the headers to.
     */
    getHeaders : function (row) {
        var r = this.grid.row.useHeaders();
        var hf = this.grid.row.getRowHeaderField();
        this.columns.each(function (col, idx) {
            if (r && hf === col.options.modelField) {
                //do nothing
            } else if (!col.isHidden()) {
                var th = new Element('td', {
                    'class' : 'jxGridColHead jxGridCol'+idx
                });
                th.adopt(col.getHeaderHTML());
                // th.setStyle('width', col.getWidth());
                th.addClass('jxColHead-' + col.options.modelField);
                //add other styles for different attributes
                if (col.isEditable()) {
                    th.addClass('jxColEditable');
                }
                if (col.isResizable()) {
                    th.addClass('jxColResizable');
                }
                if (col.isSortable()) {
                    th.addClass('jxColSortable');
                }
                // col.header = th;
                row.appendChild(th);
            }
        }, this);
        return row;
    },
    /**
     * APIMethod: getColumnCells
     * Appends the cells from each column for a specific row
     *
     * Parameters:
     * row - the row (tr) to add the cells to.
     */
    getColumnCells : function (row) {
        var r = this.grid.row;
        var f = r.getRowHeaderField();
        var h = r.useHeaders();
        this.columns.each(function (col, idx) {
            if (h && col.options.modelField !== f && !col.isHidden()) {
                row.appendChild(this.getColumnCell(col, idx));
            } else if (!h && !col.isHidden()) {
                row.appendChild(this.getColumnCell(col, idx));
            }
        }, this);
        return row;
    },
    /**
     * APIMethod: getColumnCell
     * Returns the cell (td) for a particular column.
     *
     * Paremeters:
     * col - the column to get a cell for.
     */
    getColumnCell : function (col, idx) {

        var td = new Element('td', {
            'class' : 'jxGridCell'
        });
        td.adopt(col.getHTML());
        td.addClass('jxCol-' + col.options.modelField);
        td.addClass('jxGridCol'+idx);
        // if (this.grid.model.getPosition() === 0) {
        //     var colWidth = col.getWidth();
        //     td.setStyle('width', colWidth);
        // }

        return td;
    },

    createRules: function(styleSheet, scope) {
        this.columns.each(function(col, idx) {
            var selector = scope+' .jxGridCol'+idx+', '+scope + " .jxGridCol" + idx + " .jxGridCellContent";
            col.rule = Jx.Styles.insertCssRule(selector, '', styleSheet);
            col.rule.style.width = col.getWidth() + "px";
        }, this);
    },

    /**
     * APIMethod: getColumnCOunt
     * returns the number of columns in this model (including hidden).
     */
    getColumnCount : function () {
        return this.columns.length;
    },
    /**
     * APIMethod: getIndexFromGrid
     * Gets the index of a column from its place in the grid.
     *
     * Parameters:
     * name - the name of the column to get an index for
     */
    getIndexFromGrid : function (name) {
        var headers = this.grid.colTableBody.getFirst().getChildren();
        var c;
        var i = -1;
        headers.each(function (h) {
            i++;
            var hClasses = h.get('class').split(' ').filter(function (cls) {
                return cls.test('jxColHead-'); 
            });
            hClasses.each(function (cls) {
                if (cls.test(name)) {
                    c = i;
                }
            });
        }, this);
        return c;
    }

});
// $Id: $
/**
 * Class: Jx.Row
 * 
 * Extends: <Jx.Object>
 * 
 * A class defining a grid row.
 * 
 * Inspired by code in the original Jx.Grid class
 * 
 * License: 
 * Original Copyright (c) 2008, DM Solutions Group Inc.
 * This version Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Row = new Class(
{

    Extends : Jx.Object,

    options : {
        /**
         * Option: useHeaders
         * defaults to false.  If set to true, then a column of row header
         * cells are displayed.
         */
        useHeaders : false,
        /**
         * Option: alternateRowColors
         * defaults to false.  If set to true, then alternating CSS classes
         * are used for rows.
         */
        alternateRowColors : false,
        /**
         * Option: rowClasses
         * object containing class names to apply to rows
         */
        rowClasses : {
            odd : 'jxGridRowOdd',
            even : 'jxGridRowEven',
            all : 'jxGridRowAll'
        },
        /**
         * Option: rowHeight
         * The height of the row. Make it null or 'auto' to auto-calculate
         */
        rowHeight : 20,
        /**
         * Option: headerWidth
         * The width of the row header. Make it null or 'auto' to auto-calculate
         */
        headerWidth : 20,
        /**
         * Option: headerField
         * The field in the model to use as the header
         */
        headerField : 'id',
        /**
         * Option: templates
         * objects used to determine the type of tag and css class to 
         * assign to a header cell. The css class can 
         * also be a function that returns a string to assign as the css 
         * class. The function will be passed the text to be formatted.
         */
        templates: {
            header: {
                tag: 'span',
                cssClass: null
            }
        }
        
    },
    /**
     * Property: grid
     * A reference to the grid that this row model belongs to
     */
    grid : null,
    /**
     * Constructor: Jx.Row
     * Creates the row model object.
     * 
     * Parameters:
     * options - <Jx.Row.Options> and <Jx.Object.Options>
     * grid - the <Jx.Grid> that this row model will belong to. 
     */
    initialize : function (options, grid) {
        this.parent(options);

        if ($defined(grid) && grid instanceof Jx.Grid) {
            this.grid = grid;
        }
    },
    /**
     * APIMethod: getGridRowElement
     * Used to create the TR for the main grid row
     */
    getGridRowElement : function () {

        var tr = new Element('tr');
        tr.setStyle('height', this.getHeight());
        if (this.options.alternateRowColors) {
            tr.className = (this.grid.getModel().getPosition() % 2) ? this.options.rowClasses.even
                    : this.options.rowClasses.odd;
        } else {
            tr.className = this.options.rowClasses.all;
        }
        return tr;
    },
    /**
     * Method: getRowHeaderCell
     * creates the TH for the row's header
     */
    getRowHeaderCell : function () {
        //get and set text for element
        var model = this.grid.getModel();
        var th = new Element('td', {
            'class' : 'jxGridRowHead'
        });
        
        var text = model.get(this.options.headerField);
        var ht = this.options.templates.header;
        var el = new Element(ht.tag, {
            'class' : 'jxGridCellContent',
            'html' : text
        }).inject(th);
        if ($defined(ht.cssClass)) {
            if (Jx.type(ht.cssClass) === 'function') {
                el.addClass(ht.cssClass.run(text));
            } else {
                el.addClass(ht.cssClass);
            }
        }
        
        return th;
        
    },
    /**
     * APIMethod: getRowHeaderWidth
     * determines the row header's width.
     */
    getRowHeaderWidth : function () {
        //this can be drawn from the column for the
        //header field
        var col = this.grid.columns.getByField(this.options.headerField);
        return col.getWidth();
    },
    
    /**
     * APIMethod: getHeight
     * determines and returns the height of a row
     */
    getHeight : function () {
        //this should eventually compute a height, however, we would need
        //a fixed width to do so reliably. For right now, we use a fixed height
        //for all rows.
        return this.options.rowHeight;
    },
    /**
     * APIMethod: useHeaders
     * determines and returns whether row headers should be used
     */
    useHeaders : function () {
        return this.options.useHeaders;
    },
    /**
     * APIMethod: getRowHeader
     * creates and returns the header for the current row
     */
    getRowHeader : function () {
        var rowHeight = this.getHeight();
        var tr = new Element('tr', {
            styles : {
                height : rowHeight
            }
        });
        var th = this.getRowHeaderCell();
        if (this.grid.model.getPosition() === 0) {
            var rowWidth = this.getRowHeaderWidth();
            th.setStyle("width", rowWidth);
        }
        tr.appendChild(th);
        return tr;
    },
    /**
     * APIMethod: getRowHeaderField
     * returns the name of the model field that is used for the header
     */
    getRowHeaderField : function () {
        return this.options.headerField;
    }
});
// $Id: $
/**
 * Class: Jx.Grid.Plugin
 * 
 * Extend: <Jx.Object>
 * 
 * Base class for all plugins. In order for a plugin to be used it must 
 * extend from this class.
 * 
 * License:
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Plugin = new Class({
    
    Extends: Jx.Object,
    
    Family: "Jx.Plugin",
    
    options: {},
    /**
     * Constructor: Jx.Plugin
     * Initializes the plugin.
     * 
     * Parameters:
     * options - <Jx.Plugin.Options> and <Jx.Object.Options>
     */
    initialize: function (options) {
        this.parent(options);
    },
    /**
     * APIMethod: attach
     * Empty method that must be overridden by subclasses. It is 
     * called by the user of the plugin to setup the plugin for use.
     */
    attach: $empty,
    
    /**
     * APIMethod: detach
     * Empty method that must be overridden by subclasses. It is 
     * called by the user of the plugin to remove the plugin.
     */
    detach: $empty
    
});// $Id: $
/**
 * Class: Jx.Plugin.Grid
 * Grid plugin namespace
 * 
 * 
 * License: 
 * This version Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Grid = {};// $Id: grid.js 503 2009-07-31 23:55:59Z jonlb@comcast.net $
/**
 * Class: Jx.Grid
 * 
 * Extends: <Jx.Widget>
 *
 * A tabular control that has fixed, optional, scrolling headers on the rows and
 * columns like a spreadsheet.
 *
 * Jx.Grid is a tabular control with convenient controls for resizing columns,
 * sorting, and inline editing.  It is created inside another element, typically
 * a div.  If the div is resizable (for instance it fills the page or there is a
 * user control allowing it to be resized), you must call the resize() method
 * of the grid to let it know that its container has been resized.
 *
 * When creating a new Jx.Grid, you can specify a number of options for the grid
 * that control its appearance and functionality. You can also specify plugins
 * to load for additional functionality. Currently Jx provides the following
 * plugins 
 * 
 * Prelighter - prelights rows, columns, and cells 
 * Selector - selects rows, columns, and cells
 * Sorter - sorts rows by specific column
 *
 * Jx.Grid renders data that comes from an external source.  This external 
 * source, called the model, must be a Jx.Store or extended from it (such as 
 * Jx.Store.Remote).
 *
 *
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * This version Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Grid = new Class({

    Family : 'Jx.Grid',
    Extends : Jx.Widget,

    options : {
        /**
         * Option: parent
         * the HTML element to create the grid inside. The grid will resize
         * to fill the domObj.
         */
        parent : null,

        /**
         * Options: columns
         * an object consisting of a columns array that defines the individuals
         * columns as well as containing any options for Jx.Grid.Columns or 
         * a Jx.Grid.Columns object itself.
         */
        columns : {
            columns : []
        },

        /**
         * Option: row
         * Either a Jx.Grid.Row object or a json object defining options for
         * the class
         */
        row : null,

        /**
         * Option: plugins
         * an array containing Jx.Grid.Plugin subclasses or an object 
         * that indicates the name of a predefined plugin and its options.
         */
        plugins : [],

        /**
         * Option: model
         * An instance of Jx.Store or one of its descendants
         */
        model : null

    },
    /**
     * Property: model
     * holds a reference to the <Jx.Store> that is the model for this
     * grid
     */
    model : null,
    /**
     * Property: columns
     * holds a reference to the columns object
     */
    columns : null,
    /**
     * Property: row
     * Holds a reference to the row object
     */
    row : null,
    /**
     * Property: plugins
     * A hash containing all of the plugins setup for this grid 
     * keyed by plugin name
     */
    plugins : new Hash(),
    /**
     * Property: currentCell
     * holds an object indicating the current cell that the mouse is over
     */
    currentCell : null,
    
    /**
     * Property: styleSheet
     * the name of the dynamic style sheet to use for manipulating styles
     */
    styleSheet: 'JxGridStyles',

    /**
     * Constructor: Jx.Grid
     * 
     * Parameters: 
     * options - <Jx.Grid.Options> and <Jx.Widget.Options>
     */
    initialize : function (options) {
        this.parent(options);
        
        //NOTE: I suggest using the base Widget class's .generateId()
        //this.uniqueId = this.generateId('jxGrid_');
        this.uniqueId = 'jxGrid_'+(new Date()).getTime();

        if ($defined(this.options.model)
                && this.options.model instanceof Jx.Store) {
            this.model = this.options.model;
            this.model.addEvent('columnChanged', this.modelChanged
                    .bind(this));
            this.model.addEvent('sortFinished', this.render.bind(this));
        }

        if ($defined(this.options.columns)) {
            if (this.options.columns instanceof Jx.Columns) {
                this.columns = this.options.columns;
            } else if (Jx.type(this.options.columns) === 'object') {
                this.columns = new Jx.Columns(this.options.columns,
                        this);
            }
        }

        //check for row
        if ($defined(this.options.row)) {
            if (this.options.row instanceof Jx.Row) {
                this.row = this.options.row;
            } else if (Jx.type(this.options.row) === "object") {
                this.row = new Jx.Row(this.options.row, this);
            }
        } else {
            this.row = new Jx.Row({}, this);
        }

        //initialize the grid
        this.domObj = new Element('div', {'class':this.uniqueId});
        var l = new Jx.Layout(this.domObj, {
            onSizeChange : this.resize.bind(this)
        });

        if (this.options.parent) {
            this.addTo(this.options.parent);
        }

        //top left corner
        this.rowColObj = new Element('div', {
            'class' : 'jxGridContainer'
        });

        //holds the column headers
        this.colObj = new Element('div', {
            'class' : 'jxGridContainer'
        });
        this.colTable = new Element('table', {
            'class' : 'jxGridTable jxGridHeader'
        });
        this.colTableBody = new Element('tbody');
        this.colTable.appendChild(this.colTableBody);
        this.colObj.appendChild(this.colTable);

        //hold the row headers
        this.rowObj = new Element('div', {
            'class' : 'jxGridContainer jxGridHeader'
        });
        this.rowTable = new Element('table', {
            'class' : 'jxGridTable'
        });
        this.rowTableHead = new Element('thead');
        this.rowTable.appendChild(this.rowTableHead);
        this.rowObj.appendChild(this.rowTable);

        //The actual body of the grid
        this.gridObj = new Element('div', {
            'class' : 'jxGridContainer',
            styles : {
                overflow : 'auto'
            }
        });
        this.gridTable = new Element('table', {
            'class' : 'jxGridTable'
        });
        this.gridTableBody = new Element('tbody');
        this.gridTable.appendChild(this.gridTableBody);
        this.gridObj.appendChild(this.gridTable);

        this.domObj.appendChild(this.rowColObj);
        this.domObj.appendChild(this.rowObj);
        this.domObj.appendChild(this.colObj);
        this.domObj.appendChild(this.gridObj);

        this.gridObj.addEvent('scroll', this.onScroll.bind(this));
        this.gridObj.addEvent('click', this.onGridClick
                .bindWithEvent(this));
        this.rowObj.addEvent('click', this.onGridClick
                .bindWithEvent(this));
        this.colObj.addEvent('click', this.onGridClick
                .bindWithEvent(this));
        this.gridObj.addEvent('mousemove', this.onMouseMove
                .bindWithEvent(this));
        this.rowObj.addEvent('mousemove', this.onMouseMove
                .bindWithEvent(this));
        this.colObj.addEvent('mousemove', this.onMouseMove
                .bindWithEvent(this));

        //initialize the plugins
        if ($defined(this.options.plugins)
                && Jx.type(this.options.plugins) === 'array') {
            this.options.plugins.each(function (plugin) {
                if (plugin instanceof Jx.Plugin) {
                    plugin.attach(this);
                    this.plugins.set(plugin.name, plugin);
                } else if (Jx.type(plugin) === 'object') {
                    //All grid plugins should be in Jx.Plugin.Grid namespace
                    var p = new Jx.Plugin.Grid[plugin.name](plugin.options);
                    p.attach(this);
                    this.plugins.set(p.name, p);
                }
            }, this);
        }
    },

    /**
     * Method: onScroll
     * handle the grid scrolling by updating the position of the headers
     */
    onScroll : function () {
        this.colObj.scrollLeft = this.gridObj.scrollLeft;
        this.rowObj.scrollTop = this.gridObj.scrollTop;
    },

    /**
     * Method: onMouseMove
     * Handle the mouse moving over the grid. This determines
     * what column and row it's over and fires the gridMove event 
     * with that information for plugins to respond to.
     *
     * Parameters:
     * e - {Event} the browser event object
     */
    onMouseMove : function (e) {
        var rc = this.getRowColumnFromEvent(e);
        if (!$defined(this.currentCell)
                || (this.currentCell.row !== rc.row || this.currentCell.column !== rc.column)) {
            this.currentCell = rc;
            this.fireEvent('gridMove', rc);
        }

    },
    /**
     * Method: onGridClick
     * handle the user clicking on the grid. Fires gridClick
     * event for plugins to respond to.
     *
     * Parameters:
     * e - {Event} the browser event object
     */
    onGridClick : function (e) {
        var rc = this.getRowColumnFromEvent(e);
        this.fireEvent('gridClick', rc);
    },

    /**
     * Method: getRowColumnFromEvent
     * retrieve the row and column indexes from an event click.
     * This function is used by the grid, row header and column
     * header to safely get these numbers.
     *
     * If the event isn't valid (i.e. it wasn't on a TD or TH) then
     * the returned values will be -1, -1
     *
     * Parameters:
     * e - {Event} the browser event object
     *
     * @return Object an object with two properties, row and column,
     *         that contain the row and column that was clicked
     */
    getRowColumnFromEvent : function (e) {
        var td = e.target;
        if (td.tagName === 'SPAN') {
            td = document.id(td).getParent();
        }
        if (td.tagName !== 'TD' && td.tagName !== 'TH') {
            return {
                row : -1,
                column : -1
            };
        }

        var colheader = false;
        var rowheader = false;
        //check if this is a header (row or column)
        if (td.descendantOf(this.colTable)) {
            colheader = true;
        }
    
        if (td.descendantOf(this.rowTable)) {
            rowheader = true;
        }
    
        var tr = td.parentNode;
        var col = td.cellIndex;
        var row = tr.rowIndex;
        /*
         * if this is not a header cell, then increment the row and col. We do this
         * based on whether the header is shown. This way the row/col remains consistent
         * to the grid but also takes into account the headers. It also allows
         * us to refrain from having to fire a separate event for headers.
         * 
         *  Plugins/event listeners should always take into account whether headers
         *  are displayed or not.
         */
        if (this.row.useHeaders() && !rowheader) {
            col++;
        }
        if (this.columns.useHeaders() && !colheader) {
            row++;
        }
    
        if (Browser.Engine.webkit) {
            /* bug in safari (webkit) returns 0 for cellIndex - only choice seems
             * to be to loop through the row
             */
            for (var i = 0; i < tr.childNodes.length; i++) {
                if (tr.childNodes[i] === td) {
                    col = i;
                    break;
                }
            }
        }
        return {
            row : row,
            column : col
        };
    },
    
    /**
     * APIMethod: resize
     * resize the grid to fit inside its container.  This involves knowing something
     * about the model it is displaying (the height of the column header and the
     * width of the row header) so nothing happens if no model is set
     */
    resize : function () {
        if (!this.model) {
            return;
        }

        var colHeight = this.columns.useHeaders() ? this.columns
                .getHeaderHeight() : 1;
        var rowWidth = this.row.useHeaders() ? this.row
                .getRowHeaderWidth() : 1;

        var size = this.domObj.getContentBoxSize();

        //sum all of the column widths except the hidden columns and the header column
        var w = size.width - rowWidth - 1;
        var totalCols = 0;
        this.columns.columns.each(function (col) {
            if (col.options.modelField !== this.row.getRowHeaderField()
                    && !col.isHidden()) {
                totalCols += col.getWidth();
            }
        }, this);

        //TODO: if totalCol width is less than the gridwidth (w) what do we do?

        /* -1 because of the right/bottom borders */
        this.rowColObj.setStyles({
            width : rowWidth - 1,
            height : colHeight - 1
        });
        this.rowObj.setStyles({
            top : colHeight,
            left : 0,
            width : rowWidth - 1,
            height : size.height - colHeight - 1
        });

        this.colObj.setStyles({
            top : 0,
            left : rowWidth,
            width : size.width - rowWidth - 1,
            height : colHeight - 1
        });

        this.gridObj.setStyles({
            top : colHeight,
            left : rowWidth,
            width : size.width - rowWidth - 1,
            height : size.height - colHeight - 1
        });

    },

    /**
     * APIMethod: setModel
     * set the model for the grid to display.  If a model is attached to the grid
     * it is removed and the new model is displayed. However, It needs to have 
     * the same columns
     * 
     * Parameters:
     * model - {Object} the model to use for this grid
     */
    setModel : function (model) {
        this.model = model;
        if (this.model) {
            this.render();
            this.domObj.resize();
        } else {
            this.destroyGrid();
        }
    },

    /**
     * APIMethod: getModel
     * gets the model set for this grid.
     */
    getModel : function () {
        return this.model;
    },

    /**
     * APIMethod: destroyGrid
     * destroy the contents of the grid safely
     */
    destroyGrid : function () {

        var n = this.colTableBody.cloneNode(false);
        this.colTable.replaceChild(n, this.colTableBody);
        this.colTableBody = n;

        n = this.rowTableHead.cloneNode(false);
        this.rowTable.replaceChild(n, this.rowTableHead);
        this.rowTableHead = n;

        n = this.gridTableBody.cloneNode(false);
        this.gridTable.replaceChild(n, this.gridTableBody);
        this.gridTableBody = n;

    },

    /**
     * APIMethod: render
     * Create the grid for the current model
     */
    render : function () {
        this.destroyGrid();

        this.fireEvent('beginCreateGrid', this);

        if (this.model) {
            var model = this.model;
            var nColumns = this.columns.getColumnCount();
            var nRows = model.count();
            var th;
            
            /* create header if necessary */
            if (this.columns.useHeaders()) {
                this.colTableBody.setStyle('visibility', 'visible');
                var colHeight = this.columns.getHeaderHeight();
                var trBody = new Element('tr', {
                    styles : {
                        height : colHeight
                    }
                });
                this.colTableBody.appendChild(trBody);

                this.columns.getHeaders(trBody);

                /* one extra column at the end for filler */
                th = new Element('td', {
                    'class':'jxGridColHead'
                }).inject(trBody);
                new Element('span',{
                    'class': 'jxGridCellContent',
                    styles : {
                        width : 1000,
                        height : colHeight - 1
                    }
                }).inject(th);

            } else {
                //hide the headers
                this.colTableBody.setStyle('visibility', 'hidden');
            }
            
            if (this.row.useHeaders()) {
                this.rowTableHead.setStyle('visibility', 'visible');
                
                var tr;
                //loop through all rows and add header
                this.model.first();
                while (this.model.valid()) {
                    tr = this.row.getRowHeader();
                    this.rowTableHead.appendChild(tr);
                    if (this.model.hasNext()) {
                        this.model.next();
                    } else {
                        break;
                    }
                }
                /* one extra row at the end for filler */
                tr = new Element('tr').inject(this.rowTableHead);
                th = new Element('td', {
                    'class' : 'jxGridRowHead',
                    styles : {
                        width : this.row.getRowHeaderWidth(),
                        height : 1000
                    }
                }).inject(tr);
            } else {
                //hide row headers
                this.rowTableHead.setStyle('visibility', 'hidden');
            }
            
            colHeight = this.columns.getHeaderHeight();
            
            //This section actually adds the rows
            this.model.first();
            while (this.model.valid()) {
                tr = this.row.getGridRowElement();
                this.gridTableBody.appendChild(tr);
        
                //Actually add the columns 
                this.columns.getColumnCells(tr);
        
                if (this.model.hasNext()) {
                    this.model.next();
                } else {
                    break;
                }
        
            }
            
            Jx.Styles.enableStyleSheet(this.styleSheet);
            this.columns.createRules(this.styleSheet, "."+this.uniqueId);
        }
        this.domObj.resize();
        this.fireEvent('doneCreateGrid', this);
    },
    
    /**
     * Method: modelChanged
     * Event listener that is fired when the model changes in some way
     */
    modelChanged : function (row, col) {
        //grab new TD
        var column = this.columns.getIndexFromGrid(col.name);
        var td = document.id(this.gridObj.childNodes[0].childNodes[0].childNodes[row].childNodes[column]);

        var currentRow = this.model.getPosition();
        this.model.moveTo(row);

        var newTD = this.columns.getColumnCell(this.columns.getByName(col.name));
        newTD.replaces(td);

        this.model.moveTo(currentRow);    
    }

});
// $Id: $
/**
 * Class: Jx.Plugin.Selector
 * 
 * Extends: <Jx.Plugin>
 * 
 * Grid plugin to select rows, columns, and/or cells.
 * 
 * Original selection code from Jx.Grid's original class
 * 
 * License: 
 * Original Copyright (c) 2008, DM Solutions Group Inc.
 * This version Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Grid.Selector = new Class({

    Extends : Jx.Plugin,

    options : {
        /**
         * Option: cell
         * determines if cells are selectable
         */
        cell : false,
        /**
         * Option: row
         * determines if rows are selectable
         */
        row : false,
        /**
         * Option: column
         * determines if columns are selectable
         */
        column : false
    },
    /**
     * Property: bound
     * storage for bound methods useful for working with events
     */
    bound: {},
    /**
     * APIMethod: initialize
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    initialize: function(options) {
        this.parent(options);
        this.bound.select = this.select.bind(this);
    },
    /**
     * APIMethod: attach
     * Sets up the plugin and attaches the plugin to the grid events it 
     * will be monitoring
     */
    attach: function (grid) {
        if (!$defined(grid) && !(grid instanceof Jx.Grid)) {
            return;
        }
        this.grid = grid;
        this.grid.addEvent('gridClick', this.bound.select);
    },
    /**
     * APIMethod: detach
     */
    detach: function() {
        if (this.grid) {
            this.grid.removeEvent('gridClick', this.bound.select);
        }
        this.grid = null;
    },
    /**
     * Method: select
     * dispatches the grid click to the various selection methods
     */
    select : function (rc) {
        if ($defined(rc) && rc.column !== -1 && rc.row !== -1) {
            var row = rc.row;
            if (this.grid.columns.useHeaders()) {
                row--;
            }
            var column = rc.column;
            if (this.grid.row.useHeaders()) {
                column--;
            }
            if (this.options.cell) {
                this.selectCell(row, column);
            }
            if (this.options.row) {
                this.selectRow(row);
            }
            if (this.options.column) {
                this.selectColumn(column);
            }
        }
    },
    /** 
     * Method: selectCell
     * Select a cell and apply the jxGridCellSelected style to it.
     * This deselects a previously selected cell.
     *
     * If the model supports cell selection, it should implement
     * a cellSelected function to receive notification of the selection.
     *
     * Parameters:
     * row - {Integer} the row of the cell to select
     * col - {Integer} the column of the cell to select
     */
    selectCell : function (row, col) {
        var td = (row >= 0 && col >= 0
                && row < this.grid.gridTableBody.rows.length && col < this.grid.gridTableBody.rows[row].cells.length) ? this.grid.gridTableBody.rows[row].cells[col]
                : null;
        if (!td) {
            return;
        }

        if (this.selectedCell) {
            this.selectedCell.removeClass('jxGridCellSelected');
        }
        this.selectedCell = td;
        this.selectedCell.addClass('jxGridCellSelected');
    },
    /** 
     * Method: selectRow
     * Select a row and apply the jxGridRowSelected style to it.
     *
     * Parameters:
     * row - {Integer} the row to select
     */
    selectRow : function (row) {
        var tr = (row >= 0 && row < this.grid.gridTableBody.rows.length) ? this.grid.gridTableBody.rows[row]
                : null;
        if (this.selectedRow !== tr) {
            if (this.selectedRow) {
                this.selectedRow.removeClass('jxGridRowSelected');
            }
            this.selectedRow = tr;
            this.selectedRow.addClass('jxGridRowSelected');
            this.selectRowHeader(row);
        }
    },
    /** 
     * Method: selectRowHeader
     * Apply the jxGridRowHea}derSelected style to the row header cell of a
     * selected row.
     *
     * Parameters:
     * row - {Integer} the row header to select
     */
    selectRowHeader : function (row) {
        if (!this.grid.row.useHeaders()) {
            return;
        }
        var cell = (row >= 0 && row < this.grid.rowTableHead.rows.length) ? this.grid.rowTableHead.rows[row].cells[0]
                : null;
        if (!cell) {
            return;
        }
        if (this.selectedRowHead !== cell) {
            if (this.selectedRowHead) {
                this.selectedRowHead
                        .removeClass('jxGridRowHeaderSelected');
            }
            this.selectedRowHead = cell;
            cell.addClass('jxGridRowHeaderSelected');
        }
    },
    /** 
     * Method: selectColumn
     * Select a column.
     * This deselects a previously selected column.
     *
     * Parameters:
     * col - {Integer} the column to select
     */
    selectColumn : function (col) {
        if (col >= 0 && col < this.grid.gridTable.rows[0].cells.length) {
            if (col !== this.selectedCol) {
                if ($defined(this.selectedCol)) {
                    for (var i = 0; i < this.grid.gridTable.rows.length; i++) {
                        this.grid.gridTable.rows[i].cells[this.selectedCol]
                                .removeClass('jxGridColumnSelected');
                    }
                }
                this.selectedCol = col;
                for (i = 0; i < this.grid.gridTable.rows.length; i++) {
                    this.grid.gridTable.rows[i].cells[col]
                            .addClass('jxGridColumnSelected');
                }
                this.selectColumnHeader(col);
            }
        }
    },
    /** 
     * method: selectColumnHeader
     * Apply the jxGridColumnHeaderSelected style to the column header cell of a
     * selected column.
     *
     * Parameters:
     * col - {Integer} the column header to select
     */
    selectColumnHeader : function (col) {
        if (this.grid.colTableBody.rows.length === 0
                || !this.grid.row.useHeaders()) {
            return;
        }

        var cell = (col >= 0 && col < this.grid.colTableBody.rows[0].cells.length) ? this.grid.colTableBody.rows[0].cells[col]
                : null;
        if (cell === null) {
            return;
        }

        if (this.selectedColHead !== cell) {
            if (this.selectedColHead) {
                this.selectedColHead
                        .removeClass('jxGridColumnHeaderSelected');
            }
            this.selectedColHead = cell;
            cell.addClass('jxGridColumnHeaderSelected');
        }
    }
});
// $Id: $
/**
 * Class: Jx.Plugin.Prelighter
 * 
 * Extends: <Jx.Plugin>
 * 
 * Grid plugin to prelight rows, columns, and cells
 * 
 * Inspired by the original code in Jx.Grid
 * 
 * License: 
 * Original Copyright (c) 2008, DM Solutions Group Inc.
 * This version Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Grid.Prelighter = new Class({

    Extends : Jx.Plugin,

    options : {
        /**
         * Option: cell
         * defaults to false.  If set to true, the cell under the mouse is
         * highlighted as the mouse moves.
         */
        cell : false,
        /**
         * Option: row
         * defaults to false.  If set to true, the row under the mouse is
         * highlighted as the mouse moves.
         */
        row : false,
        /**
         * Option: column
         * defaults to false.  If set to true, the column under the mouse is
         * highlighted as the mouse moves.
         */
        column : false,
        /**
         * Option: rowHeader
         * defaults to false.  If set to true, the row header of the row under
         * the mouse is highlighted as the mouse moves.
         */
        rowHeader : false,
        /**
         * Option: columnHeader
         * defaults to false.  If set to true, the column header of the column
         * under the mouse is highlighted as the mouse moves.
         */
        columnHeader : false
    },
    /**
     * Property: bound
     * storage for bound methods useful for working with events
     */
    bound: {},
    /**
     * APIMethod: initialize
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    initialize: function(options) {
        this.parent(options);
        this.bound.prelight = this.prelight.bind(this);
    },
    /**
     * APIMethod: attach
     * Sets up the plugin and connects it to the grid
     */
    attach: function (grid) {
        if (!$defined(grid) && !(grid instanceof Jx.Grid)) {
            return;
        }
        this.grid = grid;
        this.grid.addEvent('gridMove', this.bound.prelight);
    },
    /**
     * APIMethod: detach
     */
    detach: function() {
        if (this.grid) {
            this.grid.removeEvent('gridMove', this.bound.prelight);
        }
        this.grid = null;
    },
    /**
     * Method: prelight
     * dispatches the event to the various prelight methods.
     */
    prelight : function (rc) {
        if ($defined(rc) && rc.column !== -1 && rc.row !== -1) {

            var row = rc.row;
            if (this.grid.columns.useHeaders()) {
                row--;
            }
            var column = rc.column;
            if (this.grid.row.useHeaders()) {
                column--;
            }

            if (this.options.cell) {
                this.prelightCell(row, column);
            }
            if (this.options.row) {
                this.prelightRow(row);
            }
            if (this.options.column) {
                this.prelightColumn(column);
            }
            if (this.options.rowHeader) {
                this.prelightRowHeader(row);
            }
            if (this.options.columnHeader) {
                this.prelightColumnHeader(column);
            }
        }
    },
    /** 
     * Method: prelightRowHeader
     * apply the jxGridRowHeaderPrelight style to the header cell of a row.
     * This removes the style from the previously pre-lit row header.
     * 
     * Parameters:
     * row - {Integer} the row to pre-light the header cell of
     */
    prelightRowHeader : function (row) {
        var cell = (row >= 0 && row < this.grid.rowTableHead.rows.length) ? this.grid.rowTableHead.rows[row].cells[0]
                : null;
        if (this.prelitRowHeader !== cell) {
            if (this.prelitRowHeader) {
                this.prelitRowHeader
                        .removeClass('jxGridRowHeaderPrelight');
            }
            this.prelitRowHeader = cell;
            if (this.prelitRowHeader) {
                this.prelitRowHeader
                        .addClass('jxGridRowHeaderPrelight');
            }
        }
    },
    /** 
     * Method: prelightColumnHeader
     * apply the jxGridColumnHeaderPrelight style to the header cell of a column.
     * This removes the style from the previously pre-lit column header.
     * 
     * Parameters:
     * col - {Integer} the column to pre-light the header cell of
     */
    prelightColumnHeader : function (col) {
        if (this.grid.colTableBody.rows.length === 0) {
            return;
        }

        var cell = (col >= 0 && col < this.grid.colTableBody.rows[0].cells.length) ? this.grid.colTableBody.rows[0].cells[col]
                : null;
        if (this.prelitColumnHeader !== cell) {
            if (this.prelitColumnHeader) {
                this.prelitColumnHeader
                        .removeClass('jxGridColumnHeaderPrelight');
            }
            this.prelitColumnHeader = cell;
            if (this.prelitColumnHeader) {
                this.prelitColumnHeader
                        .addClass('jxGridColumnHeaderPrelight');
            }
        }
    },
    /** 
     * Method: prelightRow
     * apply the jxGridRowPrelight style to row.
     * This removes the style from the previously pre-lit row.
     * 
     * Parameters:
     * row - {Integer} the row to pre-light
     */
    prelightRow : function (row) {
        var tr = (row >= 0 && row < this.grid.gridTableBody.rows.length) ? this.grid.gridTableBody.rows[row]
                : null;

        if (this.prelitRow !== row) {
            if (this.prelitRow) {
                this.prelitRow.removeClass('jxGridRowPrelight');
            }
            this.prelitRow = tr;
            if (this.prelitRow) {
                this.prelightRowHeader(row);
                this.prelitRow.addClass('jxGridRowPrelight');
            }
        }
    },
    /** 
     * Method: prelightColumn
     * apply the jxGridColumnPrelight style to a column.
     * This removes the style from the previously pre-lit column.
     * 
     * Parameters:
     * col - {Integer} the column to pre-light
     */
    prelightColumn : function (col) {
        if (col >= 0 && col < this.grid.gridTable.rows[0].cells.length) {
            if ($chk(this.prelitColumn)) {
                for (var i = 0; i < this.grid.gridTable.rows.length; i++) {
                    this.grid.gridTable.rows[i].cells[this.prelitColumn]
                            .removeClass('jxGridColumnPrelight');
                }
            }
            this.prelitColumn = col;
            for (i = 0; i < this.grid.gridTable.rows.length; i++) {
                this.grid.gridTable.rows[i].cells[col]
                        .addClass('jxGridColumnPrelight');
            }
            this.prelightColumnHeader(col);
        }
    },
    /** 
     * Method: prelightCell
     * apply the jxGridCellPrelight style to a cell.
     * This removes the style from the previously pre-lit cell.
     *
     * Parameters:
     * row - {Integer} the row of the cell to pre-light
     * col - {Integer} the column of the cell to pre-light
     */
    prelightCell : function (row, col) {
        var td = (row >= 0 && col >= 0
                && row < this.grid.gridTableBody.rows.length && col < this.grid.gridTableBody.rows[row].cells.length) ? this.grid.gridTableBody.rows[row].cells[col]
                : null;
        if (this.prelitCell !== td) {
            if (this.prelitCell) {
                this.prelitCell.removeClass('jxGridCellPrelight');
            }
            this.prelitCell = td;
            if (this.prelitCell) {
                this.prelitCell.addClass('jxGridCellPrelight');
            }
        }
    }
});
// $Id: $
/**
 * Class: Jx.Plugin.Sorter
 * 
 * Extends: <Jx.Plugin>
 * 
 * Grid plugin to sort the grid by a single column.
 * 
 * Original selection code from Jx.Grid's original class
 * 
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Grid.Sorter = new Class({

    Extends : Jx.Plugin,

    options : {},
    /**
     * Property: current
     * refernce to the currently sorted column
     */
    current : null,
    /**
     * Property: direction
     * tell us what direction the sort is in (either 'asc' or 'desc')
     */
    direction : null,
    /**
     * Property: currentGridIndex
     * Holds the index of the column in the grid
     */
    currentGridIndex : null,
    /**
     * Property: bound
     * storage for bound methods useful for working with events
     */
    bound: {},
    /**
     * APIMethod: initialize
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    initialize: function(options) {
        this.parent(options);
        this.bound.sort = this.sort.bind(this);
        this.bound.addHeaderClass = this.addHeaderClass.bind(this);
    },
    /**
     * APIMethod: attach
     * Sets up the plugin and attaches the plugin to the grid events it 
     * will be monitoring
     */
    attach: function (grid) {
        if (!$defined(grid) && !(grid instanceof Jx.Grid)) {
            return;
        }

        this.grid = grid;

        this.grid.addEvent('gridClick', this.bound.sort);
        this.boundAddHeader = this.addHeaderClass.bind(this);
    },
    /**
     * APIMethod: detach
     */
    detach: function() {
        if (this.grid) {
            this.grid.removeEvent('gridClick', this.bound.sort);
        }
        this.grid = null;
    },
    /**
     * Method: sort
     * called when a grid header is clicked.
     * 
     * Parameters:
     * rc - an object holding the row and column indexes for the clicked header
     */
    sort : function (rc) {
        if ($defined(rc) && rc.column !== -1 && rc.row !== -1) {
            //check to find the header
            if (rc.row === 0) {
                if (this.grid.row.useHeaders()) {
                    rc.column--;
                }
                var column = this.grid.columns.getByGridIndex(rc.column);
                if (column.isSortable()) {
                    if (column === this.current) {
                        //reverse sort order
                        this.direction = (this.direction === 'asc') ? 'desc' : 'asc';
                    } else {
                        this.current = column;
                        this.direction = 'asc';
                        this.currentGridIndex = rc.column;
                    }
    
                    //The grid should be listening for the sortFinished event and will re-render the grid
                    //we will listen for the grid's doneCreateGrid event to add the header
                    this.grid.addEvent('doneCreateGrid', this.bound.addHeaderClass);
                    //sort the store
                    var model = this.grid.getModel();
                    model.sort(this.current.name, null, this.direction);
                }
        
            }
        }
    },
    /**
     * Method: addHeaderClass
     * Event listener that adds the proper sorted column class to the
     * column we sorted by so that the sort arrow shows 
     */
    addHeaderClass : function () {
        this.grid.removeEvent('doneCreateGrid', this.bound.addHeaderClass);
        
        //get header TD
        var th = this.grid.colTable.rows[0].cells[this.currentGridIndex];
        th.addClass('jxGridColumnSorted' + this.direction.capitalize());
    }
});
// $Id: $
/**
 * Class: Jx.Plugin.Resize
 * 
 * Extends: <Jx.Plugin>
 * 
 * Grid plugin to enable dynamic resizing of column width and row height
 *
 * 
 * License: 
 * Copyright (c) 2009, DM Solutions Group.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Grid.Resize = new Class({

    Extends : Jx.Plugin,
    
    options: {
        /**
         * Option: columns
         * set to true to make column widths resizeable
         */
        columns: false,
        /**
         * Option: rows
         * set to true to make row heights resizeable
         */
        rows: false,
        /**
         * Option: tooltip
         * the tooltip to display for the draggable portion of the
         * cell header
         */
        tooltip: 'Drag to resize, double click to auto-size.'
    },
    /**
     * Property: els
     * the DOM elements by which the rows/columns are resized.
     */
    els: [],
    
    /**
     * Property: drags
     * the Drag instances
     */
    drags: [],
    
    /**
     * Property: bound
     * storage for bound methods useful for working with events
     */
    bound: {},
    /**
     * APIMethod: initialize
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    initialize: function(options) {
        this.parent(options);
        this.bound.createResizeHandles = this.createResizeHandles.bind(this);
        this.bound.removeResizeHandles = this.removeResizeHandles.bind(this);
    },
    /**
     * APIMethod: attach
     * Sets up the plugin and connects it to the grid
     */
    attach: function (grid) {
        if (!$defined(grid) && !(grid instanceof Jx.Grid)) {
            return;
        }
        this.grid = grid;
        this.grid.addEvent('doneCreateGrid', this.bound.createResizeHandles);
        this.grid.addEvent('beginCreateGrid', this.bound.removeResizeHandles);
        this.createResizeHandles();
    },
    /**
     * APIMethod: detach
     */
    detach: function() {
        if (this.grid) {
            this.grid.removeEvent('doneCreateGrid', this.bound.createResizeHandles);
            this.grid.removeEvent('beginCreateGrid', this.bound.removeResizeHandles);
        }
        this.grid = null;
    },
    
    removeResizeHandles: function() {
        this.els.each(function(el) { el.dispose(); } );
        this.els = [];
        this.drags.each(function(drag){ drag.detach(); });
        this.drags = [];
    },
    
    createResizeHandles: function() {
        if (this.options.columns && this.grid.columns.useHeaders()) {
            this.grid.columns.columns.each(function(col, idx) {
                if (col.header) {
                    var el = new Element('div', {
                        'class':'jxGridColumnResize',
                        title: this.options.tooltip,
                        events: {
                            dblclick: function() {
                                col.options.width = 'auto';
                                col.setWidth(col.getWidth(true));
                            }
                        }
                    }).inject(col.header);
                    this.els.push(el);
                    this.drags.push(new Drag(el, {
                        limit: {y:[0,0]},
                        onDrag: function(el) {
                            var w = el.getPosition(el.parentNode).x.toInt();
                            col.setWidth(w);
                        }
                    }));
                }
            }, this);
        }
        
        if (this.options.rows && this.grid.row.useHeaders()) {
            
        }
    }
});
// $Id: context.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.Menu.Context
 *
 * Extends: Jx.Menu
 *
 * A <Jx.Menu> that has no button but can be opened at a specific 
 * browser location to implement context menus (for instance).
 *
 * Example:
 * (code)
 * (end)
 *
 * Events:
 * TODO - add open/close events?
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Menu.Context = new Class({
    Family: 'Jx.Menu.Context',
    /** Extends:
     * <Jx.Menu>
     */
    Extends: Jx.Menu,
    /**
     * Constructor: Jx.ContextMenu
     * create a new context menu
     *
     * Parameters:
     * id - {HTMLElement} element or id to make this the context menu
     * for.  The menu hooks the oncontextmenu event of the element
     * and shows itself at the mouse position where the right-click
     * happened.
     */
    initialize : function(id) {
        this.parent();
        if (document.id(id)) {
            document.id(id).addEvent('contextmenu', this.show.bindWithEvent(this));
        }
    },
    /**
     * Method: show
     * Show the context menu at the location of the mouse click
     *
     * Parameters:
     * e - {Event} the mouse event
     */
    show : function(e) {
        if (this.items.length ==0) {
            return;
        }
        
        this.contentContainer.setStyle('visibility','hidden');
        this.contentContainer.setStyle('display','block');
        document.id(document.body).adopt(this.contentContainer);            
        /* we have to size the container for IE to render the chrome correctly
         * but just in the menu/sub menu case - there is some horrible peekaboo
         * bug in IE related to ULs that we just couldn't figure out
         */
        this.contentContainer.setContentBoxSize(this.subDomObj.getMarginBoxSize());
        
        this.position(this.contentContainer, document.body, {
            horizontal: [e.page.x + ' left'],
            vertical: [e.page.y + ' top', e.page.y + ' bottom'],
            offsets: this.chromeOffsets
        });

        this.contentContainer.setStyle('visibility','');
        this.showChrome(this.contentContainer);
                
        document.addEvent('mousedown', this.hideWatcher);
        document.addEvent('keyup', this.keypressWatcher);

        e.stop();
    }    
});// $Id: menu.separator.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.Menu.Separator
 *
 * Extends: <Jx.Object>
 *
 * A convenience class to create a visual separator in a menu.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Menu.Separator = new Class({
    Family: 'Jx.Menu.Separator',
    Extends: Jx.Object,
    /**
     * Property: domObj
     * {HTMLElement} the HTML element that the separator is contained
     * within
     */
    domObj: null,
    /**
     * Property: owner
     * {<Jx.Menu>, <Jx.Menu.SubMenu>} the menu that the separator is in.
     */
    owner: null,
    /**
     * Constructor: Jx.Menu.Separator
     * Create a new instance of a menu separator
     */
    initialize: function() {
        this.domObj = new Element('li',{'class':'jxMenuItem'});
        var span = new Element('span', {'class':'jxMenuSeparator','html':'&nbsp;'});
        this.domObj.appendChild(span);
    },
    /**
     * Method: setOwner
     * Set the ownder of this menu item
     *
     * Parameters:
     * obj - {Object} the new owner
     */
    setOwner: function(obj) {
        this.owner = obj;
    },
    /**
     * Method: hide
     * Hide the menu item.
     */
    hide: $empty,
    /**
     * Method: show
     * Show the menu item
     */
    show: $empty
});// $Id: submenu.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.Menu.SubMenu
 *
 * Extends: <Jx.Menu.Item>
 *
 * Implements: <Jx.AutoPosition>, <Jx.Chrome>
 *
 * A sub menu contains menu items within a main menu or another
 * sub menu.
 *
 * The structure of a SubMenu is the same as a <Jx.Menu.Item> with
 * an additional unordered list element appended to the container.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Menu.SubMenu = new Class({
    Family: 'Jx.Menu.SubMenu',
    Extends: Jx.Menu.Item,
    /**
     * Property: subDomObj
     * {HTMLElement} the HTML container for the sub menu.
     */
    subDomObj: null,
    /**
     * Property: owner
     * {<Jx.Menu> or <Jx.SubMenu>} the menu or sub menu that this sub menu
     * belongs
     */
    owner: null,
    /**
     * Property: visibleItem
     * {<Jx.MenuItem>} the visible item within the menu
     */
    visibleItem: null,
    /**
     * Property: items
     * {Array} the menu items that are in this sub menu.
     */
    items: null,
    /**
     * Constructor: Jx.SubMenu
     * Create a new instance of Jx.SubMenu
     *
     * Parameters:
     * options - see <Jx.Button.Options>
     */
    initialize: function(options) { 
        this.open = false;
        this.items = [];
        this.parent(options);
        this.domA.addClass('jxButtonSubMenu');
        
        this.contentContainer = new Element('div', {
            'class': 'jxMenuContainer'
        });
        this.subDomObj = new Element('ul', {
            'class':'jxSubMenu'
        });
        this.contentContainer.adopt(this.subDomObj);
    },
    /**
     * Method: setOwner
     * Set the owner of this sub menu
     *
     * Parameters:
     * obj - {Object} the owner
     */
    setOwner: function(obj) {
        this.owner = obj;
    },
    /**
     * Method: show
     * Show the sub menu
     */
    show: function() {
        if (this.open || this.items.length == 0) {
            return;
        }
        
        this.contentContainer.setStyle('visibility','hidden');
        this.contentContainer.setStyle('display','block');
        document.id(document.body).adopt(this.contentContainer);            
        /* we have to size the container for IE to render the chrome correctly
         * but just in the menu/sub menu case - there is some horrible peekaboo
         * bug in IE related to ULs that we just couldn't figure out
         */
        this.contentContainer.setContentBoxSize(this.subDomObj.getMarginBoxSize());
        this.showChrome(this.contentContainer);
        
        this.position(this.contentContainer, this.domObj, {
            horizontal: ['right left', 'left right'],
            vertical: ['top top'],
            offsets: this.chromeOffsets
        });
        
        this.open = true;
        this.contentContainer.setStyle('visibility','');
        
        this.setActive(true);
    },
    
    eventInMenu: function(e) {
        if (this.visibleItem && 
            this.visibleItem.eventInMenu && 
            this.visibleItem.eventInMenu(e)) {
            return true;
        }
        return document.id(e.target).descendantOf(this.domObj) ||
               document.id(e.target).descendantOf(this.subDomObj) ||
               this.items.some(
                   function(item) {
                       return item instanceof Jx.Menu.SubMenu && 
                              item.eventInMenu(e);
                   }
               );
    },
    
    /**
     * Method: hide
     * Hide the sub menu
     */
    hide: function() {
        if (!this.open) {
            return;
        }
        this.open = false;
        this.items.each(function(item){item.hide();});
        this.contentContainer.setStyle('display','none');
        this.visibleItem = null;
    },
    /**
     * Method: add
     * Add menu items to the sub menu.
     *
     * Parameters:
     * item - {<Jx.MenuItem>} the menu item to add.  Multiple menu items
     * can be added by passing multiple arguments to this function.
     */
    add : function() { /* menu */
        var that = this;
        $A(arguments).each(function(item){
            that.items.push(item);
            item.setOwner(that);
            that.subDomObj.adopt(item.domObj);
        });
        return this;
    },
    /**
     * Method: insertBefore
     * Insert a menu item before another menu item.
     *
     * Parameters:
     * newItem - {<Jx.MenuItem>} the menu item to insert
     * targetItem - {<Jx.MenuItem>} the menu item to insert before
     */
    insertBefore: function(newItem, targetItem) {
        var bInserted = false;
        for (var i=0; i<this.items.length; i++) {
            if (this.items[i] == targetItem) {
                this.items.splice(i, 0, newItem);
                this.subDomObj.insertBefore(newItem.domObj, targetItem.domObj);
                bInserted = true;
                break;
            }
        }
        if (!bInserted) {
            this.add(newItem);
        }
    },
    /**
     * Method: remove
     * Remove a single menu item from the menu.
     *
     * Parameters:
     * item - {<Jx.MenuItem} the menu item to remove.
     */
    remove: function(item) {
        for (var i=0; i<this.items.length; i++) {
            if (this.items[i] == item) {
                this.items.splice(i,1);
                this.subDomObj.removeChild(item.domObj);
                break;
            }
        }
    },
    /**
     * Method: deactivate
     * Deactivate the sub menu
     *
     * Parameters:
     * e - {Event} the event that triggered the menu being
     * deactivated.
     */
    deactivate: function(e) {
        if (this.owner) {
            this.owner.deactivate(e);            
        }
    },
    /**
     * Method: isActive
     * Indicate if this sub menu is active
     *
     * Returns:
     * {Boolean} true if the <Jx.Menu> that ultimately contains
     * this sub menu is active, false otherwise.
     */
    isActive: function() { 
        if (this.owner) {
            return this.owner.isActive();
        } else {
            return false;
        }
    },
    /**
     * Method: setActive
     * Set the active state of the <Jx.Menu> that contains this sub menu
     *
     * Parameters:
     * isActive - {Boolean} the new active state
     */
    setActive: function(isActive) { 
        if (this.owner && this.owner.setActive) {
            this.owner.setActive(isActive);
        }
    },
    /**
     * Method: setVisibleItem
     * Set a sub menu of this menu to be visible and hide the previously
     * visible one.
     *
     * Parameters: 
     * obj - {<Jx.SubMenu>} the sub menu that should be visible
     */
    setVisibleItem: function(obj) {
        if (this.visibleItem != obj) {
            if (this.visibleItem && this.visibleItem.hide) {
                this.visibleItem.hide();
            }
            this.visibleItem = obj;
            this.visibleItem.show();
        }
    }
});// $Id: snap.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.Splitter.Snap
 *
 * Extends: <Jx.Object>
 *
 * A helper class to create an element that can snap a split panel open or
 * closed.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Splitter.Snap = new Class({
    Family: 'Jx.Splitter.Snap',
    Extends: Jx.Object,
    /**
     * Property: snap
     * {HTMLElement} the DOM element of the snap (the thing that gets
     * clicked).
     */
    snap: null,
    /**
     * Property: element
     * {HTMLElement} An element of the <Jx.Splitter> that gets controlled
     * by this snap
     */
    element: null,
    /**
     * Property: splitter
     * {<Jx.Splitter>} the splitter that this snap is associated with.
     */
    splitter: null,
    /**
     * Property: layout
     * {String} track the layout of the splitter for convenience.
     */
    layout: 'vertical',
    /**
     * Constructor: Jx.Splitter.Snap
     * Create a new Jx.Splitter.Snap
     *
     * Parameters:
     * snap - {HTMLElement} the clickable thing that snaps the element
     *           open and closed
     * element - {HTMLElement} the element that gets controlled by the snap
     * splitter - {<Jx.Splitter>} the splitter that this all happens inside of.
     */
    initialize: function(snap, element, splitter, events) {
        this.snap = snap;
        this.element = element;
        var jxl = element.retrieve('jxLayout');
        jxl.addEvent('sizeChange', this.sizeChange.bind(this));
        this.splitter = splitter;
        this.layout = splitter.options.layout; 
        var jxo = jxl.options;
        var size = this.element.getContentBoxSize();
        if (this.layout == 'vertical') {
            this.originalSize = size.height;
            this.minimumSize = jxo.minHeight ? jxo.minHeight : 0;
        } else {
            this.originalSize = size.width;
            this.minimumSize = jxo.minWidth ? jxo.minWidth : 0;
        }
        events.each(function(eventName) {
            snap.addEvent(eventName, this.toggleElement.bind(this));
        }, this);
    },
    
    /**
     * Method: toggleElement
     * Snap the element open or closed.
     */
    toggleElement: function() {
        var size = this.element.getContentBoxSize();
        var newSize = {};
        if (this.layout == 'vertical') {
            if (size.height == this.minimumSize) {
                newSize.height = this.originalSize;
            } else {
                this.originalSize = size.height;
                newSize.height = this.minimumSize;
            }
        } else {
            if (size.width == this.minimumSize) {
                newSize.width = this.originalSize;
            } else {
                this.originalSize = size.width;
                newSize.width = this.minimumSize;
            }
        }
        this.element.resize(newSize);
        this.splitter.sizeChanged();
    },
    
    /**
     * Method: sizeChanged
     * Handle the size of the element changing to see if the
     * toggle state has changed.
     */
    sizeChange: function() {
        var size = this.element.getContentBoxSize();
        if (this.layout == 'vertical') {
            if (size.height == this.minimumSize) {
                this.snap.addClass('jxSnapClosed');
                this.snap.removeClass('jxSnapOpened');
            } else {
                this.snap.addClass('jxSnapOpened');
                this.snap.removeClass('jxSnapClosed');
            }
        } else {
            if (size.width == this.minimumSize) {
                this.snap.addClass('jxSnapClosed');
                this.snap.removeClass('jxSnapOpened');
            } else {
                this.snap.addClass('jxSnapOpened');
                this.snap.removeClass('jxSnapClosed');
            }
        }
    }
});// $Id: tabset.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.TabSet
 *
 * Extends: <Jx.Object>
 *
 * A TabSet manages a set of <Jx.Button.Tab> content areas by ensuring that only one
 * of the content areas is visible (i.e. the active tab).  TabSet does not
 * manage the actual tabs.  The instances of <Jx.Button.Tab> that are to be managed
 * as a set have to be added to both a TabSet and a <Jx.Toolbar>.  The content
 * areas of the <Jx.Button.Tab>s are sized to fit the content area that the TabSet
 * is managing.
 *
 * Example:
 * (code)
 * var tabBar = new Jx.Toolbar('tabBar');
 * var tabSet = new Jx.TabSet('tabArea');
 * 
 * var tab1 = new Jx.Button.Tab('tab 1', {contentID: 'content1'});
 * var tab2 = new Jx.Button.Tab('tab 2', {contentID: 'content2'});
 * var tab3 = new Jx.Button.Tab('tab 3', {contentID: 'content3'});
 * var tab4 = new Jx.Button.Tab('tab 4', {contentURL: 'test_content.html'});
 * 
 * tabSet.add(t1, t2, t3, t4);
 * tabBar.add(t1, t2, t3, t4);
 * (end)
 *
 * Events:
 * tabChange - the current tab has changed
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.TabSet = new Class({
    Family: 'Jx.TabSet',
    Extends: Jx.Object,
    /**
     * Property: tabs
     * {Array} array of tabs that are managed by this tab set
     */
    tabs: null,
    /**
     * Property: domObj
     * {HTMLElement} The HTML element that represents this tab set in the DOM.
     * The content areas of each tab are sized to fill the domObj.
     */
    domObj : null,
    /**
     * Constructor: Jx.TabSet
     * Create a new instance of <Jx.TabSet> within a specific element of
     * the DOM.
     *
     * Parameters:
     * domObj - {HTMLElement} an element or id of an element to put the
     * content of the tabs into.
     * options - an options object, only event handlers are supported
     * as options at this time.
     */
    initialize: function(domObj, options) {
        this.setOptions(options);
        this.tabs = [];
        this.domObj = document.id(domObj);
        if (!this.domObj.hasClass('jxTabSetContainer')) {
            this.domObj.addClass('jxTabSetContainer');
        }
        this.setActiveTabFn = this.setActiveTab.bind(this);
    },
    /**
     * Method: resizeTabBox
     * Resize the tab set content area and propogate the changes to
     * each of the tabs managed by the tab set.
     */
    resizeTabBox: function() {
        if (this.activeTab && this.activeTab.content.resize) {
            this.activeTab.content.resize({forceResize: true});
        }
    },
    
    /**
     * Method: add
     * Add one or more <Jx.Button.Tab>s to the TabSet.
     *
     * Parameters:
     * tab - {<Jx.Tab>} an instance of <Jx.Tab> to add to the tab set.  More
     * than one tab can be added by passing extra parameters to this method.
     */
    add: function() {
        $A(arguments).each(function(tab) {
            if (tab instanceof Jx.Button.Tab) {
                tab.addEvent('down',this.setActiveTabFn);
                tab.tabSet = this;
                this.domObj.appendChild(tab.content);
                this.tabs.push(tab);
                if ((!this.activeTab || tab.options.active) && tab.options.enabled) {
                    tab.options.active = false;
                    tab.setActive(true);
                }
            }
        }, this);
        return this;
    },
    /**
     * Method: remove
     * Remove a tab from this TabSet.  Note that it is the caller's responsibility
     * to remove the tab from the <Jx.Toolbar>.
     *
     * Parameters:
     * tab - {<Jx.Tab>} the tab to remove.
     */
    remove: function(tab) {
        if (tab instanceof Jx.Button.Tab && this.tabs.indexOf(tab) != -1) {
            this.tabs.erase(tab);
            if (this.activeTab == tab) {
                if (this.tabs.length) {
                    this.tabs[0].setActive(true);
                }
            }
            tab.removeEvent('down',this.setActiveTabFn);
            tab.content.dispose();
        }
    },
    /**
     * Method: setActiveTab
     * Set the active tab to the one passed to this method
     *
     * Parameters:
     * tab - {<Jx.Button.Tab>} the tab to make active.
     */
    setActiveTab: function(tab) {
        if (this.activeTab && this.activeTab != tab) {
            this.activeTab.setActive(false);
        }
        this.activeTab = tab;
        if (this.activeTab.content.resize) {
          this.activeTab.content.resize({forceResize: true});
        }
        this.fireEvent('tabChange', [this, tab]);
    }
});



// $Id: tabbox.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.TabBox
 * 
 * Extends: <Jx.Widget>
 *
 * A convenience class to handle the common case of a single toolbar
 * directly attached to the content area of the tabs.  It manages both a
 * <Jx.Toolbar> and a <Jx.TabSet> so that you don't have to.  If you are using
 * a TabBox, then tabs only have to be added to the TabBox rather than to
 * both a <Jx.TabSet> and a <Jx.Toolbar>.
 *
 * Example:
 * (code)
 * var tabBox = new Jx.TabBox('subTabArea', 'top');
 * 
 * var tab1 = new Jx.Button.Tab('Tab 1', {contentID: 'content4'});
 * var tab2 = new Jx.Button.Tab('Tab 2', {contentID: 'content5'});
 * 
 * tabBox.add(tab1, tab2);
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.TabBox = new Class({
    Family: 'Jx.TabBox',
    Extends: Jx.Widget,
    options: {
        /* Option: parent
         * a DOM element to add the tab box to
         */
        parent: null,
        /* Option: position
         * the position of the tab bar in the box, one of 'top', 'right',
         * 'bottom' or 'left'.  Top by default.
         */
        position: 'top',
        /* Option: height
         * a fixed height in pixels for the tab box.  If not set, it will fill
         * its container
         */
        height: null,
        /* Option: width
         * a fixed width in pixels for the tab box.  If not set, it will fill
         * its container
         */
        width: null,
        /* Option: scroll
         * should the tab bar scroll its tabs if there are too many to fit
         * in the toolbar, true by default
         */
        scroll:true
    },
    
    /**
     * Property: tabBar
     * {<Jx.Toolbar>} the toolbar for this tab box.
     */
    tabBar: null,
    /**
     * Property: tabSet
     * {<Jx.TabSet>} the tab set for this tab box.
     */
    tabSet: null,
    /**
     * Constructor: Jx.TabBox
     * Create a new instance of a TabBox.
     *
     * Parameters:
     * options - <Jx.TabBox.Options>
     */
    initialize : function(options) {
        this.setOptions(options);
        this.tabBar = new Jx.Toolbar({
            type: 'TabBar', 
            position: this.options.position,
            scroll: this.options.scroll
        });
        this.panel = new Jx.Panel({
            toolbars: [this.tabBar],
            hideTitle: true,
            height: this.options.height,
            width: this.options.width
        });
        this.panel.domObj.addClass('jxTabBox');
        this.tabSet = new Jx.TabSet(this.panel.content);
        this.tabSet.addEvent('tabChange', function(tabSet, tab) {
            this.showItem(tab);
        }.bind(this.tabBar));
        this.domObj = this.panel.domObj;
        /* when the panel changes size, the tab set needs to update 
         * the content areas.
         */
         this.panel.addEvent('sizeChange', (function() {
             this.tabSet.resizeTabBox();
             this.tabBar.domObj.getParent('.jxBarContainer').retrieve('jxBarContainer').update();
         }).bind(this));
        /* when tabs are added or removed, we might need to layout
         * the panel if the toolbar is or becomes empty
         */
        this.tabBar.addEvents({
            add: (function() {
                this.domObj.resize({forceResize: true});
            }).bind(this),
            remove: (function() {
                this.domObj.resize({forceResize: true});
            }).bind(this)
        });
        /* trigger an initial resize when first added to the DOM */
        this.addEvent('addTo', function() {
            this.domObj.resize({forceResize: true});
        });
        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
    },
    /**
     * Method: add
     * Add one or more <Jx.Tab>s to the TabBox.
     *
     * Parameters:
     * tab - {<Jx.Tab>} an instance of <Jx.Tab> to add to the tab box.  More
     * than one tab can be added by passing extra parameters to this method.
     * Unlike <Jx.TabSet>, tabs do not have to be added to a separate 
     * <Jx.Toolbar>.
     */
    add : function() { 
        this.tabBar.add.apply(this.tabBar, arguments); 
        this.tabSet.add.apply(this.tabSet, arguments);
        $A(arguments).flatten().each(function(tab){
            tab.addEvents({
                close: (function(){
                    this.tabBar.remove(tab);
                    this.tabSet.remove(tab);
                }).bind(this)
            });
        }, this);
        return this;
    },
    /**
     * Method: remove
     * Remove a tab from the TabSet.
     *
     * Parameters:
     * tab - {<Jx.Tab>} the tab to remove.
     */
    remove : function(tab) {
        this.tabBar.remove(tab);
        this.tabSet.remove(tab);
    }
});
// $Id: toolbar.item.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.Toolbar.Item
 * 
 * Extends: Object
 *
 * Implements: Options
 *
 * A helper class to provide a container for something to go into 
 * a <Jx.Toolbar>.
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Toolbar.Item = new Class( {
    Family: 'Jx.Toolbar.Item',
    Extends: Jx.Object,
    options: {
        /* Option: active
         * is this item active or not?  Default is true.
         */
        active: true
    },
    /**
     * Property: domObj
     * {HTMLElement} an element to contain the thing to be placed in the
     * toolbar.
     */
    domObj: null,
    /**
     * Constructor: Jx.Toolbar.Item
     * Create a new instance of Jx.Toolbar.Item.
     *
     * Parameters:
     * jxThing - {Object} the thing to be contained.
     */
    initialize : function( jxThing ) {
        this.al = [];
        this.domObj = new Element('li', {'class':'jxToolItem'});
        if (jxThing) {
            if (jxThing.domObj) {
                this.domObj.appendChild(jxThing.domObj);
                if (jxThing instanceof Jx.Button.Tab) {
                    this.domObj.addClass('jxTabItem');
                }
            } else {
                this.domObj.appendChild(jxThing);
                if (jxThing.hasClass('jxTab')) {
                    this.domObj.addClass('jxTabItem');
                }
            }
        }
    }
});// $Id: toolbar.separator.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.Toolbar.Separator
 *
 * Extends: <Jx.Object>
 *
 * A helper class that represents a visual separator in a <Jx.Toolbar>
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Toolbar.Separator = new Class({
    Family: 'Jx.Toolbar.Separator',
    Extends: Jx.Object,
    /**
     * Property: domObj
     * {HTMLElement} The DOM element that goes in the <Jx.Toolbar>
     */
    domObj: null,
    /**
     * Constructor: Jx.Toolbar.Separator
     * Create a new Jx.Toolbar.Separator
     */
    initialize: function() {
        this.domObj = new Element('li', {'class':'jxToolItem'});
        this.domSpan = new Element('span', {'class':'jxBarSeparator'});
        this.domObj.appendChild(this.domSpan);
    }
});
// $Id: treeitem.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.TreeItem 
 *
 * Extends: <Jx.Widget>
 *
 * An item in a tree.  An item is a leaf node that has no children.
 *
 * Jx.TreeItem supports selection via the click event.  The application 
 * is responsible for changing the style of the selected item in the tree
 * and for tracking selection if that is important.
 *
 * Example:
 * (code)
 * (end)
 *
 * Events:
 * click - triggered when the tree item is clicked
 *
 * Implements:
 * Events - MooTools Class.Extras
 * Options - MooTools Class.Extras
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.TreeItem = new Class ({
    Family: 'Jx.TreeItem',
    Extends: Jx.Widget,
    /**
     * Property: domObj
     * {HTMLElement} a reference to the HTML element that is the TreeItem
     * in the DOM
     */
    domObj : null,
    /**
     * Property: owner
     * {Object} the folder or tree that this item belongs to
     */
    owner: null,
    options: {
        /* Option: label
         * {String} the label to display for the TreeItem
         */        
        label: '',
        /* Option: data
         * {Object} any arbitrary data to be associated with the TreeItem
         */
        data: null,
        /* Option: contextMenu
         * {<Jx.ContextMenu>} the context menu to trigger if there
         * is a right click on the node
         */
        contextMenu: null,
        /* Option: enabled
         * {Boolean} the initial state of the TreeItem.  If the 
         * TreeItem is not enabled, it cannot be clicked.
         */
        enabled: true,
        type: 'Item',
        /* Option: image
         * {String} URL to an image to use as the icon next to the
         * label of this TreeItem
         */
        image: null,
        /* Option: imageClass
         * {String} CSS class to apply to the image, useful for using CSS
         * sprites
         */
        imageClass: ''
    },
    /**
     * Constructor: Jx.TreeItem
     * Create a new instance of Jx.TreeItem with the associated options
     *
     * Parameters:
     * options - <Jx.TreeItem.Options>
     */
    initialize : function( options ) {
        this.setOptions(options);

        this.domObj = new Element('li', {'class':'jxTree'+this.options.type});
        if (this.options.id) {
            this.domObj.id = this.options.id;
        }
      
        this.domNode = new Element('img',{
            'class': 'jxTreeImage', 
            src: Jx.aPixel.src,
            alt: '',
            title: ''
        });
        this.domObj.appendChild(this.domNode);
        
        this.domLabel = (this.options.draw) ? 
            this.options.draw.apply(this) : 
            this.draw();

        this.domObj.appendChild(this.domLabel);
        this.domObj.store('jxTreeItem', this);
        
        if (!this.options.enabled) {
            this.domObj.addClass('jxDisabled');
        }
    },
    draw: function() {
        var domImg = new Element('img',{
            'class':'jxTreeIcon', 
            src: Jx.aPixel.src,
            alt: '',
            title: ''
        });
        if (this.options.image) {
            domImg.setStyle('backgroundImage', 'url('+this.options.image+')');
        }
        if (this.options.imageClass) {
            domImg.addClass(this.options.imageClass);
        }
        // the clickable part of the button
        var hasFocus;
        var mouseDown;
        
        var domA = new Element('a',{
            href:'javascript:void(0)',
            html: this.options.label
        });
        domA.addEvents({
            click: this.selected.bind(this),
            dblclick: this.selected.bind(this),
            drag: function(e) {e.stop();},
            contextmenu: function(e) { e.stop(); },
            mousedown: (function(e) {
               domA.addClass('jxTreeItemPressed');
               hasFocus = true;
               mouseDown = true;
               domA.focus();
               if (e.rightClick && this.options.contextMenu) {
                   this.options.contextMenu.show(e);
               }
            }).bind(this),
            mouseup: function(e) {
                domA.removeClass('jxTreeItemPressed');
                mouseDown = false;
            },
            mouseleave: function(e) {
                domA.removeClass('jxTreeItemPressed');
            },
            mouseenter: function(e) {
                if (hasFocus && mouseDown) {
                    domA.addClass('jxTreeItemPressed');
                }
            },
            keydown: function(e) {
                if (e.key == 'enter') {
                    domA.addClass('jxTreeItemPressed');
                }
            },
            keyup: function(e) {
                if (e.key == 'enter') {
                    domA.removeClass('jxTreeItemPressed');
                }
            },
            blur: function() { hasFocus = false; }
        });
        domA.appendChild(domImg);
        if (typeof Drag != 'undefined') {
            new Drag(domA, {
                onStart: function() {this.stop();}
            });
        }
        return domA;
    },
    /**
     * Method: finalize
     * Clean up the TreeItem and remove all DOM references
     */
    finalize: function() { this.finalizeItem(); },
    /**
     * Method: finalizeItem
     * Clean up the TreeItem and remove all DOM references
     */
    finalizeItem: function() {  
        if (!this.domObj) {
            return;
        }
        //this.domA.removeEvents();
        this.options = null;
        this.domObj.dispose();
        this.domObj = null;
        this.owner = null;
    },
    /**
     * Method: clone
     * Create a clone of the TreeItem
     * 
     * Returns: 
     * {<Jx.TreeItem>} a copy of the TreeItem
     */
    clone : function() {
        return new Jx.TreeItem(this.options);
    },
    /**
     * Method: update
     * Update the CSS of the TreeItem's DOM element in case it has changed
     * position
     *
     * Parameters:
     * shouldDescend - {Boolean} propagate changes to child nodes?
     */
    update : function(shouldDescend) {
        var isLast = (arguments.length > 1) ? arguments[1] : 
                     (this.owner && this.owner.isLastNode(this));
        if (isLast) {
            this.domObj.removeClass('jxTree'+this.options.type);
            this.domObj.addClass('jxTree'+this.options.type+'Last');
        } else {
            this.domObj.removeClass('jxTree'+this.options.type+'Last');
            this.domObj.addClass('jxTree'+this.options.type);
        }
    },
    /**
     * Method: selected
     * Called when the DOM element for the TreeItem is clicked, the
     * node is selected.
     *
     * Parameters:
     * e - {Event} the DOM event
     */
    selected : function(e) {
        this.fireEvent('click', this);
    },
    /**
     * Method: getName
     * Get the label associated with a TreeItem
     *
     * Returns: 
     * {String} the name
     */
    getName : function() { return this.options.label; },
    /**
     * Method: propertyChanged
     * A property of an object has changed, synchronize the state of the 
     * TreeItem with the state of the object
     *
     * Parameters:
     * obj - {Object} the object whose state has changed
     */
    propertyChanged : function(obj) {
        this.options.enabled = obj.isEnabled();
        if (this.options.enabled) {
            this.domObj.removeClass('jxDisabled');
        } else {
            this.domObj.addClass('jxDisabled');
        }
    }
});
// $Id: treefolder.js 487 2009-07-19 03:48:32Z jonlb@comcast.net $
/**
 * Class: Jx.TreeFolder
 * 
 * Extends: <Jx.TreeItem>
 *
 * A Jx.TreeFolder is an item in a tree that can contain other items.  It is
 * expandable and collapsible.
 *
 * Example:
 * (code)
 * (end)
 *
 * Extends:
 * <Jx.TreeItem>
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.TreeFolder = new Class({
    Family: 'Jx.TreeFolder',
    Extends: Jx.TreeItem,
    /**
     * Property: subDomObj
     * {HTMLElement} an HTML container for the things inside the folder
     */
    subDomObj : null,
    /**
     * Property: nodes
     * {Array} an array of references to the javascript objects that are
     * children of this folder
     */
    nodes : null,

    options: {
        /* Option: open
         * is the folder open?  false by default.
         */
        open : false
    },
    /**
     * Constructor: Jx.TreeFolder
     * Create a new instance of Jx.TreeFolder
     *
     * Parameters:
     * options - <Jx.TreeFolder.Options> and <Jx.TreeItem.Options>
     */
    initialize : function( options ) {
        this.parent($merge(options,{type:'Branch'}));

        document.id(this.domNode).addEvent('click', this.clicked.bindWithEvent(this));
        this.addEvent('click', this.clicked.bindWithEvent(this));
                
        this.nodes = [];
        this.subDomObj = new Element('ul', {'class':'jxTree'});
        this.domObj.appendChild(this.subDomObj);
        if (this.options.open) {
            this.expand();
        } else {
            this.collapse();
        }
    },
    /**
     * Method: finalize
     * Clean up a TreeFolder.
     */
    finalize: function() {
        this.finalizeFolder();
        this.finalizeItem();
        this.subDomObj.dispose();
        this.subDomObj = null;
    },
    /**
     * Method: finalizeFolder
     * Internal method to clean up folder-related stuff.
     */
    finalizeFolder: function() {
        this.domObj.childNodes[0].removeEvents();
        for (var i=this.nodes.length-1; i>=0; i--) {
            this.nodes[i].finalize();
            this.nodes.pop();
        }
        
    },
    
    /**
     * Method: clone
     * Create a clone of the TreeFolder
     * 
     * Returns: 
     * {<Jx.TreeFolder>} a copy of the TreeFolder
     */
    clone : function() {
        var node = new Jx.TreeFolder(this.options);
        this.nodes.each(function(n){node.append(n.clone());});
        return node;
    },
    /**
     * Method: isLastNode
     * Indicates if a node is the last thing in the folder.
     *
     * Parameters:
     * node - {Jx.TreeItem} the node to check
     *
     * Returns:
     *
     * {Boolean}
     */
    isLastNode : function(node) {
        if (this.nodes.length == 0) {
            return false;
        } else {
            return this.nodes[this.nodes.length-1] == node;
        }
    },
    /**
     * Method: update
     * Update the CSS of the TreeFolder's DOM element in case it has changed
     * position.
     *
     * Parameters:
     * shouldDescend - {Boolean} propagate changes to child nodes?
     */
    update : function(shouldDescend) {
        /* avoid update if not attached to tree yet */
        if (!this.parent) return;
        var isLast = false;
        if (arguments.length > 1) {
            isLast = arguments[1];
        } else {
            isLast = (this.owner && this.owner.isLastNode(this));
        }
        
        var c = 'jxTree'+this.options.type;
        c += isLast ? 'Last' : '';
        c += this.options.open ? 'Open' : 'Closed';
        this.domObj.className = c;
        
        if (isLast) {
            this.subDomObj.className = 'jxTree';
        } else {
            this.subDomObj.className = 'jxTree jxTreeNest';
        }
        
        if (this.nodes && shouldDescend) {
            var that = this;
            this.nodes.each(function(n,i){
                n.update(false, i==that.nodes.length-1);
            });
        }
    },
    /**
     * Method: append
     * append a node at the end of the sub-tree
     *
     * Parameters:
     * node - {Object} the node to append.
     */
    append : function( node ) {
        node.owner = this;
        this.nodes.push(node);
        this.subDomObj.appendChild( node.domObj );
        this.update(true);
        return this;
    },
    /**
     * Method: insert
     * insert a node after refNode.  If refNode is null, insert at beginning
     *
     * Parameters:
     * node - {Object} the node to insert
     * refNode - {Object} the node to insert before
     */
    insert : function( node, refNode ) {
        node.owner = this;
        //if refNode is not supplied, insert at the beginning.
        if (!refNode) {
            this.nodes.unshift(node);
            //sanity check to make sure there is actually something there
            if (this.subDomObj.childNodes.length ==0) {
                this.subDomObj.appendChild(node.domObj);
            } else {
                this.subDomObj.insertBefore(node.domObj, this.subDomObj.childNodes[0]);                
            }
        } else {
            //walk all nodes looking for the ref node.  Track if it actually
            //happens so we can append if it fails.
            var b = false;
            for(var i=0;i<this.nodes.length;i++) {
                if (this.nodes[i] == refNode) {
                    //increment to append after ref node.  If this pushes us
                    //past the end, it'll get appended below anyway
                    i = i + 1;
                    if (i < this.nodes.length) {
                        this.nodes.splice(i, 0, node);
                        this.subDomObj.insertBefore(node.domObj, this.subDomObj.childNodes[i]);
                        b = true;
                        break;
                    }
                }
            }
            //if the node wasn't inserted, it is because refNode didn't exist
            //and so the fallback is to just append the node.
            if (!b) {
                this.nodes.push(node); 
                this.subDomObj.appendChild(node.domObj); 
            }
        }
        this.update(true);
        return this;
    },
    /**
     * Method: remove
     * remove the specified node from the tree
     *
     * Parameters:
     * node - {Object} the node to remove
     */
    remove : function(node) {
        node.owner = null;
        for(var i=0;i<this.nodes.length;i++) {
            if (this.nodes[i] == node) {
                this.nodes.splice(i, 1);
                this.subDomObj.removeChild(this.subDomObj.childNodes[i]);
                break;
            }
        }
        this.update(true);
        return this;
    },
    /**
     * Method: replace
     * Replace a node with another node
     *
     * Parameters:
     * newNode - {Object} the node to put into the tree
     * refNode - {Object} the node to replace
     *
     * Returns:
     * {Boolean} true if the replacement was successful.
     */
    replace: function( newNode, refNode ) {
        //walk all nodes looking for the ref node. 
        var b = false;
        for(var i=0;i<this.nodes.length;i++) {
            if (this.nodes[i] == refNode) {
                if (i < this.nodes.length) {
                    newNode.owner = this;
                    this.nodes.splice(i, 1, newNode);
                    this.subDomObj.replaceChild(newNode.domObj, refNode.domObj);
                    return true;
                }
            }
        }
        return false;
    },
    
    /**
     * Method: clicked
     * handle the user clicking on this folder by expanding or
     * collapsing it.
     *
     * Parameters: 
     * e - {Event} the event object
     */
    clicked : function(e) {
        if (this.options.open) {
            this.collapse();
        } else {
            this.expand();
        }
    },
    /**
     * Method: expand
     * Expands the folder
     */
    expand : function() {
        this.options.open = true;
        this.subDomObj.setStyle('display', 'block');
        this.update(true);
        this.fireEvent('disclosed', this);    
    },
    /**
     * Method: collapse
     * Collapses the folder
     */
    collapse : function() {
        this.options.open = false;
        this.subDomObj.setStyle('display', 'none');
        this.update(true);
        this.fireEvent('disclosed', this);
    },
    /**
     * Method: findChild
     * Get a reference to a child node by recursively searching the tree
     * 
     * Parameters:
     * path - {Array} an array of labels of nodes to search for
     *
     * Returns:
     * {Object} the node or null if the path was not found
     */
    findChild : function(path) {
        //path is empty - we are asking for this node
        if (path.length == 0)
            return this;
        
        //path has only one thing in it - looking for something in this folder
        if (path.length == 1)
        {
            for (var i=0; i<this.nodes.length; i++)
            {
                if (this.nodes[i].getName() == path[0])
                    return this.nodes[i];
            }
            return null;
        }
        //path has more than one thing in it, find a folder and descend into it    
        var childName = path.shift();
        for (var i=0; i<this.nodes.length; i++)
        {
            if (this.nodes[i].getName() == childName && this.nodes[i].findChild)
                return this.nodes[i].findChild(path);
        }
        return null;
    }
});// $Id: tree.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.Tree
 *
 * Extends: Jx.TreeFolder
 *
 * Jx.Tree displays hierarchical data in a tree structure of folders and nodes.
 *
 * Example:
 * (code)
 * (end)
 *
 * Extends: <Jx.TreeFolder>
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Tree = new Class({
    Family: 'Jx.Tree',
    Extends: Jx.TreeFolder,
    /**
     * Constructor: Jx.Tree
     * Create a new instance of Jx.Tree
     *
     * Parameters:
     * options: options for <Jx.Addable>
     */
    initialize : function( options ) {
        this.parent(options);
        this.subDomObj = new Element('ul',{
            'class':'jxTreeRoot'
        });
        
        this.nodes = [];
        this.isOpen = true;
        
        this.addable = this.subDomObj;
        
        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
    },
    
    /**
     * Method: finalize
     * Clean up a Jx.Tree instance
     */
    finalize: function() { 
        this.clear(); 
        this.subDomObj.parentNode.removeChild(this.subDomObj); 
    },
    /**
     * Method: clear
     * Clear the tree of all child nodes
     */
    clear: function() {
        for (var i=this.nodes.length-1; i>=0; i--) {
            this.subDomObj.removeChild(this.nodes[i].domObj);
            this.nodes[i].finalize();
            this.nodes.pop();
        }
    },
    /**
     * Method: update
     * Update the CSS of the Tree's DOM element in case it has changed
     * position
     *
     * Parameters:
     * shouldDescend - {Boolean} propagate changes to child nodes?
     */
    update: function(shouldDescend) {
        var bLast = true;
        if (this.subDomObj)
        {
            if (bLast) {
                this.subDomObj.removeClass('jxTreeNest');
            } else {
                this.subDomObj.addClass('jxTreeNest');
            }
        }
        if (this.nodes && shouldDescend) {
            this.nodes.each(function(n){n.update(false);});
        }
    },
    /**
     * Method: append
     * Append a node at the end of the sub-tree
     * 
     * Parameters:
     * node - {Object} the node to append.
     */
    append: function( node ) {
        node.owner = this;
        this.nodes.push(node);
        this.subDomObj.appendChild( node.domObj );
        this.update(true);
        return this;    
    }
});

// $Id: $
/**
 * Class: Jx.Tooltip
 *
 * Extends: <Jx.Widget>
 *
 * An implementation of tooltips. These are very simple tooltips that are
 * designed to be instantiated in javascript and directly attached to the object
 * that they are the tip for. We can only have one Tip per element so we use
 * element storage to store the tip object and check for it's presence
 * before creating a new tip. If one is there we remove it and create this new
 * one.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Tooltip = new Class({

    Extends : Jx.Widget,

    options : {
        /**
         * Option: offsets
         * An object with x and y components for where to put the tip related to
         * the mouse cursor.
         */
        offsets : {
            x : 15,
            y : 15
        },
        /**
         * Option: showDelay
         * The amount of time to delay before showing the tip. This ensures we
         * don't show a tip if we're just passing over an element quickly.
         */
        showDelay : 100,
        /**
         * Option: cssClass
         * a class to be added to the tip's container. This can be used to style
         * the tip.
         */
        cssClass : null
    },

    /**
     * Constructor: Jx.Tooltip
     * Creates the tooltip
     * 
     * Parameters:
     * target - The DOM element that triggers the toltip when moused over.
     * tip - The contents of the tip itself. This can be either a string or
     *       an Element.
     * options - <Jx.Tooltip.Options> and <Jx.Widget.Options>
     */
    initialize : function (target, tip, options) {
        this.parent(options);
        this.target = document.id(target);

        var t = this.target.retrieve('Tip');
        if (t) {
            this.target.eliminate('Tip');
        }

        //set up the tip options
        this.domObj = new Element('div', {
            styles : {
                'position' : 'absolute',
                'top' : 0,
                'left' : 0,
                'visibility' : 'hidden'
            }
        }).inject(document.body);
    
        if (Jx.type(tip) === 'string') {
            this.domObj.set('html', tip);
        } else {
            this.domObj.grab(tip);
        }
    
        this.domObj.addClass('jxTooltip');
        if ($defined(this.options.cssClass)) {
            this.domObj.addClass(this.options.cssClass);
        }
    
        target.store('Tip', this);
    
        //add events
        target.addEvent('mouseenter', this.enter.bindWithEvent(this));
        target.addEvent('mouseleave', this.leave.bindWithEvent(this));
        target.addEvent('mousemove', this.move.bindWithEvent(this));
    
    },
    
    /**
     * Method: enter
     * Method run when the cursor passes over an element with a tip
     * 
     * Parameters:
     * event - the event object
     * element - the element the cursor passed over
     */
    enter : function (event, element) {
        this.timer = $clear(this.timer);
        this.timer = (function () {
            this.domObj.setStyle('visibility', 'visible');
            this.position(event);
        }).delay(this.options.delay, this);
    },
    /**
     * Method: leave
     * Executed when the mouse moves out of an element with a tip
     * 
     * Parameters:
     * event - the event object
     * element - the element the cursor passed over
     */
    leave : function (event, element) {
        this.timer = $clear(this.timer);
        this.timer = (function () {
            this.domObj.setStyle('visibility', 'hidden');
        }).delay(this.options.delay, this);
    },
    /**
     * Method: move
     * Called when the mouse moves over an element with a tip.
     * 
     * Parameters:
     * event - the event object
     */
    move : function (event) {
        this.position(event);
    },
    /**
     * Method: position
     * Called to position the tooltip.
     * 
     * Parameters:
     * event - the event object
     */
    position : function (event) {
        //TODO: Adjust this to account for the viewport. How do we change the positioning
        //      near the edges?
        var size = window.getSize(), scroll = window.getScroll();
        var tip = {
            x : this.domObj.offsetWidth,
            y : this.domObj.offsetHeight
        };
        this.domObj.setStyle('top', (event.page.y + this.options.offsets.y));
        this.domObj.setStyle('left', (event.page.x + this.options.offsets.x));
    },
    /**
     * Method: detach
     * Called to manually remove a tooltip.
     */
    detach : function () {
        this.target.eliminate('Tip');
        this.domObj.dispose();
    }
});
 // $Id: $
/**
 * Class: Jx.Formatter
 * 
 * Extends: <Jx.Object>
 * 
 * Base class used for specific implementations to coerce data into specific formats
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Formatter = new Class({
    
    Extends: Jx.Object,
    
    /**
     * Constructor: Jx.Formatter
     * Initializes the formatter options. Can be overridden by 
     * child classes for more specific functionality
     * 
     * Parameters:
     * options - <Jx.Formatter.Options> and <Jx.Object.Options>
     */
    initialize: function (options) {
        this.parent(options);
    },
    /**
     * APIMethod: format
     * Empty method that must be overridden by subclasses to provide
     * the needed formatting functionality.
     */
    format: $empty
});// $Id: $
/**
 * Class: Jx.Formatter.Number
 * 
 * Extends: <Jx.Formatter>
 * 
 * This class formats numbers. You can have it do the following
 * 
 * o replace the decimal separator
 * o use/add a thousands separator
 * o change the precision (number of decimal places)
 * o format negative numbers with parenthesis
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Formatter.Number = new Class({
    
    Extends: Jx.Formatter,
    
    options: {
        /**
         * Option: decimalSeparator
         * Character to use as the decimal separator
         */
        decimalSeparator: '.',
        /**
         * Option: thousandSeparator
         * Character to use as the thousands separator
         */
        thousandsSeparator: ',',
        /**
         * Option: precision
         * The number of decimal places to round to
         */
        precision: 2,
        /**
         * Option: useParens
         * Whether negative numbers should be done with parenthesis
         */
        useParens: true,
        /**
         * Option: useThousands
         * Whether to use the thousands separator
         */
        useThousands: true
    },
    /**
     * APIMethod: format
     * Formats the provided number
     * 
     * Parameters:
     * value - the raw number to format
     */
    format : function (value) {
            //first set the decimal
        if (Jx.type(value) === 'string') {
                //remove commas from the string
            var p = value.split(',');
            value = p.join('');
            value = value.toFloat();
        }
        value = value.toFixed(this.options.precision);
        
        //split on the decimalSeparator
        var parts = value.split('.');
        var dec = true;
        if (parts.length === 1) {
            dec = false;
        }
        //check for negative
        var neg = false;
        var main;
        var ret = '';
        if (parts[0].contains('-')) {
            neg = true;
            main = parts[0].substring(1, parts[0].length);
        } else {
            main = parts[0];
        }
    
        if (this.options.useThousands) {
            var l = main.length;
            var left = l % 3;
            var j = 0;
            for (var i = 0; i < l; i++) {
                ret = ret + main.charAt(i);
                if (i === left - 1 && i !== l - 1) {
                    ret = ret + this.options.thousandsSeparator;
                } else if (i >= left) {
                    j++;
                    if (j === 3 && i !== l - 1) {
                        ret = ret + this.options.thousandsSeparator;
                        j = 0;
                    }
                }
    
            }
        } else {
            ret = parts[0];
        }
    
        if (dec) {
            ret = ret + this.options.decimalSeparator + parts[1];
        }
        if (neg && this.options.useParens) {
            ret = "(" + ret + ")";
        } else if (neg && !this.options.useParens) {
            ret = "-" + ret;
        }
    
        return ret;
    }
});// $Id: $
/**
 * Class: Jx.Formatter.Currency
 * 
 * Extends: <Jx.Formatter.Number>
 * 
 * This class formats numbers as US currency. It actually
 * runs the value through Jx.Formatter.Number first and then 
 * updates the returned value as currency.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Formatter.Currency = new Class({
    
    Extends: Jx.Formatter.Number,
    
    options: {
        /**
         * Option: sign
         * The sign to use for this currency. Defaults to
         * the US '$'.
         */
        sign: "$"
    },
    /**
     * APIMethod: format
     * Takes a number and formats it as currency.
     * 
     * Parameters:
     * value - the number to format
     */
    format: function (value) {

        this.options.precision = 2;

        value = this.parent(value);

        //check for negative
        var neg = false;
        if (value.contains('(') || value.contains('-')) {
            neg = true;
        }
    
        var ret;
        if (neg && !this.options.useParens) {
            ret = "-" + this.options.sign + value.substring(1, value.length);
        } else {
            ret = this.options.sign + value;
        }
    
        return ret;
    }
});// $Id: $
/**
 * Class: Jx.Formatter.Date
 * 
 * Extends: <Jx.Formatter>
 * 
 * This class formats dates using the mootools-more's 
 * Date extensions. See the -more docs for details of
 * supported formats for parsing and formatting.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Formatter.Date = new Class({
    
    Extends: Jx.Formatter,
    
    options: {
        /**
         * Option: format
         * The format to use. See the mootools-more Date
         * extension documentation for details on supported 
         * formats
         */
        format: '%B %d, %Y'
    },
    /**
     * APIMethod: format
     * Does the work of formatting dates
     * 
     * Parameters:
     * value - the text to format
     */
    format: function (value) {
        var d = Date.parse(value);
        return d.format(this.options.format);
    }
});// $Id: $
/**
 * Class: Jx.Formatter.Boolean
 * 
 * Extends: <Jx.Formatter>
 * 
 * This class formats boolean values. You supply the
 * text values for true and false in the options.
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Formatter.Boolean = new Class({
    
    Extends: Jx.Formatter,
    
    options: {
        /**
         * Option: true
         * The text to display for true values
         */
        'true': 'Yes',
        /**
         * Option: false
         * The text to display for false values
         */
        'false': 'No'
    },
    /**
     * APIMethod: format
     * Takes a value, determines boolean equivalent and 
     * displays the appropriate text value.
     * 
     * Parameters:
     * value - the text to format
     */
    format : function (value) {
        var b = false;
        var t = Jx.type(value);
        switch (t) {
        case 'string':
            if (value === 'true') {
                b = true;
            }
            break;
        case 'number':
            if (value !== 0) {
                b = true;
            }
            break;
        case 'boolean':
            b = value;
            break;
        default:
            b = true;
        }
        return b ? this.options['true'] : this.options['false'];
    }
    
});// $Id: $
/**
 * Class: Jx.Formatter.Phone
 * 
 * Extends: <Jx.Formatter>
 * 
 * Formats data as phone numbers. Currently only US-style phone numbers
 * are supported. 
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Formatter.Phone = new Class({
    
    Extends: Jx.Formatter,
    
    options: {
        /**
         * Option: useParens
         * Whether to use parenthesis () around the area code.
         * Defaults to true
         */
        useParens: true,
        /**
         * Option: separator
         * The character to use as a separator in the phone number. 
         * Defaults to a dash '-'.
         */
        separator: "-"
    },
    /**
     * APIMethod: format
     * Format the input as a phone number. This will strip all non-numeric
     * characters and apply the current default formatting
     * 
     * Parameters:
     * value - the text to format
     */
    format : function (value) {
        //first strip any non-numeric characters
        var sep = this.options.separator;
        var v = '' + value;
        v = v.replace(/[^0-9]/g, '');
    
        //now check the length. For right now, we only do US phone numbers
        var ret = '';
        if (v.length === 11) {
            //do everything including the leading 1
            ret = v.charAt(0);
            v = v.substring(1);
        }
        if (v.length === 10) {
            //do the area code
            if (this.options.useParens) {
                ret = ret + "(" + v.substring(0, 3) + ")";
            } else {
                ret = ret + sep + v.substring(0, 3) + sep;
            }
            v = v.substring(3);
        }
        //do the rest of the number
        ret = ret + v.substring(0, 3) + sep + v.substring(3);
        return ret;
    }
});// $Id: $
/**
 * Class: Jx.Form
 * 
 * Extends: <Jx.Widget>
 * 
 * A class that represents an HTML form. You add fields using either Jx.Form.add() 
 * or by using the field's .addTo() method. You can get all form values or set them 
 * using this class. It also handles validation of fields. 
 *    
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Form = new Class({
	
	Extends: Jx.Widget,
	
	options: {
        /**
         * Option: method
         * the method used to submit the form
         */
		method: 'post',
		/**
         * Option: action
         * where to submit it to
         */
		action: '',
		/**
         * Option: fileUpload
         * whether this form handles file uploads or not. 
         */
		fileUpload: false,
		/**
         * Option: id
         * the id of this form
         */
		id: null,
		/**
         * Option: formClass
         */
		formClass: null,
		/**
         * Option: name
         * the name property for the form
         */
		name: '',
		/**
         * Option: validationOptions
         * options for determining validation behavior. See docs for mootools-more's
         * FormValidator for valid options.
         */
		validationOptions: {
            validateOnSubmit: false
        },
        /**
         * Option: errors
         * Error object used to determine error message settings
         */
		errors: {
            /**
             * Option: showErrorMessages
             * How errors are shown. Values are 'together', 'individual', or 'both'.
             * If 'together' then all errors are shown at the top of the page. If
             * 'individual' then errors are only noted by the fields. 'both' will do both.
             * In any case, a class will be added to the invalid field that can be used
             * to style the field however you wish.
             */
		    showErrorMessages: 'together',
		    /**
		     * Option: messageStyle
		     * Determines how error messages are displayed. Values are
		     * either 'text', 'tip', or 'none'. 'text' shows the error in a span that 
		     * you can style. 'tip' shows just an icon that when hovered will
		     * pop up a tooltip with the error message. 'none' will not show
		     * any message so that the form's caller can handle errors. In any case,
		     * the input itself will have a class of 'jxFieldInvalid' added to it.
		     */
            messageStyle: 'text',
            /**
             * Option: displayError
             * Whether to display only a single error or all of them in the message.
             * Valid values are 'single' or 'all'.
             */
            displayError: 'all'
        }
	},

	/**
     * Property: fields
     * An array of all of the single fields (not contained in a fieldset) for this form
     */
    fields : new Hash(),
    /**
     * Property: validator
     * Holds a reference to the FormValidator instance
     */
    validator : null,
    /**
     * Property: errors
     * an array of error objects
     */
    errors : new Hash(),
    /**
     * Property: errorMessages
     * An element representing the error messages for this form.
     */
    errorMessages : null,

    /**
     * Constructor: Jx.Form
     * Constructs the form but does not add it to anything to be shown. The caller
     * should use form.addTo() to add the form to the DOM.
     * 
     * Parameters:
     * options - <Jx.Form.Options> and <Jx.Widget.Options>
     * 
     */
    initialize : function (options) {
        this.setOptions(options);

        //create the form first
        this.domObj = new Element('form', {
            'method' : this.options.method,
            'action' : this.options.action,
            'class' : 'jxForm',
            'name' : this.options.name
        });
        
        if (this.options.fileUpload) {
            this.domObj.set('enctype', 'multipart/form-data');
        }
        if ($defined(this.options.id)) {
            this.domObj.set('id', this.options.id);
        }
        if ($defined(this.options.formClass)) {
            this.domObj.addClass(this.options.formClass);
        }
    },

    /**
     * APIMethod: enableValidation
     * Call this method after adding the form to the DOM to enable
     * validation of the form
     * 
     */
    enableValidation : function () {
        this.validator = new FormValidator(this.domObj,
                this.options.validationOptions);
        this.validator.addEvents({
            'onElementValidate' : this.elementValidator.bind(this),
            'onElementPass' : this.elementPassed.bind(this),
            'onElementFail' : this.elementFailed.bind(this)
        });
    },

    /**
     * APIMethod: addField
     * Adds a <Jx.Field> subclass to this form's fields hash
     * 
     * Parameters:
     * field - <Jx.Field> to add
     */
    addField : function (field) {
        this.fields.set(field.id, field);
    },

    /**
     * Method: elementValidator
     * Event handler called when a specific element fails or passes
     * a specific validator. It is used to automatically add the error
     * to the field class and display errors is needed
     * 
     * Parameters:
     * isValid - {boolean} indicates whether validator passed or not
     * field - {Element} the element that was being validated
     * className - {string} the name of the validator
     * warn - {boolean} whether this should be a warning (not really used)
     */
    elementValidator : function (isValid, field, className, warn) {
        var validator = this.validator.getValidator(className);
        var fld = field.retrieve('field');
        var errors;
        if (!isValid && validator.getError(field)) {
            var err = validator.getError(field);
            fld.addError(err, className);
            if (!this.errors.has(fld.name)) {
                this.errors.set(fld.name, new Hash());
            }
            errors = this.errors.get(fld.name);
            errors.set(className, err);
        } else {
            fld.clearError(className);
            if (this.errors.has(fld.name)) {
                errors = this.errors.get(fld.name);
                if (errors.has(className)) {
                    errors.erase(className);
                }
                if ($defined(this.errorMessages)) {
                    this.showErrors();
                }
            }
        }
    },
    
    /**
     * Method: elementPassed
     * event handler for when a single element passes all validators
     * 
     * Parameters:
     * field - an Element representing the passed field
     */ 
    elementPassed : function (field) {
        var fld = field.retrieve('field');
        fld.clearErrors();
    },

    /**
     * Method: elementFailed
     * event handler for when a single element fails validation
     * 
     * Parameters:
     * field - an Element representing the failed field
     */
    elementFailed : function (field) {
        var fld = field.retrieve('field');
        fld.showErrors(this.options.errors);
    },

    /**
     * Method: isValid
     * Determines if the form passes validation
     * 
     * Parameters:
     * evt - the Mootools event object
     */
    isValid : function (evt) {
        var valid = this.validator.validate(evt);
        if (!valid) {
            this.showErrors();
        } else {
            this.clearErrors();
        }
        return valid;
    },

    /**
     * APIMethod: getValues
     * Gets the values of all the fields in the form as a Hash object. This 
     * uses the mootools function Element.toQueryString to get the values and 
     * will either return the values as a querystring or as an object (using 
     * mootools-more's String.parseQueryString method).
     * 
     * Parameters:
     * asQueryString - {boolean} indicates whether to return the value as a 
     *                  query string or an object.
     */
    getValues : function (asQueryString) {
        var queryString = this.domObj.toQueryString();
        if ($defined(asQueryString)) {
            return queryString;
        } else {
            return queryString.parseQueryString();
        }
    },
    /**
     * APIMethod: setValues
     * Used to set values on the form
     * 
     * Parameters:
     * values - A Hash of values to set keyed by field name.
     */
    setValues : function (values) {
        //TODO: This may have to change with change to getValues().
        if (Jx.type(values) === 'object') {
            values = new Hash(values);
        }
        this.fields.each(function (item) {
            item.setValue(values.get(item.name));
        }, this);
    },

    /**
     * APIMethod: showErrors
     * Displays all of the errors in the error object at the top of the form.
     */
    showErrors : function () {
        if (this.options.errors.showErrorMessages === 'together'
                || this.options.errors.showErrorMessages === 'both') {
            if ($defined(this.errorMessages)) {
                this.errorMessages.empty();
            } else {
                this.errorMessages = new Element('div', {
                    'id' : 'error-messages',
                    'class' : 'jxFormErrors'
                });
            }
            var errs = new Element('ul');
            this.errors.each(function (errors, name) {
                var nameEl = new Element('li', {
                    'html' : name
                });
                nameEl.inject(errs);
                var msgs = new Element('ul');
                msgs.inject(nameEl);
                errors.each(function (message) {
                    var li = new Element('li', {
                        'html' : message
                    });
                    li.inject(msgs);
                }, this);
            }, this);
            errs.inject(this.errorMessages);
            this.errorMessages.inject(this.domObj, 'top');
        }
        
    },
    /**
     * APIMethod: clearError
     * Clears the error message from the top of the form.
     */
    clearErrors : function () {
        if ($defined(this.errorMessages)) {
            this.errorMessages.dispose();
        }
        this.errors.empty();
    },

    /**
     * APIMethod: add
     * 
     * Parameters:
     * Pass as many parameters as you like. However, they should all be
     * <Jx.Field> objects.
     */
    add : function () {
        var field;
        for (var x = 0; x < arguments.length; x++) {
            field = arguments[x];
            //add form to the field and field to the form if not already there
            if (field instanceof Jx.Field && !$defined(field.form)) {
                field.form = this;
                this.addField(field);
            }
            this.domObj.grab(field);
        }
        return this;
    },
    
    /**
     * APIMethod: reset
     * 
     */
    reset : function () {
        this.fields.each(function (field, name) {
            field.reset();
        }, this);
        this.clearErrors();
    }
});
// $Id: $
/**
 * Class: Jx.Fieldset
 * 
 * Extends: <Jx.Widget>
 * 
 * This class represents a fieldset. It can be used to group fields together.
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 * 
 */
Jx.Fieldset = new Class({
	
    Extends : Jx.Widget,

    options : {
        /**
         * Option: legend
         * The text for the legend of a fieldset. Default is null
         * or no legend.
         */
        legend : null,
        /**
         * Option: id
         * The id to assign to this element
         */
        id : null,
        /**
         * Option: fieldsetClass
         * A CSS class to assign to the fieldset. Useful for custom styling of 
         * the element
         */
        fieldsetClass : null,
        /**
         * Option: legendClass
         * A CSS class to assign to the legend. Useful for custom styling of 
         * the element
         */
        legendClass : null,
        /**
         * Option: template
         * a template for how this element should be rendered
         */
        template : '<fieldset class="jxFieldset"><legend class="jxFieldsetLegend"></legend></fieldset>',
        /**
         * Option: form
         * The <Jx.Form> that this fieldset should be added to
         */
        form : null
    },
    /**
     * Property: legend
     * a holder for the legend Element
     */
    legend : null,
    
    /**
     * Constructor: Jx.Fieldset
     * Creates a fieldset.
     * 
     * Parameters: 
     * options - <Jx.Fieldset.Options> and <Jx.Widget.Options>
     */
    initialize : function (options) {
        this.parent(options);
    
        this.id = this.options.id;
    
        if ($defined(this.options.form)
                && this.options.form instanceof Jx.Form) {
            this.form = this.options.form;
        }
    
        var els = this.processTemplate(this.options.template, ['jxFieldset', 'jxFieldsetLegend']);
    
        //FIELDSET
        if (els.has('jxFieldset')) {
            this.domObj = els.get('jxFieldset');
            if ($defined(this.options.id)) {
                this.domObj.set('id', this.options.id);
            }
            if ($defined(this.options.fieldsetClass)) {
                this.domObj.addClass(this.options.fieldsetClass);
            }
        }
    
        if (els.has('jxFieldsetLegend')) {
            this.legend = els.get('jxFieldsetLegend');
            if ($defined(this.options.legend)) {
                this.legend.set('html', this.options.legend);
                if ($defined(this.options.legendClass)) {
                    this.legend.addClass(this.options.legendClass);
                }
            } else {
                this.legend.destroy();
            }
        }
    },
    /**
     * APIMethod: add
     * Adds fields to this fieldset
     * 
     * Parameters:
     * pass as many fields to this method as you like. They should be 
     * <Jx.Field> objects
     */
    add : function () {
        var field;
        for (var x = 0; x < arguments.length; x++) {
            field = arguments[x];
            //add form to the field and field to the form if not already there
            if (!$defined(field.form) && $defined(this.form)) {
                field.form = this.form;
                this.form.addField(field);
            }
            this.domObj.grab(field);
        }
        return this;
    }
});
// $Id: $
/**
 * Class: Jx.Field 
 *
 * Extends: <Jx.Widget>
 * 
 * This class is the base class for all form fields.
 * The class will also allow for displaying error messages generated by
 * form validation.
 * 
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Field = new Class({

    Extends : Jx.Widget,

    options : {
        /**
         * Option: id
         * The ID of the field.
         */
        id : null,
        /**
         * Option: name
         * The name of the field (used when submitting to the server). Will also be used for the
         * name attribute of the field. 
         */
        name : null,
        /**
         * Option: label
         * The text that goes next to the field. 
         */
        label : null,
        /**
         * Option: labelSeparator
         * A character to use as the separator between the label and the input. 
         * Make it an empty string for no separator. 
         */
        labelSeparator : ":",
        /**
         * Option: value
         * A default value to populate the field with. 
         */
        value : null,
        /**
         * Option: tag
         * a string to use as the HTML of the tag element (default is a
         * <span> element). 
         */
        tag : null,
        /**
         * Option: tip
         * A string that will eventually serve as a tooltip for an input field. 
         * Currently only implemented as OverText for text fields. 
         */
        tip : null,
        /**
         * Option: template
         * A string holding the template for the field.
         */
        template : null,
        /**
         * Option: containerClass
         * a CSS class that will be added to the containing element. 
         */
        containerClass : null,
        /**
         * Option: labelClass
         * a CSS to add to the label 
         */
        labelClass : null,
        /**
         * Option: fieldClass
         * a CSS class to add to the input field
         */
        fieldClass : null,
        /**
         * Option: tagClass
         * a CSS class to add to the tag field 
         */
        tagClass : null,
        /**
         * Option: validatorClasses
         * a string containing the validator information to add to the
         * field. See the mootools-more FormValidator and 
         * FormValidator.Extras documentation for documentation. Do not
         * add "required" if you need it. Set the required option instead.
         */
        validatorClasses : null,
        /**
         * Option: required
         * Whether the field is required. Setting this to true will trigger
         * the addition of a "required" validator class and the form
         * will not submit until it is filled in and validates. 
         */
        required : false,
        /**
         * Option: requiredText
         * Text to be displayed if a field is required. It is added as an
         * <em> element inside the <label>.
         */
        requiredText : '*',
        /**
         * Option: readonly
         * {True|False} defaults to false. Whether this field is readonly.
         */
        readonly : false,
        /**
         * Option: disabled
         * {True|False} defaults to false. Whether this field is disabled.
         */
        disabled : false

    },
    /**
     * Property: errorClass
     * The class to add to error elements
     */
    errorClass : 'jxFormErrorText',
    /**
     * Property: overtextOptions
     * The default options Jx uses for mootools-more's OverText
     * plugin
     */
    overtextOptions : {
        element : 'label'
    },

    /**
     * Property: field 
     * An element representing the input field itself.
     */
    field : null,
    /**
     * Property: label 
     * A reference to the label element for this field
     */
    label : null,
    /**
     * Property: tag 
     * A reference to the "tag" field of this input if available
     */
    tag : null,
    /**
     * Property: id 
     * The name of this field.
     */
    id : null,
    /**
     * Property: overText 
     * The overText instance for this field.
     */
    overText : null,
    /**
     * Property: type 
     * Indicates that this is a field type
     */
    type : 'field',
    /**
     * Property: classes 
     * The classes to search for in the template. Not
     * required, but we look for them.
     */
    classes : [ 'jxInputLabel', 'jxInputTag' ],
    /**
     * Property: errors 
     * A Hash to hold all of the validation errors for
     * the current field.
     */
    errors : new Hash(),

    /**
     * Constructor: Jx.Field
     * 
     * Parameters: 
     * options - <Jx.Field.Options> and <Jx.Widget.Options>
     */
    initialize : function (options) {
        this.parent(options);

        this.id = ($defined(this.options.id)) ? this.options.id : this
                .generateId();
        this.name = this.options.name;

        // first the container
        this.domObj = new Element('span', {
            'class' : 'jxInputContainer'
        });
        if ($defined(this.options.containerClass)) {
            this.domObj.addClass(this.options.containerClass);
        }
        if ($defined(this.options.required) && this.options.required) {
            this.domObj.addClass('jxFieldRequired');
            if ($defined(this.options.validatorClasses)) {
                this.options.validatorClasses = 'required ' + this.options.validatorClasses;
            } else {
                this.options.validatorClasses = 'required';
            }
        }

        var field = 'jxInput' + this.type;
        this.classes.push(field);
        var els = this.processTemplate(this.options.template,
                this.classes, this.domObj);

        // LABEL
        if (els.has('jxInputLabel')) {
            this.label = els.get('jxInputLabel');
            if ($defined(this.options.labelClass)) {
                this.label.addClass(this.options.labelClass);
            }
            if ($defined(this.options.label)) {
                this.label.set('html', this.options.label
                        + this.options.labelSeparator);
            }
            if ($defined(this.options.id)) {
                this.label.set('for', this.options.id);
            } else if ($defined(this.options.name)) {
                this.label.set('for', this.options.name);
            }
            if (this.options.required) {
                var em = new Element('em', {
                    'html' : this.options.requiredText,
                    'class' : 'required'
                });
                em.inject(this.label);
            }
        }

        // FIELD
        if (els.has(field)) {
            this.field = els.get(field);
            if ($defined(this.options.fieldClass)) {
                this.field.addClass(this.options.fieldClass);
            }

            if ($defined(this.options.value)) {
                this.field.set('value', this.options.value);
            }

            if ($defined(this.options.name)) {
                this.field.set('name', this.options.name);
            }

            if ($defined(this.options.id)) {
                this.field.set('id', this.options.id);
            }

            if ($defined(this.options.readonly)
                    && this.options.readonly) {
                this.field.set("readonly", "readonly");
                this.field.addClass('jxFieldReadonly'); 
            }

            if ($defined(this.options.disabled)
                    && this.options.disabled) {
                this.field.set("disabled", "disabled");
                this.field.addClass('jxFieldDisabled'); 
            }

            // add validator classes
            if ($defined(this.options.validatorClasses)) {
                this.field.addClass(this.options.validatorClasses);
            }

            this.field.store('field', this);
        }

        // TAG
        if (els.has('jxInputTag')) {
            this.tag = els.get('jxInputTag');
            if ($defined(this.options.tagClass)) {
                this.tag.addClass(this.options.tagClass);
            }
            if ($defined(this.options.tag)) {
                this.tag.set('html', this.options.tag);
            }
        }

        if ($defined(this.options.form)
                && this.options.form instanceof Jx.Form) {
            this.form = this.options.form;
            this.form.addField(this);
        }

    },
    /**
     * APIMethod: setValue Sets the value property of the field
     * 
     * Parameters: 
     * v - The value to set the field to.
     */
    setValue : function (v) {
        this.field.set('value', v);
    },

    /**
     * APIMethod: getValue 
     * Returns the current value of the field.
     */
    getValue : function () {
        return this.field.get("value");
    },

    /**
     * APIMethod: reset Sets the field back to the value passed in the
     * original options
     */
    reset : function () {
        this.field.set('value', this.options.value);
        this.clearErrors();
    },
    /**
     * APIMethod: disable
     * Disabled the field
     */
    disable : function () {
        this.field.set("disabled", "disabled");
        this.field.addClass('jxFieldDisabled');
    },
    /**
     * APIMethod: enable
     * Enables the field
     */
    enable : function () {
        this.field.erase("disabled");
        this.field.removeClass('jxFieldDisabled');
    },
    /**
     * APIMethod: addError
     * Adds an error to this field's errors hash
     */
    addError : function (error, validator) {
        this.errors.set(validator, error);
    },

    /**
     * APIMethod: showError
     * Called to display the assigned error messages.
     * 
     * Parameters: 
     * options - the error options from <Jx.Form>
     */
    showErrors : function (options) {

        if (options.displayError === 'none'
            || options.showErrorMessages === 'together') {
            return;
        }

        if ($defined(this.errorMessage)) {
            this.errorMessage.dispose();
        }

        var el = this.setupErrorMessage(options);
        if (options.messageStyle === 'text') {
            el.addClass(this.errorClass);
            el.inject(this.label);
            this.errorMessage = el;
        } else if (options.messageStyle === 'tip') {
            var icon = new Element('span', {
                'class' : 'jxFieldFeedback',
                'html' : '&nbsp;'
            });
            icon.inject(this.label);
            //setup tip
            if ($defined(this.tip)) {
                this.tip.detach();
                this.tip = null;
            }
            icon.addClass(this.errorClass);
            this.tip = new Jx.Tooltip(icon, el, {
                cssClass : 'jxFieldFeedbackTip'
            });
            this.errorMessage = icon;
        }

    },
    /**
     * Method: setupErrorMessage
     * Private method. Creates the Element containing the error message(s).
     */
    setupErrorMessage : function (options) {
        var wrapper = new Element('span', {
            'class' : 'jxFieldFeedback',
            'id' : this.field.name + '-error'
        });
        var errs = this.errors.getValues();
        if (options.displayError === 'single') {
            wrapper.set('html', errs[0]);
        } else {
            if (errs.length === 1) {
                wrapper.set('html', errs[0]);
            } else {
                var list = new Element('ul');
                errs.each(function (item) {
                    var li = new Element('li', {
                        'html' : item
                    });
                    li.inject(list);
                }, this);
                list.inject(wrapper);
            }
        }
        return wrapper;
    },

    /**
     * APIMethod: clearErrors
     * Used to clear any error messages when a reset is 
     * called for or the field passes validation after it had failed.
     */
    clearErrors : function () {
        this.errors.empty();
        if (this.field.hasClass('jxFieldInvalid')) {
            this.field.removeClass('jxFieldInvalid');
        }
        if ($defined(this.errorMessage)) {
            this.errorMessage.dispose();
        }
    },
    /**
     * APIMethod: clearError
     * Used to remove single error messages from the errors hash
     */
    clearError : function (className) {
        if (this.errors.has(className)) {
            this.errors.erase(className);
        }
    }

});
// $Id: $
/**
 * Class: Jx.Field.Check
 * 
 * Extends: <Jx.Field>
 * 
 * This class represents a radio input field.
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 * 
 */
Jx.Field.Checkbox = new Class({
    
    Extends : Jx.Field,

    options : {
        /**
         * Option: template
         * The template used for rendering this field
         */
        template : '<input class="jxInputCheck" type="checkbox"/><label class="jxInputLabel"></label><span class="jxInputTag"></span>',
        /**
         * Option: checked
         * Whether this field is checked or not
         */
        checked : false
    },
    /**
     * Property: type
     * The type of this field
     */
    type : 'Check',
    
    /**
     * Constructor: Jx.Field.Check 
     * Creates a checkbox input field.
     * 
     * Params: 
     * options - <Jx.Field.Checkbox.Options> and <Jx.Field.Options>
     */
    initialize : function (options, form) {
        this.parent(options, form);
    
        if ($defined(this.options.checked) && this.options.checked ) {
            if (Browser.Engine.trident && Browser.Engine.version === 6) {
                this.field.set("defaultChecked",true);
            } else {
                this.field.set("checked", "checked");
            }
        }
    
    },
    
    /**
     * APIMethod: setValue Sets the value property of the field
     * 
     * Parameters: v - The value to set the field to, "checked" if it should be checked.
     */
    setValue : function (v) {
        if (v === 'checked') {
            this.field.set('checked', "checked");
        } else {
            this.field.erase('checked');
        }
    },
    
    /**
     * APIMethod: getValue Returns the current value of the field. The field must be
     * "checked" in order to return a value. Otherwise it returns null.
     */
    getValue : function () {
        if (this.field.get("checked")) {
            return this.field.get("value");
        } else {
            return null;
        }
    },
    
    /**
     * APIMethod: reset
     * Sets the field back to the value passed in the original
     * options
     */
    reset : function () {
        if (this.options.checked) {
            this.field.set('checked', "checked");
        } else {
            this.field.erase('checked');
        }
    }
    
});
// $Id: $
/**
 * Class: Jx.Field.Hidden
 * 
 * Extends: <Jx.Field>
 * 
 * This class represents a hidden input field.
 *  
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Field.Hidden = new Class({
    
    Extends: Jx.Field,
    
    options: {
        /**
         * Option: template
         * The template used to render this field
         */
        template: '<input class="jxInputHidden" type="hidden" />'
    },
    /**
     * Property: type
     * The type of this field
     */
    type: 'Hidden',
    
    /**
     * Constructor: Jx.Field.Hidden
     * Creates a hidden input field.
     * 
     * Parameters:
     * options - <Jx.Field.Hidden.Options> and <Jx.Field.Options>
     */
    initialize: function (options) {
        this.parent(options);
        
    }
    
});




// $Id: $
/**
 * Class: Jx.Field.Radio
 * 
 * Extends: <Jx.Field>
 * 
 * This class represents a radio input field.
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Field.Radio = new Class({
    
    Extends: Jx.Field,
    
    options: {
        /**
         * Option: template
         * The template used to create this field
         */
        template: '<input class="jxInputRadio" type="radio" /><label class="jxInputLabel"></label><span class="jxInputTag"></span>',
        /**
         * Option: checked
         * whether this radio button is checked or not
         */
        checked: false,
        /**
         * Option: clickableLabel
         * Determines whether clicking the label also clicks the button
         */
        clickableLabel: true
    },
    /**
     * Property: type
     * What kind of field this is
     */
    type: 'Radio',
    
    /**
     * Constructor: Jx.Field.Radio
     * Creates a radiobutton input field.
     * 
     * Params:
     * options - <Jx.Field.Radio.Options> and <Jx.Field.Options>
     */
    initialize: function (options) {
        this.parent(options);
        
        if ($defined(this.options.checked) && this.options.checked) {
            this.field.checked = this.options.checked;
        }
        
        if (this.options.clickableLabel) {
            this.label.addEvent('click',this.onClick.bind(this));
            this.label.setStyle('cursor','pointer');
        }
        
    },
    
    /**
     * Method: onClick
     * calls the click function on the field when the label is clicked.
     */
    onClick: function () {
        this.field.click();
    },

    /**
     * APIMethod: setValue
     * Sets the value property of the field
     * 
     * Parameters:
     * v - The value to set the field to, "checked" it should be checked.
     */
    setValue: function (v) {
        if (v === 'checked') {
            this.field.set('checked', "checked");
        } else {
            this.field.erase('checked');
        } 
    },
    
    /**
     * APIMethod: getValue
     * Returns the current value of the field. The field must be "checked" 
     * in order to return a value. Otherwise it returns null.
     */
    getValue: function () {
        if (this.field.get("checked")) {
            return this.field.get("value");
        } else {
            return null;
        }
    },
    
    /**
     * Method: reset
     * Sets the field back to the value passed in the original
     * options
     */
    reset: function () {
        if (this.options.checked) {
            this.field.set('checked', "checked");
        } else {
            this.field.erase('checked');
        }
    }
    
});




// $Id: $
/**
 * Class: Jx.Field.Text
 * 
 * Extends: <Jx.Field>
 * 
 * This class represents a text input field.
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Field.Text = new Class({
    
    Extends: Jx.Field,
    
    options: {
        /**
         * Option: overText
         * an object holding options for mootools-more's OverText class. Leave it null to 
         * not enable it, make it an object to enable.
         */
        overText: null,
        /**
         * Option: template
         * The template used to render this field
         */
        template: '<label class="jxInputLabel"></label><input class="jxInputText" type="text" /><span class="jxInputTag"></span>'
    },
    /**
     * Property: type
     * The type of this field
     */
    type: 'Text',
    
    /**
     * Constructor: Jx.Field.Text
     * Creates a text input field.
     * 
     * Parameters:
     * options - <Jx.Field.Text.Options> and <Jx.Field.Options> 
     */
    initialize: function (options) {
        this.parent(options);
        
        //create the overText instance if needed
        if ($defined(this.options.overText)) {
            var opts = $extend({}, this.options.overText);
            this.field.set('alt', this.options.tip);
            this.overText = new OverText(this.field, opts);
            this.overText.show();
        }
        
    }
    
});// $Id: $
/**
 * Class: Jx.Field.Select
 * 
 * Extends: <Jx.Field>
 * 
 * This class represents a form select field.
 * 
 * These fields are rendered as below.
 * 
 * (code)
 * <div id='' class=''>
 *    <label for=''>A label for the field</label>
 *    <select id='' name=''>
 *      <option value='' selected=''>text</option>
 *    </select>
 * </div>
 * (end)
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 * 
 */

Jx.Field.Select = new Class({
    
    Extends: Jx.Field,
    
    options: {
        /**
         * Options: comboOpts
         * Optional, defaults to null. if not null, this should be an array of objects 
         * formated like [{value:'', selected: true|false, text:''},...]
         */
        comboOpts: null,
        /**
         * Option: template
         * The template for creating this select input
         */
        template: '<label class="jxInputLabel"></label><select class="jxInputSelect"></select><span class="jxInputTag"></span>'
    },
    /**
     * Property: type
     * Indictes this type of field.
     */
    type: 'Select',
    
    /**
     * Constructor: Jx.Field.Select
     * Creates a select field.
     * 
     * Parameters:
     * options - <Jx.Field.Select.Options> and <Jx.Field.Options>
     */
    initialize: function (options) {
        this.parent(options);
        
        if ($defined(this.options.comboOpts)) {
            this.options.comboOpts.each(function (item) {
                var opt = new Element('option', {
                    'value': item.value,
                    'html': item.text
                });
                if ($defined(item.selected) && item.selected) {
                    opt.set("selected", "selected");
                }
                this.field.grab(opt);
            }, this);
        }
    },
    
    /**
     * Method: setValue
     * Sets the value property of the field
     * 
     * Parameters:
     * v - The value to set the field to.
     */
    setValue: function (v) {
        //loop through the options and set the one that matches v
        this.field.options.each(function (opt) {
            if (opt.value === v) {
                document.id(opt).set("selected", true);
            }
        }, this);
    },
    
    /**
     * Method: getValue
     * Returns the current value of the field.
     */
    getValue: function () {
        var index = this.field.get("selectedIndex");
        return document.id(this.field.options[index]).get("value");
    }
});// $Id: $
/**
 * Class: Jx.Field.Textarea
 * 
 * Extends: <Jx.Field>
 * 
 * This class represents a textarea field.
 * 
 * These fields are rendered as below.
 * 
 * (code)
 * <div id='' class=''>
 *    <label for=''>A label for the field</label>
 *    <textarea id='' name='' rows='' cols=''>
 *      value/ext
 *    </textarea>
 * </div>
 * (end)
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 * 
 */
Jx.Field.Textarea = new Class({
    
    Extends: Jx.Field,
    
    options: {
        /**
         * Option: rows
         * the number of rows to show
         */
        rows: null,
        /**
         * Option: columns
         * the number of columns to show
         */
        columns: null,
        /**
         * Option: template
         * the template used to render this field
         */
        template: '<label class="jxInputLabel"></label><textarea class="jxInputTextarea"></textarea><span class="jxInputTag"></span>'
    },
    /**
     * Property: type
     * The type of field this is.
     */
    type: 'Textarea',
    /**
     * Property: errorClass
     * The class applied to error elements
     */
    errorClass: 'jxFormErrorTextarea',
    
    /**
     * Constructor: Jx.Field.Textarea
     * Creates the input.
     * 
     * Parameters:
     * options - <Jx.Field.Textarea.Options> and <Jx.Field.Options>
     */
    initialize: function (options) {
        this.parent(options);
                
        if ($defined(this.options.rows)) {
            this.field.set('rows', this.options.rows);
        }
        if ($defined(this.options.columns)) {
            this.field.set('cols', this.options.columns);
        }
        
        //TODO: Do we need to use OverText here as well??
        
    }
});/**
 * Class: Jx.Field.Button
 * 
 * Extends: <Jx.Field>
 * 
 * This class represents a button.
 * 
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2009, DM Solutions Group
 * 
 * This file is licensed under an MIT style license
 */
Jx.Field.Button = new Class({
    
    Extends: Jx.Field,
    
    options: {
        /**
         * Option: buttonOptions
         */
        buttonOptions: {},
        /**
         * Option: template
         * The template used to render this field
         */
        template: '<label class="jxInputLabel"></label><div class="jxInputButton"></div><span class="jxInputTag"></span>'
    },
    /**
     * Property: type
     * The type of this field
     */
    type: 'Button',
    
    /**
     * Constructor: Jx.Field.JxButton
     * Creates a button for use in a form.
     * 
     * Parameters:
     * options - <Jx.Field.Jx.Button.Options> and <Jx.Button.Options> 
     */
    initialize: function (options) {
        this.parent(options);
    },
    
    processTemplate: function(template, classes, container) {
        var h = this.parent(template, classes, container);
        var b = new Jx.Button(this.options.buttonOptions);
        var c = h.get('jxInputButton');
        if (c) {
            b.domObj.replaces(c);
        }
        return h;
    }
    
});