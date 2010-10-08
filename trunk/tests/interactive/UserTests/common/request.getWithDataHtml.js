{
    tests: [
        {
            title: "Jx.Request - Get With Data - HTML",
            description: "This tests a call that should be successful. Click the first button to begin the test.",
            verify: "Did the red box fade into view with the text \"Some html returned by AJAX for Test\"?",
            before: function(){
	        	$("get-data-request-success-test").addEvent('click',function(event){
	        		event.stop();
	        		var req = new Jx.Request().callServer({col1:'test',col2:'some data to send'},{
	        			url: 'UserTests/common/htmlDelay.php',
	        			showLoading: true,
	        			loadingElementId: 'loader1',
	        			type: 'html',
	        			update: $('results3'),
	        			events: {
	        				onSuccess: (function(tree, elements, html, script){
	        					var resultDiv = this.getNext('div.results');
	        					try {
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
            title: "Jx.Request - Get With Data - HTML",
            description: "This tests a call that should be a failure. Click the second button to begin the test.",
            verify: "Did the red box fade into view with the text \"An error was detected and routed to the failure event.\"?",
            before: function(){
	        	$("get-data-request-failure-test").addEvent('click',function(event){
	        		event.stop();
	        		var req = new Jx.Request().callServer({col1:'test',col2:'some data to send'},{
	        			url: 'UserTests/common/failure.php',
	        			showLoading: true,
	        			loadingElementId: 'loader2',
	        			type: 'html',
	        			update: $('results4'),
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
        }
    ]
}
