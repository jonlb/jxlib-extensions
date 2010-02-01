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
---

script: Core.js

description: The core of MooTools, contains all the base functions and the Native and Hash implementations. Required by all the other scripts.

license: MIT-style license.

copyright: Copyright (c) 2006-2008 [Valerio Proietti](http://mad4milk.net/).

authors: The MooTools production team (http://mootools.net/developers/)

inspiration:
- Class implementation inspired by [Base.js](http://dean.edwards.name/weblog/2006/03/base/) Copyright (c) 2006 Dean Edwards, [GNU Lesser General Public License](http://opensource.org/licenses/lgpl-license.php)
- Some functionality inspired by [Prototype.js](http://prototypejs.org) Copyright (c) 2005-2007 Sam Stephenson, [MIT License](http://opensource.org/licenses/mit-license.php)

provides: [Mootools, Native, Hash.base, Array.each, $util]

...
*/

var MooTools = {
	'version': '1.2.4',
	'build': '0d9113241a90b9cd5643b926795852a2026710d4'
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
---

script: Browser.js

description: The Browser Core. Contains Browser initialization, Window and Document, and the Browser Hash.

license: MIT-style license.

requires: 
- /Native
- /$util

provides: [Browser, Window, Document, $exec]

...
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
			return (!window.ActiveXObject) ? false : ((window.XMLHttpRequest) ? ((document.querySelectorAll) ? 6 : 5) : 4);
		},

		webkit: function(){
			return (navigator.taintEnabled) ? false : ((Browser.Features.xpath) ? ((Browser.Features.query) ? 525 : 420) : 419);
		},

		gecko: function(){
			return (!document.getBoxObjectFor && window.mozInnerScreenX == null) ? false : ((document.getElementsByClassName) ? 19 : 18);
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
	}, function(){
		return new ActiveXObject('Microsoft.XMLHTTP');
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
		if (Browser.Engine.trident) doc.window.attachEvent('onunload', function(){
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
---

script: Array.js

description: Contains Array Prototypes like each, contains, and erase.

license: MIT-style license.

requires:
- /$util
- /Array.each

provides: [Array]

...
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

	clean: function(){
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
---

script: Function.js

description: Contains Function Prototypes like create, bind, pass, and delay.

license: MIT-style license.

requires:
- /Native
- /$util

provides: [Function]

...
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
---

script: Number.js

description: Contains Number Prototypes like limit, round, times, and ceil.

license: MIT-style license.

requires:
- /Native
- /$util

provides: [Number]

...
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
---

script: String.js

description: Contains String Prototypes like camelCase, capitalize, test, and toInt.

license: MIT-style license.

requires:
- /Native

provides: [String]

...
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
---

script: Hash.js

description: Contains Hash Prototypes. Provides a means for overcoming the JavaScript practical impossibility of extending native Objects.

license: MIT-style license.

requires:
- /Hash.base

provides: [Hash]

...
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
---

script: Event.js

description: Contains the Event Class, to make the event object cross-browser.

license: MIT-style license.

requires:
- /Window
- /Document
- /Hash
- /Array
- /Function
- /String

provides: [Event]

...
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
---

script: Class.js

description: Contains the Class Function for easily creating, extending, and implementing reusable Classes.

license: MIT-style license.

requires:
- /$util
- /Native
- /Array
- /String
- /Function
- /Number
- /Hash

provides: [Class]

...
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
---

script: Class.Extras.js

description: Contains Utility Classes that can be implemented into your own Classes to ease the execution of many common tasks.

license: MIT-style license.

requires:
- /Class

provides: [Chain, Events, Options]

...
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
	return string.replace(/^on([A-Z])/, function(full, first){
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
---

script: Element.js

description: One of the most important items in MooTools. Contains the dollar function, the dollars function, and an handful of cross-browser, time-saver methods to let you easily work with HTML Elements.

license: MIT-style license.

requires:
- /Window
- /Document
- /Array
- /String
- /Function
- /Number
- /Hash

provides: [Element, Elements, $, $$, Iframe]

...
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
				if (el) returned.push(el);
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
	
	getSiblings: function(match, nocash){
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
---

script: Element.Event.js

description: Contains Element methods for dealing with events. This file also includes mouseenter and mouseleave custom Element Events.

license: MIT-style license.

requires: 
- /Element
- /Event

provides: [Element.Event]

...
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
---

script: Element.Style.js

description: Contains methods for interacting with the styles of Elements in a fashionable way.

license: MIT-style license.

requires:
- /Element

provides: [Element.Style]

...
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
---

script: Element.Dimensions.js

description: Contains methods to work with size, scroll, or positioning of Elements and the window object.

license: MIT-style license.

credits:
- Element positioning based on the [qooxdoo](http://qooxdoo.org/) code and smart browser fixes, [LGPL License](http://www.gnu.org/licenses/lgpl.html).
- Viewport dimensions based on [YUI](http://developer.yahoo.com/yui/) code, [BSD License](http://developer.yahoo.com/yui/license.html).

requires:
- /Element

provides: [Element.Dimensions]

...
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
				htmlScroll = html.getScroll(),
				elemScrolls = this.getScrolls(),
				elemScroll = this.getScroll(),
				isFixed = (styleString(this, 'position') == 'fixed');

			return {
				x: bound.left.toInt() + elemScrolls.x - elemScroll.x + ((isFixed) ? 0 : htmlScroll.x) - html.clientLeft,
				y: bound.top.toInt()  + elemScrolls.y - elemScroll.y + ((isFixed) ? 0 : htmlScroll.y) - html.clientTop
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
		var offset = this.getOffsets(),
				scroll = this.getScrolls();
		var position = {
			x: offset.x - scroll.x,
			y: offset.y - scroll.y
		};
		var relativePosition = (relative && (relative = document.id(relative))) ? relative.getPosition() : {x: 0, y: 0};
		return {x: position.x - relativePosition.x, y: position.y - relativePosition.y};
	},

	getCoordinates: function(element){
		if (isBody(this)) return this.getWindow().getCoordinates();
		var position = this.getPosition(element),
				size = this.getSize();
		var obj = {
			left: position.x,
			top: position.y,
			width: size.x,
			height: size.y
		};
		obj.right = obj.left + obj.width;
		obj.bottom = obj.top + obj.height;
		return obj;
	},

	computePosition: function(obj){
		return {
			left: obj.x - styleNumber(this, 'margin-left'),
			top: obj.y - styleNumber(this, 'margin-top')
		};
	},

	setPosition: function(obj){
		return this.setStyles(this.computePosition(obj));
	}

});


Native.implement([Document, Window], {

	getSize: function(){
		if (Browser.Engine.presto || Browser.Engine.webkit){
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
---

script: Selectors.js

description: Adds advanced CSS-style querying capabilities for targeting HTML Elements. Includes pseudo selectors.

license: MIT-style license.

requires:
- /Element

provides: [Selectors]

...
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
		return (self.className && self.className.contains && self.className.contains(klass, ' '));
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
---

script: DomReady.js

description: Contains the custom event domready.

license: MIT-style license.

requires:
- /Element.Event

provides: [DomReady]

...
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
	
	window.addEvent('load', domready);

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
		document.addEvent('DOMContentLoaded', domready);
	}

})();
/*
---

script: JSON.js

description: JSON encoder and decoder.

license: MIT-style license.

See Also: <http://www.json.org/>

requires:
- /Array
- /String
- /Number
- /Function
- /Hash

provides: [JSON]

...
*/

var JSON = new Hash(this.JSON && {
	stringify: JSON.stringify,
	parse: JSON.parse
}).extend({
	
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
---

script: Cookie.js

description: Class for creating, reading, and deleting browser Cookies.

license: MIT-style license.

credits:
- Based on the functions by Peter-Paul Koch (http://quirksmode.org).

requires:
- /Options

provides: [Cookie]

...
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
---

script: Swiff.js

description: Wrapper for embedding SWF movies. Supports External Interface Communication.

license: MIT-style license.

credits: 
- Flash detection & Internet Explorer + Flash Player 9 fix inspired by SWFObject.

requires:
- /Options
- /$util

provides: [Swiff]

...
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
---

script: Fx.js

description: Contains the basic animation logic to be extended by all other Fx Classes.

license: MIT-style license.

requires:
- /Chain
- /Events
- /Options

provides: [Fx]

...
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
---

script: Fx.CSS.js

description: Contains the CSS animation logic. Used by Fx.Tween, Fx.Morph, Fx.Elements.

license: MIT-style license.

requires:
- /Fx
- /Element.Style

provides: [Fx.CSS]

...
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
---

script: Fx.Tween.js

description: Formerly Fx.Style, effect to transition any CSS property for an element.

license: MIT-style license.

requires: 
- /Fx.CSS

provides: [Fx.Tween, Element.fade, Element.highlight]

...
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
---

script: Fx.Morph.js

description: Formerly Fx.Styles, effect to transition any number of CSS properties for an element using an object of rules, or CSS based selector rules.

license: MIT-style license.

requires:
- /Fx.CSS

provides: [Fx.Morph]

...
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
---

script: Fx.Transitions.js

description: Contains a set of advanced transitions to be used with any of the Fx Classes.

license: MIT-style license.

credits:
- Easing Equations by Robert Penner, <http://www.robertpenner.com/easing/>, modified and optimized to be used with MooTools.

requires:
- /Fx

provides: [Fx.Transitions]

...
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
---

script: Request.js

description: Powerful all purpose Request Class. Uses XMLHTTPRequest.

license: MIT-style license.

requires:
- /Element
- /Chain
- /Events
- /Options
- /Browser

provides: [Request]

...
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
		var data = options.data, url = String(options.url), method = options.method.toLowerCase();

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
---

script: Request.HTML.js

description: Extends the basic Request Class with additional methods for interacting with HTML responses.

license: MIT-style license.

requires:
- /Request
- /Element

provides: [Request.HTML]

...
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
---

script: Request.JSON.js

description: Extends the basic Request Class with additional methods for sending and receiving JSON data.

license: MIT-style license.

requires:
- /Request JSON

provides: [Request.HTML]

...
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
/*
---

script: More.js

description: MooTools More

license: MIT-style license

authors:
- Guillermo Rauch
- Thomas Aylott
- Scott Kyle

requires:
- core:1.2.4/MooTools

provides: [MooTools.More]

...
*/

MooTools.More = {
	'version': '1.2.4.1'
};/*
---

script: Log.js

description: Provides basic logging functionality for plugins to implement.

license: MIT-style license

authors:
- Guillermo Rauch
- Thomas Aylott
- Scott Kyle

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Log]

...
*/

(function(){

var global = this;

var log = function(){
	if (global.console && console.log){
		try {
			console.log.apply(console, arguments);
		} catch(e) {
			console.log(Array.slice(arguments));
		}
	} else {
		Log.logged.push(arguments);
	}
	return this;
};

var disabled = function(){
	this.logged.push(arguments);
	return this;
};

this.Log = new Class({
	
	logged: [],
	
	log: disabled,
	
	resetLog: function(){
		this.logged.empty();
		return this;
	},

	enableLog: function(){
		this.log = log;
		this.logged.each(function(args){
			this.log.apply(this, args);
		}, this);
		return this.resetLog();
	},

	disableLog: function(){
		this.log = disabled;
		return this;
	}
	
});

Log.extend(new Log).enableLog();

// legacy
Log.logger = function(){
	return this.log.apply(this, arguments);
};

})();/*
---

script: Depender.js

description: A stand alone dependency loader for the MooTools library.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Events
- core:1.2.4/Request.JSON
- /MooTools.More
- /Log

provides: Depender

...
*/

var Depender = {

	options: {
		/* 
		onRequire: $empty(options),
		onRequirementLoaded: $empty([scripts, options]),
		onScriptLoaded: $empty({
			script: script, 
			totalLoaded: percentOfTotalLoaded, 
			loaded: scriptsState
		}),
		serial: false,
		target: null,
		noCache: false,
		log: false,*/
		loadedSources: [],
		loadedScripts: ['Core', 'Browser', 'Array', 'String', 'Function', 'Number', 'Hash', 'Element', 'Event', 'Element.Event', 'Class', 'DomReady', 'Class.Extras', 'Request', 'JSON', 'Request.JSON', 'More', 'Depender', 'Log'],
		useScriptInjection: true
	},

	loaded: [],

	sources: {},

	libs: {},

	include: function(libs){
		this.log('include: ', libs);
		this.mapLoaded = false;
		var loader = function(data){
			this.libs = $merge(this.libs, data);
			$each(this.libs, function(data, lib){
				if (data.scripts) this.loadSource(lib, data.scripts);
			}, this);
		}.bind(this);
		if ($type(libs) == 'string'){
			this.log('fetching libs ', libs);
			this.request(libs, loader);
		} else {
			loader(libs);
		}
		return this;
	},

	required: [],

	require: function(options){
		var loaded = function(){
			var scripts = this.calculateDependencies(options.scripts);
			if (options.sources){
				options.sources.each(function(source){
					scripts.combine(this.libs[source].files);
				}, this);
			}
			if (options.serial) scripts.combine(this.getLoadedScripts());
			options.scripts = scripts;
			this.required.push(options);
			this.fireEvent('require', options);
			this.loadScripts(options.scripts);
		};
		if (this.mapLoaded){
			loaded.call(this);
		} else {
			this.addEvent('mapLoaded', function(){
				loaded.call(this);
				this.removeEvent('mapLoaded', arguments.callee);
			});
		}
		return this;
	},

	cleanDoubleSlash: function(str){
		if (!str) return str;
		var prefix = '';
		if (str.test(/^http:\/\//)){
			prefix = 'http://';
			str = str.substring(7, str.length);
		}
		str = str.replace(/\/\//g, '/');
		return prefix + str;
	},

	request: function(url, callback){
		new Request.JSON({
			url: url,
			secure: false,
			onSuccess: callback
		}).send();
	},

	loadSource: function(lib, source){
		if (this.libs[lib].files){
			this.dataLoaded();
			return;
		}
		this.log('loading source: ', source);
		this.request(this.cleanDoubleSlash(source + '/scripts.json'), function(result){
			this.log('loaded source: ', source);
			this.libs[lib].files = result;
			this.dataLoaded();
		}.bind(this));
	},

	dataLoaded: function(){
		var loaded = true;
		$each(this.libs, function(v, k){
			if (!this.libs[k].files) loaded = false;
		}, this);
		if (loaded){
			this.mapTree();
			this.mapLoaded = true;
			this.calculateLoaded();
			this.lastLoaded = this.getLoadedScripts().getLength();
			this.fireEvent('mapLoaded');
		}
	},

	calculateLoaded: function(){
		var set = function(script){
			this.scriptsState[script] = true;
		}.bind(this);
		if (this.options.loadedScripts) this.options.loadedScripts.each(set);
		if (this.options.loadedSources){
			this.options.loadedSources.each(function(lib){
				$each(this.libs[lib].files, function(dir){
					$each(dir, function(data, file){
						set(file);
					}, this);
				}, this);
			}, this);
		}
	},

	deps: {},

	pathMap: {},

	mapTree: function(){
		$each(this.libs, function(data, source){
			$each(data.files, function(scripts, folder){
				$each(scripts, function(details, script){
					var path = source + ':' + folder + ':' + script;
					if (this.deps[path]) return;
					this.deps[path] = details.deps;
					this.pathMap[script] = path;
				}, this);
			}, this);
		}, this);
	},

	getDepsForScript: function(script){
		return this.deps[this.pathMap[script]] || [];
	},

	calculateDependencies: function(scripts){
		var reqs = [];
		$splat(scripts).each(function(script){
			if (script == 'None' || !script) return;
			var deps = this.getDepsForScript(script);
			if (!deps){
				if (window.console && console.warn) console.warn('dependencies not mapped: script: %o, map: %o, :deps: %o', script, this.pathMap, this.deps);
			} else {
				deps.each(function(scr){
					if (scr == script || scr == 'None' || !scr) return;
					if (!reqs.contains(scr)) reqs.combine(this.calculateDependencies(scr));
					reqs.include(scr);
				}, this);
			}
			reqs.include(script);
		}, this);
		return reqs;
	},

	getPath: function(script){
		try {
			var chunks = this.pathMap[script].split(':');
			var lib = this.libs[chunks[0]];
			var dir = (lib.path || lib.scripts) + '/';
			chunks.shift();
			return this.cleanDoubleSlash(dir + chunks.join('/') + '.js');
		} catch(e){
			return script;
		}
	},

	loadScripts: function(scripts){
		scripts = scripts.filter(function(s){
			if (!this.scriptsState[s] && s != 'None'){
				this.scriptsState[s] = false;
				return true;
			}
		}, this);
		if (scripts.length){
			scripts.each(function(scr){
				this.loadScript(scr);
			}, this);
		} else {
			this.check();
		}
	},

	toLoad: [],

	loadScript: function(script){
		if (this.scriptsState[script] && this.toLoad.length){
			this.loadScript(this.toLoad.shift());
			return;
		} else if (this.loading){
			this.toLoad.push(script);
			return;
		}
		var finish = function(){
			this.loading = false;
			this.scriptLoaded(script);
			if (this.toLoad.length) this.loadScript(this.toLoad.shift());
		}.bind(this);
		var error = function(){
			this.log('could not load: ', scriptPath);
		}.bind(this);
		this.loading = true;
		var scriptPath = this.getPath(script);
		if (this.options.useScriptInjection){
			this.log('injecting script: ', scriptPath);
			var loaded = function(){
				this.log('loaded script: ', scriptPath);
				finish();
			}.bind(this);
			new Element('script', {
				src: scriptPath + (this.options.noCache ? '?noCache=' + new Date().getTime() : ''),
				events: {
					load: loaded,
					readystatechange: function(){
						if (['loaded', 'complete'].contains(this.readyState)) loaded();
					},
					error: error
				}
			}).inject(this.options.target || document.head);
		} else {
			this.log('requesting script: ', scriptPath);
			new Request({
				url: scriptPath,
				noCache: this.options.noCache,
				onComplete: function(js){
					this.log('loaded script: ', scriptPath);
					$exec(js);
					finish();
				}.bind(this),
				onFailure: error,
				onException: error
			}).send();
		}
	},

	scriptsState: $H(),
	
	getLoadedScripts: function(){
		return this.scriptsState.filter(function(state){
			return state;
		});
	},

	scriptLoaded: function(script){
		this.log('loaded script: ', script);
		this.scriptsState[script] = true;
		this.check();
		var loaded = this.getLoadedScripts();
		var loadedLength = loaded.getLength();
		var toLoad = this.scriptsState.getLength();
		this.fireEvent('scriptLoaded', {
			script: script,
			totalLoaded: (loadedLength / toLoad * 100).round(),
			currentLoaded: ((loadedLength - this.lastLoaded) / (toLoad - this.lastLoaded) * 100).round(),
			loaded: loaded
		});
		if (loadedLength == toLoad) this.lastLoaded = loadedLength;
	},

	lastLoaded: 0,

	check: function(){
		var incomplete = [];
		this.required.each(function(required){
			var loaded = [];
			required.scripts.each(function(script){
				if (this.scriptsState[script]) loaded.push(script);
			}, this);
			if (required.onStep){
				required.onStep({
					percent: loaded.length / required.scripts.length * 100,
					scripts: loaded
				});
			};
			if (required.scripts.length != loaded.length) return;
			required.callback();
			this.required.erase(required);
			this.fireEvent('requirementLoaded', [loaded, required]);
		}, this);
	}

};

$extend(Depender, new Events);
$extend(Depender, new Options);
$extend(Depender, new Log);

Depender._setOptions = Depender.setOptions;
Depender.setOptions = function(){
	Depender._setOptions.apply(Depender, arguments);
	if (this.options.log) Depender.enableLog();
	return this;
};
/*
---

script: MooTools.Lang.js

description: Provides methods for localization.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Events
- /MooTools.More

provides: [MooTools.Lang]

...
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
---

script: Class.Refactor.js

description: Extends a class onto itself with new property, preserving any items attached to the class's namespace.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Class.refactor]

...
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
---

script: Class.Binds.js

description: Automagically binds specified methods in a class to the instance of the class.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Class
- /MooTools.More

provides: [Class.Binds]

...
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
};
/*
---

script: Class.Occlude.js

description: Prevents a class from being applied to a DOM element twice.

license: MIT-style license.

authors:
- Aaron Newton

requires: 
- core/1.2.4/Class
- core:1.2.4/Element
- /MooTools.More

provides: [Class.Occlude]

...
*/

Class.Occlude = new Class({

	occlude: function(property, element){
		element = document.id(element || this.element);
		var instance = element.retrieve(property || this.property);
		if (instance && !$defined(this.occluded))
			return this.occluded = instance;

		this.occluded = false;
		element.store(property || this.property, this);
		return this.occluded;
	}

});/*
---

script: Chain.Wait.js

description: value, Adds a method to inject pauses between chained events.

license: MIT-style license.

authors:
- Aaron Newton

requires: 
- core:1.2.4/Chain 
- core:1.2.4/Element
- core:1.2.4/Fx
- /MooTools.More

provides: [Chain.Wait]

...
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

})();/*
---

script: Array.Extras.js

description: Extends the Array native object to include useful methods to work with arrays.

license: MIT-style license

authors:
- Christoph Pojer

requires:
- core:1.2.4/Array

provides: [Array.Extras]

...
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
---

script: Date.English.US.js

description: Date messages for US English.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Lang
- /Date

provides: [Date.English.US]

...
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
	weekAgo: '1 week ago',
	weeksAgo: '{delta} weeks ago',
	monthAgo: '1 month ago',
	monthsAgo: '{delta} months ago',
	yearAgo: '1 year ago',
	yearsAgo: '{delta} years ago',
	lessThanMinuteUntil: 'less than a minute from now',
	minuteUntil: 'about a minute from now',
	minutesUntil: '{delta} minutes from now',
	hourUntil: 'about an hour from now',
	hoursUntil: 'about {delta} hours from now',
	dayUntil: '1 day from now',
	daysUntil: '{delta} days from now',
	weekUntil: '1 week from now',
	weeksUntil: '{delta} weeks from now',
	monthUntil: '1 month from now',
	monthsUntil: '{delta} months from now',
	yearUntil: '1 year from now',
	yearsUntil: '{delta} years from now'

});
/*
---

script: Date.js

description: Extends the Date native object to include methods useful in managing dates.

license: MIT-style license

authors:
- Aaron Newton
- Nicholas Barthelemy - https://svn.nbarthelemy.com/date-js/
- Harald Kirshner - mail [at] digitarald.de; http://digitarald.de
- Scott Kyle - scott [at] appden.com; http://appden.com

requires:
- core:1.2.4/Array
- core:1.2.4/String
- core:1.2.4/Number
- core:1.2.4/Lang
- core:1.2.4/Date.English.US
- /MooTools.More

provides: [Date]

...
*/

(function(){

var Date = this.Date;

if (!Date.now) Date.now = $time;

Date.Methods = {
	ms: 'Milliseconds',
	year: 'FullYear',
	min: 'Minutes',
	mo: 'Month',
	sec: 'Seconds',
	hr: 'Hours'
};

['Date', 'Day', 'FullYear', 'Hours', 'Milliseconds', 'Minutes', 'Month', 'Seconds', 'Time', 'TimezoneOffset',
	'Week', 'Timezone', 'GMTOffset', 'DayOfYear', 'LastMonth', 'LastDayOfMonth', 'UTCDate', 'UTCDay', 'UTCFullYear',
	'AMPM', 'Ordinal', 'UTCHours', 'UTCMilliseconds', 'UTCMinutes', 'UTCMonth', 'UTCSeconds'].each(function(method){
	Date.Methods[method.toLowerCase()] = method;
});

var pad = function(what, length){
	return new Array(length - String(what).length + 1).join('0') + what;
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

	diff: function(date, resolution){
		if ($type(date) == 'string') date = Date.parse(date);
		
		return ((date - this) / Date.units[resolution || 'day'](3, 3)).toInt(); // non-leap year, 30-day month
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
		return ((off > 0) ? '-' : '+') + pad((off.abs() / 60).floor(), 2) + pad(off % 60, 2);
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
			function($0, $1){
				switch ($1){
					case 'a': return Date.getMsg('days')[d.get('day')].substr(0, 3);
					case 'A': return Date.getMsg('days')[d.get('day')];
					case 'b': return Date.getMsg('months')[d.get('month')].substr(0, 3);
					case 'B': return Date.getMsg('months')[d.get('month')];
					case 'c': return d.toString();
					case 'd': return pad(d.get('date'), 2);
					case 'H': return pad(d.get('hr'), 2);
					case 'I': return ((d.get('hr') % 12) || 12);
					case 'j': return pad(d.get('dayofyear'), 3);
					case 'm': return pad((d.get('mo') + 1), 2);
					case 'M': return pad(d.get('min'), 2);
					case 'o': return d.get('ordinal');
					case 'p': return Date.getMsg(d.get('ampm'));
					case 'S': return pad(d.get('seconds'), 2);
					case 'U': return pad(d.get('week'), 2);
					case 'w': return d.get('day');
					case 'x': return d.format(Date.getMsg('shortDate'));
					case 'X': return d.format(Date.getMsg('shortTime'));
					case 'y': return d.get('year').toString().substr(2);
					case 'Y': return d.get('year');
					case 'T': return d.get('GMTOffset');
					case 'Z': return d.get('Timezone');
				}
				return $1;
			}
		);
	},

	toISOString: function(){
		return this.format('iso8601');
	}

});

Date.alias('toISOString', 'toJSON');
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

var parsePatterns = [];
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
		return ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
	},

	parse: function(from){
		var t = $type(from);
		if (t == 'number') return new Date(from);
		if (t != 'string') return from;
		from = from.clean();
		if (!from.length) return null;

		var parsed;
		parsePatterns.some(function(pattern){
			var bits = pattern.re.exec(from);
			return (bits) ? (parsed = pattern.handler(bits)) : false;
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
		var utcSeconds = Date.UTC(
			localDate.get('year'),
			localDate.get('mo'),
			localDate.get('date'),
			localDate.get('hr'),
			localDate.get('min'),
			localDate.get('sec')
		);
		return new Date(utcSeconds);
	},

	orderIndex: function(unit){
		return Date.getMsg('dateOrder').indexOf(unit) + 1;
	},

	defineFormat: function(name, format){
		formats[name] = format;
	},

	defineFormats: function(formats){
		for (var name in formats) Date.defineFormat(name, formats[name]);
	},

	parsePatterns: parsePatterns, // this is deprecated
	
	defineParser: function(pattern){
		parsePatterns.push((pattern.re && pattern.handler) ? pattern : build(pattern));
	},
	
	defineParsers: function(){
		Array.flatten(arguments).each(Date.defineParser);
	},
	
	define2DigitYearStart: function(year){
		startYear = year % 100;
		startCentury = year - startYear;
	}

});

var startCentury = 1900;
var startYear = 70;

var regexOf = function(type){
	return new RegExp('(?:' + Date.getMsg(type).map(function(name){
		return name.substr(0, 3);
	}).join('|') + ')[a-z]*');
};

var replacers = function(key){
	switch(key){
		case 'x': // iso8601 covers yyyy-mm-dd, so just check if month is first
			return ((Date.orderIndex('month') == 1) ? '%m[.-/]%d' : '%d[.-/]%m') + '([.-/]%y)?';
		case 'X':
			return '%H([.:]%M)?([.:]%S([.:]%s)?)? ?%p? ?%T?';
	}
	return null;
};

var keys = {
	d: /[0-2]?[0-9]|3[01]/,
	H: /[01]?[0-9]|2[0-3]/,
	I: /0?[1-9]|1[0-2]/,
	M: /[0-5]?\d/,
	s: /\d+/,
	o: /[a-z]*/,
	p: /[ap]\.?m\.?/,
	y: /\d{2}|\d{4}/,
	Y: /\d{4}/,
	T: /Z|[+-]\d{2}(?::?\d{2})?/
};

keys.m = keys.I;
keys.S = keys.M;

var currentLanguage;

var recompile = function(language){
	currentLanguage = language;
	
	keys.a = keys.A = regexOf('days');
	keys.b = keys.B = regexOf('months');
	
	parsePatterns.each(function(pattern, i){
		if (pattern.format) parsePatterns[i] = build(pattern.format);
	});
};

var build = function(format){
	if (!currentLanguage) return {format: format};
	
	var parsed = [];
	var re = (format.source || format) // allow format to be regex
	 .replace(/%([a-z])/gi,
		function($0, $1){
			return replacers($1) || $0;
		}
	).replace(/\((?!\?)/g, '(?:') // make all groups non-capturing
	 .replace(/ (?!\?|\*)/g, ',? ') // be forgiving with spaces and commas
	 .replace(/%([a-z%])/gi,
		function($0, $1){
			var p = keys[$1];
			if (!p) return $1;
			parsed.push($1);
			return '(' + p.source + ')';
		}
	).replace(/\[a-z\]/gi, '[a-z\\u00c0-\\uffff]'); // handle unicode words

	return {
		format: format,
		re: new RegExp('^' + re + '$', 'i'),
		handler: function(bits){
			bits = bits.slice(1).associate(parsed);
			var date = new Date().clearTime();
			if ('d' in bits) handle.call(date, 'd', 1);
			if ('m' in bits) handle.call(date, 'm', 1);
			for (var key in bits) handle.call(date, key, bits[key]);
			return date;
		}
	};
};

var handle = function(key, value){
	if (!value) return this;

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
			if (value < 100) value += startCentury + (value < startYear ? 100 : 0);
			return this.set('year', value);
		case 'T':
			if (value == 'Z') value = '+00';
			var offset = value.match(/([+-])(\d{2}):?(\d{2})?/);
			offset = (offset[1] + '1') * (offset[2] * 60 + (+offset[3] || 0)) + this.getTimezoneOffset();
			return this.set('time', this - offset * 60000);
	}

	return this;
};

Date.defineParsers(
	'%Y([-./]%m([-./]%d((T| )%X)?)?)?', // "1999-12-31", "1999-12-31 11:59pm", "1999-12-31 23:59:59", ISO8601
	'%Y%m%d(T%H(%M%S?)?)?', // "19991231", "19991231T1159", compact
	'%x( %X)?', // "12/31", "12.31.99", "12-31-1999", "12/31/2008 11:59 PM"
	'%d%o( %b( %Y)?)?( %X)?', // "31st", "31st December", "31 Dec 1999", "31 Dec 1999 11:59pm"
	'%b( %d%o)?( %Y)?( %X)?', // Same as above with month and day switched
	'%Y %b( %d%o( %X)?)?' // Same as above with year coming first
);

MooTools.lang.addEvent('langChange', function(language){
	if (MooTools.lang.get('Date')) recompile(language);
}).fireEvent('langChange', MooTools.lang.getCurrentLanguage());

})();/*
---

script: Date.Extras.js

description: Extends the Date native object to include extra methods (on top of those in Date.js).

license: MIT-style license

authors:
- Aaron Newton
- Scott Kyle

requires:
- /Date

provides: [Date.Extras]

...
*/

Date.implement({

	timeDiffInWords: function(relative_to){
		return Date.distanceOfTimeInWords(this, relative_to || new Date);
	},

	timeDiff: function(to, joiner){
		if (to == null) to = new Date;
		var delta = ((to - this) / 1000).toInt();
		if (!delta) return '0s';
		
		var durations = {s: 60, m: 60, h: 24, d: 365, y: 0};
		var duration, vals = [];
		
		for (var step in durations){
			if (!delta) break;
			if ((duration = durations[step])){
				vals.unshift((delta % duration) + step);
				delta = (delta / duration).toInt();
			} else {
				vals.unshift(delta + step);
			}
		}
		
		return vals.join(joiner || ':');
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
		
		var units = {
			minute: 60,
			hour: 60,
			day: 24,
			week: 7,
			month: 52 / 12,
			year: 12,
			eon: Infinity
		};
		
		var msg = 'lessThanMinute';
		
		for (var unit in units){
			var interval = units[unit];
			if (delta < 1.5 * interval){
				if (delta > 0.75 * interval) msg = unit;
				break;
			}
			delta /= interval;
			msg = unit + 's';
		}
		
		return Date.getMsg(msg + suffix).substitute({delta: delta.round()});
	}

});


Date.defineParsers(

	{
		// "today", "tomorrow", "yesterday"
		re: /^(?:tod|tom|yes)/i,
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
---

script: Hash.Extras.js

description: Extends the Hash native object to include getFromPath which allows a path notation to child elements.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Hash.base
- /MooTools.More

provides: [Hash.Extras]

...
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
---

script: String.Extras.js

description: Extends the String native object to include methods useful in managing various kinds of strings (query strings, urls, html, etc).

license: MIT-style license

authors:
- Aaron Newton
- Guillermo Rauch

requires:
- core:1.2.4/String
- core:1.2.4/$util
- core:1.2.4/Array

provides: [String.Extras]

...
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

var getRegForTag = function(tag, contents) {
	tag = tag || '';
	var regstr = contents ? "<" + tag + "[^>]*>([\\s\\S]*?)<\/" + tag + ">" : "<\/?" + tag + "([^>]+)?>";
	reg = new RegExp(regstr, "gi");
	return reg;
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
		var pad = (str == null ? ' ' : '' + str).repeat(length - this.length).substr(0, length - this.length);
		if (!dir || dir == 'right') return this + pad;
		if (dir == 'left') return pad + this;
		return pad.substr(0, (pad.length / 2).floor()) + this + pad.substr(0, (pad.length / 2).ceil());
	},

	getTags: function(tag, contents){
		return this.match(getRegForTag(tag, contents)) || [];
	},

	stripTags: function(tag, contents){
		return this.replace(getRegForTag(tag, contents), '');
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
---

script: String.QueryString.js

description: Methods for dealing with URI query strings.

license: MIT-style license

authors:
- Sebastian Markbåge, Aaron Newton, Lennart Pilon, Valerio Proietti

requires:
- core:1.2.4/Array
- core:1.2.4/String
- /MooTools.More

provides: [String.QueryString]

...
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
---

script: URI.js

description: Provides methods useful in managing the window location and uris.

license: MIT-style license

authors:
- Sebastian Markb�ge
- Aaron Newton

requires:
- core:1.2.4/Selectors
- /String.QueryString

provides: URI

...
*/

var URI = new Class({

	Implements: Options,

	options: {
		/*base: false*/
	},

	regex: /^(?:(\w+):)?(?:\/\/(?:(?:([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)?(\.\.?$|(?:[^?#\/]*\/)*)([^?#]*)(?:\?([^#]*))?(?:#(.*))?/,
	parts: ['scheme', 'user', 'password', 'host', 'port', 'directory', 'file', 'query', 'fragment'],
	schemes: {http: 80, https: 443, ftp: 21, rtsp: 554, mms: 1755, file: 0},

	initialize: function(uri, options){
		this.setOptions(options);
		var base = this.options.base || URI.base;
		if(!uri) uri = base;
		
		if (uri && uri.parsed) this.parsed = $unlink(uri.parsed);
		else this.set('value', uri.href || uri.toString(), base ? new URI(base) : false);
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
		return this.parsed[part] || '';
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
		if (typeof values == 'string'){
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

URI.prototype.toString = URI.prototype.valueOf = function(){
	return this.get('value');
};

URI.regs = {
	endSlash: /\/$/,
	scheme: /^(\w+):/,
	directoryDot: /\.\/|\.$/
};

URI.base = new URI(document.getElements('base[href]', true).getLast(), {base: document.location});

String.implement({

	toURI: function(options){
		return new URI(this, options);
	}

});/*
---

script: URI.Relative.js

description: Extends the URI class to add methods for computing relative and absolute urls.

license: MIT-style license

authors:
- Sebastian Markbåge


requires:
- /Class.refactor
- /URI

provides: [URI.Relative]

...
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
---

script: Element.Forms.js

description: Extends the Element native object to include methods useful in managing inputs.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element
- /MooTools.More

provides: [Element.Forms]

...
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
			var offset = value.length;
			dup.moveToElementText(this);
			dup.setEndPoint('StartToEnd', range);
			if(dup.text.length) offset -= value.match(/[\n\r]*$/)[0].length;
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
---

script: Elements.From.js

description: Returns a collection of elements from a string of html.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element
- /MooTools.More

provides: [Elements.from]

...
*/

Elements.from = function(text, excludeScripts){
	if ($pick(excludeScripts, true)) text = text.stripScripts();

	var container, match = text.match(/^\s*<(t[dhr]|tbody|tfoot|thead)/i);

	if (match){
		container = new Element('table');
		var tag = match[1].toLowerCase();
		if (['td', 'th', 'tr'].contains(tag)){
			container = new Element('tbody').inject(container);
			if (tag != 'tr') container = new Element('tr').inject(container);
		}
	}

	return (container || new Element('div')).set('html', text).getChildren();
};/*
---

script: Element.Delegation.js

description: Extends the Element native object to include the delegate method for more efficient event management.

credits:
- "Event checking based on the work of Daniel Steigerwald. License: MIT-style license.	Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
- Aaron Newton
- Daniel Steigerwald

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Selectors
- /MooTools.More

provides: [Element.Delegation]

...
*/
(function(){
	
	var match = /(.*?):relay\(([^)]+)\)$/,
		combinators = /[+>~\s]/,
		splitType = function(type){
			var bits = type.match(match);
			return !bits ? {event: type} : {
				event: bits[1],
				selector: bits[2]
			};
		},
		check = function(e, selector){
			var t = e.target;
			if (combinators.test(selector = selector.trim())){
				var els = this.getElements(selector);
				for (var i = els.length; i--; ){
					var el = els[i];
					if (t == el || el.hasChild(t)) return el;
				}
			} else {
				for ( ; t && t != this; t = t.parentNode){
					if (Element.match(t, selector)) return document.id(t);
				}
			}
			return null;
		};

	var oldAddEvent = Element.prototype.addEvent,
		oldRemoveEvent = Element.prototype.removeEvent;
		
	Element.implement({

		addEvent: function(type, fn){
			var splitted = splitType(type);
			if (splitted.selector){
				var monitors = this.retrieve('$moo:delegateMonitors', {});
				if (!monitors[type]){
					var monitor = function(e){
						var el = check.call(this, e, splitted.selector);
						if (el) this.fireEvent(type, [e, el], 0, el);
					}.bind(this);
					monitors[type] = monitor;
					oldAddEvent.call(this, splitted.event, monitor);
				}
			}
			return oldAddEvent.apply(this, arguments);
		},

		removeEvent: function(type, fn){
			var splitted = splitType(type);
			if (splitted.selector){
				var events = this.retrieve('events');
				if (!events || !events[type] || (fn && !events[type].keys.contains(fn))) return this;

				if (fn) oldRemoveEvent.apply(this, [type, fn]);
				else oldRemoveEvent.apply(this, type);

				events = this.retrieve('events');
				if (events && events[type] && events[type].length == 0){
					var monitors = this.retrieve('$moo:delegateMonitors', {});
					oldRemoveEvent.apply(this, [splitted.event, monitors[type]]);
					delete monitors[type];
				}
				return this;
			}

			return oldRemoveEvent.apply(this, arguments);
		},

		fireEvent: function(type, args, delay, bind){
			var events = this.retrieve('events');
			if (!events || !events[type]) return this;
			events[type].keys.each(function(fn){
				fn.create({bind: bind || this, delay: delay, arguments: args})();
			}, this);
			return this;
		}

	});

})();/*
---

script: Element.Measure.js

description: Extends the Element native object to include methods useful in measuring dimensions.

credits: "Element.measure / .expose methods by Daniel Steigerwald License: MIT-style license. Copyright: Copyright (c) 2008 Daniel Steigerwald, daniel.steigerwald.cz"

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Style
- core:1.2.4/Element.Dimensions
- /MooTools.More

provides: [Element.Measure]

...
*/

Element.implement({

	measure: function(fn){
		var vis = function(el) {
			return !!(!el || el.offsetHeight || el.offsetWidth);
		};
		if (vis(this)) return fn.apply(this);
		var parent = this.getParent(),
			restorers = [],
			toMeasure = []; 
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
		var parent = this.getParent('body');
		if (parent && this.getStyle('display') == 'none'){
			dim = this.measure(function(){
				return getSize(this, options);
			});
		} else if (parent){
			try { //safari sometimes crashes here, so catch it
				dim = getSize(this, options);
			}catch(e){}
		} else {
			dim = {x: 0, y: 0};
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
			size['total' + capitalized] = size['computed' + capitalized] = 0;
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
---

script: Element.Pin.js

description: Extends the Element native object to include the pin method useful for fixed positioning for elements.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Element.Dimensions
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Element.Pin]

...
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
			
			var p,
					scroll = window.getScroll();
			if (enable !== false){
				p = this.getPosition();
				if (!this.retrieve('pinned')){
					var pos = {
						top: p.y - scroll.y,
						left: p.x - scroll.x
					};
					if (supportsPositionFixed){
						this.setStyle('position', 'fixed').setStyles(pos);
					} else {
						this.store('pinnedByJS', true);
						this.setStyles({
							position: 'absolute',
							top: p.y,
							left: p.x
						}).addClass('isPinned');
						this.store('scrollFixer', (function(){
							if (this.retrieve('pinned'))
								var scroll = window.getScroll();
								this.setStyles({
									top: pos.top.toInt() + scroll.y,
									left: pos.left.toInt() + scroll.x
								});
						}).bind(this));
						window.addEvent('scroll', this.retrieve('scrollFixer'));
					}
					this.store('pinned', true);
				}
			} else {
				var op;
				if (!Browser.Engine.trident){
					var parent = this.getParent();
					op = (parent.getComputedStyle('position') != 'static' ? parent : parent.getOffsetParent());
				}
				p = this.getPosition(op);
				this.store('pinned', false);
				var reposition;
				if (supportsPositionFixed && !this.retrieve('pinnedByJS')){
					reposition = {
						top: p.y + scroll.y,
						left: p.x + scroll.x
					};
				} else {
					this.store('pinnedByJS', false);
					window.removeEvent('scroll', this.retrieve('scrollFixer'));
					reposition = {
						top: p.y,
						left: p.x
					};
				}
				this.setStyles($merge(reposition, {position: 'absolute'})).removeClass('isPinned');
			}
			return this;
		},

		unpin: function(){
			return this.pin(false);
		},

		togglepin: function(){
			this.pin(!this.retrieve('pinned'));
		}

	});

})();/*
---

script: Element.Position.js

description: Extends the Element native object to include methods useful positioning elements relative to others.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Dimensions
- /Element.Measure

provides: [Elements.Position]

...
*/

(function(){

var original = Element.prototype.position;

Element.implement({

	position: function(options){
		//call original position if the options are x/y values
		if (options && ($defined(options.x) || $defined(options.y))) return original ? original.apply(this, arguments) : this;
		$each(options||{}, function(v, k){ if (!$defined(v)) delete options[k]; });
		options = $merge({
			// minimum: { x: 0, y: 0 },
			// maximum: { x: 0, y: 0},
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
			ignoreScroll: false,
			allowNegative: false
		}, options);
		//compute the offset of the parent positioned element if this element is in one
		var parentOffset = {x: 0, y: 0}, 
				parentPositioned = false;
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
			parentPositioned = offsetParent != document.id(options.relativeTo);
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
		var rel = document.id(options.relativeTo) || document.body,
				calc = rel == document.body ? window.getScroll() : rel.getPosition(),
				top = calc.y, left = calc.x;

		var scrolls = rel.getScrolls();
		top += scrolls.y;
		left += scrolls.x;

		var dim = this.getDimensions({computeSize: true, styles:['padding', 'border','margin']});
		var pos = {},
				prefY = options.offset.y,
				prefX = options.offset.x,
				winSize = window.getSize();
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
					edgeOffset.x = -(dim.totalWidth/2);
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
					edgeOffset.y = -(dim.totalHeight/2);
					break;
			}
			pos.x += edgeOffset.x;
			pos.y += edgeOffset.y;
		}
		pos = {
			left: ((pos.x >= 0 || parentPositioned || options.allowNegative) ? pos.x : 0).toInt(),
			top: ((pos.y >= 0 || parentPositioned || options.allowNegative) ? pos.y : 0).toInt()
		};
		var xy = {left: 'x', top: 'y'};
		['minimum', 'maximum'].each(function(minmax) {
			['left', 'top'].each(function(lr) {
				var val = options[minmax] ? options[minmax][xy[lr]] : null;
				if (val != null && pos[lr] < val) pos[lr] = val;
			});
		});
		if (rel.getStyle('position') == 'fixed' || options.relFixedPosition){
			var winScroll = window.getScroll();
			pos.top+= winScroll.y;
			pos.left+= winScroll.x;
		}
		if (options.ignoreScroll) {
			var relScroll = rel.getScroll();
			pos.top-= relScroll.y;
			pos.left-= relScroll.x;
		}
		if (options.ignoreMargins) {
			pos.left += (
				options.edge.x == 'right' ? dim['margin-right'] : 
				options.edge.x == 'center' ? -dim['margin-left'] + ((dim['margin-right'] + dim['margin-left'])/2) : 
					- dim['margin-left']
			);
			pos.top += (
				options.edge.y == 'bottom' ? dim['margin-bottom'] : 
				options.edge.y == 'center' ? -dim['margin-top'] + ((dim['margin-bottom'] + dim['margin-top'])/2) : 
					- dim['margin-top']
			);
		}
		pos.left = Math.ceil(pos.left);
		pos.top = Math.ceil(pos.top);
		if (options.returnPos) return pos;
		else this.setStyles(pos);
		return this;
	}

});

})();/*
---

script: Element.Shortcuts.js

description: Extends the Element native object to include some shortcut methods.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Element.Shortcuts]

...
*/

Element.implement({

	isDisplayed: function(){
		return this.getStyle('display') != 'none';
	},

	isVisible: function(){
		var w = this.offsetWidth,
			h = this.offsetHeight;
		return (w == 0 && h == 0) ? false : (w > 0 && h > 0) ? true : this.isDisplayed();
	},

	toggle: function(){
		return this[this.isDisplayed() ? 'hide' : 'show']();
	},

	hide: function(){
		var d;
		try {
			// IE fails here if the element is not in the dom
			if ((d = this.getStyle('display')) == 'none') d = null;
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
---

script: IframeShim.js

description: Defines IframeShim, a class for obscuring select lists and flash objects in IE.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- core:1.2.4/Options Events
- /Element.Position
- /Class.Occlude

provides: [IframeShim]

...
*/

var IframeShim = new Class({

	Implements: [Options, Events, Class.Occlude],

	options: {
		className: 'iframeShim',
		src: 'javascript:false;document.write("");',
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
				src: this.options.src,
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
			if (IframeShim.ready) window.addEvent('load', inject);
			else inject();
		} else {
			this.position = this.hide = this.show = this.dispose = $lambda(this);
		}
	},

	position: function(){
		if (!IframeShim.ready || !this.shim) return this;
		var size = this.element.measure(function(){ 
			return this.getSize(); 
		});
		if (this.options.margin != undefined){
			size.x = size.x - (this.options.margin * 2);
			size.y = size.y - (this.options.margin * 2);
			this.options.offset.x += this.options.margin;
			this.options.offset.y += this.options.margin;
		}
		this.shim.set({width: size.x, height: size.y}).position({
			relativeTo: this.element,
			offset: this.options.offset
		});
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
---

script: Mask.js

description: Creates a mask element to cover another.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Element.Event
- /Class.Binds
- /Element.Position
- /IframeShim

provides: [Mask]

...
*/

var Mask = new Class({

	Implements: [Options, Events],

	Binds: ['resize'],

	options: {
		// onShow: $empty,
		// onHide: $empty,
		// onDestroy: $empty,
		// onClick: $empty,
		//inject: {
		//  where: 'after',
		//  target: null,
		//},
		// hideOnClick: false,
		// id: null,
		// destroyOnHide: false,
		style: {},
		'class': 'mask',
		maskMargins: false,
		useIframeShim: true
	},

	initialize: function(target, options){
		this.target = document.id(target) || document.body;
		this.target.store('mask', this);
		this.setOptions(options);
		this.render();
		this.inject();
	},
	
	render: function() {
		this.element = new Element('div', {
			'class': this.options['class'],
			id: this.options.id || 'mask-' + $time(),
			styles: $merge(this.options.style, {
				display: 'none'
			}),
			events: {
				click: function(){
					this.fireEvent('click');
					if (this.options.hideOnClick) this.hide();
				}.bind(this)
			}
		});
		this.hidden = true;
	},

	toElement: function(){
		return this.element;
	},

	inject: function(target, where){
		where = where || this.options.inject ? this.options.inject.where : '' || this.target == document.body ? 'inside' : 'after';
		target = target || this.options.inject ? this.options.inject.target : '' || this.target;
		this.element.inject(target, where);
		if (this.options.useIframeShim) {
			this.shim = new IframeShim(this.element);
			this.addEvents({
				show: this.shim.show.bind(this.shim),
				hide: this.shim.hide.bind(this.shim),
				destroy: this.shim.destroy.bind(this.shim)
			});
		}
	},

	position: function(){
		this.resize(this.options.width, this.options.height);
		this.element.position({
			relativeTo: this.target,
			position: 'topLeft',
			ignoreMargins: !this.options.maskMargins,
			ignoreScroll: this.target == document.body
		});
		return this;
	},

	resize: function(x, y){
		var opt = {
			styles: ['padding', 'border']
		};
		if (this.options.maskMargins) opt.styles.push('margin');
		var dim = this.target.getComputedSize(opt);
		if (this.target == document.body) {
			var win = window.getSize();
			if (dim.totalHeight < win.y) dim.totalHeight = win.y;
			if (dim.totalWidth < win.x) dim.totalWidth = win.x;
		}
		this.element.setStyles({
			width: $pick(x, dim.totalWidth, dim.x),
			height: $pick(y, dim.totalHeight, dim.y)
		});
		return this;
	},

	show: function(){
		if (!this.hidden) return this;
		this.target.addEvent('resize', this.resize);
		if (this.target != document.body) document.id(document.body).addEvent('resize', this.resize);
		this.position();
		this.showMask.apply(this, arguments);
		return this;
	},

	showMask: function(){
		this.element.setStyle('display', 'block');
		this.hidden = false;
		this.fireEvent('show');
	},

	hide: function(){
		if (this.hidden) return this;
		this.target.removeEvent('resize', this.resize);
		this.hideMask.apply(this, arguments);
		if (this.options.destroyOnHide) return this.destroy();
		return this;
	},

	hideMask: function(){
		this.element.setStyle('display', 'none');
		this.hidden = true;
		this.fireEvent('hide');
	},

	toggle: function(){
		this[this.hidden ? 'show' : 'hide']();
	},

	destroy: function(){
		this.hide();
		this.element.destroy();
		this.fireEvent('destroy');
		this.target.eliminate('mask');
	}

});

Element.Properties.mask = {

	set: function(options){
		var mask = this.retrieve('mask');
		return this.eliminate('mask').store('mask:options', options);
	},

	get: function(options){
		if (options || !this.retrieve('mask')){
			if (this.retrieve('mask')) this.retrieve('mask').destroy();
			if (options || !this.retrieve('mask:options')) this.set('mask', options);
			this.store('mask', new Mask(this, this.retrieve('mask:options')));
		}
		return this.retrieve('mask');
	}

};

Element.implement({

	mask: function(options){
		this.get('mask', options).show();
		return this;
	},

	unmask: function(){
		this.get('mask').hide();
		return this;
	}

});/*
---

script: Spinner.js

description: Adds a semi-transparent overlay over a dom element with a spinnin ajax icon.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Fx.Tween
- /Class.refactor
- /Mask

provides: [Spinner]

...
*/

var Spinner = new Class({

	Extends: Mask,

	options: {
		/*message: false,*/
		'class':'spinner',
		containerPosition: {},
		content: {
			'class':'spinner-content'
		},
		messageContainer: {
			'class':'spinner-msg'
		},
		img: {
			'class':'spinner-img'
		},
		fxOptions: {
			link: 'chain'
		}
	},

	initialize: function(){
		this.parent.apply(this, arguments);
		this.target.store('spinner', this);

		//add this to events for when noFx is true; parent methods handle hide/show
		var deactivate = function(){ this.active = false; }.bind(this);
		this.addEvents({
			hide: deactivate,
			show: deactivate
		});
	},

	render: function(){
		this.parent();
		this.element.set('id', this.options.id || 'spinner-'+$time());
		this.content = document.id(this.options.content) || new Element('div', this.options.content);
		this.content.inject(this.element);
		if (this.options.message) {
			this.msg = document.id(this.options.message) || new Element('p', this.options.messageContainer).appendText(this.options.message);
			this.msg.inject(this.content);
		}
		if (this.options.img) {
			this.img = document.id(this.options.img) || new Element('div', this.options.img);
			this.img.inject(this.content);
		}
		this.element.set('tween', this.options.fxOptions);
	},

	show: function(noFx){
		if (this.active) return this.chain(this.show.bind(this));
		if (!this.hidden) {
			this.callChain.delay(20, this);
			return this;
		}
		this.active = true;
		return this.parent(noFx);
	},

	showMask: function(noFx){
		var pos = function(){
			this.content.position($merge({
				relativeTo: this.element
			}, this.options.containerPosition));
		}.bind(this);
		if (noFx) {
			this.parent();
			pos();
		} else {
			this.element.setStyles({
				display: 'block',
				opacity: 0
			}).tween('opacity', this.options.style.opacity || 0.9);
			pos();
			this.hidden = false;
			this.fireEvent('show');
			this.callChain();
		}
	},

	hide: function(noFx){
		if (this.active) return this.chain(this.hide.bind(this));
		if (this.hidden) {
			this.callChain.delay(20, this);
			return this;
		}
		this.active = true;
		return this.parent();
	},

	hideMask: function(noFx){
		if (noFx) return this.parent();
		this.element.tween('opacity', 0).get('tween').chain(function(){
			this.element.setStyle('display', 'none');
			this.hidden = true;
			this.fireEvent('hide');
			this.callChain();
		}.bind(this));
	},

	destroy: function(){
		this.content.destroy();
		this.parent();
		this.target.eliminate('spinner');
	}

});

Spinner.implement(new Chain);

if (window.Request) {
	Request = Class.refactor(Request, {
		options: {
			useSpinner: false,
			spinnerOptions: {},
			spinnerTarget: false
		},
		initialize: function(options){
			this._send = this.send;
			this.send = function(options){
				if (this.spinner) this.spinner.chain(this._send.bind(this, options)).show();
				else this._send(options);
				return this;
			};
			this.previous(options);
			var update = document.id(this.options.spinnerTarget) || document.id(this.options.update);
			if (this.options.useSpinner && update) {
				this.spinner = update.get('spinner', this.options.spinnerOptions);
				['onComplete', 'onException', 'onCancel'].each(function(event){
					this.addEvent(event, this.spinner.hide.bind(this.spinner));
				}, this);
			}
		}
	});
}

Element.Properties.spinner = {

	set: function(options){
		var spinner = this.retrieve('spinner');
		return this.eliminate('spinner').store('spinner:options', options);
	},

	get: function(options){
		if (options || !this.retrieve('spinner')){
			if (this.retrieve('spinner')) this.retrieve('spinner').destroy();
			if (options || !this.retrieve('spinner:options')) this.set('spinner', options);
			new Spinner(this, this.retrieve('spinner:options'));
		}
		return this.retrieve('spinner');
	}

};

Element.implement({

	spin: function(options){
		this.get('spinner', options).show();
		return this;
	},

	unspin: function(){
		var opt = Array.link(arguments, {options: Object.type, callback: Function.type});
		this.get('spinner', opt.options).hide(opt.callback);
		return this;
	}

});/*
---

script: Form.Request.js

description: Handles the basic functionality of submitting a form and updating a dom element with the result.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Event
- core:1.2.4/Request.HTML
- /Class.Binds
- /Class.Occlude
- /Spinner
- /String.QueryString

provides: [Form.Request]

...
*/

if (!window.Form) window.Form = {};

(function(){

	Form.Request = new Class({

		Binds: ['onSubmit', 'onFormValidate'],

		Implements: [Options, Events, Class.Occlude],

		options: {
			//onFailure: $empty,
			//onSuccess: #empty, //aliased to onComplete,
			//onSend: $empty
			requestOptions: {
				evalScripts: true,
				useSpinner: true,
				emulation: false,
				link: 'ignore'
			},
			extraData: {},
			resetForm: true
		},

		property: 'form.request',

		initialize: function(form, update, options) {
			this.element = document.id(form);
			if (this.occlude()) return this.occluded;
			this.update = document.id(update);
			this.setOptions(options);
			this.makeRequest();
			if (this.options.resetForm) {
				this.request.addEvent('success', function(){
					$try(function(){ this.element.reset(); }.bind(this));
					if (window.OverText) OverText.update();
				}.bind(this));
			}
			this.attach();
		},

		toElement: function() {
			return this.element;
		},

		makeRequest: function(){
			this.request = new Request.HTML($merge({
					url: this.element.get('action'),
					update: this.update,
					emulation: false,
					spinnerTarget: this.element,
					method: this.element.get('method') || 'post'
			}, this.options.requestOptions)).addEvents({
				success: function(text, xml){
					['success', 'complete'].each(function(evt){
						this.fireEvent(evt, [this.update, text, xml]);
					}, this);
				}.bind(this),
				failure: function(xhr){
					this.fireEvent('failure', xhr);
				}.bind(this),
				exception: function(){
					this.fireEvent('failure', xhr);
				}.bind(this)
			});
		},

		attach: function(attach){
			attach = $pick(attach, true);
			method = attach ? 'addEvent' : 'removeEvent';
			
			var fv = this.element.retrieve('validator');
			if (fv) fv[method]('onFormValidate', this.onFormValidate);
			if (!fv || !attach) this.element[method]('submit', this.onSubmit);
		},

		detach: function(){
			this.attach(false);
		},

		//public method
		enable: function(){
			this.attach();
		},

		//public method
		disable: function(){
			this.detach();
		},

		onFormValidate: function(valid, form, e) {
			if (valid || !fv.options.stopOnFailure) {
				if (e && e.stop) e.stop();
				this.send();
			}
		},

		onSubmit: function(e){
			if (this.element.retrieve('validator')) {
				//form validator was created after Form.Request
				this.detach();
				this.addFormEvent();
				return;
			}
			e.stop();
			this.send();
		},

		send: function(){
			var str = this.element.toQueryString().trim();
			var data = $H(this.options.extraData).toQueryString();
			if (str) str += "&" + data;
			else str = data;
			this.fireEvent('send', [this.element, str]);
			this.request.send({data: str});
			return this;
		}

	});

	Element.Properties.formRequest = {

		set: function(){
			var opt = Array.link(arguments, {options: Object.type, update: Element.type, updateId: String.type});
			var update = opt.update || opt.updateId;
			var updater = this.retrieve('form.request');
			if (update) {
				if (updater) updater.update = document.id(update);
				this.store('form.request:update', update);
			}
			if (opt.options) {
				if (updater) updater.setOptions(opt.options);
				this.store('form.request:options', opt.options);
			}
			return this;
		},

		get: function(){
			var opt = Array.link(arguments, {options: Object.type, update: Element.type, updateId: String.type});
			var update = opt.update || opt.updateId;
			if (opt.options || update || !this.retrieve('form.request')){
				if (opt.options || !this.retrieve('form.request:options')) this.set('form.request', opt.options);
				if (update) this.set('form.request', update);
				this.store('form.request', new Form.Request(this, this.retrieve('form.request:update'), this.retrieve('form.request:options')));
			}
			return this.retrieve('form.request');
		}

	};

	Element.implement({

		formUpdate: function(update, options){
			this.get('form.request', update, options).send();
			return this;
		}

	});

})();/*
---

script: Fx.Reveal.js

description: Defines Fx.Reveal, a class that shows and hides elements with a transition.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Fx.Morph
- /Element.Shortcuts
- /Element.Measure

provides: [Fx.Reveal]

...
*/

Fx.Reveal = new Class({

	Extends: Fx.Morph,

	options: {/*	  
		onShow: $empty(thisElement),
		onHide: $empty(thisElement),
		onComplete: $empty(thisElement),
		heightOverride: null,
		widthOverride: null, */
		link: 'cancel',
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
					this.hiding = this.hidden =  false;
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
	},

	cancel: function(){
		this.parent.apply(this, arguments);
		this.hidding = false;
		this.showing = false;
	}

});

Element.Properties.reveal = {

	set: function(options){
		var reveal = this.retrieve('reveal');
		if (reveal) reveal.cancel();
		return this.eliminate('reveal').store('reveal:options', options);
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
---

script: Form.Request.Append.js

description: Handles the basic functionality of submitting a form and updating a dom element with the result. The result is appended to the DOM element instead of replacing its contents.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Form.Request
- /Fx.Reveal
- /Elements.from

provides: [Form.Request.Append]

...
*/

Form.Request.Append = new Class({

	Extends: Form.Request,

	options: {
		//onBeforeEffect: $empty,
		useReveal: true,
		revealOptions: {},
		inject: 'bottom'
	},

	makeRequest: function(){
		this.request = new Request.HTML($merge({
				url: this.element.get('action'),
				method: this.element.get('method') || 'post',
				spinnerTarget: this.element
			}, this.options.requestOptions, {
				evalScripts: false
			})
		).addEvents({
			success: function(tree, elements, html, javascript){
				var container;
				var kids = Elements.from(html);
				if (kids.length == 1) {
					container = kids[0];
				} else {
					 container = new Element('div', {
						styles: {
							display: 'none'
						}
					}).adopt(kids);
				}
				container.inject(this.update, this.options.inject);
				if (this.options.requestOptions.evalScripts) $exec(javascript);
				this.fireEvent('beforeEffect', container);
				var finish = function(){
					this.fireEvent('success', [container, this.update, tree, elements, html, javascript]);
				}.bind(this);
				if (this.options.useReveal) {
					container.get('reveal', this.options.revealOptions).chain(finish);
					container.reveal();
				} else {
					finish();
				}
			}.bind(this),
			failure: function(xhr){
				this.fireEvent('failure', xhr);
			}.bind(this)
		});
	}

});/*
---

script: Form.Validator.English.js

description: Date messages for English.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.English]

...
*/

MooTools.lang.set('en-US', 'Form.Validator', {

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

	//Form.Validator.Extras

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
	sameMonth: 'These two dates must be in the same month - you must change one or the other.',
	creditcard: 'The credit card number entered is invalid. Please check the number and try again. {length} digits entered.'

});/*
---

script: Form.Validator.js

description: A css-class based form validation system.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Selectors
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- core:1.2.4/JSON
- /Lang- /Class.Binds
- /Date Element.Forms
- /Form.Validator.English
- /Element.Shortcuts

provides: [Form.Validator, InputValidator, FormValidator.BaseValidators]

...
*/
if (!window.Form) window.Form = {};

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

Form.Validator = new Class({

	Implements:[Options, Events],

	Binds: ['onSubmit'],

	options: {/*
		onFormValidate: $empty(isValid, form, event),
		onElementValidate: $empty(isValid, field, className, warn),
		onElementPass: $empty(field),
		onElementFail: $empty(field, validatorsFailed) */
		fieldSelectors: 'input, select, textarea',
		ignoreHidden: true,
		ignoreDisabled: true,
		useTitles: false,
		evaluateOnSubmit: true,
		evaluateFieldsOnBlur: true,
		evaluateFieldsOnChange: true,
		serial: true,
		stopOnFailure: true,
		warningPrefix: function(){
			return Form.Validator.getMsg('warningPrefix') || 'Warning: ';
		},
		errorPrefix: function(){
			return Form.Validator.getMsg('errorPrefix') || 'Error: ';
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
		field = document.id(field);
		if((this.options.ignoreHidden && !field.isVisible()) || (this.options.ignoreDisabled && field.get('disabled'))) return true;
		var validator = this.getValidator(className);
		if (field.hasClass('ignoreValidation')) return true;
		warn = $pick(warn, false);
		if (field.hasClass('warnOnly')) warn = true;
		var isValid = validator ? validator.test(field) : true;
		if (validator && field.isVisible()) this.fireEvent('elementValidate', [isValid, field, className, warn]);
		if (warn) return true;
		return isValid;
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

Form.Validator.getMsg = function(key){
	return MooTools.lang.get('Form.Validator', key);
};

Form.Validator.adders = {

	validators:{},

	add : function(className, options){
		this.validators[className] = new InputValidator(className, options);
		//if this is a class (this method is used by instances of Form.Validator and the Form.Validator namespace)
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

$extend(Form.Validator, Form.Validator.adders);

Form.Validator.implement(Form.Validator.adders);

Form.Validator.add('IsEmpty', {

	errorMsg: false,
	test: function(element){
		if (element.type == 'select-one' || element.type == 'select')
			return !(element.selectedIndex >= 0 && element.options[element.selectedIndex].value != '');
		else
			return ((element.get('value') == null) || (element.get('value').length == 0));
	}

});

Form.Validator.addAllThese([

	['required', {
		errorMsg: function(){
			return Form.Validator.getMsg('required');
		},
		test: function(element){
			return !Form.Validator.getValidator('IsEmpty').test(element);
		}
	}],

	['minLength', {
		errorMsg: function(element, props){
			if ($type(props.minLength))
				return Form.Validator.getMsg('minLength').substitute({minLength:props.minLength,length:element.get('value').length });
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
				return Form.Validator.getMsg('maxLength').substitute({maxLength:props.maxLength,length:element.get('value').length });
			else return '';
		},
		test: function(element, props){
			//if the value is <= than the maxLength value, element passes test
			return (element.get('value').length <= $pick(props.maxLength, 10000));
		}
	}],

	['validate-integer', {
		errorMsg: Form.Validator.getMsg.pass('integer'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(-?[1-9]\d*|0)$/).test(element.get('value'));
		}
	}],

	['validate-numeric', {
		errorMsg: Form.Validator.getMsg.pass('numeric'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) ||
				(/^-?(?:0$0(?=\d*\.)|[1-9]|0)\d*(\.\d+)?$/).test(element.get('value'));
		}
	}],

	['validate-digits', {
		errorMsg: Form.Validator.getMsg.pass('digits'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[\d() .:\-\+#]+$/.test(element.get('value')));
		}
	}],

	['validate-alpha', {
		errorMsg: Form.Validator.getMsg.pass('alpha'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) ||  (/^[a-zA-Z]+$/).test(element.get('value'));
		}
	}],

	['validate-alphanum', {
		errorMsg: Form.Validator.getMsg.pass('alphanum'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || !(/\W/).test(element.get('value'));
		}
	}],

	['validate-date', {
		errorMsg: function(element, props){
			if (Date.parse){
				var format = props.dateFormat || '%x';
				return Form.Validator.getMsg('dateSuchAs').substitute({date: new Date().format(format)});
			} else {
				return Form.Validator.getMsg('dateInFormatMDY');
			}
		},
		test: function(element, props){
			if (Form.Validator.getValidator('IsEmpty').test(element)) return true;
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
		errorMsg: Form.Validator.getMsg.pass('email'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i).test(element.get('value'));
		}
	}],

	['validate-url', {
		errorMsg: Form.Validator.getMsg.pass('url'),
		test: function(element){
			return Form.Validator.getValidator('IsEmpty').test(element) || (/^(https?|ftp|rmtp|mms):\/\/(([A-Z0-9][A-Z0-9_-]*)(\.[A-Z0-9][A-Z0-9_-]*)+)(:(\d+))?\/?/i).test(element.get('value'));
		}
	}],

	['validate-currency-dollar', {
		errorMsg: Form.Validator.getMsg.pass('currencyDollar'),
		test: function(element){
			// [$]1[##][,###]+[.##]
			// [$]1###+[.##]
			// [$]0.##
			// [$].##
			return Form.Validator.getValidator('IsEmpty').test(element) ||  (/^\$?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(element.get('value'));
		}
	}],

	['validate-one-required', {
		errorMsg: Form.Validator.getMsg.pass('oneRequired'),
		test: function(element, props){
			var p = document.id(props['validate-one-required']) || element.getParent();
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
			this.store('validator', new Form.Validator(this, this.retrieve('validator:options')));
		}
		return this.retrieve('validator');
	}

};

Element.implement({

	validate: function(options){
		this.set('validator', options);
		return this.get('validator', options).validate();
	}

});
//legacy
var FormValidator = Form.Validator;/*
---

script: Form.Validator.Inline.js

description: Extends Form.Validator to add inline messages.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Form.Validator

provides: [Form.Validator.Inline]

...
*/

Form.Validator.Inline = new Class({

	Extends: Form.Validator,

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
---

script: Form.Validator.Extras.js

description: Additional validators for the Form.Validator class.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Form.Validator

provides: [Form.Validator.Extras]

...
*/
Form.Validator.addAllThese([

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
			return Form.Validator.getMsg('noSpace');
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
			return Form.Validator.getMsg('reqChkByNode');
		},
		test: function(element, props){
			return (document.id(props.nodeId).getElements(props.selector || 'input[type=checkbox], input[type=radio]')).some(function(item){
				return item.checked;
			});
		}
	}],

	['validate-required-check', {
		errorMsg: function(element, props){
			return props.useTitle ? element.get('title') : Form.Validator.getMsg('requiredChk');
		},
		test: function(element, props){
			return !!element.checked;
		}
	}],

	['validate-reqchk-byname', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('reqChkByName').substitute({label: props.label || element.get('type')});
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
			return Form.Validator.getMsg('match').substitute({matchName: props.matchName || document.id(props.matchInput).get('name')});
		},
		test: function(element, props){
			var eleVal = element.get('value');
			var matchVal = document.id(props.matchInput) && document.id(props.matchInput).get('value');
			return eleVal && matchVal ? eleVal == matchVal : true;
		}
	}],

	['validate-after-date', {
		errorMsg: function(element, props){
			return Form.Validator.getMsg('afterDate').substitute({
				label: props.afterLabel || (props.afterElement ? Form.Validator.getMsg('startDate') : Form.Validator.getMsg('currentDate'))
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
			return Form.Validator.getMsg('beforeDate').substitute({
				label: props.beforeLabel || (props.beforeElement ? Form.Validator.getMsg('endDate') : Form.Validator.getMsg('currentDate'))
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
			return Form.Validator.getMsg('required');
		},
		test: function(element, props){
			return element.get('value') != props.emptyValue;
		}
	}],

	['validate-same-month', {
		errorMsg: function(element, props){
			var startMo = document.id(props.sameMonthAs) && document.id(props.sameMonthAs).get('value');
			var eleVal = element.get('value');
			if (eleVal != '') return Form.Validator.getMsg(startMo ? 'sameMonth' : 'startMonth');
		},
		test: function(element, props){
			var d1 = Date.parse(element.get('value'));
			var d2 = Date.parse(document.id(props.sameMonthAs) && document.id(props.sameMonthAs).get('value'));
			return d1 && d2 ? d1.format('%B') == d2.format('%B') : true;
		}
	}],


	['validate-cc-num', {
		errorMsg: function(element){
			var ccNum = element.get('value').ccNum.replace(/[^0-9]/g, '');
			return Form.Validator.getMsg('creditcard').substitute({length: ccNum.length});
		},
		test: function(element){
			// required is a different test
			if (Form.Validator.getValidator('IsEmpty').test(element)) { return true; }

			// Clean number value
			var ccNum = element.get('value');
			ccNum = ccNum.replace(/[^0-9]/g, '');

			var valid_type = false;

			if (ccNum.test(/^4[0-9]{12}([0-9]{3})?$/)) valid_type = 'Visa';
			else if (ccNum.test(/^5[1-5]([0-9]{14})$/)) valid_type = 'Master Card';
			else if (ccNum.test(/^3[47][0-9]{13}$/)) valid_type = 'American Express';
			else if (ccNum.test(/^6011[0-9]{12}$/)) valid_type = 'Discover';

			if (valid_type) {
				var sum = 0;
				var cur = 0;

				for(var i=ccNum.length-1; i>=0; --i) {
					cur = ccNum.charAt(i).toInt();
					if (cur == 0) { continue; }

					if ((ccNum.length-i) % 2 == 0) { cur += cur; }
					if (cur > 9) { cur = cur.toString().charAt(0).toInt() + cur.toString().charAt(1).toInt(); }

					sum += cur;
				}
				if ((sum % 10) == 0) { return true; }
			}

			var chunks = '';
			while (ccNum != '') {
				chunks += ' ' + ccNum.substr(0,4);
				ccNum = ccNum.substr(4);
			}

			element.getParent('form').retrieve('validator').ignoreField(element);
			element.set('value', chunks.clean());
			element.getParent('form').retrieve('validator').enforceField(element);
			return false;
		}
	}]


]);/*
---

script: OverText.js

description: Shows text over an input that disappears when the user clicks into it. The text remains hidden if the user adds a value.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Element.Event
- /Class.Binds
- /Class.Occlude
- /Element.Position
- /Element.Shortcuts

provides: [OverText]

...
*/

var OverText = new Class({

	Implements: [Options, Events, Class.Occlude],

	Binds: ['reposition', 'assert', 'focus', 'hide'],

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
		pollInterval: 250,
		wrap: false
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
				position: 'absolute',
				cursor: 'text'
			},
			html: val,
			events: {
				click: this.hide.pass(this.options.element == 'label', this)
			}
		}).inject(this.element, 'after');
		if (this.options.element == 'label') {
			if (!this.element.get('id')) this.element.set('id', 'input_' + new Date().getTime());
			this.text.set('for', this.element.get('id'));
		}

		if (this.options.wrap) {
			this.textHolder = new Element('div', {
				styles: {
					lineHeight: 'normal',
					position: 'relative'
				},
				'class':'overTxtWrapper'
			}).adopt(this.text).inject(this.element, 'before');
		}

		this.element.addEvents({
			focus: this.focus,
			blur: this.assert,
			change: this.assert
		}).store('OverTextDiv', this.text);
		window.addEvent('resize', this.reposition.bind(this));
		this.assert(true);
		this.reposition();
	},

	wrap: function(){
		if (this.options.element == 'label') {
			if (!this.element.get('id')) this.element.set('id', 'input_' + new Date().getTime());
			this.text.set('for', this.element.get('id'));
		}
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
		if (this.text && (!this.text.isDisplayed() || this.element.get('disabled'))) return;
		this.hide();
	},

	hide: function(suppressFocus, force){
		if (this.text && (this.text.isDisplayed() && (!this.element.get('disabled') || force))){
			this.text.hide();
			this.fireEvent('textHide', [this.text, this.element]);
			this.pollingPaused = true;
			try {
				if (!suppressFocus) this.element.fireEvent('focus');
				this.element.focus();
			} catch(e){} //IE barfs if you call focus on hidden elements
		}
		return this;
	},

	show: function(){
		if (this.text && !this.text.isDisplayed()){
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
		if (!this.element.isVisible()) return this.stopPolling().hide();
		if (this.text && this.test()) this.text.position($merge(this.options.positionOptions, {relativeTo: this.element}));
		return this;
	}

});

OverText.instances = [];

$extend(OverText, {

	each: function(fn) {
		return OverText.instances.map(function(ot, i){
			if (ot.element && ot.text) return fn.apply(OverText, [ot, i]);
			return null; //the input or the text was destroyed
		});
	},
	
	update: function(){

		return OverText.each(function(ot){
			return ot.reposition();
		});

	},

	hideAll: function(){

		return OverText.each(function(ot){
			return ot.hide(true, true);
		});

	},

	showAll: function(){
		return OverText.each(function(ot) {
			return ot.show();
		});
	}

});

if (window.Fx && Fx.Reveal) {
	Fx.Reveal.implement({
		hideInputs: Browser.Engine.trident ? 'select, input, textarea, object, embed, .overTxtLabel' : false
	});
}/*
---

script: Fx.Elements.js

description: Effect to change any number of CSS properties of any number of Elements.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx.CSS
- /MooTools.More

provides: [Fx.Elements]

...
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
---

script: Fx.Accordion.js

description: An Fx.Elements extension which allows you to easily create accordion type controls.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Element.Event
- /Fx.Elements

provides: [Fx.Accordion]

...
*/

var Accordion = Fx.Accordion = new Class({

	Extends: Fx.Elements,

	options: {/*
		onActive: $empty(toggler, section),
		onBackground: $empty(toggler, section),
		fixedHeight: false,
		fixedWidth: false,
		*/
		display: 0,
		show: false,
		height: true,
		width: false,
		opacity: true,
		alwaysHide: false,
		trigger: 'click',
		initialDisplayFx: true,
		returnHeightToAuto: true
	},

	initialize: function(){
		var params = Array.link(arguments, {'container': Element.type, 'options': Object.type, 'togglers': $defined, 'elements': $defined});
		this.parent(params.elements, params.options);
		this.togglers = $$(params.togglers);
		this.container = document.id(params.container);
		this.previous = -1;
		this.internalChain = new Chain();
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
		this.addEvent('complete', this.internalChain.callChain.bind(this.internalChain));
	},

	addSection: function(toggler, element){
		toggler = document.id(toggler);
		element = document.id(element);
		var test = this.togglers.contains(toggler);
		this.togglers.include(toggler);
		this.elements.include(element);
		var idx = this.togglers.indexOf(toggler);
		var displayer = this.display.bind(this, idx);
		toggler.store('accordion:display', displayer);
		toggler.addEvent(this.options.trigger, displayer);
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

	detach: function(){
		this.togglers.each(function(toggler) {
			toggler.removeEvent(this.options.trigger, toggler.retrieve('accordion:display'));
		}, this);
	},

	display: function(index, useFx){
		if (!this.check(index, useFx)) return this;
		useFx = $pick(useFx, true);
		if (this.options.returnHeightToAuto) {
			var prev = this.elements[this.previous];
			if (prev) {
				for (var fx in this.effects) {
					prev.setStyle(fx, prev[this.effects[fx]]);
				}
			}
		}
		index = ($type(index) == 'element') ? this.elements.indexOf(index) : index;
		if ((this.timer && this.options.wait) || (index === this.previous && !this.options.alwaysHide)) return this;
		this.previous = index;
		var obj = {};
		this.elements.each(function(el, i){
			obj[i] = {};
			var hide = (i != index) || 
						(this.options.alwaysHide && ((el.offsetHeight > 0 && this.options.height) || 
							el.offsetWidth > 0 && this.options.width));
			this.fireEvent(hide ? 'background' : 'active', [this.togglers[i], el]);
			for (var fx in this.effects) obj[i][fx] = hide ? 0 : el[this.effects[fx]];
		}, this);
		this.internalChain.chain(function(){
			if (this.options.returnHeightToAuto) {
				var el = this.elements[index];
				el.setStyle('height', 'auto');
			};
		}.bind(this));
		return useFx ? this.start(obj) : this.set(obj);
	}

});/*
---

script: Fx.Move.js

description: Defines Fx.Move, a class that works with Element.Position.js to transition an element from one location to another.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Fx.Morph
- /Element.Position

provides: [Fx.Move]

...
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
---

script: Fx.Scroll.js

description: Effect to smoothly scroll any element, including the window.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx
- core:1.2.4/Element.Event
- core:1.2.4/Element.Dimensions
- /MooTools.More

provides: [Fx.Scroll]

...
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
		if (Browser.Engine.gecko) now = [Math.round(now[0]), Math.round(now[1])];
		this.element.scrollTo(now[0], now[1]);
	},

	compute: function(from, to, delta){
		return [0, 1].map(function(i){
			return Fx.compute(from[i], to[i], delta);
		});
	},

	start: function(x, y){
		if (!this.check(x, y)) return this;
		var scrollSize = this.element.getScrollSize(),
			scroll = this.element.getScroll(), 
			values = {x: x, y: y};
		for (var z in values){
			var max = scrollSize[z];
			if ($chk(values[z])) values[z] = ($type(values[z]) == 'number') ? values[z] : max;
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
	},

	scrollToCenter: function(el, axes, offset){
		axes = axes ? $splat(axes) : ['x', 'y'];
		el = $(el);
		var to = {},
			pos = el.getPosition(this.element),
			size = el.getSize(),
			scroll = this.element.getScroll(),
			containerSize = this.element.getSize(),
			edge = {
				x: pos.x + size.x,
				y: pos.y + size.y
			};

		['x','y'].each(function(axis){
			if(axes.contains(axis)){
				to[axis] = pos[axis] - (containerSize[axis] - size[axis])/2;
			}
			if(to[axis] == null) to[axis] = scroll[axis];
			if(offset && offset[axis]) to[axis] = to[axis] + offset[axis];
		}, this);
		if (to.x != scroll.x || to.y != scroll.y) this.start(to.x, to.y);
		return this;
	}

});
/*
---

script: Fx.Slide.js

description: Effect to slide an element in and out of view.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Fx Element.Style
- /MooTools.More

provides: [Fx.Slide]

...
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
			styles: this.element.getStyles('margin', 'position', 'overflow')
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
---

script: Fx.SmoothScroll.js

description: Class for creating a smooth scrolling effect to all internal links on the page.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Selectors
- /Fx.Scroll

provides: [Fx.SmoothScroll]

...
*/

var SmoothScroll = Fx.SmoothScroll = new Class({

	Extends: Fx.Scroll,

	initialize: function(options, context){
		context = context || document;
		this.doc = context.getDocument();
		var win = context.getWindow();
		this.parent(this.doc, options);
		this.links = $$(this.options.links || this.doc.links);
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
---

script: Fx.Sort.js

description: Defines Fx.Sort, a class that reorders lists with a transition.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element.Dimensions
- /Fx.Elements
- /Element.Measure

provides: [Fx.Sort]

...
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
		var top = 0,
			left = 0,
			next = {},
			zero = {},
			vert = this.options.mode == 'vertical';
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
		var margin = top = left = 0;
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
		return this.sort(newOrder);
	}

});/*
---

script: Drag.js

description: The base Drag Class. Can be used to drag and resize Elements using mouse events.

license: MIT-style license

authors:
- Valerio Proietti
- Tom Occhinno
- Jan Kassens

requires:
- core:1.2.4/Events
- core:1.2.4/Options
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- /MooTools.More

provides: [Drag]

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
		if (event.rightClick) return;
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
			if (this.options.style) {
				this.element.setStyle(this.options.modifiers[z], this.value.now[z] + this.options.unit);
			} else {
				this.element[this.options.modifiers[z]] = this.value.now[z];
			}
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
---

script: Drag.Move.js

description: A Drag extension that provides support for the constraining of draggables to containers and droppables.

license: MIT-style license

authors:
- Valerio Proietti
- Tom Occhinno
- Jan Kassens
- Aaron Newton
- Scott Kyle

requires:
- core:1.2.4/Element.Dimensions
- /Drag

provides: [Drag.Move]

...
*/

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
		element = this.element;
		
		this.droppables = $$(this.options.droppables);
		this.container = document.id(this.options.container);
		
		if (this.container && $type(this.container) != 'element')
			this.container = document.id(this.container.getDocument().body);
		
		var styles = element.getStyles('left', 'right', 'position');
		if (styles.left == 'auto' || styles.top == 'auto')
			element.setPosition(element.getPosition(element.getOffsetParent()));
		
		if (styles.position == 'static')
			element.setStyle('position', 'absolute');

		this.addEvent('start', this.checkDroppables, true);

		this.overed = null;
	},

	start: function(event){
		if (this.container) this.options.limit = this.calculateLimit();
		
		if (this.options.precalculate){
			this.positions = this.droppables.map(function(el){
				return el.getCoordinates();
			});
		}
		
		this.parent(event);
	},
	
	calculateLimit: function(){
		var offsetParent = this.element.getOffsetParent(),
			containerCoordinates = this.container.getCoordinates(offsetParent),
			containerBorder = {},
			elementMargin = {},
			elementBorder = {},
			containerMargin = {},
			offsetParentPadding = {};

		['top', 'right', 'bottom', 'left'].each(function(pad){
			containerBorder[pad] = this.container.getStyle('border-' + pad).toInt();
			elementBorder[pad] = this.element.getStyle('border-' + pad).toInt();
			elementMargin[pad] = this.element.getStyle('margin-' + pad).toInt();
			containerMargin[pad] = this.container.getStyle('margin-' + pad).toInt();
			offsetParentPadding[pad] = offsetParent.getStyle('padding-' + pad).toInt();
		}, this);

		var width = this.element.offsetWidth + elementMargin.left + elementMargin.right,
			height = this.element.offsetHeight + elementMargin.top + elementMargin.bottom,
			left = 0,
			top = 0,
			right = containerCoordinates.right - containerBorder.right - width,
			bottom = containerCoordinates.bottom - containerBorder.bottom - height;

		if (this.options.includeMargins){
			left += elementMargin.left;
			top += elementMargin.top;
		} else {
			right += elementMargin.right;
			bottom += elementMargin.bottom;
		}
		
		if (this.element.getStyle('position') == 'relative'){
			var coords = this.element.getCoordinates(offsetParent);
			coords.left -= this.element.getStyle('left').toInt();
			coords.top -= this.element.getStyle('top').toInt();
			
			left += containerBorder.left - coords.left;
			top += containerBorder.top - coords.top;
			right += elementMargin.left - coords.left;
			bottom += elementMargin.top - coords.top;
			
			if (this.container != offsetParent){
				left += containerMargin.left + offsetParentPadding.left;
				top += (Browser.Engine.trident4 ? 0 : containerMargin.top) + offsetParentPadding.top;
			}
		} else {
			left -= elementMargin.left;
			top -= elementMargin.top;
			
			if (this.container == offsetParent){
				right -= containerBorder.left;
				bottom -= containerBorder.top;
			} else {
				left += containerCoordinates.left + containerBorder.left;
				top += containerCoordinates.top + containerBorder.top;
			}
		}
		
		return {
			x: [left, right],
			y: [top, bottom]
		};
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
---

script: Slider.js

description: Class for creating horizontal and vertical slider controls.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Element.Dimensions
- /Class.Binds
- /Drag
- /Element.Dimensions
- /Element.Measure

provides: [Slider]

...
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
		initialStep: 0,
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
		
		this.full = this.element.measure(function(){ 
			this.half = this.knob[offset] / 2; 
			return this.element[offset] - this.knob[offset] + (this.options.offset * 2); 
		}.bind(this));
		
		this.min = $chk(this.options.range[0]) ? this.options.range[0] : 0;
		this.max = $chk(this.options.range[1]) ? this.options.range[1] : this.options.steps;
		this.range = this.max - this.min;
		this.steps = this.options.steps || this.full;
		this.stepSize = Math.abs(this.range) / this.steps;
		this.stepWidth = this.stepSize * this.full / Math.abs(this.range) ;

		this.knob.setStyle('position', 'relative').setStyle(this.property, this.options.initialStep ? this.toPosition(this.options.initialStep) : - this.options.offset);
		modifiers[this.axis] = this.property;
		limit[this.axis] = [- this.options.offset, this.full - this.options.offset];

		var dragOptions = {
			snap: 0,
			limit: limit,
			modifiers: modifiers,
			onDrag: this.draggedKnob,
			onStart: this.draggedKnob,
			onBeforeStart: (function(){
				this.isDragging = true;
			}).bind(this),
			onCancel: function() {
				this.isDragging = false;
			}.bind(this),
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
		this.element.addEvent('mousedown', this.clickedElement);
		if (this.options.wheel) this.element.addEvent('mousewheel', this.scrolledElement);
		this.drag.attach();
		return this;
	},

	detach: function(){
		this.element.removeEvent('mousedown', this.clickedElement);
		this.element.removeEvent('mousewheel', this.scrolledElement);
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
---

script: Sortables.js

description: Class for creating a drag and drop sorting interface for lists of items.

license: MIT-style license

authors:
- Tom Occhino

requires:
- /Drag.Move

provides: [Slider]

...
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
		}).inject(this.list).setPosition(element.getPosition(element.getOffsetParent()));
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
---

script: Request.JSONP.js

description: Defines Request.JSONP, a class for cross domain javascript via script injection.

license: MIT-style license

authors:
- Aaron Newton
- Guillermo Rauch

requires:
- core:1.2.4/Element
- core:1.2.4/Request
- /Log

provides: [Request.JSONP]

...
*/

Request.JSONP = new Class({

	Implements: [Chain, Events, Options, Log],

	options: {/*
		onRetry: $empty(intRetries),
		onRequest: $empty(scriptElement),
		onComplete: $empty(data),
		onSuccess: $empty(data),
		onCancel: $empty(),
		log: false,
		*/
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
		if (this.options.log) this.enableLog();
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

		var type = $type(options), 
				old = this.options, 
				index = $chk(arguments[1]) ? arguments[1] : this.requests++;
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
						this.send(options, index).fireEvent('retry', this.triesRemaining[index]);
					}
				} else if(script && this.options.timeout){
					script.destroy();
					this.cancel().fireEvent('failure');
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
		var index = Request.JSONP.counter,
				data;
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
---

script: Request.Queue.js

description: Controls several instances of Request and its variants to run only one request at a time.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Element
- core:1.2.4/Request
- /Log

provides: [Request.Queue]

...
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
		onFailure: $empty(argsPassedToOnFailure),
		onEnd: $empty,
		*/
		stopOnFailure: true,
		autoAdvance: true,
		concurrent: 1,
		requests: {}
	},

	initialize: function(options){
		if(options){
			var requests = options.requests;
			delete options.requests;	
		}
		this.setOptions(options);
		this.requests = new Hash;
		this.queue = [];
		this.reqBinders = {};
		
		if(requests) this.addRequests(requests);
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
		return this.requests.filter(function(r){
			return r.running;
		});
	},

	isRunning: function(){
		return !!(this.getRunning().getKeys().length);
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
		if (!this.queue.length) this.fireEvent('end');
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
---

script: Request.Periodical.js

description: Requests the same URL to pull data from a server but increases the intervals if no data is returned to reduce the load

license: MIT-style license

authors:
- Christoph Pojer

requires:
- core:1.2.4/Request
- /MooTools.More

provides: [Request.Periodical]

...
*/

Request.implement({

	options: {
		initialDelay: 5000,
		delay: 5000,
		limit: 60000
	},

	startTimer: function(data){
		var fn = function(){
			if (!this.running) this.send({data: data});
		};
		this.timer = fn.delay(this.options.initialDelay, this);
		this.lastDelay = this.options.initialDelay;
		this.completeCheck = function(response){
			$clear(this.timer);
			this.lastDelay = (response) ? this.options.delay : (this.lastDelay + this.options.delay).min(this.options.limit);
			this.timer = fn.delay(this.lastDelay, this);
		};
		return this.addEvent('complete', this.completeCheck);
	},

	stopTimer: function(){
		$clear(this.timer);
		return this.removeEvent('complete', this.completeCheck);
	}

});/*
---

script: Assets.js

description: Provides methods to dynamically load JavaScript, CSS, and Image files into the document.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Element.Event
- /MooTools.More

provides: [Assets]

...
*/

var Asset = {

	javascript: function(source, properties){
		properties = $extend({
			onload: $empty,
			document: document,
			check: $lambda(true)
		}, properties);

		var script = new Element('script', {src: source, type: 'text/javascript'});

		var load = properties.onload.bind(script), 
			check = properties.check, 
			doc = properties.document;
		delete properties.onload;
		delete properties.check;
		delete properties.document;

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
			rel: 'stylesheet',
			media: 'screen',
			type: 'text/css',
			href: source
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
---

script: Color.js

description: Class for creating and manipulating colors in JavaScript. Supports HSB -> RGB Conversions and vice versa.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Array
- core:1.2.4/String
- core:1.2.4/Number
- core:1.2.4/Hash
- core:1.2.4/Function
- core:1.2.4/$util

provides: [Color]

...
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
		var red = this[0],
				green = this[1],
				blue = this[2],
				hue = 0;
		var max = Math.max(red, green, blue),
				min = Math.min(red, green, blue);
		var delta = max - min;
		var brightness = max / 255,
				saturation = (max != 0) ? delta / max : 0;
		if(saturation != 0) {
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
---

script: Group.js

description: Class for monitoring collections of events

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Events
- /MooTools.More

provides: [Group]

...
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
---

script: Hash.Cookie.js

description: Class for creating, reading, and deleting Cookies in JSON format.

license: MIT-style license

authors:
- Valerio Proietti
- Aaron Newton

requires:
- core:1.2.4/Cookie
- core:1.2.4/JSON
- /MooTools.More

provides: [Hash.Cookie]

...
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
---

script: HtmlTable.js

description: Builds table elements with methods to add rows.

license: MIT-style license

authors:
- Aaron Newton

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- /Class.Occlude

provides: [HtmlTable]

...
*/

var HtmlTable = new Class({

	Implements: [Options, Events, Class.Occlude],

	options: {
		properties: {
			cellpadding: 0,
			cellspacing: 0,
			border: 0
		},
		rows: [],
		headers: [],
		footers: []
	},

	property: 'HtmlTable',

	initialize: function(){
		var params = Array.link(arguments, {options: Object.type, table: Element.type});
		this.setOptions(params.options);
		this.element = params.table || new Element('table', this.options.properties);
		if (this.occlude()) return this.occluded;
		this.build();
	},

	build: function(){
		this.element.store('HtmlTable', this);

		this.body = document.id(this.element.tBodies[0]) || new Element('tbody').inject(this.element);
		$$(this.body.rows);

		if (this.options.headers.length) this.setHeaders(this.options.headers);
		else this.thead = document.id(this.element.tHead);
		if (this.thead) this.head = document.id(this.thead.rows[0]);

		if (this.options.footers.length) this.setFooters(this.options.footers);
		this.tfoot = document.id(this.element.tFoot);
		if (this.tfoot) this.foot = document.id(this.thead.rows[0]);

		this.options.rows.each(this.push.bind(this));

		['adopt', 'inject', 'wraps', 'grab', 'replaces', 'dispose'].each(function(method){
				this[method] = this.element[method].bind(this.element);
		}, this);
	},

	toElement: function(){
		return this.element;
	},

	empty: function(){
		this.body.empty();
		return this;
	},

	setHeaders: function(headers){
		this.thead = (document.id(this.element.tHead) || new Element('thead').inject(this.element, 'top')).empty();
		this.push(headers, this.thead, 'th');
		this.head = document.id(this.thead.rows[0]);
		return this;
	},

	setFooters: function(footers){
		this.tfoot = (document.id(this.element.tFoot) || new Element('tfoot').inject(this.element, 'top')).empty();
		this.push(footers, this.tfoot);
		this.foot = document.id(this.thead.rows[0]);
		return this;
	},

	push: function(row, target, tag){
		var tds = row.map(function(data){
			var td = new Element(tag || 'td', data.properties),
				type = data.content || data || '',
				element = document.id(type);

			if(element) td.adopt(element);
			else td.set('html', type);

			return td;
		});

		return {
			tr: new Element('tr').inject(target || this.body).adopt(tds),
			tds: tds
		};
	}

});/*
---

script: HtmlTable.Zebra.js

description: Builds a stripy table with methods to add rows.

license: MIT-style license

authors:
- Harald Kirschner
- Aaron Newton

requires:
- /HtmlTable
- /Class.refactor

provides: [HtmlTable.Zebra]

...
*/

HtmlTable = Class.refactor(HtmlTable, {

	options: {
		classZebra: 'table-tr-odd',
		zebra: true
	},

	initialize: function(){
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;
		if (this.options.zebra) this.updateZebras();
	},

	updateZebras: function(){
		Array.each(this.body.rows, this.zebra, this);
	},

	zebra: function(row, i){
		return row[((i % 2) ? 'remove' : 'add')+'Class'](this.options.classZebra);
	},

	push: function(){
		var pushed = this.previous.apply(this, arguments);
		if (this.options.zebra) this.updateZebras();
		return pushed;
	}

});/*
---

script: HtmlTable.Sort.js

description: Builds a stripy, sortable table with methods to add rows.

license: MIT-style license

authors:
- Harald Kirschner
- Aaron Newton

requires:
- core:1.2.4/Hash
- /HtmlTable
- /Class.refactor
- /Element.Delegation
- /Date

provides: [HtmlTable.Sort]

...
*/

HtmlTable = Class.refactor(HtmlTable, {

	options: {/*
		onSort: $empty, */
		sortIndex: 0,
		sortReverse: false,
		parsers: [],
		defaultParser: 'string',
		classSortable: 'table-sortable',
		classHeadSort: 'table-th-sort',
		classHeadSortRev: 'table-th-sort-rev',
		classNoSort: 'table-th-nosort',
		classGroupHead: 'table-tr-group-head',
		classGroup: 'table-tr-group',
		classCellSort: 'table-td-sort',
		classSortSpan: 'table-th-sort-span',
		sortable: false
	},

	initialize: function () {
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;
		this.sorted = {index: null, dir: 1};
		this.bound = {
			headClick: this.headClick.bind(this)
		};
		this.sortSpans = new Elements();
		if (this.options.sortable) {
			this.enableSort();
			if (this.options.sortIndex != null) this.sort(this.options.sortIndex, this.options.sortReverse);
		}
	},

	attachSorts: function(attach){
		this.element[$pick(attach, true) ? 'addEvent' : 'removeEvent']('click:relay(th)', this.bound.headClick);
	},

	setHeaders: function(){
		this.previous.apply(this, arguments);
		if (this.sortEnabled) this.detectParsers();
	},
	
	detectParsers: function(force){
		if (!this.head) return;
		var parsers = this.options.parsers, 
				rows = this.body.rows;

		// auto-detect
		this.parsers = $$(this.head.cells).map(function(cell, index) {
			if (!force && (cell.hasClass(this.options.classNoSort) || cell.retrieve('htmltable-sort'))) return cell.retrieve('htmltable-sort');
			var sortSpan = new Element('span', {'html': '&#160;', 'class': this.options.classSortSpan}).inject(cell, 'top');
			this.sortSpans.push(sortSpan);

			var parser = parsers[index], 
					cancel;
			switch ($type(parser)) {
				case 'function': parser = {convert: parser}; cancel = true; break;
				case 'string': parser = parser; cancel = true; break;
			}
			if (!cancel) {
				HtmlTable.Parsers.some(function(current) {
					var match = current.match;
					if (!match) return false;
					if (Browser.Engine.trident) return false;
					for (var i = 0, j = rows.length; i < j; i++) {
						var text = rows[i].cells[index].get('html').clean();
						if (text && match.test(text)) {
							parser = current;
							return true;
						}
					}
				});
			}

			if (!parser) parser = this.options.defaultParser;
			cell.store('htmltable-parser', parser);
			return parser;
		}, this);
	},

	headClick: function(event, el) {
		if (!this.head) return;
		var index = Array.indexOf(this.head.cells, el);
		this.sort(index);
		return false;
	},

	sort: function(index, reverse, pre) {
		if (!this.head) return;
		pre = !!(pre);
		var classCellSort = this.options.classCellSort;
		var classGroup = this.options.classGroup, 
				classGroupHead = this.options.classGroupHead;

		if (!pre) {
			if (index != null) {
				if (this.sorted.index == index) {
					this.sorted.reverse = !(this.sorted.reverse);
				} else {
					if (this.sorted.index != null) {
						this.sorted.reverse = false;
						this.head.cells[this.sorted.index].removeClass(this.options.classHeadSort).removeClass(this.options.classHeadSortRev);
					} else {
						this.sorted.reverse = true;
					}
					this.sorted.index = index;
				}
			} else {
				index = this.sorted.index;
			}

			if (reverse != null) this.sorted.reverse = reverse;

			var head = document.id(this.head.cells[index]);
			if (head) {
				head.addClass(this.options.classHeadSort);
				if (this.sorted.reverse) head.addClass(this.options.classHeadSortRev);
				else head.removeClass(this.options.classHeadSortRev);
			}

			this.body.getElements('td').removeClass(this.options.classCellSort);
		}

		var parser = this.parsers[index];
		if ($type(parser) == 'string') parser = HtmlTable.Parsers.get(parser);
		if (!parser) return;

		if (!Browser.Engine.trident) {
			var rel = this.body.getParent();
			this.body.dispose();
		}

		var data = Array.map(this.body.rows, function(row, i) {
			var value = parser.convert.call(document.id(row.cells[index]));

			if (parser.number || $type(value) == 'number') {
				value = String(value).replace(/[^\d]/, '');
				value = '00000000000000000000000000000000'.substr(0, 32 - value.length).concat(value);
			}

			return {
				position: i,
				value: value,
				toString:  function() {
					return value;
				}
			};
		}, this);

		data.reverse(true);
		data.sort();

		if (!this.sorted.reverse) data.reverse(true);

		var i = data.length, body = this.body;
		var j, position, entry, group;

		while (i) {
			var item = data[--i];
			position = item.position;
			var row = body.rows[position];
			if (row.disabled) continue;

			if (!pre) {
				if (group === item.value) {
					row.removeClass(classGroupHead).addClass(classGroup);
				} else {
					group = item.value;
					row.removeClass(classGroup).addClass(classGroupHead);
				}
				if (this.zebra) this.zebra(row, i);

				row.cells[index].addClass(classCellSort);
			}

			body.appendChild(row);
			for (j = 0; j < i; j++) {
				if (data[j].position > position) data[j].position--;
			}
		};
		data = null;
		if (rel) rel.grab(body);

		return this.fireEvent('sort', [body, index]);
	},

	reSort: function(){
		if (this.sortEnabled) this.sort.call(this, this.sorted.index, this.sorted.reverse);
		return this;
	},

	enableSort: function(){
		this.element.addClass(this.options.classSortable);
		this.attachSorts(true);
		this.detectParsers();
		this.sortEnabled = true;
		return this;
	},

	disableSort: function(){
		this.element.remove(this.options.classSortable);
		this.attachSorts(false);
		this.sortSpans.each(function(span) { span.destroy(); });
		this.sortSpans.empty();
		this.sortEnabled = false;
		return this;
	}

});

HtmlTable.Parsers = new Hash({

	'date': {
		match: /^\d{4}[^\d]|[^\d]\d{4}$/,
		convert: function() {
			return Date.parse(this.get('text'));
		},
		type: 'date'
	},
	'input-checked': {
		match: / type="(radio|checkbox)" /,
		convert: function() {
			return this.getElement('input').checked;
		}
	},
	'input-value': {
		match: /<input/,
		convert: function() {
			return this.getElement('input').value;
		}
	},
	'number': {
		match: /^\d+[^\d.,]*$/,
		convert: function() {
			return this.get('text').toInt();
		},
		number: true
	},
	'numberLax': {
		match: /^[^\d]+\d+$/,
		convert: function() {
			return this.get('text').replace(/[^0-9]/, '').toInt();
		},
		number: true
	},
	'float': {
		match: /^[\d]+\.[\d]+/,
		convert: function() {
			return this.get('text').replace(/[^\d.]/, '').toFloat();
		},
		number: true
	},
	'floatLax': {
		match: /^[^\d]+[\d]+\.[\d]+$/,
		convert: function() {
			return this.get('text').replace(/[^\d.]/, '');
		},
		number: true
	},
	'string': {
		match: null,
		convert: function() {
			return this.get('text');
		}
	},
	'title': {
		match: null,
		convert: function() {
			return this.title;
		}
	}

});/*
---

script: Keyboard.js

description: KeyboardEvents used to intercept events on a class for keyboard and format modifiers in a specific order so as to make alt+shift+c the same as shift+alt+c.

license: MIT-style license

authors:
- Perrin Westrich
- Aaron Newton
- Scott Kyle

requires:
- core:1.2.4/Events
- core:1.2.4/Options
- core:1.2.4/Element.Event
- /Log

provides: [Keyboard]

...
*/

(function(){

	var parsed = {};
	var modifiers = ['shift', 'control', 'alt', 'meta'];
	var regex = /^(?:shift|control|ctrl|alt|meta)$/;
	
	var parse = function(type, eventType){
		type = type.toLowerCase().replace(/^(keyup|keydown):/, function($0, $1){
			eventType = $1;
			return '';
		});
		
		if (!parsed[type]){
			var key = '', mods = {};
			type.split('+').each(function(part){
				if (regex.test(part)) mods[part] = true;
				else key = part;
			});
		
			mods.control = mods.control || mods.ctrl; // allow both control and ctrl
			var match = '';
			modifiers.each(function(mod){
				if (mods[mod]) match += mod + '+';
			});
			
			parsed[type] = match + key;
		}
		
		return eventType + ':' + parsed[type];
	};

	this.Keyboard = new Class({

		Extends: Events,

		Implements: [Options, Log],

		options: {
			/*
			onActivate: $empty,
			onDeactivate: $empty,
			*/
			defaultEventType: 'keydown',
			active: false,
			events: {}
		},

		initialize: function(options){
			this.setOptions(options);
			//if this is the root manager, nothing manages it
			if (Keyboard.manager) Keyboard.manager.manage(this);
			this.setup();
		},

		setup: function(){
			this.addEvents(this.options.events);
			if (this.options.active) this.activate();
		},

		handle: function(event, type){
			//Keyboard.stop(event) prevents key propagation
			if (!this.active || event.preventKeyboardPropagation) return;
			
			var bubbles = !!this.manager;
			if (bubbles && this.activeKB){
				this.activeKB.handle(event, type);
				if (event.preventKeyboardPropagation) return;
			}
			this.fireEvent(type, event);
			
			if (!bubbles && this.activeKB) this.activeKB.handle(event, type);
		},

		addEvent: function(type, fn, internal) {
			return this.parent(parse(type, this.options.defaultEventType), fn, internal);
		},

		removeEvent: function(type, fn) {
			return this.parent(parse(type, this.options.defaultEventType), fn);
		},

		activate: function(){
			this.active = true;
			return this.enable();
		},

		deactivate: function(){
			this.active = false;
			return this.fireEvent('deactivate');
		},

		toggleActive: function(){
			return this[this.active ? 'deactivate' : 'activate']();
		},

		enable: function(instance){
			if (instance) {
				//if we're stealing focus, store the last keyboard to have it so the relenquish command works
				if (instance != this.activeKB) this.previous = this.activeKB;
				//if we're enabling a child, assign it so that events are now passed to it
				this.activeKB = instance.fireEvent('activate');
			} else if (this.manager) {
				//else we're enabling ourselves, we must ask our parent to do it for us
				this.manager.enable(this);
			}
			return this;
		},

		relenquish: function(){
			if (this.previous) this.enable(this.previous);
		},

		//management logic
		manage: function(instance) {
			if (instance.manager) instance.manager.drop(instance);
			this.instances.push(instance);
			instance.manager = this;
			if (!this.activeKB) this.enable(instance);
			else this._disable(instance);
		},

		_disable: function(instance) {
			if (this.activeKB == instance) this.activeKB = null;
		},

		drop: function(instance) {
			this._disable(instance);
			this.instances.erase(instance);
		},

		instances: [],

		trace: function(){
			this.enableLog();
			var item = this;
			this.log('the following items have focus: ');
			while (item) {
				this.log(document.id(item.widget) || item.widget || item, 'active: ' + this.active);
				item = item.activeKB;
			}
		}

	});

	Keyboard.stop = function(event) {
		event.preventKeyboardPropagation = true;
	};

	Keyboard.manager = new this.Keyboard({
		active: true
	});
	
	Keyboard.trace = function(){
		Keyboard.manager.trace();
	};
	
	var handler = function(event){
		var mods = '';
		modifiers.each(function(mod){
			if (event[mod]) mods += mod + '+';
		});
		Keyboard.manager.handle(event, event.type + ':' + mods + event.key);
	};
	
	document.addEvents({
		'keyup': handler,
		'keydown': handler
	});

	Event.Keys.extend({
		'pageup': 33,
		'pagedown': 34,
		'end': 35,
		'home': 36,
		'capslock': 20,
		'numlock': 144,
		'scrolllock': 145
	});

})();
/*
---

script: HtmlTable.Select.js

description: Builds a stripy, sortable table with methods to add rows. Rows can be selected with the mouse or keyboard navigation.

license: MIT-style license

authors:
- Harald Kirschner
- Aaron Newton

requires:
- /Keyboard
- /HtmlTable
- /Class.refactor
- /Element.Delegation

provides: [HtmlTable.Select]

...
*/

HtmlTable = Class.refactor(HtmlTable, {

	options: {
		/*onRowSelect: $empty,
		onRowUnselect: $empty,*/
		useKeyboard: true,
		classRowSelected: 'table-tr-selected',
		classRowHovered: 'table-tr-hovered',
		classSelectable: 'table-selectable',
		allowMultiSelect: true,
		selectable: false
	},

	initialize: function(){
		this.previous.apply(this, arguments);
		if (this.occluded) return this.occluded;
		this.selectedRows = new Elements();
		this.bound = {
			mouseleave: this.mouseleave.bind(this),
			focusRow: this.focusRow.bind(this)
		};
		if (this.options.selectable) this.enableSelect();
	},

	enableSelect: function(){
		this.selectEnabled = true;
		this.attachSelects();
		this.element.addClass(this.options.classSelectable);
	},

	disableSelect: function(){
		this.selectEnabled = false;
		this.attach(false);
		this.element.removeClass(this.options.classSelectable);
	},

	attachSelects: function(attach){
		attach = $pick(attach, true);
		var method = attach ? 'addEvents' : 'removeEvents';
		this.element[method]({
			mouseleave: this.bound.mouseleave
		});
		this.body[method]({
			'click:relay(tr)': this.bound.focusRow
		});
		if (this.options.useKeyboard || this.keyboard){
			if (!this.keyboard) this.keyboard = new Keyboard({
				events: {
					down: function(e) {
						e.preventDefault();
						this.shiftFocus(1);
					}.bind(this),
					up: function(e) {
						e.preventDefault();
						this.shiftFocus(-1);
					}.bind(this),
					enter: function(e) {
						e.preventDefault();
						if (this.hover) this.focusRow(this.hover);
					}.bind(this)
				},
				active: true
			});
			this.keyboard[attach ? 'activate' : 'deactivate']();
		}
		this.updateSelects();
	},

	mouseleave: function(){
		if (this.hover) this.leaveRow(this.hover);
	},

	focus: function(){
		if (this.keyboard) this.keyboard.activate();
	},

	blur: function(){
		if (this.keyboard) this.keyboard.deactivate();
	},

	push: function(){
		var ret = this.previous.apply(this, arguments);
		this.updateSelects();
		return ret;
	},

	updateSelects: function(){
		Array.each(this.body.rows, function(row){
			var binders = row.retrieve('binders');
			if ((binders && this.selectEnabled) || (!binders && !this.selectEnabled)) return;
			if (!binders){
				binders = {
					mouseenter: this.enterRow.bind(this, [row]),
					mouseleave: this.leaveRow.bind(this, [row])
				};
				row.store('binders', binders).addEvents(binders);
			} else {
				row.removeEvents(binders);
			}
		}, this);
	},

	enterRow: function(row){
		if (this.hover) this.hover = this.leaveRow(this.hover);
		this.hover = row.addClass(this.options.classRowHovered);
	},

	shiftFocus: function(offset){
		if (!this.hover) return this.enterRow(this.body.rows[0]);
		var to = Array.indexOf(this.body.rows, this.hover) + offset;
		if (to < 0) to = 0;
		if (to >= this.body.rows.length) to = this.body.rows.length - 1;
		if (this.hover == this.body.rows[to]) return this;
		this.enterRow(this.body.rows[to]);
	},

	leaveRow: function(row){
		row.removeClass(this.options.classRowHovered);
	},

	focusRow: function(){
		var row = arguments[1] || arguments[0]; //delegation passes the event first
		var unfocus = function(row){
			this.selectedRows.erase(row);
			row.removeClass(this.options.classRowSelected);
			this.fireEvent('rowUnfocus', [row, this.selectedRows]);
		}.bind(this);
		if (!this.options.allowMultiSelect) this.selectedRows.each(unfocus);
		if (!this.selectedRows.contains(row)) {
			this.selectedRows.push(row);
			row.addClass(this.options.classRowSelected);
			this.fireEvent('rowFocus', [row, this.selectedRows]);
		} else {
			unfocus(row);
		}
		return false;
	},

	selectAll: function(status){
		status = $pick(status, true);
		if (!this.options.allowMultiSelect && status) return;
		if (!status) this.selectedRows.removeClass(this.options.classRowSelected).empty();
		else this.selectedRows.combine(this.body.rows).addClass(this.options.classRowSelected);
		return this;
	},

	selectNone: function(){
		return this.selectAll(false);
	}

});/*
---

script: Scroller.js

description: Class which scrolls the contents of any Element (including the window) when the mouse reaches the Element's boundaries.

license: MIT-style license

authors:
- Valerio Proietti

requires:
- core:1.2.4/Events
- core:1.2.4/Options
- core:1.2.4/Element.Event
- core:1.2.4/Element.Dimensions

provides: [Scroller]

...
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
			mouseover: this.bound.attach,
			mouseout: this.bound.detach
		});
	},

	stop: function(){
		this.listener.removeEvents({
			mouseover: this.bound.attach,
			mouseout: this.bound.detach
		});
		this.detach();
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
---

script: Tips.js

description: Class for creating nice tips that follow the mouse cursor when hovering an element.

license: MIT-style license

authors:
- Valerio Proietti
- Christoph Pojer

requires:
- core:1.2.4/Options
- core:1.2.4/Events
- core:1.2.4/Element.Event
- core:1.2.4/Element.Style
- core:1.2.4/Element.Dimensions
- /MooTools.More

provides: [Tips]

...
*/

(function(){

var read = function(option, element){
	return (option) ? ($type(option) == 'function' ? option(element) : element.get(option)) : '';
};

this.Tips = new Class({

	Implements: [Events, Options],

	options: {
		/*
		onAttach: $empty(element),
		onDetach: $empty(element),
		*/
		onShow: function(){
			this.tip.setStyle('display', 'block');
		},
		onHide: function(){
			this.tip.setStyle('display', 'none');
		},
		title: 'title',
		text: function(element){
			return element.get('rel') || element.get('href');
		},
		showDelay: 100,
		hideDelay: 100,
		className: 'tip-wrap',
		offset: {x: 16, y: 16},
		fixed: false
	},

	initialize: function(){
		var params = Array.link(arguments, {options: Object.type, elements: $defined});
		this.setOptions(params.options);
		document.id(this);
		
		if (params.elements) this.attach(params.elements);
	},

	toElement: function(){
		if (this.tip) return this.tip;
		
		this.container = new Element('div', {'class': 'tip'});
		return this.tip = new Element('div', {
			'class': this.options.className,
			styles: {
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
		$$(elements).each(function(element){
			var title = read(this.options.title, element),
				text = read(this.options.text, element);
			
			element.erase('title').store('tip:native', title).retrieve('tip:title', title);
			element.retrieve('tip:text', text);
			this.fireEvent('attach', [element]);
			
			var events = ['enter', 'leave'];
			if (!this.options.fixed) events.push('move');
			
			events.each(function(value){
				var event = element.retrieve('tip:' + value);
				if (!event) event = this['element' + value.capitalize()].bindWithEvent(this, element);
				
				element.store('tip:' + value, event).addEvent('mouse' + value, event);
			}, this);
		}, this);
		
		return this;
	},

	detach: function(elements){
		$$(elements).each(function(element){
			['enter', 'leave', 'move'].each(function(value){
				element.removeEvent('mouse' + value, element.retrieve('tip:' + value)).eliminate('tip:' + value);
			});
			
			this.fireEvent('detach', [element]);
			
			if (this.options.title == 'title'){ // This is necessary to check if we can revert the title
				var original = element.retrieve('tip:native');
				if (original) element.set('title', original);
			}
		}, this);
		
		return this;
	},

	elementEnter: function(event, element){
		this.container.empty();
		
		['title', 'text'].each(function(value){
			var content = element.retrieve('tip:' + value);
			if (content) this.fill(new Element('div', {'class': 'tip-' + value}).inject(this.container), content);
		}, this);
		
		$clear(this.timer);
		this.timer = this.show.delay(this.options.showDelay, this, element);
		this.position((this.options.fixed) ? {page: element.getPosition()} : event);
	},

	elementLeave: function(event, element){
		$clear(this.timer);
		this.timer = this.hide.delay(this.options.hideDelay, this, element);
		this.fireForParent(event, element);
	},

	fireForParent: function(event, element) {
			parentNode = element.getParent();
			if (parentNode == document.body) return;
			if (parentNode.retrieve('tip:enter')) parentNode.fireEvent('mouseenter', event);
			else return this.fireForParent(parentNode, event);
	},

	elementMove: function(event, element){
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

	show: function(element){
		this.fireEvent('show', [element]);
	},

	hide: function(element){
		this.fireEvent('hide', [element]);
	}

});

})();/*
---

script: Date.Catalan.US.js

description: Date messages for Catalan.

license: MIT-style license

authors:
- Alfons Sanchez

requires:
- /Lang
- /Date

provides: [Date.Catalan]

...
*/

MooTools.lang.set('ca-CA', 'Date', {

	months: ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juli', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'],
	days: ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'],
	//culture's date order: MM/DD/YYYY
	dateOrder: ['date', 'month', 'year'],

	shortDate: '%d/%m/%Y',
	shortTime: '%H:%M',

	AM: 'AM',
	PM: 'PM',

	/* Date.Extras */
	ordinal: '',

	lessThanMinuteAgo: 'fa menys d`un minut',
	minuteAgo: 'fa un minut',
	minutesAgo: 'fa {delta} minuts',
	hourAgo: 'fa un hora',
	hoursAgo: 'fa unes {delta} hores',
	dayAgo: 'fa un dia',
	daysAgo: 'fa {delta} dies',
	lessThanMinuteUntil: 'menys d`un minut des d`ara',
	minuteUntil: 'un minut des d`ara',
	minutesUntil: '{delta} minuts des d`ara',
	hourUntil: 'un hora des d`ara',
	hoursUntil: 'unes {delta} hores des d`ara',
	dayUntil: '1 dia des d`ara',
	daysUntil: '{delta} dies des d`ara'

});/*
---

script: Date.Danish.js

description: Date messages for Danish.

license: MIT-style license

authors:
- Martin Overgaard
- Henrik Hansen

requires:
- /Lang
- /Date

provides: [Date.Danish]

...
*/
 
MooTools.lang.set('da-DK', 'Date', {

	months: ['Januar', 'Februa', 'Marts', 'April', 'Maj', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'December'],
	days: ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'],
	//culture's date order: DD/MM/YYYY
	dateOrder: ['date', 'month', 'year'],

	AM: 'AM',
	PM: 'PM',

	shortDate: '%d-%m-%Y',
	shortTime: '%H:%M',

	/* Date.Extras */
	ordinal: function(dayOfMonth){
	  //1st, 2nd, 3rd, etc.
	  return (dayOfMonth > 3 && dayOfMonth < 21) ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(dayOfMonth % 10, 4)];
	},

	lessThanMinuteAgo: 'mindre end et minut siden',
	minuteAgo: 'omkring et minut siden',
	minutesAgo: '{delta} minutter siden',
	hourAgo: 'omkring en time siden',
	hoursAgo: 'omkring {delta} timer siden',
	dayAgo: '1 dag siden',
	daysAgo: '{delta} dage siden',
	weekAgo: '1 uge siden',
	weeksAgo: '{delta} uger siden',
	monthAgo: '1 måned siden',
	monthsAgo: '{delta} måneder siden',
	yearthAgo: '1 år siden',
	yearsAgo: '{delta} år siden',
	lessThanMinuteUntil: 'mindre end et minut fra nu',
	minuteUntil: 'omkring et minut fra nu',
	minutesUntil: '{delta} minutter fra nu',
	hourUntil: 'omkring en time fra nu',
	hoursUntil: 'omkring {delta} timer fra nu',
	dayUntil: '1 dag fra nu',
	daysUntil: '{delta} dage fra nu',
	weekUntil: '1 uge fra nu',
	weeksUntil: '{delta} uger fra nu',
	monthUntil: '1 måned fra nu',
	monthsUntil: '{delta} måneder fra nu',
	yearUntil: '1 år fra nu',
	yearsUntil: '{delta} år fra nu'

});
/*
---

script: Date.Dutch.js

description: Date messages in Dutch.

license: MIT-style license

authors:
- Lennart Pilon

requires:
- /Lang
- /Date

provides: [Date.Dutch]

...
*/

MooTools.lang.set('nl-NL', 'Date', {

	months: ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'],
	days: ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'],
	//culture's date order: DD/MM/YYYY
	dateOrder: ['date', 'month', 'year'],

	AM: 'AM',
	PM: 'PM',

	shortDate: '%d/%m/%Y',
	shortTime: '%H:%M',

	/* Date.Extras */
	ordinal: 'e',

	lessThanMinuteAgo: 'minder dan een minuut geleden',
	minuteAgo: 'ongeveer een minuut geleden',
	minutesAgo: 'minuten geleden',
	hourAgo: 'ongeveer een uur geleden',
	hoursAgo: 'ongeveer {delta} uur geleden',
	dayAgo: '{delta} dag geleden',
	daysAgo: 'dagen geleden',
	weekAgo: 'een week geleden',
	weeksAgo: '{delta} weken geleden',
	monthAgo: 'een maand geleden',
	monthsAgo: '{delta} maanden geleden',
	yearAgo: 'een jaar geleden',
	yearsAgo: '{delta} jaar geleden',
	lessThanMinuteUntil: 'minder dan een minuut vanaf nu',
	minuteUntil: 'ongeveer een minuut vanaf nu',
	minutesUntil: '{delta} minuten vanaf nu',
	hourUntil: 'ongeveer een uur vanaf nu',
	hoursUntil: 'ongeveer {delta} uur vanaf nu',
	dayUntil: '1 dag vanaf nu',
	daysUntil: '{delta} dagen vanaf nu',
	weekAgo: 'een week geleden',
	weeksAgo: '{delta} weken geleden',
	monthAgo: 'een maand geleden',
	monthsAgo: '{delta} maanden geleden',
	yearthAgo: 'een jaar geleden',
	yearsAgo: '{delta} jaar geleden',

	weekUntil: 'over een week',
	weeksUntil: 'over {delta} weken',
	monthUntil: 'over een maand',
	monthsUntil: 'over {delta} maanden',
	yearUntil: 'over een jaar',
	yearsUntil: 'over {delta} jaar' 

});/*
---

script: Date.English.GB.js

description: Date messages for British English.

license: MIT-style license

authors:
- Aaron Newton

requires:
- /Lang
- /Date

provides: [Date.English.GB]

...
*/

MooTools.lang.set('en-GB', 'Date', {

	dateOrder: ['date', 'month', 'year'],
	
	shortDate: '%d/%m/%Y',
	shortTime: '%H:%M'

}).set('cascade', ['en-US']);/*
---

script: Date.Estonian.js

description: Date messages for Estonian.

license: MIT-style license

authors:
- Kevin Valdek

requires:
- /Lang
- /Date

provides: [Date.Estonian]

...
*/

MooTools.lang.set('et-EE', 'Date', {

	months: ['jaanuar', 'veebruar', 'märts', 'aprill', 'mai', 'juuni', 'juuli', 'august', 'september', 'oktoober', 'november', 'detsember'],
	days: ['pühapäev', 'esmaspäev', 'teisipäev', 'kolmapäev', 'neljapäev', 'reede', 'laupäev'],
	//culture's date order: MM.DD.YYYY
	dateOrder: ['month', 'date', 'year'],

	AM: 'AM',
	PM: 'PM',

	shortDate: '%m.%d.%Y',
	shortTime: '%H:%M',

	/* Date.Extras */
	ordinal: '',

	lessThanMinuteAgo: 'vähem kui minut aega tagasi',
	minuteAgo: 'umbes minut aega tagasi',
	minutesAgo: '{delta} minutit tagasi',
	hourAgo: 'umbes tund aega tagasi',
	hoursAgo: 'umbes {delta} tundi tagasi',
	dayAgo: '1 päev tagasi',
	daysAgo: '{delta} päeva tagasi',
	weekAgo: '1 nädal tagasi',
	weeksAgo: '{delta} nädalat tagasi',
	monthAgo: '1 kuu tagasi',
	monthsAgo: '{delta} kuud tagasi',
	yearAgo: '1 aasta tagasi',
	yearsAgo: '{delta} aastat tagasi',
	lessThanMinuteUntil: 'vähem kui minuti aja pärast',
	minuteUntil: 'umbes minuti aja pärast',
	minutesUntil: '{delta} minuti pärast',
	hourUntil: 'umbes tunni aja pärast',
	hoursUntil: 'umbes {delta} tunni pärast',
	dayUntil: '1 päeva pärast',
	daysUntil: '{delta} päeva pärast',
	weekUntil: '1 nädala pärast',
	weeksUntil: '{delta} nädala pärast',
	monthUntil: '1 kuu pärast',
	monthsUntil: '{delta} kuu pärast',
	yearUntil: '1 aasta pärast',
	yearsUntil: '{delta} aasta pärast'

});/*
---

script: Date.French.js

description: Date messages in French.

license: MIT-style license

authors:
- Nicolas Sorosac
- Antoine Abt

requires:
- /Lang
- /Date

provides: [Date.French]

...
*/
 
MooTools.lang.set('fr-FR', 'Date', {

	months: ['janvier', 'f&eacute;vrier', 'mars', 'avril', 'mai', 'juin', 'juillet', 'ao&ucirc;t', 'septembre', 'octobre', 'novembre', 'd&eacute;cembre'],
	days: ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'],
	dateOrder: ['date', 'month', 'year'],

	AM: 'AM',
	PM: 'PM',

	shortDate: '%d/%m/%Y',
	shortTime: '%H:%M',

	/* Date.Extras */
	getOrdinal: function(dayOfMonth){
	  return (dayOfMonth > 1) ? '' : 'er';
	},

	lessThanMinuteAgo: 'il y a moins d\'une minute',
	minuteAgo: 'il y a une minute',
	minutesAgo: 'il y a {delta} minutes',
	hourAgo: 'il y a une heure',
	hoursAgo: 'il y a {delta} heures',
	dayAgo: 'il y a un jour',
	daysAgo: 'il y a {delta} jours',
	weekAgo: 'il y a une semaine',
	weeksAgo: 'il y a {delta} semaines',
	monthAgo: 'il y a 1 mois',
	monthsAgo: 'il y a {delta} mois',
	yearthAgo: 'il y a 1 an',
	yearsAgo: 'il y a {delta} ans',
	lessThanMinuteUntil: 'dans moins d\'une minute',
	minuteUntil: 'dans une minute',
	minutesUntil: 'dans {delta} minutes',
	hourUntil: 'dans une heure',
	hoursUntil: 'dans {delta} heures',
	dayUntil: 'dans un jour',
	daysUntil: 'dans {delta} jours',
	weekUntil: 'dans 1 semaine',
	weeksUntil: 'dans {delta} semaines',
	monthUntil: 'dans 1 mois',
	monthsUntil: 'dans {delta} mois',
	yearUntil: 'dans 1 an',
	yearsUntil: 'dans {delta} ans'

});
/*
---

script: Date.Italian.js

description: Date messages for Italian.

license: MIT-style license.

authors:
- Andrea Novero
- Valerio Proietti

requires:
- /Lang
- /Date

provides: [Date.Italian]

...
*/
 
MooTools.lang.set('it-IT', 'Date', {
 
	months: ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'],
	days: ['Domenica', 'Luned&igrave;', 'Marted&igrave;', 'Mercoled&igrave;', 'Gioved&igrave;', 'Venerd&igrave;', 'Sabato'],
	//culture's date order: DD/MM/YYYY
	dateOrder: ['date', 'month', 'year'],

	AM: 'AM',
	PM: 'PM',

	shortDate: '%d/%m/%Y',
	shortTime: '%H.%M',

	/* Date.Extras */
	ordinal: '&ordm;',

	lessThanMinuteAgo: 'meno di un minuto fa',
	minuteAgo: 'circa un minuto fa',
	minutesAgo: 'circa {delta} minuti fa',
	hourAgo: 'circa un\'ora fa',
	hoursAgo: 'circa {delta} ore fa',
	dayAgo: 'circa 1 giorno fa',
	daysAgo: 'circa {delta} giorni fa',
	lessThanMinuteUntil: 'tra meno di un minuto',
	minuteUntil: 'tra circa un minuto',
	minutesUntil: 'tra circa {delta} minuti',
	hourUntil: 'tra circa un\'ora',
	hoursUntil: 'tra circa {delta} ore',
	dayUntil: 'tra circa un giorno',
	daysUntil: 'tra circa {delta} giorni'

});/*
---

script: Date.Norwegian.js

description: Date messages in Norwegian.

license: MIT-style license

authors:
- Espen 'Rexxars' Hovlandsdal

requires:
- /Lang
- /Date

provides: [Date.Norwegian]

...
*/

MooTools.lang.set('no-NO', 'Date', {

	dateOrder: ['date', 'month', 'year'],

	shortDate: '%d.%m.%Y',
	shortTime: '%H:%M',

	lessThanMinuteAgo: 'kortere enn et minutt siden',
	minuteAgo: 'omtrent et minutt siden',
	minutesAgo: '{delta} minutter siden',
	hourAgo: 'omtrent en time siden',
	hoursAgo: 'omtrent {delta} timer siden',
	dayAgo: '{delta} dag siden',
	daysAgo: '{delta} dager siden'

});/*
---

script: Date.Polish.js

description: Date messages for Polish.

license: MIT-style license

authors:
- Oskar Krawczyk

requires:
- /Lang
- /Date

provides: [Date.Polish]

...
*/

MooTools.lang.set('pl-PL', 'Date', {
	months: ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'],
	days: ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'],
	dateOrder: ['year', 'month', 'date'],
	AM: 'nad ranem',
	PM: 'po południu',

	shortDate: '%Y-%m-%d',
	shortTime: '%H:%M',

	/* Date.Extras */
	ordinal: function(dayOfMonth){
		return (dayOfMonth > 3 && dayOfMonth < 21) ? 'ty' : ['ty', 'szy', 'gi', 'ci', 'ty'][Math.min(dayOfMonth % 10, 4)];
	},

	lessThanMinuteAgo: 'mniej niż minute temu',
	minuteAgo: 'około minutę temu',
	minutesAgo: '{delta} minut temu',
	hourAgo: 'około godzinę temu',
	hoursAgo: 'około {delta} godzin temu',
	dayAgo: 'Wczoraj',
	daysAgo: '{delta} dni temu',
	lessThanMinuteUntil: 'za niecałą minutę',
	minuteUntil: 'za około minutę',
	minutesUntil: 'za {delta} minut',
	hourUntil: 'za około godzinę',
	hoursUntil: 'za około {delta} godzin',
	dayUntil: 'za 1 dzień',
	daysUntil: 'za {delta} dni'
});/*
---

script: Date.Portuguese.BR.js

description: Date messages in Portuguese-BR (Brazil).

license: MIT-style license

authors:
- Fabio Miranda Costa

requires:
- /Lang
- /Date

provides: [Date.Portuguese.BR]

...
*/

MooTools.lang.set('pt-BR', 'Date', {

	months: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
	days: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
	//culture's date order: DD/MM/YYYY
	dateOrder: ['date', 'month', 'year'],
	shortDate: '%d/%m/%Y',
	shortTime: '%H:%M',

	/* Date.Extras */
	ordinal: function(dayOfMonth){
		//1º, 2º, 3º, etc.
    	return '&ordm;';
	},

	lessThanMinuteAgo: 'há menos de um minuto',
	minuteAgo: 'há cerca de um minuto',
	minutesAgo: 'há {delta} minutos',
	hourAgo: 'há cerca de uma hora',
	hoursAgo: 'há cerca de {delta} horas',
	dayAgo: 'há um dia',
	daysAgo: 'há {delta} dias',
    weekAgo: 'há uma semana',
	weeksAgo: 'há {delta} semanas',
	monthAgo: 'há um mês',
	monthsAgo: 'há {delta} meses',
	yearAgo: 'há um ano',
	yearsAgo: 'há {delta} anos',
	lessThanMinuteUntil: 'em menos de um minuto',
	minuteUntil: 'em um minuto',
	minutesUntil: 'em {delta} minutos',
	hourUntil: 'em uma hora',
	hoursUntil: 'em {delta} horas',
	dayUntil: 'em um dia',
	daysUntil: 'em {delta} dias',
	weekUntil: 'em uma semana',
	weeksUntil: 'em {delta} semanas',
	monthUntil: 'em um mês',
	monthsUntil: 'em {delta} meses',
	yearUntil: 'em um ano',
	yearsUntil: 'em {delta} anos'

});/*
---

script: Date.Spanish.US.js

description: Date messages for Spanish.

license: MIT-style license

authors:
- Ãlfons Sanchez

requires:
- /Lang
- /Date

provides: [Date.Spanish]

...
*/

MooTools.lang.set('es-ES', 'Date', {

	months: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
	days: ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'],
	//culture's date order: MM/DD/YYYY
	dateOrder: ['date', 'month', 'year'],
	AM: 'AM',
	PM: 'PM',

	shortDate: '%d/%m/%Y',
	shortTime: '%H:%M',

	/* Date.Extras */
	ordinal: '',

	lessThanMinuteAgo: 'hace menos de un minuto',
	minuteAgo: 'hace un minuto',
	minutesAgo: 'hace {delta} minutos',
	hourAgo: 'hace una hora',
	hoursAgo: 'hace unas {delta} horas',
	dayAgo: 'hace un dia',
	daysAgo: 'hace {delta} dias',
	weekAgo: 'hace una semana',
	weeksAgo: 'hace unas {delta} semanas',
	monthAgo: 'hace un mes',
	monthsAgo: 'hace {delta} meses',
	yearAgo: 'hace un año',
	yearsAgo: 'hace {delta} años',
	lessThanMinuteUntil: 'menos de un minuto desde ahora',
	minuteUntil: 'un minuto desde ahora',
	minutesUntil: '{delta} minutos desde ahora',
	hourUntil: 'una hora desde ahora',
	hoursUntil: 'unas {delta} horas desde ahora',
	dayUntil: 'un dia desde ahora',
	daysUntil: '{delta} dias desde ahora',
	weekUntil: 'una semana desde ahora',
	weeksUntil: 'unas {delta} semanas desde ahora',
	monthUntil: 'un mes desde ahora',
	monthsUntil: '{delta} meses desde ahora',
	yearUntil: 'un año desde ahora',
	yearsUntil: '{delta} años desde ahora'

});/*
---

script: Date.Swedish.js

description: Date messages for Swedish (SE).

license: MIT-style license

authors:
- Martin Lundgren

requires:
- /Lang
- /Date

provides: [Date.Swedish]

...
*/

MooTools.lang.set('sv-SE', 'Date', {

	months: ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'],
	days: ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'],
	// culture's date order: YYYY-MM-DD
	dateOrder: ['year', 'month', 'date'],
	AM: '',
	PM: '',

	shortDate: '%Y-%m-%d',
	shortTime: '%H:%M',

	/* Date.Extras */
	ordinal: function(dayOfMonth){
		// Not used in Swedish
		return '';
	},

	lessThanMinuteAgo: 'mindre än en minut sedan',
	minuteAgo: 'ungefär en minut sedan',
	minutesAgo: '{delta} minuter sedan',
	hourAgo: 'ungefär en timme sedan',
	hoursAgo: 'ungefär {delta} timmar sedan',
	dayAgo: '1 dag sedan',
	daysAgo: '{delta} dagar sedan',
	lessThanMinuteUntil: 'mindre än en minut sedan',
	minuteUntil: 'ungefär en minut sedan',
	minutesUntil: '{delta} minuter sedan',
	hourUntil: 'ungefär en timme sedan',
	hoursUntil: 'ungefär {delta} timmar sedan',
	dayUntil: '1 dag sedan',
	daysUntil: '{delta} dagar sedan'

});/*
---

script: Form.Validator.Arabic.js

description: Form.Validator messages in Arabic.

license: MIT-style license

authors:
- Chafik Barbar

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Arabic]

...
*/

MooTools.lang.set('ar', 'Form.Validator', {
	required:'هذا الحقل مطلوب.',
	minLength:'رجاءً إدخال {minLength}  أحرف على الأقل (تم إدخال {length} أحرف).',
	maxLength:'الرجاء عدم إدخال أكثر من {maxLength} أحرف (تم إدخال {length} أحرف).',
	integer:'الرجاء إدخال عدد صحيح في هذا الحقل. أي رقم ذو كسر عشري أو مئوي (مثال 1.25 ) غير مسموح.',
	numeric:'الرجاء إدخال قيم رقمية في هذا الحقل (مثال "1" أو "1.1" أو "-1" أو "-1.1").',
	digits:'الرجاء أستخدام قيم رقمية وعلامات ترقيمية فقط في هذا الحقل (مثال, رقم هاتف مع نقطة أو شحطة)',
	alpha:'الرجاء أستخدام أحرف فقط (ا-ي) في هذا الحقل. أي فراغات أو علامات غير مسموحة.',
	alphanum:'الرجاء أستخدام أحرف فقط (ا-ي) أو أرقام (0-9) فقط في هذا الحقل. أي فراغات أو علامات غير مسموحة.',
	dateSuchAs:'الرجاء إدخال تاريخ صحيح كالتالي {date}',
	dateInFormatMDY:'الرجاء إدخال تاريخ صحيح (مثال, 31-12-1999)',
	email:'الرجاء إدخال بريد إلكتروني صحيح.',
	url:'الرجاء إدخال عنوان إلكتروني صحيح مثل http://www.google.com',
	currencyDollar:'الرجاء إدخال قيمة $ صحيحة.  مثال, 100.00$',
	oneRequired:'الرجاء إدخال قيمة في أحد هذه الحقول على الأقل.',
	errorPrefix: 'خطأ: ',
	warningPrefix: 'تحذير: '
}).set('ar', 'Date', {
	dateOrder: ['date', 'month', 'year', '/']
});/*
---

script: Form.Validator.Catalan.js

description: Date messages for Catalan.

license: MIT-style license

authors:
- Miquel Hudin
- Alfons Sanchez

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Catalan]

...
*/

MooTools.lang.set('ca-CA', 'Form.Validator', {

	required:'Aquest camp es obligatori.',
	minLength:'Per favor introdueix al menys {minLength} caracters (has introduit {length} caracters).',
	maxLength:'Per favor introdueix no mes de {maxLength} caracters (has introduit {length} caracters).',
	integer:'Per favor introdueix un nombre enter en aquest camp. Nombres amb decimals (p.e. 1,25) no estan permesos.',
	numeric:'Per favor introdueix sols valors numerics en aquest camp (p.e. "1" o "1,1" o "-1" o "-1,1").',
	digits:'Per favor usa sols numeros i puntuacio en aquest camp (per exemple, un nombre de telefon amb guions i punts no esta permes).',
	alpha:'Per favor utilitza lletres nomes (a-z) en aquest camp. No s´admiteixen espais ni altres caracters.',
	alphanum:'Per favor, utilitza nomes lletres (a-z) o numeros (0-9) en aquest camp. No s´admiteixen espais ni altres caracters.',
	dateSuchAs:'Per favor introdueix una data valida com {date}',
	dateInFormatMDY:'Per favor introdueix una data valida com DD/MM/YYYY (p.e. "31/12/1999")',
	email:'Per favor, introdueix una adreça de correu electronic valida. Per exemple,  "fred@domain.com".',
	url:'Per favor introdueix una URL valida com http://www.google.com.',
	currencyDollar:'Per favor introdueix una quantitat valida de €. Per exemple €100,00 .',
	oneRequired:'Per favor introdueix alguna cosa per al menys una d´aquestes entrades.',
	errorPrefix: 'Error: ',
	warningPrefix: 'Avis: ',

	//Form.Validator.Extras

	noSpace: 'No poden haver espais en aquesta entrada.',
	reqChkByNode: 'No hi han elements seleccionats.',
	requiredChk: 'Aquest camp es obligatori.',
	reqChkByName: 'Per favor selecciona una {label}.',
	match: 'Aquest camp necessita coincidir amb el camp {matchName}',
	startDate: 'la data de inici',
	endDate: 'la data de fi',
	currendDate: 'la data actual',
	afterDate: 'La data deu ser igual o posterior a {label}.',
	beforeDate: 'La data deu ser igual o anterior a {label}.',
	startMonth: 'Per favor selecciona un mes d´orige',
	sameMonth: 'Aquestes dos dates deuen estar dins del mateix mes - deus canviar una o altra.'

});/*
---

script: Form.Validator.Chinese.js

description: Form.Validator messages in chinese (both simplified and traditional).

license: MIT-style license

authors:
- 陈桂军 - guidy <at> ixuer [dot] net

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Chinese]

...
*/

/*
In Chinese:
------------
需要指出的是：
简体中文适用于中国大陆，
繁体中文适用于香港、澳门和台湾省。
简体中文和繁体中文在字体和语法上有很多的不同之处。

我可以确保简体中文语言包的准确性，
但对于繁体中文，我可以保证用户可以准确的理解，但无法保证语句符合他们的阅读习惯。
如果您不能确认的话，可以只使用简体中文语言包，因为它是最通用的。

In English:
------------
It should be noted that:
Simplified  Chinese apply to mainland Chinese,
Traditional Chinese apply to Hong Kong, Macao and Taiwan Province.
There are a lot of different from Simplified  Chinese and Traditional Chinese , Contains font and syntax .

I can assure Simplified Chinese language pack accuracy .
For Traditional Chinese, I can only guarantee that users can understand, but not necessarily in line with their reading habits.
If you are unsure, you can only use the simplified Chinese language pack, as it is the most common.

*/

// Simplified Chinese
MooTools.lang.set('zhs-CN', 'Form.Validator', {
	required:'这是必填项。',
	minLength:'请至少输入 {minLength} 个字符 (已输入 {length} 个)。',
	maxLength:'最多只能输入 {maxLength} 个字符 (已输入 {length} 个)。',
	integer:'请输入一个整数，不能包含小数点。例如："1", "200"。',
	numeric:'请输入一个数字，例如："1", "1.1", "-1", "-1.1"。',
	digits:'这里只能接受数字和标点的输入，标点可以是："(", ")", ".", ":", "-", "+", "#"和空格。',
	alpha:'请输入 A-Z 的 26 个字母，不能包含空格或任何其他字符。',
	alphanum:'请输入 A-Z 的 26 个字母或 0-9 的 10 个数字，不能包含空格或任何其他字符。',
	dateSuchAs:'请输入合法的日期格式，如：{date}。',
	dateInFormatMDY:'请输入合法的日期格式，例如：MM/DD/YYYY ("12/31/1999")。',
	email:'请输入合法的电子信箱地址，例如："fred@domain.com"。',
	url:'请输入合法的 Url 地址，例如：http://www.google.com。',
	currencyDollar:'请输入合法的货币符号，例如：￥',
	oneRequired:'请至少选择一项。',
	errorPrefix: '错误：',
	warningPrefix: '警告：'
});

// Traditional Chinese
MooTools.lang.set('zht-CN', 'Form.Validator', {
	required:'這是必填項。',
	minLength:'請至少鍵入 {minLength} 個字符(已鍵入 {length} 個)。',
	maxLength:'最多只能鍵入 {maxLength} 個字符(已鍵入 {length} 個)。',
	integer:'請鍵入一個整數，不能包含小數點。例如："1", "200"。',
	numeric:'請鍵入一個數字，例如："1", "1.1", "-1", "-1.1"。',
	digits:'這裡只能接受數字和標點的鍵入，標點可以是："(", ")", ".", ":", "-", "+", "#"和空格。',
	alpha:'請鍵入 A-Z 的 26 個字母，不能包含空格或任何其他字符。',
	alphanum:'請鍵入 A-Z 的 26 個字母或 0-9 的 10 個數字，不能包含空格或任何其他字符。',
	dateSuchAs:'請鍵入合法的日期格式，如：{date}。',
	dateInFormatMDY:'請鍵入合法的日期格式，例如：MM/DD/YYYY ("12/31/1999")。',
	email:'請鍵入合法的電子信箱地址，例如："fred@domain.com"。',
	url:'請鍵入合法的 Url 地址，例如：http://www.google.com。',
	currencyYuan:'請鍵入合法的貨幣符號，例如：￥',
	oneRequired:'請至少選擇一項。',
	errorPrefix: '錯誤：',
	warningPrefix: '警告：'
});

Form.Validator.add('validate-currency-yuan', {
	errorMsg: function(){
		return Form.Validator.getMsg('currencyYuan');
	},
	test: function(element) {
		// [￥]1[##][,###]+[.##]
		// [￥]1###+[.##]
		// [￥]0.##
		// [￥].##
		return Form.Validator.getValidator('IsEmpty').test(element) ||  (/^￥?\-?([1-9]{1}[0-9]{0,2}(\,[0-9]{3})*(\.[0-9]{0,2})?|[1-9]{1}\d*(\.[0-9]{0,2})?|0(\.[0-9]{0,2})?|(\.[0-9]{1,2})?)$/).test(element.get('value'));
	}
});
/*
---

script: Form.Validator.Dutch.js

description: Form.Validator messages in Dutch.

license: MIT-style license

authors:
- Lennart Pilon

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Dutch]

...
*/

MooTools.lang.set('nl-NL', 'Form.Validator', {
	required:'Dit veld is verplicht.',
	minLength:'Vul minimaal {minLength} karakters in (je hebt {length} karakters ingevoerd).',
	maxLength:'Vul niet meer dan {maxLength} karakters in (je hebt {length} karakters ingevoerd).',
	integer:'Vul een getal in. Getallen met decimalen (bijvoorbeeld 1,25) zijn niet toegestaan.',
	numeric:'Vul alleen numerieke waarden in (bijvoorbeeld. "1" of "1.1" of "-1" of "-1.1").',
	digits:'Vul alleen nummers en leestekens in (bijvoorbeeld een telefoonnummer met een streepje).',
	alpha:'Vul alleen letters in (a-z). Spaties en andere karakters zijn niet toegestaan.',
	alphanum:'Vul alleen letters in (a-z) of nummers (0-9). Spaties en andere karakters zijn niet toegestaan.',
	dateSuchAs:'Vul een geldige datum in, zoals {date}',
	dateInFormatMDY:'Vul een geldige datum, in het formaat MM/DD/YYYY (bijvoorbeeld "12/31/1999")',
	email:'Vul een geldig e-mailadres in. Bijvoorbeeld "fred@domein.nl".',
	url:'Vul een geldige URL in, zoals http://www.google.nl.',
	currencyDollar:'Vul een geldig $ bedrag in. Bijvoorbeeld $100.00 .',
	oneRequired:'Vul iets in bij minimaal een van de invoervelden.',
	warningPrefix: 'Waarschuwing: ',
	errorPrefix: 'Fout: '
});/*
---

script: Form.Validator.Estonian.js

description: Date messages for Estonian.

license: MIT-style license

authors:
- Kevin Valdek

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Estonian]

...
*/

MooTools.lang.set('et-EE', 'Form.Validator', {

	required:'Väli peab olema täidetud.',
	minLength:'Palun sisestage vähemalt {minLength} tähte (te sisestasite {length} tähte).',
	maxLength:'Palun ärge sisestage rohkem kui {maxLength} tähte (te sisestasite {length} tähte).',
	integer:'Palun sisestage väljale täisarv. Kümnendarvud (näiteks 1.25) ei ole lubatud.',
	numeric:'Palun sisestage ainult numbreid väljale (näiteks "1", "1.1", "-1" või "-1.1").',
	digits:'Palun kasutage ainult numbreid ja kirjavahemärke (telefoninumbri sisestamisel on lubatud kasutada kriipse ja punkte).',
	alpha:'Palun kasutage ainult tähti (a-z). Tühikud ja teised sümbolid on keelatud.',
	alphanum:'Palun kasutage ainult tähti (a-z) või numbreid (0-9). Tühikud ja teised sümbolid on keelatud.',
	dateSuchAs:'Palun sisestage kehtiv kuupäev kujul {date}',
	dateInFormatMDY:'Palun sisestage kehtiv kuupäev kujul MM.DD.YYYY (näiteks: "12.31.1999").',
	email:'Palun sisestage kehtiv e-maili aadress (näiteks: "fred@domain.com").',
	url:'Palun sisestage kehtiv URL (näiteks: http://www.google.com).',
	currencyDollar:'Palun sisestage kehtiv $ summa (näiteks: $100.00).',
	oneRequired:'Palun sisestage midagi vähemalt ühele antud väljadest.',
	errorPrefix: 'Viga: ',
	warningPrefix: 'Hoiatus: ',

	//Form.Validator.Extras

	noSpace: 'Väli ei tohi sisaldada tühikuid.',
	reqChkByNode: 'Ükski väljadest pole valitud.',
	requiredChk: 'Välja täitmine on vajalik.',
	reqChkByName: 'Palun valige üks {label}.',
	match: 'Väli peab sobima {matchName} väljaga',
	startDate: 'algkuupäev',
	endDate: 'lõppkuupäev',
	currendDate: 'praegune kuupäev',
	afterDate: 'Kuupäev peab olema võrdne või pärast {label}.',
	beforeDate: 'Kuupäev peab olema võrdne või enne {label}.',
	startMonth: 'Palun valige algkuupäev.',
	sameMonth: 'Antud kaks kuupäeva peavad olema samas kuus - peate muutma ühte kuupäeva.'

});/*
---

script: Form.Validator.French.js

description: Form.Validator messages in French.

license: MIT-style license

authors: 
- Miquel Hudin
- Nicolas Sorosac <nicolas <dot> sorosac <at> gmail <dot> com>

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.French]

...
*/
 
MooTools.lang.set('fr-FR', 'Form.Validator', {
  required:'Ce champ est obligatoire.',
  minLength:'Veuillez saisir un minimum de {minLength} caract&egrave;re(s) (vous avez saisi {length} caract&egrave;re(s)).',
  maxLength:'Veuillez saisir un maximum de {maxLength} caract&egrave;re(s) (vous avez saisi {length} caract&egrave;re(s)).',
  integer:'Veuillez saisir un nombre entier dans ce champ. Les nombres d&eacute;cimaux (ex : "1,25") ne sont pas autoris&eacute;s.',
  numeric:'Veuillez saisir uniquement des chiffres dans ce champ (ex : "1" ou "1,1" ou "-1" ou "-1,1").',
  digits:'Veuillez saisir uniquement des chiffres et des signes de ponctuation dans ce champ (ex : un num&eacute;ro de t&eacute;l&eacute;phone avec des traits d\'union est autoris&eacute;).',
  alpha:'Veuillez saisir uniquement des lettres (a-z) dans ce champ. Les espaces ou autres caract&egrave;res ne sont pas autoris&eacute;s.',
  alphanum:'Veuillez saisir uniquement des lettres (a-z) ou des chiffres (0-9) dans ce champ. Les espaces ou autres caract&egrave;res ne sont pas autoris&eacute;s.',
  dateSuchAs:'Veuillez saisir une date correcte comme {date}',
  dateInFormatMDY:'Veuillez saisir une date correcte, au format JJ/MM/AAAA (ex : "31/11/1999").',
  email:'Veuillez saisir une adresse de courrier &eacute;lectronique. Par example "fred@domaine.com".',
  url:'Veuillez saisir une URL, comme http://www.google.com.',
  currencyDollar:'Veuillez saisir une quantit&eacute; correcte. Par example 100,00&euro;.',
  oneRequired:'Veuillez s&eacute;lectionner au moins une de ces options.',
  errorPrefix: 'Erreur : ',
  warningPrefix: 'Attention : ',
  
  //Form.Validator.Extras
 
  noSpace: 'Ce champ n\'accepte pas les espaces.',
  reqChkByNode: 'Aucun &eacute;l&eacute;ment n\'est s&eacute;lectionn&eacute;.',
  requiredChk: 'Ce champ est obligatoire.',
  reqChkByName: 'Veuillez s&eacute;lectionner un(e) {label}.',
  match: 'Ce champ doit correspondre avec le champ {matchName}.',
  startDate: 'date de d&eacute;but',
  endDate: 'date de fin',
  currendDate: 'date actuelle',
  afterDate: 'La date doit &ecirc;tre identique ou post&eacute;rieure &agrave; {label}.',
  beforeDate: 'La date doit &ecirc;tre identique ou ant&eacute;rieure &agrave; {label}.',
  startMonth: 'Veuillez s&eacute;lectionner un mois de d&eacute;but.',
  sameMonth: 'Ces deux dates doivent &ecirc;tre dans le m&ecirc;me mois - vous devez en modifier une.'
 
});/*
---

script: Form.Validator.Italian.js

description: Form.Validator messages in Italian.

license: MIT-style license

authors:
- Leonardo Laureti
- Andrea Novero

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Italian]

...
*/
 
MooTools.lang.set('it-IT', 'Form.Validator', {

	required:'Il campo &egrave; obbligatorio.',
	minLength:'Inserire almeno {minLength} caratteri (ne sono stati inseriti {length}).',
	maxLength:'Inserire al massimo {maxLength} caratteri (ne sono stati inseriti {length}).',
	integer:'Inserire un numero intero. Non sono consentiti decimali (es.: 1.25).',
	numeric:'Inserire solo valori numerici (es.: "1" oppure "1.1" oppure "-1" oppure "-1.1").',
	digits:'Inserire solo numeri e caratteri di punteggiatura. Per esempio &egrave; consentito un numero telefonico con trattini o punti.',
	alpha:'Inserire solo lettere (a-z). Non sono consentiti spazi o altri caratteri.',
	alphanum:'Inserire solo lettere (a-z) o numeri (0-9). Non sono consentiti spazi o altri caratteri.',
	dateSuchAs:'Inserire una data valida del tipo {date}',
	dateInFormatMDY:'Inserire una data valida nel formato MM/GG/AAAA (es.: "12/31/1999")',
	email:'Inserire un indirizzo email valido. Per esempio "nome@dominio.com".',
	url:'Inserire un indirizzo valido. Per esempio "http://www.dominio.com".',
	currencyDollar:'Inserire un importo valido. Per esempio "$100.00".',
	oneRequired:'Completare almeno uno dei campi richiesti.',
	errorPrefix: 'Errore: ',
	warningPrefix: 'Attenzione: ',

	//Form.Validator.Extras

	noSpace: 'Non sono consentiti spazi.',
	reqChkByNode: 'Nessuna voce selezionata.',
	requiredChk: 'Il campo &egrave; obbligatorio.',
	reqChkByName: 'Selezionare un(a) {label}.',
	match: 'Il valore deve corrispondere al campo {matchName}',
	startDate: 'data d\'inizio',
	endDate: 'data di fine',
	currendDate: 'data attuale',
	afterDate: 'La data deve corrispondere o essere successiva al {label}.',
	beforeDate: 'La data deve corrispondere o essere precedente al {label}.',
	startMonth: 'Selezionare un mese d\'inizio',
	sameMonth: 'Le due date devono essere dello stesso mese - occorre modificarne una.'

});/*
---

script: Form.Validator.Norwegian.js

description: Form.Validator messages in Norwegian.

license: MIT-style license

authors:
- Espen 'Rexxars' Hovlandsdal

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Norwegian]

...
*/

MooTools.lang.set('no-NO', 'Form.Validator', {
   required:'Dette feltet er pÃ¥krevd.',
   minLength:'Vennligst skriv inn minst {minLength} tegn (du skrev {length} tegn).',
   maxLength:'Vennligst skriv inn maksimalt {maxLength} tegn (du skrev {length} tegn).',
   integer:'Vennligst skriv inn et tall i dette feltet. Tall med desimaler (for eksempel 1,25) er ikke tillat.',
   numeric:'Vennligst skriv inn kun numeriske verdier i dette feltet (for eksempel "1", "1.1", "-1" eller "-1.1").',
   digits:'Vennligst bruk kun nummer og skilletegn i dette feltet.',
   alpha:'Vennligst bruk kun bokstaver (a-z) i dette feltet. Ingen mellomrom eller andre tegn er tillat.',
   alphanum:'Vennligst bruk kun bokstaver (a-z) eller nummer (0-9) i dette feltet. Ingen mellomrom eller andre tegn er tillat.',
   dateSuchAs:'Vennligst skriv inn en gyldig dato, som {date}',
   dateInFormatMDY:'Vennligst skriv inn en gyldig dato, i formatet MM/DD/YYYY (for eksempel "12/31/1999")',
   email:'Vennligst skriv inn en gyldig epost-adresse. For eksempel "espen@domene.no".',
   url:'Vennligst skriv inn en gyldig URL, for eksempel http://www.google.no.',
   currencyDollar:'Vennligst fyll ut et gyldig $ belÃ¸p. For eksempel $100.00 .',
   oneRequired:'Vennligst fyll ut noe i minst ett av disse feltene.',
   errorPrefix: 'Feil: ',
   warningPrefix: 'Advarsel: '
});/*
---

script: Form.Validator.Polish.js

description: Date messages for Polish.

license: MIT-style license

authors:
- Oskar Krawczyk

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Polish]

...
*/

MooTools.lang.set('pl-PL', 'Form.Validator', {

	required:'To pole jest wymagane.',
	minLength:'Wymagane jest przynajmniej {minLenght} znaków (wpisanych zostało tylko {length}).',
	maxLength:'Dozwolone jest nie więcej niż {maxLenght} znaków (wpisanych zostało {length})',
	integer:'To pole wymaga liczb całych. Liczby dziesiętne (np. 1.25) są niedozwolone.',
	numeric:'Prosimy używać tylko numerycznych wartości w tym polu (np. "1", "1.1", "-1" lub "-1.1").',
	digits:'Prosimy używać liczb oraz zankow punktuacyjnych w typ polu (dla przykładu, przy numerze telefonu myślniki i kropki są dozwolone).',
	alpha:'Prosimy używać tylko liter (a-z) w tym polu. Spacje oraz inne znaki są niedozwolone.',
	alphanum:'Prosimy używać tylko liter (a-z) lub liczb (0-9) w tym polu. Spacje oraz inne znaki są niedozwolone.',
	dateSuchAs:'Prosimy podać prawidłową datę w formacie: {date}',
	dateInFormatMDY:'Prosimy podać poprawną date w formacie DD.MM.RRRR (i.e. "12.01.2009")',
	email:'Prosimy podać prawidłowy adres e-mail, np. "jan@domena.pl".',
	url:'Prosimy podać prawidłowy adres URL, np. http://www.google.pl.',
	currencyDollar:'Prosimy podać prawidłową sumę w PLN. Dla przykładu: 100.00 PLN.',
	oneRequired:'Prosimy wypełnić chociaż jedno z pól.',
	errorPrefix: 'Błąd: ',
	warningPrefix: 'Uwaga: ',

	//Form.Validator.Extras

	noSpace: 'W tym polu nie mogą znajdować się spacje.',
	reqChkByNode: 'Brak zaznaczonych elementów.',
	requiredChk: 'To pole jest wymagane.',
	reqChkByName: 'Prosimy wybrać z {label}.',
	match: 'To pole musi być takie samo jak {matchName}',
	startDate: 'data początkowa',
	endDate: 'data końcowa',
	currendDate: 'aktualna data',
	afterDate: 'Podana data poinna być taka sama lub po {label}.',
	beforeDate: 'Podana data poinna być taka sama lub przed {label}.',
	startMonth: 'Prosimy wybrać początkowy miesiąc.',
	sameMonth: 'Te dwie daty muszą być w zakresie tego samego miesiąca - wymagana jest zmiana któregoś z pól.'

});/*
---

script: Form.Validator.Portuguese.js

description: Form.Validator messages in Portuguese.

license: MIT-style license

authors:
- Miquel Hudin

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Portuguese]

...
*/

MooTools.lang.set('pt-PT', 'Form.Validator', {
	required:'Este campo é necessário.',
	minLength:'Digite pelo menos{minLength} caracteres (comprimento {length} caracteres).',
	maxLength:'Não insira mais de {maxLength} caracteres (comprimento {length} caracteres).',
	integer:'Digite um número inteiro neste domínio. Com números decimais (por exemplo, 1,25), não são permitidas.',
	numeric:'Digite apenas valores numéricos neste domínio (p.ex., "1" ou "1.1" ou "-1" ou "-1,1").',
	digits:'Por favor, use números e pontuação apenas neste campo (p.ex., um número de telefone com traços ou pontos é permitida).',
	alpha:'Por favor use somente letras (a-z), com nesta área. Não utilize espaços nem outros caracteres são permitidos.',
	alphanum:'Use somente letras (a-z) ou números (0-9) neste campo. Não utilize espaços nem outros caracteres são permitidos.',
	dateSuchAs:'Digite uma data válida, como {date}',
	dateInFormatMDY:'Digite uma data válida, como DD/MM/YYYY (p.ex. "31/12/1999")',
	email:'Digite um endereço de email válido. Por exemplo "fred@domain.com".',
	url:'Digite uma URL válida, como http://www.google.com.',
	currencyDollar:'Digite um valor válido $. Por exemplo $ 100,00. ',
	oneRequired:'Digite algo para pelo menos um desses insumos.',
	errorPrefix: 'Erro: ',
	warningPrefix: 'Aviso: '

}).set('pt-PT', 'Date', {
	dateOrder: ['date', 'month', 'year', '/']
});/*
---

script: Form.Validator.Portuguese.BR.js

description: Form.Validator messages in Portuguese-BR.

license: MIT-style license

authors:
- Fábio Miranda Costa

requires:
- /Lang
- /Form.Validator.Portuguese

provides: [Form.Validator.Portuguese.BR]

...
*/

MooTools.lang.set('pt-BR', 'Form.Validator', {

	required: 'Este campo é obrigatório.',
	minLength: 'Digite pelo menos {minLength} caracteres (tamanho atual: {length}).',
	maxLength: 'Não digite mais de {maxLength} caracteres (tamanho atual: {length}).',
	integer: 'Por favor digite apenas um número inteiro neste campo. Não são permitidos números decimais (por exemplo, 1,25).',
	numeric: 'Por favor digite apenas valores numéricos neste campo (por exemplo, "1" ou "1.1" ou "-1" ou "-1,1").',
	digits: 'Por favor use apenas números e pontuação neste campo (por exemplo, um número de telefone com traços ou pontos é permitido).',
	alpha: 'Por favor use somente letras (a-z). Espaço e outros caracteres não são permitidos.',
	alphanum: 'Use somente letras (a-z) ou números (0-9) neste campo. Espaço e outros caracteres não são permitidos.',
	dateSuchAs: 'Digite uma data válida, como {date}',
	dateInFormatMDY: 'Digite uma data válida, como DD/MM/YYYY (por exemplo, "31/12/1999")',
	email: 'Digite um endereço de email válido. Por exemplo "nome@dominio.com".',
	url: 'Digite uma URL válida. Exemplo: http://www.google.com.',
	currencyDollar: 'Digite um valor em dinheiro válido. Exemplo: R$100,00 .',
	oneRequired: 'Digite algo para pelo menos um desses campos.',
	errorPrefix: 'Erro: ',
	warningPrefix: 'Aviso: ',

	//Form.Validator.Extras

	noSpace: 'Não é possível digitar espaços neste campo.',
	reqChkByNode: 'Não foi selecionado nenhum item.',
	requiredChk: 'Este campo é obrigatório.',
	reqChkByName: 'Por favor digite um {label}.',
	match: 'Este campo deve ser igual ao campo {matchName}.',
	startDate: 'a data inicial',
	endDate: 'a data final',
	currendDate: 'a data atual',
	afterDate: 'A data deve ser igual ou posterior a {label}.',
	beforeDate: 'A data deve ser igual ou anterior a {label}.',
	startMonth: 'Por favor selecione uma data inicial.',
	sameMonth: 'Estas duas datas devem ter o mesmo mês - você deve modificar uma das duas.',
	creditcard: 'O número do cartão de crédito informado é inválido. Por favor verifique o valor e tente novamente. {length} números informados.'

});/*
---

script: Form.Validator.Russian.js

description: Form.Validator messages in Russian (utf-8 and cp1251).

license: MIT-style license

authors:
- Chernodarov Egor

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Russian]

...
*/

MooTools.lang.set('ru-RU-unicode', 'Form.Validator', {
	required:'Это поле обязательно к заполнению.',
	minLength:'Пожалуйста, введите хотя бы {minLength} символов (Вы ввели {length}).',
	maxLength:'Пожалуйста, введите не больше {maxLength} символов (Вы ввели {length}).',
	integer:'Пожалуйста, введите в это поле число. Дробные числа (например 1.25) тут не разрешены.',
	numeric:'Пожалуйста, введите в это поле число (например "1" или "1.1", или "-1", или "-1.1").',
	digits:'В этом поле Вы можете использовать только цифры и знаки пунктуации (например, телефонный номер со знаками дефиса или с точками).',
	alpha:'В этом поле можно использовать только латинские буквы (a-z). Пробелы и другие символы запрещены.',
	alphanum:'В этом поле можно использовать только латинские буквы (a-z) и цифры (0-9). Пробелы и другие символы запрещены.',
	dateSuchAs:'Пожалуйста, введите корректную дату {date}',
	dateInFormatMDY:'Пожалуйста, введите дату в формате ММ/ДД/ГГГГ (например "12/31/1999")',
	email:'Пожалуйста, введите корректный емейл-адрес. Для примера "fred@domain.com".',
	url:'Пожалуйста, введите правильную ссылку вида http://www.google.com.',
	currencyDollar:'Пожалуйста, введите сумму в долларах. Например: $100.00 .',
	oneRequired:'Пожалуйста, выберите хоть что-нибудь в одном из этих полей.',
	errorPrefix: 'Ошибка: ',
	warningPrefix: 'Внимание: '
});

//translation in windows-1251 codepage
MooTools.lang.set('ru-RU', 'Form.Validator', {
	required:'Ýòî ïîëå îáÿçàòåëüíî ê çàïîëíåíèþ.',
	minLength:'Ïîæàëóéñòà, ââåäèòå õîòÿ áû {minLength} ñèìâîëîâ (Âû ââåëè {length}).',
	maxLength:'Ïîæàëóéñòà, ââåäèòå íå áîëüøå {maxLength} ñèìâîëîâ (Âû ââåëè {length}).',
	integer:'Ïîæàëóéñòà, ââåäèòå â ýòî ïîëå ÷èñëî. Äðîáíûå ÷èñëà (íàïðèìåð 1.25) òóò íå ðàçðåøåíû.',
	numeric:'Ïîæàëóéñòà, ââåäèòå â ýòî ïîëå ÷èñëî (íàïðèìåð "1" èëè "1.1", èëè "-1", èëè "-1.1").',
	digits:'Â ýòîì ïîëå Âû ìîæåòå èñïîëüçîâàòü òîëüêî öèôðû è çíàêè ïóíêòóàöèè (íàïðèìåð, òåëåôîííûé íîìåð ñî çíàêàìè äåôèñà èëè ñ òî÷êàìè).',
	alpha:'Â ýòîì ïîëå ìîæíî èñïîëüçîâàòü òîëüêî ëàòèíñêèå áóêâû (a-z). Ïðîáåëû è äðóãèå ñèìâîëû çàïðåùåíû.',
	alphanum:'Â ýòîì ïîëå ìîæíî èñïîëüçîâàòü òîëüêî ëàòèíñêèå áóêâû (a-z) è öèôðû (0-9). Ïðîáåëû è äðóãèå ñèìâîëû çàïðåùåíû.',
	dateSuchAs:'Ïîæàëóéñòà, ââåäèòå êîððåêòíóþ äàòó {date}',
	dateInFormatMDY:'Ïîæàëóéñòà, ââåäèòå äàòó â ôîðìàòå ÌÌ/ÄÄ/ÃÃÃÃ (íàïðèìåð "12/31/1999")',
	email:'Ïîæàëóéñòà, ââåäèòå êîððåêòíûé åìåéë-àäðåñ. Äëÿ ïðèìåðà "fred@domain.com".',
	url:'Ïîæàëóéñòà, ââåäèòå ïðàâèëüíóþ ññûëêó âèäà http://www.google.com.',
	currencyDollar:'Ïîæàëóéñòà, ââåäèòå ñóììó â äîëëàðàõ. Íàïðèìåð: $100.00 .',
	oneRequired:'Ïîæàëóéñòà, âûáåðèòå õîòü ÷òî-íèáóäü â îäíîì èç ýòèõ ïîëåé.',
	errorPrefix: 'Îøèáêà: ',
	warningPrefix: 'Âíèìàíèå: '
});/*
---

script: Form.Validator.Spanish.js

description: Date messages for Spanish.

license: MIT-style license

authors:
- Ãlfons Sanchez

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Spanish]

...
*/

MooTools.lang.set('es-ES', 'Form.Validator', {

	required:'Este campo es obligatorio.',
	minLength:'Por favor introduce al menos {minLength} caracteres (has introducido {length} caracteres).',
	maxLength:'Por favor introduce no mas de {maxLength} caracteres (has introducido {length} caracteres).',
	integer:'Por favor introduce un numero entero en este campo. Numeros con decimales (p.e. 1,25) no se permiten.',
	numeric:'Por favor introduce solo valores numericos en este campo (p.e. "1" o "1,1" o "-1" o "-1,1").',
	digits:'Por favor usa solo numeros y puntuacion en este campo (por ejemplo, un numero de telefono con guines y puntos no esta permitido).',
	alpha:'Por favor usa letras solo (a-z) en este campo. No se admiten espacios ni otros caracteres.',
	alphanum:'Por favor, usa solo letras (a-z) o numeros (0-9) en este campo. No se admiten espacios ni otros caracteres.',
	dateSuchAs:'Por favor introduce una fecha valida como {date}',
	dateInFormatMDY:'Por favor introduce una fecha valida como DD/MM/YYYY (p.e. "31/12/1999")',
	email:'Por favor, introduce una direccione de email valida. Por ejemplo,  "fred@domain.com".',
	url:'Por favor introduce una URL valida como http://www.google.com.',
	currencyDollar:'Por favor introduce una cantidad valida de €. Por ejemplo €100,00 .',
	oneRequired:'Por favor introduce algo para por lo menos una de estas entradas.',
	errorPrefix: 'Error: ',
	warningPrefix: 'Aviso: ',

	//Form.Validator.Extras

	noSpace: 'No pueden haber espacios en esta entrada.',
	reqChkByNode: 'No hay elementos seleccionados.',
	requiredChk: 'Este campo es obligatorio.',
	reqChkByName: 'Por favor selecciona una {label}.',
	match: 'Este campo necesita coincidir con el campo {matchName}',
	startDate: 'la fecha de inicio',
	endDate: 'la fecha de fin',
	currendDate: 'la fecha actual',
	afterDate: 'La fecha debe ser igual o posterior a {label}.',
	beforeDate: 'La fecha debe ser igual o anterior a {label}.',
	startMonth: 'Por favor selecciona un mes de origen',
	sameMonth: 'Estas dos fechas deben estar en el mismo mes - debes cambiar una u otra.'

});/*
---

script: Form.Validator.Swedish.js

description: Date messages for Swedish.

license: MIT-style license

authors:
- Martin Lundgren

requires:
- /Lang
- /Form.Validator

provides: [Form.Validator.Swedish]

...
*/

MooTools.lang.set('sv-SE', 'Form.Validator', {

	required:'Fältet är obligatoriskt.',
	minLength:'Ange minst {minLength} tecken (du angav {length} tecken).',
	maxLength:'Ange högst {maxLength} tecken (du angav {length} tecken). ',
	integer:'Ange ett heltal i fältet. Tal med decimaler (t.ex. 1,25) är inte tillåtna.',
	numeric:'Ange endast numeriska värden i detta fält (t.ex. "1" eller "1.1" eller "-1" eller "-1,1").',
	digits:'Använd endast siffror och skiljetecken i detta fält (till exempel ett telefonnummer med bindestreck tillåtet).',
	alpha:'Använd endast bokstäver (a-ö) i detta fält. Inga mellanslag eller andra tecken är tillåtna.',
	alphanum:'Använd endast bokstäver (a-ö) och siffror (0-9) i detta fält. Inga mellanslag eller andra tecken är tillåtna.',
	dateSuchAs:'Ange ett giltigt datum som t.ex. {date}',
	dateInFormatMDY:'Ange ett giltigt datum som t.ex. YYYY-MM-DD (i.e. "1999-12-31")',
	email:'Ange en giltig e-postadress. Till exempel "erik@domain.com".',
	url:'Ange en giltig webbadress som http://www.google.com.',
	currencyDollar:'Ange en giltig belopp. Exempelvis 100,00.',
	oneRequired:'Vänligen ange minst ett av dessa alternativ.',
	errorPrefix: 'Fel: ',
	warningPrefix: 'Varning: ',

	//Form.Validator.Extras

	noSpace: 'Det får inte finnas några mellanslag i detta fält.',
	reqChkByNode: 'Inga objekt är valda.',
	requiredChk: 'Detta är ett obligatoriskt fält.',
	reqChkByName: 'Välj en {label}.',
	match: 'Detta fält måste matcha {matchName}',
	startDate: 'startdatumet',
	endDate: 'slutdatum',
	currendDate: 'dagens datum',
	afterDate: 'Datumet bör vara samma eller senare än {label}.',
	beforeDate: 'Datumet bör vara samma eller tidigare än {label}.',
	startMonth: 'Välj en start månad',
	sameMonth: 'Dessa två datum måste vara i samma månad - du måste ändra det ena eller det andra.'

});// $Id: common.js 648 2009-11-30 21:26:44Z pagameba $
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
window.addEvent('load',
function() {
    if (! ("console" in window) || !("firebug" in window.console)) {
        var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
        "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

        window.console = {};
        for (var i = 0; i < names.length; ++i) {
            window.console[names[i]] = function() {};
        }
    }
});

// add mutator that sets jxFamily when creating a class so we can check
// its type
Class.Mutators.Family = function(self, name) {
    if ($defined(name)) {
        self.jxFamily = name;
        return self;
    }
    else if(!$defined(this.prototype.jxFamily)) {
        this.implement({
            'jxFamily': self
        });
    }
};

// this replaces the mootools $unlink method with our own version that
// avoids infinite recursion on Jx objects.
function $unlink(object) {
    if (object && object.jxFamily) {
        return object;
    }
    var unlinked;
    switch ($type(object)) {
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
    default:
        return object;
    }
    return unlinked;
}

/* Setup global namespace
 * If jxcore is loaded by jx.js, then the namespace and baseURL are
 * already established
 */
if (typeof Jx === 'undefined') {
    var Jx = {};
    (function() {
        var aScripts = document.getElementsByTagName('SCRIPT');
        for (var i = 0; i < aScripts.length; i++) {
            var s = aScripts[i].src;
            var matches = /(.*[jx|js|lib])\/jxlib(.*)/.exec(s);
            if (matches && matches[0]) {
                /**
                 * APIProperty: {String} baseURL
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
                Jx.aPixel = document.createElement('img', {
                    alt: '',
                    title: ''
                });
                Jx.aPixel.src = matches[1] + '/a_pixel.png';
                Jx.baseURL = Jx.aPixel.src.substring(0,
                Jx.aPixel.src.indexOf('a_pixel.png'));

            }
        }

    })();
}

 (function() {
    /**
     * Determine if we're running in Adobe AIR. Run this regardless of whether
     * the above runs or not.
     */
    var aScripts = document.getElementsByTagName('SCRIPT');
    var src = aScripts[0].src;
    if (src.contains('app:')) {
        Jx.isAir = true;
    } else {
        Jx.isAir = false;
    }
})();

/**
 * APIMethod: applyPNGFilter
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
Jx.applyPNGFilter = function(o) {
    var t = Jx.aPixel.src;
    if (o.src != t) {
        var s = o.src;
        o.src = t;
        o.runtimeStyle.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='" + s + "',sizingMethod='scale')";
    }
};

/**
 * NOTE: We should consider moving the image loading code into a separate
 * class. Perhaps as Jx.Preloader which could extend Jx.Object
 */
Jx.imgQueue = [];
//The queue of images to be loaded
Jx.imgLoaded = {};
//a hash table of images that have been loaded and cached
Jx.imagesLoading = 0;
//counter for number of concurrent image loads
/**
 * APIMethod: addToImgQueue
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
 * APIMethod: checkImgQueue
 *
 * An internal method that ensures no more than 2 images are loading at a
 * time.
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
        obj.element.onload = function() {--Jx.imagesLoading;
            Jx.checkImgQueue();
        };
        obj.element.onerror = function() {--Jx.imagesLoading;
            Jx.checkImgQueue();
        };
        obj.element.src = obj.src;
    }
};

/**
 * APIMethod: createIframeShim
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
        'class': 'jxIframeShim',
        'scrolling': 'no',
        'frameborder': 0,
        'src': Jx.baseURL + '/empty.html'
    });
};
/**
 * APIMethod: getNumber
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
    var result = n === null || isNaN(parseInt(n, 10)) ? (def || 0) : parseInt(n, 10);
    return result;
};

/**
 * APIMethod: getPageDimensions
 * return the dimensions of the browser client area.
 *
 * Returns:
 * {Object} an object containing a width and height property 
 * that represent the width and height of the browser client area.
 */
Jx.getPageDimensions = function() {
    return {
        width: window.getWidth(),
        height: window.getHeight()
    };
};

/**
 * APIMethod: Jx.type
 * safely return the type of an object using the mootools type system
 *
 * Returns:
 * {Object} an object containing a width and height property 
 * that represent the width and height of the browser client area.
 */
Jx.type = function(obj) {
    if (typeof obj == 'undefined') {
        return false;
    }
    return obj.jxFamily || $type(obj);
};

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


(function($) {
    // Wrapper for document.id

    Element.implement({
        /**
         * APIMethod: getBoxSizing
         * return the box sizing of an element, one of 'content-box' or 
         *'border-box'.
         *
         * Parameters: 
         * elem - {Object} the element to get the box sizing of.
         *
         * Returns:
         * {String} the box sizing of the element.
         */
        getBoxSizing: function() {
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
                result = (sizing ? sizing: 'content-box');
            }
            return result;
        },
        /**
         * APIMethod: getContentBoxSize
         * return the size of the content area of an element.  This is the
         * size of the element less margins, padding, and borders.
         *
         * Parameters: 
         * elem - {Object} the element to get the content size of.
         *
         * Returns:
         * {Object} an object with two properties, width and height, that
         * are the size of the content area of the measured element.
         */
        getContentBoxSize: function() {
            var w = this.offsetWidth;
            var h = this.offsetHeight;
            var s = this.getSizes(['padding', 'border']);
            w = w - s.padding.left - s.padding.right - s.border.left - s.border.right;
            h = h - s.padding.bottom - s.padding.top - s.border.bottom - s.border.top;
            return {
                width: w,
                height: h
            };
        },
        /**
         * APIMethod: getBorderBoxSize
         * return the size of the border area of an element.  This is the size
         * of the element less margins.
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
            return {
                width: w,
                height: h
            };
        },

        /**
         * APIMethod: getMarginBoxSize
         * return the size of the margin area of an element.  This is the size
         * of the element plus margins.
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
            return {
                width: w,
                height: h
            };
        },
        /**
         * APIMethod: getSizes
         * measure the size of various styles on various edges and return
         * the values.
         *
         * Parameters:
         * styles - array, the styles to compute.  By default, this is
         * ['padding', 'border','margin'].  If you don't need all the styles,
         * just request the ones you need to minimize compute time required.
         * edges - array, the edges to compute styles for.  By default,  this
         * is ['top','right','bottom','left'].  If you don't need all the
         * edges, then request the ones you need to minimize compute time.
         *
         * Returns:
         * {Object} an object with one member for each requested style.  Each
         * style member is an object containing members for each requested
         * edge. Values are the computed style for each edge in pixels.
         */
        getSizes: function(which, edges) {
            which = which || ['padding', 'border', 'margin'];
            edges = edges || ['left', 'top', 'right', 'bottom'];
            var result = {};
            which.each(function(style) {
                result[style] = {};
                edges.each(function(edge) {
                    var e = (style == 'border') ? edge + '-width': edge;
                    var n = this.getStyle(style + '-' + e);
                    result[style][edge] = n === null || isNaN(parseInt(n, 10)) ? 0: parseInt(n, 10);
                },
                this);
            },
            this);
            return result;
        },
        /**
         * APIMethod: setContentBoxSize
         * set either or both of the width and height of an element to
         * the provided size.  This function ensures that the content
         * area of the element is the requested size and the resulting
         * size of the element may be larger depending on padding and
         * borders.
         *
         * Parameters: 
         * elem - {Object} the element to set the content area of.
         * size - {Object} an object with a width and/or height property that
         * is the size to set the content area of the element to.
         */
        setContentBoxSize: function(size) {
            if (this.getBoxSizing() == 'border-box') {
                var m = this.measure(function() {
                    return this.getSizes(['padding', 'border']);
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
         * APIMethod: setBorderBoxSize
         * set either or both of the width and height of an element to
         * the provided size.  This function ensures that the border
         * size of the element is the requested size and the resulting
         * content areaof the element may be larger depending on padding and
         * borders.
         *
         * Parameters: 
         * elem - {Object} the element to set the border size of.
         * size - {Object} an object with a width and/or height property that
         * is the size to set the content area of the element to.
         */
        setBorderBoxSize: function(size) {
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
         * APIMethod: descendantOf
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
         * APIMethod: findElement
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
            return o.tagName == type ? o: false;
        }
    });

    Array.implement({

        /**
         * APIMethod: swap
         * swaps 2 elements of an array
         * 
         * Parameters:
         * a - the first position to swap
         * b - the second position to swap
         */
        'swap': function(a, b) {
            var temp;
            temp = this[a];
            this[a] = this[b];
            this[b] = temp;
        }

    });

})(document.id || $);
// End Wrapper for document.id
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
}))();// $Id: object.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
/**
 * Class: Jx.Object
 * Base class for all other object in the JxLib framework. This class
 * implements both mootools mixins Events and Options so the rest of the
 * classes don't need to.
 *
 * The Initialization Pipeline:
 * Jx.Object provides a default initialize method to construct new instances
 * of objects that inherit from it.  No sub-class should override initialize
 * unless you know exactly what you're doing.  Instead, the initialization
 * pipeline provides an init() method that is intended to be overridden in
 * sub-classes to provide class-specific initialization as part of the
 * initialization pipeline.
 *
 * The basic initialization pipeline for a Jx.Object is to parse the
 * parameters provided to initialize(), separate out options from other formal
 * parameters based on the parameters property of the class, call init() and
 * initialize plugins.  
 *
 * Parsing Parameters:
 * Because each sub-class no longer has an initialize method, it no longer has
 * direct access to parameters passed to the constructor.  Instead, a 
 * sub-class is expected to provide a parameters attribute with an array of
 * parameter names in the order expected.  Jx.Object will enumerate the 
 * attributes passed to its initialize method and automatically place them
 * in the options object under the appropriate key (the value from the 
 * array).  Parameters not found will not be present or will be null.
 *
 * The default parameters are a single options object which is merged with
 * the options attribute of the class.
 *
 * Calling Init:
 * Jx.Object fires the event 'preInit' before calling the init() method,
 * calls the init() method, then fires the 'postInit' event.  It is expected
 * that most sub-class specific initialization will happen in the init()
 * method.  A sub-class may hook preInit and postInit events to perform tasks
 * in one of two ways. 
 * 
 * First, simply send onPreInit and onPostInit functions via the options object
 * as follows (they could be standalone functions or functions of another object
 * setup using .bind())
 * 
 * (code)
 * var preInit = function () {}
 * var postInit = function () {}
 * 
 * var options = {
 *   onPreInit: preInit,
 *   onPostInit: postInit,
 *   ...other options...
 * };
 * 
 * var dialog = new Jx.Dialog(options);
 * (end)
 * 
 * The second method you can use is to override the initialize method
 *
 * (code)
 * var MyClass = new Class({
 *   Family: 'MyClass',
 *   initialize: function() {
 *     this.addEvent('preInit', this.preInit.bind(this));
 *     this.addEvent('postInit', this.postInit.bind(this));
 *     this.parent.apply(this, arguments);
 *   },
 *   preInit: function() {
 *     // something just before init() is called
 *   },
 *   postInit: function() {
 *     // something just after init() is called
 *   },
 *   init: function() {
 *     this.parent();
 *     // initialization code here
 *   }
 * });
 * (end)
 * 
 * When the object finishes initializing itself (including the plugin initialization)
 * it will fire off the initializeDone event. You can hook into this event in the same 
 * way as the events mentioned above.
 *
 * Plugins:
 * Plugins provide pieces of additional, optional, functionality. They are not 
 * necessary for the proper function of an object. All plugins should be located 
 * in the Jx.Plugin namespace and they should be further segregated by applicable 
 * object. While all objects can support plugins not all of them have the automatic
 * instantiation of applicaple plugins turned on. In order to turn this feature on 
 * for an object you need to set the pluginNamespace property of the object. The 
 * following is an example of setting the property:
 * 
 * (code)
 * var MyClass = new Class({
 *   Extends: Jx.Object,
 *   pluginNamespace: 'MyClass'
 * };
 * (end)
 * 
 * The absence of this property does not mean you cannot attach a plugin to an 
 * object. It simply means that you can't have Jx.Object create the
 * plugin for you.
 * 
 * There are four ways to attach a plugin to an object. First, simply instantiate 
 * the plugin yourself and call its attach() method (other class options left out 
 * for the sake of simplicity):
 * 
 * (code)
 * var MyGrid = new Jx.Grid();
 * var APlugin = new Jx.Plugin.Grid.Selector();
 * APlugin.attach(MyGrid);
 * (end)
 * 
 * Second, you can instantiate the plugin first and pass it to the object through the
 * plugins array in the options object.
 * 
 * (code)
 * var APlugin = new Jx.Plugin.Grid.Selector();
 * var MyGrid = new Jx.Grid({plugins: [APlugin]});
 * (end)
 * 
 * The third way is to pass the information needed to instantiate the plugin in 
 * the plugins array of the options object:
 * 
 * (code)
 * var MyGrid = new Jx.Grid({
 *   plugins: [{
 *      name: 'Selector',
 *      options: {}    //options needed to create this plugin
 *   },{
 *      name: 'Sorter',
 *      options: {}
 *   }]
 * });
 * (end)
 * 
 * The final way, if the plugin has no options, is to pass the name of the plugin
 * as a simple string in the plugins array.
 * 
 * (code)
 * var MyGrid = new Jx.Grid({
 *   plugins: ['Selector','Sorter']
 * });
 * (end)
 * 
 * Part of the process of initializing plugins is to call prePluginInit() and
 * postPluginInit(). These events provide you access to the object just before 
 * and after the plugins are initialized and/or attached to the object using
 * methods 2 and 3 above. You can hook into these in the same way that you hook into
 * the preInit() and postInit() events.  
 * 
 * Destroying Jx.Object Instances:
 * Jx.Object provides a destroy method that cleans up potential memory leaks
 * when you no longer need an object.  Sub-classes are expected to implement
 * a cleanup() method that provides specific cleanup code for each
 * sub-class.  Remember to call this.parent() when providing a cleanup()
 * method. Destroy will also fire off 2 events: preDestroy and postDestroy. You 
 * can hook into these methods in the same way as the init or plugin events. 
 *
 * The Family Attribute:
 * the Family attribute of a class is used internally by JxLib to identify Jx
 * objects within mootools.  The actual value of Family is unimportant to Jx.
 * If you do not provide a Family, a class will inherit it's base class family
 * up to Jx.Object.  Family is useful when debugging as you will be able to
 * identify the family in the firebug inspector, but is not as useful for
 * coding purposes as it does not allow for inheritance.
 *
 * Parameters:
 * 
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
Jx.Object = new Class({
    Family: "Jx.Object",
    Implements: [Options, Events],
    plugins: new Hash(),
    pluginNamespace: 'Other',
    parameters: ['options'],

    initialize: function(){
        //normalize arguments
        var numArgs = arguments.length;
        var options = {};

        if (numArgs > 0) {
            if (numArgs === 1
                    && (Jx.type(arguments[0])==='object' || Jx.type(arguments[0])==='Hash')
                    && this.parameters.length === 1
                    && this.parameters[0] === 'options') {
                options = arguments[0];
            } else {
                var numParams = this.parameters.length;
                var index;
                if (numParams <= numArgs) {
                    index = numParams;
                } else {
                    index = numArgs;
                }
                options = {};
                for (var i = 0; i < index; i++) {
                    if (this.parameters[i] === 'options') {
                        options = $merge(options, arguments[i]);
                    } else {
                        options[this.parameters[i]] = arguments[i];
                    }
                }
            }
        }

        this.setOptions(options);
        this.fireEvent('preInit');
        this.init();
        this.fireEvent('postInit');
        this.fireEvent('prePluginInit');
        this.initPlugins();
        this.fireEvent('postPluginInit');
        this.fireEvent('initializeDone');
    },

    initPlugins: function () {
        //pluginNamespace must be defined in order to pass plugins to the object
        if ($defined(this.pluginNamespace)) {
            if ($defined(this.options.plugins)
                    && Jx.type(this.options.plugins) === 'array') {
                this.options.plugins.each(function (plugin) {
                    if (plugin instanceof Jx.Plugin) {
                        plugin.attach(this);
                        this.plugins.set(plugin.name, plugin);
                    } else if (Jx.type(plugin) === 'object') {
                        //All plugin-enabled objects should define a pluginNamespace member variable
                        //that is used for locating the plugins. The default namespace is 'Other' for
                        //now until we come up with a better idea
                        var p = new Jx.Plugin[this.pluginNamespace][plugin.name.capitalize()](plugin.options);
                        p.attach(this);
                    } else if (Jx.type(plugin) === 'string') {
                        //this is a name for a plugin.
                        var p = new Jx.Plugin[this.pluginNamespace][plugin.capitalize()]();
                        p.attach(this);
                    }
                        
                }, this);
            }
        }
    },

    destroy: function () {
        this.fireEvent('preDestroy');
        this.cleanup();
        this.fireEvent('postDestroy');
    },

    cleanup: function () {
        //detach plugins
        if (this.plugins.getLength > 0) {
            this.plugins.each(function (plugin) {
                plugin.detach();
                plugin.destroy();
            }, this);
        }
    },

    init: $empty,
    /**
     * APIMethod: registerPlugin
     * This method is called by a plugin that has its attach method
     * called.
     * 
     * Parameters:
     * plugin - the plugin to register with this object
     */
    registerPlugin: function (plugin) {
        if (!this.plugins.has(plugin.name)) {
            this.plugins.set(plugin.name,  plugin);
        }
    },
    /**
     * APIMethod: deregisterPlugin
     * his method is called by a plugin that has its detach method
     * called.
     * 
     * Parameters:
     * plugin - the plugin to deregister.
     */
    deregisterPlugin: function (plugin) {
        if (this.plugins.has(plugin.name)) {
            this.plugins.erase(plugin.name);
        }
    },
    
    /**
     * APIMethod: getPlugin
     * Allows a developer to get a reference to a plugin with only the
     * name of the plugin.
     * 
     * Parameters:
     * name - the name of the plugin as defined in the plugin's name property
     */
    gePlugin: function (name) {
        if (this.plugins.has(name)) {
            return this.plugins.get(name);
        }
    }

});
// $Id: widget.js 678 2010-01-07 14:05:26Z pagameba $
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
    Family: "Jx.Widget",
    Extends: Jx.Object,

    options: {
        /**
         * Option: content
         * content may be an HTML element reference, the id of an HTML element
         *      already in the DOM, or an HTML string that becomes the inner HTML of
         *      the element.
         */
        content: null,
        /**
         * Option: contentURL
         * the URL to load content from
         */
        contentURL: null,
        template: '<div class="jxWidget"></div>'
    },

    classes: new Hash({
        domObj: 'jxWidget'
    }),

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
     * APIMethod: init
     * sets up the base widget code and runs the render function.
     */
    init: function(){
        if (!this.options.deferRender) {
            this.fireEvent('preRender');
            this.render();
            this.fireEvent('postRender');
        } else {
            this.fireEvent('deferRender');
        }
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
        if (src != null) {
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
        element = document.id(element) || document.id(this);
        if (element) {
            if (!this.chrome) {
                this.makeChrome(element);
                element.addClass('jxHasChrome');
            }
            this.resizeChrome(element);
            if (element && this.chrome.parentNode !== element) {
                element.adopt(this.chrome);
            }
        }
    },

    /**
     * Method: hideChrome
     * removes the chrome from the DOM.  If you do this, you can't
     * call showChrome with no arguments.
     */
    hideChrome: function() {
        if (this.chrome) {
            this.chrome.parentNode.removeClass('jxHasChrome');
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
    },

    dispose: function(){
        var el = document.id(this.addable) || document.id(this.domObj);
        if (el) {
            el.dispose();
        }
    },

    cleanup: function(){
        if ($defined(this.domObj)) {
            this.domObj.destroy();
        }
        if ($defined(this.addable)) {
            this.addable.destroy();
        }
        if ($defined(this.domA)) {
            this.domA.destroy();
        }
        this.parent();
    },

    render: function() {
        this.elements = this.processElements(this.options.template,
            this.classes);
    },

    elements: null,

    processElements: function(template, classes) {
        var keys = classes.getValues();
        elements = this.processTemplate(template, keys);
        classes.each(function(value, key) {
            if (key != 'elements' && elements.get(value)) {
                this[key] = elements.get(value);
            }
        }, this);
        return elements;
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
}

Jx.Selection = new Class({
    Family: 'Jx.Selection',
    Extends: Jx.Object,
    options: {
        /**
         * Option: eventToFire
         * Allows the developer to change the event that is fired in case one
         * object is using multiple selectionManager instances.
         */
        eventToFire: { 
            select: 'select',
            unselect: 'unselect'
        },
        /**
         * APIProperty: selectClass
         * the CSS class name to add to the wrapper element when it is selected
         */
        selectClass: 'jxSelected',
        /**
         * Option: selectMode
         * {string} default single.  May be single or multiple.  In single mode
         * only one item may be selected.  Selecting a new item will implicitly
         * unselect the currently selected item.
         */
        selectMode: 'single',
        /**
         * Option: selectToggle
         * {Boolean} Default true.  Selection of a selected item will unselect
         * it.
         */
        selectToggle: true,
        /**
         * Option: minimumSelection
         * {Integer} Default 0.  The minimum number of items that must be
         * selected.  If set to a number higher than 0, items added to a list
         * are automatically selected until this minimum is met.  The user may
         * not unselect items if unselecting them will drop the total number of
         * items selected below the minimum.
         */
        minimumSelection: 0
    },
    
    selection: null,
    
    init: function () {
        this.selection = [];
    },
    
    defaultSelect: function(item) {
        if (this.selection.length < this.options.minimumSelection) {
            this.select(item);
        }
    },
    
    select: function (item) {
        item = document.id(item);
        if (this.options.selectMode === 'multiple') {
            if (this.selection.contains(item)) {
                this.unselect(item);
            } else {
                document.id(item).addClass(this.options.selectClass);
                this.selection.push(item);
                this.fireEvent(this.options.eventToFire.select, item);
            }
        } else if (this.options.selectMode == 'single') {
            if (!this.selection.contains(item)) {
                document.id(item).addClass(this.options.selectClass);
                this.selection.push(item);
                if (this.selection.length > 1) {
                    this.unselect(this.selection[0]);
                }
            } else {
                this.unselect(item);
            }
            this.fireEvent(this.options.eventToFire.select, item);
        }
    },
    
    unselect: function (item) {
        if (this.selection.contains(item) && 
            this.selection.length > this.options.minimumSelection) {
            document.id(item).removeClass(this.options.selectClass);
            this.selection.erase(item);
            this.fireEvent(this.options.eventToFire.unselect, item, this);
        }
    },
    
    selected: function () {
        return this.selection;
    },
    
    isSelected: function(item) {
        return this.selection.contains(item);
    }

});// $Id: list.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
/**
 * Class: Jx.List
 * 
 * Manage a list of DOM elements and provide an API and events for managing
 * those items within a container.  Works with Jx.Selection to manage
 * selection of items in the list.  You have two options for managing
 * selections.  The first, and default, option is to specify select: true
 * in the constructor options and any of the <Jx.Selection> options as well.
 * This will create a default Jx.Selection object to manage selections.  The
 * second option is to pass a Jx.Selection object as the third constructor
 * argument.  This allows sharing selection between multiple lists.
 *
 * Example:
 * (code)
 * (end)
 *
 * Events:
 * add - fired when an item is added
 * remove - fired when an item is removed
 * mouseenter - fired when the user mouses over an element
 * mouseleave - fired when the user mouses out of an element
 * select - fired when an item is selected
 * unselect - fired when an item is selected
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.List = new Class({
    Family: 'Jx.List',
    Extends: Jx.Object,
    parameters: ['container', 'options', 'selection'],
    /* does this object own the selection object (and should clean it up) */
    ownsSelection: false,
    /**
     * APIProperty: container
     * the element that will contain items as they are added
     */
    container: null,
    /**
     * APIProperty: selection
     * <Jx.Selection> a selection object if selection is enabled
     */
    selection: null,
    options: {
        /**
         * Option: items
         * an array of items to add to the list right away
         */
        items: null,
        /**
         * Option: hover
         * {Boolean} default true.  If set to true, the wrapper element will
         * obtain the defined hoverClass if set and mouseenter/mouseleave
         * events will be emitted when the user hovers over and out of elements
         */
        hover: false,
        /**
         * Option: hoverClass
         * the CSS class name to add to the wrapper element when the mouse is
         * over an item
         */
        hoverClass: 'jxHover',

        /**
         * Option: press
         * {Boolean} default true.  If set to true, the wrapper element will
         * obtain the defined pressClass if set and mousedown/mouseup
         * events will be emitted when the user clicks on elements
         */
        press: false,
        /**
         * Option: pressedClass
         * the CSS class name to add to the wrapper element when the mouse is
         * down on an item
         */
        pressClass: 'jxPressed',
        
        /**
         * Option: select
         * {Boolean} default false.  If set to true, the wrapper element will
         * obtain the defined selectClass if set and select/unselect events
         * will be emitted when items are selected and unselected.  For other
         * selection objects, see <Jx.Selection>
         */
        select: false
    },
    
    /**
     * Method: init
     * internal method to initialize this object
     */
    init: function() {
        this.container = document.id(this.options.container);
        this.container.store('jxList', this);
        
        var target = this;
        var isEnabled = function(el) {
            var item = el.retrieve('jxListTargetItem') || el;
            return !item.hasClass('jxDisabled');
        };
        var isSelectable = function(el) {
            var item = el.retrieve('jxListTargetItem') || el;
            return !item.hasClass('jxUnselectable');
        };
        this.bound = {
            mousedown: function() {
                if (isEnabled(this)) {
                    this.addClass(target.options.pressClass);
                    target.fireEvent('mousedown', this, target);
                }
            },
            mouseup: function() {
                if (isEnabled(this)) {
                    this.removeClass(target.options.pressClass);
                    target.fireEvent('mouseup', this, target);
                }
            },
            mouseenter: function() {
                if (isEnabled(this)) {
                    this.addClass(target.options.hoverClass);
                    target.fireEvent('mouseenter', this, target);
                }
            },
            mouseleave: function() {
                if (isEnabled(this)) {
                    this.removeClass(target.options.hoverClass);
                    target.fireEvent('mouseleave', this, target);
                }
            },
            keydown: function(e) {
                if (e.key == 'enter' && isEnabled(this)) {
                    this.addClass('jxPressed');
                }
            },
            keyup: function(e) {
                if (e.key == 'enter' && isEnabled(this)) {
                    this.removeClass('jxPressed');
                }
            },
            click: function () {
                if (target.selection && 
                    isEnabled(this) && 
                    isSelectable(this)) {
                    target.selection.select(this, target);
                }
            },
            select: function(item) {
                if (isEnabled(item)) {
                    var itemTarget = item.retrieve('jxListTargetItem') || item;
                    target.fireEvent('select', itemTarget);
                }
            },
            unselect: function(item) {
                if (isEnabled(item)) {
                    var itemTarget = item.retrieve('jxListTargetItem') || item;
                    target.fireEvent('unselect', itemTarget);
                }
            }
        };
        
        if (this.options.selection) {
            this.selection = this.options.selection;
            this.options.select = true;
        } else if (this.options.select) {
            this.selection = new Jx.Selection(this.options);
            this.ownsSelection = true;
        }
        
        this.setSelection(this.selection);
            
        if ($defined(this.options.items)) {
            this.add(this.options.items);
        }
    },
    
    /**
     * Method: cleanup
     * destroy the list and release anything it references
     */
    cleanup: function() {
        this.container.getChildren().each(function(item){
            this.remove(item);
        }, this);
        this.setSelection(null);
        this.bound = null;
        this.container.eliminate('jxList');
    },
    
    /**
     * APIMethod: add
     * add an item to the list of items at the specified position
     *
     * Parameters:
     * item - {mixed} the object to add, a DOM element or an
     * object that provides a getElement method.  An array of items may also
     * be provided.  All items are inserted sequentially at the indicated
     * position.
     * position - {mixed} optional, the position to add the element, either
     * an integer position in the list or another item to place this item
     * after
     */
    add: function(item, position) {
        if (Jx.type(item) == 'array') {
            item.each(function(what){ this.add(what, position); }.bind(this) );
            return;
        }
        /* the element being wrapped */
        var el = document.id(item);
        var target = el.retrieve('jxListTarget') || el;
        if (target) {
            target.store('jxListTargetItem', el);
            if (this.options.press && this.options.pressClass) {
                target.addEvents({
                    mousedown: this.bound.mousedown,
                    mouseup: this.bound.mouseup,
                    keyup: this.bound.keyup,
                    keydown: this.bound.keydown
                });
            }
            if (this.options.hover && this.options.hoverClass) {
                target.addEvents({
                    mouseenter: this.bound.mouseenter,
                    mouseleave: this.bound.mouseleave
                });
            }
            if (this.selection) {
                target.addEvents({
                    click: this.bound.click
                });
            }
            if ($defined(position)) {
                if ($type(position) == 'number') {
                    if (position < this.container.childNodes.length) {
                        el.inject(this.container.childNodes[position],'before');
                    } else {
                        el.inject(this.container, 'bottom');
                    }
                } else if (this.container.hasChild(position)) {
                    el.inject(position,'after');
                }
                this.fireEvent('add', item, this);
            } else {
                el.inject(this.container, 'bottom');
                this.fireEvent('add', item, this);
            }
            if (this.selection) {
                this.selection.defaultSelect(el);
            }
        }
    },
    /**
     * APIMethod: remove
     * remove an item from the list of items
     *
     * Parameters:
     * item - {mixed} the item to remove or the index of the item to remove. 
     * An array of items may also be provided.
     *
     * Returns:
     * {mixed} the item that was removed or null if the item is not a member
     * of this list.
     */
    remove: function(item) {
        var el = document.id(item);
        if (el && this.container.hasChild(el)) {
            this.unselect(el, true);
            el.dispose();
            var target = el.retrieve('jxListTarget') || el;
            target.removeEvents(this.bound);
            this.fireEvent('remove', item, this);
            return item;
        }
        return null;
    },
    /**
     * APIMethod: replace
     * replace one item with another
     *
     * Parameters:
     * item - {mixed} the item to replace or the index of the item to replace
     * withItem - {mixed} the object, DOM element, Jx.Object or an object 
     * implementing getElement to add
     *
     * Returns:
     * {mixed} the item that was removed
     */
    replace: function(item, withItem) {
        if (this.container.hasChild(item)) {
            this.add(withItem, item);
            this.remove(item);
        }
    },
    /**
     * APIMethod: indexOf
     * find the index of an item in the list
     *
     * Parameters:
     * item - {mixed} the object, DOM element, Jx.Object or an object 
     * implementing getElement to find the index of
     * 
     * Returns:
     * {integer} the position of the item or -1 if not found
     */
    indexOf: function(item) {
        return $A(this.container.childNodes).indexOf(item);
    },
    /**
     * APIMethod: count
     * returns the number of items in the list
     */
    count: function() {
        return this.container.childNodes.length;
    },
    /**
     * APIMethod: items
     * returns an array of the items in the list
     */
    items: function() {
        return $A(this.container.childNodes);
    },
    /**
     * APIMethod: each
     * applies the supplied function to each item
     *
     * Parameters:
     * func - {function} the function to apply, it will receive the item and
     * index of the item as parameters
     */
    each: function(f) {
        $A(this.container.childNodes).each(f);
    },
    /**
     * APIMethod: select
     * select an item
     *
     * Parameters:
     * item - {mixed} the object to select, a DOM element, a Jx.Object, or an
     * object that provides a getElement method.  An array of items may also be
     * provided.
     */
    select: function(item) {
        if (this.selection) {
            this.selection.select(item);
        }
    },
    /**
     * APIMethod: unselect
     * unselect an item or items
     *
     * Parameters:
     * item - {mixed} the object to select, a DOM element, a Jx.Object, or an
     * object that provides a getElement method.  An array of elements may also
     * be provided.
     * force - {Boolean} force deselection even if this violates the minimum
     * selection constraint (used internally when removing items)
     */
    unselect: function(item, force) {
        if (this.selection) {
            this.selection.unselect(item);
        }
    },
    /**
     * APIMethod: selected
     * returns the selected item or items
     *
     * Returns:
     * {mixed} the selected item or an array of selected items
     */
    selected: function() {
        return this.selection ? this.selection.selected : [];
    },
    /**
     * APIMethod: empty
     * clears all of the items from the list
     */
    empty: function(){
        this.container.getChildren().each(function(item){
            this.remove(item);
        }, this);
    },
    /**
     * APIMethod: setSelection
     * sets the <Jx.Selection> object that this list will use for selection
     * events.
     *
     * Parameters:
     * {<Jx.Selection>} the selection object, or null to remove it.
     */
    setSelection: function(selection) {
        if (this.selection) {
            this.selection.removeEvents(this.bound);
            if (this.ownsSelection) {
                this.selection.destroy();
                this.ownsSelection = false;
            }
        }
        
        this.selection = selection;
        if (this.selection) {
            this.selection.addEvents({
                select: this.bound.select,
                unselect: this.bound.unselect
            });
        }
    }

});// $Id: record.js 660 2009-12-05 21:21:20Z jonlb@comcast.net $
/**
 * Class: Jx.record
 * 
 * Extends: <Jx.Object>
 * 
 * This class is used as a representation (or container) for a single row
 * of data in a <Jx.Store>. It is not usually directly instantiated by the 
 * developer but rather by the store itself.
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Record = new Class({
    
    Extends: Jx.Object,
    Family: 'Jx.Record',
    
    options: {
        /**
         * Option: separator
         * The separator to pass to the comparator
         * constructor (<Jx.Compare>) - defaults to '.'
         */
        separator : '.',
        
        primaryKey: null
    },
    /**
     * Property: data
     * The data for this record
     */
    data: null,
    /**
     * Property: state
     * used to determine the state of this record. When not null (meaning no 
     * changes were made) this should be one of
     * 
     * - Jx.Store.Record.UPDATE
     * - Jx.Store.Record.DELETE
     * - Jx.Store.Record.INSERT
     */
    state: null,
    /**
     * Property: columns
     * Holds a reference to the columns for this record. These are usually
     * passed to the record from the store. This should be an array of objects
     * where the objects represent the columns. The object should take the form:
     * 
     * (code)
     * {
     *     name: <column name>,
     *     type: <column type>,
     *     ..additional options required by the record implementation...
     * }
     * (end)
     * 
     * The type of the column should be one of alphanumeric, numeric, date, 
     * boolean, or currency.
     */
    columns: null,
    
    parameters: ['store', 'columns', 'data', 'options'],
    
    init: function () {
        this.parent();
        if ($defined(this.options.columns)) {
            this.columns = this.options.columns;
        }
        
        if ($defined(this.options.data)) {
            this.processData(this.options.data);
        } else {
            this.data = new Hash();
        }
        
        if ($defined(this.options.store)) {
            this.store = this.options.store;
        }
            
    },
    /**
     * APIMethod: get
     * returns the value of the requested column. Can be programmed to handle
     * pseudo-columns (such as the primaryKey column implemented in this base
     * record).
     * 
     * Parameters:
     * column - the string, index, or object of the requested column
     */
    get: function (column) {
        var type = Jx.type(column);
        if (type !== 'object') {
            if (column === 'primaryKey') {
                column = this.resolveCol(this.options.primaryKey);
            } else {
                column = this.resolveCol(column);
            }
        }
        if (this.data.has(column.name)) {
            return this.data.get(column.name);
        } else {
            return null;
        }
    },
    /**
     * APIMethod: set
     * Sets a given value into the requested column. 
     * 
     *  Parameters:
     *  column - the object, index, or string name of the target column
     *  data - the data to add to the column
     */
    set: function (column, data) {
        var type = Jx.type(column);
        if (type !== 'object') {
            column = this.resolveCol(column);
        }
        
        if (!$defined(this.data)) {
            this.data = new Hash();
        }
        
        var oldValue = this.get(column);
        this.data.set(column.name, data);
        this.state = Jx.Record.UPDATE;
        return [column.name, oldValue, data];
        //this.store.fireEvent('storeColumnChanged', [this, column.name, oldValue, data]);
            
    },
    /**
     * APIMethod: equals
     * Compares the value of a particular column with a given value
     * 
     * Parameters:
     * column - the column to compare with (either column name or index)
     * value - the value to compare to.
     * 
     * Returns:
     * True | False depending on the outcome of the comparison.
     */
    equals: function (column, value) {
        if (column === 'primaryKey') {
            column = this.resolveCol(this.options.primaryKey);
        } else {
            column = this.resolveCol(column);
        }
        if (!this.data.has(column.name)) {
            return null;
        } else {
            if (!$defined(this.comparator)) {
                this.comparator = new Jx.Compare({
                    separator : this.options.separator
                });
            }
            var fn = this.comparator[column.type].bind(this.comparator);
            return (fn(this.get(column), value) === 0);
        }
    },
    /**
     * Method: processData
     * This method takes the data passed in and puts it into the form the 
     * record needs it in. This default implementation does nothing but
     * assign the data to the data property but it can be overridden in
     * subclasses to massge the data in any way needed.
     * 
     * Parameters:
     * data - the data to process
     */
    processData: function (data) {
        this.data = $H(data);
    },
    
    /**
     * Method: resolveCol 
     * Determines which column is being asked for and returns it.
     * 
     * Parameters: 
     * col - a number referencing a column in the store
     * 
     * Returns: 
     * the column object referred to
     */
    resolveCol : function (col) {
        var t = Jx.type(col);
        if (t === 'number') {
            col = this.columns[col];
        } else if (t === 'string') {
            this.columns.each(function (column) {
                if (column.name === col) {
                    col = column;
                }
            }, this);
        }
        return col;
    },
    /**
     * APIMethod: asHash
     * Returns the data for this record as a Hash
     */
    asHash: function() {
        return this.data;
    }
});

Jx.Record.UPDATE = 1;
Jx.Record.DELETE = 2;
Jx.Record.INSERT = 3;// $Id: store.js 669 2009-12-18 06:02:59Z jonlb@comcast.net $
/**
 * Class: Jx.Store 
 * 
 * Extends: <Jx.Object>
 * 
 * This class is the  store. It keeps track of data. It
 * allows adding, deleting, iterating, sorting etc...
 * 
 * For the most part the store is pretty "dumb" meaning it 
 * starts with very limited functionality. Actually, it can't
 * even load data by itself. Instead, it needs to have protocols,
 * strategies, and a record class passed to it that it knows how to use
 * and can use it.  
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
    
    Family: 'Jx.Store',
    Extends: Jx.Object,
    
    options: {
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
         * Option: protocol
         * The protocol to use for communication in this store. The store 
         * itself doesn't actually use it but it is accessed by the strategies
         * to do their work. This option is required and the store won't work without it.
         */
        protocol: null,
        /**
         * Option: strategies
         * This is an array of instantiated strategy objects that will work
         * on this store. They provide many services such as loading data,
         * paging data, saving, and sorting (and anything else you may need 
         * can be written). If none are passed in it will use the default 
         * Jx.Store.Strategy.Full
         */
        strategies: null,
        /**
         * Option: record
         * This is a Jx.Store.Record instance or one of its subclasses. This is the 
         * class that will be used to hold each individual record in the store.
         * Don't pass in a instance of the class but rather the class name 
         * itself. If none is passed in it will default to Jx.Store.Record
         */
        record: null,
        /**
         * Option: recordOptions
         * Options to pass to each record as it's created.
         */
        recordOptions: {
            primaryKey: null
        }
    },
    
    /**
     * Property: data
     * Holds the data for this store
     */
    data : null,
    /**
     * Property: index
     * Holds the current position of the store relative to the data and the pageIndex.
     * Zero-based index.
     */
    index : 0,
    /**
     * Property: id
     * The id of this store.
     */
    id : null,
    /**
     * Property: loaded
     * Tells whether the store has been loaded or not
     */
    loaded: false,
    /**
     * Property: ready
     * Used to determine if the store is completely initialized.
     */
    ready: false,
    
    init: function () {
        this.parent();
        
        if ($defined(this.options.id)) {
            this.id = this.options.id;
        } 
        
        if (!$defined(this.options.protocol)) {
            this.ready = false;
            return;
        } else {
            this.protocol = this.options.protocol;
        }
        
        this.strategies = new Hash();
        
        if ($defined(this.options.strategies)) {
            this.options.strategies.each(function(strategy){
                this.addStrategy(strategy);
            },this);
        } else {
            var strategy = new Jx.Store.Strategy.Full();
            this.addStrategy(strategy);
        }
        
        if ($defined(this.options.record)) {
            this.record = this.options.record;
        } else {
            this.record = Jx.Record;
        }
        
        
    },
    
    cleanup: function () {
        this.strategies.each(function(strategy){
            strategy.destroy();
        },this);
        this.strategies = null;
        this.protocol.destroy();
        this.protocol = null;
        this.record = null;
    },
    /**
     * APIMethod: getStrategy
     * returns the named strategy if it is present, null otherwise.
     * 
     * Parameters:
     * name - the name of the strategy we're looking for
     */
    getStrategy: function (name) {
        if (this.strategies.has(name)) {
            return this.strategies.get(name);
        }
        return null;
    },
    /**
     * APIMethod: addStrategy
     * Allows the addition of strategies after store initialization. Handy to 
     * have if some other class needs a strategy that is not present.
     * 
     * Parameters:
     * strategy - the strategy to add to the store
     */
    addStrategy: function (strategy) {
        this.strategies.set(strategy.name, strategy);
        strategy.setStore(this);
        strategy.activate();
    },
    /**
     * APIMethod: load
     * used to load the store. It simply fires an event that the strategies are
     * listening for.
     * 
     * Parameters:
     * params - a hash of parameters passed to the strategy for determining what records
     *          to load.
     */
    load: function (params) {
        this.fireEvent('storeLoad', params);
    },
    /**
     * APIMethod: empty
     * Clears the store of data
     */
    empty: function () {
        if ($defined(this.data)) {
            this.data.empty();
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
            return true;
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
            if (this.index < 0) {
                this.index = 0;
            }
            this.fireEvent('storeMove', this);
            return true;
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
            return true;
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
            return true;
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
     * APIMethod: each
     * allows iteration through the store's records. 
     * NOTE: this function is untested
     * 
     * Parameters:
     * fn - the function to execute for each record
     * bind - the scope of the function
     * ignoreDeleted - flag that tells the function whether to ignore records
     *                  marked as deleted.
     */
    each: function (fn, bind, ignoreDeleted) {
        var data;
        if (ignoreDeleted) {
            data = this.data.filter(function (record) {
                return record.state !== Jx.Record.DELETE;
            }, this);
        } else {
            data = this.data;
        }
        for (var i = 0, l = data.length; i < l; i++) {
            fn.call(bind, data[i], i, data);
        }
    },
    /**
     * APIMethod: get
     * gets the data for the specified column
     * 
     * Parameters:
     * column - indicator of the column to set. Either a string (the name of 
     *          the column) or an integer (the index of the column in the 
     *          record).
     * index - the index of the record in the internal array. Optional.
     *          defaults to the current index.
     */
    get: function (column, index) {
        if (!$defined(index)) {
            index = this.index;
        }
        return this.data[index].get(column);
    },
    /**
     * APIMethod: set
     * Sets the passed data for a particular column on the indicated record.
     * 
     * Parameters:
     * column - indicator of the column to set. Either a string (the name of 
     *          the column) or an integer (the index of the column in the 
     *          record).
     * data - the data to set in the column of the record
     * index - the index of the record in the internal array. Optional.
     *          defaults to the current index.
     */
    set: function (column, data, index) {
        if (!$defined(index)) {
            index = this.index;
        }
        var ret = this.data[index].set(column, data);
        ret.reverse();
        ret.push(index);
        ret.reverse();
        //fire event with array [index, column, oldvalue, newValue]
        this.fireEvent('storeColumnChanged', ret);
    },
    /**
     * APIMethod: refresh
     * Simply fires the storeRefresh event for strategies to listen for.
     */
    refresh: function () {
        this.fireEvent('storeRefresh', this);
    },
    /**
     * APIMethod: addRecord
     * Adds given data to the end of the current store.
     * 
     * Parameters:
     * data - The data to use in creating a record. This should be in whatever
     *        form Jx.Store.Record, or the current subclass, needs it in.
     * position - whether the record is added to the 'top' or 'bottom' of the 
     *      store.
     * insert - flag whether this is an "insert"
     */
    addRecord: function (data, position, insert) {
        if (!$defined(this.data)) {
            this.data = [];
        }
        
        position = $defined(position)? position : 'bottom';
        
        var record;
        if (data instanceof Jx.Record) {
            record = data;
        } else {
            record = new (this.record)(this, this.options.columns, data, this.options.recordOptions);
        }
        if (insert) {
            record.state = Jx.Record.INSERT;
        }
        if (position === 'top') {
            //some literature claims that .shift() and .unshift() don't work reliably in IE
            //so we do it this way.
            this.data.reverse();
            this.data.push(record);
            this.data.reverse();
        } else {
            this.data.push(record);
        }
        this.fireEvent('storeRecordAdded', [this, record, position]);
    },
    /**
     * APIMethod: addRecords
     * Used to add multiple records to the store at one time.
     * 
     * Parameters:
     * data - an array of data to add.
     * position - 'top' or 'bottom'. Indicates whether to add at the top or the
     *          bottom of the store
     */
    addRecords: function (data, position) {
        var def = $defined(data);
        var type = Jx.type(data);
        if (def && type === 'array') {
            this.fireEvent('storeBeginAddRecords', this);
            //if position is top, reverse the array or we'll add them in the wrong order.
            if (position === 'top') {
                data.reverse();
            }
            data.each(function(d){
                this.addRecord(d, position);
            },this);
            this.fireEvent('storeEndAddRecords', this);
            return true;
        }
        return false;
    },
    
    /**
     * APIMethod: getRecord
     * Returns the record at the given index or the current store index
     * 
     * Parameters:
     * index - the index from which to return the record. Optional. Defaults to
     *          the current store index
     */
    getRecord: function (index) {
        if (!$defined(index)) {
            index = this.index;
        }
        
        if (Jx.type(index) === 'number') {        
            if ($defined(this.data) && $defined(this.data[index])) {
                return this.data[index];
            }
        } else {
            //Not sure what the point of this part is. It compares the 
            //record to the index directly as if we passed in the record which 
            //means we already have the record... huh???
            var r;
            this.data.each(function(record){
                if (record === index) {
                    r = record;
                }
            },this);
            return r;
        }
        return null;
    },
    /**
     * APIMethod: replaceRecord
     * Replaces the record at an existing index with a new record containing
     * the passed in data.
     * 
     * Parameters:
     * data - the data to use in creating the new record
     * index - the index at which to place the new record. Optional. 
     *          defaults to the current store index.
     */
    replace: function(data, index) {
        if ($defined(data)) {
            if (!$defined(index)) {
                index = this.index;
            }
            var record = new this.record(this.options.columns,data);
            var oldRecord = this.data[index];
            this.data[index] = record;
            this.fireEvent('storeRecordReplaced', [oldRecord, record]);
            return true;
        } 
        return false;
    },
    /**
     * APIMethod: deleteRecord
     * Marks a record for deletion and removes it from the regular array of
     * records. It adds it to a special holding array so it can be disposed 
     * of later.
     * 
     * Parameters:
     * index - the index at which to place the new record. Optional. 
     *          defaults to the current store index.
     */
    deleteRecord: function(index) {
        if (!$defined(index)) {
            index = this.index;
        }
        var record = this.data[index];
        record.state = Jx.Record.DELETE;
        // Set to Null or slice it out and compact the array???
        this.data[index] = null;
        if (!$defined(this.deleted)) {
            this.deleted = [];
        }
        this.deleted.push(record);
        this.fireEvent('storeRecordDeleted', [record, this]);
    },
    /**
     * APIMethod: insertRecord
     * Shortcut to addRecord which facilitates marking a record as inserted.
     * 
     * Paremeters:
     * data - the data to use in creating this inserted record. Should be in
     *          whatever form the current implementation of Jx.Record needs
     * position - where to place the record. Should be either 'top' or 'bottom'.
     */
    insertRecord: function (data, position) {
        this.addRecord(data, position, true);
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
     * column - the name (or index) of the column to search by
     * value - the value to look for
     */
    findByColumn: function (column, value) {
        if (typeof StopIteration === "undefined") {
            StopIteration = new Error("StopIteration");
        }

        var index;
        try {
            this.data.each(function(record, idx){
                if (record.equals(column, value)) {
                    index = idx;
                    throw StopIteration;
                }
            },this);
        } catch (error) {
            if (error !== StopIteration) {
                throw error;
            }
            return index;
        }
        return null;
    },
    /**
     * APIMethod: removeRecord
     * removes (but does not mark for deletion) a record at the given index
     * or the current store index if none is passed in.
     * 
     * Parameters: 
     * index - Optional. The store index of the record to remove.
     */
    removeRecord: function (index) {
        if (!$defined(index)) {
            index = this.index;
        }
        this.data.splice(index,1);
        this.fireEvent('storeRecordRemoved', [this, index])
    },
    /**
     * APIMethod: removeRecords
     * Used to remove multiple contiguous records from a store. 
     * 
     * Parameters:
     * first - where to start removing records (zero-based)
     * last - where to stop removing records (zero-based, inclusive)
     */
    removeRecords: function (first, last) {
        for (var i = first; i <= last; i++) {
            this.removeRecord(first);
        }
        this.fireEvent('storeMultipleRecordsRemoved', [this, first, last]);
    }
});// $Id: compare.js 649 2009-11-30 22:19:48Z pagameba $
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
    Family: 'Jx.Compare',
    Extends: Jx.Object,

    options: { separator: '.' },

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

});// $Id: sort.js 649 2009-11-30 22:19:48Z pagameba $
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

    parameters: ['data','fn','col','options'],

    /**
     * APIMethod: init
     */
    init : function () {
        this.parent();
        if (this.options.timeIt) {
            this.addEvent('start', this.startTimer.bind(this));
            this.addEvent('stop', this.stopTimer.bind(this));
        }
        this.data = this.options.data;
        this.comparator = this.options.fn;
        this.col = this.options.col;
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
// $Id: mergesort.js 649 2009-11-30 22:19:48Z pagameba $
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
    Family: 'Jx.Sort.Mergesort',
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
// $Id: heapsort.js 649 2009-11-30 22:19:48Z pagameba $
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
    Family: 'Jx.Sort.Heapsort',
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
// $Id: quicksort.js 649 2009-11-30 22:19:48Z pagameba $
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
    Family: 'Jx.Sort.Quicksort',
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
// $Id: nativesort.js 649 2009-11-30 22:19:48Z pagameba $
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
    Family: 'Jx.Sort.Nativesort',
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
// $Id: response.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Response
 * 
 * Extends: <Jx.Object>
 * 
 * This class is used by the protocol to send information back to the calling 
 * strategy (or other caller).
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Response = new Class({
    
    Extends: Jx.Object,
    
    Family: 'Jx.Store.Response',
    /**
     * Property: code
     * This is the success/failure code
     */
    code: null,
    /**
     * Property: data
     * The data passed received by the protocol.
     */
    data: null,
    /**
     * Property: meta
     * The metadata received by the protocol
     */
    meta: null,
    /**
     * Property: requestType
     * one of 'read', 'insert', 'delete', or 'update'
     */
    requestType: null,
    /**
     * Property: requestParams
     * The parameters passed to the method that created this response
     */
    requestParams: null,
    /**
     * Property: request
     * the mootools Request object used in this operation (if one is actually
     * used)
     */
    request: null,
    /**
     * APIMethod: success
     * determines if this response represents a successful response
     */
    success: function () {
        return this.code > 0;
    }
});

Jx.Store.Response.WAITING = 2;
Jx.Store.Response.SUCCESS = 1;
Jx.Store.Response.FAILURE = 0;
// $Id: protocol.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Protocol
 * 
 * Extends: <Jx.Object>
 * 
 * Base class for all protocols. Protocols are used for communication, primarily,
 * in Jx.Store. It may be possible to adapt them to be used in other places but
 * that is not their intended function.
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Protocol = new Class({
    
    Extends: Jx.Object,
    Family: 'Jx.Store.Protocol',
    
    parser: null,
    
    options: {},
    
    init: function () {
        this.parent();
        
        if ($defined(this.options.parser)) {
            this.parser = this.options.parser;
        }
    },
    
    cleanup: function () {
        this.parser = null;
        this.parent();
    },
    
    /**
     * APIMethod: read
     * Supports reading data from a location. Abstract method that subclasses
     * should implement.
     * 
     * Parameters:
     * options - optional options for configuring the request
     */
    read: $empty,
    /**
     * APIMethod: insert
     * Supports inserting data from a location. Abstract method that subclasses
     * should implement.
     * 
     * Parameters:
     * data - the data to use in creating the record in the form of one or more
     *        Jx.Store.Record instances
     * options - optional options for configuring the request
     */
    insert: $empty,
    /**
     * APIMethod: update
     * Supports updating data at a location. Abstract method that subclasses
     * should implement.
     * 
     * Parameters:
     * data - the data to update (one or more Jx.Store.Record objects)
     * options - optional options for configuring the request
     */
    update: $empty,
    /**
     * APIMethod: delete
     * Supports deleting data from a location. Abstract method that subclasses
     * should implement.
     * 
     * Parameters:
     * data - the data to update (one or more Jx.Store.Record objects)
     * options - optional options for configuring the request
     */
    "delete": $empty,
    /**
     * APIMethod: abort
     * used to abort any of the above methods (where practical). Abstract method
     * that subclasses should implement.
     */
    abort: $empty
});// $Id: protocol.local.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Protocol.Local
 * 
 * Extends: Jx.Store.Protocol
 * 
 * Based on the Protocol base class, the local protocol uses data that it is handed
 * upon instantiation to process requests.
 * 
 * Constructor Parameters:
 * data - The data to use 
 * options - any options for the base protocol class
 * 
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * inspired by the openlayers.org implementation of a similar system
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Protocol.Local = new Class({
    
    Extends: Jx.Store.Protocol,
    
    parameters: ['data', 'options'],
    /**
     * Property: data
     * The data passed to the protocol
     */
    data: null,
    
    init: function () {
        this.parent();
        
        if ($defined(this.options.data)) {
            this.data = this.parser.parse(this.options.data);
        }
    },
    /**
     * APIMethod: read
     * process requests for data and sends the appropriate response via the
     * dataLoaded event.
     * 
     * Parameters: 
     * options - options to use in processing the request.
     */
    read: function (options) {
        var resp = new Jx.Store.Response();
        resp.requestType = 'read';
        resp.requestParams = arguments;
        
        var page = options.data.page;
        var itemsPerPage = options.data.itemsPerPage;
        
        if ($defined(this.data)) {
            if (page <= 1 && itemsPerPage === -1) {
                //send them all
                resp.data = this.data;
                resp.meta = { count: this.data.length };
            } else {
                var start = (page - 1) * itemsPerPage;
                var end = start + itemsPerPage;
                resp.data = this.data.slice(start, end);
                resp.meta = { 
                    page: page, 
                    itemsPerPage: itemsPerPage,
                    totalItems: this.data.length,
                    totalPages: Math.ceil(this.data.length/itemsPerPage)
                };
            }
            resp.code = Jx.Store.Response.SUCCESS;
            this.fireEvent('dataLoaded', resp);
        } else {
            resp.code = Jx.Store.Response.SUCCESS;
            this.fireEvent('dataLoaded', resp);
        }                        
    }
    
    /**
     * The following methods are not implemented as they make no sense for a local protocol:
     * - create
     * - update 
     * - delete
     * - commit
     * - abort
     */
});// $Id: protocol.ajax.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Protocol.Ajax
 * 
 * Extends: <Jx.Store.Protocol>
 * 
 * This protocol is used to send and receive data via AJAX. It also has the
 * capability to use a REST-style API.
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Protocol.Ajax = new Class({
    
    Extends: Jx.Store.Protocol,
    
    options: {
        /**
         * Option: requestOptions
         * Options to pass to the mootools Request class
         */
        requestOptions: {
            method: 'get'
        },
        /**
         * Option: rest
         * Flag indicating whether this protocol is operating against a RESTful
         * web service
         */
        rest: false,
        /**
         * Option: urls
         * This is a hash of the urls to use for each method. If the rest 
         * option is set to true the only one needed will be the urls.rest. These
         * can be overridden if needed by passing an options object into the
         * various methods with the appropriate urls.
         */
        urls: {
            rest: null,
            insert: null,
            read: null,
            update: null,
            'delete': null
        }
    },
    
    init: function() {
        this.parent();
    },
    /**
     * APIMethod: read
     * Send a read request via AJAX
     * 
     * Parameters:
     * page - the page requested
     * itemsPerPage - the number of items on the page
     * options - the options to pass to the request.
     */
    read: function (options) {
        var resp = new Jx.Store.Response();
        resp.requestType = 'read';
        resp.requestParams = arguments;
        
        var req = new Request({
            onSuccess: this.handleResponse.bind(this, resp)
        });
        
        resp.request = req;
        var temp = {};
        if (this.options.rest) {
            temp.url = this.options.urls.rest;
        } else {
            temp.url = this.options.urls.read;
        }
        
        //set up options
        var opts = $merge(this.options.requestOptions, temp, options);
        
        req.send(opts);
        
        resp.code = Jx.Store.Response.WAITING;
        
        return resp;
        
    },
    /**
     * Method: handleResponse
     * Called as an event handler for a returning request. Parses the request's
     * response into the actual response object.
     * 
     * Parameters: 
     * response - the response related to teh returning request.
     */
    handleResponse: function (response) {
        var req = response.request;
        var str = req.xhr.responseText;
        
        var data = this.parser.parse(str);
        if ($defined(data)) {
            if ($defined(data.data)) {
                response.data = data.data;
            }
            if ($defined(data.meta)) {
                response.meta = data.meta;
            }
            response.code = Jx.Store.Response.SUCCESS;
        } else {
            response.code = Jx.Store.Response.FAILURE;
        }
        this.fireEvent('dataLoaded', response);
    },
    /**
     * APIMethod: insert
     * Takes a Jx.Record instance and saves it
     * 
     * Parameters:
     * record - a Jx.Store.Record or array of them
     * options - options to pass to the request
     */
    insert: function (record, options) {
        if (!this.options.rest) {
            options = $merge({url: this.options.urls.rest},options);
        } else {
            options = $merge({url: this.options.urls.insert},options);
        }
        this.options.requestOptions.method = 'POST';
        return this.run(record, options, "insert");
    },
    /**
     * APIMethod: update
     * Takes a Jx.Record and updates it via AJAX
     * 
     * Parameters:
     * record - a Jx.Record instance
     * options - Options to pass to the request
     */
    update: function (record, options) {
        if (this.options.rest) {
            options = $merge({url: this.options.urls.rest},options);
            this.options.requestOptions.method = 'PUT';
        } else {
            options = $merge({url: this.options.urls.update},options);
            this.options.requestOptions.method = 'POST';
        }
        return this.run(record, options, "update");
    },
    /**
     * APIMethod: delete
     * Takes a Jx.Record and deletes it via AJAX
     * 
     * Parameters:
     * record - a Jx.Record instance
     * options - Options to pass to the request
     */
    "delete": function (record, options) {
        if (this.options.rest) {
            options = $merge({url: this.options.urls.rest},options);
            this.options.requestOptions.method = 'DELETE';
        } else {
            options = $merge({url: this.options.urls['delete']},options);
            this.options.requestOptions.method = 'POST';
        }
        return this.run(record, options, "delete");
    },
    /**
     * APIMethod: abort
     * aborts the request related to the passed in response.
     * 
     * Parameters:
     * response - the response with the request to abort
     */
    abort: function (response) {
        response.request.cancel();
        
    },
    /**
     * Method: run
     * called by update, delete, and insert methods that actually does the work
     * of kicking off the request.
     * 
     * Parameters:
     * record - The Jx.Record to work with
     * options - Options to pass to the request
     * method - The name of the method calling this function
     */
    run: function (record, options, method) {
        
        this.options.requestOptions.data = this.parser.encode(record);
        
        var resp = new Jx.Store.Response();
        resp.requestType = method;
        resp.requestParams = [record, options, method];
        
        var req = new Request({
            onSuccess: this.handleResponse.bind(this, resp)
        });
        
        //set up options
        var opts = $merge(this.options.requestOptions, options);
        
        req.send(opts);
        
        resp.code = Jx.Store.Response.WAITING;
        resp.request = req;
        
        return resp;
    }
    
});// $Id: strategy.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Strategy
 * 
 * Extends: <Jx.Object>
 * 
 * Base class for all Jx.Store strategies
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Strategy = new Class({
    
    Extends: Jx.Object,
    Family: 'Jx.Store.Strategy',
    /**
     * APIProperty: store
     * The store this strategy is associated with
     */
    store: null,
    /**
     * APIProperty: active
     * whether this strategy has been activated or not.
     */
    active: null,
    
    init: function () {
        this.parent();
        this.active = false;
    },
    /**
     * APIMethod: setStore
     * Associates this strategy with a particular store.
     */
    setStore: function (store) {
        if (store instanceof Jx.Store) {
            this.store = store;
            return true;
        }
        return false;
    },
    
    /**
     * APIMethod: activate
     * activates the strategy if it isn't already active.
     */
    activate: function () {
        if (!this.active) {
            this.active = true;
            return true;
        }
        return false;
    },
    /**
     * APIMethod: deactivate
     * deactivates the strategy if it is already active.
     */
    deactivate: function () {
        if (this.active) {
            this.active = false;
            return true;
        }
        return false;
    }
    
    
    
});// $Id: strategy.full.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Strategy.Full
 * 
 * Extends: <Jx.Store.Strategy>
 * 
 * This is a strategy for loading all of the data from a source at one time.
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */

Jx.Store.Strategy.Full = new Class({
    
    Extends: Jx.Store.Strategy,
    
    name: 'full',
    
    options:{},
    
    init: function () {
        this.parent();
        this.bound = {
            load: this.load.bind(this),
            loadStore: this.loadStore.bind(this)
        }
    },
    
    activate: function () {
        this.parent();
        this.store.addEvent('storeLoad', this.bound.load);
        
    },
    
    deactivate: function () {
        this.parent();
        this.store.removeEvent('storeLoad', this.bound.load);
        
    },
    /**
     * Method: load
     * Called as the eventhandler for the store load method. Can also
     * be called independently to load data into the current store.
     * 
     * Parameters:
     * params - a hash of parameters to use in loading the data.
     */
    load: function (params) {
        this.store.fireEvent('storeBeginDataLoad', this.store);
        this.store.protocol.addEvent('dataLoaded', this.bound.loadStore);
        var opts = {}
        if ($defined(params)) {
            opts.data = params;
        } else {
            opts.data = {};
        }
        opts.data.page = 0;
        opts.data.itemsPerPage = -1;
        this.store.protocol.read(opts);
    },
    /**
     * Method: loadStore
     * Called as the event hanlder for the protocol's dataLoaded event. Checks 
     * the response for success and loads the data into the store if needed.
     * 
     * Parameters:
     * resp - the response from the protocol
     */
    loadStore: function (resp) {
        this.store.protocol.removeEvent('dataLoaded', this.bound.loadStore);
        if (resp.success()) {
            this.store.empty();
            if ($defined(resp.meta)) {
                this.parseMetaData(resp.meta);
            }
            this.store.addRecords(resp.data);
            this.store.loaded = true;
            this.store.fireEvent('storeDataLoaded',this.store);
        } else {
            this.store.loaded = false;
            this.store.fireEvent('storeDataLoadFailed', [this.store, resp]);
        }
    },
    /**
     * Method: parseMetaData
     * Takes the meta property of the response object and puts the data 
     * where it belongs.
     * 
     * Parameters:
     * meta - the meta data object from the response.
     */
    parseMetaData: function (meta) {
        if ($defined(meta.columns)) {
            this.store.options.columns = meta.columns;
        }
        if ($defined(meta.primaryKey)) {
            this.store.options.recordOptions.primaryKey = meta.primaryKey;
        }
    }
});// $Id: strategy.paginate.js 669 2009-12-18 06:02:59Z jonlb@comcast.net $
/**
 * Class: Jx.Store.Strategy.Paginate
 * 
 * Extends: <Jx.Store.Strategy>
 * 
 * Store strategy for paginating results in a store.
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Strategy.Paginate = new Class({
    
    Extends: Jx.Store.Strategy,
    
    name: 'paginate',
    
    options: {
        /**
         * Option: getPaginationParams
         * a function that returns an object that holds the parameters
         * necessary for getting paginated data from a protocol.
         */
        getPaginationParams: function () {
            return {
                page: this.page,
                itemsPerPage: this.itemsPerPage
            }
        },
        /**
         * Option: startingItemsPerPage
         * Used to set the intial itemsPerPage for the strategy. the pageSize 
         * can be changed using the setPageSize() method.
         */
        startingItemsPerPage: 25,
        /**
         * Option: startingPage
         * The page to start on. Defaults to 1 but can be set to any other 
         * page.
         */
        startingPage: 1,
        /**
         * Option: expirationInterval
         * The interval, in milliseconds (1000 = 1 sec), to hold a page of data
         * before it expires. If the page is expired, the next time the page
         * is accessed it must be retrieved again. Default is 5 minutes (1000 * 60 * 5)
         */
        expirationInterval: (1000 * 60 * 5),
        /**
         * Option: ignoreExpiration
         * Set to TRUE to ignore the expirationInterval setting and never expire
         * pages.
         */
        ignoreExpiration: false
    },
    /**
     * Property: data
     * holds the pages of data keyed by page number.
     */
    data: new Hash(),
    /**
     * property: cacheTimer
     * holds one or more cache timer ids - one per page. Each page is set to 
     * expire after a certain amount of time.
     */
    cacheTimer: new Hash(),
    /**
     * Property: page
     * Tracks the page the store currently holds.
     */
    page: null,
    /**
     * Property: itemsPerPage
     * The number of items on each page
     */
    itemsPerPage: null,
    
    init: function () {
        this.parent();
        //set up bindings that we need here
        this.bound = {
            load: this.load.bind(this),
            loadStore: this.loadStore.bind(this)
        };
        this.itemsPerPage = this.options.startingItemsPerPage;
        this.page = this.options.startingPage;
    },
    
    activate: function () {
        this.parent();
        this.store.addEvent('storeLoad', this.bound.load);
    },
    
    deactivate: function () {
        this.parent();
        this.store.removeEvent('storeLoad', this.bound.load);
    },
    /**
     * APIMethod: load
     * Called to load data into the store
     * 
     * Parameters:
     * params - a Hash of parameters to use in getting data from the protocol.
     */
    load: function (params) {
        this.store.fireEvent('storeBeginDataLoad', this.store);
        this.store.protocol.addEvent('dataLoaded', this.bound.loadStore);
        this.params = params;
        var opts = {
            data: $merge(params, this.options.getPaginationParams.apply(this))
        };
        this.store.protocol.read(opts);
    },
    /**
     * Method: loadStore
     * Used to assist in the loading of data into the store. This is 
     * called as a response to the protocol finishing.
     * 
     *  Parameters:
     *  resp - the response object
     */
    loadStore: function (resp) {
        this.store.protocol.removeEvent('dataLoaded', this.bound.loadStore);
        if (resp.success()) {
            if ($defined(resp.meta)) {
                this.parseMetaData(resp.meta);
            }
            this.data.set(this.page,resp.data);
            this.loadData(resp.data);
        } else {
            this.store.fireEvent('storeDataLoadFailed', this.store);
        }
    },
    /**
     * Method: loadData
     * This method does the actual work of loading data to the store. It is called
     * when either the protocol finishes or setPage() has the data and it's not
     * expired.
     * 
     * Parameters:
     * data - the data to load into the store.
     */
    loadData: function (data) {
        this.store.empty();
        this.store.loaded = false;
        if (!this.options.ignoreExpiration) {
            var id = this.expirePage.delay(this.options.expirationInterval, this, this.page);
            this.cacheTimer.set(this.page,id);
        }
        this.store.addRecords(data);
        this.store.loaded = true;
        this.store.fireEvent('storeDataLoaded',this.store);
    },
    /**
     * Method: parseMetaData
     * Takes the metadata returned from the protocol and places it in the appropriate
     * places.
     * 
     * Parameters:
     * meta - the meta data object returned from the protocol.
     */
    parseMetaData: function (meta) {
        if ($defined(meta.columns)) {
            this.store.options.columns = meta.columns;
        }
        if ($defined(meta.totalItems)) {
            this.totalItems = meta.totalItems;
        }
        if ($defined(meta.totalPages)) {
            this.totalPages = meta.totalPages;
        }
        if ($defined(meta.primaryKey)) {
            this.store.options.recordOptions.primaryKey = meta.primaryKey;
        }
            
    },
    /**
     * Method: expirePage
     * Is called when a pages cache timer expires. Will expire the page by 
     * erasing the page and timer. This will force a reload of the data the 
     * next time the page is accessed.
     * 
     * Parameters:
     * page - the page number to expire.
     */
    expirePage: function (page) {
        this.data.erase(page);
        this.cacheTimer.erase(page);
    },
    /**
     * APIMethod: setPage
     * Allows a caller (i.e. a paging toolbar) to move to a specific page.
     * 
     * Parameters:
     * page - the page to move to. Can be any absolute page number, any number
     *        prefaced with '-' or '+' (i.e. '-1', '+3'), 'first', 'last', 
     *        'next', or 'previous'
     */
    setPage: function (page) {
        if (Jx.type(page) === 'string') {
            switch (page) {
                case 'first':
                    this.page = 1;
                    break;
                case 'last':
                    this.page = this.totalPages;
                    break;
                case 'next':
                    this.page++;
                    break;
                case 'previous':
                    this.page--;
                    break;
                default:
                    this.page = this.page + Jx.getNumber(page);
                    break;
            }
        } else {
            this.page = page;
        }
        if (this.cacheTimer.has(this.page)) {
            $clear(this.cacheTimer.get(this.page));
            this.cacheTimer.erase(this.page);
        }
        if (this.data.has(this.page)){
            this.loadData(this.data.get(this.page));
        } else {
            this.load(this.params);
        }
    },
    /**
     * APIMethod: getPage
     * returns the current page
     */
    getPage: function () {
        return this.page;
    },
    /**
     * APIMethod: getNumberOfPages
     * returns the total number of pages.
     */
    getNumberOfPages: function () {
        return this.totalPages;
    },
    /**
     * APIMethod: setPageSize
     * sets the current size of the pages. Calling this will expire every page 
     * and force the current one to reload with the new size.
     */
    setPageSize: function (size) {
        //set the page size 
        this.itemsPerPage = size;
        //invalidate all pages cached and reload the current one only
        this.cacheTimer.each(function(val){
            $clear(val);
        },this);
        this.cacheTimer.empty();
        this.data.empty();
        this.load();
    },
    /**
     * APIMethod: getPageSize
     * returns the current page size
     */
    getPageSize: function () {
        return this.itemsPerPage;
    },
    /**
     * APIMethod: getTotalCount
     * returns the total number of items as received from the protocol.
     */
    getTotalCount: function () {
        return this.totalItems;
    }
    
    
});
Jx.Store.Strategy.Progressive = new Class({
    
    Extends: Jx.Store.Strategy.Paginate,
    
    name: 'progressive',
    
    options: {
        /**
         * Option: maxRecords
         * The maximum number of records we want in the store at any one time.
         */
        maxRecords: 1000,
        /**
         * Option: dropRecords
         * Whether the strategy should drop records when the maxRecords limit 
         * is reached. if this is false then maxRecords is ignored and data is
         * always added to the bottom of the store. 
         */
        dropRecords: true
    },
    
    startingPage: 0,
    maxPages: null,
    loadedPages: 0,
    loadAt: 'bottom',
    
    init: function () {
        this.parent();
        if (this.options.dropPages) {
            this.maxPages = Math.ceil(this.options.maxRecords/this.itemsPerPage);
        }
    },
    
    /**
     * Method: loadStore
     * Used to assist in the loading of data into the store. This is 
     * called as a response to the protocol finishing.
     * 
     *  Parameters:
     *  resp - the response object
     */
    loadStore: function (resp) {
        this.store.protocol.removeEvent('dataLoaded', this.bound.loadStore);
        if (resp.success()) {
            if ($defined(resp.meta)) {
                this.parseMetaData(resp.meta);
            }
            this.loadData(resp.data);
        } else {
            this.store.fireEvent('storeDataLoadFailed', this.store);
        }
    },
    
    /**
     * Method: loadData
     * This method does the actual work of loading data to the store. It is called
     * when either the protocol finishes or setPage() has the data and it's not
     * expired.
     * 
     * Parameters:
     * data - the data to load into the store.
     */
    loadData: function (data) {
        this.store.loaded = false;
        this.store.addRecords(data, this.loadAt);
        this.store.loaded = true;
        this.loadedPages++;
        this.store.fireEvent('storeDataLoaded',this.store);
    },
    
    /**
     * APIMethod: nextPage
     * Allows a caller (i.e. a paging toolbar) to load more data to the end of 
     * the store
     * 
     * Parameters:
     * end - which end to load to. Either 'top' or 'bottom'.
     */
    nextPage: function (params) {
        if (!$defined(params)) {
            params = {};
        }
        if (this.options.dropPages && this.totalPages > this.startingPage + this.loadedPages) {
            this.loadAt = 'bottom';
            if (this.loadedPages >= this.maxPages) {
                //drop records before getting more
                this.startingPage++;
                this.store.removeRecords(0,this.itemsPerPage - 1);
                this.loadedPages--;
            }
        }
        this.page = this.startingPage + this.loadedPages + 1;
        this.load($merge(this.params, params));
    },
    
    previousPage: function (params) {
        //if we're not dropping pages there's nothing todo
        if (!this.options.dropPages) {
            return;
        }
        
        if (!$defined(params)) {
            params = {};
        }
        if (this.startingPage > 0) {
            this.loadAt = 'top';
            if (this.loadedPages >= this.maxPages) {
                //drop off end before loading previous pages
                this.startingPage--;
                this.store.removeRecords(this.options.maxRecords - this.itemsPerPage, this.options.maxRecords);
                this.loadedPages--;
            }
            this.page = this.startingPage;
            this.load($merge(this.params, params));
        }
    }
});// $Id: strategy.save.js 670 2009-12-18 06:04:44Z jonlb@comcast.net $
/**
 * Class: Jx.Store.Strategy.Save 
 * 
 * Extends: <Jx.Store.Strategy>
 * 
 * A Store strategy class for saving data via protocols
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Strategy.Save = new Class({
    
    Extends: Jx.Store.Strategy,
    
    name: 'save',
    
    options: {
        /**
         * Option: autoSave
         * Whether the strateggy should be watching the store to save changes
         * automatically. Set to True to watch events, set it to a number of 
         * milliseconds to have the strategy save every so many seconds
         */
        autoSave: false
    },
    /**
     * Property: failedChanges
     * an array holding all failed requests
     */
    failedChanges: [],
    /**
     * Property: successfulChanges
     * an array holding all successful requests
     */
    successfulChanges: [],
    /**
     * Property: totalChanges
     * The total number of changes being processed. Used to determine
     * when to fire off the storeChangesCompleted event on the store
     */
    totalChanges: 0,
    
    init: function () {
        this.parent();
        this.bound = {
            save: this.saveRecord.bind(this),
            completed: this.onComplete.bind(this)
        };
    },
    
    activate: function () {
        this.parent();
        if (Jx.type(this.options.autoSave) === 'number') {
            this.periodicalId = this.save.periodical(this.options.autoSave, this);
        } else if (this.options.autoSave) {
            this.store.addEvent('storeRecordAdded', this.bound.save);
            this.store.addEvent('storeColumnChanged', this.bound.save);
            this.store.addEvent('storeRecordDeleted', this.bound.save);
        }
        
    },
    
    deactivate: function () {
        this.parent();
        if ($defined(this.periodicalId)) {
            $clear(this.periodicalId);
        } else if (this.options.autoSave) {
            this.store.removeEvent('storeRecordAdded', this.bound.save);
            this.store.removeEvent('storeColumnChanged', this.bound.save);
            this.store.removeEvent('storeRecordDeleted', this.bound.save);
        }
        
    },
    
    /**
     * APIMethod: saveRecord
     * Called by event handlers when store data is changed, updated, or deleted.
     * If deleted, the record will be removed from the deleted array.
     * 
     * Parameters:
     * record - The Jx.Record instance that was changed
     * store - The instance of the store
     */
    saveRecord: function (record, store) {
        //determine the status and route based on that
        if (!this.updating && $defined(record.state)) {
            if (this.totalChanges === 0) {
                this.store.protocol.addEvent('dataLoaded', this.bound.completed);
            }
            this.totalChanges++;
            var ret;
            switch (record.state) {
                case Jx.Record.UPDATE:
                    ret = this.store.protocol.update(record);
                    break;
                case Jx.Record.DELETE:
                    ret = this.store.protocol['delete'](record);
                    break;
                case Jx.Record.INSERT:
                    ret = this.store.protocol.insert(record);
                    break;
            }
            return ret;
        }
    },
    /**
     * APIMethod: save
     * Called manually when the developer wants to save all data changes 
     * in one shot. It will empty the deleted array and reset all other status 
     * flags
     */
    save: function () {
        //go through all of the data and figure out what needs to be acted on
        if (this.store.loaded) {
            var records = [];
            records[Jx.Record.UPDATE] = [];
            records[Jx.Record.INSERT] = [];
            
            this.store.data.each(function (record) {
                if ($defined(record) && $defined(record.state)) {
                    records[record.state].push(record);
                }
            }, this);
            records[Jx.Record.DELETE] = this.store.deleted;
            
            records.flatten().each(function (record) {
                this.saveRecord(record);
            }, this);
        }
        
    },
    /**
     * Method: onComplete
     * Handles processing of the response(s) from the protocol. Each 
     * update/insert/delete will have an individual response. If any responses 
     * come back failed we will hold that response and send it to the caller
     * via the fired event. This method is responsible for updating the status
     * of each record as it returns and on inserts, it updates the primary key
     * of the record. If it was a delete it will remove it permanently from the
     * store's deleted array (provided it returns successful - based on the 
     * success attribute of the meta object). When all changes have been 
     * accounted for the method fires a finished event and passes all of the 
     * failed responses to the caller so they can be handled appropriately.
     * 
     * Parameters:
     * response - the response returned from the protocol
     */
    onComplete: function (response) {
        if (!response.success() || ($defined(response.meta) && !response.meta.success)) {
            this.failedChanges.push(response);
        } else {
            //process the response
            var record = response.requestParams[0];
            if (response.requestType === 'delete') {
                this.store.deleted.erase(record);
            } else { 
                if (response.requestType === 'insert') {
                    if ($defined(response.data)) {
                        this.updating = true;
                        $H(response.data).each(function (val, key) {
                            record.set(key, val);
                        }, this);
                        this.updating = false;
                    }
                }
                record.state = null;
            } 
            this.successfulChanges.push(response);
        }
        this.totalChanges--;
        if (this.totalChanges === 0) {
            this.store.protocol.removeEvent('dataLoaded', this.bound.completed);
            this.store.fireEvent('storeChangesCompleted', {
                successful: this.successfulChanges,
                failed: this.failedChanges
            });
        }
            
    }
    
});// $Id: strategy.sort.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Strategy.Sort
 * 
 * Extends: <Jx.Store.Strategy>
 * 
 * Strategy used for sorting stores. It can either be called manually or it
 * can listen for specific events from the store.
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Strategy.Sort = new Class({
    
    Extends: Jx.Store.Strategy,
    
    name: 'sort',
    
    options: {
        /**
         * Option: sortOnStoreEvents
         * an array of events this strategy should listen for on the store and
         * sort when it sees them.
         */
        sortOnStoreEvents: ['storeColumnChanged','storeDataLoaded'],
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
        sortCols : []
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
    
    init: function () {
        this.parent();
        this.bound = {
            sort: this.sort.bind(this)
        };
    },
    
    activate: function () {
        if ($defined(this.options.sortOnStoreEvents)) {
            this.options.sortOnStoreEvents.each(function (ev) {
                this.store.addEvent(ev, this.bound.sort);
            },this);
        }
    },
    
    deactivate: function () {
        if ($defined(this.options.sortOnStoreEvents)) {
            this.options.sortOnStoreEvents.each(function (ev) {
                this.store.removeEvent(ev, this.bound.sort);
            },this);
        }
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
        
        if (this.store.count()) {
        
            this.store.fireEvent('sortStart', this);
            
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
            this.store.data = this.doSort(c[0], sort, this.store.data, true);
        
            if (c.length > 1) {
                this.store.data = this.subSort(this.store.data, 0, 1);
            }
        
            if ($defined(dir) && dir === 'desc') {
                this.store.data.reverse();
            }
        
            this.store.fireEvent('storeSortFinished', this);
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
                    result = result.concat(this.subSort(this.doSort(sortCol, this.sortType, sub, true), groupByCol + 1, sortByCol + 1));
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
            result = result.concat(this.subSort(this.doSort(sortCol, this.sortType, sub, true), groupByCol + 1, sortByCol + 1));
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
     * Method: resolveCol
     * resolves the given column identifier and resolves it to the 
     * actual column object in the store.
     * 
     * Parameters:
     * col - the name or index of the required column.
     */
    resolveCol: function (col) {
        var t = Jx.type(col);
        if (t === 'number') {
            col = this.store.options.columns[col];
        } else if (t === 'string') {
            this.store.options.columns.each(function (column) {
                if (column.name === col) {
                    col = column;
                }
            }, this);
        }
        return col;   
    }
});// $Id: parser.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Parser
 * 
 * Extends: <Jx.Object>
 * 
 * Base class for all parsers
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */

Jx.Store.Parser = new Class({
    
    Extends: Jx.Object,
    Family: 'Jx.Store.Parser',
    
    /**
     * APIMethod: parse
     * Reads data passed to it by a protocol and parses it into a specific
     * format needed by the store/record.
     * 
     * Parameters:
     * data - string of data to parse
     */
    parse: $empty,
    /**
     * APIMethod: encode
     * Takes an Jx.Record object and encodes it into a format that can be transmitted 
     * by a protocol.
     * 
     * Parameters:
     * object - an object to encode
     */
    encode: $empty
});// $Id: parser.json.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Store.Parser.JSON
 * 
 * Extends: <Jx.Store.Parser>
 * 
 * A Parser that handles encoding and decoding JSON strings
 *
 * License: 
 * Copyright (c) 2009, Jon Bomgardner.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Store.Parser.JSON = new Class({
    
    Extends: Jx.Store.Parser,
    
    options: {
        /**
         * Option: secure
         * Whether to use secure decoding. When using secure decoding the 
         * parser will return null if any invalid JSON characters are in the
         * passed in string. Defaults to false.
         */
        secure: false
    },
    /**
     * APIMethod: parse
     * Turns a string into a JSON object if possible.
     * 
     * Parameters:
     * data - the string representation of the data we're parsing
     */
    parse: function (data) {
        var type = Jx.type(data);
        
        if (type === 'string') {
            return JSON.decode(data, this.options.secure);
        }
        //otherwise just return the data object
        return data;
    },
    
    /**
     * APIMethod: encode
     * Takes an object and turns it into JSON.
     * 
     * Parameters: 
     * object - the object to encode
     */
    encode: function (object) {
        var data;
        if (object instanceof Jx.Record) {
            data = object.asHash();
        } else {
            data = object;
        }
            
        return JSON.encode(data);
    }
});// $Id: button.js 674 2009-12-29 06:47:59Z jonlb@comcast.net $
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

        toggleClass: 'jxButtonToggle',
        pressedClass: 'jxButtonPressed',
        activeClass: 'jxButtonActive',

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

    classes: new Hash({
        domObj: 'jxButtonContainer',
        domA: 'jxButton',
        domImg: 'jxButtonIcon',
        domLabel: 'jxButtonLabel'
    }),

    /**
     * APIMethod: render
     * create a new button.
     */
    render: function() {
        this.parent();

        /* is the button toggle-able? */
        if (this.options.toggle) {
            this.domObj.addClass(this.options.toggleClass);
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
                    this.domA.addClass(this.options.pressedClass);
                    hasFocus = true;
                    mouseDown = true;
                    this.focus();
                }).bindWithEvent(this),
                mouseup: (function(e) {
                    this.domA.removeClass(this.options.pressedClass);
                    mouseDown = false;
                }).bindWithEvent(this),
                mouseleave: (function(e) {
                    this.domA.removeClass(this.options.pressedClass);
                }).bindWithEvent(this),
                mouseenter: (function(e) {
                    if (hasFocus && mouseDown) {
                        this.domA.addClass(this.options.pressedClass);
                    }
                }).bindWithEvent(this),
                keydown: (function(e) {
                    if (e.key == 'enter') {
                        this.domA.addClass(this.options.pressedClass);
                    }
                }).bindWithEvent(this),
                keyup: (function(e) {
                    if (e.key == 'enter') {
                        this.domA.removeClass(this.options.pressedClass);
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
                if (this.options.image && this.options.image.indexOf(Jx.aPixel.src) == -1) {
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
            if (this.options.label || this.domA.hasClass('jxDiscloser')) {
                this.domLabel.set('html',this.options.label);
            } else {
                //this.domLabel.removeClass('jx'+this.type+'Label');
                this.domLabel.setStyle('display','none');
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
        if (this.domA) {
            if (this.options.active) {
                this.domA.addClass(this.options.activeClass);
            } else {
                this.domA.removeClass(this.options.activeClass);
            }
        }
        this.fireEvent(active ? 'down':'up', this);
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
            this.domLabel.setStyle('display', label || this.domA.hasClass('jxDiscloser') ? null : 'none');
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
        //need to account for the tooltip on the image as well
        if (this.domImg) {
            //check if title and alt are set...
            var t = this.domImg.get('title');
            if ($defined(t)) {
                //change it...
                this.domImg.set({
                    'title':tooltip,
                    'alt':tooltip
                });
            }
        }
    },
    /**
     * Method: focus
     * capture the keyboard focus on this button
     */
    focus: function() {
        if (this.domA) {
            this.domA.focus();
        }
    },
    /**
     * Method: blur
     * remove the keyboard focus from this button
     */
    blur: function() {
        if (this.domA) {
            this.domA.blur();
        }
    }
});
// $Id: flyout.js 602 2009-11-10 19:41:36Z pagameba $
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
 * The options argument takes a combination of options that apply to <Jx.Button>,
 * <Jx.ContentLoader>, and <Jx.AutoPosition>.
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
    
    options: {
        template: '<span class="jxButtonContainer"><a class="jxButton jxButtonFlyout jxDiscloser"><span class="jxButtonContent"><img class="jxButtonIcon" src="'+Jx.aPixel.src+'"><span class="jxButtonLabel "></span></a></span>',
        contentTemplate: '<div class="jxFlyout"><div class="jxFlyoutContent"></div></div>'
    },
    
    contentClasses: new Hash({
        contentContainer: 'jxFlyout',
        content: 'jxFlyoutContent'
    }),
    
    /**
     * Property: content
     * the HTML element that contains the flyout content
     */
    content: null,
    /**
     * APIMethod: render
     * construct a new instance of a flyout button.  
     */
    render: function() {
        if (!Jx.Button.Flyout.Stack) {
            Jx.Button.Flyout.Stack = [];
        }
        this.parent();
        this.processElements(this.options.contentTemplate, this.contentClasses);
        
        if (this.options.contentClass) {
            this.content.addClass(this.options.contentClass);
        }
        
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
        this.domA.addClass(this.options.activeClass);
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
});// $Id: layout.js 626 2009-11-20 13:22:22Z pagameba $
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
     * Parameters:
     * domObj - {HTMLElement} element or id to apply the layout to
     * options - <Jx.Layout.Options>
     */
    parameters: ['domObj','options'],

    /**
     * APIMethod: init
     * Create a new instance of Jx.Layout.
     */
    init: function() {
        this.domObj = document.id(this.options.domObj);
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
                         l = l + parseInt(w - this.options.maxWidth,10)/2;
                         w = this.options.maxWidth;
                     }
                } else {
                    /* variable left, fixed width, variable right
                     * distribute space between left and right
                     */
                    w = this.options.width;
                    l = parseInt((parentSize.width - w)/2,10);
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
                         t = parseInt((parentSize.height - this.options.maxHeight)/2,10);
                         h = this.options.maxHeight;
                     }
                } else {
                    /* variable top, fixed height, variable bottom
                     * distribute space between top and bottom
                     */
                    h = this.options.height;
                    t = parseInt((parentSize.height - h)/2,10);
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
});// $Id: tab.js 626 2009-11-20 13:22:22Z pagameba $
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
        toggleClass: 'jxTabToggle',
        pressedClass: 'jxTabPressed',
        activeClass: 'jxTabActive',
        activeTabClass: 'tabContentActive',
        template: '<span class="jxTabContainer"><a class="jxTab"><span class="jxTabContent"><img class="jxTabIcon"><span class="jxTabLabel"></span></span></a><a class="jxTabClose"></span>',
        contentTemplate: '<div class="tabContent"></div>'
    },
    classes: new Hash({
        domObj: 'jxTabContainer',
        domA: 'jxTab',
        domImg: 'jxTabIcon',
        domLabel: 'jxTabLabel',
        domClose: 'jxTabClose',
        content: 'tabContent'
    }),

    /**
     * APIMethod: render
     * Create a new instance of Jx.Button.Tab.  Any layout options passed are used
     * to create a <Jx.Layout> for the tab content area.
     */
    render : function( ) {
        this.options = $merge(this.options, {toggle:true});
        this.parent();
        this.domObj.store('jxTab', this);
        this.processElements(this.options.contentTemplate, this.classes);
        new Jx.Layout(this.content, this.options);
        this.loadContent(this.content);
        this.addEvent('down', function(){
            this.content.addClass(this.options.activeTabClass);
        }.bind(this));
        this.addEvent('up', function(){
            this.content.removeClass(this.options.activeTabClass);
        }.bind(this));

        //remove the close button if necessary
        if (this.domClose) {
            if (this.options.close) {
                this.domObj.addClass('jxTabClose');
                this.domClose.addEvent('click', (function(){
                    this.fireEvent('close');
                }).bind(this));
            } else {
                this.domClose.dispose();
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
});// $Id: colorpalette.js 675 2009-12-29 06:49:17Z jonlb@comcast.net $
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
 * method.  However, a <Jx.Button> suJx.Tooltipbclass is provided (<Jx.Button.Color>)
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
     * APIMethod: render
     * initialize a new instance of Jx.ColorPalette
     */
    render: function() {
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
                    r = parseInt(i/6,10)*3 + parseInt(j/6,10);
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

        this.alphaInput.value = parseInt(this.options.alpha*100,10);
        if (this.options.alpha < 1) {
            styles.opacity = this.options.alpha;
            styles.filter = 'Alpha(opacity='+(this.options.alpha*100)+')';
            
        } else {
            styles.opacity = 1;
            //not sure what the proper way to remove the filter would be since I don't have IE to test against.
            styles.filter = '';  
        }
        this.selectedSwatch.setStyles(styles);
        this.previewSwatch.setStyles(styles);
        
        this.fireEvent('change', this);
    }
});

// $Id: color.js 675 2009-12-29 06:49:17Z jonlb@comcast.net $
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
        alpha: 100,
        template: '<span class="jxButtonContainer"><a class="jxButton jxButtonFlyout jxDiscloser"><span class="jxButtonContent"><span class="jxButtonSwatch"><span class="jxButtonSwatchColor"></span></span><span class="jxButtonLabel"></span></span></a></span>'
    },

    classes: new Hash({
        domObj: 'jxButtonContainer',
        domA: 'jxButton',
        swatch: 'jxButtonSwatchColor',
        domLabel: 'jxButtonLabel'
    }),

    /**
     * APIMethod: render
     * creates a new color button.
     */
    render: function() {
        if (!Jx.Button.Color.ColorPalette) {
            Jx.Button.Color.ColorPalette = new Jx.ColorPalette(this.options);
        }

        /* we need to have an image to replace, but if a label is
           requested, there wouldn't normally be an image. */
        this.options.image = Jx.aPixel.src;

        /* now we can safely initialize */
        this.parent();
        this.updateSwatch();

        this.bound = {
            changed: this.changed.bind(this),
            hide: this.hide.bind(this)
        };
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
        Jx.Button.Color.ColorPalette.addEvent('change', this.bound.changed);
        Jx.Button.Color.ColorPalette.addEvent('click', this.bound.hide);
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
        Jx.Button.Color.ColorPalette.removeEvent('change', this.bound.changed);
        Jx.Button.Color.ColorPalette.removeEvent('click', this.bound.hide);
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
            styles.opacity = 1;
            styles.filter = '';
        }
        this.swatch.setStyles(styles);
    }
});
// $Id: menu.js 626 2009-11-20 13:22:22Z pagameba $
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
     * Property: list
     * {<Jx.List>} the list of items in the menu
     */
    list: null,

    parameters: ['buttonOptions', 'options'],

    options: {
        template: "<div class='jxMenuContainer'><ul class='jxMenu'></ul></div>",
        buttonTemplate: '<span class="jxButtonContainer"><a class="jxButton jxButtonMenu jxDiscloser"><span class="jxButtonContent"><img class="jxButtonIcon" src="'+Jx.aPixel.src+'"><span class="jxButtonLabel"></span></span></a></span>',
        position: {
            horizontal: ['left left'],
            vertical: ['bottom top', 'top bottom']
        }
    },

    classes: new Hash({
        contentContainer: 'jxMenuContainer',
        subDomObj: 'jxMenu'
    }),

    /**
     * APIMethod: render
     * Create a new instance of Jx.Menu.
     */
    render : function() {
        this.parent();
        if (!Jx.Menu.Menus) {
            Jx.Menu.Menus = [];
        }

        this.contentContainer.addEvent('onContextmenu', function(e){e.stop();});

        this.list = new Jx.List(this.subDomObj, {
            onRemove: function(item) {
                item.setOwner(null);
            }.bind(this)
        });

        /* if options are passed, make a button inside an LI so the
           menu can be embedded inside a toolbar */
        if (this.options.buttonOptions) {
            this.button = new Jx.Button($merge(this.options.buttonOptions,{
                template: this.options.buttonTemplate,
                onClick:this.show.bind(this)
            }));

            this.button.domA.addEvent('mouseover', this.onMouseOver.bindWithEvent(this));

            this.domObj = this.button.domObj;
            this.domObj.store('jxMenu', this);
        }

        /* pre-bind the hide function for efficiency */
        this.bound = {
            mousedown: this.hide.bindWithEvent(this),
            keypress: this.keypressHandler.bindWithEvent(this)
        };

        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
    },
    /**
     * APIMethod: add
     * Add menu items to the sub menu.
     *
     * Parameters:
     * item - {<Jx.MenuItem>} the menu item to add.  Multiple menu items
     * can be added by passing multiple arguments to this function.
     * position -
     * owner -
     */
    add: function(item, position, owner) {
        if (Jx.type(item) == 'array') {
            item.each(function(i){
                i.setOwner(owner||this);
            }, this);
        } else {
            item.setOwner(owner||this);
        }
        this.list.add(item, position);
        return this;
    },
    /**
     * APIMethod: remove
     * Remove a menu item from the menu
     *
     * Parameters:
     * item - {<Jx.MenuItem>} the menu item to remove
     */
    remove: function(item) {
        this.list.remove(item);
        return this;
    },
    /**
     * APIMethod: replace
     * Replace a menu item with another menu item
     *
     * Parameters:
     * what - {<Jx.MenuItem>} the menu item to replace
     * withWhat - {<Jx.MenuItem>} the menu item to replace it with
     */
    replace: function(item, withItem) {
        this.list.replace(item, withItem);
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

        /*
        this.list.items().some(
            function(item) {
                var menuItem = item.retrieve('jxMenuItem');
                return menuItem instanceof Jx.Menu.SubMenu &&
                       menuItem.eventInMenu(e);
            }
        );
        */
    },

    /**
     * APIMethod: hide
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
            this.button.domA.removeClass(this.button.options.activeClass);
        }
        this.list.each(function(item){item.retrieve('jxMenuItem').hide(e);});
        document.removeEvent('mousedown', this.bound.mousedown);
        document.removeEvent('keydown', this.bound.keypress);
        this.contentContainer.dispose();
        this.visibleItem = null;
        this.fireEvent('hide', this);
    },
    /**
     * APIMethod: show
     * Show the menu
     */
    show : function() {
        if (this.button) {
            if (Jx.Menu.Menus[0]) {
                if (Jx.Menu.Menus[0] != this) {
                    Jx.Menu.Menus[0].button.blur();
                    Jx.Menu.Menus[0].hide();
                } else {
                    this.hide();
                    return;
                }
            }
            Jx.Menu.Menus[0] = this;
            this.button.focus();
            if (this.list.count() == 0) {
                return;
            }
        }
        this.contentContainer.setStyle('display','none');
        document.id(document.body).adopt(this.contentContainer);
        this.contentContainer.setStyles({
            visibility: 'hidden',
            display: 'block'
        });

        /* we have to size the container for IE to render the chrome correctly
         * but just in the menu/sub menu case - there is some horrible peekaboo
         * bug in IE related to ULs that we just couldn't figure out
         */
        this.contentContainer.setContentBoxSize(this.subDomObj.getMarginBoxSize());
        this.showChrome(this.contentContainer);

        this.position(this.contentContainer, this.domObj, $merge({
            offsets: this.chromeOffsets
        }, this.options.position));

        this.contentContainer.setStyle('visibility','visible');

        if (this.button && this.button.domA) {
            this.button.domA.addClass(this.button.options.activeClass);
        }

        /* fix bug in IE that closes the menu as it opens because of bubbling */
        document.addEvent('mousedown', this.bound.mousedown);
        document.addEvent('keydown', this.bound.keypress);
        this.fireEvent('show', this);
    },
    /**
     * APIMethod: setVisibleItem
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
    },
    /**
     * APIMethod: isEnabled
     * This returns true if the menu is enabled, false otherwise
     *
     * Returns:
     * {Boolean} whether the menu is enabled or not
     */
    isEnabled: function() {
        return this.button.isEnabled;
    },

    /**
     * APIMethod: setEnabled
     * enable or disable the menu.
     *
     * Parameters:
     * enabled - {Boolean} the new enabled state of the menu
     */
    setEnabled: function(enabled) {
        return this.button.setEnabled(enabled);
    },
    /**
     * APIMethod: isActive
     * returns true if the menu is open.
     *
     * Returns:
     * {Boolean} the active state of the menu
     */
    isActive: function() {
        return this.button.isActive();
    },
    /**
     * APIMethod: setActive
     * Set the active state of the menu
     *
     * Parameters:
     * active - {Boolean} the new active state of the menu
     */
    setActive: function(active) {
        this.button.setActive(active);
    },
    /**
     * APIMethod: setImage
     * set the image of this menu to a new image URL
     *
     * Parameters:
     * path - {String} the new url to use as the image for this menu
     */
    setImage: function(path) {
        this.button.setImage(path);
    },
    /**
     * APIMethod: setLabel
     *
     * sets the text of the menu.
     *
     * Parameters:
     *
     * label - {String} the new label for the menu
     */
    setLabel: function(label) {
        this.button.setLabel(label);
    },
    /**
     * APIMethod: getLabel
     *
     * returns the text of the menu.
     */
    getLabel: function() {
        return this.button.getLabel();
    },
    /**
     * APIMethod: setTooltip
     * sets the tooltip displayed by the menu
     *
     * Parameters:
     * tooltip - {String} the new tooltip
     */
    setTooltip: function(tooltip) {
        this.button.setTooltip(tooltip);
    },
    /**
     * APIMethod: focus
     * capture the keyboard focus on this menu
     */
    focus: function() {
        this.button.focus();
    },
    /**
     * APIMethod: blur
     * remove the keyboard focus from this menu
     */
    blur: function() {
        this.button.blur();
    }

});

// $Id: set.js 626 2009-11-20 13:22:22Z pagameba $
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
     * APIMethod: init
     * initializes the button set.
     */
    init : function() {
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
            if (button.domObj.hasClass(button.options.toggleClass)) {
                button.domObj.removeClass(button.options.toggleClass);
                button.domObj.addClass(button.options.toggleClass+'Set');
            }
            button.addEvent('down',this.buttonChangedHandler);
            button.setActive = function(active) {
                if (button.options.active && this.activeButton == button) {
                    return;
                } else {
                    Jx.Button.prototype.setActive.apply(button, [active]);
                }
            }.bind(this);
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
});// $Id: multi.js 626 2009-11-20 13:22:22Z pagameba $
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
        template: '<span class="jxButtonContainer"><a class="jxButton jxButtonMulti jxDiscloser"><span class="jxButtonContent"><img src="'+Jx.aPixel.src+'" class="jxButtonIcon"><span class="jxButtonLabel"></span></span></a><a class="jxButtonDisclose" href="javascript:void(0)"><img src="'+Jx.aPixel.src+'"></a></span>'
    },
    classes: new Hash({
        domObj: 'jxButtonContainer',
        domA: 'jxButton',
        domImg: 'jxButtonIcon',
        domLabel: 'jxButtonLabel',
        domDisclose: 'jxButtonDisclose'
    }),


    /**
     * APIMethod: render
     * construct a new instance of Jx.Button.Multi.
     */
    render: function() {
        this.parent();
        this.buttons = [];

        this.menu = new Jx.Menu();
        this.menu.button = this;
        this.buttonSet = new Jx.ButtonSet();

        this.clickHandler = this.clicked.bind(this);

        if (this.domDisclose) {
            var button = this;
            var hasFocus;

            this.domDisclose.addEvents({
                'click': (function(e) {
                    if (this.list.count() === 0) {
                        return;
                    }
                    if (!button.options.enabled) {
                        return;
                    }
                    this.contentContainer.setStyle('visibility','hidden');
                    this.contentContainer.setStyle('display','block');
                    document.id(document.body).adopt(this.contentContainer);
                    /* we have to size the container for IE to render the chrome
                     * correctly but just in the menu/sub menu case - there is
                     * some horrible peekaboo bug in IE related to ULs that we
                     * just couldn't figure out
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
                        this.domDisclose.addClass(this.options.pressedClass);
                    }
                }).bind(this),
                'mouseleave':(function(){
                    document.id(this.domObj.firstChild).removeClass('jxButtonHover');
                    this.domDisclose.removeClass(this.options.pressedClass);
                }).bind(this),
                mousedown: (function(e) {
                    this.domDisclose.addClass(this.options.pressedClass);
                    hasFocus = true;
                    this.focus();
                }).bindWithEvent(this),
                mouseup: (function(e) {
                    this.domDisclose.removeClass(this.options.pressedClass);
                }).bindWithEvent(this),
                keydown: (function(e) {
                    if (e.key == 'enter') {
                        this.domDisclose.addClass(this.options.pressedClass);
                    }
                }).bindWithEvent(this),
                keyup: (function(e) {
                    if (e.key == 'enter') {
                        this.domDisclose.removeClass(this.options.pressedClass);
                    }
                }).bindWithEvent(this),
                blur: function() { hasFocus = false; }

            });
            if (typeof Drag != 'undefined') {
                new Drag(this.domDisclose, {
                    onStart: function() {this.stop();}
                });
            }
        }

        this.menu.addEvents({
            'show': (function() {
                this.domA.addClass(this.options.activeClass);
            }).bind(this),
            'hide': (function() {
                if (this.options.active) {
                    this.domA.addClass(this.options.activeClass);
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
            theButton.domA.addClass('jxDiscloser');
            theButton.setLabel(theButton.options.label);
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
            this.activeButton.domA.removeEvent('click', this.clickHandler);
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
});// $Id: menu.item.js 626 2009-11-20 13:22:22Z pagameba $
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
        //image: null,
        label: '&nbsp;',
        toggleClass: 'jxMenuItemToggle',
        pressedClass: 'jxMenuItemPressed',
        activeClass: 'jxMenuItemActive',
        /* Option: template
         * the HTML structure of the button.  As a minimum, there must be a
         * containing element with a class of jxMenuItemContainer and an
         * internal element with a class of jxMenuItem.  jxMenuItemIcon and
         * jxMenuItemLabel are used if present to put the image and label into
         * the button.
         */
        template: '<li class="jxMenuItemContainer"><a class="jxMenuItem"><span class="jxMenuItemContent"><img class="jxMenuItemIcon" src="'+Jx.aPixel.src+'"><span class="jxMenuItemLabel"></span></span></a></li>'
    },
    classes: new Hash({
        domObj:'jxMenuItemContainer',
        domA: 'jxMenuItem',
        domImg: 'jxMenuItemIcon',
        domLabel: 'jxMenuItemLabel'
    }),
    /**
     * APIMethod: render
     * Create a new instance of Jx.Menu.Item
     */
    render: function() {
        if (!this.options.image) {
            this.options.image = Jx.aPixel.src;
        }
        this.parent();
        if (this.options.image && this.options.image != Jx.aPixel.src) {
            this.domObj.removeClass(this.options.toggleClass);
        }
        this.domObj.addEvent('mouseover', this.onMouseOver.bind(this));
        this.domObj.store('jxMenuItem', this);
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
     */
    onMouseOver: function() {
        if (this.owner && this.owner.setVisibleItem) {
            this.owner.setVisibleItem(this);
        }
    }
});

// $Id: combo.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
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
         template: '<span class="jxButtonContainer"><a class="jxButton jxButtonCombo jxDiscloser"><span class="jxButtonContent"><img class="jxButtonIcon" src="'+Jx.aPixel.src+'"><span class="jxButtonLabel"></span></span></a></span>'
     },

    /**
     * APIMethod: render
     * create a new instance of Jx.Combo
     */
    render: function() {
        this.parent();

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
        this.addEvent('click', function(e) {
            if (this.list.count() === 0) {
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

            document.addEvent('mousedown', this.bound.mousedown);
            document.addEvent('keyup', this.bound.keypress);

            this.fireEvent('show', this);
        }.bindWithEvent(this.menu));

        this.menu.addEvents({
            'show': (function() {
                this.setActive(true);
            }).bind(this),
            'hide': (function() {
                this.setActive(false);
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

    setValue: function(value) {
        this.buttonSet.buttons.each(function(button){
            if (button.options.label === value) {
                this.buttonSet.buttonChanged(button);
            }
        },this);
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
});// $Id: toolbar.js 676 2009-12-29 06:49:56Z jonlb@comcast.net $
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
     * Property: list
     * {<Jx.List>} the list that holds the items in this toolbar
     */
    list : null,
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
        scroll: true,
        template: '<ul class="jxToolbar"></ul>'
    },
    classes: new Hash({
        domObj: 'jxToolbar'
    }),
    /**
     * APIMethod: render
     * Create a new instance of Jx.Toolbar.
     */
    render: function() {
        this.parent();
        this.domObj.store('jxToolbar', this);
        if ($defined(this.options.id)) {
            this.domObj.id = this.options.id;
        }

        this.list = new Jx.List(this.domObj, {
            onAdd: function(item) {
                this.fireEvent('add', this);
            }.bind(this),
            onRemove: function(item) {
                this.fireEvent('remove', this);
            }.bind(this)
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
            var item = thing;
            if (item.domObj) {
                item = item.domObj;
            }

            if (item.tagName == 'LI') {
                if (!item.hasClass('jxToolItem')) {
                    item.addClass('jxToolItem');
                }
            } else {
                item = new Jx.Toolbar.Item(thing);
            }
            this.list.add(item);
        }, this);
        
        //Update the size of the toolbar container.
        this.update();
        
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
        this.list.remove(li);
        this.update();
        return this;
    },
    /**
     * Method: deactivate
     * Deactivate the Toolbar (when it is acting as a menu bar).
     */
    deactivate: function() {
        this.list.each(function(item){
            if (item.retrieve('jxMenu')) {
                item.retrieve('jxMenu').hide();
            }
        });
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
    },
    /**
     * Method: update
     * Updates the size of the UL so that the size is always consistently the 
     * exact size of the size of the sum of the buttons. This will keep all of 
     * the buttons on one line.
     */
    update: function () {
        if (['top','bottom'].contains(this.options.position)) {
            (function(){
                var s = 0;
                var children = this.domObj.getChildren();
                children.each(function(button){
                    var size = button.getMarginBoxSize();
                    s += size.width;
                },this);
                if (s !== 0) {
                    this.domObj.setStyle('width', s);
                } else {
                    this.domObj.setStyle('width','auto');
                }
                this.fireEvent('update');
            }).delay(1,this);
        }
    }
});
// $Id$
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
        scroll: true,
        template: "<div class='jxBarContainer'></div>",
        scrollerTemplate: "<div class='jxToolbarContainer'><div class='jxScroller'><div class='jxToolbarWrapper'></div></div></div>"
    },
    classes: new Hash({
        domObj: 'jxBarContainer',
        tbContainer: 'jxToolbarContainer', //used to hold the buttons and the scroller/wrapper
        scroller: 'jxScroller', //used to hide the overflow of the wrapper
        wrapper: 'jxToolbarWrapper' //used to allow multiple toolbars to float next to each other
    }),
    
    updating: false,
    
    /**
     * APIMethod: render
     * Create a new instance of Jx.Toolbar.Container
     */
    render : function() {
        this.parent();
        /* if a container was passed in, use it instead of the one from the
         * template
         */
        if (document.id(this.options.parent)) {
            this.domObj = document.id(this.options.parent);
            this.elements = new Hash({'jxBarContainer':this.domObj});
            this.domObj.addClass('jxBarContainer');
        }

        if (this.options.scroll) {
            this.processElements(this.options.scrollerTemplate, this.classes);
            this.domObj.adopt(this.tbContainer);
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
            
            this.scrollLeft = new Jx.Button({
                image: Jx.aPixel.src
            }).addTo(this.tbContainer, 'top');
            this.scrollLeft.domObj.addClass('jxBarScrollLeft');
            this.scrollLeft.addEvents({
               click: this.scroll.bind(this,'left')
            });
            
            this.scrollRight = new Jx.Button({
                image: Jx.aPixel.src
            }).addTo(this.tbContainer, 'bottom');
            this.scrollRight.domObj.addClass('jxBarScrollRight');
            this.scrollRight.addEvents({
               click: this.scroll.bind(this, 'right')
            });
            
            

        } else if (this.options.scroll && ['left','right'].contains(this.options.position)) {
            //do we do scrolling up and down?
            //for now disable scroll in this case
            this.options.scroll = false;
        } else {
            this.options.scroll = false;
        }

        this.addEvent('add',this.update.bind(this));
        if (this.options.toolbars) {
            this.add(this.options.toolbars);
        }
    },

    update: function() {
        if (this.options.scroll ) {
            if (['top','bottom'].contains(this.options.position)) {
                var tbcSize = this.tbContainer.getContentBoxSize().width;
                
                var s = 0;
                //next check to see if we need the scrollers or not.
                var children = this.wrapper.getChildren();
                if (children.length > 0) {
                    children.each(function(tb){
                        s += tb.getMarginBoxSize().width;
                    },this);
                    
                    var scrollerSize = tbcSize;
                    
                    if (s === 0) {
                        this.scrollLeft.domObj.setStyles({
                            visibility: 'hidden',
                            display: 'none'
                        });
                        this.scrollRight.domObj.setStyles({
                            visibility: 'hidden',
                            display: 'none'
                        });
                    } else {
                        
                        
                        var leftMargin = this.wrapper.getStyle('margin-left').toInt();
                        
                        if (leftMargin < 0) {
                            //has been scrolled left so activate the right scroller
                            this.scrollLeft.domObj.setStyles({
                                visibility: 'visible',
                                display: 'inline-block'
                            });
                            scrollerSize -= this.scrollLeft.domObj.getMarginBoxSize().width;
                        } else {
                            //we don't need it
                            this.scrollLeft.domObj.setStyles({
                                visibility: 'hidden',
                                display: 'none'
                            });
                        }
                        
                        if (s + leftMargin > scrollerSize) {
                            //we need the right one
                            this.scrollRight.domObj.setStyles({
                                visibility: 'visible',
                                display: 'inline-block'
                            });
                            scrollerSize -= this.scrollRight.domObj.getMarginBoxSize().width;
                        } else {
                            //we don't need it
                            this.scrollRight.domObj.setStyles({
                                visibility: 'hidden',
                                display: 'none'
                            });
                        }
                    }
                    
                } else {
                    this.scrollRight.domObj.setStyles({
                        visibility: 'hidden',
                        display: 'none'
                    });
                    this.scrollLeft.domObj.setStyles({
                        visibility: 'hidden',
                        display: 'none'
                    });
                    
                }
                this.scroller.setStyle('width', scrollerSize );
                
                this.findFirstVisible();
                this.updating = false;
            }
        }
    },
    /**
     * Method: findFirstVisible
     * Finds the first visible button on the toolbar and saves a reference in 
     * the scroller object
     */
    findFirstVisible: function () {
        if ($defined(this.scroller.retrieve('buttonPointer'))) { return; };
        
        var children = this.wrapper.getChildren();
        
        if (children.length > 0) {
            children.each(function(toolbar){
                var buttons = toolbar.getChildren();
                if (buttons.length > 1) {
                   buttons.each(function(button){
                       var pos = button.getCoordinates(this.scroller);
                       if (pos.left >= 0 && !$defined(this.scroller.retrieve('buttonPointer'))) {
                           //this is the first visible button
                           this.scroller.store('buttonPointer',button);
                       }
                   },this);
                }
            },this);
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
                thing.addEvent('update', this.update.bind(this));
                thing.addEvent('show', this.scrollIntoView.bind(this));
            }
            if (this.tbContainer) {
                this.wrapper.adopt(thing.domObj);
            } else {
                this.domObj.adopt(thing.domObj);
            }
            this.domObj.addClass('jxBar'+this.options.position.capitalize());
        }, this);
        if (arguments.length > 0) {
            this.fireEvent('add', this);
        }
        return this;
    },
    
    scroll: function (direction) {
        if (this.updating) { return };
        this.updating = true;
        
        var currentButton = this.scroller.retrieve('buttonPointer');
        if (direction === 'left') {
            //need to tween the amount of the previous button
            var previousButton = this.scroller.retrieve('previousPointer');
            if (!previousButton) {
                previousButton = this.getPreviousButton(currentButton);
            } 
            if (previousButton) {
                var w = previousButton.getMarginBoxSize().width;
                var ml = this.wrapper.getStyle('margin-left').toInt();
                ml += w;
                if (typeof Fx != 'undefined' && typeof Fx.Tween != 'undefined'){
                    //scroll it
                    this.wrapper.get('tween',{property: 'margin-left', onComplete: this.afterTweenLeft.bind(this,previousButton)}).start(ml);
                } else {
                    //set it
                    this.wrapper.setStyle('margin-left', ml);
                    this.afterTweenLeft(previousButton);
                }
            } else {
                this.update();
            }
        } else {
            //must be right
            var w = currentButton.getMarginBoxSize().width;
            
            var ml = this.wrapper.getStyle('margin-left').toInt();
            ml -= w;
            
            //now, if Fx is defined tween the margin to the left to 
            //hide the current button
            if (typeof Fx != 'undefined' && typeof Fx.Tween != 'undefined'){
                //scroll it
                this.wrapper.get('tween',{property: 'margin-left', onComplete: this.afterTweenRight.bind(this,currentButton)}).start(ml);
            } else {
                //set it
                this.wrapper.setStyle('margin-left', ml);
                this.afterTweenRight(currentButton);
            }
            
        }
    },
    
    afterTweenRight: function (currentButton) {
        var np = this.getNextButton(currentButton);
        if (!np) {
            np = currentButton;
        }
        this.scroller.store('buttonPointer', np);
        if (np !== currentButton) {
            this.scroller.store('previousPointer', currentButton);
        }
        this.update();
    },
    
    afterTweenLeft: function (previousButton) {
        this.scroller.store('buttonPointer', previousButton);
        var pp = this.getPreviousButton(previousButton);
        if ($defined(pp)) {
            this.scroller.store('previousPointer', pp);
        } else {
            this.scroller.eliminate('previousPointer');
        }
        this.update();
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
    remove: function (item) {
        if (item instanceof Jx.Widget) {
            item.dispose();
        } else {
            document.id(item).dispose();
        }
        this.update();
    },
    /**
     * Method: scrollIntoView
     * scrolls an item in one of the toolbars into the currently visible
     * area of the container if it is not already fully visible
     *
     * Parameters:
     * item - the item to scroll.
     */
    scrollIntoView: function (item) {
        if (item instanceof Jx.Widget) {
            item = item.domObj;
            while (!item.hasClass('jxToolItem')){
                item = item.getParent();
            }
        }
        var pos = item.getCoordinates(this.scroller);
        var currentButton = this.scroller.retrieve('buttonPointer');
        var scrollerSize = this.scroller.getStyle('width').toInt();
        
        if (pos.right > 0 && pos.right <= scrollerSize ) { return; };
        
        if (pos.right > scrollerSize) {
            //it's right of the scroller
            var diff = pos.right - scrollerSize;
            
            //loop through toolbar items until we have enough width to
            //make the item visible
            
            var ml = this.wrapper.getStyle('margin-left').toInt();
            if (ml === 0) {
                diff += this.scrollLeft.domObj.measure(function(){
                    return this.getMarginBoxSize().width;
                });
            }
            var w = currentButton.getMarginBoxSize().width;
            var np;
            while (w < diff && $defined(currentButton)) {
                np = this.getNextButton(currentButton);
                if (np) {
                    w += np.getMarginBoxSize().width;
                } else {
                    break;
                }
                currentButton = np;
            }
            
            
            
            
            
            ml -= w;
            
            if (typeof Fx != 'undefined' && typeof Fx.Tween != 'undefined'){
                //scroll it
                this.wrapper.get('tween',{property: 'margin-left', onComplete: this.afterTweenRight.bind(this,currentButton)}).start(ml);
            } else {
                //set it
                this.wrapper.setStyle('margin-left', ml);
                this.afterTweenRight(currentButton);
            }
        } else {
            //it's left of the scroller
            var ml = this.wrapper.getStyle('margin-left').toInt();
            ml -= pos.left;
            
            if (typeof Fx != 'undefined' && typeof Fx.Tween != 'undefined'){
                //scroll it
                this.wrapper.get('tween',{property: 'margin-left', onComplete: this.afterTweenLeft.bind(this,item)}).start(ml);
            } else {
                //set it
                this.wrapper.setStyle('margin-left', ml);
                this.afterTweenLeft(item);
            }
        }
        
    },
    
    getPreviousButton: function (currentButton) {
        pp = currentButton.getPrevious();
        if (!$defined(pp)) {
            //check for a new toolbar
            pp = currentButton.getParent().getPrevious()
            if (pp) {
                pp = pp.getLast();
            }
        } 
        return pp;
    },
    
    getNextButton: function (currentButton) {
        np = currentButton.getNext();
        if (!np) {
            np = currentButton.getParent().getNext();
            if (np) {
                np = np.getFirst();
            }
        }
        return np;
    }
        
});// $Id: toolbar.item.js 626 2009-11-20 13:22:22Z pagameba $
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
    Extends: Jx.Widget,
    options: {
        /* Option: active
         * is this item active or not?  Default is true.
         */
        active: true,
        template: '<li class="jxToolItem"></li>'
    },
    classes: new Hash({
        domObj: 'jxToolItem'
    }),

    parameters: ['jxThing'],

    /**
     * APIMethod: render
     * Create a new instance of Jx.Toolbar.Item.
     */
    render: function() {
        this.parent();
        var el = document.id(this.options.jxThing);
        if (el) {
            this.domObj.adopt(el);
        }
    }
});// $Id: panel.js 674 2009-12-29 06:47:59Z jonlb@comcast.net $
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
        position: null,
        collapsedClass: 'jxPanelMin',
        collapseClass: 'jxPanelCollapse',
        menuClass: 'jxPanelMenu',
        maximizeClass: 'jxPanelMaximize',
        closeClass: 'jxPanelClose',

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
        /* Option: maximizeTooltip
         * the tooltip to display over the maximize button
         */
        restoreTooltip: 'Restore Panel',
        /* Option: maximizeLabel
         * the label to use for the maximize menu item
         */
        restoreLabel: 'Restore',
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
        toolbars: [],
        type: 'panel',
        template: '<div class="jxPanel"><div class="jxPanelTitle"><img class="jxPanelIcon" src="'+Jx.aPixel.src+'" alt="" title=""/><span class="jxPanelLabel"></span><div class="jxPanelControls"></div></div><div class="jxPanelContentContainer"><div class="jxPanelContent"></div></div></div>'
    },
    classes: new Hash({
        domObj: 'jxPanel',
        title: 'jxPanelTitle',
        domImg: 'jxPanelIcon',
        domLabel: 'jxPanelLabel',
        domControls: 'jxPanelControls',
        contentContainer: 'jxPanelContentContainer',
        content: 'jxPanelContent'
    }),

    /**
     * APIMethod: render
     * Initialize a new Jx.Panel instance
     */
    render : function(){
        this.parent();

        this.toolbars = this.options ? this.options.toolbars || [] : [];

        this.options.position = ($defined(this.options.height) && !$defined(this.options.position)) ? 'relative' : 'absolute';

        if (this.options.image && this.domImg) {
            this.domImg.setStyle('backgroundImage', 'url('+this.options.image+')');
        }
        if (this.options.label && this.domLabel) {
            this.domLabel.set('html',this.options.label);
        }

        var tbDiv = new Element('div');
        this.domControls.adopt(tbDiv);
        this.toolbar = new Jx.Toolbar({parent:tbDiv, scroll: false});

        var that = this;
        if (this.options.menu) {
            this.menu = new Jx.Menu({
                image: Jx.aPixel.src
            });
            this.menu.domObj.addClass(this.options.menuClass);
            this.menu.domObj.addClass('jxButtonContentLeft');
            this.toolbar.add(this.menu);
        }

        var b, item;
        if (this.options.collapse) {
            var colB = new Jx.Button({
                image: Jx.aPixel.src,
                tooltip: this.options.collapseTooltip,
                onClick: function() {
                    that.toggleCollapse();
                }
            });
            colB.domObj.addClass(this.options.collapseClass);
            this.addEvents({
                collapse: function() {
                    colB.setTooltip(this.options.expandTooltip);
                },
                expand: function() {
                    colB.setTooltip(this.options.collapseTooltip);
                }
            });
            this.toolbar.add(colB);
            if (this.menu) {
                item = new Jx.Menu.Item({
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
            var maxB = new Jx.Button({
                image: Jx.aPixel.src,
                tooltip: this.options.maximizeTooltip,
                onClick: function() {
                    that.maximize();
                }
            });
            maxB.domObj.addClass(this.options.maximizeClass);
            this.addEvents({
                maximize: function() {
                    maxB.setTooltip(this.options.restoreTooltip);
                },
                restore: function() {
                    maxB.setTooltip(this.options.maximizeTooltip);
                }
            });
            this.toolbar.add(maxB);
            if (this.menu) {
                item = new Jx.Menu.Item({
                    label: this.options.maximizeLabel,
                    onClick: function() { that.maximize(); }
                });
                this.addEvents({
                    maximize: function() {
                        item.setLabel(this.options.restoreLabel);
                    },
                    restore: function() {
                        item.setLabel(this.options.maximizeLabel);
                    }
                });
                this.menu.add(item);
            }
        }

        if (this.options.close) {
            var closeB = new Jx.Button({
                image: Jx.aPixel.src,
                tooltip: this.options.closeTooltip,
                onClick: function() {
                    that.close();
                }
            });
            closeB.domObj.addClass(this.options.closeClass);
            this.toolbar.add(closeB);
            if (this.menu) {
                item = new Jx.Menu.Item({
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

        if (this.options.id) {
            this.domObj.id = this.options.id;
        }
        var jxl = new Jx.Layout(this.domObj, $merge(this.options, {propagate:false}));
        var layoutHandler = this.layoutContent.bind(this);
        jxl.addEvent('sizeChange', layoutHandler);

        if (this.options.hideTitle) {
            this.title.dispose();
        }

        if (Jx.type(this.options.toolbars) == 'array') {
            this.options.toolbars.each(function(tb){
                var position = tb.options.position;
                var tbc = this.toolbarContainers[position];
                if (!tbc) {
                    tbc = new Element('div');
                    new Jx.Layout(tbc);
                    this.contentContainer.adopt(tbc);
                    this.toolbarContainers[position] = tbc;
                }
                tb.addTo(tbc);
            }, this);
        }

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
                    tb.update();
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
                        case 'bottom':
                            bottom = size.height;
                            break;
                        case 'left':
                            left = size.width;
                            break;
                        case 'right':
                            right = size.width;
                            break;
                        case 'top':
                        default:
                            top = size.height;
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
        this.domLabel.set('html',s);
    },
    /**
     * Method: getLabel
     * Get the label of the title bar of this panel
     *
     * Returns:
     * {String} the label
     */
    getLabel: function() {
        return this.domLabel.get('html');
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
            if (!this.domObj.hasClass(this.options.collapsedClass)) {
                this.domObj.addClass(this.options.collapsedClass);
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
            if (this.domObj.hasClass(this.options.collapsedClass)) {
                this.domObj.removeClass(this.options.collapsedClass);
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

});// $Id: dialog.js 670 2009-12-18 06:04:44Z jonlb@comcast.net $
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
    //Implements: [Jx.AutoPosition, Jx.Chrome],

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
        //parent: null,
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
        close: true,
        collapsedClass: 'jxDialogMin',
        collapseClass: 'jxDialogCollapse',
        menuClass: 'jxDialogMenu',
        maximizeClass: 'jxDialogMaximize',
        closeClass: 'jxDialogClose',
        type: 'dialog',
        template: '<div class="jxDialog"><div class="jxDialogTitle"><img class="jxDialogIcon" src="'+Jx.aPixel.src+'" alt="" title=""/><span class="jxDialogLabel"></span><div class="jxDialogControls"></div></div><div class="jxDialogContentContainer"><div class="jxDialogContent"></div></div></div>'
    },
    classes: new Hash({
        domObj: 'jxDialog',
        title: 'jxDialogTitle',
        domImg: 'jxDialogIcon',
        domLabel: 'jxDialogLabel',
        domControls: 'jxDialogControls',
        contentContainer: 'jxDialogContentContainer',
        content: 'jxDialogContent'
    }),
    /**
     * APIMethod: render
     * renders Jx.Dialog
     */
    render: function() {
        this.isOpening = false;
        this.firstShow = true;

        this.options = $merge(
            {parent:document.body}, // these are defaults that can be overridden
            this.options,
            {position: 'absolute'} // these override anything passed to the options
        );

        /* initialize the panel overriding the type and position */
        this.parent();
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
            if (!this.domObj.hasClass(this.options.collapsedClass)) {
                this.domObj.addClass(this.options.collapsedClass);
            }
            this.contentContainer.setStyle('display','none');
            if (this.resizeHandle) {
                this.resizeHandle.setStyle('display','none');
            }
        } else {
            if (this.domObj.hasClass(this.options.collapsedClass)) {
                this.domObj.removeClass(this.options.collapsedClass);
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
     * Method: maximize
     * Called when the maximize button of a dialog is clicked. It will maximize
     * the dialog to match the size of its parent.
     */
    maximize: function () {
        
        if (!this.maximized) {
            //get size of parent
            var p = this.options.parent;
            var size;
            
            if (p === document.body) {
                size = Jx.getPageDimensions();
            } else {
                size = p.getBorderBoxSize();
            }
            this.previousSettings = {
                width: this.options.width,
                height: this.options.height,
                horizontal: this.options.horizontal,
                vertical: this.options.vertical,
                left: this.options.left,
                right: this.options.right,
                top: this.options.top,
                bottom: this.options.bottom
            };
            this.options.width = size.width;
            this.options.height = size.height;
            this.options.vertical = '0 top';
            this.options.horizontal = '0 left';
            this.options.right = 0;
            this.options.left = 0;
            this.options.top = 0;
            this.options.bottom = 0;
            this.domObj.resize(this.options);
            this.fireEvent('resize');
            this.resizeChrome(this.domObj);
            this.maximized = true;
            this.domObj.addClass('jxDialogMaximized');
            this.fireEvent('maximize');
        } else {
            this.options = $merge(this.options, this.previousSettings);
            this.domObj.resize(this.options);
            this.fireEvent('resize');
            this.resizeChrome(this.domObj);
            this.maximized = false;
            if (this.domObj.hasClass('jxDialogMaximized')) {
                this.domObj.removeClass('jxDialogMaximized');
            }
            this.fireEvent('restore');
        }
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
        
        this.toolbar.update();
        
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
    },

    cleanup: function() {
        if (this.blanket) {
            this.blanket.destroy();
        }
    },
    
    isOpen: function () {
        //check to see if we're visible
        return !((this.domObj.getStyle('display') === 'none') || (this.domObj.getStyle('visibility') === 'hidden'));
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
// $Id: splitter.js 626 2009-11-20 13:22:22Z pagameba $
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

    parameters: ['domObj','options'],

    /**
     * APIMethod: init
     * Create a new instance of Jx.Splitter
     */
    init: function() {
        this.domObj = document.id(this.options.domObj);
        this.domObj.addClass('jxSplitContainer');
        var jxLayout = this.domObj.retrieve('jxLayout');
        if (jxLayout) {
            jxLayout.addEvent('sizeChange', this.sizeChanged.bind(this));
        }

        this.elements = [];
        this.bars = [];
        var i;
        var nSplits = 2;
        if (this.options.useChildren) {
            this.elements = this.domObj.getChildren();
            nSplits = this.elements.length;
        } else {
            nSplits = this.options.elements ?
                            this.options.elements.length :
                            this.options.splitInto;
            for (i=0; i<nSplits; i++) {
                var el;
                if (this.options.elements && this.options.elements[i]) {
                    if (this.options.elements[i].domObj) {
                        el = this.options.elements[i].domObj;
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
        for (i=0; i<nSplits; i++) {
            var jxl = this.elements[i].retrieve('jxLayout');
            if (!jxl) {
                new Jx.Layout(this.elements[i], this.options.containerOptions[i]);
            } else {
                if (this.options.containerOptions[i]) {
                    jxl.resize($merge(this.options.containerOptions[i],
                        {position:'absolute'}));
                } else {
                    jxl.resize({position: 'absolute'});
                }
            }
        }

        for (i=1; i<nSplits; i++) {
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

        for (i=0; i<this.options.barOptions.length; i++) {
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

        for (i=0; i<this.options.snaps.length; i++) {
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
        var leftEdge = parseInt(obj.style.left,10);
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
            parentSize = this.domObj.getContentBoxSize();
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
        var topEdge = parseInt(obj.style.top,10);

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
        var i,e,jxo;
        for (i=0; i<this.bars.length; i++) {
            var bar = this.bars[i];
            var size = bar.retrieve('size');
            if (!size || size.width == 0) {
                size = bar.getBorderBoxSize();
                bar.store('size',size);
            }
            availableSpace -= size.width;
        }

        var nVariable = 0, w = 0;
        for (i=0; i<this.elements.length; i++) {
            e = this.elements[i];
            jxo = e.retrieve('jxLayout').options;
            if (jxo.width != null) {
                availableSpace -= parseInt(jxo.width,10);
            } else {
                w = 0;
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

        var amount = parseInt(availableSpace / nVariable,10);
        /* account for rounding errors */
        var remainder = availableSpace % nVariable;

        var leftPadding = this.domObj.measure(function(){
            var m = this.getSizes(['padding'], ['left']);
            return m.padding.left;
        });

        var currentPosition = 0;

        for (i=0; i<this.elements.length; i++) {
             e = this.elements[i];
             var jxl = e.retrieve('jxLayout');
             jxo = jxl.options;
             if (jxo.width != null) {
                 jxl.resize({left: currentPosition});
                 currentPosition += jxo.width;
             } else {
                 var a = amount;
                 if (nVariable == 1) {
                     a += remainder;
                 }
                 nVariable--;

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
        var i,e,jxo;
        for (i=0; i<this.bars.length; i++) {
            var bar = this.bars[i];
            var size = bar.retrieve('size');
            if (!size || size.height == 0) {
                size = bar.getBorderBoxSize();
                bar.store('size', size);
            }
            availableSpace -= size.height;
        }

        var nVariable = 0, h=0;
        for (i=0; i<this.elements.length; i++) {
            e = this.elements[i];
            jxo = e.retrieve('jxLayout').options;
            if (jxo.height != null) {
                availableSpace -= parseInt(jxo.height,10);
            } else {
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

        var amount = parseInt(availableSpace / nVariable,10);
        /* account for rounding errors */
        var remainder = availableSpace % nVariable;

        var paddingTop = this.domObj.measure(function(){
            var m = this.getSizes(['padding'], ['top']);
            return m.padding.top;
        });

        var currentPosition = 0;

        for (i=0; i<this.elements.length; i++) {
             e = this.elements[i];
             var jxl = e.retrieve('jxLayout');
             jxo = jxl.options;
             if (jxo.height != null) {
                 jxl.resize({top: currentPosition});
                 currentPosition += jxo.height;
             } else {
                 var a = amount;
                 if (nVariable == 1) {
                     a += remainder;
                 }
                 nVariable--;

                 h = 0;
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
});// $Id: panelset.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
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
     * APIMethod: render
     * Create a new instance of Jx.PanelSet.
     */
    render: function() {
        if (this.options.panels) {
            this.panels = this.options.panels;
            this.options.panels = null;
        }
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
        var panelIndex,i,p,thePanel,o,panelHeight;
        /* calculate how much space might be left after setting all the panels to
         * their minimum height (except the one we are resizing of course)
         */
        for (i=1; i<this.splitter.elements.length; i++) {
            p = this.splitter.elements[i];
            space -= p.retrieve('leftBar').getBorderBoxSize().height;
            if (p !== panel.domObj) {
                thePanel = p.retrieve('Jx.Panel');
                o = p.retrieve('jxLayout').options;
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
        for (i=1; i<this.splitter.elements.length; i++) {
            p = this.splitter.elements[i];
            top += p.retrieve('leftBar').getBorderBoxSize().height;
            if (p !== panel.domObj) {
                thePanel = p.retrieve('Jx.Panel');
                o = p.retrieve('jxLayout').options;
                panelHeight = $chk(o.height) ? o.height : p.getBorderBoxSize().height;
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
        for (i=this.splitter.elements.length - 1; i > 0; i--) {
            p = this.splitter.elements[i];
            if (p !== panel.domObj) {
                o = p.retrieve('jxLayout').options;
                panelHeight = $chk(o.height) ? o.height : p.getBorderBoxSize().height;
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
        this.fireEvent('panelMaximize',panel);
    }
});// $Id: message.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Dialog.Message
 *
 * Extends: <Jx.Dialog>
 *
 * Jx.Dialog.Confirm is an extension of Jx.Dialog that allows the developer
 * to display a message to the user. It only presents an OK button.
 *
 * License:
 * Copyright (c) 2009, Jonathan Bomgardner
 *
 * This file is licensed under an MIT style license
 */
Jx.Dialog.Message = new Class({

    Extends: Jx.Dialog,

    options: {
        /**
         * Option: message
         * The message to display to the user
         */
        message: '',
        /**
         * Jx.Dialog option defaults
         */
        width: 300,
        height: 150,
        close: true,
        resize: true,
        collapse: false
    },
    /**
     * APIMethod: render
     * constructs the dialog.
     */
    render: function () {
        //create content to be added
        this.buttons = new Jx.Toolbar({position: 'bottom'});
        this.buttons.add(
            new Jx.Button({
                label: 'Ok',
                onClick: this.onClick.bind(this, 'Ok')
            })
        );
        this.options.toolbars = [this.buttons];
        if (Jx.type(this.options.message) === 'string') {
            this.question = new Element('div', {
                'class': 'jxMessage',
                html: this.options.message
            });
        } else {
            this.question = this.options.question;
            $(this.question).addClass('jxMessage');
        }
        this.options.content = this.question;
        this.parent();
    },
    /**
     * Method: onClick
     * Called when the OK button is clicked. Closes the dialog.
     */
    onClick: function (value) {
        this.close();
    }


});
// $Id: confirm.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Dialog.Confirm
 *
 * Extends: <Jx.Dialog>
 *
 * Jx.Dialog.Confirm is an extension of Jx.Dialog that allows the developer
 * to prompt their user with e yes/no question.
 *
 * License:
 * Copyright (c) 2009, Jonathan Bomgardner
 *
 * This file is licensed under an MIT style license
 */
Jx.Dialog.Confirm = new Class({

    Extends: Jx.Dialog,

    options: {
        /**
         * Option: question
         * The question to ask the user
         */
        question: '',
        /**
         * Option: affirmitiveLabel
         * The text to use for the affirmitive button. Defaults to 'Yes'.
         */
        affirmitiveLabel: 'Yes',
        /**
         * Option: negativeLabel
         * The text to use for the negative button. Defaults to 'No'.
         */
        negativeLabel: 'No',

        /**
         * Jx.Dialog option defaults
         */
        width: 300,
        height: 150,
        close: false,
        resize: true,
        collapse: false
    },
    /**
     * APIMethod: render
     * creates the dialog
     */
    render: function () {
        //create content to be added
        this.buttons = new Jx.Toolbar({position: 'bottom'});
        this.buttons.add(
            new Jx.Button({
                label: this.options.affirmitiveLabel,
                onClick: this.onClick.bind(this, this.options.affirmitiveLabel)
            }),
            new Jx.Button({
                label: this.options.negativeLabel,
                onClick: this.onClick.bind(this, this.options.negativeLabel)
            })
        );
        this.options.toolbars = [this.buttons];
        if (Jx.type(this.options.question) === 'string') {
            this.question = new Element('div', {
                'class': 'jxConfirmQuestion',
                html: this.options.question
            });
        } else {
            this.question = this.options.question;
            $(this.question).addClass('jxConfirmQuestion');
        }
        this.options.content = this.question;
        this.parent();
    },
    /**
     * Method: onClick
     * called when any button is clicked. It hides the dialog and fires
     * the close event passing it the value of the button that was pressed.
     */
    onClick: function (value) {
        this.isOpening = false;
        this.hide();
        this.fireEvent('close', [this, value]);
    }


});// $Id: tooltip.js 649 2009-11-30 22:19:48Z pagameba $
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
    Family: 'Jx.Widget',
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
     * Parameters:
     * target - The DOM element that triggers the toltip when moused over.
     * tip - The contents of the tip itself. This can be either a string or
     *       an Element.
     * options - <Jx.Tooltip.Options> and <Jx.Widget.Options>
     */
    parameters: ['target','tip','options'],

    /**
     * APIMethod: render
     * Creates the tooltip
     *

     */
    render : function () {
        this.parent();
        this.target = document.id(this.options.target);

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

        if (Jx.type(this.options.tip) === 'string') {
            this.domObj.set('html', this.options.tip);
        } else {
            this.domObj.grab(this.options.tip);
        }

        this.domObj.addClass('jxTooltip');
        if ($defined(this.options.cssClass)) {
            this.domObj.addClass(this.options.cssClass);
        }

        this.options.target.store('Tip', this);

        //add events
        this.options.target.addEvent('mouseenter', this.enter.bindWithEvent(this));
        this.options.target.addEvent('mouseleave', this.leave.bindWithEvent(this));
        this.options.target.addEvent('mousemove', this.move.bindWithEvent(this));

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
        var size = window.getSize(), scroll = window.getScroll();
        var tipSize = this.domObj.getMarginBoxSize();
        var tip = {
            x : this.domObj.offsetWidth,
            y : this.domObj.offsetHeight
        };
        var tipPlacement = {
            x: event.page.x + this.options.offsets.x,
            y: event.page.y + this.options.offsets.y
        };

        if (event.page.y + this.options.offsets.y + tip.y + tipSize.height - scroll.y > size.y) {
            tipPlacement.y = event.page.y - this.options.offsets.y - tipSize.height - scroll.y;
        }

        if (event.page.x + this.options.offsets.x + tip.x + tipSize.width - scroll.x > size.x) {
            tipPlacement.x = event.page.x - this.options.offsets.x - tipSize.width - scroll.x;
        }

        this.domObj.setStyle('top', tipPlacement.y);
        this.domObj.setStyle('left', tipPlacement.x);
    },
    /**
     * Method: detach
     * Called to manually remove a tooltip.
     */
    detach : function () {
        this.target.eliminate('Tip');
        this.destroy();
    }
});
// $Id: field.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
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
    Family: 'Jx.Field',
    Extends : Jx.Widget,
    pluginNamespace: 'Field',

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
        disabled : false,
        /**
         * Option: defaultAction
         * {Boolean} defaults to false, if true and this field is a button
         * of some kind (Jx.Button, a button or an input of type submit) then
         * if the user hits the enter key on any field in the form except a
         * textarea, this field will be activated as if clicked
         */
        defaultAction: false
    },

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
    classes : new Hash({
        domObj: 'jxInputContainer',
        label: 'jxInputLabel',
        tag: 'jxInputTag'
    }),

    /**
     * APIMethod: render
     */
    render : function () {
        this.classes.set('field', 'jxInput'+this.type);
        var name = $defined(this.options.name) ? this.options.name : '';
        this.options.template = this.options.template.substitute({name:name});
        this.parent();

        this.id = ($defined(this.options.id)) ? this.options.id : this
                .generateId();
        this.name = this.options.name;

        if ($defined(this.type)) {
            this.domObj.addClass('jxInputContainer'+this.type);
        }

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

        // LABEL
        if (this.label) {
            if ($defined(this.options.labelClass)) {
                this.label.addClass(this.options.labelClass);
            }
            if ($defined(this.options.label)) {
                this.label.set('html', this.options.label
                        + this.options.labelSeparator);
            }

            this.label.set('for', this.id);

            if (this.options.required) {
                var em = new Element('em', {
                    'html' : this.options.requiredText,
                    'class' : 'required'
                });
                em.inject(this.label);
            }
        }

        // FIELD
        if (this.field) {
            if ($defined(this.options.fieldClass)) {
                this.field.addClass(this.options.fieldClass);
            }

            if ($defined(this.options.value)) {
                this.field.set('value', this.options.value);
            }

            this.field.set('id', this.id);

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

            this.field.store('field', this);
        }

        // TAG
        if (this.tag) {
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
     * APIMethod: setValue 
     * Sets the value property of the field
     *
     * Parameters:
     * v - The value to set the field to.
     */
    setValue : function (v) {
        if (!this.options.readonly) {
            this.field.set('value', v);
        }
    },

    /**
     * APIMethod: getValue
     * Returns the current value of the field.
     */
    getValue : function () {
        return this.field.get("value");
    },

    /**
     * APIMethod: reset
     * Sets the field back to the value passed in the
     * original options
     */
    reset : function () {
        this.field.set('value', this.options.value);
        this.fireEvent('reset', this);
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
     * APIMethod: addTo
     *
     */
    addTo: function(what) {
        if (what instanceof Jx.Fieldset || what instanceof Jx.Form) {
            what.add(this);
        } else {
            this.parent(what);
        }
        return this;
    }

});
// $Id: text.js 649 2009-11-30 22:19:48Z pagameba $
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
        template: '<span class="jxInputContainer"><label class="jxInputLabel"></label><input class="jxInputText" type="text" name="{name}"/><span class="jxInputTag"></span></span>'
    },
    /**
     * Property: type
     * The type of this field
     */
    type: 'Text',

    /**
     * APIMethod: render
     * Creates a text input field.
     */
    render: function () {
        this.parent();

        //create the overText instance if needed
        if ($defined(this.options.overText)) {
            var opts = $extend({}, this.options.overText);
            this.field.set('alt', this.options.tip);
            this.overText = new OverText(this.field, opts);
            this.overText.show();
        }

    }

});// $Id$
/**
 * Class: Jx.Dialog.Prompt
 *
 * Extends: <Jx.Dialog>
 *
 * Jx.Dialog.Prompt is an extension of Jx.Dialog that allows the developer
 * to display a message to the user and ask for a text response. 
 *
 * License:
 * Copyright (c) 2009, Jonathan Bomgardner
 *
 * This file is licensed under an MIT style license
 */
Jx.Dialog.Prompt = new Class({

    Extends: Jx.Dialog,

    options: {
        /**
         * Option: prompt
         * The message to display to the user
         */
        prompt: '',
        /**
         * Option: startingValue
         * The startingvalue to place in the text box
         */
        startingValue: '',
        /**
         * Jx.Dialog option defaults
         */
        width: 400,
        height: 200,
        close: true,
        resize: true,
        collapse: false
    },
    /**
     * APIMethod: render
     * constructs the dialog.
     */
    render: function () {
        //create content to be added
        this.buttons = new Jx.Toolbar({position: 'bottom'});
        this.buttons.add(
            new Jx.Button({
                label: 'Ok',
                onClick: this.onClick.bind(this, 'Ok')
            }),
            new Jx.Button({
                label: 'Cancel',
                onClick: this.onClick.bind(this,'Cancel')
            })
        );
        this.options.toolbars = [this.buttons];
        
        this.field = new Jx.Field.Text({
            label: this.options.prompt,
            value: this.options.startingValue,
            containerClass: 'jxPrompt'
        });
        this.options.content = document.id(this.field);
        this.parent();
    },
    /**
     * Method: onClick
     * Called when the OK button is clicked. Closes the dialog.
     */
    onClick: function (value) {
        this.isOpening = false;
        this.hide();
        this.fireEvent('close', [this, value, this.field.getValue()]);
    }


});
// $Id: dataview.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Panel.DataView
 *
 * Extends: <Jx.Panel>
 *
 * This panel extension takes a standard Jx.Store (or subclass) and displays
 * each record as an item using a provided template. It sorts the store as requested
 * before doing so. The class only creates the HTML and has no default CSS display. All
 * styling must be done by the developer using the control.
 *
 *
 * Events:
 * renderDone - fires when the panel completes creating all of the items.
 *
 * License:
 * Copyright (c) 2009, Jonathan Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Panel.DataView = new Class({

    Extends: Jx.Panel,

    options: {
        /**
         * Option: data
         * The store containing the data
         */
        data: null,
        /**
         * Option: sortColumns
         * An array of columns to sort the store by.
         */
        sortColumns: null,
        /**
         * Option: itemTemplate
         * The template to use in rendering records
         */
        itemTemplate: null,
        /**
         * Option: emptyTemplate
         * the template that is displayed when there are no records in the
         * store.
         */
        emptyTemplate: null,
        /**
         * Option: containerClass
         * The class added to the container. It can be used to target the items
         * in the panel.
         */
        containerClass: null,
        /**
         * Option: itemClass
         * The class to add to each item. Used for styling purposes
         */
        itemClass: null,
        /**
         * Option: itemOptions
         * Options to pass to the list object
         */
        listOptions: {
            select: true,
            hover: true
        }
    },

    /**
     * Property: bound
     * hold bound functions
     */
    bound: {},

    init: function () {
        this.domA = new Element('div');
        this.list = this.createList(this.domA, this.options.listOptions);
        this.parent();
    },
    /**
     * APIMethod: render
     * Renders the dataview. If the store already has data loaded it will be rendered
     * at the end of the method.
     */
    render: function () {
        if (!$defined(this.options.data)) {
            //we can't do anything without data
            return;
        }

        this.options.content = this.domA;

        //pass to parent
        this.parent();

        this.domA.addClass(this.options.containerClass);

        //parse templates so we know what values are needed in each
        this.itemCols = this.parseTemplate(this.options.itemTemplate);

        this.bound.update = this.update.bind(this);
        //listen for data updates
        this.options.data.addEvent('loadFinished', this.bound.update);
        this.options.data.addEvent('sortFinished', this.bound.update);
        this.options.data.addEvent('loadError', this.bound.update);

        if (this.options.data.loaded) {
            this.update();
        }

    },

    /**
     * Method: draw
     * begins the process of creating the items
     */
    draw: function () {
        var n = this.options.data.count();
        if ($defined(n) && n > 0) {
            for (var i = 0; i < n; i++) {
                this.options.data.moveTo(i);

                var item = this.createItem();
                this.list.add(item);
            }
        } else {
            var empty = new Element('div', {html: this.options.emptyTemplate});
            this.list.add(item);
        }
        this.fireEvent('renderDone', this);
    },
    /**
     * Method: createItem
     * Actually does the work of getting the data from the store
     * and creating a single item based on the provided template
     */
    createItem: function () {
        //create the item
        var itemObj = {};
        this.itemCols.each(function (col) {
            itemObj[col] = this.options.data.get(col);
        }, this);
        var itemTemp = this.options.itemTemplate.substitute(itemObj);
        var item = new Element('div', {
            'class': this.options.itemClass,
            html: itemTemp
        });
        return item;
    },
    /**
     * APIMethod: update
     * This method begins the process of creating the items. It is called when
     * the store is loaded or can be called to manually recreate the view.
     */
    update: function () {
        if (!this.updating) {
            this.updating = true;
            this.list.empty();
            this.options.data.sort(this.options.sortColumns);
            this.draw();
            this.updating = false;
        }
    },
    /**
     * Method: parseTemplate
     * parses the provided template to determine which store columns are
     * required to complete it.
     *
     * Parameters:
     * template - the template to parse
     */
    parseTemplate: function (template) {
        //we parse the template based on the columns in the data store looking
        //for the pattern {column-name}. If it's in there we add it to the
        //array of ones to look for
        var columns = this.options.data.getColumns();
        var arr = [];
        columns.each(function (col) {
            var s = '{' + col.name + '}';
            if (template.contains(s)) {
                arr.push(col.name);
            }
        }, this);
        return arr;
    },
    /**
     * Method: enterItem
     * Fires mouseenter event
     *
     * Parameters:
     * item - the item that is the target of the event
     * list - the list this item is in.
     */
    enterItem: function(item, list){
        this.fireEvent('mouseenter', item, list);
    },
    /**
     * Method: leaveItem
     * Fires mouseleave event
     *
     * Parameters:
     * item - the item that is the target of the event
     * list - the list this item is in.
     */
    leaveItem: function(item, list){
        this.fireEvent('mouseleave', item, list);
    },
    /**
     * Method: selectItem
     * Fires select event
     *
     * Parameters:
     * item - the item that is the target of the event
     * list - the list this item is in.
     */
    selectItem: function(item, list){
        this.fireEvent('select', item, list);
    },
    /**
     * Method: unselectItem
     * Fires unselect event
     *
     * Parameters:
     * item - the item that is the target of the event
     * list - the list this item is in.
     */
    unselectItem: function(item, list){
        this.fireEvent('unselect', item, list);
    },
    /**
     * Method: addItem
     * Fires add event
     *
     * Parameters:
     * item - the item that is the target of the event
     * list - the list this item is in.
     */
    addItem: function(item, list) {
        this.fireEvent('add', item, list);
    },
    /**
     * Method: removeItem
     * Fires remove event
     *
     * Parameters:
     * item - the item that is the target of the event
     * list - the list this item is in.
     */
    removeItem: function(item, list) {
        this.fireEvent('remove', item, list);
    },
    /**
     * Method: createList
     * Creates the list object
     *
     * Parameters:
     * container - the container to use in the list
     * options - the options for the list
     */
    createList: function(container, options){
        return new Jx.List(container, $extend({
            onMouseenter: this.enterItem.bind(this),
            onMouseleave: this.leaveItem.bind(this),
            onSelect:  this.selectItem.bind(this),
            onAdd: this.addItem.bind(this),
            onRemove: this.removeItem.bind(this),
            onUnselect: this.unselectItem.bind(this)
        }, options));
    }
});
// $Id: group.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Panel.DataView.Group
 *
 * Extends: <Jx.Panel.DataView>
 *
 * This extension of Jx.Panel.DataView that provides for grouping the items
 * by a particular column.
 *
 * License:
 * Copyright (c) 2009, Jonathan Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Panel.DataView.Group = new Class({

    Extends: Jx.Panel.DataView,

    options: {
        /**
         * Option: groupTemplate
         * The template used to render the group heading
         */
        groupTemplate: null,
        /**
         * Option: groupContainerClass
         * The class added to the group container. All of the items and header
         * for a single grouping is contained by a div that has this class added.
         */
        groupContainerClass: null,
        /**
         * Option: groupHeaderClass
         * The class added to the heading. Used for styling.
         */
        groupHeaderClass: null,
        /**
         * Option: listOption
         * Options to pass to the main list
         */
        listOptions: {
            select: false,
            hover: false
        },
        /**
         * Option: itemOption
         * Options to pass to the item lists
         */
        itemOptions: {
            select: true,
            hover: true,
            hoverClass: 'jxItemHover',
            selectClass: 'jxItemSelect'
        }
    },

    init: function() {
        this.groupCols = this.parseTemplate(this.options.groupTemplate);
        this.itemManager = new Jx.Selection({
            eventToFire: {
                select: 'itemselect',
                unselect: 'itemunselect'
            },
            selectClass: 'jxItemSelected'
        });
        this.groupManager = new Jx.Selection({
            eventToFire: {
                select: 'groupselect',
                unselect: 'groupunselect'
            },
            selectClass: 'jxGroupSelected'
        });
        this.parent();

    },
    /**
     * APIMethod: render
     * sets up the list container and calls the parent class' render function.
     */
    render: function () {
        this.list = this.createList(this.domA, this.listOptions, this.groupManager);
        this.parent();

    },
    /**
     * Method: draw
     * actually does the work of creating the view
     */
    draw: function () {
        var d = this.options.data;
        var n = d.count();

        if ($defined(n) && n > 0) {
            var currentGroup = '';
            var itemList = null;

            for (var i = 0; i < n; i++) {
                d.moveTo(i);
                var group = d.get(this.options.sortColumns[0]);

                if (group !== currentGroup) {
                    //we have a new grouping

                    //group container
                    var container =  new Element('div', {
                        'class': this.options.groupContainerClass
                    });
                    var l = this.createList(container,{
                        select: false,
                        hover: false
                    });
                    this.list.add(l.container);

                    //group header
                    currentGroup = group;
                    var obj = {};
                    this.groupCols.each(function (col) {
                        obj[col] = d.get(col);
                    }, this);
                    var temp = this.options.groupTemplate.substitute(obj);
                    var g = new Element('div', {
                        'class': this.options.groupHeaderClass,
                        'html': temp,
                        id: 'group-' + group.replace(" ","-","g")
                    });
                    l.add(g);

                    //items container
                    var currentItemContainer = new Element('div', {
                        'class': this.options.containerClass
                    });
                    itemList = this.createList(currentItemContainer, this.options.itemOptions, this.itemManager);
                    l.add(itemList.container);
                }

                var item = this.createItem();
                itemList.add(item);
            }
        } else {
            var empty = new Element('div', {html: this.options.emptyTemplate});
            this.list.add(empty);
        }
        this.fireEvent('renderDone', this);
    },

    /**
     * Method: createList
     * Creates the list object
     *
     * Parameters:
     * container - the container to use in the list
     * options - the options for the list
     * manager - <Jx.Selection> which selection obj to connect to this list
     */
    createList: function(container, options, manager){
        return new Jx.List(container, $extend({
            onMouseenter: this.enterItem.bind(this),
            onMouseleave: this.leaveItem.bind(this),
            onAdd: this.addItem.bind(this),
            onRemove: this.removeItem.bind(this)
        }, options), manager);
    }

});
// $Id: hidden.js 649 2009-11-30 22:19:48Z pagameba $
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
        template: '<span class="jxInputContainer"><input class="jxInputHidden" type="hidden" name="{name}"/></span>'
    },
    /**
     * Property: type
     * The type of this field
     */
    type: 'Hidden'

});




// $Id: form.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
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
    Family: 'Jx.Form',
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
         * Option: fileUpload
         * Determines if this form needs to be setup for file uploads.
         */
        fileUpload: false
    },
    
    /**
     * Property: defaultAction
     * the default field to activate if the user hits the enter key in this
     * form.  Set by specifying default: true as an option to a field.  Will
     * only work if the default is a Jx button field or an input of a type
     * that is a button
     */
    defaultAction: null,

    /**
     * Property: fields
     * An array of all of the single fields (not contained in a fieldset) for this form
     */
    fields : new Hash(),
    /**
     * Property: pluginNamespace
     * required variable for plugins
     */
    pluginNamespace: 'Form',

    /**
     * APIMethod: render
     * Constructs the form but does not add it to anything to be shown. The caller
     * should use form.addTo() to add the form to the DOM.
     */
    render : function () {
        //create the form first
        this.domObj = new Element('form', {
            'method' : this.options.method,
            'action' : this.options.action,
            'class' : 'jxForm',
            'name' : this.options.name,
            events: {
                keypress: function(e) {
                    if (e.key == 'enter' && 
                        e.target.tagName != "TEXTAREA" && 
                        this.defaultAction &&
                        this.defaultAction.click) {
                        document.id(this.defaultAction).focus();
                        this.defaultAction.click();
                    }
                }.bind(this)
            }
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
     * APIMethod: addField
     * Adds a <Jx.Field> subclass to this form's fields hash
     *
     * Parameters:
     * field - <Jx.Field> to add
     */
    addField : function (field) {
        this.fields.set(field.id, field);
        if (field.options.defaultAction) {
            this.defaultAction = field;
        }
    },

    /**
     * Method: isValid
     * Determines if the form passes validation
     *
     * Parameters:
     * evt - the Mootools event object
     */
    isValid : function (evt) {
        return true;
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
        if ($defined(asQueryString) && asQueryString) {
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
            } else if (field instanceof Jx.Fieldset && !$defined(field.form)) {
                field.form = this;
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
        this.fireEvent('reset',this);
    },

    getFieldsByName: function (name) {
        var fields = [];
        this.fields.each(function(val, id){
            if (val.name === name) {
                fields.push(val);
            }
        },this);
        return fields;
    },
    
    getField: function (id) {
        if (this.fields.has(id)) {
            return this.fields.get(id);
        } 
        return null;
    }
});
/**
 * Class: Jx.Field.File
 *
 * Extends: <Jx.Field>
 *
 * This class is designed to work with an iFrame and APC upload progress.
 * APC is a php specific technology but any server side implementation that
 * works in the same manner should work. You can then wire this class to the
 * progress bar class to show progress.
 *
 * The other option is to not use progress tracking and just use the base
 * upload which works through a hidden iFrame. In order to use this with Jx.Form
 * you'll need to add it normally but keep a reference to it. When you call
 * Jx.Form.getValues() it will not return any file information. You can then
 * call the Jx.Field.File.upload() method for each file input directly and
 * then submit the rest of the form via ajax.
 *
 * License:
 * Copyright (c) 2009, Jon Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Field.File = new Class({

    Extends: Jx.Field,

    options: {
        /**
         * Option: template
         * The template used to render the field
         */
        template: '<span class="jxInputContainer"><label class="jxInputLabel"></label><div class="jxFileInputs"><input class="jxInputFile" type="file" name="{name}" /></div><span class="jxInputTag"></span></span>',
        /**
         * Option: autoUpload
         * Whether to upload the file immediatelly upon selection
         */
        autoUpload: false,
        /**
         * Option: Progress
         * Whether to use the APC, or similar, progress method.
         */
        progress: false,
        /**
         * Option: progressIDUrl
         * The url to call in order to get the ID, or key, to use
         * with the APC upload process
         */
        progressIDUrl: '',
        /**
         * Option: progressName
         * The name to give the field that holds the generated progress ID retrieved
         * from the server. Defaults to 'APC_UPLOAD_PROGRESS' which is the default
         * for APC.
         */
        progressName: 'APC_UPLOAD_PROGRESS',
        /**
         * Option: progressId
         * The id to give the form element that holds the generated progress ID
         * retrieved from the server. Defaults to 'progress_key'.
         */
        progressId: 'progress_key',
        /**
         * Option: handlerUrl
         * The url to send the file to.
         */
        handlerUrl: '',
        /**
         * Option: progressUrl
         * The url used to retrieve the upload prgress of the file.
         */
        progressUrl: '',
        /**
         * Option: debug
         * Defaults to false. If set to true it will prevent the hidden form
         * and IFrame from being destroyed at the end of the upload so it can be
         * inspected during development
         */
        debug: false,
        /**
         * Events
         */
        onUploadBegin: $empty,
        onUploadComplete: $empty,
        onUploadProgress: $empty,
        onUploadError: $empty,
        onFileSelected: $empty

    },
    /**
     * Property: type
     * The Field type used in rendering
     */
    type: 'File',
    /**
     * APIMethod: render
     * renders the file input
     */
    render: function () {
        this.parent();

        //add a unique ID if no id is defined
        if (!$defined(this.options.id)) {
            this.field.set('id', this.generateId());
        }

        //now, create the fake inputs

        this.fake = new Element('div', {
            'class' : 'jxFileFake'
        });
        this.text = new Jx.Field.Text({
            template : '<span class="jxInputContainer"><input class="jxInputText" type="text" /></span>'
        });
        this.browseButton = new Jx.Button({
            label : 'Browse...'
        });


        this.fake.adopt(this.text, this.browseButton);
        this.field.grab(this.fake, 'after');

        this.field.addEvents({
            change : this.copyValue.bind(this),
            mouseout : this.copyValue.bind(this),
            mouseenter : this.mouseEnter.bind(this),
            mouseleave : this.mouseLeave.bind(this)
        });

    },
    /**
     * Method: copyValue
     * Called when the value in the actual file input changes and when
     * the mouse moves out of it to copy the value into the "fake" text box.
     */
    copyValue: function () {
        if (this.field.value !== '' && (this.text.field.value !== this.field.value)) {
            this.text.field.value = this.field.value;
            this.fireEvent('fileSelected', this);
        }
    },
    /**
     * Method: mouseEnter
     * Called when the mouse enters the actual file input to make the
     * fake button highlight.
     */
    mouseEnter: function () {
        this.browseButton.domA.addClass('jxButtonPressed');
    },
    /**
     * Method: mouseLeave
     * called when the mouse leaves the actual file input to turn off
     * the highlight of the fake button.
     */
    mouseLeave: function () {
        this.browseButton.domA.removeClass('jxButtonPressed');
    },
    /**
     * APIMethod: upload
     * Call this to upload the file to the server
     */
    upload: function () {
        this.fireEvent('uploadBegin', this);
        //create the iframe
        this.iframe = new IFrame(null, {
            styles: {
                display: 'none'
            },

            name : this.generateId()
        });
        this.iframe.inject(document.body);

        //load in the form
        this.form = new Jx.Form({
            action : this.options.handlerUrl,
            name : 'jxUploadForm',
            fileUpload: true
        });

        //iframeBody.grab(this.form);
        $(this.form).set('target', this.iframe.get('name')).setStyles({
            visibility: 'hidden',
            display: 'none'
        }).inject(document.body);


        //move the form input into it (cloneNode)
        $(this.form).grab(this.field.cloneNode(true));
        //if polling the server we need an APC_UPLOAD_PROGRESS id.
        //get it from the server.
        if (this.options.progress) {
            var req = new Request.JSON({
                url: this.options.progressIDUrl,
                method: 'get',
                onSuccess: this.submitUpload.bind(this)
            });
            req.send();
        } else {
            this.submitUpload();
        }
    },
    /**
     * Method: submitUpload
     * Called either after upload() or as a result of a successful call
     * to get a progress ID.
     *
     * Parameters:
     * data - Optional. The data returned from the call for a progress ID.
     */
    submitUpload: function (data) {
        //check for ID in data
        if ($defined(data) && data.success && $defined(data.id)) {
            this.progressID = data.id;
            //if have id, create hidden progress field
            var id = new Jx.Field.Hidden({
                name : this.options.progressName,
                id : this.options.progressId,
                value : this.progressID
            });
            id.addTo(this.form, 'top');
        }
        this.iframe.addEvent('load', this.processIFrameUpload.bind(this));


        //submit the form
        $(this.form).submit();
        //begin polling if needed
        if (this.options.progress && $defined(this.progressID)) {
            this.pollUpload();
        }
    },
    /**
     * Method: pollUpload
     * polls the server for upload progress information
     */
    pollUpload: function () {
        var d = { id : this.progressID };
        var r = new Request.JSON({
            data: d,
            url : this.options.progressUrl,
            method : 'get',
            onSuccess : this.processProgress.bind(this),
            onFailure : this.uploadFailure.bind(this)
        });
        r.send();
    },

    /**
     * Method: processProgress
     * process the data returned from the request
     *
     * Parameters:
     * data - The data from the request as an object.
     */
    processProgress: function (data) {
        if ($defined(data)) {
            this.fireEvent('uploadProgress', [data, this]);
            if (data.current < data.total) {
                this.polling = true;
                this.pollUpload();
            } else {
                this.polling = false;
                if (this.done) {
                    this.uploadCleanUp();
                    this.fireEvent('uploadComplete', [this.doneData, this]);
                }
            }
        }
    },
    /**
     * Method: uploadFailure
     * called if there is a problem getting progress on the upload
     */
    uploadFailure: function (xhr) {
        this.fireEvent('uploadProgressError', this);
    },
    /**
     * Method: processIFrameUpload
     * Called if we are not using progress and the IFrame finished loading the
     * server response.
     */
    processIFrameUpload: function () {
        //the body text should be a JSON structure
        //get the body
        var iframeBody = this.iframe.contentDocument.defaultView.document.body.innerHTML;

        var data = JSON.decode(iframeBody);
        if ($defined(data.success) && data.success) {
            this.done = true;
            this.doneData = data;
            if (!this.polling) {
                this.uploadCleanUp();
                this.fireEvent('uploadComplete', [data, this]);
            }
        } else {
            this.fireEvent('uploadError', [data , this]);
        }
    },
    /**
     * Method: uploadCleanUp
     * Cleans up the hidden form and IFrame after a completed upload. Set
     * this.options.debug to true to keep this from happening
     */
    uploadCleanUp: function () {
        if (!this.options.debug) {
            this.form.destroy();
            this.iframe.destroy();
        }
    },
    /**
     * APIMethod: getFileName
     * Allows caller to get the filename of the file we're uploading
     */
    getFileName: function () {
        var fn = this.field.get('value');
        return fn.slice(fn.lastIndexOf('/') + 1);
    },
    /**
     * Method: getExt
     * Returns the 3-letter extension of this file.
     */
    getExt: function () {
        var fn = this.getFileName();
        return fn.slice(fn.length - 3);
    }
});
/**
 * Class: Jx.Progressbar
 *
 * 
 * Example:
 * The following just uses the defaults.
 * (code)
 * var progressBar = new Jx.Progressbar();
 * progressBar.addEvent('update',function(){alert('updated!');});
 * progressBar.addEvent('complete',function(){
 *      alert('completed!');
 *      this.destroy();
 * });
 * 
 * progressbar.addTo('container');
 * 
 * var total = 90;
 * for (i=0; i < total; i++) {
 *      progressbar.update(total, i);
 * }
 * (end)
 * 
 * Events:
 * onUpdate - Fired when the bar is updated
 * onComplete - fires when the progress bar completes it's fill
 * 
 */
Jx.Progressbar = new Class({
    Family: 'Jx.Progressbar',
    Extends: Jx.Widget,
    
    options: {
        onUpdate: $empty,
        onComplete: $empty,
        /**
         * Option: messageText
         * The text of a message displayed above the bar. Set to NULL to prevent any text from appearing
         */
        messageText: 'Loading...',
        /**
         * Option: progressText
         * The text displayed inside the bar. This defaults to "{progress} of {total}" 
         * where {progress} and {total} are substituted for passed in values.
         */
        progressText: '{progress} of {total}',
        /**
         * Option: bar
         * an object that gives options for the bar itself. Specifically, 
         * the width and height of the bar. You can set either to 'auto' to
         * have the bar calculate its own width.
         */
        bar: {
            width: 'auto',
            height: 20
        },
        /**
         * Option: parent
         * The element to put this progressbar into
         */
        parent: null,
        /**
         * Option: template
         * The template used to create the progressbar
         */
        template: '<div class="jxProgressBar-container"><div class="jxProgressBar-message"></div><div class="jxProgressBar"><div class="jxProgressBar-outline"></div><div class="jxProgressBar-fill"></div><div class="jxProgressBar-text"></div></div></div>'
    },
    /**
     * Property: classes
     * The classes used in the template
     */
    classes: new Hash({
        domObj: 'jxProgressBar-container',
        message: 'jxProgressBar-message', 
        container: 'jxProgressBar',
        outline: 'jxProgressBar-outline',
        fill: 'jxProgressBar-fill',
        text: 'jxProgressBar-text'
    }),
    /**
     * Property: bar
     * the bar that is filled
     */
    bar: null,
    /**
     * Property: text
     * the element that contains the text that's shown on the bar (if any).
     */
    text: null,
    
    /**
     * APIMethod: render
     * Creates a new progressbar.
     */
    render: function () {
        this.parent();
        
        if ($defined(this.options.parent)) {
            this.domObj.inject($(this.options.parent));
        }
        
        //determine width of progressbar
        if (this.options.bar.width === 'auto') {
            //get width of container
            this.options.bar.width = this.domObj.getStyle('width').toInt();
        }
        
        //determine height
        if (this.options.bar.height === 'auto') {
            this.options.bar.height = this.domObj.getStyle('height').toInt() - 4;
        }
        
        //Message
        if (this.message) {
            if ($defined(this.options.messageText)) {
                this.message.set('html', this.options.messsageText);
            } else {
                this.message.destroy();
            }
        }
        
        //bar container itself
        if (this.container) {
            this.container.setStyles({
                'position': 'relative',
                'width': this.options.bar.width,
                'height' : this.options.bar.height + 4
            });
        }
        
        //Outline
        if (this.outline) {
            this.outline.setStyles({
                'width': this.options.bar.width,
                'height' : this.options.bar.height
            });
        }
        
        //Fill
        if (this.fill) {
            this.fill.setStyles({
                'width': 0,
                'height' : this.options.bar.height
            });
        }
        
        //TODO: check for {progress} and {total} in progressText
        var obj = {};
        if (this.options.progressText.contains('{progress}')) {
            obj.progress = 0;
        }
        if (this.options.progressText.contains('{total}')) {
            obj.total = 0;
        }
        
        //Progress text
        if (this.text) {
            this.text.set('html', this.options.progressText.substitute(obj));
        }
        
    },
    /**
     * APIMethod: update
     * called to update the progress bar with new percentage.
     * 
     * Parameters: 
     * total - the total # to progress up to
     * progress - the current position in the progress (must be less than or
     *              equal to the total)
     */
    update: function (total, progress) {
        var newWidth = (progress * this.options.bar.width) / total;
        
        //update bar width
        //TODO: animate this
        this.text.get('tween', {property:'width', onComplete: function() {
            var obj = {};
            if (this.options.progressText.contains('{progress}')) {
                obj.progress = progress;
            }
            if (this.options.progressText.contains('{total}')) {
                obj.total = total;
            }
            var t = this.options.progressText.substitute(obj);
            this.text.set('text', t);
        }.bind(this)}).start(newWidth);
        
        this.fill.get('tween', {property: 'width', onComplete: (function () {
            
            if (total === progress) {
                this.complete = true;
                this.fireEvent('complete');
            } else {
                this.fireEvent('update');
            }
        }).bind(this)}).start(newWidth);
        
    }
    
});
/**
 * Class: Jx.Panel.FileUpload
 *
 * Extends: <Jx.Panel>
 *
 * This class extends Jx.Panel to provide a consistent interface for uploading
 * files in an application.
 *
 * License:
 * Copyright (c) 2009, Jon Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Panel.FileUpload = new Class({

    Extends: Jx.Panel,

    options: {
        /**
         * Option: file
         * An object containing the options for Jx.Field.File
         */
        file: {
            autoUpload: false,
            progress: false,
            progressIDUrl: '',
            handlerUrl: '',
            progressUrl: ''
        },
        /**
         * Option: onFileUploadComplete
         * An event handler that is called when a file has been uploaded
         */
        onFileComplete: $empty,
        /**
         * Option: onComplete
         * An event handler that is called when all files have been uploaded
         */
        onComplete: $empty,
        /**
         * Option: prompt
         * The prompt to display at the top of the panel - before the
         * file input
         */
        prompt: null,
        /**
         * Option: buttonText
         * The text to place on the upload button
         */
        buttonText: 'Upload Files',
        /**
         * Option: removeOnComplete
         * Determines whether a file is removed from the queue after uploading
         */
        removeOnComplete: false
    },
    /**
     * Property: domObjA
     * An HTML Element used to hold the interface while it is being
     * constructed.
     */
    domObjA: null,
    /**
     * Property: fileQueue
     * An array holding Jx.Field.File elements that are to be uploaded
     */
    fileQueue: [],
    /**
     * APIMethod: render
     * Sets up the upload panel.
     */
    render: function () {
        //first create panel content
        this.domObjA = new Element('div', {'class' : 'jxFileUploadPanel'});


        if ($defined(this.options.prompt)) {
            var desc;
            if (Jx.type(this.options.prompt === 'string')) {
                desc = new Element('p', {
                    html: this.options.prompt
                });
            } else {
                desc = this.options.prompt;
            }
            desc.inject(this.domObjA);
        }

        //add the file field
        this.fileOpt = this.options.file;
        this.fileOpt.template = '<div class="jxInputContainer jxFileInputs"><input class="jxInputFile" type="file" name={name} /></div>';

        this.currentFile = new Jx.Field.File(this.fileOpt);
        this.currentFile.addEvent('fileSelected', this.moveToQueue.bind(this));
        this.currentFile.addTo(this.domObjA);

        //now the 'queue' listing with delete button

        this.queueDiv = new Element('div', {
            'class': 'jxUploadQueue'
        });
        //make the queueDiv a list
        this.list = new Jx.List(this.queueDiv, {
            hover: true
        });
        this.queueDiv.inject(this.domObjA);
        this.uploadBtn = new Jx.Button({
            label : this.options.buttonText,
            onClick: this.upload.bind(this)
        });
        var tlb = new Jx.Toolbar({position: 'bottom'}).add(this.uploadBtn);
        this.uploadBtn.setEnabled(false);
        this.options.toolbars = [tlb];
        //then pass it on to the Panel constructor
        this.options.content = this.domObjA;
        this.parent(this.options);
    },
    /**
     * Method: moveToQueue
     * Called by Jx.Field.File's fileSelected event. Moves the selected file into the
     * upload queue.
     */
    moveToQueue: function (file) {
        var cf = this.currentFile;
        var name = cf.getFileName();

        this.fileQueue.push(this.currentFile);

        this.currentFile = new Jx.Field.File(this.fileOpt);
        this.currentFile.addEvent('fileSelected', this.moveToQueue.bind(this));
        $(this.currentFile).replaces($(cf));

        //add to queue div

        cf.queuedDiv = new Element('div', {id : name});
        var s = new Element('span', {
            html : name,
            'class' : 'jxUploadFileName'
        });
        var del = new Element('span', {
            'class' : 'jxUploadFileDelete',
            title : 'Remove from queue'
        });

        del.addEvent('click', this.removeFromQueue.bind(this, cf));
        cf.queuedDiv.adopt(s, del);
        this.list.add(cf.queuedDiv);
        //cf.queuedDiv.inject(this.queueDiv);
        if (!this.uploadBtn.isEnabled()) {
            this.uploadBtn.setEnabled(true);
        }

    },
    /**
     * Method: upload
     * Called when the user clicks the upload button. Runs the upload process.
     */
    upload: function () {
        var file = this.fileQueue.shift();
        file.addEvent('uploadComplete', this.fileUploadComplete.bind(this));
        file.addEvent('uploadError', this.fileUploadError.bind(this));

        if (this.options.file.progress) {
            file.addEvent('uploadProgress', this.fileUploadProgress.bind(this));
            //progressbar
            //setup options
            var options = {
                containerClass: 'progress-container',
                messageText: null,
                messageClass: 'progress-message',
                progressText: 'uploading ' + file.getFileName(),
                progressClass: 'progress-bar',
                bar: {
                    width: file.queuedDiv.getStyle('width').toInt(),
                    height: file.queuedDiv.getFirst().getStyle('height').toInt()
                }
            };
            var pb = new Jx.Progressbar(options);
            file.pb = pb;
            $(pb).replaces(file.queuedDiv);
        } else {
            file.queuedDiv.getLast().removeClass('jxUploadFileDelete').addClass('jxUploadFileProgress');
        }
        file.upload();
    },
    /**
     * Method: fileUploadComplete
     * Called when a single file is uploaded completely (called by
     * Jx.Field.File's uploadComplete event).
     *
     * Parameters:
     * data - the data returned from the event
     * file - the file we're tracking
     */
    fileUploadComplete: function (data, file) {
        if ($defined(data.success) && data.success ){
            this.removeUploadedFile(file);
        } else {
            this.fileUploadError(data, file);
        }
    },
    /**
     * Method: fileUploadError
     * Called when there is an error uploading a file.
     *
     * Parameters:
     * data - the data passed back from the server, if any.
     * file - the file we're tracking
     */
    fileUploadError: function (data, file) {
        var icon = file.queuedDiv.getLast();
        icon.erase('title');
        if (icon.hasClass('jxUploadFileProgress')) {
            icon.removeClass('jxUploadFileProgress').addClass('jxUploadFileError');
        } else {
            //queued div is hidden, show it
            file.queuedDiv.replaces(file.pb);
            icon.removeClass('jxUploadFileDelete').addClass('jxUploadFileError');
        }
        if ($defined(data.error) && $defined(data.error.message)) {
            var tt = new Jx.Tooltip(icon, data.error.message, {
                cssClass : 'jxUploadFileErrorTip'
            });
        }
    },
    /**
     * Method: removeUploadedFile
     * Removes the passed file from the upload queue upon it's completion.
     *
     * Parameters:
     * file - the file we're tracking
     */
    removeUploadedFile: function (file) {

        if (this.options.removeOnComplete) {
            if ($defined(file.pb)) {
                file.pb.destroy();
            }
            this.list.remove(file.queuedDiv);
            //file.queuedDiv.dispose();
            var name = file.getFileName();
            this.fileQueue.erase(name);
        } else {
            if ($defined(file.pb)) {
                file.queuedDiv.replaces(file.pb);
                file.pb.destroy();
            }
            var l = file.queuedDiv.getLast();
            if (l.hasClass('jxUploadFileDelete')) {
                l.removeClass('jxUploadFileDelete').addClass('jxUploadFileComplete');
            } else if (l.hasClass('jxUploadFileProgress')) {
                l.removeClass('jxUploadFileProgress').addClass('jxUploadFileComplete');
            }
        }

        this.fireEvent('fileComplete', file);
        if (this.fileQueue.length > 0) {
            this.upload();
        } else {
            this.fireEvent('complete');
        }
    },
    /**
     * Method: fileUploadProgress
     * Function to pass progress information to the progressbar instance
     * in the file. Only used if we're tracking progress.
     */
    fileUploadProgress: function (data, file) {
        file.pb.update(data.total, data.current);
    },
    /**
     * Method: removeFromQueue
     * Called when the delete icon is clicked for an individual file. It
     * removes the file from the queue, disposes of it, and does NOT upload
     * the file to the server.
     *
     * Pparameters:
     * file - the file we're getting rid of.
     */
    removeFromQueue: function (file) {
        var name = file.getFileName();
        //TODO: Should prompt the user to be sure - use Jx.Dialog.Confirm?
        this.list.remove(file.queuedDiv);
        //$(name).destroy();
        this.fileQueue = this.fileQueue.erase(file);
        if (this.fileQueue.length === 0) {
            this.uploadBtn.setEnabled(false);
        }
    }
});
// $Id: listitem.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.ListItem
 *
 * Extends: <Jx.Widget>
 *
 * Events:
 *
 * License:
 * Copyright (c) 2009, DM Solutions Group.
 *
 * This file is licensed under an MIT style license
 */
Jx.ListItem = new Class({
    Family: 'Jx.ListItem',
    Extends: Jx.Widget,

    options: {
        enabled: true,
        template: '<li class="jxListItemContainer jxListItem"></li>'
    },

    classes: new Hash({
        domObj: 'jxListItemContainer',
        domContent: 'jxListItem'
    }),

    /**
     * APIMethod: render
     */
    render: function () {
        this.parent();
        this.domContent.store('jxListItem', this);
        this.domObj.store('jxListTarget', this.domContent);
        this.loadContent(this.domContent);
    },

    enable: function(state) {

    }
});// $Id: listview.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.ListView
 *
 * Extends: <Jx.Widget>
 *
 * Events:
 *
 * License:
 * Copyright (c) 2009, DM Solutions Group.
 *
 * This file is licensed under an MIT style license
 */
Jx.ListView = new Class({
    Family: 'Jx.Widget',
    Extends: Jx.Widget,

    options: {
        template: '<ul class="jxListView jxList"></ul>',
        /**
         * Option: listOptions
         * control the behaviour of the list, see <Jx.List>
         */
        listOptions: {
            hover: true,
            press: true,
            select: true
        }
    },

    classes: new Hash({
        domObj: 'jxListView',
        listObj: 'jxList'
    }),

    /**
     * APIMethod: render
     */
    render: function () {
        this.parent();

        if (this.options.selection) {
            this.selection = this.options.selection;
        } else if (this.options.select) {
            this.selection = new Jx.Selection(this.options);
            this.ownsSelection = true;
        }

        this.list = new Jx.List(this.listObj, this.options.listOptions, this.selection);

    },

    cleanup: function() {
        if (this.ownsSelection) {
            this.selection.destroy();
        }
        this.list.destroy();
    },

    add: function(item, where) {
        this.list.add(item, where);
        return this;
    },

    remove: function(item) {
        this.list.remove(item);
        return this;
    },

    replace: function(item, withItem) {
        this.list.replace(item, withItem);
        return this;
    }
});// $Id: column.js 649 2009-11-30 22:19:48Z pagameba $
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

    parameters: ['options','grid'],

    /**
     * Constructor: Jx.Column
     * initializes the column object
     */
    init : function () {
        this.parent();
        if ($defined(this.options.grid) && this.options.grid instanceof Jx.Grid) {
            this.grid = this.options.grid;
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
        if (this.rule && parseInt(newWidth,10) >= 0) {
            this.width = parseInt(newWidth,10);
            this.rule.style.width = parseInt(newWidth,10) + "px";
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
     * rowHeader - flag to tell us if this calculation is for the row header
     */
    getWidth : function (recalculate, rowHeader) {
        rowHeader = $defined(rowHeader) ? rowHeader : false;
        var maxWidth;
        //check for null width or for "auto" setting and measure all contents in this column
        //in the entire model as well as the header (really only way to do it).
        if (!$defined(this.width) || recalculate) {
            if (this.options.width !== null
                    && this.options.width !== 'auto') {
                maxWidth = this.width = Jx.getNumber(this.options.width);
            } else {
                //calculate the width
                var model = this.grid.getModel();
                var oldPos = model.getPosition();
                maxWidth = 0;
                model.first();
                while (model.valid()) {
                    //check size by placing text into a TD and measuring it.
                    //TODO: this should add .jxGridRowHead/.jxGridColHead if
                    //      this is a header to get the correct measurement.
                    var text = model.get(this.options.modelField);
                    var klass = 'jxGridCell';
                    if (this.grid.row.useHeaders()
                            && this.options.modelField === this.grid.row
                            .getRowHeaderField()) {
                        klass = 'jxGridRowHead';
                    }
                    var s = this.measure(text, klass, rowHeader);
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
                if (!rowHeader) {
                    this.width = maxWidth;
                }
                model.moveTo(oldPos);
            }
        }
        if (!rowHeader) {
            return this.width;
        } else {
            return maxWidth;
        }
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
    measure : function (text, klass, rowHeader) {
        if ($defined(this.options.formatter)
                && text !== this.options.header) {
            text = this.options.formatter.format(text);
        }
        var d = new Element('span', {
            'class' : klass
        });
        var el = new Element('span', {
            'html' : text,
            'class': 'jxGridCellContent'
        }).inject(d);
        d.setStyle('height', this.grid.row.getHeight());
        d.setStyles({
            'visibility' : 'hidden',
            'width' : 'auto'
            //'font-family' : 'Arial'  removed because CSS may impose different font(s)
        });
        d.inject(document.body, 'bottom');
        var s = d.measure(function () {
            //if nogt rowHeader, get size of innner span
            if (!rowHeader) {
                return this.getFirst().getContentBoxSize();
            } else {
                return this.getMarginBoxSize();
            }
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

});// $Id: columns.js 660 2009-12-05 21:21:20Z jonlb@comcast.net $
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

    parameters: ['options','grid'],

    /**
     * APIMethod: init
     * Creates the class.
     */
    init : function () {
        this.parent();

        if ($defined(this.options.grid) && this.options.grid instanceof Jx.Grid) {
            this.grid = this.options.grid;
        }

        this.options.columns.each(function (col) {
            //check the column to see if it's a Jx.Grid.Column or an object
                if (col instanceof Jx.Column) {
                    this.columns.push(col);
                } else if (Jx.type(col) === "object") {
                    col.grid = this.grid;
                    this.columns.push(new Jx.Column(col));
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
            } //else {
                //figure out a height.
            //}
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
    getHeaders : function (list) {
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
                list.add(th);
                th.store('jxCellData', {
                   column: col,
                   colHeader: true,
                   index: idx
                });
            }
        }, this);
        return list;
    },
    /**
     * APIMethod: getColumnCells
     * Appends the cells from each column for a specific row
     *
     * Parameters:
     * list - the Jx.List instance to add the cells to.
     */
    getColumnCells : function (list) {
        var r = this.grid.row;
        var f = r.getRowHeaderField();
        var h = r.useHeaders();
        this.columns.each(function (col, idx) {
            if (h && col.options.modelField !== f && !col.isHidden()) {
                list.add(this.getColumnCell(col, idx));
            } else if (!h && !col.isHidden()) {
                list.add(this.getColumnCell(col, idx));
            }
        }, this);
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
        //add other styles for different attributes
        if (col.isEditable()) {
            td.addClass('jxColEditable');
        }
        if (col.isResizable()) {
            td.addClass('jxColResizable');
        }
        if (col.isSortable()) {
            td.addClass('jxColSortable');
        }

        td.store('jxCellData',{
            col: col,
            index: idx,
            row: this.grid.model.getPosition()
        });

        return td;
    },

    createRules: function(styleSheet, scope) {
        this.columns.each(function(col, idx) {
            var selector = scope+' .jxGridCol'+idx+', '+scope + " .jxGridCol" + idx + " .jxGridCellContent";
            col.rule = Jx.Styles.insertCssRule(selector, '', styleSheet);
            col.rule.style.width = col.getWidth() + "px";
        }, this);
    },

    updateRule: function(column) {
        var col = this.getByName(column);
        col.rule.style.width = col.getWidth(true) + "px";
    },
    
    /**
     * APIMethod: getColumnCount
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
// $Id: row.js 649 2009-11-30 22:19:48Z pagameba $
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
Jx.Row = new Class({

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

    parameters: ['options','grid'],

    /**
     * APIMethod: init
     * Creates the row model object.
     */
    init : function () {
        this.parent();

        if ($defined(this.options.grid) && this.options.grid instanceof Jx.Grid) {
            this.grid = this.options.grid;
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
        return col.getWidth(true, true);
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
     *
     * Parameters:
     * list - Jx.List instance to add the header to
     */
    getRowHeader : function (list) {
        var th = this.getRowHeaderCell();
        if (this.grid.model.getPosition() === 0) {
            var rowWidth = this.getRowHeaderWidth();
            th.setStyle("width", rowWidth);
        }
        th.store('jxCellData', {
            rowHeader: true,
            row: this.grid.model.getPosition()
        });
        list.add(th);
    },
    /**
     * APIMethod: getRowHeaderField
     * returns the name of the model field that is used for the header
     */
    getRowHeaderField : function () {
        return this.options.headerField;
    }
});
// $Id: plugin.js 649 2009-11-30 22:19:48Z pagameba $
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

    Family: "Jx.Plugin",

    Extends: Jx.Object,

    options: {},

    /**
     * APIMethod: attach
     * Empty method that must be overridden by subclasses. It is
     * called by the user of the plugin to setup the plugin for use.
     */
    attach: function(obj){
        obj.registerPlugin(this);
    },

    /**
     * APIMethod: detach
     * Empty method that must be overridden by subclasses. It is
     * called by the user of the plugin to remove the plugin.
     */
    detach: function(obj){
        obj.deregisterPlugin(this);
    }

});// $Id: plugin.grid.js 649 2009-11-30 22:19:48Z pagameba $
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
Jx.Plugin.Grid = {};// $Id: grid.js 672 2009-12-24 04:37:27Z jonlb@comcast.net $
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
 * Events:
 * gridCellEnter(cell, list) - called when the mouse enters a cell
 * gridCellLeave(cell, list) - called when the mouse leaves a cell
 * gridCellSelect(cell) - called when a cell is clicked
 * gridMouseLeave() - called when the mouse leaves the grid at any point.
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
        model : null,

        deferRender: true

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
     * Property: styleSheet
     * the name of the dynamic style sheet to use for manipulating styles
     */
    styleSheet: 'JxGridStyles',
    /**
     * Property: pluginNamespace
     * the required variable for plugins
     */
    pluginNamespace: 'Grid',
    /**
     * Property: selection
     * holds the Jx.Selection instance used by the cell lists
     */
    selection: null,
    /**
     * Property: lists
     * An array of Jx.List instances, one per row. All of them use the same
     * Jx.Selection instance
     */
    lists: [],

    /**
     * Constructor: Jx.Grid
     */
    init : function () {
        this.uniqueId = this.generateId('jxGrid_');
        
        this.bound = {
                columnChanged: this.modelChanged.bind(this),
                render: this.render.bind(this),
                addRow: this.addRow.bind(this),
                removeRow: this.removeRow.bind(this),
                multipleRemove: this.removeRows.bind(this)
        };
        
        var opts;
        if ($defined(this.options.model)
                && this.options.model instanceof Jx.Store) {
            this.model = this.options.model;
            this.model.addEvent('storeColumnChanged', this.bound.columnChanged);
            this.model.addEvent('storeSortFinished', this.bound.render);
            this.model.addEvent('storeRecordAdded', this.bound.addRow);
            this.model.addEvent('storeRecordRemoved', this.bound.removeRow);
            this.model.addEvent('storeMultipleRecordsRemoved', this.bound.multipleRemove);
            this.model.addEvent('storeDataLoaded', this.bound.render);
        }

        if ($defined(this.options.columns)) {
            if (this.options.columns instanceof Jx.Columns) {
                this.columns = this.options.columns;
            } else if (Jx.type(this.options.columns) === 'object') {
                opts = this.options.columns;
                opts.grid = this;
                this.columns = new Jx.Columns(opts);
            }
        }

        //check for row
        if ($defined(this.options.row)) {
            if (this.options.row instanceof Jx.Row) {
                this.row = this.options.row;
            } else if (Jx.type(this.options.row) === "object") {
                opts = this.options.row;
                opts.grid = this;
                this.row = new Jx.Row(opts);
            }
        } else {
            this.row = new Jx.Row({grid: this});
        }



        //initialize the grid
        this.domObj = new Element('div', {'class':this.uniqueId});
        var l = new Jx.Layout(this.domObj, {
            onSizeChange : this.resize.bind(this)
        });
        
        //we need to know if the mouse leaves the grid so we can turn off prelighters and the such
        this.domObj.addEvent('mouseleave',function(){
            this.fireEvent('gridMouseLeave');
        }.bind(this));

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

        var target = this;

        this.domObj.appendChild(this.rowColObj);
        this.domObj.appendChild(this.rowObj);
        this.domObj.appendChild(this.colObj);
        this.domObj.appendChild(this.gridObj);

        this.gridObj.addEvent('scroll', this.onScroll.bind(this));

        //bind events
        this.bound = {
            select: this.onSelect.bind(this),
            unselect: this.onUnselect.bind(this),
            mouseenter: this.onMouseEnter.bind(this),
            mouseleave: this.onMouseLeave.bind(this)
        };

        //setup the selection
        this.selection = new Jx.Selection();
        this.selection.addEvents({
            select: this.bound.select,
            unselect: this.bound.unselect
        });
        this.parent();

        this.domObj.store('grid', this);
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

        if (this.model && this.model.loaded) {
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

                var headerList = this.makeList(trBody);

                this.columns.getHeaders(headerList);

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

                var rowHeight = this.row.getHeight();



                //loop through all rows and add header
                this.model.first();
                while (this.model.valid()) {
                    var tr = new Element('tr', {
                        styles : {
                            height : rowHeight
                        }
                    });
                    var rowHeaderList = this.makeList(tr);
                    this.row.getRowHeader(rowHeaderList);
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
                tr.store('jxRowData', {row: this.model.getPosition()});


                var rl = this.makeList(tr);
                this.gridTableBody.appendChild(tr);
                //this.rowList.add(rl.container);

                //Actually add the columns
                this.columns.getColumnCells(rl);

                if (this.model.hasNext()) {
                    this.model.next();
                } else {
                    break;
                }

            }

            Jx.Styles.enableStyleSheet(this.styleSheet);
            this.columns.createRules(this.styleSheet, "."+this.uniqueId);
            this.domObj.resize();
            this.fireEvent('doneCreateGrid', this);
        } else {
            this.model.load();
        }
        
    },

    /**
     * Method: modelChanged
     * Event listener that is fired when the model changes in some way
     */
    modelChanged : function (row, col) {
        //grab new TD
        var column = this.columns.getIndexFromGrid(col);
        var td = document.id(this.gridObj.childNodes[0].childNodes[0].childNodes[row].childNodes[column]);

        var currentRow = this.model.getPosition();
        this.model.moveTo(row);

        var newTD = this.columns.getColumnCell(this.columns.getByName(col));
        //get parent list
        var list = td.getParent().retrieve('jxList');
        list.replace(td, newTD);
        this.columns.updateRule(col);
        //newTD.replaces(td);

        this.model.moveTo(currentRow);
    },
    
    /**
     * APIMethod: addRow
     * Adds a row to the table. Can add to either the beginning or the end 
     * based on passed flag
     */
    addRow: function (store, record, position) {
        if (this.model.loaded) {
            if (position === 'bottom') {
                this.model.last();
            } else {
                this.model.first();
                this.renumberGrid(0, 1);
            }
            
            //row header
            if (this.row.useHeaders()) {
                var rowHeight = this.row.getHeight();
                var tr = new Element('tr', {
                    styles : {
                        height : rowHeight
                    }
                });
                var rowHeaderList = this.makeList(tr);
                this.row.getRowHeader(rowHeaderList);
                if (position === 'top') {
                    tr.inject(this.rowTableHead, position);
                } else {
                    var lastTr = this.rowTableHead.children[this.rowTableHead.children.length - 1];
                    tr.inject(lastTr, 'before');
                }
                //this.rowTableHead.appendChild(tr);
            }
            tr = this.row.getGridRowElement();
            tr.store('jxRowData', {row: this.model.getPosition()});
            var rl = this.makeList(tr);
            this.columns.getColumnCells(rl);
            tr.inject(this.gridTableBody, position);
            //this.gridTableBody.appendChild(tr);
        }
    },
    
    renumberGrid: function (offset, increment) {
        var l = this.gridTable.rows.length;
        for (var i = offset; i < l; i++) {
            var r = document.id(this.gridTable.rows[i]);
            var d = r.retrieve('jxRowData');
            d.row += increment;
            r.store('jxRowData', d);
            $A(r.children).each(function(cell){
                var d = cell.retrieve('jxCellData');
                d.row += increment;
                cell.store('jxCellData', d);
            },this);
        }
    },
    
    removeRow: function (store, index) {
        this.gridTable.deleteRow(index);
        this.rowTable.deleteRow(index);
        this.renumberGrid(index, -1);
    },
    
    removeRows: function (store, first, last) {
      for (var i = first; i <= last; i++) {
          this.removeRow(first);
      }
    },
    
    /**
     * Method: makeList
     * utility method used to make row lists
     *
     * Parameters:
     * container - the row to use as the Jx.List container
     */
    makeList: function (container) {
        var l = new Jx.List(container, {
            hover: true,
            select: true
        }, this.selection);
        var target = this;
        l.addEvents({
            mouseenter: this.bound.mouseenter,
            mouseleave: this.bound.mouseleave
        });
        this.lists.push(l);
        return l;
    },

    onSelect: function (cell, select) {
        this.fireEvent('gridCellSelect', [cell,select,this]);
    },

    onUnselect: function (cell, select) {
        this.fireEvent('gridCellUnselect', [cell,select,this]);
    },

    onMouseEnter: function (cell, list) {
        this.fireEvent('gridCellEnter', [cell,list,this]);
    },

    onMouseLeave: function (cell, list) {
        this.fireEvent('gridCellLeave', [cell,list,this]);
    }

});
// $Id: grid.selector.js 662 2009-12-08 06:56:43Z jonlb@comcast.net $
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
     * APIMethod: init
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    init: function() {
        this.parent();
        this.bound.select = this.select.bind(this);
    },
    /**
     * APIMethod: attach
     * Sets up the plugin and attaches the plugin to the grid events it
     * will be monitoring
     *
     * Parameters:
     * grid - The instance of Jx.Grid to attach to
     */
    attach: function (grid) {
        if (!$defined(grid) && !(grid instanceof Jx.Grid)) {
            return;
        }
        this.grid = grid;
        this.grid.addEvent('gridCellSelect', this.bound.select);
        if (this.options.cell) {
            this.oldSelectionClass = this.grid.selection.options.selectedClass;
            this.grid.selection.options.selectClass = "jxGridCellSelected";
        }
    },
    /**
     * APIMethod: detach
     */
    detach: function() {
        if (this.grid) {
            this.grid.removeEvent('gridCellSelect', this.bound.select);
            if (this.options.cell) {
                this.grid.selection.options.selectedClass = this.oldSelectionClass;
            }
        }
        this.grid = null;
    },
    /**
     * APIMethod: activate
     * Allows programatic access to turning selections on.
     * 
     * Parameters:
     * opt - the option to turn on. One of 'cell', 'column', or 'row'
     */
    activate: function (opt) {
        this.options[opt] = true;
        if (opt === 'cell') {
            this.oldSelectionClass = this.grid.selection.options.selectedClass;
            this.grid.selection.options.selectClass = "jxGridCellSelected";
        }
    },
    /**
     * APIMethod: deactivate
     * Allows programatic access to turning selections off.
     * 
     * Parameters:
     * opt - the option to turn off. One of 'cell', 'column', or 'row'
     */
    deactivate: function (opt) {
        this.options[opt] = false;
        if (opt === 'cell') {
            this.grid.selection.selected().each(function(cell){
                this.grid.selection.unselect(cell);
            },this);
            this.grid.selection.options.selectClass = this.oldSelectionClass;
            
        } else if (opt === 'row') {
            this.selectedRow.removeClass('jxGridRowSelected');
            this.selectedRow = null;
            this.selectedRowHead.removeClass('jxGridRowHeaderSelected');
            this.selectedRowHead = null;
        } else {
            if ($defined(this.selectedCol)) {
                for (var i = 0; i < this.grid.gridTable.rows.length; i++) {
                    this.grid.gridTable.rows[i].cells[this.selectedCol].removeClass('jxGridColumnSelected');
                }
            }
            this.selectedColHead.removeClass('jxGridColumnHeaderSelected');
            this.selectedColHead = null;
            this.selectedCol = null;
        }
    },
    /**
     * Method: select
     * dispatches the grid click to the various selection methods
     */
    select : function (cell) {

        console.log('select method');
        var data = cell.retrieve('jxCellData');
        console.log(data);

        if (this.options.row) {
            this.selectRow(data.row);
        }

        if (this.options.column) {
            if (this.grid.row.useHeaders()) {
                this.selectColumn(data.index - 1);
            } else {
                this.selectColumn(data.index);
            }
        }

    },
    /**
     * Method: selectRow
     * Select a row and apply the jxGridRowSelected style to it.
     *
     * Parameters:
     * row - {Integer} the row to select
     */
    selectRow: function (row) {
        if (!this.options.row) { return; }

        var tr = (row >= 0 && row < this.grid.gridTableBody.rows.length) ? this.grid.gridTableBody.rows[row] : null;

        if (tr.hasClass('jxGridRowSelected')) {
            this.selectedRow.removeClass('jxGridRowSelected');
            this.selectedRow = null;
        } else {
            if (this.selectedRow) {
                this.selectedRow.removeClass('jxGridRowSelected');
            }
            this.selectedRow = $(tr);
            this.selectedRow.addClass('jxGridRowSelected');
        }
        this.selectRowHeader(row);

    },
    /**
     * Method: selectRowHeader
     * Apply the jxGridRowHea}derSelected style to the row header cell of a
     * selected row.
     *
     * Parameters:
     * row - {Integer} the row header to select
     */
    selectRowHeader: function (row) {
        if (!this.grid.row.useHeaders()) {
            return;
        }
        var cell = (row >= 0 && row < this.grid.rowTableHead.rows.length) ? this.grid.rowTableHead.rows[row].cells[0] : null;

        if (!cell) {
            return;
        }
        if (this.selectedRowHead) {
            this.selectedRowHead.removeClass('jxGridRowHeaderSelected');
        }
        if (this.selectedRowHead !== cell) {
            this.selectedRowHead = $(cell);
            cell.addClass('jxGridRowHeaderSelected');
        } else if (cell.hasClass('jxgridRowHeaderSelected')) {
            this.selectedRowHead = null;
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
    selectColumn: function (col) {
        if (col >= 0 && col < this.grid.gridTable.rows[0].cells.length) {
            if ($defined(this.selectedCol)) {
                for (var i = 0; i < this.grid.gridTable.rows.length; i++) {
                    this.grid.gridTable.rows[i].cells[this.selectedCol].removeClass('jxGridColumnSelected');
                }
            }
            if (col !== this.selectedCol) {
                this.selectedCol = col;
                for (i = 0; i < this.grid.gridTable.rows.length; i++) {
                    this.grid.gridTable.rows[i].cells[col].addClass('jxGridColumnSelected');
                }
            } else {
                this.selectedCol = null;
            }
            this.selectColumnHeader(col);
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
    selectColumnHeader: function (col) {
        if (this.grid.colTableBody.rows.length === 0
                || !this.grid.row.useHeaders()) {
            return;
        }


        var cell = (col >= 0 && col < this.grid.colTableBody.rows[0].cells.length) ? this.grid.colTableBody.rows[0].cells[col]
                                                                                                                          : null;
        if (cell === null) {
            return;
        }

        if (this.selectedColHead) {
            this.selectedColHead.removeClass('jxGridColumnHeaderSelected');
        }
        if (this.selectedColHead !== cell) {
            this.selectedColHead = $(cell);
            cell.addClass('jxGridColumnHeaderSelected');
        } else {
            this.selectedColHead = null;
        }

    }
});
// $Id: grid.prelighter.js 662 2009-12-08 06:56:43Z jonlb@comcast.net $
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
     * APIMethod: init
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    init: function() {
        this.parent();
        this.bound.lighton = this.lighton.bind(this);
        this.bound.lightoff = this.lightoff.bind(this);
        this.bound.mouseleave = this.mouseleave.bind(this);
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
        this.grid.addEvent('gridCellEnter', this.bound.lighton);
        this.grid.addEvent('gridCellLeave', this.bound.lightoff);
        this.grid.addEvent('gridMouseLeave', this.bound.mouseleave);
    },
    /**
     * APIMethod: detach
     */
    detach: function() {
        if (this.grid) {
            this.grid.removeEvent('gridCellEnter', this.bound.lighton);
            this.grid.removeEvent('gridCellLeave', this.bound.lightoff);
            this.grid.removeEvent('gridMouseLeave', this.bound.mouseleave);
        }
        this.grid = null;
    },
    /**
     * APIMethod: activate
     * Allows programatic access to turning prelighting on.
     * 
     * Parameters:
     * opt - the option to turn on. One of 'cell', 'row', 'rowHeader', 'column', or 'columnHeader'
     */
    activate: function (opt) {
        this.options[opt] = true;
    },
    /**
     * APIMethod: deactivate
     * Allows programatic access to turning prelighting off.
     * 
     * Parameters:
     * opt - the option to turn off. One of 'cell', 'row', 'rowHeader', 'column', or 'columnHeader'
     */
    deactivate: function (opt) {
        this.options[opt] = false;
    },
    /**
     * Method: lighton
     */
    lighton : function (cell, list, grid) {
        this.light(cell, list, grid, true);

    },
    /**
     * Method: lightoff
     */
    lightoff : function (cell, list, grid) {
        this.light(cell, list, grid, false);

    },
    /**
     * Method: light
     * dispatches the event to the various prelight methods.
     */
    light: function (cell, list, grid, on) {
        var data = cell.retrieve('jxCellData');

        if (this.options.cell) {
            this.prelightCell(cell, on);
        }
        if (this.options.row) {
            this.prelightRow(data.row, on);
        }
        if (this.options.column) {
            if (this.grid.row.useHeaders()) {
                this.prelightColumn(data.index - 1, on);
            } else {
                this.prelightColumn(data.index, on);
            }
        }
        if (this.options.rowHeader) {
            this.prelightRowHeader(data.row, on);
        }
        if (this.options.columnHeader) {
            this.prelightColumnHeader(data.index - 1, on);
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
    prelightRowHeader : function (row, on) {
        if ($defined(this.prelitRowHeader) && !on) {
            this.prelitRowHeader.removeClass('jxGridRowHeaderPrelight');
        } else if (on) {
            this.prelitRowHeader = (row >= 0 && row < this.grid.rowTableHead.rows.length) ? this.grid.rowTableHead.rows[row].cells[0] : null;
            if (this.prelitRowHeader) {
                this.prelitRowHeader.addClass('jxGridRowHeaderPrelight');
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
     * on - flag to tell if we're lighting on or off
     */
    prelightColumnHeader : function (col, on) {
        if (this.grid.colTableBody.rows.length === 0) {
            return;
        }

        if ($defined(this.prelitColumnHeader) && !on) {
            this.prelitColumnHeader.removeClass('jxGridColumnHeaderPrelight');
        } else if (on) {
            this.prelitColumnHeader = (col >= 0 && col < this.grid.colTableBody.rows[0].cells.length) ? this.grid.colTableBody.rows[0].cells[col] : null;
            if (this.prelitColumnHeader) {
                this.prelitColumnHeader.addClass('jxGridColumnHeaderPrelight');
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
     * on - flag to tell if we're lighting on or off
     */
    prelightRow : function (row, on) {
       if ($defined(this.prelitRow) && !on) {
            this.prelitRow.removeClass('jxGridRowPrelight');
        } else if (on) {
            this.prelitRow = (row >= 0 && row < this.grid.gridTableBody.rows.length) ? this.grid.gridTableBody.rows[row] : null;
            if (this.prelitRow) {
                this.prelitRow.addClass('jxGridRowPrelight');
            }
        }
        this.prelightRowHeader(row, on);
    },
    /**
     * Method: prelightColumn
     * apply the jxGridColumnPrelight style to a column.
     * This removes the style from the previously pre-lit column.
     *
     * Parameters:
     * col - {Integer} the column to pre-light
     * on - flag to tell if we're lighting on or off
     */
    prelightColumn : function (col, on) {
        if (col >= 0 && col < this.grid.gridTable.rows[0].cells.length) {
            if ($defined(this.prelitColumn) && !on) {
                for (var i = 0; i < this.grid.gridTable.rows.length; i++) {
                    this.grid.gridTable.rows[i].cells[this.prelitColumn].removeClass('jxGridColumnPrelight');
                }
            } else if (on) {
                this.prelitColumn = col;
                for (i = 0; i < this.grid.gridTable.rows.length; i++) {
                    this.grid.gridTable.rows[i].cells[col].addClass('jxGridColumnPrelight');
                }
            }
            this.prelightColumnHeader(col, on);
        }
    },
    /**
     * Method: prelightCell
     * apply the jxGridCellPrelight style to a cell.
     * This removes the style from the previously pre-lit cell.
     *
     * Parameters:
     * cell - the cell to lighton/off
     * on - flag to tell if we're lighting on or off
     */
    prelightCell : function (cell, on) {
        if ($defined(this.prelitCell) && !on) {
            this.prelitCell.removeClass('jxGridCellPrelight');
        } else if (on) {
            this.prelitCell = cell;
            if (this.prelitCell) {
                this.prelitCell.addClass('jxGridCellPrelight');
            }
        }
    },
    
    mouseleave: function() {
        //turn off all prelights when the mouse leaves the grid
        if ($defined(this.prelitCell)) {
            this.prelitCell.removeClass('jxGridCellPrelight');
        }
        if ($defined(this.prelitColumn)) {
            for (var i = 0; i < this.grid.gridTable.rows.length; i++) {
                this.grid.gridTable.rows[i].cells[this.prelitColumn].removeClass('jxGridColumnPrelight');
            }
        }
        if ($defined(this.prelitRow)) {
            this.prelitRow.removeClass('jxGridRowPrelight');
        }
        if ($defined(this.prelitColumnHeader)) {
            this.prelitColumnHeader.removeClass('jxGridColumnHeaderPrelight');
        }
        if ($defined(this.prelitRowHeader)) {
            this.prelitRowHeader.removeClass('jxGridRowHeaderPrelight');
        }
    }
});
// $Id: grid.sorter.js 649 2009-11-30 22:19:48Z pagameba $
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
     * APIMethod: init
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    init: function() {
        this.parent();
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

        this.grid.addEvent('gridCellSelect', this.bound.sort);
        this.boundAddHeader = this.addHeaderClass.bind(this);
    },
    /**
     * APIMethod: detach
     */
    detach: function() {
        if (this.grid) {
            this.grid.removeEvent('gridCellSelect', this.bound.sort);
        }
        this.grid = null;
    },
    /**
     * Method: sort
     * called when a grid header is clicked.
     *
     * Parameters:
     * cell - The cell clicked
     */
    sort : function (cell) {
        var data = cell.retrieve('jxCellData');
        if (data.colHeader) {
            var column = data.column;
            if (column.isSortable()) {
                if (column === this.current) {
                    //reverse sort order
                    this.direction = (this.direction === 'asc') ? 'desc' : 'asc';
                } else {
                    this.current = column;
                    this.direction = 'asc';
                    this.currentGridIndex = data.index - 1;
                }

                //The grid should be listening for the sortFinished event and will re-render the grid
                //we will listen for the grid's doneCreateGrid event to add the header
                this.grid.addEvent('doneCreateGrid', this.bound.addHeaderClass);
                //sort the store
                var strategy = this.grid.getModel().getStrategy('sort');
                strategy.sort(this.current.name, null, this.direction);
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
// $Id: grid.resize.js 649 2009-11-30 22:19:48Z pagameba $
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
     * APIMethod: init
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    init: function() {
        this.parent();
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

        // if (this.options.rows && this.grid.row.useHeaders()) {
        //
        // }
    }
});
/**
 * Namespace: Jx.Plugin.DataView
 * The namespace for all dataview plugins
 */
Jx.Plugin.DataView = {};
/**
 * Class: Jx.Slide
 * Hides and shows an element without depending on a fixed width or height
 *
 * Copyright 2009 by Jonathan Bomgardner
 * License: MIT-style
 */
Jx.Slide = new Class({
    Family: 'Jx.Slide',
    Implements: Jx.Object,

    options: {
        /**
         * Option: target
         * The element to slide
         */
        target: null,
        /**
         * Option: trigger
         * The element that will have a click event added to start the slide
         */
        trigger: null,
        /**
         * Option: type
         * The type of slide. Can be either "width" or "height". defaults to "height"
         */
        type: 'height',
        /**
         * Option: setOpenTo
         * Allows the caller to determine what the open target is set to. Defaults to 'auto'.
         */
        setOpenTo: 'auto',
        /**
         * Option: onSlideOut
         * function called when the target is revealed.
         */
        onSlideOut: $empty,
        /**
         * Option: onSlideIn
         * function called when a panel is hidden.
         */
        onSlideIn: $empty
    },
    /**
     * APIMethod: init
     * sets up the slide
     */
    init: function () {

        this.target = $(this.options.target);

        this.target.set('tween', {onComplete: this.setDisplay.bind(this)});

        if ($defined(this.options.trigger)) {
            this.trigger = $(this.options.trigger);
            this.trigger.addEvent('click', this.handleClick.bindWithEvent(this));
        }

        this.target.store('slider', this);

    },
    /**
     * APIMethod: handleClick
     * event handler for clicks on the trigger. Starts the slide process
     */
    handleClick: function () {
        var sizes = this.target.getMarginBoxSize();
        if (sizes.height === 0) {
            this.slide('in');
        } else {
            this.slide('out');
        }
    },
    /**
     * Method: setDisplay
     * called at the end of the animation to set the target's width or
     * height as well as other css values to the appropriate values
     */
    setDisplay: function () {
        var h = this.target.getStyle(this.options.type).toInt();
        if (h === 0) {
            this.target.setStyle('display', 'none');
            this.fireEvent('slideOut', this.target);
        } else {
            //this.target.setStyle('overflow', 'auto');
            if (this.target.getStyle('position') !== 'absolute') {
                this.target.setStyle(this.options.type, this.options.setOpenTo);
            }
            this.fireEvent('slideIn', this.target);
        }
    },
    /**
     * APIMethod: slide
     * Actually determines how to slide and initiates the animation.
     *
     * Parameters:
     * dir - the direction to slide (either "in" or "out")
     */
    slide: function (dir) {
        var h;
        if (dir === 'in') {
            h = this.target.retrieve(this.options.type);
            this.target.setStyles({
                'overflow': 'hidden',
                'display': 'block'
            });
            this.target.setStyle(this.options.type, 0);
            this.target.tween(this.options.type, h);
        } else {
            if (this.options.type === 'height') {
                h = this.target.getMarginBoxSize().height;
            } else {
                h = this.target.getMarginBoxSize().width;
            }
            this.target.store(this.options.type, h);
            this.target.setStyle('overflow', 'hidden');
            this.target.setStyle(this.options.type, h);
            this.target.tween(this.options.type, 0);
        }
    }
});
/**
 * Class: Jx.Plugin.DataView.GroupFolder
 *
 * Extends: <Jx.Plugin>
 *
 * Plugin for DataView - allows folding/unfolding of the groups in the
 * grouped dataview
 *
 * License:
 * Copyright (c) 2009, Jonathan Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Plugin.DataView.GroupFolder = new Class({

    Extends: Jx.Plugin,

    options: {
        /**
         * Option: headerClass
         * The base for styling the header. Gets '-open' or '-closed' added
         * to it.
         */
        headerClass: null
    },
    /**
     * Property: headerState
     * Hash that holds the open/closed state of each header
     */
    headerState: new Hash(),
    /**
     * APIMethod: attach
     * Attaches this plugin to a dataview
     */
    attach: function (dataView) {
        if (!$defined(dataView) && !(dataview instanceof Jx.Panel.DataView)) {
            return;
        }

        this.dv = dataView;
        this.dv.addEvent('renderDone', this.setHeaders.bind(this));
    },
    /**
     * Method: setHeaders
     * Called after the dataview is rendered. Sets up the Jx.Slide instance
     * for each header. It also sets the initial state of each header so that
     * if the dataview is redrawn for some reason the open/closed state is
     * preserved.
     */
    setHeaders: function () {
        var headers = this.dv.domA.getElements('.' + this.dv.options.groupHeaderClass);

        headers.each(function (header) {
            var id = header.get('id');
            var s = new Jx.Slide({
                target: header.getNext(),
                trigger: id,
                onSlideOut: this.onSlideOut.bind(this, header),
                onSlideIn: this.onSlideIn.bind(this, header)
            });

            if (this.headerState.has(id)) {
                var state = this.headerState.get(id);
                if (state === 'open') {
                    s.slide('in');
                } else {
                    s.slide('out');
                }
            } else {
                s.slide('in');
            }
        }, this);
    },

    /**
     * Method: onSlideIn
     * Called when a group opens.
     *
     * Parameters:
     * header - the header that was clicked.
     */
    onSlideIn: function (header) {
        this.headerState.set(header.get('id'), 'open');
        if (header.hasClass(this.options.headerClass + '-closed')) {
            header.removeClass(this.options.headerClass + '-closed');
        }
        header.addClass(this.options.headerClass + '-open');
    },
    /**
     * Method: onSlideOut
     * Called when a group closes.
     *
     * Parameters:
     * header - the header that was clicked.
     */
    onSlideOut: function (header) {
        this.headerState.set(header.get('id'), 'closed');
        if (header.hasClass(this.options.headerClass + '-open')) {
            header.removeClass(this.options.headerClass + '-open');
        }
        header.addClass(this.options.headerClass + '-closed');
    }
});
// $Id: plugin.field.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Plugin.Field
 * Field plugin namespace
 *
 *
 * License:
 * Copyright (c) 2009, Jon Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Field = {};// $Id: field.validator.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Plugin.Field.Validator
 *
 * Extends: <Jx.Plugin>
 *
 * Field plugin for enforcing validation when a field is not used in a form.
 *
 *
 * License:
 * Copyright (c) 2009, Jonathan Bomgardner.
 * Parts inspired by mootools-more's Form.Validator class
 *
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Field.Validator = new Class({

    Extends : Jx.Plugin,
    name: 'Field.Validator',

    options: {
        /**
         * Option: validators
         * An array that contains either a string that names the predefined
         * validator to use with its needed options or an object that defines
         * the options of an InputValidator (also with needed options) defined
         * like so:
         *
         * (code)
         * {
         *     validatorClass: 'name:with options',    //gets applied to the field
         *     validator: {                         //used to create the InputValidator
         *         name: 'validatorName',
         *         options: {
         *             errorMsg: 'error message',
         *             test: function(field,props){}
         *         }
         *     }
         * }
         * (end)
         */
        validators: [],
        /**
         * Option: validateOnBlur
         * Determines whether the plugin will validate the field on blur.
         * Defaults to true.
         */
        validateOnBlur: true,
        /**
         * Option: validateOnChange
         * Determines whether the plugin will validate the field on change.
         * Defaults to true.
         */
        validateOnChange: true
    },
    /**
     * Property: valid
     * tells whether this field passed validation or not.
     */
    valid: null,
    /**
     * Property: errors
     * array of errors found on this field
     */
    errors: [],
    /**
     * Property: bound
     * storage for bound methods useful for working with events
     */
    bound: {},
    /**
     * APIMethod: init
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    init: function () {
        this.parent();
        this.bound.validate = this.validate.bind(this);
        this.bound.reset = this.reset.bind(this);
    },
    /**
     * APIMethod: attach
     * Sets up the plugin and connects it to the field
     */
    attach: function (field) {
        if (!$defined(field) && !(field instanceof Jx.Field)) {
            return;
        }
        this.field = field;
        if (this.field.options.required && !this.options.validators.contains('required')) {
            //would have used unshift() but reading tells me it may not work in IE.
            this.options.validators.reverse().push('required');
            this.options.validators.reverse();
        }
        //add validation classes
        this.options.validators.each(function (v) {
            var t = Jx.type(v);
            if (t === 'string') {
                this.field.field.addClass(v);
            } else if (t === 'object') {
                this.validators.add(v.validator.name, new InputValidator(v.validator.name, v.validator.options));
                this.field.field.addClass(v.validatorClass);
            }
        }, this);
        if (this.options.validateOnBlur) {
            this.field.field.addEvent('blur', this.bound.validate);
        }
        if (this.options.validateOnChange) {
            this.field.field.addEvent('change', this.bound.validate);
        }
        this.field.addEvent('reset', this.bound.reset);
    },
    /**
     * APIMethod: detach
     */
    detach: function () {
        if (this.field) {
            this.field.field.removeEvent('blur', this.bound.validate);
            this.field.field.removeEvent('change', this.bound.validate);
        }
        this.field.removeEvent('reset', this.bound.reset);
        this.field = null;
        this.validators = null;
    },

    validate: function () {
        $clear(this.timer);
        this.timer = this.validateField.delay(50, this);
    },

    validateField: function () {
        //loop through the validators
        this.valid = true;
        this.errors = [];
        this.options.validators.each(function (v) {
            var val = (Jx.type(v) === 'string') ? Form.Validator.getValidator(v) : this.validators.get(v.validator.name);
            if (val) {
                if (!val.test(this.field.field)) {
                    this.valid = false;
                    this.errors.push(val.getError(this.field.field));
                }
            }
        }, this);
        if (!this.valid) {
            this.field.domObj.removeClass('jxFieldSuccess').addClass('jxFieldError');
            this.fireEvent('fieldValidationFailed', [this.field, this]);
        } else {
            this.field.domObj.removeClass('jxFieldError').addClass('jxFieldSuccess');
            this.fireEvent('fieldValidationPassed', [this.field, this]);
        }
        return this.valid;
    },

    isValid: function () {
        return this.validateField();
    },

    reset: function () {
        this.valid = null;
        this.errors = [];
        this.field.field.removeClass('jxFieldError').removeClass('jxFieldSuccess');
    },
    /**
     * APIMethod: getErrors
     * USe this method to retrieve all of the errors noted for this field.
     */
    getErrors: function () {
        return this.errors;
    }


});
// $Id: plugin.form.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Plugin.Form
 * Form plugin namespace
 *
 *
 * License:
 * Copyright (c) 2009, Jon Bomgardner.
 *
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Form = {};// $Id: form.validator.js 668 2009-12-17 06:14:32Z jonlb@comcast.net $
/**
 * Class: Jx.Plugin.Form.Validator
 *
 * Extends: <Jx.Plugin>
 *
 * Form plugin for enforcing validation on the fields in a form.
 *
 * License:
 * Copyright (c) 2009, Jonathan Bomgardner.
 * Parts inspired by mootools-more's Form.Validator class
 *
 * This file is licensed under an MIT style license
 */
Jx.Plugin.Form.Validator = new Class({

    Extends : Jx.Plugin,
    name: 'Form.Validator',

    options: {
        /**
         * Option: fields
         * This will be key/value pairs for each of the fields as shown here:
         * {
         *     fieldID: {
         *          ... options for Field.Validator plugin ...
         *     },
         *     fieldID: {...
         *     }
         * }
         */
        fields: null,

        fieldDefaults: {
            validateOnBlur: true,
            validateOnChange: true
        },

        validateOnSubmit: true,

        suspendSubmit: false
    },
    /**
     * Property: errorMessagess
     * element holding
     */
    errorMessage: null,
    /**
     * Property: bound
     * storage for bound methods useful for working with events
     */
    bound: {},
    /**
     * APIMethod: init
     * construct a new instance of the plugin.  The plugin must be attached
     * to a Jx.Grid instance to be useful though.
     */
    init: function() {
        this.parent();
        this.bound.validate = this.validate.bind(this);
        this.bound.failed = this.fieldFailed.bind(this);
        this.bound.passed = this.fieldPassed.bind(this);
    },
    /**
     * APIMethod: attach
     * Sets up the plugin and connects it to the form
     */
    attach: function (form) {
        if (!$defined(form) && !(form instanceof Jx.Form)) {
            return;
        }
        this.form = form;
        var plugin = this;
        //override the isValid function in the form
        this.form.isValid = function () {
            return plugin.isValid();
        };

        if (this.options.validateOnSubmit && !this.options.suspendSubmit) {
            document.id(this.form).addEvent('submit', this.bound.validate);
        } else if (this.options.suspendSubmit) {
            document.id(this.form).addEvent('submit', function (ev) {
                ev.stop();
            });
        }

        this.plugins = $H();

        //setup the fields
        $H(this.options.fields).each(function (val, key) {
            var opts = $merge(this.options.fieldDefaults, val);
            var field = this.form.getField(key);
            var p = new Jx.Plugin.Field.Validator(opts);
            this.plugins.set(key, p);
            p.attach(field);
            p.addEvent('fieldValidationFailed', this.bound.failed);
            p.addEvent('fieldValidationPassed', this.bound.passed);

        }, this);

    },
    /**
     * APIMethod: detach
     */
    detach: function() {
        if (this.form) {
            document.id(this.form).removeEvent('submit');
        }
        this.form = null;
        this.plugins.each(function(plugin){
            plugin.detach();
            plugin = null;
        },this);
        this.plugins = null;
    },
    /**
     * APIMethod: isValid
     * Call this to determine whether the form validates.
     */
    isValid: function () {
        return this.validate();
    },
    /**
     * Method: validate
     * Method that actually does the work of validating the fields in the form.
     */
    validate: function () {
        var valid = true;
        this.errors = $H();
        this.plugins.each(function(plugin){
            if (!plugin.isValid()) {
                valid = false;
                this.errors.set(plugin.field.id,plugin.getErrors());
            }
        }, this);
        if (valid) {
            this.fireEvent('formValidationPassed', [this.form, this]);
        } else {
            this.fireEvent('formValidationFailed', [this.form, this]);
        }
        return valid;
    },
    /**
     * Method: fieldFailed
     * Refires the fieldValidationFailed event from the field validators it contains
     */
    fieldFailed: function (field, validator) {
        this.fireEvent('fieldValidationFailed', [field, validator]);
    },
    /**
     * Method: fieldPassed
     * Refires the fieldValidationPassed event from the field validators it contains
     */
    fieldPassed: function (field, validator) {
        this.fireEvent('fieldValidationPassed', [field, validator]);
    },
    /**
     * APIMethod: getErrors
     * Use this method to get all of the errors from all of the fields.
     */
    getErrors: function () {
        if (!$defined(this.errors)) {
           this.validate();
        }
        return this.errors;
    }


});
// $Id: context.js 663 2009-12-08 07:08:21Z jonlb@comcast.net $
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
    Extends: Jx.Menu,

    parameters: ['id'],

    /**
     * APIMethod: render
     * create a new context menu
     */
    render: function() {
        this.id = document.id(this.options.id);
        if (this.id) {
            this.id.addEvent('contextmenu', this.show.bindWithEvent(this));
        }
        this.parent();
    },
    /**
     * Method: show
     * Show the context menu at the location of the mouse click
     *
     * Parameters:
     * e - {Event} the mouse event
     */
    show : function(e) {
        if (this.list.count() ==0) {
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

        document.addEvent('mousedown', this.bound.mousedown);
        document.addEvent('keyup', this.bound.keypress);

        e.stop();
    }
});// $Id: menu.separator.js 626 2009-11-20 13:22:22Z pagameba $
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
    Extends: Jx.Widget,
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
    options: {
        template: "<li class='jxMenuItemContainer jxMenuItem'><span class='jxMenuSeparator'>&nbsp;</span></li>"
    },
    classes: new Hash({
        domObj: 'jxMenuItem'
    }),
    /**
     * APIMethod: render
     * Create a new instance of a menu separator
     */
    render: function() {
        this.parent();
        this.domObj.store('jxMenuItem', this);
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
});// $Id: submenu.js 626 2009-11-20 13:22:22Z pagameba $
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
     * Property: list
     * {<Jx.List>} a list to manage menu items
     */
    list: null,
    options: {
        template: '<li class="jxMenuItemContainer"><a class="jxMenuItem jxButtonSubMenu"><span class="jxMenuItemContent"><img class="jxMenuItemIcon" src="'+Jx.aPixel.src+'"><span class="jxMenuItemLabel"></span></span></a></li>',
        position: {
            horizontal: ['right left', 'left right'],
            vertical: ['top top']
        }
    },

    /**
     * APIMethod: render
     * Create a new instance of Jx.SubMenu
     */
    render: function() {
        this.parent();
        this.open = false;

        this.menu = new Jx.Menu(null, {
            position: this.options.position
        });
        this.menu.domObj = this.domObj;
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
        if (this.open || this.menu.list.count() == 0) {
            return;
        }
        this.menu.show();
        this.open = true;
        this.setActive(true);
    },

    eventInMenu: function(e) {
        if (this.visibleItem &&
            this.visibleItem.eventInMenu &&
            this.visibleItem.eventInMenu(e)) {
            return true;
        }
        return document.id(e.target).descendantOf(this.domObj) ||
               this.menu.eventInMenu(e);
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
        this.menu.hide();
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
    add: function(item, position) {
        this.menu.add(item, position, this);
        return this;
    },
    /**
     * Method: remove
     * Remove a menu item from the menu
     *
     * Parameters:
     * item - {<Jx.MenuItem>} the menu item to remove
     */
    remove: function(item) {
        this.menu.remove(item);
        return this;
    },
    /**
     * Method: replace
     * Replace a menu item with another menu item
     *
     * Parameters:
     * what - {<Jx.MenuItem>} the menu item to replace
     * withWhat - {<Jx.MenuItem>} the menu item to replace it with
     */
    replace: function(item, withItem) {
        this.menu.replace(item, withItem);
        return this;
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
});// $Id: snap.js 626 2009-11-20 13:22:22Z pagameba $
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
     * Parameters:
     * snap - {HTMLElement} the clickable thing that snaps the element
     *           open and closed
     * element - {HTMLElement} the element that gets controlled by the snap
     * splitter - {<Jx.Splitter>} the splitter that this all happens inside of.
     */
    parameters: ['snap','element','splitter','events'],

    /**
     * APIMethod: init
     * Create a new Jx.Splitter.Snap
     */
    init: function() {
        this.snap = this.options.snap;
        this.element = this.options.element;
        this.splitter = this.options.splitter;
        this.events = this.options.events;
        var jxl = this.element.retrieve('jxLayout');
        jxl.addEvent('sizeChange', this.sizeChange.bind(this));
        this.layout = this.splitter.options.layout;
        var jxo = jxl.options;
        var size = this.element.getContentBoxSize();
        if (this.layout == 'vertical') {
            this.originalSize = size.height;
            this.minimumSize = jxo.minHeight ? jxo.minHeight : 0;
        } else {
            this.originalSize = size.width;
            this.minimumSize = jxo.minWidth ? jxo.minWidth : 0;
        }
        this.events.each(function(eventName) {
            this.snap.addEvent(eventName, this.toggleElement.bind(this));
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
});// $Id: tabset.js 626 2009-11-20 13:22:22Z pagameba $
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
     * Parameters:
     * domObj - {HTMLElement} an element or id of an element to put the
     * content of the tabs into.
     * options - an options object, only event handlers are supported
     * as options at this time.
     */
    parameters: ['domObj','options'],

    /**
     * APIMethod: init
     * Create a new instance of <Jx.TabSet> within a specific element of
     * the DOM.
     */
    init: function() {
        this.tabs = [];
        this.domObj = document.id(this.options.domObj);
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



// $Id: tabbox.js 626 2009-11-20 13:22:22Z pagameba $
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
     * APIMethod: render
     * Create a new instance of a TabBox.
     */
    render : function() {
        this.parent();
        this.tabBar = new Jx.Toolbar({
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
             this.tabBar.domObj.getParent('.jxBarContainer').addClass('jxTabBar'+this.options.position.capitalize());
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
// $Id: toolbar.separator.js 626 2009-11-20 13:22:22Z pagameba $
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
    Extends: Jx.Widget,
    /**
     * APIMethod: render
     * Create a new Jx.Toolbar.Separator
     */
    render: function() {
        this.domObj = new Element('li', {'class':'jxToolItem'});
        this.domSpan = new Element('span', {'class':'jxBarSeparator'});
        this.domObj.appendChild(this.domSpan);
    }
});
// $Id: tree.js 626 2009-11-20 13:22:22Z pagameba $
/**
 * Class: Jx.Tree
 *
 * Jx.Tree displays hierarchical data in a tree structure of folders and nodes.
 *
 * Example:
 * (code)
 * (end)
 *
 * Extends: <Jx.Widget>
 *
 * License:
 * Copyright (c) 2008, DM Solutions Group Inc.
 *
 * This file is licensed under an MIT style license
 */
Jx.Tree = new Class({
    Family: 'Jx.Tree',
    Extends: Jx.Widget,
    parameters: ['options','container', 'selection'],
    /**
     * APIProperty: selection
     * {<Jx.Selection>} the selection object for this tree.
     */
    selection: null,
    /**
     * Property: ownsSelection
     * {Boolean} indicates if this object created the <Jx.Selection> object
     * or not.  If true then the selection object will be destroyed when the
     * tree is destroyed, otherwise the selection object will not be
     * destroyed.
     */
    ownsSelection: false,
    /**
     * Property: list
     * {<Jx.List>} the list object is used to manage the DOM elements of the
     * items added to the tree.
     */
    list: null,
    /**
     * APIProperty: domObj
     * {HTMLElement} the DOM element that contains the visual representation
     * of the tree.
     */
    domObj: null,
    options: {
        /**
         * Option: select
         * {Boolean} are items in the tree selectable?  See <Jx.Selection>
         * for other options relating to selections that can be set here.
         */
        select: true,
        /**
         * Option: template
         * the default HTML template for a tree can be overridden
         */
        template: '<ul class="jxTreeRoot"></ul>'
    },
    /**
     * APIProperty: classes
     * {Hash} a hash of property to CSS class names for extracting references
     * to DOM elements from the supplied templates.  Requires
     * domObj element, anything else is optional.
     */
    classes: new Hash({domObj: 'jxTreeRoot'}),
    /**
     * APIMethod: render
     * Render the Jx.Tree.
     */
    render: function() {
        this.parent();
        if ($defined(this.options.container) &&
            document.id(this.options.container)) {
            this.domObj = this.options.container;
        }

        if (this.options.selection) {
            this.selection = this.options.selection;
        } else if (this.options.select) {
            this.selection = new Jx.Selection(this.options);
            this.ownsSelection = true;
        }

        this.bound = {
            select: function(item) {
                this.fireEvent('select', item.retrieve('jxTreeItem'));
            }.bind(this),
            unselect: function(item) {
                this.fireEvent('unselect', item.retrieve('jxTreeItem'));
            }.bind(this)
        };

        if (this.selection && this.ownsSelection) {
            this.selection.addEvents({
                select: this.bound.select,
                unselect: this.bound.unselect
            });
        }

        this.list = new Jx.List(this.domObj, {
                hover: true,
                press: true,
                select: true,
                onAdd: function(item) {this.update();}.bind(this),
                onRemove: function(item) {this.update();}.bind(this)
            }, this.selection);
        if (this.options.parent) {
            this.addTo(this.options.parent);
        }
    },

    /**
     * APIMethod: add
     * add one or more items to the tree at a particular position in the tree
     *
     * Parameters:
     * item - {<Jx.TreeItem>} or an array of items to be added
     * position - {mixed} optional location to add the items.  By default,
     * this is 'bottom' meaning the items are added at the end of the list.
     * See <Jx.List::add> for options
     *
     * Returns:
     * {<Jx.Tree>} a reference to this object for chaining calls
     */
    add: function(item, position) {
        if ($type(item) == 'array') {
            item.each(function(what){ this.add(what, position); }.bind(this) );
            return;
        }
        item.addEvents({
            add: function(what) { this.fireEvent('add', what).bind(this); },
            remove: function(what) { this.fireEvent('remove', what).bind(this); },
            disclose: function(what) { this.fireEvent('disclose', what).bind(this); }
        });
        item.setSelection(this.selection);
        item.owner = this;
        this.list.add(item, position);
        return this;
    },
    /**
     * APIMethod: remove
     * remove an item from the tree
     *
     * Parameters:
     * item - {<Jx.TreeItem>} the tree item to remove
     *
     * Returns:
     * {<Jx.Tree>} a reference to this object for chaining calls
     */
    remove: function(item) {
        item.removeEvents('add');
        item.removeEvents('remove');
        item.removeEvents('disclose');
        item.owner = null;
        this.list.remove(item);
        item.setSelection(null);
        return this;
    },
    /**
     * APIMethod: replace
     * replaces one item with another
     *
     * Parameters:
     * item - {<Jx.TreeItem>} the tree item to remove
     * withItem - {<Jx.TreeItem>} the tree item to insert
     *
     * Returns:
     * {<Jx.Tree>} a reference to this object for chaining calls
     */
    replace: function(item, withItem) {
        item.owner = null;
        withItem.owner = this;
        this.list.replace(item, withItem);
        withItem.setSelection(this.selection);
        item.setSelection(null);
        return this;
    },

    /**
     * Method: cleanup
     * Clean up a Jx.Tree instance
     */
    cleanup: function() {
        if (this.ownsSelection) {
            this.selection.destroy();
        }
        this.list.destroy();
        this.domObj.dispose();
    },
    /**
     * Method: update
     * Update the CSS of the Tree's DOM element in case it has changed
     * position
     *
     * Parameters:
     * shouldDescend - {Boolean} propagate changes to child nodes?
     */
    update: function(shouldDescend, isLast) {

        if ($defined(isLast)) {
            if (isLast) {
                this.domObj.removeClass('jxTreeNest');
            } else {
                this.domObj.addClass('jxTreeNest');
            }
        }
        var last = this.list.count() - 1;
        this.list.each(function(item, idx){
            var lastItem = idx == last;
            if (item.retrieve('jxTreeFolder')) {
                item.retrieve('jxTreeFolder').update(shouldDescend, lastItem);
            }
            if (item.retrieve('jxTreeItem')) {
                item.retrieve('jxTreeItem').update(lastItem);
            }
        });
    },

    /**
     * APIMethod: items
     * return an array of tree item instances contained in this tree.
     * Does not descend into folders but does return a reference to the
     * folders
     */
    items: function() {
        return this.list.items().map(function(item) {
            return item.retrieve('jxTreeItem');
        });
    },
    /**
     * APIMethod: empty
     * recursively empty this tree and any folders in it
     */
    empty: function() {
        this.list.items().each(function(item){
            if (item.retrieve('jxTreeFolder')) {
                item.retrieve('jxTreeFolder').empty();
            }
            if (item.retrieve('jxTreeItem')) {
                this.remove(item.retrieve('jxTreeItem'));
            }
        }, this);
    },

    /**
     * APIMethod: findChild
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
        if (path.length == 0) {
            return false;
        }
        //path has more than one thing in it, find a folder and descend into it
        var name = path.shift();
        var result = false;
        this.list.items().some(function(item) {
            var treeItem = item.retrieve('jxTreeItem');
            if (treeItem && treeItem.getLabel() == name) {
                if (path.length > 0) {
                    var folder = item.retrieve('jxTreeFolder');
                    if (folder) {
                        result = folder.findChild(path);
                    }
                } else {
                    result = treeItem;
                }
            }
            return result;
        });
        return result;
    },
    /**
     * APIMethod: setSelection
     * sets the <Jx.Selection> object to be used by this tree.  Used primarily
     * by <Jx.TreeFolder> to propogate a single selection object throughout a
     * tree.
     *
     * Parameters:
     * selection - {<Jx.Selection>} the new selection object to use
     *
     * Returns:
     * {<Jx.Tree>} a reference to this object for chaining
     */
    setSelection: function(selection) {
        if (this.selection && this.ownsSelection) {
            this.selection.removeEvents(this.bound);
            this.selection.destroy();
            this.ownsSelection = false;
        }
        this.selection = selection;
        this.list.setSelection(selection);
        this.list.each(function(item) {
            item.retrieve('jxTreeItem').setSelection(selection);
        });
        return this;
    }
});

// $Id: treeitem.js 626 2009-11-20 13:22:22Z pagameba $
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
    selection: null,
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
        selectable: true,
        /* Option: image
         * {String} URL to an image to use as the icon next to the
         * label of this TreeItem
         */
        image: null,
        /* Option: imageClass
         * {String} CSS class to apply to the image, useful for using CSS
         * sprites
         */
        imageClass: '',
        lastLeafClass: 'jxTreeLeafLast',
        template: '<li class="jxTreeContainer jxTreeLeaf"><img class="jxTreeImage" src="'+Jx.aPixel.src+'" alt="" title=""><a class="jxTreeItem" href="javascript:void(0);"><img class="jxTreeIcon" src="'+Jx.aPixel.src+'" alt="" title=""><span class="jxTreeLabel"></span></a></li>'
    },
    classes: new Hash({
        domObj: 'jxTreeContainer',
        domA: 'jxTreeItem',
        domImg: 'jxTreeImage',
        domIcon: 'jxTreeIcon',
        domLabel: 'jxTreeLabel'
    }),

    /**
     * APIMethod: render
     * Create a new instance of Jx.TreeItem with the associated options
     */
    render : function() {
        this.parent();

        this.domObj = this.elements.get('jxTreeContainer');
        this.domObj.store('jxTreeItem', this);
        this.domA.store('jxTreeItem', this);

        /* the target for jxPressed, jxSelected, jxHover classes */
        this.domObj.store('jxListTarget', this.domA);

        if (!this.options.selectable) {
            this.domObj.addClass('jxUnselectable');
        }

        if (this.domObj) {
            if (this.options.id) {
                this.domObj.id = this.options.id;
            }
            this.domObj.store('jxTreeItem', this);
            if (!this.options.enabled) {
                this.domObj.addClass('jxDisabled');
            }
        }

        if (this.options.image && this.domIcon) {
            this.domIcon.setStyle('backgroundImage', 'url('+this.options.image+')');
            if (this.options.imageClass) {
                this.domIcon.addClass(this.options.imageClass);
            }

        }

        if (this.options.label && this.domLabel) {
            this.domLabel.set('html',this.options.label);
        }

        if (this.domA) {
            this.domA.addEvents({
                click: this.click.bind(this),
                dblclick: this.dblclick.bind(this),
                drag: function(e) { e.stop(); },
                contextmenu: function(e) { e.stop(); }
            });
            if (typeof Drag != 'undefined') {
                new Drag(this.domA, {
                    onStart: function() {this.stop();}
                });
            }
        }

        if ($defined(this.options.enabled)) {
            this.enable(this.options.enabled, true);
        }
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
        this.options = null;
        this.domObj.dispose();
        this.domObj = null;
        this.owner = null;
    },
    /**
     * Method: update
     * Update the CSS of the TreeItem's DOM element in case it has changed
     * position
     *
     * Parameters:
     * isLast - {Boolean} is the item the last one or not?
     */
    update : function(isLast) {
        if (isLast) {
            this.domObj.addClass(this.options.lastLeafClass);
        } else {
            this.domObj.removeClass(this.options.lastLeafClass);
        }
    },
    click: function() {
        if (this.options.enabled) {
            this.fireEvent('click', this);
        }
    },
    dblclick: function() {
        if (this.options.enabled) {
            this.fireEvent('dblclick', this);
        }
    },
    /**
     * Method: select
     * Select a tree node.
     */
    select: function() {
        if (this.selection && this.options.enabled) {
            this.selection.select(document.id(this));
        }
    },

    /**
     * Method: getLabel
     * Get the label associated with a TreeItem
     *
     * Returns:
     * {String} the name
     */
    getLabel: function() {
        return this.options.label;
    },

    /**
     * Method: setLabel
     * set the label of a tree item
     */
    setLabel: function(label) {
        this.options.label = label;
        if (this.domLabel) {
            this.domLabel.set('html',label);
        }
    },

    setImage: function(url, imageClass) {
        if (this.domIcon && $defined(url)) {
            this.options.image = url;
            this.domIcon.setStyle('backgroundImage', 'url('+this.options.image+')');
        }
        if (this.domIcon && $defined(imageClass)) {
            this.domIcon.removeClass(this.options.imageClass);
            this.options.imageClass = imageClass;
            this.domIcon.addClass(imageClass);
        }
    },
    enable: function(state, force) {
        if (this.options.enabled != state || force) {
            this.options.enabled = state;
            if (this.options.enabled) {
                this.domObj.removeClass('jxDisabled');
                this.fireEvent('enabled', this);
            } else {
                this.domObj.addClass('jxDisabled');
                this.fireEvent('disabled', this);
                if (this.selection) {
                    this.selection.unselect(document.id(this));
                }
            }
        }
    },

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
    },
    setSelection: function(selection){
        this.selection = selection;
    }
});
// $Id: treefolder.js 626 2009-11-20 13:22:22Z pagameba $
/**
 * Class: Jx.TreeFolder
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
     * Property: tree
     * {<Jx.Tree>} a Jx.Tree instance for managing the folder contents
     */
    tree : null,

    options: {
        /* Option: open
         * is the folder open?  false by default.
         */
        open: false,
        /* folders will share a selection with the tree they are in */
        select: false,
        template: '<li class="jxTreeContainer jxTreeBranch"><img class="jxTreeImage" src="'+Jx.aPixel.src+'" alt="" title=""><a class="jxTreeItem" href="javascript:void(0);"><img class="jxTreeIcon" src="'+Jx.aPixel.src+'" alt="" title=""><span class="jxTreeLabel"></span></a><ul class="jxTree"></ul></li>'
    },
    classes: new Hash({
        domObj: 'jxTreeContainer',
        domA: 'jxTreeItem',
        domImg: 'jxTreeImage',
        domIcon: 'jxTreeIcon',
        domLabel: 'jxTreeLabel',
        domTree: 'jxTree'
    }),
    /**
     * APIMethod: render
     * Create a new instance of Jx.TreeFolder
     */
    render : function() {
        this.parent();
        this.domObj.store('jxTreeFolder', this);

        this.bound = {
            toggle: this.toggle.bind(this)
        };

        this.addEvents({
            click: this.bound.toggle,
            dblclick: this.bound.toggle
        });

        if (this.domImg) {
            this.domImg.addEvent('click', this.bound.toggle);
        }

        this.tree = new Jx.Tree({
            template: this.options.template,
            onAdd: function(item) {
                this.update();
                this.fireEvent('add', item);
            }.bind(this),
            onRemove: function(item) {
                this.update();
                this.fireEvent('remove', item);
            }.bind(this)
        }, this.domTree);
        if (this.options.open) {
            this.expand();
        } else {
            this.collapse();
        }

        this.addEvent('postDestroy',function() {
            this.tree.destroy();
        }.bind(this));
    },
    /**
     * APIMethod: add
     * add one or more items to the folder at a particular position in the
     * folder
     *
     * Parameters:
     * item - {<Jx.TreeItem>} or an array of items to be added
     * position - {mixed} optional location to add the items.  By default,
     * this is 'bottom' meaning the items are added at the end of the list.
     * See <Jx.List::add> for options
     *
     * Returns:
     * {<Jx.TreeFolder>} a reference to this object for chaining calls
     */
    add: function(item, position) {
        this.tree.add(item, position);
        return this;
    },
    /**
     * APIMethod: remove
     * remove an item from the folder
     *
     * Parameters:
     * item - {<Jx.TreeItem>} the folder item to remove
     *
     * Returns:
     * {<Jx.Tree>} a reference to this object for chaining calls
     */
    remove: function(item) {
        this.tree.remove(item);
        return this;
    },
    /**
     * APIMethod: replace
     * replaces one item with another
     *
     * Parameters:
     * item - {<Jx.TreeItem>} the tree item to remove
     * withItem - {<Jx.TreeItem>} the tree item to insert
     *
     * Returns:
     * {<Jx.Tree>} a reference to this object for chaining calls
     */
    replace: function(item, withItem) {
        this.tree.replace(item, withItem);
        return this;
    },
    /**
     * APIMethod: items
     * return an array of tree item instances contained in this tree.
     * Does not descend into folders but does return a reference to the
     * folders
     */
    items: function() {
        return this.tree.items();
    },
    /**
     * APIMethod: empty
     * recursively empty this folder and any folders in it
     */
    empty: function() {
        this.tree.empty();
    },
    /**
     * Method: update
     * Update the CSS of the TreeFolder's DOM element in case it has changed
     * position.
     *
     * Parameters:
     * shouldDescend - {Boolean} propagate changes to child nodes?
     * isLast - {Boolean} is this the last item in the list?
     *
     * Returns:
     * {<Jx.TreeFolder>} a reference to this for chaining
     */
    update: function(shouldDescend,isLast) {
        /* avoid update if not attached to tree yet */
        if (!this.domObj.parentNode) return;

        if (!$defined(isLast)) {
            isLast = this.domObj.hasClass('jxTreeBranchLastOpen') ||
                     this.domObj.hasClass('jxTreeBranchLastClosed');
        }

        ['jxTreeBranchOpen','jxTreeBranchLastOpen','jxTreeBranchClosed',
        'jxTreeBranchLastClosed'].each(function(c){
            this.removeClass(c);
        }.bind(this.domObj));
        var c = 'jxTreeBranch';
        c += isLast ? 'Last' : '';
        c += this.options.open ? 'Open' : 'Closed';
        this.domObj.addClass(c);

        this.tree.update(shouldDescend, isLast);
    },
    /**
     * APIMethod: toggle
     * toggle the state of the folder between open and closed
     *
     * Returns:
     * {<Jx.TreeFolder>} a reference to this for chaining
     */
    toggle: function() {
        if (this.options.enabled) {
            if (this.options.open) {
                this.collapse();
            } else {
                this.expand();
            }
        }
        return this;
    },
    /**
     * APIMethod: expand
     * Expands the folder
     *
     * Returns:
     * {<Jx.TreeFolder>} a reference to this for chaining
     */
    expand : function() {
        this.options.open = true;
        document.id(this.tree).setStyle('display', 'block');
        this.update(true);
        this.fireEvent('disclosed', this);
        return this;
    },
    /**
     * APIMethod: collapse
     * Collapses the folder
     *
     * Returns:
     * {<Jx.TreeFolder>} a reference to this for chaining
     */
    collapse : function() {
        this.options.open = false;
        document.id(this.tree).setStyle('display', 'none');
        this.update(true);
        this.fireEvent('disclosed', this);
        return this;
    },
    /**
     * APIMethod: findChild
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
        if (path.length == 0) {
            return this;
        } else {
            return this.tree.findChild(path);
        }
    },
    /**
     * Method: setSelection
     * sets the <Jx.Selection> object to be used by this folder.  Used
     * to propogate a single selection object throughout a tree.
     *
     * Parameters:
     * selection - {<Jx.Selection>} the new selection object to use
     *
     * Returns:
     * {<Jx.TreeFolder>} a reference to this for chaining
     */
    setSelection: function(selection) {
        this.tree.setSelection(selection);
        return this;
    }
});// $Id: slider.js 673 2009-12-24 23:13:40Z jonlb@comcast.net $
/**
 * Class: Jx.Slider
 * This class wraps the mootools-more slider class to make it more Jx friendly
 *
 * Copyright 2009 by Jonathan Bomgardner
 * License: MIT-style
 */
Jx.Slider = new Class({
    Family: 'Jx.Slider',
    Extends: Jx.Widget,

    options: {
        /**
         * Option: template
         * The template used to render the slider
         */
        template: '<div class="jxSliderContainer"><div class="jxSliderKnob"></div></div>',
        /**
         * Option: max
         * The maximum value the slider should have
         */
        max: 100,
        /**
         * Option: min
         * The minimum value the slider should ever have
         */
        min: 0,
        /**
         * Option: step
         * The distance between adjacent steps. For example, the default (1)
         * with min of 0 and max of 100, provides 100 steps between the min
         * and max values
         */
        step: 1,
        /**
         * Option: mode
         * Whether this is a vertical or horizontal slider
         */
        mode: 'horizontal',
        /**
         * Option: wheel
         * Whether the slider reacts to the scroll wheel.
         */
        wheel: true,
        /**
         * Option: snap
         * whether to snap to each step
         */
        snap: true,
        /**
         * Option: startAt
         * The value, or step, to put the slider at initially
         */
        startAt: 0,
        /**
         * Option: offset
         *
         */
        offset: 0,
        onChange: $empty,
        onComplete: $empty
    },
    classes: new Hash({
        domObj: 'jxSliderContainer',
        knob: 'jxSliderKnob'
    }),
    slider: null,
    knob: null,
    sliderOpts: null,
    /**
     * APIMethod: render
     * Create the slider but does not start it up due to issues with it
     * having to be visible before it will work properly.
     */
    render: function () {
        this.parent();
        
        /** 
         * Not sure why this is here...
         */
        /**
        if (this.domObj) {
            return;
        }
        **/

        this.sliderOpts = {
            range: [this.options.min, this.options.max],
            snap: this.options.snap,
            mode: this.options.mode,
            wheel: this.options.wheel,
            steps: (this.options.max - this.options.min) / this.options.step,
            offset: this.options.offset,
            onChange: this.change.bind(this),
            onComplete: this.complete.bind(this)
        };

    },
    /**
     * Method: change
     * Called when the slider moves
     */
    change: function (step) {
        this.fireEvent('change', [step, this]);
    },
    /**
     * Method: complete
     * Called when the slider stops moving and the mouse button is released.
     */
    complete: function (step) {
        this.fireEvent('complete', [step, this]);
    },
    /**
     * APIMethod: start
     * Call this method after the slider has been rendered in the DOM to start
     * it up and position the slider at the startAt poisition.
     */
    start: function () {
        if (!$defined(this.slider)) {
            this.slider = new Slider(this.domObj, this.knob, this.sliderOpts);
        }
        this.slider.set(this.options.startAt);
    }
});// $Id: notice.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Notice
 *
 * Extends: <Jx.ListItem>
 *
 * Events:
 *
 * License:
 * Copyright (c) 2009, DM Solutions Group.
 *
 * This file is licensed under an MIT style license
 */
Jx.Notice = new Class({

    Family: 'Jx.Notice',
    Extends: Jx.ListItem,

    options: {
        fx: 'fade',
        chrome: false,
        enabled: true,
        template: '<li class="jxNoticeItemContainer"><div class="jxNoticeItem"><span class="jxNotice"></span><a class="jxNoticeClose" href="javascript:void(0);" title="close this notice"></a></div></li>',
        klass: ''
    },

    classes: new Hash({
        domObj: 'jxNoticeItemContainer',
        domItem: 'jxNoticeItem',
        domContent: 'jxNotice',
        domClose: 'jxNoticeClose'
    }),

    /**
     * APIMethod: render
     */
    render: function () {
        this.parent();
        
        if (this.options.klass) {
            this.domObj.addClass(this.options.klass);
        }
        if (this.domClose) {
            this.domClose.addEvent('click', this.close.bind(this));
        }
    },

    close: function() {
        this.fireEvent('close', this);
    },
    
    show: function(el, onComplete) {
        if (this.options.chrome) {
            this.showChrome();
        }
        if (this.options.fx) {
            document.id(el).adopt(this);
            if (onComplete) onComplete();
        } else {
            document.id(el).adopt(this);
            if (onComplete) onComplete();
        }
    },
    
    hide: function(onComplete) {
        if (this.options.chrome) {
            this.hideChrome();
        }
        if (this.options.fx) {
            document.id(this).dispose();
            if (onComplete) onComplete();
        } else {
            document.id(this).dispose();
            if (onComplete) onComplete();
        }
    }
});

Jx.Notice.Information = new Class({
    Extends: Jx.Notice,
    options: {
        template: '<li class="jxNoticeItemContainer"><div class="jxNoticeItem"><img class="jxNoticeIcon" src="'+Jx.aPixel.src+'" title="Success"><span class="jxNotice"></span><a class="jxNoticeClose" href="javascript:void(0);" title="close this notice"></a></div></li>',
        klass: 'jxNoticeInformation'
    }
});
Jx.Notice.Success = new Class({
    Extends: Jx.Notice,
    options: {
        template: '<li class="jxNoticeItemContainer"><div class="jxNoticeItem"><img class="jxNoticeIcon" src="'+Jx.aPixel.src+'" title="Success"><span class="jxNotice"></span><a class="jxNoticeClose" href="javascript:void(0);" title="close this notice"></a></div></li>',
        klass: 'jxNoticeSuccess'
    }
});
Jx.Notice.Warning = new Class({
    Extends: Jx.Notice,
    options: {
        template: '<li class="jxNoticeItemContainer"><div class="jxNoticeItem"><img class="jxNoticeIcon" src="'+Jx.aPixel.src+'" title="Warning"><span class="jxNotice"></span><a class="jxNoticeClose" href="javascript:void(0);" title="close this notice"></a></div></li>',
        klass: 'jxNoticeWarning'
    }
});
Jx.Notice.Error = new Class({
    Extends: Jx.Notice,
    options: {
        template: '<li class="jxNoticeItemContainer"><div class="jxNoticeItem"><img class="jxNoticeIcon" src="'+Jx.aPixel.src+'" title="Error"><span class="jxNotice"></span><a class="jxNoticeClose" href="javascript:void(0);" title="close this notice"></a></div></li>',
        klass: 'jxNoticeError'
    }
});



Jx.Notifier = new Class({
    
    Family: 'Jx.Notifier',
    Extends: Jx.ListView,
    
    options: {
        /**
         * Option: parent
         * The parent this notifier is to be placed in. If not specified, it
         * will be placed in the body of the document.
         */
        parent: null,
        /**
         * Option: template
         * This is the template for the notification container itself, not the
         * actual notice. The actual notice is below in the class property 
         * noticeTemplate.
         */
        template: '<div class="jxNoticeListContainer"><ul class="jxNoticeList"></ul></div>',
        /**
         * Option: listOptions
         * An object holding custom options for the internal Jx.List instance.
         */
        listOptions: { }
    },

    classes: new Hash({
        domObj: 'jxNoticeListContainer',
        listObj: 'jxNoticeList'
    }),
    
    init: function () {
        this.parent();
    },
    
    render: function () {
        this.parent();
        
        if (!$defined(this.options.parent)) {
            this.options.parent = document.body;
        }
        document.id(this.options.parent).adopt(this.domObj);
        
        this.addEvent('postRender', function() {
            if (Jx.type(this.options.items) == 'array') {
                this.options.items.each(function(item){
                    this.add(item);
                },this);
            }
        }.bind(this));
    },
    
    add: function (notice) {
        if (!(notice instanceof Jx.Notice)) {
            notice = new Jx.Notice({content: notice});
        }
        notice.addEvent('close', this.remove.bind(this));
        notice.show(this.listObj);
    },
    
    remove: function (notice) {
        if (this.domObj.hasChild(notice)) {
            notice.removeEvents('close');
            notice.hide();
        }
    }
});Jx.Notifier.Float = new Class({
    
    Family: 'Jx.Notifier.Float',
    Extends: Jx.Notifier,
    
    options: {
        chrome: true,
        fx: null,
        width: 250,
        position: {
            horizontal: 'center center',
            vertical: 'top top'
        }
    },

    render: function () {
        this.parent();
        this.domObj.setStyle('position','absolute');
        if ($defined(this.options.width)) {
            this.domObj.setStyle('width',this.options.width);
        }
        this.position(this.domObj, this.options.parent, this.options.position);
    },
    
    add: function(notice) {
        if (!(notice instanceof Jx.Notice)) {
            notice = new Jx.Notice({content: notice});
        }
        notice.options.chrome = this.options.chrome;
        this.parent(notice);
    }
});// $Id$
/**
 * Class: Jx.Scrollbar
 * Creates a custom scrollbar either vertically or horizontally (determined by
 * options). These scrollbars are designed to be styled entirely through CSS.
 * 
 * Copyright 2009 by Jonathan Bomgardner
 * License: MIT-style
 * 
 * Based in part on 'Mootools CSS Styled Scrollbar' on http://solutoire.com/2008/03/10/mootools-css-styled-scrollbar/
 */
Jx.Scrollbar = new Class({
    
    Family: 'Jx.Scrollbar',
    
    Extends: Jx.Widget,
    
    options: {
        /**
         * Option: bars
         * Determines which bars are visible. Valid options are 'horizontal'
         * or 'vertical'
         */
        direction: 'vertical',
        /**
         * Option: useMouseWheel
         * Whether to allow the mouse wheel to move the content. Defaults 
         * to true.
         */
        useMouseWheel: true,
        /**
         * Option: useScrollers
         * Whether to show the scrollers. Defaults to true.
         */
        useScrollers: true,
        /**
         * Option: scrollerInterval
         * The amount to scroll the content when using the scrollers. 
         * useScrollers option must be true. Default is 50 (px).
         */
        scrollerInterval: 50,
        
        template: '<div class="jxScrollbarContainer"><div class="jxScrollLeft"></div><div class="jxSlider"></div><div class="jxScrollRight"></div></div>'
    },
    
    classes: new Hash({
        domObj: 'jxScrollbarContainer',
        scrollLeft: 'jxScrollLeft',
        scrollRight: 'jxScrollRight',
        sliderHolder: 'jxSlider'
    }),
    
    el: null,
    //element is the element we want to scroll. 
    parameters: ['element', 'options'],
    
    render: function () {
        
        this.parent();
        
        this.el = document.id(this.options.element);
        
        if (this.el) {
            this.el.addClass('jxHas'+this.options.direction.capitalize()+'Scrollbar');
            
            
            //wrap content to make scroll work correctly
            var children = this.el.getChildren();
            this.wrapper = new Element('div',{
                'class': 'jxScrollbarChildWrapper'
            });
            
            /**
             * the wrapper needs the same settings as the original container
             * specifically, the width and height
             */ 
            this.wrapper.setStyles({
                width: this.el.getStyle('width'),
                height: this.el.getStyle('height')
            });
            
            children.inject(this.wrapper);
            this.wrapper.inject(this.el);
            
            this.domObj.inject(this.el);
            
            var scrollSize = this.wrapper.getScrollSize();
            var size = this.wrapper.getContentBoxSize();
            this.steps = this.options.direction==='horizontal'?scrollSize.x-size.width:scrollSize.y-size.height;
            this.slider = new Jx.Slider({
                snap: false,
                min: 0,
                max: this.steps,
                step: 1,
                mode: this.options.direction,
                onChange: this.scrollIt.bind(this)
                
            });
            
            if (!this.options.useScrollers) {
                this.scrollLeft.dispose();
                this.scrollRight.dispose();
                //set size of the sliderHolder
                if (this.options.direction === 'horizontal') {
                    this.sliderHolder.setStyle('width','100%');
                } else {
                    this.sliderHolder.setStyle('height', '100%');
                }
                
            } else {
                this.scrollLeft.addEvents({
                    mousedown: function () {
                        this.slider.slider.set(this.slider.slider.step - this.options.scrollerInterval);
                        this.pid = function () {
                            this.slider.slider.set(this.slider.slider.step - this.options.scrollerInterval);
                        }.periodical(1000, this);
                    }.bind(this),
                    mouseup: function () {
                        $clear(this.pid);
                    }.bind(this)
                });
                this.scrollRight.addEvents({
                    mousedown: function () {
                        this.slider.slider.set(this.slider.slider.step + this.options.scrollerInterval);
                        this.pid = function () {
                            this.slider.slider.set(this.slider.slider.step + this.options.scrollerInterval);
                        }.periodical(1000, this);
                    }.bind(this),
                    mouseup: function () {
                        $clear(this.pid);
                    }.bind(this)
                });
                //set size of the sliderHolder
                var holderSize, scrollerRightSize, scrollerLeftSize;
                if (this.options.direction === 'horizontal') {
                    scrollerRightSize = this.scrollRight.getMarginBoxSize().width;
                    scrollerLeftSize = this.scrollLeft.getMarginBoxSize().width;
                    holderSize = size.width - scrollerRightSize - scrollerLeftSize;
                    this.sliderHolder.setStyle('width', holderSize + 'px');
                } else {
                    scrollerRightSize = this.scrollRight.getMarginBoxSize().height;
                    scrollerLeftSize = this.scrollLeft.getMarginBoxSize().height;
                    holderSize = size.height - scrollerRightSize - scrollerLeftSize;
                    this.sliderHolder.setStyle('height', holderSize + 'px');
                }
            }
            
            
            
            document.id(this.slider).inject(this.sliderHolder);
            
            
            //allows mouse wheel to function
            if (this.options.useMouseWheel) {
                $$(this.el, this.domObj).addEvent('mousewheel', function(e){
                    e = new Event(e).stop();
                    var step = this.slider.slider.step - e.wheel * 30;
                    this.slider.slider.set(step);
                }.bind(this));
            }
            
            //stop slider if we leave the window
            document.id(document.body).addEvent('mouseleave', function(){ 
                this.slider.slider.drag.stop();
            }.bind(this));

            this.slider.start();
            
            
        }
    },
    
    scrollIt: function (step) {
        var x = this.options.direction==='horizontal'?step:0;
        var y = this.options.direction==='horizontal'?0:step;
        this.wrapper.scrollTo(x,y);
    }
}); // $Id: formatter.js 649 2009-11-30 22:19:48Z pagameba $
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
    Family: 'Jx.Formatter',
    Extends: Jx.Object,

    /**
     * APIMethod: format
     * Empty method that must be overridden by subclasses to provide
     * the needed formatting functionality.
     */
    format: $empty
});// $Id: number.js 649 2009-11-30 22:19:48Z pagameba $
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
});// $Id: currency.js 649 2009-11-30 22:19:48Z pagameba $
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
});// $Id: date.js 649 2009-11-30 22:19:48Z pagameba $
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
});// $Id: boolean.js 649 2009-11-30 22:19:48Z pagameba $
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

});// $Id: phone.js 649 2009-11-30 22:19:48Z pagameba $
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
});// $Id: fieldset.js 649 2009-11-30 22:19:48Z pagameba $
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
    Family: 'Jx.Fieldset',
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
        template : '<fieldset class="jxFieldset"><legend><span class="jxFieldsetLegend"></span></legend></fieldset>',
        /**
         * Option: form
         * The <Jx.Form> that this fieldset should be added to
         */
        form : null
    },

    classes: new Hash({
        domObj: 'jxFieldset',
        legend: 'jxFieldsetLegend'
    }),

    /**
     * Property: legend
     * a holder for the legend Element
     */
    legend : null,

    /**
     * APIMethod: render
     * Creates a fieldset.
     */
    render : function () {
        this.parent();

        this.id = this.options.id;

        if ($defined(this.options.form)
                && this.options.form instanceof Jx.Form) {
            this.form = this.options.form;
        }

        //FIELDSET
        if (this.domObj) {
            if ($defined(this.options.id)) {
                this.domObj.set('id', this.options.id);
            }
            if ($defined(this.options.fieldsetClass)) {
                this.domObj.addClass(this.options.fieldsetClass);
            }
        }

        if (this.legend) {
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
    },
    
    /**
     * APIMethod: addTo
     *
     */
    addTo: function(what) {
        if (what instanceof Jx.Form) {
            this.form = what;
        } else if (what instanceof Jx.Fieldset) {
            this.form = what.form;
        }
        return this.parent(what);
    }
    
});
// $Id: checkbox.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
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
        template : '<span class="jxInputContainer"><input class="jxInputCheck" type="checkbox" name="{name}"/><label class="jxInputLabel"></label><span class="jxInputTag"></span></span>',
        /**
         * Option: checked
         * Whether this field is checked or not
         */
        checked : false,

        labelSeparator: ''
    },
    /**
     * Property: type
     * The type of this field
     */
    type : 'Check',

    /**
     * APIMethod: render
     * Creates a checkbox input field.
    */
    render : function () {
        this.parent();

        if ($defined(this.options.checked) && this.options.checked) {
            if (Browser.Engine.trident) {
                var parent = this.field.getParent();
                var sibling;
                if (parent) {
                    sibling = this.field.getPrevious();
                }
                this.field.setStyle('visibility','hidden');
                this.field.inject($(document.body));
                this.field.checked = true;
                this.field.defaultChecked = true;
                this.field.dispose();
                this.field.setStyle('visibility','visible');
                if (sibling) {
                    this.field.inject(sibling, 'after');
                } else if (parent) {
                    this.field.inject(parent, 'top');
                }
            } else {
                this.field.set("checked", "checked");
                this.field.set("defaultChecked", "checked");
            }
        }
    },

    /**
     * APIMethod: setValue
     * Sets the value property of the field
     *
     * Parameters:
     * v - Whether the box shouldbe checked or not. "checked" or "true" if it should be checked.
     */
    setValue : function (v) {
        if (!this.options.readonly) {
            if (v === 'checked' || v === 'true' || v === true) {
                this.field.set('checked', "checked");
            } else {
                this.field.erase('checked');
            }
        }
    },

    /**
     * APIMethod: getValue
     * Returns the current value of the field. The field must be
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
     * options. no IE hack is implemented because the field should
     * already be in the DOM when this is called.
     */
    reset : function () {
        if (this.options.checked) {
            this.field.set('checked', "checked");
        } else {
            this.field.erase('checked');
        }
    }

});
// $Id: radio.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
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
        template: '<span class="jxInputContainer"><input class="jxInputRadio" type="radio" name="{name}"/><label class="jxInputLabel"></label><span class="jxInputTag"></span></span>',
        /**
         * Option: checked
         * whether this radio button is checked or not
         */
        checked: false,

        labelSeparator: ''
    },
    /**
     * Property: type
     * What kind of field this is
     */
    type: 'Radio',

    /**
     * APIMethod: render
     * Creates a radiobutton input field.
     */
    render: function () {
        this.parent();

        if ($defined(this.options.checked) && this.options.checked) {
            if (Browser.Engine.trident) {
                var parent = this.field.getParent();
                var sibling;
                if (parent) {
                    sibling = this.field.getPrevious();
                }
                this.field.setStyle('visibility','hidden');
                this.field.inject($(document.body));
                this.field.checked = true;
                this.field.defaultChecked = true;
                this.field.dispose();
                this.field.setStyle('visibility','visible');
                if (sibling) {
                    this.field.inject(sibling, 'after');
                } else if (parent) {
                    this.field.inject(parent, 'top');
                }
            } else {
                this.field.set("checked", "checked");
                this.field.set("defaultChecked", "checked");
            }
        }
    },

    /**
     * APIMethod: setValue
     * Sets the value property of the field
     *
     * Parameters:
     * v - The value to set the field to, "checked" it should be checked.
     */
    setValue: function (v) {
        if (!this.options.readonly) {
            if (v === 'checked' || v === 'true' || v === true) {
                this.field.set('checked', "checked");
            } else {
                this.field.erase('checked');
            }
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




// $Id: select.js 681 2010-01-15 05:45:28Z jonlb@comcast.net $
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
         * Option: comboOpts
         * Optional, defaults to null. if not null, this should be an array of objects
         * formated like [{value:'', selected: true|false, text:''},...]
         */
        comboOpts: null,
        /**
         * Option: optGroups
         * Optional, defaults to null. if not null this should be an array of objects
         * defining option groups for this select. The comboOpts and optGroups options
         * are mutually exclusive. optGroups will always be shown if defined.
         *
         * define them like [{name: '', options: [{value:'', selected: '', text: ''}...]},...]
         */
        optGroups: null,
        /**
         * Option: template
         * The template for creating this select input
         */
        template: '<span class="jxInputContainer"><label class="jxInputLabel"></label><select class="jxInputSelect" name="{name}"></select><span class="jxInputTag"></span></span>'
    },
    /**
     * Property: type
     * Indictes this type of field.
     */
    type: 'Select',

    /**
     * APIMethod: render
     * Creates a select field.
     */
    render: function () {
        this.parent();
        this.field.addEvent('change', function() {this.fireEvent('change', this);}.bind(this));
        if ($defined(this.options.optGroups)) {
            this.options.optGroups.each(function(group){
                var gr = new Element('optGroup');
                gr.set('label',group.name);
                group.options.each(function(option){
                    var opt = new Element('option', {
                        'value': option.value,
                        'html': option.text
                    });
                    if ($defined(option.selected) && option.selected) {
                        opt.set("selected", "selected");
                    }
                    gr.grab(opt);
                },this);
                this.field.grab(gr);
            },this);
        } else if ($defined(this.options.comboOpts)) {
            this.options.comboOpts.each(function (item) {
                this.addOption(item);
            }, this);
        }
    },

    /**
     * Method: addOption
     * add an option to the select list
     *
     * Parameters:
     * item - The option to add.
     * position (optional) - an integer index or the string 'top'.
     *                     - default is to add at the bottom.
     */
    addOption: function (item, position) {
        var opt = new Element('option', {
            'value': item.value,
            'html': item.text
        });
        if ($defined(item.selected) && item.selected) {
            opt.set("selected", "selected");
        }
        var where = 'bottom';
        var field = this.field;
        if ($defined(position)) {
            if (Jx.type(position) == 'integer' &&
                (position >= 0  && position < field.options.length)) {
                field = this.field.options[position];
                where = 'before';
            } else if (position == 'top') {
                where = 'top';
            }

        }
        opt.inject(field, where);
    },

    /**
     * Method: removeOption
     * removes an option from the select list
     *
     * Parameters:
     *  item - The option to remove.
     */
    removeOption: function (item) {
        //TBD
    },
    /**
     * Method: setValue
     * Sets the value property of the field
     *
     * Parameters:
     * v - The value to set the field to.
     */
    setValue: function (v) {
        if (!this.options.readonly) {
            //loop through the options and set the one that matches v
            $$(this.field.options).each(function (opt) {
                if (opt.get('value') === v) {
                    document.id(opt).set("selected", true);
                }
            }, this);
        }
    },

    /**
     * Method: getValue
     * Returns the current value of the field.
     */
    getValue: function () {
        var index = this.field.selectedIndex;
        //check for a set "value" attribute. If not there return the text
        if (index > -1) {
            var ret = this.field.options[index].get("value");
            if (!$defined(ret)) {
                ret = this.field.options[index].get("text");
            }
            return ret;
        }
    },
    
    /**
     * APIMethod: empty
     * Empties all options from this select
     */
    empty: function () {
        if ($defined(this.field.options)) {
            $A(this.field.options).each(function (option) {
                this.field.remove(option);
            }, this);
        }
    }
});// $Id: textarea.js 649 2009-11-30 22:19:48Z pagameba $
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
        template: '<span class="jxInputContainer"><label class="jxInputLabel"></label><textarea class="jxInputTextarea" name="{name}"></textarea><span class="jxInputTag"></span></span>'
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
     * APIMethod: render
     * Creates the input.
    */
    render: function () {
        this.parent();

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
        template: '<span class="jxInputContainer"><label class="jxInputLabel"></label><div class="jxInputButton"></div><span class="jxInputTag"></span></span>'
    },
    
    button: null,
    
    /**
     * Property: type
     * The type of this field
     */
    type: 'Button',

    processTemplate: function(template, classes, container) {
        var h = this.parent(template, classes, container);
        this.button = new Jx.Button(this.options.buttonOptions);
        var c = h.get('jxInputButton');
        if (c) {
            this.button.domObj.replaces(c);
        }
        return h;
    },
    
    click: function() {
        this.button.clicked();
    }
});// $Id: password.js 649 2009-11-30 22:19:48Z pagameba $
/**
 * Class: Jx.Field.Password
 *
 * Extends: <Jx.Field.Text>
 *
 * This class represents a password input field.
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
Jx.Field.Password = new Class({

    Extends: Jx.Field,

    options: {
        template: '<span class="jxInputContainer"><label class="jxInputLabel" ></label><input class="jxInputPassword" type="password" name="{name}"/><span class="jxInputTag"></span></span>'
    },

    type: 'Password'
});