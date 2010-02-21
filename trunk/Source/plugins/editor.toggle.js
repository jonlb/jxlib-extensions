

Jx.Plugin.Editor.Toggle = new Class({
    
    Family: 'Jx.Plugin.Editor.Toggle',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'toggle',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'ToggleView',
        toggle: true,
        title: 'Toggle View'
    },
    
    command: function () {
        if (this.editor.mode == 'textarea') {
            this.editor.enableToolbar();
        } else {
            this.editor.disableToolbar();
        }
        this.editor.toggleView();
    },
    
    setEnabled: $empty
    
});