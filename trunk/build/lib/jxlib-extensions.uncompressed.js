/******************************************************************************
 * JxLib-Extensions - A JxLib UI Extension Library, .1-alpha 
 * Copyright (c) 2008-2009, Sola Gratia Designs. All rights reserved.
 * MIT Style License
 *****************************************************************************/
/**
 * Class: Jx.Request
 * Class that is used to wrap the mootools AJAX request object to make its use as transparent as
 * possible. This is used for funneling all requests so that common processing can take place. 
 * It was originally designed for a specific application but was made generic for future use.
 * 
 * This class will allow us to use loading images as well as giving us the ability to send and
 * track multiple requests. It provides for common debug handling, assigning unique request IDs 
 * (in a particular session), application wide common error handling (while still allowing callers 
 * to handle problems not handled by the wider application). 
 * 
 * The server will need to return the following object as JSON including the appropriate parts:
 * 
 * (code)
 * { 
 *     requestId: X,			//return the ID as was sent to the server in the request
 *     success: true|false,		//whether the request was successfully processed or not
 *     debug: {debug data},		//debug data
 *     error: {
 *     	 code: X,				//applicable error code, if there is one
 *     	 message: ''			//any error message(s)
 *     },
 *     data: {returned data}	//any data that was requested
 * }
 * (end)
 * 
 * Options:
 * debug - whether we are in debug mode
 * showLoading - whether we need to show the loading mask
 * loadingClass - the class to use to invoke the loading mask
 * loadingElementId - the id of the element that we put the loadingClass on to display the mask
 * url - the url to connect to
 * method - the connection method (post | get)
 * type - the type of request to make (json | html | other)
 * update - if type is html, this is the element to update with the results
 * evalScripts - whether to evaluate scripts in the returned html
 * evalResponse - whether to evaluate the response
 * 
 * Events:
 * onSuccess(data) - called when the request is successful
 * onFailure(request) - called when the request fails
 * onDebug(data.debug) - called when we are in debug mode on a successful response to display debug info
 * onError(data) -  called on receiving a "success=false" from the request
 */
Jx.Request = new Class({
	
	Extends: Jx.Object,
	
	requests: [],
	requestCount: 0,
	loadingVisible: false,
	errorHandlers: null,
	processRequests: true,
	running: false,
	
	options: {
		//events - i.e. callbacks for this request
        //events: {
		   // onSuccess: $empty,		//fired on receiving a success=true from the server
		    //onFailure: $empty,		//fired if mootools request fires a failure
		    //onDebug: $empty,		//used to display debug info if set
		    //onError: $empty		//fired on receiving a success=false from the server
        //},
		
		//flags
		debug: false,
		showLoading: {
            el: null,
            opts: {
                baseHref: '',
                img: {
                    src: '/images/load.gif',
                    styles: {
                        width: 16,
                        height: 16
                    }
                }
            }
        },
		
			
		//options
		url: null,
		method: 'get',
		type: 'json',
		update: null,
		evalScripts: true,
		evalResponse: false,
		data: {}
		
	},
	
	/**
	 * Method: init
	 * Function used to initialize the mootools request object for this request.
	 * 
	 * Parameters:
	 * options - the class options as defined above
	 * 
	 * returns: 
	 * A hash including the options and the request
	 */
	init: function (options) {
		
		//merge the passed options with the base options
		var opts = $merge(this.options, options);
		
		//increment the requestCount which provides a unique ID for this
		//request
		this.requestCount++;
		
		//create a hash to contain the info for this particular request
		var r = new Hash({requestId: this.requestCount, options: opts});
		
		opts.data.requestId = r.get('requestId');
		
		//create the request object itself
		var request = null;
		if (opts.type === 'json') {
			request = new Request.JSON({
				url: opts.url,
				data: opts.data,
				onSuccess: this.processSuccess.bind(this),
				onFailure: (function (instance) {
					this.failure(instance, r.get('requestId'));
				}).bind(this)
			});
		} else if (opts.type === 'html') {
			request = new Request.HTML({
				url: opts.url,
				update: opts.update,
				data: opts.data,
				evalScripts: opts.evalScripts,
				onSuccess: (function (responseTree, responseElements, responseHTML, responseJavaScript) {
					this.success(r.get('requestId'), [responseTree, responseElements, responseHTML, responseJavaScript]);
				}).bind(this),
				onFailure: (function (instance) {
					this.failure(instance, r.get('requestId'));
				}).bind(this)
			});
		} else {
			request = new Request({
				url: opts.url,
				data: opts.data,
				evalResponse: opts.evalResponse,
				onSuccess: (function (responseText, responseXML) {
					this.success(r.get('requestId'), [responseText, responseXML]);
				}).bind(this),
				onFailure: this.failure.bind(this)
			});
		}
		r.combine({'request': request});
		
		return r;
	},
	
	/**
	 * Method: failure
	 * called when request fails
	 * 
	 * Parameters:
	 * instance - the request instance itself
	 * id - the id of the request
	 */
	failure: function (instance, id) {
		var req = this.getRequest(id);
		var opt = req.get('options');
		this.removeMask(opt);
		if ($defined(opt.events) && $defined(opt.events.onFailure)) {
    		opt.events.onFailure.run(instance);
    	}
		this.running = false;
		this.run();
	},
	
	/**
	 * Method: success
	 * called when success happens and the request is not json.
	 * 
	 * Parameters:
	 * id - the id of the request
	 * args - the arguments sent to the success function by the request [responseTree, responseElements, responseHTML, responseJavaScript]
	 */
	success: function (id, args) {
		var req = this.getRequest(id);
		var opt = req.get('options');
		this.removeMask(req);
		this.running = false;
		this.run();
		if ($defined(opt.events) && $defined(opt.events.onSuccess)) {
        	opt.events.onSuccess.run(args);
        }
		
		
	},
	
	/**
	 * Method: callServer
	 * Used to send the request to the server.
	 * 
	 * Parameters:
	 * data - any data to send to the server
	 * options - class options as listed above
	 * 
	 * Returns:
	 * the request id
	 */
	callServer: function (data, options, position, hold) {
	    if (!$defined(position)) {
	        position = 'bottom';
	    }
	    
	    hold = $defined(hold) ? hold : false;
	    
		var d;
			
		if ($defined(data)) {
            var type = $type(data);
            if (type !== 'hash') {
                d = new Hash(data);
            } else {
                d = data;
            }
        } else {
            if ($type(options) === 'hash') {
                if (!options.has('data')) {
                    d = new Hash();
                } else {
                    d = options.get('data');
                }
            } else {
                d = new Hash();
            }
        }
        
		var req;
		if ($type(options) !== 'hash') {
		    options.data = d;
			req = this.init(options);
			req.set('data', d);
		} else {
			req = options;
		}
		
		req.combine({'data': d});
		if (position === 'top') {
		    this.requests.unshift(req);
		} else {
		    this.requests.push(req);
		}
		
		if (!hold) {
		    this.run();
		}
		
		return req.get('requestId');
			    
	},
	
	run: function (override) {
	    override = ($defined(override)) ? override : false;
	    //as long as a request isn't in process and stop() hasn't been called.
	    if ((!this.running && this.processRequests && (this.requests.length > 0)) || override) {
	        this.running = true;
	        //we haven't dispatched a request yet... do one!
	        var req = this.currentRequest = this.requests.shift();
	        var opts = req.get('options');
	        
	        //activate loading mask if requested
	        if (opts.showLoading.el && !req.has('waiter')) {
                var w = new Spinner(opts.showLoading.el, opts.showLoading.opts);
                w.start();
                req.set('waiter', w);
            } else if (opts.showLoading.el && req.has('waiter')) {
                req.get('waiter').start();
            }
                
            req.get('request').send();
	    }
	},
	
	/**
	 * Method: runOne
	 * Used to force only one request to run. Used when stop() was called
	 * to stop processing the queue but we still need to call just 
	 * the next request.
	 */
	runOne: function () {
	    this.run(true);
	},
	
	/**
	 * Method: processSuccess
	 * Called to process the success data returned from a json request
	 * 
	 * Parameters:
	 * data - the returned json object, evaluated
	 * text - the returned json object, not evaluated.
	 * 
	 * Returns:
	 * false on error, otherwise nothing
	 */
	processSuccess: function (data, text) {
		
		//find the appropriate request hash
		if ($defined(data)) {
			var req = this.currentRequest;
			var options = req.get('options');
			this.removeMask();
			this.running = false;
	        this.run();
	        
			try {    		
		    	//call debug first
		    	if (options.debug && $defined(data.debug)) {
		    	    if ($defined(options.events.onDebug)) {
	                	options.events.onDebug.run(data.debug);
	                }
		    	}
		    	
		    	if (data.success) {
		    		if ($defined(options.events.onSuccess)) {
	            		options.events.onSuccess.run(data);
	            	}
		    	} else {
		    		//first try to handle the error globally
		    		if (!this.handleError(data, req, options)) {
		    			//then pass everything to the registered error handler
		    			if ($defined(options.events.onError)) {
		    				options.events.onError.run(data);
		    			}
		    		}
		    	}
		    } catch (err) {
		    	//this is obviously an error that we didn't expect
		        //TODO: change this to a Jx.Dialog.Message class
		        var msg = 'Error occurred: ' + err.message;
		        msg += '<br/>in ' + err.fileName;
		        msg += '<br/>at line ' + err.lineNumber;
		        msg += '<br/>Stack Trace:<br/>' + err.stack;
		        if ($defined(Jx.Dialog.Message)) {
		            var dlg = new Jx.Dialog.Message({
		                message: msg,
		                width: 700,
		                height: 400,
		                resize: true
		            });
		            dlg.open();
		        } else {
		            alert(msg);
		        }
	    	}
		} else {
			console.log(text);
		}
		
	    
	},
	
	/**
	 * Method: getRequest
	 * gets the request and removes it from the request array
	 * 
	 * Parameters:
	 * requestId - the id of the request we're looking for
	 * 
	 * Returns:
	 * the request, if found. null, if not found.
	 */
	getRequest: function (requestId) {
		var req = null;
		this.requests.each(function (item) {
			if (item.get('requestId') === requestId) {
				req = item;
			}
		}, this);
		if ($defined(req)) {
			this.requests.erase(req);
		}
		return req;
	},
	
	/**
	 * Method: removeMask
	 * Removes the loading mask.
	 * 
	 * Parameters:
	 * req - the request hash
	 */
	removeMask: function () {
		if (this.currentRequest.has('waiter')) {
		    var w = this.currentRequest.get('waiter');
		    w.stop();
		    this.currentRequest.erase('waiter');
		}
	},
	
	/**
	 * Method: handleError
	 * Used to handle errors if an error handler is registered with <addErrorHandler>
	 * 
	 * Parameters:
	 * data - the data from the request
	 * req - the request object itself
	 * opts - the options for the request
	 * 
	 * Returns:
	 * true if handled, false if not.
	 */
	handleError: function (data, req, opts) {
		if ($defined(this.errorHandlers)) {
			if ($defined(data.error)) {
				var code = data.error.code;
				var message = data.error.message;
				if (this.errorHandlers.has(code)) {
					var handler = this.errorHandlers.get(code);
					handler.run([message, req]);
					this.removeMask(opts);
					return true;
				}
			}
		}
		return false;
	},
	
	/** 
	 * Method: addErrorHandler
	 * Used to add error handlers to the request
	 * 
	 * Parameters:
	 * code - the error code this handler corresponds to
	 * handler - the function to run to handle the error
	 */
	addErrorHandler: function (code, handler) {
		if (!$defined(this.errorHandlers)) {
			this.errorHandlers = new Hash();
		}
		this.errorHandlers.set(code, handler);
	},
	
	/** 
	 * Method: stop
	 * called to stop processing requests
	 */
	stop: function () {
		this.processRequests = false;
	},
	
	/** 
	 * Method: start
	 * called to start processing requests after a call to <stop>.
	 * Immediately begins running.
	 */
	start: function () {
		this.processRequests = true;
		this.run();
	}
});

/**
 * Class: Jx.Manager
 * This class is used to create managers to 
 * control stores, widgets, or other components
 * 
 * Options:
 * type - What type of manager to create. 
 * 	 The framework automatically creates Jx.StoreMgr for stores
 *
 * Usage:
 * 	
 * > var mgr = new Jx.Manager({type:'myType'});
 * 
 */
Jx.Manager = new Class({
	
	Family: 'Jx.Manager',
	
	Implements: [Options, Events],
		
	options: {
		type:'generic'
	},
	
	
	list: null,
	count: 0,
	
	/**
	 * Constructor: Jx.Manager
	 * initializes the class
	 */
	initialize: function(options){
		this.setOptions(options);
		this.list = new Hash();
		window.addEvent('unload', this.destroyAll.bind(this));
	},
	
	/**
	 * Method: register
	 * Registers object with the manager
	 * 
	 * Paramaters:
	 * el - the object to register
	 * 
	 * Returns: 
	 * The id of the object (autogenerated if it doesn't already have one)
	 */
	register: function(el){
		if ($defined(el.options.id)) {
			id = el.options.id;
		} else {
			id = this._genId();
		}
		
		this.list.include(id,el);
		return id;
	},
	
	/**
	 * Method: destroy
	 * Removes an object from the manager
	 * 
	 * Parameters:
	 * id - the id of the object to remove
	 */
	destroy: function(id){
		if (this.list.has(id)) {
			el = this.list.get(id);
			if ($defined(el.destroy) && $type(el.destroy)==='function'){
				el.destroy();
			}
			this.list.erase(id);
		}
	},
	
	/**
	 * Method: destroyAll
	 * Removes all of the objects from the manager calling their individual
	 * destroy function.
	 */
	destroyAll: function(){
		this.list.each(function(value, key){
			this.destroy(key);
		},this);
	},
	
	/**
	 * Method: get
	 * Used to retrieve objects from the manager by ID
	 * 
	 * Parameters:
	 * id - the id of the object to retrieve
	 * 
	 * Returns:
	 * the object or null
	 */
	get: function(id){
		if (this.list.has(id)) {
			return this.list.get(id);
		} else {
			return null;
		}
	},
	
	/**
	 * Method: _genId
	 * Private function used to generate an id if an object doesn't have one
	 * 
	 * Returns:
	 * an autogenerated id
	 */
	_genId: function(){
		this.count++;
		return 'jx-'+this.options.type+'-'+this.count;
	}
});

/**
 * Section: Manager extensions
 */

/**
 * Object: Jx.StoreMgr
 * Store Manager
 * 
 * Extends:
 * Jx.Manager
 * 
 */
Jx.StoreMgr = new Jx.Manager({type:'store'});/** 
 * Class: Jx.Preloader
 * Class designed to preload images for web pages. It loades them into a hash but doesn't inject them
 * into the page. After all the images are loaded it passes the Hash of images back to the caller via the 
 * onComplete event.
 * 
 * Events:
 * > onProgress(loaded, total);
 * > onComplete(Hash);   //Hash of pictures loaded
 */
Jx.Preloader = new Class({
	
	Family: 'Jx.Preloader',
	
	Implements: [Events, Options],
	
	options: {
		onProgress: $empty,
		onComplete: $empty	
	},
	
	counter: 0,
	loadedCounter: 0,
	picHash: null,
	sources: null,
	
	/**
	 * Constructor: Jx.Preloader
	 * Initializes the class
	 * 
	 * parameters:
	 * options - class options (onProgress and onComplete functions)
	 * pics - an array of keys and sources [{key: 'key', source: 'image.jpg'},...]
	 */
	initialize: function(options,pics){
		this.setOptions(options);
		this.picHash = new Hash();
		this.sources = new Hash();
		pics.each(function(i){
			this.add(i.key,i.source);
		},this);
	},
	
	/**
	 * Method: add
	 * Adds an image source to load
	 * 
	 * Parameters:
	 * key - the key used to reference this image
	 * source - where to load the image from
	 */
	add: function(key, source){
		this.counter++;
		this.sources.include(key, source);
	},
	
	/**
	 * Method: imageComplete
	 * Called when an image finishes loading
	 */
	imageComplete: function(){
		this.loadedCounter++;
		this.fireEvent('progress',[this.counter,this.loadedCounter]);
		if (this.counter == this.loadedCounter) {
			this.fireEvent('complete', [this.picHash]);
		}
	},
	
	/**
	 * Method: start
	 * Called to begin the actual loading of images
	 */
	start: function(){
		this.fireEvent('progress',[this.counter, this.loadedCounter]);
		this.sources.each(function(source, key){
			var img = new Asset.image(source, {
				'onload': this.imageComplete.bind(this)
			});
			this.picHash.include(key, img);
		},this);
	}
});/**
 * Class: Jx.Editor
 * a very simplistic IFrame-based WYSIWYG editor.
 * 
 * Inspired by (and a great deal of code from) mooEditable
 */
Jx.Editor = new Class({
    
    Family: 'Jx.Editor',
    Extends: Jx.Widget,
    
    options: {
        template: '<div class="jxEditor"><div class="jxEditorToolbar"></div><div class="jxEditorIframe"></div><textarea class="jxEditorTextarea"></textarea></div></div>',
        editorCssFile: null,
        html: '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"></head><body></body></html>',
        content: null,
        /**
         * Option: buttons
         * an array of arrays. Each separate array represents the buttons for a single toolbar.
         */
        buttons: null,
        cleanup: true,
        xhtml : true,
        semantics : true,
        textareaName: 'editor'
        
    },
    
    classes: $H({
        domObj: 'jxEditor',
        container: 'jxEditorToolbar',
        iframe: 'jxEditorIframe',
        textarea: 'jxEditorTextarea'
    }),
    
    pluginNamespace: 'Editor',
    
    blockEls: /^(H[1-6]|HR|P|DIV|ADDRESS|PRE|FORM|TABLE|LI|OL|UL|TD|CAPTION|BLOCKQUOTE|CENTER|DL|DT|DD)$/i,
    
    init: function () {
        this.parent();
    },
    
    mode: null,
    
    keys: {},
    
    editorDisabled: false,
    
    toolbars: [],
    
    render: function () {
        this.parent();
        
        //add name to textarea
        this.textarea.set('name', this.options.textareaName);
        
        //create the toolbar
        var i = $splat(this.options.buttons).length;
        for (var j = 0; j < i; j++) {
            var c = new Jx.Toolbar.Container().addTo(this.container);
            this.toolbars.push(new Jx.Toolbar());
            c.add(this.toolbars[j]);
        }
        
        
        if (this.options.parent) {
            this.addTo(this.options.parent);
            new Jx.Layout(this.domObj);
        }
        this.domObj.resize();
        
        
        var dimensions = this.iframe.getMarginBoxSize();
        var iframe = new IFrame({
            'class': 'jxEditorIframe',
            src: 'javascript:""',
            frameborder: 0
        });
        
        iframe.replaces(this.iframe);
        this.iframe = iframe;
        
        this.mode = 'iframe';
        
        this.win = this.iframe.contentWindow;
        this.doc = this.win.document;
        
        this.doc.open();
        this.doc.write(this.options.html);
        this.doc.close();
        
        if (!this.win.$family) {
            new Window(this.win);
        }
        if (!this.doc.$family) {
            new Document(this.doc);
        }
        document.id(this.doc.body);
        
        
        
        if ($defined(this.options.editorCssFile)) {
            this.css = new Asset.css(this.options.editorCssFile, {
                title: 'jxEditorStylesheet',
                onload: function () {
                    
                }.bind(this)
            });
            this.css.inject(this.doc.head);
        }
        
        if ($defined(this.options.content)) {
            this.doc.body.set('html',this.options.content);
            this.textarea.set('value', this.options.content);
        }
        
        if (Browser.Engine.trident) {
            this.doc.body.contentEditable = true;
        } else {
            this.doc.designMode = 'On';
        }
        
        this.selection = new Jx.Editor.Selection(this.win);
        
        //add events to doc
        this.doc.addEvents({
            mouseup: this.editorMouseUp.bindWithEvent(this),
            mousedown: this.editorStopEvent.bindWithEvent(this,'MouseDown'),
            mouseover: this.editorStopEvent.bindWithEvent(this,'MouseOver'),
            mouseout: this.editorStopEvent.bindWithEvent(this,'MouseOut'),
            mouseenter: this.editorMouseEnter.bindWithEvent(this),
            mouseleave: this.editorStopEvent.bindWithEvent(this,'MouseLeave'),
            contextmenu: this.editorStopEvent.bindWithEvent(this,'ContextMenu'),
            click: this.editorClick.bindWithEvent(this),
            dblclick: this.editorStopEvent.bindWithEvent(this, 'DoubleClick'),
            keypress: this.editorKeyPress.bindWithEvent(this),
            keyup: this.editorKeyUp.bindWithEvent(this),
            keydown: this.editorKeyDown.bindWithEvent(this),
            focus: this.editorFocus.bindWithEvent(this),
            blur: this.editorBlur.bindWithEvent(this)
        });
        this.win.addEvents({
            focus: this.editorFocus.bindWithEvent(this),
            blur: this.editorBlur.bindWithEvent(this)
        });
        ['cut','copy','paste'].each(function(event){
            this.doc.body.addListener(event, this.editorStopEvent.bindWithEvent(this,event.capitalize()));
        },this);
        this.textarea.addEvent('keypress', this.textarea.retrieve('jx:textareaKeyListener', this.keyListener.bind(this)));
        
        //window focus event not firing in firefox 2
        if (Browser.Engine.gecko && Browser.Engine.version == 18) {
            this.doc.addEvent('focus', function(){
                this.win.fireEvent('focus').focus();
            }.bind(this));
        }
        
        this.oldContent = this.getContent();
        
        this.domObj.store('Jx.Editor',this);
        this.resize();
        
        this.addEvent('postPluginInit', function(){
            //now loop through button arrays and init the plugins
            this.options.buttons.each(function(bar, index){
                this.options.plugins = bar;
                this.toolbar = this.toolbars[index];
                this.initPlugins();
            },this);
        }.bind(this));
    },
    
    setContent: function (content) {
        this.doc.body.set('html', content);
        return this;
    },
    
    getContent: function () {
        return this.doc.body.get('html');
    },
    
    execute: function (command, param1, param2) {
        if (this.busy) return;
        this.busy = true;
        this.doc.execCommand(command, param1, param2);
        this.saveContent();
        this.focus();
        this.busy = false;
        return false;
    },
    
    toggleView: function () {
        this.fireEvent('preToggleView', this);
        if (this.mode === 'textarea') {
            this.mode = 'iframe';
            this.iframe.setStyle('display','block');
            this.setContent(this.textarea.value);
            this.textarea.setStyle('display', 'none');
        } else {
            this.saveContent();
            this.mode = 'textarea';
            this.textarea.setStyle('display','block');
            this.iframe.setStyle('display','none');
        }
        this.fireEvent('postToggleView', this);
    },
    
    saveContent: function () {
        //console.log('editor save content');
        if (this.mode === 'iframe') {
            this.textarea.set('value', this.cleanup(this.getContent()));
            //console.log('value saved:' + this.textarea.get('value'));
        }
        return this;
    },
    
    resize: function () {
        var dimensions = this.domObj.getContentBoxSize();
        var tbDimensions = this.container.getMarginBoxSize();
        
        var styles = {
            width: dimensions.width,
            height: dimensions.height - tbDimensions.height
        };
        this.iframe.setStyles(styles);
        this.textarea.setStyles(styles);
    },
    
    focus: function () {
        if (this.mode == 'iframe') {
            this.win.focus();
        } else {
            this.textarea.focus();
        }
        this.fireEvent('focus', this);
        return this;
    },
    
    /**
     * Editor Events
     */
    
    editorStopEvent: function (e, event) {
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        //console.log('stop event...' + event);
        this.fireEvent('editor'+event, [e, this]);
    },
    
    editorFocus: function (e) {
        //console.log('editor focus event');
        this.oldContent = '';
        this.fireEvent('editorFocus', [e, this]);
    },
    
    editorBlur: function (e) {
        //console.log('editor blur event');
        this.oldContent = this.saveContent().getContent();
        this.fireEvent('editorBlur', [e, this]);
    },
    
    editorMouseUp: function (e) {
        //console.log('editor mouseup event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        this.checkStates();
        
        this.fireEvent('editorMouseUp', [e, this]);
    },
    
    editorMouseEnter: function (e) {
        //console.log('editor mouseenter event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        
        if (this.oldContent && this.getContent() != this.oldContent) {
            this.focus();
            this.fireEvent('editorPaste', [e, this]);
        }
        
        this.fireEvent('editorMouseEnter', [e, this]);
    },
    
    editorClick: function (e) {
        //console.log('editor click event');
        if (Browser.Engine.webkit) {
            var el = $(e.target);
            if (el.get('tag') == 'img'){
                this.selection.selectNode(el);
            }
        }
        
        this.fireEvent('editorClick', [e, this]);
    },
    
    editorKeyPress: function (e) {
        //console.log('editor key press event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        
        this.keyListener(e);
        
        this.fireEvent('editorKeyPress', [e, this]);
    },
    
    editorKeyUp: function (e) {
        //console.log('editor key up event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        
        var c = e.code;
        if (/^enter|left|up|right|down|delete|backspace$/i.test(e.key) || (c >= 33 && c <= 36) || c == 45 || e.meta || e.control ) {
            if (Browser.Engines.trident4) {
                $clear(this.checkStateDelay);
                this.checkStatesDelay = this.checkStates.delay(500, this);
            } else {
                this.checkStates();
            }
        }
        
        this.fireEvent('editorKeyUp', [e, this]);
    },
    
    editorKeyDown: function (e) {
        //console.log('editor key down event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        
        if (e.key == 'enter') {
            if (e.shift && Browser.Engine.webkit) {
                var s = this.selection;
                var r = s.getRange();
                
                var br = this.doc.createElement('br');
                r.insertNode(br);
                
                r.setStartAfter(br);
                r.setEndAfter(br);
                s.setRange(r);
                
                if (s.getSelection().focusNode == br.previousSibling) {
                    var nbsp = this.doc.createTextNode('\u00a0');
                    var p = br.parentNode;
                    var ns = br.nextSibling;
                    (ns) ? p.insertBefore(nbsp, ns) : p.appendChild(nbsp);
                    s.selectNode(nbsp);
                    s.collapse(1);
                }
                
                this.win.scrollTo(0, Element.getOffsets(s.getRange().startContainer).y);
                
                e.preventDefault();
            } else if (Browser.Engine.gecko || Browser.Engine.webkit) {
                var node = this.selection.getNode();
                var isBlock = node.getParents().include(node).some(function(el){
                    return el.nodeName.test(this.blockEls);
                }.bind(this));
                if (!isBlock) this.execute('insertparagraph', false, false);
            }
        } else {
            if (Browser.Engine.trident) {
                var r= this.selection.getRange();
                var node = this.selection.getNode();
                if (r && node.get('tag') != 'li') {
                    this.selection.insertContent('<br>');
                    this.selection.collapse(false);
                }
                e.preventDefault();
            }
        }
        
        if (Browser.Engine.presto) {
            var ctrlmeta = e.control || e.meta;
            if (ctrlmeta && e.key == 'x') {
                this.fireEvent('editorCut', [e, this]);
            } else if (ctrlmeta && e.key == 'c') {
                this.fireEvent('editorCopy', [e, this]);
            } else if ((ctrlmeta && e.key == 'v') || (e.shift && e.code == 45) ) {
                this.fireEvent('editorPaste', [e, this]);
            }
        }
        
        this.fireEvent('editorKeyDown', [e, this]);
        
    },
    
    keyListener: function (e) {
        var key = (Browser.Platform.mac) ? e.meta : e.control;
        if (!key || !this.keys[e.key]) return;
        e.preventDefault();
        var plugin = this.keys[e.key];
        plugin.command();
        if (this.mode == 'iframe') this.checkStates();
    },
    
    checkStates: function () {
        var element = this.selection.getNode();
        if (!element) return;
        if (Jx.type(element) != 'element') return;
        
        this.plugins.each(function(plugin){
            if ($defined(plugin.checkState)) {
                plugin.checkState(element);
            }
        },this);
    },
    
    cleanup: function(source){
        if (!this.options.cleanup) return source.trim();
        
        do {
            var oSource = source;

            // Webkit cleanup
            source = source.replace(/<br class\="webkit-block-placeholder">/gi, "<br />");
            source = source.replace(/<span class="Apple-style-span">(.*)<\/span>/gi, '$1');
            source = source.replace(/ class="Apple-style-span"/gi, '');
            source = source.replace(/<span style="">/gi, '');

            // Remove padded paragraphs
            source = source.replace(/<p>\s*<br ?\/?>\s*<\/p>/gi, '<p>\u00a0</p>');
            source = source.replace(/<p>(&nbsp;|\s)*<\/p>/gi, '<p>\u00a0</p>');
            if (!this.options.semantics){
                source = source.replace(/\s*<br ?\/?>\s*<\/p>/gi, '</p>');
            }

            // Replace improper BRs (only if XHTML : true)
            if (this.options.xhtml){
                source = source.replace(/<br>/gi, "<br />");
            }

            if (this.options.semantics){
                //remove divs from <li>
                if (Browser.Engine.trident){
                    source = source.replace(/<li>\s*<div>(.+?)<\/div><\/li>/g, '<li>$1</li>');
                }
                //remove stupid apple divs
                if (Browser.Engine.webkit){
                    source = source.replace(/^([\w\s]+.*?)<div>/i, '<p>$1</p><div>');
                    source = source.replace(/<div>(.+?)<\/div>/ig, '<p>$1</p>');
                }

                //<p> tags around a list will get moved to after the list
                if (['gecko', 'presto', 'webkit'].contains(Browser.Engine.name)){
                    //not working properly in safari?
                    source = source.replace(/<p>[\s\n]*(<(?:ul|ol)>.*?<\/(?:ul|ol)>)(.*?)<\/p>/ig, '$1<p>$2</p>');
                    source = source.replace(/<\/(ol|ul)>\s*(?!<(?:p|ol|ul|img).*?>)((?:<[^>]*>)?\w.*)$/g, '</$1><p>$2</p>');
                }

                source = source.replace(/<br[^>]*><\/p>/g, '</p>'); // remove <br>'s that end a paragraph here.
                source = source.replace(/<p>\s*(<img[^>]+>)\s*<\/p>/ig, '$1\n'); // if a <p> only contains <img>, remove the <p> tags

                //format the source
                source = source.replace(/<p([^>]*)>(.*?)<\/p>(?!\n)/g, '<p$1>$2</p>\n'); // break after paragraphs
                source = source.replace(/<\/(ul|ol|p)>(?!\n)/g, '</$1>\n'); // break after </p></ol></ul> tags
                source = source.replace(/><li>/g, '>\n\t<li>'); // break and indent <li>
                source = source.replace(/([^\n])<\/(ol|ul)>/g, '$1\n</$2>'); //break before </ol></ul> tags
                source = source.replace(/([^\n])<img/ig, '$1\n<img'); // move images to their own line
                source = source.replace(/^\s*$/g, ''); // delete empty lines in the source code (not working in opera)
            }

            // Remove leading and trailing BRs
            source = source.replace(/<br ?\/?>$/gi, '');
            source = source.replace(/^<br ?\/?>/gi, '');

            // Remove useless BRs
            source = source.replace(/><br ?\/?>/gi, '>');

            // Remove BRs right before the end of blocks
            source = source.replace(/<br ?\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1');

            // Semantic conversion
            source = source.replace(/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>');
            source = source.replace(/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>');
            source = source.replace(/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>');
            source = source.replace(/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>');
            source = source.replace(/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>');
            source = source.replace(/<strong><span style="font-weight: normal;">(.*)<\/span><\/strong>/gi, '$1');
            source = source.replace(/<em><span style="font-weight: normal;">(.*)<\/span><\/em>/gi, '$1');
            source = source.replace(/<span style="text-decoration: underline;"><span style="font-weight: normal;">(.*)<\/span><\/span>/gi, '$1');
            source = source.replace(/<strong style="font-weight: normal;">(.*)<\/strong>/gi, '$1');
            source = source.replace(/<em style="font-weight: normal;">(.*)<\/em>/gi, '$1');

            // Replace uppercase element names with lowercase
            source = source.replace(/<[^> ]*/g, function(match){return match.toLowerCase();});

            // Replace uppercase attribute names with lowercase
            source = source.replace(/<[^>]*>/g, function(match){
                   match = match.replace(/ [^=]+=/g, function(match2){return match2.toLowerCase();});
                   return match;
            });

            // Put quotes around unquoted attributes
            source = source.replace(/<[^>]*>/g, function(match){
                   match = match.replace(/( [^=]+=)([^"][^ >]*)/g, "$1\"$2\"");
                   return match;
            });

            //make img tags xhtml compatible <img>,<img></img> -> <img/>
            if (this.options.xhtml){
                source = source.replace(/<img([^>]+)(\s*[^\/])>(<\/img>)*/gi, '<img$1$2 />');
            }
            
            //remove double <p> tags and empty <p> tags
            source = source.replace(/<p>(?:\s*)<p>/g, '<p>');
            source = source.replace(/<\/p>\s*<\/p>/g, '</p>');
            
            // Replace <br>s inside <pre> automatically added by some browsers
            source = source.replace(/<pre[^>]*>.*?<\/pre>/gi, function(match){
                return match.replace(/<br ?\/?>/gi, '\n');
            });

            // Final trim
            source = source.trim();
        }
        while (source != oSource);

        return source;
    },
    
    enableToolbar: function () {
        this.plugins.each(function(plugin){
            plugin.setEnabled(true);
        },this);
    },
    
    disableToolbar: function () {
        this.plugins.each(function(plugin){
            plugin.setEnabled(false);
        },this);
    }
    
});
Jx.Editor.Selection = new Class({
    
    Family: 'Jx.Editor.Selection',
    Extends: Jx.Object,
    
    parameters: ["win", "options"],
    
    options: {},
    
    init: function () {
        this.parent();
        this.win = this.options.win;
    },
    
    getSelection: function(){
        this.win.focus();
        return (this.win.getSelection) ? this.win.getSelection() : this.win.document.selection;
    },

    getRange: function(){
        var s = this.getSelection();

        if (!s) return null;

        try {
            return s.rangeCount > 0 ? s.getRangeAt(0) : (s.createRange ? s.createRange() : null);
        } catch(e) {
            // IE bug when used in frameset
            return this.doc.body.createTextRange();
        }
    },

    setRange: function(range){
        if (range.select){
            $try(function(){
                range.select();
            });
        } else {
            var s = this.getSelection();
            if (s.addRange){
                s.removeAllRanges();
                s.addRange(range);
            }
        }
    },

    selectNode: function(node, collapse){
        var r = this.getRange();
        var s = this.getSelection();

        if (r.moveToElementText){
            $try(function(){
                r.moveToElementText(node);
                r.select();
            });
        } else if (s.addRange){
            collapse ? r.selectNodeContents(node) : r.selectNode(node);
            s.removeAllRanges();
            s.addRange(r);
        } else {
            s.setBaseAndExtent(node, 0, node, 1);
        }

        return node;
    },

    isCollapsed: function(){
        var r = this.getRange();
        if (r.item) return false;
        return r.boundingWidth == 0 || this.getSelection().isCollapsed;
    },

    collapse: function(toStart){
        var r = this.getRange();
        var s = this.getSelection();

        if (r.select){
            r.collapse(toStart);
            r.select();
        } else {
            toStart ? s.collapseToStart() : s.collapseToEnd();
        }
    },

    getContent: function(){
        var r = this.getRange();
        var body = new Element('body');

        if (this.isCollapsed()) return '';

        if (r.cloneContents){
            body.appendChild(r.cloneContents());
        } else if ($defined(r.item) || $defined(r.htmlText)){
            body.set('html', r.item ? r.item(0).outerHTML : r.htmlText);
        } else {
            body.set('html', r.toString());
        }

        var content = body.get('html');
        return content;
    },

    getText : function(){
        var r = this.getRange();
        var s = this.getSelection();
        return this.isCollapsed() ? '' : r.text || (s.toString ? s.toString() : '');
    },

    getNode: function(){
        var r = this.getRange();

        if (!Browser.Engine.trident){
            var el = null;

            if (r){
                el = r.commonAncestorContainer;

                // Handle selection a image or other control like element such as anchors
                if (!r.collapsed)
                    if (r.startContainer == r.endContainer)
                        if (r.startOffset - r.endOffset < 2)
                            if (r.startContainer.hasChildNodes())
                                el = r.startContainer.childNodes[r.startOffset];

                while ($type(el) != 'element') el = el.parentNode;
            }

            return document.id(el);
        }

        return document.id(r.item ? r.item(0) : r.parentElement());
    },

    insertContent: function (content) {
        if (Browser.Engine.trident){
            var r = this.getRange();
            r.pasteHTML(content);
            r.collapse(false);
            r.select();
        } else {
            this.win.document.execCommand('insertHTML', false, content);
        }
    }
});
Jx.Panel.Form = new Class({
    
    Family: 'Jx.Panel.Form',
    Extends: Jx.Panel,
    
    notices: $H(),
    
    options: {
        /**
         * Option: fields
         * an array of option objects that describe the various fields in the 
         * form. Each should have a type and fieldset objects can have children.
         * Formatted like so:
         * 
         * (code)
         * [{
         *     type: 'text',
         *     options: { ..options here.. }
         *  },{
         *      type: 'fieldset',
         *      options: { ..options for the fieldset.. },
         *      children: [ {},{},{} ]  //array of additional fields
         * }]
         * (end) 
         * 
         */
        fields: null,
        /**
         * Option: validators
         * This should be the config used in Jx.Plugin.Form.Validator
         */
        validators: null,
        /**
         * Option: notifierType
         * The type of notifier to use. Either 'float' or 'inline'.
         * Default is 'inline' which places the notifier at the top of the form.
         */
        notifierType: 'inline',
        /**
         * Option: formOptions
         * The options for the internal instance of Jx.Form
         */
        formOptions: null
        
        
    },
    
    init: function () {
        this.parent();
    },
    
    render: function () {
        this.form = new Jx.Form(this.options.formOptions);
       
        //create the notifier here so it will be at the top of the form
        if (this.options.notifierType === 'inline') {
            this.notifier = new Jx.Notifier({parent: $(this.form)});
        } else {
            this.notifier = new Jx.Notifier.Float({parent: document.body});
        }
        
        //add fields
        this.addFields(this.form, this.options.fields);
        this.options.content = $(this.form);
        
        this.parent();
        
        //create validator
        if ($defined(this.options.validators)) {
            this.validator = new Jx.Plugin.Form.Validator(this.options.validators);
            this.validator.attach(this.form);
        
            //connect validation events
            this.validator.addEvents({
                'fieldValidationFailed': this.fieldFailed.bind(this),
                'fieldValidationPassed': this.fieldPassed.bind(this)
            });
        }
        
    },
    
    addFields: function (container, options) {
        options.each(function(opt){
            var t = Jx.type(opt);
            if (t === 'element') {
                opt.inject($(this.form));
            } else if (opt instanceof Jx.Widget) {
                opt.addTo(this.form);
            } else if (t === 'object' && $defined(opt.type)) {
                if (opt.type.toLowerCase() === 'fieldset') {
                    var field = new Jx.Fieldset(opt.options);
                    container.add(field);
                    if ($defined(opt.children)) {
                        this.addFields(field, opt.children);
                    }
                } else {
                    var field = new Jx.Field[opt.type.capitalize()](opt.options);
                    container.add(field);
                }
            }
        },this);
    },
    
    fieldPassed: function (field, validator) {
        if (this.notices.has(field.id)) {
            this.notices.get(field.id).close();
        }
    },
    fieldFailed: function (field, validator) {
        var errs = validator.getErrors();
        var text = field.name + " has the following errors: " + errs.join(",") + ".";
        var notice = new Jx.Notice.Error({
            content: text,
            onClose: function(){
                this.notices.erase(field.id);
            }.bind(this)
        });
        this.notifier.add(notice);
        this.notices.set(field.id, notice);
    }
});/**
 * Class: Jx.Wizard
 * This is a simple wizard class that allows input through a variety of steps. It is based
 * on Jx.Dialog and utilizes <Jx.Form>.
 */
Jx.Dialog.Wizard = new Class({
	/**
	 * Extends: Jx.Dialog
	 */
	Extends: Jx.Dialog,
	
	options: {
		//dialog defaults
		resize: false,
		collapse: false,
		maximize: false,
		minimize: false,
		width: 400,
		height: 400,
		
		/**
		 * Option: validateOn
		 * Whether to validate on each step or only at the last step. Setting to
		 * 'steps' will not allow you to move past a step if there are errors. Valid
		 * options are 'steps' or 'finish' 
		 */
		validateOn: 'steps',
		/**
		 * Option: allowFinish
		 * Determines whether the finish button is activated on all steps or only
		 * at the last step. Valid options are 'last' or 'all'
		 */
		allowFinish: 'last',	
		/**
		 * Option: showSteps
		 * Determines whether the list view with steps is created or not. 
		 */
		showSteps: true,
		/**
		 * Option: hideSteps
		 * if true, and showSteps is true, the steps will be created but hidden. If false,
		 * and showSteps is true, the steps will appear in the left hand pane.
		 */
		hideSteps: false,
		/**
		 * Option: steps
		 * This is an array of objects making up the steps of the wizard. Each 
		 * step is an object that has a title element (shown in the step panel) 
		 * and a content element that can be a mootools element, a string indicating 
		 * an element to pull from the HTML page, a descendant of Jx.Widget, 
		 * or a config for a Jx.Panel.Form. It should also have
		 * a next element that is either null (indicating to move to the next 
		 * step), an integer (indicating the index of the next step), or a 
		 * function (will be called to determine the next step and should return
		 * an integer).
		 */
		steps:[]

		//events
		/**
		onFinish: $empty,		//called when wizard finishes
		onCancel: $empty
		*/
	},
	
	stepDefaults: {
		title: null,
		content: null,
		next: null
	},
	/**
	 * Property: steps
	 * An array where the class keeps all of the steps of
	 * the wizard in their panels.
	 */
	steps:[],
	/**
	 * Property: stepIndex
	 * Maintains a pointer into the steps array so we know where
	 * in the wizard we are.
	 */
	stepIndex: 0,
	
	/**
	 * Constructor: Jx.Wizard
	 * This method creates the wizard dialog from the passed in options
	 * 
	 * Parameters:
	 * options - the options to use in constructing the wizard
	 */
	render: function(){
		
		//create the content for the wizard
		
		toolbar = new Jx.Toolbar({'position': 'bottom'});
		//add buttons (prev,finish,next)
		this.prev = new Jx.Button({
	            label: 'Previous', 
				image: Jx.aPixel.src,
				imageClass: 'jxWizardPrev',
	            onClick: this.previousStep.bind(this)
		});
		this.next = new Jx.Button({
	            label: 'Next', 
				image: Jx.aPixel.src,
				imageClass: 'jxWizardNext',
	            onClick: this.nextStep.bind(this)
		});
		this.cancel = new Jx.Button({
	            label: 'Cancel', 
				image: Jx.aPixel.src,
				imageClass: 'jxWizardCancel',
	            onClick: this.close.bind(this)
		});
	    this.finish = new Jx.Button({
	            label: 'Finish',
				image: Jx.aPixel.src,
				imageClass: 'jxWizardFinish', 
	            onClick: this.finishWizard.bind(this)
	     });
		toolbar.add(this.prev,this.next,this.cancel,this.finish);
		this.addEvent('close',this.onCancel.bind(this));
		
		
		this.options.toolbars = [toolbar];
		
		if (!$defined(this.options.parent)){
			this.options.parent = document.body;
		}
		
		this.parent(this.options);
		
		this.domObj.addClass('jxWizard');
		
		//do we create the side bar?
		if (this.options.showSteps) {
			//create splitter
			this.split = new Jx.Splitter(this.content,{
				splitInto: 2,
				layout: 'horizontal',
				barOptions: [
					{snap: 'before'}
				],
				containerOptions: [{width:150}]
			});
			//create tree
			this.list = new Jx.ListView({
			    select: true
			});
			var numSteps = this.options.steps.length;
			this.list.list.addEvent('select', this.gotoStep.bind(this));
			
			this.list.list.empty();
            var templ = "<li class='jxListItemContainer jxWizardStep'><a class='jxListItem' href='javascript:void(0);'><img src='"+Jx.aPixel.src+"' class='itemImg jxWizardStepImage'><span class='itemLabel'>{name}</span></a></li>";
            
			this.options.steps.each(function(item, index){
			    var o = {};
                o.name = 'Step '+(index+1)+' of '+numSteps+' : '+item.title;
                var theTemplate = new String(templ).substitute(o);
                var litem = new Jx.ListItem({template:theTemplate, enabled: true});
                $(litem).store('stepIndex', index);
                this.list.add(litem);
                item.listItem = litem;
			},this);
			this.list.addTo(this.split.elements[0]);
			this.tabSet = new Jx.TabSet(this.split.elements[1]);
		} else {
			this.tabSet = new Jx.TabSet(this.content);
		} 
		
		//create the tabs (pages/steps) of the wizard
		this.options.steps.each(function(item){
			var opts = $merge(this.stepDefaults,item);
			var t = $type(item.content);
			var tab;
			if ($defined(t)) {
				switch (t) {
				    case "string":
				        tab = new Jx.Button.Tab({
				            content: $(item.content)
				        });
				        break;
					case "element":
						tab = new Jx.Button.Tab({
							content: item.content
						});
						break;
					case "object":
						if ($defined(item.content.domObj)) {
							tab = new Jx.Button.Tab({
								content: item.content.domObj
							});
						} else {
							//then we have a form config
						    if ($defined(item.content.buttons)) {
						        item.content.buttons = null;
						    }
						    if ($defined(item.content.toolbars)) {
						        item.content.toolbars = null;
						    }
							f = new Jx.Panel.Form(item.content);
							item.form = f;
							tab = new Jx.Button.Tab({
								content: $(f)
							});
						}
						break;
				}
				item.tab = tab;
				this.steps.include(item);
				this.tabSet.add(tab);
			}
		},this);
		
		$(this.content).addClass('jxWizard');
		if (this.options.hideSteps){
			this.split.bars[0].fireEvent('dblclick');
		}
		this.tabSet.setActiveTab(this.steps[0].tab);
		this.enableButtons();
	},
	/**
	 * Method: previousStep
	 * Moves the wizard to the previous step.
	 */
	previousStep: function(){
	    var p;
	    if ($defined(this.steps[this.stepIndex].previous)) {
	        p = this.steps[this.stepIndex].previous;
	        if (Jx.type(p) === 'function') {
	            p = p.apply(this);
	        }
	    } else {
	        p = this.stepIndex - 1;
	    }
		this.changeSteps(p);
	},
	/**
	 * Method: nextStep
	 * Moves the wizard to the next step.
	 */
	nextStep: function(){
		if (this.isFormValid()) {
		    var n;
		    if ($defined(this.steps[this.stepIndex].next)) {
		        n = this.steps[this.stepIndex].next;
	            if (Jx.type(n) === 'function') {
	                n = n.apply(this);
	            }
		    } else {
		        n = this.stepIndex + 1;
		    }
		    this.changeSteps(n);
		} 
	},
	/**
	 * Method: onCancel
	 * Cancels the wizard and fires the cancel event.
	 */
	onCancel: function(){
		this.fireEvent('cancel');
	},
	/**
	 * Method: finishWizard
	 * Verifies that all of the forms are valid, gathers
	 * the data, and fires the finish event. If any of the forms
	 * fail validation it will show the errors and move to that page.
	 */
	finishWizard: function(){
		//check all forms
		var valid = true;
		var data = new Hash();
		var firstErrorStep = -1;
		this.steps.each(function(item, index){
			if ($defined(item.form)){
				if (item.form.form.isValid()){
					data.extend(item.form.form.getValues());
				} else {
					valid = false;
					if (firstErrorStep === -1){
						firstErrorStep = index;
					}
				}
			}
		},this);
		
		if (valid){
			this.close();
			this.fireEvent('finish',data);
		} else {
			this.changeSteps(firstErrorStep);
		}
	},
	/**
	 * Method: gotoStep
	 * Moves to the step clicked in the left tree if it's shown.
	 * 
	 * Parameters:
	 * step - the step to move to
	 */
	gotoStep: function(item){
		if (this.isFormValid()) {
		    var step = $(item).retrieve('stepIndex');
			this.changeSteps(step);
		} 
	},
	/**
	 * Method: changeSteps
	 * Does the work of actually changing the step
	 * 
	 * Parameters:
	 * step - the step to move to
	 */
	changeSteps: function(step){
		this.stepIndex = step;
		this.steps[this.stepIndex].tab.setActive(true);
		this.enableButtons();
		this.fireEvent('showStep', [this,this.stepIndex]);
	},
	/**
	 * Method: isFormValid
	 * Determines if a step needs to be validated and, if so,
	 * actually invokes the form's isValid() method.
	 */
	isFormValid: function(){
		//check if we must validate forms
		if (this.options.validateOn === 'steps') {
			if ($defined(this.steps[this.stepIndex].form) && $defined(this.steps[this.stepIndex].form.form)) {
				return this.steps[this.stepIndex].form.form.isValid();
			}
		}
		return true;
	},
	/**
	 * Method: enableButtons
	 * Determines what buttons should be active on a particular step
	 * and ensures that they are active.
	 */
	enableButtons: function(){
		if (this.stepIndex === 0 && (this.steps.length > 1)) {
			this.prev.setEnabled(false);
			this.next.setEnabled(true);
		} else if (this.steps.length == 1) {
			this.prev.setEnabled(false);
			this.next.setEnabled(false);
		} else if (this.stepIndex === (this.steps.length - 1)) {
			this.prev.setEnabled(true);
			this.next.setEnabled(false);
		} else {
			this.prev.setEnabled(true);
			this.next.setEnabled(true);
		}
		if (this.options.allowFinish === 'all' || (this.options.allowFinish === 'last' && (this.stepIndex === (this.steps.length - 1)))) {
			this.finish.setEnabled(true);
		} else {
			this.finish.setEnabled(false);
		}
	}
});
/**
 * Jx.Adapter namespace
 */
Jx.Adapter = new Class({
    
    Family: 'Jx.Adapter',
    
    Extends: Jx.Object,
    
    options: {
        template: '',
        useTemplate: true
    },
    
    parameters: ['store','widget','options'],
    
    init: function () {
        this.parent();
        this.widget = this.options.widget;
        this.store = this.options.store;
        
        if (this.options.useTemplate) {
            this.columnsNeeded = this.parseTemplate();
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
    parseTemplate: function () {
        //we parse the template based on the columns in the data store looking
        //for the pattern {column-name}. If it's in there we add it to the
        //array of ones to look for
        var columns = this.store.getColumns();
        var arr = [];
        columns.each(function (col) {
            var s = '{' + col.name + '}';
            if (this.options.template.contains(s)) {
                arr.push(col.name);
            }
        }, this);
        return arr;
    }.protect(),
    
    /**
     * Method: fillTemplate
     * Actually does the work of getting the data from the store
     * and creating a single item based on the provided template
     * 
     * Parameters: 
     * index - the index of the data in the store to use in populating the
     *          template.
     */
    fillTemplate: function (index) {
        //create the item
        var itemObj = {};
        this.columnsNeeded.each(function (col) {
            itemObj[col] = this.store.get(col, index);
        }, this);
        return this.options.template.substitute(itemObj);
    }.protect(),
    
    /**
     * APIMethod: fill
     * Takes data from the store and fills in the widget object. This
     * should be implemented by the adapter subclasses.
     */
    fill: $empty
    
});/**
 * Class: Jx.Adapter.Tree
 * This base class is used to change a store (a flat list of records) into the
 * data structure needed for a Jx.Tree. It will have 2 subclasses: <Jx.Adapter.Tree.MPTT>
 * and <Jx.Adapter.Tree.Parent>
 * 
 *  
 */
Jx.Adapter.Tree = new Class({
    
    Family: 'Jx.Adapter.Tree',
    Extends: Jx.Adapter,
    
    Binds: ['fill','checkFolder'],
    
    options: {
        /**
         * Option: useAjax
         * Determines if this adapter should use ajax to request data on the
         * fly. 
         */
        useAjax: false,
        startingNodeKey: 0,
        folderOptions: {
            image: null,
            imageClass: null
        },
        itemOptions: {
            image: null,
            imageClass: null
        }
    },
    
    folders: new Hash(),
    
    currentRecord: 0,
    
    init: function () {
        this.parent();
        
        this.tree = this.widget;
        
        this.tree.addEvent('disclose', this.checkFolder);
        
        if (this.options.useAjax) {
            this.strategy = this.store.getStrategy('progressive');
        
            if (!$defined(this.strategy)) {
                this.strategy = new Jx.Store.Strategy.Progressive({
                    dropRecords: false,
                    getPaginationParams: function () { return {}; }
                });
                this.store.addStrategy(this.strategy);
            } else {
                this.strategy.options.dropRecords = false;
                this.strategy.options.getPaginationParams = function () { return {}; };
            }
            
        }
        
        this.store.addEvent('storeDataLoaded', this.fill);
        
        //initial store load
        this.store.load({
            node: this.options.startingNodeKey
        });
    },
    
    /**
     * APIMethod: fill
     * This function will start at this.currentRecord and add the remaining
     * items to the tree. 
     */
    fill: function () {
        var l = this.store.count() - 1;
        for (var i = this.currentRecord; i <= l; i++) {
            var template = this.fillTemplate(i);
            var item;
            if (this.hasChildren(i)) {
                //add as folder
                var item = new Jx.TreeFolder($merge(this.options.folderOptions, {
                    label: template
                }));
                
                this.folders.set(i,item);
            } else {
                //add as item
                var item = new Jx.TreeItem($merge(this.options.itemOptions, {
                    label: template
                }));
            }
            $(item).store('index', i);
            //check for a parent
            if (this.hasParent(i)) {
                //add as child of parent
                var p = this.getParentIndex(i);
                var folder = this.folders.get(p);
                folder.add(item);
            } else {
                //otherwise add to the tree itself
                this.tree.add(item);
            }
        }
        this.currentRecord = l;
    },
    
    checkFolder: function (folder) {
        var items = folder.items();
        if (!$defined(items) || items.length === 0) {
            //get items via the store
            this.store.load({
                node: $(folder).retrieve('index')
            });
        }
    },
    
    hasChildren: $empty,
    
    hasParent: $empty,
    
    getParentIndex: $empty
    
    
});/**
 * Class: Jx.Adapter.Tree.Parent
 * This class adapts a table adhering to the classic Parent-style "tree table".
 * 
 * Basically, the store needs to have a column that will indicate each the 
 * parent of each row. The root(s) of the tree should be indicated by a "-1" 
 * in this column. The name of the "parent" column is configurable in the 
 * options.
 * 
 * if useAjax option is set to true then this adapter will send an Ajax request
 * to the server, through the store's strategy (should be Jx.Store.Strategy.Progressive)
 * to request additional nodes. Also, a column indicating whether this is a folder needs 
 * to be set as there is no way to tell if a node has children without it.
 */
Jx.Adapter.Tree.Mptt = new Class({
    
    Family: 'Jx.Adapter.Tree.Parent',
    Extends: Jx.Adapter.Tree,
    
    options: {
        left: 'left',
        right: 'right'
    },
        
    /**
     * APIMethod: hasChildren
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    hasChildren: function (index) {
        var l = this.store.get(this.options.left, index).toInt();
        var r = this.store.get(this.options.right, index).toInt();
        return (l + 1 !== r);
    },
    
    /**
     * APIMethod: hasParent
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    hasParent: function (index) {
        var i = this.getParentIndex(index);
        if ($defined(i)) {
            return true;
        }
        return false;
    },
    
    /**
     * APIMethod: getParentIndex
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    getParentIndex: function (index) {
        var l = this.store.get(this.options.left, index).toInt();
        var r = this.store.get(this.options.right, index).toInt();
        for (var i = index-1; i >= 0; i--) {
            var pl = this.store.get(this.options.left, i).toInt();
            var pr = this.store.get(this.options.right, i).toInt();
            if (pl < l && pr > r) {
                return i;
            }
        }
        return null;
    }
});/**
 * Class: Jx.Adapter.Tree.Parent
 * This class adapts a table adhering to the classic Parent-style "tree table".
 * 
 * Basically, the store needs to have a column that will indicate each the 
 * parent of each row. The root(s) of the tree should be indicated by a "-1" 
 * in this column. The name of the "parent" column is configurable in the 
 * options.
 * 
 * if useAjax option is set to true then this adapter will send an Ajax request
 * to the server, through the store's strategy (should be Jx.Store.Strategy.Progressive)
 * to request additional nodes. Also, a column indicating whether this is a folder needs 
 * to be set as there is no way to tell if a node has children without it.
 */
Jx.Adapter.Tree.Parent = new Class({
    
    Family: 'Jx.Adapter.Tree.Parent',
    Extends: Jx.Adapter.Tree,
    
    options: {
        parentColumn: 'parent',
        folderColumn: 'folder'
    },
        
    /**
     * APIMethod: hasChildren
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    hasChildren: function (index) {
        if (this.options.useAjax) {
            return this.store.get(this.options.folderColumn, index);
        } else {
            //check to see if there are any rows with the primary key of the passed index
            var id = this.store.get('primaryKey', index);
            for (var i = 0; i < this.store.count()-1;i++) {
                if (this.store.get(this.options.parentColumn, i) === id) {
                    return true;
                }
            }
            return false;
        }
    },
    
    /**
     * APIMethod: hasParent
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    hasParent: function (index) {
        if (this.store.get(this.options.parentColumn, index).toInt() !== -1) {
            return true;
        } 
        return false;
    },
    
    /**
     * APIMethod: getParentIndex
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    getParentIndex: function (index) {
        //get the parent based on the index
        var pk = this.store.get(this.options.parentColumn, index);
        return this.store.findByColumn('primaryKey', pk);
    }
});
Jx.Plugin.Editor = {};

Jx.Plugin.Editor.Button = new Class({
    
    Family: 'Jx.Plugin.Editor.Button',
    
    Extends: Jx.Plugin,
    
    options: {
        image: '',
        toggle: false,
        shortcut: null,
        title: null,
        imageClass: '',
        prefix: 'jxEditorButton'
    },
    
    tags: null,
    css: null,
    action: null,
    
    attach: function (editor) {
        this.editor = editor;
        this.selection = editor.selection;
        
        this.parent(editor);
        
        this.button = new Jx.Button({
            toggle: this.options.toggle,
            image: this.options.image,
            imageClass: this.options.prefix + this.options.imageClass,
            tooltip: this.options.title + ($defined(this.options.shortcut)?"(ctrl-" + this.options.shortcut + ")":'')
        });
        
        this.editor.toolbar.add(this.button);
        
        if (this.options.toggle) {
            this.button.addEvents({
                down: this.command.bind(this),
                up: this.command.bind(this)
            });
        } else {
            this.button.addEvent('click', this.command.bind(this));
        }
        
        this.editor.keys[this.options.shortcut] = this;
            
    },
    
    detach: function () {
        this.button.destroy();
        this.parent(editor);
    },

    setState: function (state) {
        if (this.options.toggle) {
            this.settingState = true;
            this.button.setActive(state);
        }
        this.settingState = false;
    },
    
    getState: function () {
        if (this.options.toggle) {
            return this.button.isActive();
        } 
        return false;
    },
    
    checkState: function (element) {
        this.setState(false);
        if ($defined(this.action)) {
            try {
                if (this.editor.doc.queryCommandState(this.action)) {
                    this.setState(true);
                    return;
                }
            } catch (e) {}
        }
        if ($defined(this.tags)) {
            var el = element;
            do {
                var tag = el.tagName.toLowerCase();
                if (this.tags.contains(tag)) {
                    this.setState(true);
                    break;
                }
            } 
            while ( (el.tagName.toLowerCase() != 'body') && ((el = Element.getParent(el)) != null));
        }
        
        if ($defined(this.css)) {
            var el = element;
            do {
                found = false;
                for (var prop in this.css) {
                    var css = this.css[prop];
                    if (Element.getStyle(el, prop).contains(css)){
                        this.setState(true);
                        found = true;
                    }
                }
                if (found || el.tagName.test(this.editor.blockEls)) break;
            }
            while ( (el.tagName.toLowerCase() != 'body') && ((el = Element.getParent(el)) != null));
        }
    },
    
    command: function () {
        if (!this.settingState) {
            this.editor.execute(this.action, false, false);
        }
    },
    
    setEnabled: function (state) {
        this.button.setEnabled(state);
    }
});
Jx.Plugin.Editor.Bold = new Class({
    
    Family: 'Jx.Plugin.Editor.Bold',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'bold',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Bold',
        toggle: true,
        shortcut: 'b',
        title: 'Bold'
    },
    
    tags: ['b','strong'],
    css: {'font-weight': 'bold'},
    action: 'bold',
    
    init: function () {
        this.parent();
        this.bound = {
            setup: this.setup.bind(this),
            parse: this.setup.bind(this)
        };
    },
    
    attach: function (editor) {
        this.parent(editor);
        
        this.editor.addEvent('preToggleView', this.bound.parse);
        this.editor.addEvent('postPluginInit', this.bound.setup);
    },
    
    setup: function () {
        var result = this.parse();
        if (result) {
            this.editor.setContent(result);
        }
        this.editor.removeEvent('postPluginInit', this.bound.setup);
    },
    
    parse: function () {
        if (Browser.Engine.gecko) {
            var s = this.editor.textarea.get('value');
            s.replace(/<strong([^>]*)>/gi, '<b$1>');
            s.replace(/<\/strong>/gi, '</b>');
            this.editor.textarea.set('html', s);
            return s;
        }
        return null;
    }
    
});
Jx.Plugin.Editor.Italic = new Class({
    
    Family: 'Jx.Plugin.Editor.Italic',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'italic',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Italic',
        toggle: true,
        shortcut: 'i',
        title: 'Italic'
    },
    
    tags: ['i','em'],
    css: {'font-style': 'italic'},
    action: 'italic',
    
    init: function () {
        this.parent();
        this.bound = {
            setup: this.setup.bind(this),
            parse: this.setup.bind(this)
        };
    },
    
    attach: function (editor) {
        this.parent(editor);
        
        this.editor.addEvent('preToggleView', this.bound.parse);
        this.editor.addEvent('postPluginInit', this.bound.setup);
    },
    
    setup: function () {
        var result = this.parse();
        if (result) {
            this.editor.setContent(result);
        }
        this.editor.removeEvent('postPluginInit', this.bound.setup);
    },
    
    parse: function () {
        if (Browser.Engine.gecko) {
            var s = this.editor.textarea.get('value')
                .replace(/<embed([^>]*)>/gi, '<tmpembed$1>')
                .replace(/<em([^>]*)>/gi, '<i$1>')
                .replace(/<tmpembed([^>]*)>/gi, '<embed$1>')
                .replace(/<\/em>/gi, '</i>');
            this.editor.textarea.set('value', s);
            return s;
        }
        return null;
    }
    
});
Jx.Plugin.Editor.Underline = new Class({
    
    Family: 'Jx.Plugin.Editor.Underline',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'underline',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Underline',
        toggle: true,
        shortcut: 'u',
        title: 'Underline'
    },
    
    tags: ['u'],
    css: {'text-decoration': 'underline'},
    action: 'underline'
    
});
Jx.Plugin.Editor.Separator = new Class({
    
    Family: 'Jx.Plugin.Editor.Separator',
    Extends: Jx.Plugin,
    name: 'separator',
    
    attach: function (editor) {
        this.button = new Jx.Toolbar.Separator();
        editor.toolbar.add(this.button);
    }
});
Jx.Plugin.Editor.ButtonSet = new Class({
    
    Family: 'Jx.Plugin.Editor.ButtonSet',
    
    Extends: Jx.Plugin,
    
    options: {
        /**
         * Option: buttons
         * an object of config objects keyed by the action
         * (code)
         * {
         *   action: { config },
         *   action: { config }
         * }
         * (end)
         */
        buttons: null     
    },
    
    buttonSet: null,
    
    buttons: [],
    
    prefix: 'jxEditorButton',
    
    init: function () {
        this.parent();
        this.buttonSet = new Jx.ButtonSet();
        
    },
    
    attach: function (editor) {
        this.parent(editor);
        this.editor = editor;
        $H(this.options.buttons).each(function(config, action){
            var button = new Jx.Button({
                toggle: true,
                image: config.image,
                imageClass: this.prefix + config.imageClass,
                tooltip: config.title
            });
            this.editor.toolbar.add(button);
            this.buttons.push(button);
            this.buttonSet.add(button);
            button.action = action;
            button.addEvents({
                down: this.command.bind(this, action),
                up: this.command.bind(this, action)
            });
            
        },this);
    },
    
    detach: function () {
        this.parent();
    },
    
    checkState: function (element) {
        this.buttons.each(function(button){
            this.setState(false, button);
            if ($defined(button.action)) {
                try {
                    if (this.editor.doc.queryCommandState(button.action)) {
                        this.setState(true, button);
                        return;
                    }
                } catch (e) {}
            }
            if ($defined(button.options.tags)) {
                var el = element;
                do {
                    var tag = el.tagName.toLowerCase();
                    if (button.options.tags.contains(tag)) {
                        this.setState(true, button);
                        break;
                    }
                } while ((el = Element.getParent(el)) != null);
            }
            
            if ($defined(button.options.css)) {
                var el = element;
                do {
                    found = false;
                    for (var prop in button.options.css) {
                        var css = button.options.css[prop];
                        if (Element.getStyle(el, prop).contains(css)){
                            this.setState(true, button);
                            found = true;
                        }
                    }
                    if (found || el.tagName.test(this.editor.blockEls)) break;
                }
                while ((el = element.getParent(el)) != null);
            }
        }, this);
    },
    
    setState: function (state, button) {
        this.settingState = true;
        button.setActive(state);
        this.settingState = false;
    },
    
    command: function (action) {
        if (!this.settingState) {
            this.editor.execute(action, false, false);
        }
    },
    
    setEnabled: function (state) {
        this.buttons.each(function(button){
            button.setEnabled(state);
        },this);
    }
});
Jx.Plugin.Editor.Alignment = new Class({
    
    Family: 'Jx.Plugin.Editor.Aligmment',
    
    Extends: Jx.Plugin.Editor.ButtonSet,
    
    name: 'alignment',
    
    options: {
        buttons: {
            justifyleft: {
                image: Jx.aPixel.src,
                imageClass: 'JustifyLeft',
                title: 'Align Left',
                css: {'text-align': 'left'}
            },
            justifyright: {
                image: Jx.aPixel.src,
                imageClass: 'JustifyRight',
                title: 'Align Right',
                css: {'text-align': 'right'}
            },
            justifycenter: {
                image: Jx.aPixel.src,
                imageClass: 'JustifyCenter',
                title: 'Align Center',
                css: {'text-align': 'center'},
                tags: ['center']
            },
            justifyfull: {
                image: Jx.aPixel.src,
                imageClass: 'JustifyFull',
                title: 'Align Full',
                css: {'text-align': 'justify'}
            }
        }
    }
        
});
Jx.Plugin.Editor.Image = new Class({
    
    Family: 'Jx.Plugin.Editor.Image',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'image',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Image',
        toggle: false,
        shortcut: 'm',
        title: 'Insert Image'
    },
    
    tags: ['img'],
    
    action: 'insertimage',
    
    command: function () {
        new Jx.Dialog.Prompt({
            prompt: 'Enter the address of the image:' ,
            onClose: this.finish.bind(this)
        }).open();
    },
    
    finish: function (dialog, result, url) {
        if (result.toLowerCase() === 'ok') {
            this.editor.execute(this.action, false, url.trim());
        }
    }
    
});
Jx.Plugin.Editor.Indent = new Class({
    
    Family: 'Jx.Plugin.Editor.Indent',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'indent',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Indent',
        toggle: false,
        title: 'Indent'
    },
    
    tags: ['blockquote'],
    action: 'indent'
    
});
Jx.Plugin.Editor.Link = new Class({
    
    Family: 'Jx.Plugin.Editor.Link',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'createlink',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Link',
        toggle: false,
        shortcut: 'l',
        title: 'Create Hyperlink'
    },
    
    tags: ['a'],
    
    action: 'createlink',
    
    command: function () {
        if (this.editor.selection.isCollapsed()) {
            new Jx.Dialog.Message({
                message: 'Please select the text you wish to hyperlink.'
            }).open();
        } else {
            var text = this.editor.selection.getText();
            new Jx.Dialog.Prompt({
                prompt: 'Enter the web address you wish to link to. <br/> The text you selected to link to: "' + text + '"' ,
                startingValue: 'http://',
                onClose: this.finish.bind(this)
            }).open();
        }
    },
    
    finish: function (dialog, result, url) {
        if (result.toLowerCase() === 'ok') {
            this.editor.execute('createlink', false, url.trim());
        }
    }
    
});
Jx.Plugin.Editor.Orderedlist = new Class({
    
    Family: 'Jx.Plugin.Editor.Orderedlist',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'orderedlist',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'OrderedList',
        toggle: false,
        title: 'Ordered List'
    },
    
    tags: ['ol'],
    action: 'insertorderedlist'
    
});
Jx.Plugin.Editor.Outdent = new Class({
    
    Family: 'Jx.Plugin.Editor.Outdent',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'outdent',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Outdent',
        toggle: false,
        title: 'Outdent'
    },
    
    
    action: 'outdent'
    
});
Jx.Plugin.Editor.Redo = new Class({
    
    Family: 'Jx.Plugin.Editor.Redo',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'redo',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Redo',
        toggle: false,
        shortcut: 'y',
        title: 'Redo'
    },
    
    
    action: 'redo'
    
});
Jx.Plugin.Editor.Strikethrough = new Class({
    
    Family: 'Jx.Plugin.Editor.Strikethrough',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'strikethrough',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Strikethrough',
        toggle: true,
        title: 'Strike Through',
        shortcut: 's'
    },
    
    tags: ['s','strike'],
    css: { 'text-decoration': 'line-through' },
    action: 'strikethrough'
    
});

Jx.Plugin.Editor.Toggle = new Class({
    
    Family: 'Jx.Plugin.Editor.Toggle',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'toggle',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'ToggleView',
        toggle: true,
        title: 'Toggle View'
    },
    
    command: function () {
        if (this.editor.mode == 'textarea') {
            this.editor.enableToolbar();
        } else {
            this.editor.disableToolbar();
        }
        this.editor.toggleView();
    },
    
    setEnabled: $empty
    
});
Jx.Plugin.Editor.Undo = new Class({
    
    Family: 'Jx.Plugin.Editor.Undo',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'undo',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Undo',
        toggle: false,
        shortcut: 'z',
        title: 'Undo'
    },
    
    
    action: 'undo'
    
});
Jx.Plugin.Editor.Unlink = new Class({
    
    Family: 'Jx.Plugin.Editor.Unlink',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'unlink',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Unlink',
        toggle: false,
        title: 'Remove Hyperlink'
    },
    
    action: 'unlink'
    
});
Jx.Plugin.Editor.Unorderedlist = new Class({
    
    Family: 'Jx.Plugin.Editor.Unoderedlist',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'unorderedlist',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'UnorderedList',
        toggle: false,
        title: 'Unordered List'
    },
    
    tags: ['ul'],
    action: 'insertunorderedlist'
    
});
Jx.Plugin.Editor.CustomStyles = new Class({
    
    Family: 'Jx.Plugin.Editor.CustomStyles',
    
    Extends: Jx.Plugin,
    
    rules: [],
    
    name: 'customStyles',
    
    activeClass: '',
    
    attach: function (editor) {
        this.editor = editor;
        this.parent(editor);
        
        //get the stylesheet object from the iframe doc
        var stylesheets = this.editor.doc.styleSheets;
        
        //find the one we want ('jxEditorStylesheet')
        $A(stylesheets).each(function(sheet){
            if (sheet.title == 'jxEditorStylesheet') {
                this.parseStyles.delay(1000,this,sheet);
            }
        },this);
        
        //add placeholder
        this.placeholder = new Element('div',{
            html: '&nbsp;',
            width: 10
        });
        this.editor.toolbar.add(this.placeholder);
    },
    
    detach: function () {
        this.button.destroy();
        this.parent(editor);
    },
    
    parseStyles: function (sheet) {
        var rules;
        if (Browser.Engine.trident) {
            rules = sheet.rules;
        } else {
            try {
                rules = sheet.cssRules;
            } catch (err) {
                console.log('couldn not get styles... waiting till they are available');
                this.parseStyles.delay(500,this,sheet);
                return;
            }
        }
        
        $A(rules).each(function(rule){
            if (rule.selectorText.test(/^\./)) {
                this.rules.push(rule.selectorText.slice(1));
            }
        },this);
        
        //create list of buttons
        var items = [];
        items.push({value: '', text: '', selected: true});
        this.rules.each(function(rule){
            items.push({value: rule, text: rule});
        },this);
        
        //now create the combo button
        this.settingState = true;
        
        //Try with an actual Select
        this.button = new Jx.Field.Select({
            comboOpts: items,
            label: 'Choose a Style'
        });
        
        this.button.field.addEvent('change', this.command.bind(this));
        
        this.button.domObj.replaces(this.placeholder);
        this.editor.toolbar.update();
        this.settingState = false;
    },
    
    checkState: function (element) {
        if (!this.settingState) {
            for (i=0; i<this.rules.length; i++) {
                if (element.hasClass(this.rules[i])) {
                    this.settingState = true;
                    this.button.setValue(this.rules[i]);
                    this.settingState = false;
                    return;
                }
            }
            this.button.setValue('');
        }
    },
    
    command: function () {
        if (!this.settingState) {
            var klass = this.button.getValue();
            var node = this.editor.selection.getNode();
            if (klass !== '') { 
                node.removeClass(this.activeClass);
                if (node.hasClass(klass)) {
                    node.removeClass(klass);
                } else {
                    node.addClass(klass);
                }
                this.activeClass = klass;
            } else {
                this.rules.each(function(rule){
                    if (node.hasClass(rule)) {
                        node.removeClass(rule);
                    }
                },this);
            }
        }
    },
    
    setEnabled: function (state) {
        if (state) {
            this.button.enable();
        } else {
            this.button.disable();
        }
    }
    
});
Jx.Plugin.Editor.Block = new Class({
    
    Family: 'Jx.Plugin.Editor.Block',
    
    Extends: Jx.Plugin,
    
    name: 'block',
    
    tags: ['p','div','h1','h2','h3','h4','h5','h6','pre','address'],
    action: 'formatblock',
    
    attach: function (editor) {
        this.editor = editor;
        this.parent(editor);
        
        items = [{
            value: '',
            text: ''
        }];
        this.tags.each(function(tag){
            items.push({
                value: tag,
                text: tag
            });
        });
        
        this.button = new Jx.Field.Select({
            comboOpts: items,
            label: 'Block Type'
        });
        
        this.button.field.addEvent('change', this.command.bind(this));
       
        this.editor.toolbar.add(this.button);
    },
    
    detach: function () {
        this.button.destroy();
        this.parent(editor);
    },
    
    checkState: function (element) {
        this.setState(false);
        if ($defined(this.tags)) {
            var el = element;
            do {
                var tag = el.tagName.toLowerCase();
                if (this.tags.contains(tag)) {
                    this.setState(true, tag);
                    break;
                }
            } 
            while ( (el.tagName.toLowerCase() != 'body') && ((el = Element.getParent(el)) != null));
        }
        
        
    },
    
    command: function () {
        if (!this.settingState) {
            var tag = this.button.getValue();
            if (tag !== '') {
                var block = '<' + this.button.getValue() + '>';
                this.editor.execute(this.action, false, block);
            } 
        }
    },
    
    setEnabled: function (state) {
        if (state) {
            this.button.enable();
        } else {
            this.button.disable();
        }
    },
    
    setState: function(flag, tag) {
        if (!flag) {
            tag = '';
        }
        this.button.setValue(tag);
    }
    
});