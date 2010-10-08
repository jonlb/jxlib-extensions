/*
---

name: Jx.Editor

description:

license: MIT-style license.

requires:
 - jxlib/Jx.Widget
 - jxlib/Jx.Layout
 - jxlib/Jx.Toolbar.Container

provides: [Jx.Editor]

css:
 - editor

...
 */
/**
 * Class: Jx.Editor
 *
 * Extends: <Jx.Widget>
 * 
 * a very simplistic IFrame-based WYSIWYG editor.
 * 
 * Inspired by (and a great deal of code from) mooEditable
 */
Jx.Editor = new Class({
    
    Family: 'Jx.Editor',
    Extends: Jx.Widget,
    
    options: {
        template: '<span class="jxEditor"><span class="jxEditorToolbar"></span><span class="jxEditorIframe"></span><textarea class="jxEditorTextarea"></textarea></span></span>',
        editorCssFile: null,
        html: '<!DOCTYPE html><html style="height: 100%; margin: 0; padding: 0;"><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">{stylesheet}</head><body style="height: 100%; padding: 0; margin: 0;"></body></html>',
        stylesheetTemplate: ' <link href="{file}" type="text/css" rel="stylesheet" media="screen, projection" title="jxEditorStylesheet" />',
        content: null,
        /**
         * Option: buttons
         * an array of arrays. Each separate array represents the buttons for a single toolbar.
         */
        buttons: null,
        cleanup: true,
        xhtml : true,
        semantics : true,
        textareaName: 'editor'
    },
    
    classes: $H({
        domObj: 'jxEditor',
        container: 'jxEditorToolbar',
        iframe: 'jxEditorIframe',
        textarea: 'jxEditorTextarea'
    }),
    
    pluginNamespace: 'Editor',
    
    blockEls: /^(H[1-6]|HR|P|DIV|ADDRESS|PRE|FORM|TABLE|LI|OL|UL|TD|CAPTION|BLOCKQUOTE|CENTER|DL|DT|DD)$/i,
    
    init: function () {

        if ($defined(this.options.parent)) {
            this.options.deferRender = false;
        } else {
            this.options.deferRender = true;
        }
        this.parent();
    },
    
    mode: null,
    
    keys: {},
    
    editorDisabled: false,
    
    toolbars: [],
    
    render: function () {
        this.parent();
        
        //add name to textarea
        this.textarea.set('name', this.options.textareaName);
        
        //create the toolbar
        var i = $splat(this.options.buttons).length;
        for (var j = 0; j < i; j++) {
            var c = new Jx.Toolbar.Container({
                scroll: false
            }).addTo(this.container);
            this.toolbars.push(new Jx.Toolbar());
            c.add(this.toolbars[j]);
        }
        
        
        if (this.options.parent) {
            document.id(this.domObj).inject(document.id(this.options.parent));
            new Jx.Layout(this.domObj);
            this.domObj.resize();
        }


        var iframe = new IFrame({
            'class': 'jxEditorIframe',
            src: 'javascript:""',
            frameborder: 0
        });
        

        
        this.mode = 'iframe';
        iframe.replaces(this.iframe);
        this.iframe = iframe;
        this.iframe.setStyles({
            display: 'block',
            visibility: ''
        });

        this.win = iframe.contentWindow;
        this.doc = $defined(this.win) ? this.win.document : iframe.contentDocument.document;

        if ($defined(this.options.editorCssFile)) {
            this.options.stylesheetTemplate = this.options.stylesheetTemplate.substitute({file: this.options.editorCssFile});
        } else {
            this.options.stylesheetTemplate = '';
        }

        this.options.html = this.options.html.substitute({stylesheet: this.options.stylesheetTemplate});
        this.doc.open();
        this.doc.write(this.options.html);
        this.doc.close();

        if (this.win && !this.win.$family) {
            new Window(this.win);
        }
        if (!this.doc.$family) {
            new Document(this.doc);
        }
        document.id(this.doc.body);
        
        if ($defined(this.options.content)) {
            this.doc.body.set('html',this.options.content);
            this.textarea.set('value', this.options.content);
        }

        if (Browser.Engine.trident || Browser.Engine.webkit) {
            this.doc.body.contentEditable = true;
        } else {
            this.doc.designMode = 'On';
        }
    
        this.selection = new Jx.Editor.Selection(this.win);
        
        //add events to doc
        this.doc.addEvents({
            mouseup: this.editorMouseUp.bindWithEvent(this),
            mousedown: this.editorStopEvent.bindWithEvent(this,'MouseDown'),
            mouseover: this.editorStopEvent.bindWithEvent(this,'MouseOver'),
            mouseout: this.editorStopEvent.bindWithEvent(this,'MouseOut'),
            mouseenter: this.editorMouseEnter.bindWithEvent(this),
            mouseleave: this.editorStopEvent.bindWithEvent(this,'MouseLeave'),
            contextmenu: this.editorStopEvent.bindWithEvent(this,'ContextMenu'),
            click: this.editorClick.bindWithEvent(this),
            dblclick: this.editorStopEvent.bindWithEvent(this, 'DoubleClick'),
            keypress: this.editorKeyPress.bindWithEvent(this),
            keyup: this.editorKeyUp.bindWithEvent(this),
            keydown: this.editorKeyDown.bindWithEvent(this),
            focus: this.editorFocus.bindWithEvent(this),
            blur: this.editorBlur.bindWithEvent(this)
        });
        if (this.win) {
            this.win.addEvents({
                focus: this.editorFocus.bindWithEvent(this),
                blur: this.editorBlur.bindWithEvent(this)
            });
        }
        ['cut','copy','paste'].each(function(event){
            this.doc.body.addListener(event, this.editorStopEvent.bindWithEvent(this,event.capitalize()));
        },this);
        this.textarea.addEvent('keypress', this.textarea.retrieve('jx:textareaKeyListener', this.keyListener.bind(this)));
        
        //window focus event not firing in firefox 2
        if (Browser.Engine.gecko && Browser.Engine.version == 18) {
            this.doc.addEvent('focus', function(){
                this.win.fireEvent('focus').focus();
            }.bind(this));
        }
        
        this.oldContent = this.getContent();
        
        this.domObj.store('Jx.Editor',this);


        
        this.addEvent('postPluginInit', function(){
            //now loop through button arrays and init the plugins
            this.options.buttons.each(function(bar, index){
                this.options.plugins = bar;
                this.toolbar = this.toolbars[index];
                this.initPlugins();
            },this);
        }.bind(this));
    },
    
    setContent: function (content) {
        this.doc.body.set('html', content);
        return this;
    },
    
    getContent: function () {
        return this.doc.body.get('html');
    },
    
    execute: function (command, param1, param2) {
        if (this.busy) return;
        this.busy = true;
        this.doc.execCommand(command, param1, param2);
        this.saveContent();
        this.focus();
        this.busy = false;
        return false;
    },
    
    toggleView: function () {
        this.fireEvent('preToggleView', this);
        if (this.mode === 'textarea') {
            this.mode = 'iframe';
            this.iframe.setStyle('display','block');
            this.setContent(this.textarea.value);
            this.textarea.setStyle('display', 'none');
        } else {
            this.saveContent();
            this.mode = 'textarea';
            this.textarea.setStyle('display','block');
            this.iframe.setStyle('display','none');
        }
        this.fireEvent('postToggleView', this);
    },
    
    saveContent: function () {
        //console.log('editor save content');
        if (this.mode === 'iframe') {
            this.textarea.set('value', this.cleanup(this.getContent()));
            //console.log('value saved:' + this.textarea.get('value'));
        }
        return this;
    },
    
    resize: function () {
        if (this.domObj.resize) {
            this.domObj.resize();
        } else {
            new Jx.Layout(this.domObj);
            this.domObj.resize();
        }
        var dimensions = this.domObj.getContentBoxSize();
        var tbDimensions = this.container.getMarginBoxSize();
        
        var styles = {
            width: dimensions.width,
            height: dimensions.height - tbDimensions.height
        };
        this.iframe.setStyles(styles);
        this.textarea.setStyles(styles);
    },
    
    focus: function () {
        if (this.mode == 'iframe') {
            if (this.win) {
                this.win.focus();
            } else {
                this.iframe.focus();
            }
        } else {
            this.textarea.focus();
        }
        this.fireEvent('focus', this);
        return this;
    },
    
    /**
     * Editor Events
     */
    
    editorStopEvent: function (e, event) {
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        //console.log('stop event...' + event);
        this.fireEvent('editor'+event, [e, this]);
    },
    
    editorFocus: function (e) {
        //console.log('editor focus event');
        this.oldContent = '';
        this.fireEvent('editorFocus', [e, this]);
    },
    
    editorBlur: function (e) {
        //console.log('editor blur event');
        this.oldContent = this.saveContent().getContent();
        this.fireEvent('editorBlur', [e, this]);
    },
    
    editorMouseUp: function (e) {
        //console.log('editor mouseup event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        this.checkStates();
        
        this.fireEvent('editorMouseUp', [e, this]);
    },
    
    editorMouseEnter: function (e) {
        //console.log('editor mouseenter event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        
        if (this.oldContent && this.getContent() != this.oldContent) {
            this.focus();
            this.fireEvent('editorPaste', [e, this]);
        }
        
        this.fireEvent('editorMouseEnter', [e, this]);
    },
    
    editorClick: function (e) {
        //console.log('editor click event');
        if (Browser.Engine.webkit) {
            var el = document.id(e.target);
            if (el.get('tag') == 'img'){
                this.selection.selectNode(el);
            }
        }
        
        this.fireEvent('editorClick', [e, this]);
    },
    
    editorKeyPress: function (e) {
        //console.log('editor key press event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        
        this.keyListener(e);
        
        this.fireEvent('editorKeyPress', [e, this]);
    },
    
    editorKeyUp: function (e) {
        //console.log('editor key up event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        
        var c = e.code;
        if (/^enter|left|up|right|down|delete|backspace$/i.test(e.key) || (c >= 33 && c <= 36) || c == 45 || e.meta || e.control ) {
            if (Browser.Engines.trident4) {
                $clear(this.checkStateDelay);
                this.checkStatesDelay = this.checkStates.delay(500, this);
            } else {
                this.checkStates();
            }
        }
        
        this.fireEvent('editorKeyUp', [e, this]);
    },
    
    editorKeyDown: function (e) {
        //console.log('editor key down event');
        if (this.editorDisabled) {
            e.stop();
            return;
        }
        
        if (e.key == 'enter') {
            if (e.shift && Browser.Engine.webkit) {
                var s = this.selection;
                var r = s.getRange();
                
                var br = this.doc.createElement('br');
                r.insertNode(br);
                
                r.setStartAfter(br);
                r.setEndAfter(br);
                s.setRange(r);
                
                if (s.getSelection().focusNode == br.previousSibling) {
                    var nbsp = this.doc.createTextNode('\u00a0');
                    var p = br.parentNode;
                    var ns = br.nextSibling;
                    (ns) ? p.insertBefore(nbsp, ns) : p.appendChild(nbsp);
                    s.selectNode(nbsp);
                    s.collapse(1);
                }

                //change this.win here for Google Chrome???
                this.win.scrollTo(0, Element.getOffsets(s.getRange().startContainer).y);
                
                e.preventDefault();
            } else if (Browser.Engine.gecko || Browser.Engine.webkit) {
                var node = this.selection.getNode();
                var isBlock = node.getParents().include(node).some(function(el){
                    return el.nodeName.test(this.blockEls);
                }.bind(this));
                if (!isBlock) this.execute('insertparagraph', false, false);
            }
        } else {
            if (Browser.Engine.trident) {
                var r= this.selection.getRange();
                var node = this.selection.getNode();
                if (r && node.get('tag') != 'li') {
                    this.selection.insertContent('<br>');
                    this.selection.collapse(false);
                }
                e.preventDefault();
            }
        }
        
        if (Browser.Engine.presto) {
            var ctrlmeta = e.control || e.meta;
            if (ctrlmeta && e.key == 'x') {
                this.fireEvent('editorCut', [e, this]);
            } else if (ctrlmeta && e.key == 'c') {
                this.fireEvent('editorCopy', [e, this]);
            } else if ((ctrlmeta && e.key == 'v') || (e.shift && e.code == 45) ) {
                this.fireEvent('editorPaste', [e, this]);
            }
        }
        
        this.fireEvent('editorKeyDown', [e, this]);
        
    },
    
    keyListener: function (e) {
        var key = (Browser.Platform.mac) ? e.meta : e.control;
        if (!key || !this.keys[e.key]) return;
        e.preventDefault();
        var plugin = this.keys[e.key];
        plugin.command();
        if (this.mode == 'iframe') this.checkStates();
    },
    
    checkStates: function () {
        var element = this.selection.getNode();
        if (!element) return;
        if (Jx.type(element) != 'element') return;
        
        this.plugins.each(function(plugin){
            if ($defined(plugin.checkState)) {
                plugin.checkState(element);
            }
        },this);
    },
    
    cleanup: function(source){
        if (!this.options.cleanup) return source.trim();
        
        do {
            var oSource = source;

            // Webkit cleanup
            source = source.replace(/<br class\="webkit-block-placeholder">/gi, "<br />");
            source = source.replace(/<span class="Apple-style-span">(.*)<\/span>/gi, '$1');
            source = source.replace(/ class="Apple-style-span"/gi, '');
            source = source.replace(/<span style="">/gi, '');

            // Remove padded paragraphs
            source = source.replace(/<p>\s*<br ?\/?>\s*<\/p>/gi, '<p>\u00a0</p>');
            source = source.replace(/<p>(&nbsp;|\s)*<\/p>/gi, '<p>\u00a0</p>');
            if (!this.options.semantics){
                source = source.replace(/\s*<br ?\/?>\s*<\/p>/gi, '</p>');
            }

            // Replace improper BRs (only if XHTML : true)
            if (this.options.xhtml){
                source = source.replace(/<br>/gi, "<br />");
            }

            if (this.options.semantics){
                //remove divs from <li>
                if (Browser.Engine.trident){
                    source = source.replace(/<li>\s*<div>(.+?)<\/div><\/li>/g, '<li>$1</li>');
                }
                //remove stupid apple divs
                if (Browser.Engine.webkit){
                    source = source.replace(/^([\w\s]+.*?)<div>/i, '<p>$1</p><div>');
                    source = source.replace(/<div>(.+?)<\/div>/ig, '<p>$1</p>');
                }

                //<p> tags around a list will get moved to after the list
                if (['gecko', 'presto', 'webkit'].contains(Browser.Engine.name)){
                    //not working properly in safari?
                    source = source.replace(/<p>[\s\n]*(<(?:ul|ol)>.*?<\/(?:ul|ol)>)(.*?)<\/p>/ig, '$1<p>$2</p>');
                    source = source.replace(/<\/(ol|ul)>\s*(?!<(?:p|ol|ul|img).*?>)((?:<[^>]*>)?\w.*)$/g, '</$1><p>$2</p>');
                }

                source = source.replace(/<br[^>]*><\/p>/g, '</p>'); // remove <br>'s that end a paragraph here.
                source = source.replace(/<p>\s*(<img[^>]+>)\s*<\/p>/ig, '$1\n'); // if a <p> only contains <img>, remove the <p> tags

                //format the source
                source = source.replace(/<p([^>]*)>(.*?)<\/p>(?!\n)/g, '<p$1>$2</p>\n'); // break after paragraphs
                source = source.replace(/<\/(ul|ol|p)>(?!\n)/g, '</$1>\n'); // break after </p></ol></ul> tags
                source = source.replace(/><li>/g, '>\n\t<li>'); // break and indent <li>
                source = source.replace(/([^\n])<\/(ol|ul)>/g, '$1\n</$2>'); //break before </ol></ul> tags
                source = source.replace(/([^\n])<img/ig, '$1\n<img'); // move images to their own line
                source = source.replace(/^\s*$/g, ''); // delete empty lines in the source code (not working in opera)
            }

            // Remove leading and trailing BRs
            source = source.replace(/<br ?\/?>$/gi, '');
            source = source.replace(/^<br ?\/?>/gi, '');

            // Remove useless BRs
            source = source.replace(/><br ?\/?>/gi, '>');

            // Remove BRs right before the end of blocks
            source = source.replace(/<br ?\/?>\s*<\/(h1|h2|h3|h4|h5|h6|li|p)/gi, '</$1');

            // Semantic conversion
            source = source.replace(/<span style="font-weight: bold;">(.*)<\/span>/gi, '<strong>$1</strong>');
            source = source.replace(/<span style="font-style: italic;">(.*)<\/span>/gi, '<em>$1</em>');
            source = source.replace(/<b\b[^>]*>(.*?)<\/b[^>]*>/gi, '<strong>$1</strong>');
            source = source.replace(/<i\b[^>]*>(.*?)<\/i[^>]*>/gi, '<em>$1</em>');
            source = source.replace(/<u\b[^>]*>(.*?)<\/u[^>]*>/gi, '<span style="text-decoration: underline;">$1</span>');
            source = source.replace(/<strong><span style="font-weight: normal;">(.*)<\/span><\/strong>/gi, '$1');
            source = source.replace(/<em><span style="font-weight: normal;">(.*)<\/span><\/em>/gi, '$1');
            source = source.replace(/<span style="text-decoration: underline;"><span style="font-weight: normal;">(.*)<\/span><\/span>/gi, '$1');
            source = source.replace(/<strong style="font-weight: normal;">(.*)<\/strong>/gi, '$1');
            source = source.replace(/<em style="font-weight: normal;">(.*)<\/em>/gi, '$1');

            // Replace uppercase element names with lowercase
            source = source.replace(/<[^> ]*/g, function(match){return match.toLowerCase();});

            // Replace uppercase attribute names with lowercase
            source = source.replace(/<[^>]*>/g, function(match){
                   match = match.replace(/ [^=]+=/g, function(match2){return match2.toLowerCase();});
                   return match;
            });

            // Put quotes around unquoted attributes
            source = source.replace(/<[^>]*>/g, function(match){
                   match = match.replace(/( [^=]+=)([^"][^ >]*)/g, "$1\"$2\"");
                   return match;
            });

            //make img tags xhtml compatible <img>,<img></img> -> <img/>
            if (this.options.xhtml){
                source = source.replace(/<img([^>]+)(\s*[^\/])>(<\/img>)*/gi, '<img$1$2 />');
            }
            
            //remove double <p> tags and empty <p> tags
            source = source.replace(/<p>(?:\s*)<p>/g, '<p>');
            source = source.replace(/<\/p>\s*<\/p>/g, '</p>');
            
            // Replace <br>s inside <pre> automatically added by some browsers
            source = source.replace(/<pre[^>]*>.*?<\/pre>/gi, function(match){
                return match.replace(/<br ?\/?>/gi, '\n');
            });

            // Final trim
            source = source.trim();
        }
        while (source != oSource);

        return source;
    },
    
    enableToolbar: function () {
        this.plugins.each(function(plugin){
            plugin.setEnabled(true);
        },this);
    },
    
    disableToolbar: function () {
        this.plugins.each(function(plugin){
            plugin.setEnabled(false);
        },this);
    }

    /**

    ,

    addTo: function (reference, where) {

        if (this.options.deferRender) {
            this.options.parent = $(reference);
            this.render();
        } else {
            this.parent(reference, where);
        }

    }
    */
});