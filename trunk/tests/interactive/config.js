UnitTester.site = 'JxLib-Extensions';
UnitTester.title = 'Interactive Unit Test Framework';

window.addEvent('load', function(){
	new UnitTester({
		"jxlib-extensions": '../..'
	}, {
		Scripts: 'UserTests/'
	});
});