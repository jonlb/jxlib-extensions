/*
---

name: Jx.Plugin.Editor.Button

description:

license: MIT-style license.

requires:
 - Jx.Plugin.Editor
 - jxlib/Jx.Button

provides: [Jx.Plugin.Editor.Button]

...
 */

Jx.Plugin.Editor.Button = new Class({
    
    Family: 'Jx.Plugin.Editor.Button',
    
    Extends: Jx.Plugin,
    
    options: {
        image: '',
        toggle: false,
        shortcut: null,
        title: null,
        imageClass: '',
        prefix: 'jxEditorButton'
    },
    
    tags: null,
    css: null,
    action: null,
    
    attach: function (editor) {
        this.editor = editor;
        this.selection = editor.selection;
        
        this.parent(editor);
        
        this.button = new Jx.Button({
            toggle: this.options.toggle,
            image: this.options.image,
            imageClass: this.options.prefix + this.options.imageClass,
            tooltip: this.options.title + ($defined(this.options.shortcut)?"(ctrl-" + this.options.shortcut + ")":'')
        });
        
        this.editor.toolbar.add(this.button);
        
        if (this.options.toggle) {
            this.button.addEvents({
                down: this.command.bind(this),
                up: this.command.bind(this)
            });
        } else {
            this.button.addEvent('click', this.command.bind(this));
        }
        
        this.editor.keys[this.options.shortcut] = this;
            
    },
    
    detach: function () {
        this.button.destroy();
        this.parent(editor);
    },

    setState: function (state) {
        if (this.options.toggle) {
            this.settingState = true;
            this.button.setActive(state);
        }
        this.settingState = false;
    },
    
    getState: function () {
        if (this.options.toggle) {
            return this.button.isActive();
        } 
        return false;
    },
    
    checkState: function (element) {
        this.setState(false);
        if ($defined(this.action)) {
            try {
                if (this.editor.doc.queryCommandState(this.action)) {
                    this.setState(true);
                    return;
                }
            } catch (e) {}
        }
        if ($defined(this.tags)) {
            var el = element;
            do {
                var tag = el.tagName.toLowerCase();
                if (this.tags.contains(tag)) {
                    this.setState(true);
                    break;
                }
            } 
            while ( (el.tagName.toLowerCase() != 'body') && ((el = Element.getParent(el)) != null));
        }
        
        if ($defined(this.css)) {
            var el = element;
            do {
                found = false;
                for (var prop in this.css) {
                    var css = this.css[prop];
                    if (Element.getStyle(el, prop).contains(css)){
                        this.setState(true);
                        found = true;
                    }
                }
                if (found || el.tagName.test(this.editor.blockEls)) break;
            }
            while ( (el.tagName.toLowerCase() != 'body') && ((el = Element.getParent(el)) != null));
        }
    },
    
    command: function () {
        if (!this.settingState) {
            this.editor.execute(this.action, false, false);
        }
    },
    
    setEnabled: function (state) {
        this.button.setEnabled(state);
    }
});