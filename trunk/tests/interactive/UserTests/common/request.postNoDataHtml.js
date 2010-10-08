{
    tests: [
        {
            title: "Jx.Request - Post No Data - HTML",
            description: "This tests a call that should be successful. Click the first button to begin the test.",
            verify: "Did the red box fade into view with the text \"Some html returned by AJAX for Test\"?",
            before: function(){
	        	$("post-request-success-test").addEvent('click',function(event){
	        		event.stop();
	        		var req = new Jx.Request().callServer(null,{
	        			url: 'UserTests/common/htmlTest.html',
	        			method: 'post',
	        			type: 'html',
	        			update: 'results1',
	        			events: {
	        				onSuccess: (function(tree, elements, html, script){
	        					var resultDiv = this.getNext('div');
	        					try { 
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
            title: "Jx.Request - Post No Data - HTML",
            description: "This tests a call that should be a failure. Click the second button to begin the test.",
            verify: "Did the red box fade into view with the text \"An error was detected and routed to the failure event.\"?",
            before: function(){
	        	$("post-request-failure-test").addEvent('click',function(event){
	        		event.stop();
	        		var req = new Jx.Request().callServer(null,{
	        			url: 'UserTests/common/failure.php',
	        			method: 'post',
	        			type: 'html',
	        			update: $('results2'),
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
        }
    ]
}
