{
    tests: [
        {
            title: "Jx.Request - Post with Data - HTML",
            description: "This tests a call that should be successful. Click the first button to begin the test.",
            verify: "Did the red box fade into view with the text \"Some html returned by AJAX for Test\"? Did you see the loader graphic?",
            before: function(){
	        	$("post-data-request-success-test").addEvent('click',function(event){
	        		event.stop();
	        		var req = new Jx.Request().callServer({col1:'test',col2:'some data to send'},{
	        			url: 'UserTests/common/htmlDelay.php',
	        			showLoading: true,
	        			loadingElementId: 'loader5',
	        			method: 'post',
	        			type: 'html',
	        			update: $('results5'),
	        			events: {
	        				onSuccess: (function(tree, elements, html, script){
	        					var resultDiv = this.getNext('div.results');
	        					try {
	        						resultDiv.get('tween',{property: 'opacity', duration: 'long'}).start(1); 
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
            title: "Jx.Request - Post with data - HTML",
            description: "This tests a call that should be a failure. Click the second button to begin the test.",
            verify: "Did the red box fade into view with the text \"An error was detected and routed to the failure event.\"?",
            before: function(){
        	$("post-data-request-failure-test").addEvent('click',function(event){
        		event.stop();
        		var req = new Jx.Request().callServer({col1:'test',col2:'some data to send'},{
        			url: 'UserTests/common/failure.php',
        			showLoading: true,
        			loadingElementId: 'loader6',
        			method: 'post',
        			type: 'html',
        			update: 'results6',
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
