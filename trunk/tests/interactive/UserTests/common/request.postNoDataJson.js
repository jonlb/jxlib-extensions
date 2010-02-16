{
    tests: [
        {
            title: "Jx.Request - Post No Data Success - JSON",
            description: "This tests a call that should be successful. Click the first button to begin the test.",
            verify: "Did the red box fade into view with text starting with \"success:true\" or similar?",
            before: function(){
        	$("post-request-success-test").addEvent('click',function(event){
        		event.stop();
        		var req = new Jx.Request().callServer(null,{
        			url: 'UserTests/common/success.php',
        			method: 'post',
        			events: {
        				onSuccess: (function(data){
        					var resultDiv = this.getNext('div');
        					try {
        						new Element('p',{text: JSON.encode(data)}).inject(resultDiv); 
        						$(resultDiv).fade('in');
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
            title: "Jx.Request - Post No Data Failure - JSON",
            description: "This tests a call that should be a failure. Click the second button to begin the test.",
            verify: "Did the red box fade into view with the text \"An error was detected and routed to the failure event.\"?",
            before: function(){
        	$("post-request-failure-test").addEvent('click',function(event){
        		event.stop();
        		var req = new Jx.Request().callServer(null,{
        			url: 'UserTests/common/failure.php',
        			method: 'post',
        			events: {
        				onFailure: (function(instance){
        					var resultDiv = this.getNext('div');
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
            title: "Jx.Request - Post No Data Error - JSON",
            description: "This tests a call that should be an error. Click the third button to begin the test.",
            verify: "Did the red box fade into view with the data indicating an error (error code, message, and validation errors)?",
            before: function(){
        	$("post-request-error-test").addEvent('click',function(event){
        		event.stop();
        		var req = new Jx.Request().callServer(null,{
        			url: 'UserTests/common/error.php',
        			method: 'post',
        			events: {
        				onError: (function(data){
        					var resultDiv = this.getNext('div');
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
            title: "Jx.Request - Post No Data Debug - JSON",
            description: "This tests a call that should return debug data. Click the fourth button to begin the test.",
            verify: "Did the red box fade into view with the text \"Debug info would be here.\"?",
            before: function(){
	        	$("post-request-debug-test").addEvent('click',function(event){
					event.stop();
					var req = new Jx.Request().callServer(null,{
						url: 'UserTests/common/success.php',
						method: 'post',
						debug: true,
						events: {
							onDebug: (function(debug){
								var resultDiv = this.getNext('div');
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
