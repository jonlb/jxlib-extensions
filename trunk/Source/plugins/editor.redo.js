
Jx.Plugin.Editor.Redo = new Class({
    
    Family: 'Jx.Plugin.Editor.Redo',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'redo',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Redo',
        toggle: false,
        shortcut: 'y',
        title: 'Redo'
    },
    
    
    action: 'redo'
    
});