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
	
	Implements: [Events, Options],
	
	requests: new Array(),
	requestCount: 0,
	loadingVisible: false,
	errorHandlers: null,
	processRequests: true,
	
	options: {
		//events - i.e. callbacks for this request
		onSuccess: $empty,		//fired on receiving a success=true from the server
		onFailure: $empty,		//fired if mootools request fires a failure
		onDebug: $empty,		//used to display debug info if set
		onError: $empty,		//fired on receiving a success=false from the server
		
		//flags
		debug: false,
		showLoading: false,
			
		//options
		loadingClass: 'ajax-loader',
		loadingElementId: 'ajax-loader',
		url: null,
		method: 'get',
		type: 'json',
		update: null,
		evalScripts: true,
		evalResponse: false
		
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
	init: function(options){
		
		//merge the passed options with the base options
		var opts = $merge(this.options, options);
		
		//increment the requestCount which provides a unique ID for this
		//request
		this.requestCount++;
		
		//create a hash to contain the info for this particular request
		var r = new Hash({requestId: this.requestCount, options: opts});
		
		//create the request object itself
		var request = null;
		if (opts.type === 'json') {
			request = new Request.JSON({
				url: opts.url,
				onSuccess: this.processSuccess.bind(this),
				onFailure: (function(instance){
					this.failure(instance, r.get('requestId'));
				}).bind(this)
			});
		} else if (opts.type === 'html'){
			request = new Request.HTML({
				url: opts.url,
				update: opts.update,
				evalScripts: opts.evalScripts,
				onSuccess: (function(responseTree, responseElements, responseHTML, responseJavaScript){
					this.success(r.get('requestId'), [responseTree, responseElements, responseHTML, responseJavaScript]);
				}).bind(this),
				onFailure: (function(instance){
					this.failure(instance, r.get('requestId'));
				}).bind(this)
			});
		} else {
			request = new Request({
				url: opts.url,
				evalResponse: opts.evalResponse,
				onSuccess: (function(responseText, responseXML){
					this.success(r.get('requestId'), [responseText, responseXML]);
				}).bind(this),
				onFailure: this.failure.bind(this)
			})
		}
		r.combine({'request':request});
		
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
	failure: function(instance, id){
		var req = this.getRequest(id);
		var opt = req.get('options');
		this.removeMask(opt);
		if ($defined(opt.events) && $defined(opt.events.onFailure)) {
    		opt.events.onFailure.run(instance);
    	}
	},
	
	/**
	 * Method: success
	 * called when success happens and the request is not json.
	 * 
	 * Parameters:
	 * id - the id of the request
	 * args - the arguments sent to the success function by the request [responseTree, responseElements, responseHTML, responseJavaScript]
	 */
	success: function(id, args) {
		var req = this.getRequest(id);
		var opt = req.get('options');
		this.removeMask(opt);
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
	callServer: function(data, options){
		if (this.processRequests || options.process){
			var d;
			var req;
			if ($type(options) != 'hash'){
				req = this.init(options);
			} else {
				req = options;
			}
			var opts = req.get('options');
			var request = req.get('request');
			
			if ($defined(data)){
				type = $type(data);
				if ( type != 'hash') {
					d = new Hash(data);
				} else {
					d = data;
				}
			} else {
					d = new Hash({'requestId': req.get('requestId')});
			}
			
			if (!d.has('requestId')){
				d.include('requestId',req.get('requestId'));
			}
			req.combine({'data':d});
			this.requests.include(req);
			//activate loading mask if requested
			if (opts.showLoading && !this.loadingVisible) {
				loadingEl = $(opts.loadingElementId);
				loadingEl.addClass(opts.loadingClass);
				this.loadingVisible = true;
			}
			if (opts.method == 'get') {
				var r = request.get(opts.url, d.toQueryString());
			} else {
				var r = request.post(opts.url, d.toQueryString());
			}
			return req.get('requestId');
		}
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
	processSuccess: function(data, text){
		
		//find the appropriate request hash
		if ($defined(data)) {
			var req = this.getRequest(data.requestId);
			var options = req.get('options');
			
			try {    		
		    	//call debug first
		    	if (options.debug && $defined(data.debug)) {
	                	if ($defined(options.events.onDebug)) {
	                		options.events.onDebug.run(data.debug);
	                	}
		    	}
		    	
		    	if (data.success){
		    		if ($defined(options.events.onSuccess)) {
	            		options.events.onSuccess.run(data);
	            	}
		    	} else {
		    		//first try to handle the error ourselves
		    		if (!this.handleError(data, req, options)){
		    			//then pass everything to the registered error handler
		    			if ($defined(options.events.onError)) {
		    				options.events.onError.run(data);
		    			}
		    		}
		    	}
		    	//this.eventsRemove(options.events);
		    	this.removeMask(options);
		    } catch (err) {
		    	//this is obviously an error that we didn't expect
	    		alert('Error : ' + err.toString());
	    		return false;
	    	}
		} else {
			console.log(text);
			return false;
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
	getRequest: function(requestId){
		var req = null;
		this.requests.each(function(item){
			if (item.get('requestId') == requestId){
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
	 * opts - the options for the request
	 */
	removeMask: function(opts){
		if (this.loadingVisible && (this.requests.length == 0)) {
			loadingEl = $(opts.loadingElementId);
			loadingEl.removeClass(opts.loadingClass);
			this.loadingVisible = false;
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
	handleError: function(data, req, opts){
		if ($defined(this.errorHandlers)) {
			if ($defined(data.error)) {
				var code = data.error.code;
				var message = data.error.message;
				if (this.errorHandlers.has(code)){
					handler = this.errorHandlers.get(code);
					handler.run([message,req]);
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
	addErrorHandler: function(code, handler){
		if (!$defined(this.errorHandlers)){
			this.errorHandlers = new Hash();
		}
		this.errorHandlers.set(code,handler);
	},
	
	/** 
	 * Method: stop
	 * called to stop processing requests
	 */
	stop: function(){
		this.processRequests = false;
	},
	
	/** 
	 * Method: start
	 * called to start processing requests after a call to <stop>
	 */
	start: function(){
		this.processRequests = true;
	}
});

