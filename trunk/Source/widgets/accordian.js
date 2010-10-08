
sgd.ui.accordian = new Class({
	
	Implements: [Options,Events],
	
	options: {
		elem: null,		//the element to use as the base for the accordian
		
		onSlideOut: $empty,	//called when a panel slides out (shows)
		onSlideIn: $empty //called when a panel slides in (hides)
	},
	
	container: null,
	current: null,
	
	initialize: function(options){
		
		this.setOptions(options);
		
		this.container = $(this.options.elem);
		var children = this.container.getChildren('.links')
		
		children.each(function(item){
			item.set('tween',{onComplete:this.setDisplay.bind(this)});
			if (item.getPrevious('.header').hasClass('open')){
				this.current = item.getPrevious('.header');
				this.slide(item,'in');
			} else {
				this.slide(item,'out');
			}
		},this);
		
		this.container.getChildren('.header').addEvent('click', (function(event){
			var clicked = $(event.target);
			
			if ($defined(this.current)){
				if (this.current == clicked) return;
				sliderOut = this.current.getNext('.links');
				this.slide(sliderOut,'out');
			}
			
			var sliderIn = clicked.getNext('.links');
			this.current = clicked;
			this.slide.delay('650', this, [sliderIn,'in']);
			
			
		}).bind(this));
		
	},
	
	setDisplay: function(item){
		h = item.getStyle('height').toInt();
		if (h==0){
			item.setStyle('display','none');
			this.fireEvent('slideIn', item);
		} else {
			item.setStyles({
				'overflow':'auto',
				'height':'auto'
			});
			this.fireEvent('slideOut', item);
		}	
	},
	
	slide: function(item,dir){
		if (dir == 'in') {
			h = item.retrieve('height');
			item.setStyles({
				'overflow':'hidden',
				'display':'block',
				'height':0
			});
			item.tween('height',h);	
		} else {
			h = item.getSize().y;
			item.store('height',h);
			item.setStyles({
				'overflow':'hidden',
				'height':h
			});
			item.tween('height',0);
		}		
	}
});