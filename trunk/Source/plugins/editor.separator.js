
Jx.Plugin.Editor.Separator = new Class({
    
    Family: 'Jx.Plugin.Editor.Separator',
    Extends: Jx.Plugin,
    name: 'separator',
    
    attach: function (editor) {
        this.button = new Jx.Toolbar.Separator();
        editor.toolbar.add(this.button);
    }
});