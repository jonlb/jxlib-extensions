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
// $Id: common.js 648 2009-11-30 21:26:44Z pagameba $
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
}))();// $Id: object.js 656 2009-12-01 18:41:44Z jonlb@comcast.net $
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

});// $Id: list.js 666 2009-12-11 15:25:07Z zak4ms $
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
        var column = this.resolveCol(column);
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

// $Id: combo.js 647 2009-11-26 16:23:24Z pagameba $
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
});// $Id: panelset.js 626 2009-11-20 13:22:22Z pagameba $
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
// $Id: field.js 649 2009-11-30 22:19:48Z pagameba $
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




// $Id: form.js 649 2009-11-30 22:19:48Z pagameba $
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
        name: ''
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
            var field = document.id(key).retrieve('field');
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
// $Id: checkbox.js 649 2009-11-30 22:19:48Z pagameba $
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
// $Id: radio.js 649 2009-11-30 22:19:48Z pagameba $
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




// $Id: select.js 649 2009-11-30 22:19:48Z pagameba $
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