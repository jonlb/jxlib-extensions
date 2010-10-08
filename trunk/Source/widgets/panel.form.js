/*
---

name: Jx.Panel.Form

description:

license: MIT-style license.

requires:
 - jxlib/Jx.Panel
 - jxlib/Jx.Form
 - jxlib/Jx.Notifier.Float
 - jxlib/Jx.Notifier
 - jxlib/Jx.Plugin.Form.Validator
 - jxlib/Jx.Fieldset
 - jxlib/Jx.Notice

provides: [Jx.Panel.Form]

css:
 - panel.form

...
 */
Jx.Panel.Form = new Class({
    
    Family: 'Jx.Panel.Form',
    Extends: Jx.Panel,
    
    notices: $H(),
    
    options: {
        /**
         * Option: fields
         * an array of option objects that describe the various fields in the 
         * form. Each should have a type and fieldset objects can have children.
         * Formatted like so:
         * 
         * (code)
         * [{
         *     type: 'text',
         *     options: { ..options here.. }
         *  },{
         *      type: 'fieldset',
         *      options: { ..options for the fieldset.. },
         *      children: [ {},{},{} ]  //array of additional fields
         * }]
         * (end) 
         * 
         */
        fields: null,
        /**
         * Option: validators
         * This should be the config used in Jx.Plugin.Form.Validator
         */
        validators: null,
        /**
         * Option: notifierType
         * The type of notifier to use. Either 'float' or 'inline'.
         * Default is 'inline' which places the notifier at the top of the form.
         */
        notifierType: 'inline',
        /**
         * Option: formOptions
         * The options for the internal instance of Jx.Form
         */
        formOptions: null
    },
    
    init: function () {
        this.parent();
    },
    
    render: function () {
        this.form = new Jx.Form(this.options.formOptions);
       
        //create the notifier here so it will be at the top of the form
        if (this.options.notifierType instanceof Jx.Notifier) {
            this.notifier = this.options.notifierType;
        } else if (this.options.notifierType === 'inline') {
            this.notifier = new Jx.Notifier({parent: document.id(this.form)});
        } else {
            this.notifier = new Jx.Notifier.Float({parent: document.body});
        }
        
        //add fields
        this.addFields(this.form, this.options.fields);
        this.options.content = document.id(this.form);
        
        this.parent();
        
        //create validator
        if ($defined(this.options.validators)) {
            this.validator = new Jx.Plugin.Form.Validator(this.options.validators);
            this.validator.attach(this.form);
        
            //connect validation events
            this.validator.addEvents({
                'fieldValidationFailed': this.fieldFailed.bind(this),
                'fieldValidationPassed': this.fieldPassed.bind(this)
            });
        }
        
    },
    
    addFields: function (container, options) {
        options.each(function(opt){
            var t = Jx.type(opt);
            if (t === 'element') {
                opt.inject(document.id(this.form));
            } else if (opt instanceof Jx.Widget) {
                opt.addTo(this.form);
            } else if (t === 'object' && $defined(opt.type)) {
                if (opt.type.toLowerCase() === 'fieldset') {
                    var field = new Jx.Fieldset(opt.options);
                    container.add(field);
                    if ($defined(opt.children)) {
                        this.addFields(field, opt.children);
                    }
                } else {
                    var field = new Jx.Field[opt.type.capitalize()](opt.options);
                    container.add(field);
                }
            }
        },this);
    },

    add: function(options) {
        if (Jx.type(options) !== 'array') {
            options = [options];
        }
        this.addFields(this.form,options)
    },
    
    fieldPassed: function (field, validator) {
        if (this.notices.has(field.id)) {
            this.notices.get(field.id).close();
        }
    },
    fieldFailed: function (field, validator) {
        var errs = validator.getErrors();
        var text = field.name + " has the following errors: " + errs.join(",") + ".";
        var notice = new Jx.Notice.Error({
            content: text,
            onClose: function(){
                this.notices.erase(field.id);
            }.bind(this)
        });
        this.notifier.add(notice);
        this.notices.set(field.id, notice);
    }
});
