
Jx.Plugin.Editor.Indent = new Class({
    
    Family: 'Jx.Plugin.Editor.Indent',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'indent',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'Indent',
        toggle: false,
        title: 'Indent'
    },
    
    tags: ['blockquote'],
    action: 'indent'
    
});