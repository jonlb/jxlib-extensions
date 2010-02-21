
Jx.Plugin.Editor.Unlink = new Class({
    
    Family: 'Jx.Plugin.Editor.Unlink',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'unlink',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Unlink',
        toggle: false,
        title: 'Remove Hyperlink'
    },
    
    action: 'unlink'
    
});