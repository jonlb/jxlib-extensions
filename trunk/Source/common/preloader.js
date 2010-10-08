/*
---

name: Jx.Preloader

description:

license: MIT-style license.

requires:
 - jxlib/Jx
 - Core/Class
 - Core/Class.Extras
 - Core/Hash
 - More/Assets

provides: [Jx.Preloader]
...
 */
/**
 * Class: Jx.Preloader
 * Class designed to preload images for web pages. It loades them into a hash but doesn't inject them
 * into the page. After all the images are loaded it passes the Hash of images back to the caller via the 
 * onComplete event.
 * 
 * Events:
 * > onProgress(loaded, total);
 * > onComplete(Hash);   //Hash of pictures loaded
 */
Jx.Preloader = new Class({
	
	Family: 'Jx.Preloader',
	
	Implements: [Events, Options],
	
	options: {
		onProgress: $empty,
		onComplete: $empty	
	},
	
	counter: 0,
	loadedCounter: 0,
	picHash: null,
	sources: null,
	
	/**
	 * Constructor: Jx.Preloader
	 * Initializes the class
	 * 
	 * parameters:
	 * options - class options (onProgress and onComplete functions)
	 * pics - an array of keys and sources [{key: 'key', source: 'image.jpg'},...]
	 */
	initialize: function(options,pics){
		this.setOptions(options);
		this.picHash = new Hash();
		this.sources = new Hash();
		pics.each(function(i){
			this.add(i.key,i.source);
		},this);
	},
	
	/**
	 * Method: add
	 * Adds an image source to load
	 * 
	 * Parameters:
	 * key - the key used to reference this image
	 * source - where to load the image from
	 */
	add: function(key, source){
		this.counter++;
		this.sources.include(key, source);
	},
	
	/**
	 * Method: imageComplete
	 * Called when an image finishes loading
	 */
	imageComplete: function(){
		this.loadedCounter++;
		this.fireEvent('progress',[this.counter,this.loadedCounter]);
		if (this.counter == this.loadedCounter) {
			this.fireEvent('complete', [this.picHash]);
		}
	},
	
	/**
	 * Method: start
	 * Called to begin the actual loading of images
	 */
	start: function(){
		this.fireEvent('progress',[this.counter, this.loadedCounter]);
		this.sources.each(function(source, key){
			var img = new Asset.image(source, {
				'onload': this.imageComplete.bind(this)
			});
			this.picHash.include(key, img);
		},this);
	}
});