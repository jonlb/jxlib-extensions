/*
---

name: Jx.Layout.Columns

description:

license: MIT-style license.

requires:
 - jxlib/Jx.Layout
 - More/Drag.Move

provides: [Jx.Layout.Columns]

css:
 - columns

...
 */
Jx.Layout.Columns = new Class({
	Family: 'Jx.Layout.Columns',
	Extends: Jx.Object,
	
	options: {
		columns: [{
			cssClass: '',
			width: '30%',
			items: null
		},{
			cssClass: '',
			width: '*',
			items: null
		},{
			cssClass: '',
			width: '25%',
			items: null
		}],
		addDefaults: {
			isDraggable: true,
			column: 1,
			position: 'top'
		},
		dragDefaults: {
			dropZoneClass: 'jxDropZone',
			handle: '',
			position: 'bottom',
			isDraggable: true
		}
	},
	
	parameters: ['target','options'],
	
	columns: [],
	
	marker: null,
	
	target: null,
	
	widgets: $H(),
	
	init: function () {
		this.parent();
		
		this.target = $(this.options.target);
		this.target.addClass('jxLayoutColumns');
		
		
		this.marker = new Element('div', {
			'class': 'jxLayoutColumnMarker'
		}).setStyles({
			'opacity': 0.7, 
			'visibility': 'hidden'
		}).inject(document.getElement('body'));
		
		var w = 0;
		//create columns in the target
		this.options.columns.each(function(col, idx){
			var column = new Element('div', {
				'class': 'jxLayoutColumn'
			});
			column.addClass(col.cssClass);
			column.addClass(this.options.dragDefaults.dropZoneClass);
			if (idx == this.options.columns.length - 1) {
				column.addClass('jxLayoutColumnLast');
			}
			column.inject(this.target);
			this.columns.push(column);
		},this);
		
		
		
		this.options.columns.each(function(col, idx){
			if ($defined(col.items)) {
				this.add(col.items, {
					column: idx
				});
			} else {
				this.addPlaceholder(idx);
			}
		},this);
		
		this.windowResize();
		
		//listen for the window resize and adjust the columns accordingly
		window.addEvent('resize', this.windowResize.bind(this));
        window.addEvent('load', this.windowResize.bind(this));
			
	},
	
	addPlaceholder: function (idx) {
		var p = new Element('div', {
			'class': 'jxLayoutPlaceholder'
		});
		this.add(p, { 
			column: idx,
			isDraggable: false
		});
		this.columns[idx].store('placeholder',p);
	},
	
	windowResize: function () {
		var tSize = this.target.getContentBoxSize();
		//the -10 here is to account for any possible scrollbar on the window.
		tSize.width -= 50;
		var  w = 0;
		this.options.columns.each(function(col, idx){
			var column = this.columns[idx];
			if (col.width == '*') {
				this.fluidCol = column;
			} else {
				if (col.width.contains('%')) {
					var percent = col.width.toInt();
					var marginRight = column.getStyle('margin-right').toInt();
					var marginLeft = column.getStyle('margin-left').toInt();
					column.setStyle('width', (tSize.width * percent / 100) - marginRight - marginLeft);
				} else {
					column.setStyle('width', col.width);
				}
				var s = column.getMarginBoxSize();
				w += s.width;
			}
		},this);
		if ($defined(this.fluidCol)) {
			var marginRight = this.fluidCol.getStyle('margin-right').toInt();
			var marginLeft = this.fluidCol.getStyle('margin-left').toInt();
			this.fluidCol.setStyle('width',tSize.width - w - marginRight - marginLeft);
		}
		
		this.resize();
	},
	
	/**
	 * APIMethod: add
	 * Use this method to add an element to the layout
	 * 
	 * Parameters:
	 * elem - the element to add. Either a Dom Element or a Jx.Widget instance
	 * options - the options to use in adding this elem.
	 * 
	 * Options: 
	 * column - the column to add to (zero-based)
	 * position - where in the column to add (top | bottom | 0...n)
	 * isDraggable - whether this elem should be draggable (doesn't keep other
	 * 				 elements from being added before or after)
	 * handle - the part of the element to use as the drag handle
	 */
	add: function (elem, options) {
		options = $merge(this.options.addDefaults,options);
		
		$splat(elem).each(function(el){	
			el = $(el);
			var col = $(this.columns[options.column]);
			var children = col.getChildren();
			var after;
			children.each(function(child, idx){
				if (idx + 1 == options.position) {
					after = child;
				}
			},this);
			
			if (el.addTo) {
				if (!$defined(after)) {
					el.addTo(col, 'bottom');
				} else {
					el.addTo(after, 'after');
				}
			} else {
				if (!$defined(after)) {
					el.inject(col, 'bottom');
				} else {
					el.inject(after, 'after');
				}
			}
			if (!el.hasClass('jxLayoutPlaceholder')) {
				col.getChildren('.jxLayoutPlaceholder').each(function(child){
					child.dispose();
				},this);
			}
			this.widgets.set(el.get('id'), el);
			if ($defined(el.resize)) {
				el.resize();
			}
			el.setStyle('position','relative');
            if (options.isDraggable) {
                this.makeDraggable(el, options.handle);
            }
		},this);
		
		
		

		
		this.fireEvent('jxLayoutColumnAdd');
	},
	
	makeDraggable: function (elem, handle) {
		handle = $defined(handle) ? handle : this.options.dragDefaults.handle;
		$splat(elem).each(function(d){
			d = $(d);
			d.addClass('jxLayoutDraggable');
	        d.makeDraggable({
	            droppables: $$('.' + this.options.dragDefaults.dropZoneClass), 
	            handle: d.getElement(handle), 
	            precalculate: false,
	            onBeforeStart: function(){
	        		var coords = d.getCoordinates(d.getParent());
	        		var col = d.getParent();
	        		if (col.getChildren().length == 1) {
	        			//add placeholder to bottom of column
	        			col.retrieve('placeholder').inject(col,'bottom');
	        		}
	                this.marker.setStyles({
	                	'display': 'block', 
	                	'visibility': 'visible',
	                	'height': coords.height, 
	                	'width': coords.width - 5}).inject(d, 'after');
	                d.setStyles({
	                	'position': 'absolute', 
	                	'top': (coords.top - d.getStyle('margin-top').toFloat()), 
	                	'left': (coords.left - d.getStyle('margin-left').toFloat()), 
	                	'width': coords.width, 
	                	'opacity': 0.7, 
	                	'z-index': 3});
	            }.bind(this), 
	            onEnter: function(el, drop){
	                drop.adopt(this.marker.setStyles({
	                	'display': 'block', 
	                	'height': el.getCoordinates().height, 
	                	'width': drop.getCoordinates().width - 5
	                	})
	                );
	                var p = drop.retrieve('placeholder');
	                if (drop.hasChild(p)) {
	                	p.dispose();
	                }
	            }.bind(this), 
	            onLeave: function(el, drop){
	                this.marker.dispose();
	                var p = drop.retrieve('placeholder');
	                var children = drop.getChildren();
	                children = children.filter(function(child){ return child != p && child != el;},this);
	                if (children.length == 0 ) {
	                	p.inject(drop,'top');
	                }
	                	
	            }.bind(this), 
	            onDrag: function(el){
	                target = null;
	                drop = this.marker.getParent();
	                var drag = el.retrieve('dragger');
	                if (drop && drop.getChildren().length > 1){
	                	//check for placeholder and remove it before adding the marker
	                	var p = drop.retrieve('placeholder');
	                	if (drop.hasChild(p)) {
	                		p.dispose();
	                	}
	                    kids = drop.getChildren();
	                    mouseY = drag.mouse.now.y;
	                    kids.each(function(k){
	                        if (mouseY > (k.getCoordinates().top + Math.round(k.getCoordinates().height / 2))) target = k;
	                    });
	                    if (target == null){
	                        if (kids[0] != this.marker) {
	                        	this.marker.inject(drop, 'top');
	                        }
	                    } else {
	                        if ((target != this.marker) && (target != this.marker.getPrevious())) {
	                        	this.marker.inject(target, 'after');
	                        }
	                    }
	                }
	                //console.log('drag');
	            }.bind(this), 
	            onDrop: function(el, drop){
	                if (drop) {
	                	el.setStyles({
	                		'position': 'relative', 
	                		'top': '0', 
	                		'left': '0', 
	                		'width': 'auto', 
	                		'opacity': 1, 
	                		'z-index': 1
	                	}).replaces(this.marker);
	                	if ($defined(el.resize)) {
	                		el.resize({width: null});
	                	}
	                	if (drop.hasChild(drop.retrieve('placeholder'))) {
	                		$(drop.retrieve('placeholder')).dispose();
	                	}
	                } else {
	                	el.setStyles({
	                		'position': 'relative', 
	                		'top': '0', 
	                		'left': '0', 
	                		'opacity': 1, 
	                		'z-index': 1
	                	});
	                	console.log('drop not in zone');
	                }
	            }.bind(this), 
	            onComplete: function(el){
	            	this.marker.dispose();
	            	el.setStyle('position','relative');
	            	this.fireEvent('jxLayoutMoveComplete', el);
	            }.bind(this), 
	            onCancel: function(el){
	                this.marker.dispose();
	                el.setStyles({
	                	'position': 'relative', 
	                	'top': '0', 
	                	'left': '0', 
	                	'width': null, 
	                	'opacity': 1, 
	                	'z-index': 1
	                });
	            }.bind(this)
	        });
	    },this);
	},
	
	resize: function () {
		this.widgets.each(function(el){
			el = $(el);
			if ($defined(el.resize)) {
				el.resize();
			}
		},this);
	},
	/**
	 * APIMethod: serialize
	 * Returns an array of objects containing the following information for 
	 * each object
	 * 
	 *  (code)
	 *  {
	 *  	id: <object's id>,
	 *  	width: <object's width>,
	 *   	height: <object's height>,
	 *   	column: <column>,
	 *   	position: <position in the column>
	 *   }
	 *   (end)
	 *   
	 *   The array can be saved and used to recreate the layout. This layout 
	 *   cannot recreate itself however. The developer is tasked with taking 
	 *   this info and supplying the appropriate objects.
	 */
	serialize: function () {
		var result = [];
		
		//go through each column and construct the object
		this.columns.each(function(col, idx){
			col.getChildren().each(function(widget,i){
				widget = $(widget);
				if (!widget.hasClass('jxLayoutPlaceholder')) {
					var size = widget.getBorderBoxSize();
					result.push({
						id: widget.get('id'),
						width: size.width,
						height: size.height,
						column: idx,
						position: i
					});
				}
			},this);
		},this);
		
		return result;
	}
	
});
