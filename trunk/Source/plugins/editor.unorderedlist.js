
Jx.Plugin.Editor.Unorderedlist = new Class({
    
    Family: 'Jx.Plugin.Editor.Unoderedlist',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'unorderedlist',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'UnorderedList',
        toggle: false,
        title: 'Unordered List'
    },
    
    tags: ['ul'],
    action: 'insertunorderedlist'
    
});