{
    tests: [
        {
            title: "Jx.Request - Get With Data Success - JSON",
            description: "This tests a call that should be successful. Click the first button to begin the test.",
            verify: "Did the red box fade into view with text starting with \"success:true\" or similar?",
            before: function(){
	        	$("get-data-request-success-test").addEvent('click',function(event){
	        		event.stop();
	        		var req = new Jx.Request().callServer({col1:'test',col2:'some data to send'},{
	        			url: 'UserTests/common/success.php',
	        			showLoading: true,
	        			loadingElementId: 'loader1',
	        			events: {
	        				onSuccess: (function(data){
	        					var resultDiv = this.getNext('div.results');
	        					try {
	        						new Element('p',{text: JSON.encode(data)}).inject(resultDiv);
	        						resultDiv.fade('in'); 
	        					} catch (e) {
	        						alert("error = "+e.message);
	        					}
	        					
	        				}).bind(this)
	        			}
	        		});
	        	});
            },
            body: "",
            post: function(){
                
            }
        },
        {
            title: "Jx.Request - Get With Data Failure - JSON",
            description: "This tests a call that should be a failure. Click the second button to begin the test.",
            verify: "Did the red box fade into view with the text \"An error was detected and routed to the failure event.\"?",
            before: function(){
	        	$("get-data-request-failure-test").addEvent('click',function(event){
	        		event.stop();
	        		var req = new Jx.Request().callServer({col1:'test',col2:'some data to send'},{
	        			url: 'UserTests/common/failure.php',
	        			showLoading: true,
	        			loadingElementId: 'loader2',
	        			events: {
	        				onFailure: (function(instance){
	        					var resultDiv = this.getNext('div.results');
	        					try {
	        						new Element('p', {text:'An error was detected and routed to the failure event.'}).inject(resultDiv);
	        						resultDiv.fade('in');
	        					} catch (e) {
	        						alert("error = "+e.message);
	        					}
	        				}).bind(this)
	        			}
	        		});
	        	});
            },
            body: "",
            post: function(){
                
            }
        },
        {
            title: "Jx.Request - Get With Data Error - JSON",
            description: "This tests a call that should be an error. Click the third button to begin the test.",
            verify: "Did the red box fade into view with the data indicating an error (error code, message, and validation errors)?",
            before: function(){
	        	$("get-data-request-error-test").addEvent('click',function(event){
	        		event.stop();
	        		var req = new Jx.Request().callServer({col1:'test',col2:'some data to send'},{
	        			url: 'UserTests/common/error.php',
	        			showLoading: true,
	        			loadingElementId: 'loader3',
	        			events: {
	        				onError: (function(data){
	        					var resultDiv = this.getNext('div.results');
	        					try {
	        						new Element('p',{text:JSON.encode(data)}).inject(resultDiv);
	        						resultDiv.fade('in');
	        					} catch (e) {
	        						alert("error = "+e.message);
	        					}
	        				}).bind(this)
	        			}
	        		});
	        	});
            },
            body: "",
            post: function(){
                
            }
        },
        {
            title: "Jx.Request - Get With Data Debug - JSON",
            description: "This tests a call that should be return debug data. Click the fourth button to begin the test.",
            verify: "Did the red box fade into view with the text \"Debug info would be here.\"?",
            before: function(){
	        	$("get-data-request-debug-test").addEvent('click',function(event){
	    			event.stop();
	    			var req = new Jx.Request().callServer({col1:'test',col2:'some data to send'},{
	    				url: 'UserTests/common/success.php',
	    				debug: true,
	    				showLoader: true,
	    				loadingElementId: 'loader4',
	    				events: {
	    					onDebug: (function(debug){
	    						var resultDiv = this.getNext('div.results');
	    						try {
	    							resultDiv.set('html',debug).fade('in');
	    						} catch (e) {
	    							alert("error = "+e.message);
	    						}
	    					}).bind(this)
	    				}
	    			});
	    		});
            },
            body: "",
            post: function(){
                
            }
        }
    ]
}
