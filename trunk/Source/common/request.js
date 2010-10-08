/*
---

name: Jx.Request

description:

license: MIT-style license.

requires:
 -jxlib/ Jx.Object
 - Core/Request.JSON
 - Core/Request.HTML
 - More/Spinner
 - jxlib/Jx.Dialog.Message

provides: [Jx.Request]

...
 */
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
		var req = this.currentRequest;
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
		    	    if ($defined(options.events) && $defined(options.events.onDebug)) {
	                	options.events.onDebug.run(data.debug);
	                }
		    	}
		    	
		    	if (data.success) {
		    		if ($defined(options.events) && $defined(options.events.onSuccess)) {
	            		options.events.onSuccess.run(data);
	            	}
		    	} else {
		    		//first try to handle the error globally
		    		if (!this.handleError(data, req, options)) {
		    			//then pass everything to the registered error handler
		    			if ($defined(options.events) && $defined(options.events.onError)) {
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

