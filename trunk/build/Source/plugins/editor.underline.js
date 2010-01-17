
Jx.Plugin.Editor.Underline = new Class({
    
    Family: 'Jx.Plugin.Editor.Underline',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'underline',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Underline',
        toggle: true,
        shortcut: 'u',
        title: 'Underline'
    },
    
    tags: ['u'],
    css: {'text-decoration': 'underline'},
    action: 'underline'
    
});