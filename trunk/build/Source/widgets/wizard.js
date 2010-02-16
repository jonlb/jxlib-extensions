/**
 * Class: Jx.Wizard
 * This is a simple wizard class that allows input through a variety of steps. It is based
 * on Jx.Dialog and utilizes <Jx.Form>.
 */
Jx.Dialog.Wizard = new Class({
	/**
	 * Extends: Jx.Dialog
	 */
	Extends: Jx.Dialog,
	
	options: {
		//dialog defaults
		resize: false,
		collapse: false,
		maximize: false,
		minimize: false,
		
		validateOn: 'steps',	//steps or finish
		allowFinish: 'last',	//whether to allow the finish button to activate
								//only on th elast step or on all steps
		showSteps: true,			//whether to show the steps in a pane on the left
		hideSteps: false,
		steps:[],				//an array of the wizard steps executed in order

		//events
		onFinish: $empty,		//called when wizard finishes
		onCancel: $empty
	},
	
	stepDefaults: {
		title: null,		//the title of this step
		content: null		//the content of the step. Can be an element which we just show as is,
							//an object which would be a form config, or another Class with a 
							//domObj property that we can use to add as well.
	},
	/**
	 * Property: steps
	 * An array where the class keeps all of the steps of
	 * the wizard.
	 */
	steps:[],
	/**
	 * Property: stepIndex
	 * Maintains a pointer into the steps array so we know where
	 * in the wizard we are.
	 */
	stepIndex: 0,
	
	/**
	 * Constructor: Jx.Wizard
	 * This method creates the wizard dialog from the passed in options
	 * 
	 * Parameters:
	 * options - the options to use in constructing the wizard
	 * 
	 * Options:
	 * In addition to the options for Jx.Dialog...
	 * 
	 * validateOn - set to "steps" to validate each step of the wizard, or "finish"
	 * 				to validate only on finish.
	 * allowFinish - set to "all" to enable the finish button on all steps, or "last"
	 * 				 to enable it only on the last step.
	 * showSteps - true to show steps in a tree on the left of the dialog, false to not show them.
	 * hideSteps - true will hide the steps.
	 * steps - an Array of objects holding info for each step. The objects are setup as follows
	 * 		o title - The title of the step. Used in constructing the tree view
	 * 		o content - The Element, form, or other class that should be displayed 
	 * 					as the panel of the wizard.
	 */
	render: function(){
		
		//create the content for the wizard
		
		toolbar = new Jx.Toolbar({'position': 'bottom'});
		//add buttons (prev,finish,next)
		this.prev = new Jx.Button({
	            label: 'Previous', 
				image: Jx.aPixel.src,
				imageClass: 'jxWizardPrev',
	            onClick: this.previousStep.bind(this)
		});
		this.next = new Jx.Button({
	            label: 'Next', 
				image: Jx.aPixel.src,
				imageClass: 'jxWizardNext',
	            onClick: this.nextStep.bind(this)
		});
		this.cancel = new Jx.Button({
	            label: 'Cancel', 
				image: Jx.aPixel.src,
				imageClass: 'jxWizardCancel',
	            onClick: this.close.bind(this)
		});
	    this.finish = new Jx.Button({
	            label: 'Finish',
				image: Jx.aPixel.src,
				imageClass: 'jxWizardFinish', 
	            onClick: this.finishWizard.bind(this)
	     });
		toolbar.add(this.prev,this.next,this.cancel,this.finish);
		this.addEvent('close',this.onCancel.bind(this));
		
		
		this.options.toolbars = [toolbar];
		
		if (!$defined(this.options.parent)){
			this.options.parent = document.body;
		}
		
		this.parent(this.options);
		
		//do we create the side bar?
		if (this.options.showSteps) {
			//create splitter
			this.split = new Jx.Splitter(this.content,{
				splitInto: 2,
				layout: 'horizontal',
				barOptions: [
					{snap: 'before'}
				],
				containerOptions: [{width:150}]
			});
			//create tree
			var list = new Jx.ListView({parent: this.split.elements[0]});
			var numSteps = this.options.steps.length;
			list.list.addEvent('select', this.gotoStep.bind(this));
			
			list.list.empty();
            var templ = "<li class='jxListItemContainer jxWizardStep'><a class='jxListItem' href='javascript:void(0);'><img src='"+Jx.aPixel.src+"' class='itemImg jxWizardStepImage'><span class='itemLabel'>{name}</span></a></li>";
            
			this.options.steps.each(function(item, index){
			    var o = {};
                o.name = 'Step '+(index+1)+' of '+numSteps+' : '+item.title;
                var theTemplate = new String(templ).substitute(o);
                var litem = new Jx.ListItem({template:theTemplate, enabled: true});
                list.add(litem);
			},this);
			this.tabSet = new Jx.TabSet(this.split.elements[1]);
		} else {
			this.tabSet = new Jx.TabSet(this.content);
		} 
		
		//create the tabs (pages/steps) of the wizard
		this.options.steps.each(function(item){
			var opts = $merge(this.stepDefaults,item);
			var t = $type(item.content);
			var tab;
			if ($defined(t)) {
				switch (t) {
					case "element":
						tab = new Jx.Button.Tab({
							content: item.content
						});
						break;
					case "object":
						if ($defined(item.content.domObj)) {
							tab = new Jx.Button.Tab({
								content: item.content.domObj
							});
						} else {
							//then we have a form config
							item.content.buttons = null;
							f = new sgd.ui.form(item.content);
							item.form = f;
							tab = new Jx.Button.Tab({
								content: f.domObj
							});
						}
						break;
				}
				item.tab = tab;
				this.steps.include(item);
				this.tabSet.add(tab);
			}
		},this);
		
		$(this.content).addClass('s-wizard');
		if (this.options.hideSteps){
			this.split.bars[0].fireEvent('dblclick');
		}
		this.tabSet.setActiveTab(this.steps[0].tab);
		this._enableButtons();
	},
	/**
	 * Method: previousStep
	 * Moves the wizard to the previous step.
	 */
	previousStep: function(){
		this._changeSteps(this.stepIndex - 1);
	},
	/**
	 * Method: nextStep
	 * Moves the wizard to the next step.
	 */
	nextStep: function(){
		if (this._isFormValid()) {
			this._changeSteps(this.stepIndex + 1);
		} else {
			this.steps[this.stepIndex].form.showErrors();
		}
	},
	/**
	 * Method: onCancel
	 * Cancels the wizard and fires the cancel event.
	 */
	onCancel: function(){
		this.fireEvent('cancel');
	},
	/**
	 * Method: finishWizard
	 * Verifies that all of the forms are valid, gathers
	 * the data, and fires the finish event. If any of the forms
	 * fail validation it will how the errors and move to that page.
	 */
	finishWizard: function(){
		//check all forms
		var valid = true;
		var data = new Hash();
		var firstErrorStep = -1;
		this.steps.each(function(item, index){
			if ($defined(item.form)){
				if (item.form.isValid()){
					data.extend(item.form.getValues());
				} else {
					valid = false;
					item.form.showErrors();
					if (firstErrorStep === -1){
						firstErrorStep = index;
					}
				}
			}
		},this);
		
		if (valid){
			this.close();
			this.fireEvent('finish',data);
		} else {
			this._changeSteps(firstErrorStep);
		}
	},
	/**
	 * Method: gotoStep
	 * Moves to the step clicked in the left tree if it's shown.
	 * 
	 * Parameters:
	 * step - the step to move to
	 */
	gotoStep: function(step){
		if (this._isFormValid()) {
			this._changeSteps(step);
		} else {
			this.steps[this.stepIndex].form.showErrors();
		}
	},
	/**
	 * Method: _changeSteps
	 * Does the work of actually changing the step
	 * 
	 * Parameters:
	 * step - the step to move to
	 */
	_changeSteps: function(step){
		this._setTreeItemClass(this.stepIndex,false);
		this.stepIndex = step;
		this.steps[this.stepIndex].tab.setActive(true);
		this._enableButtons();
		this._setTreeItemClass(this.stepIndex,true);
	},
	/**
	 * Method: _isFormValid
	 * Determines if a step needs to be validated and, if so,
	 * actually invokes the form's isValid() method.
	 */
	_isFormValid: function(){
		//check if we must validate forms
		if (this.options.validateOn === 'steps') {
			if ($defined(this.steps[this.stepIndex].form)) {
				return this.steps[this.stepIndex].form.isValid();
			}
		}
		return true;
	},
	/**
	 * Method: _enableButtons
	 * Determines what buttons should be active on a particular step
	 * and ensures that they are active.
	 */
	_enableButtons: function(){
		if (this.stepIndex === 0 && (this.steps.length > 1)) {
			this.prev.setEnabled(false);
			this.next.setEnabled(true);
		} else if (this.steps.length == 1) {
			this.prev.setEnabled(false);
			this.next.setEnabled(false);
		} else if (this.stepIndex === (this.steps.length - 1)) {
			this.prev.setEnabled(true);
			this.next.setEnabled(false);
		} else {
			this.prev.setEnabled(true);
			this.next.setEnabled(true);
		}
		if (this.options.allowFinish === 'all' || (this.options.allowFinish === 'last' && (this.stepIndex === (this.steps.length - 1)))) {
			this.finish.setEnabled(true);
		} else {
			this.finish.setEnabled(false);
		}
	},
	/**
	 * Method: _setTreeItemClass
	 * Either sets or removes the s-wizard-active-step class on
	 * the tree item that is/isn't active
	 * 
	 * Parameters:
	 * index - the step to work on
	 * toSet - true to set the class, false to remove the class
	 */
	_setTreeItemClass: function(index, toSet){
		var item = $('Step-'+index);
		if ($defined(item)) {
			if (toSet) {
				item.addClass('s-wizard-active-step');
			}
			else {
				item.removeClass('s-wizard-active-step');
			}
		}
	}
});
