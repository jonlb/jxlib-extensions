
Jx.Plugin.Editor.Orderedlist = new Class({
    
    Family: 'Jx.Plugin.Editor.Orderedlist',
    
    Extends: Jx.Plugin.Editor.Button,
    
    name: 'orderedlist',
    
    options: {
        image: Jx.aPixel.src,
        imageClass: 'OrderedList',
        toggle: false,
        title: 'Ordered List'
    },
    
    tags: ['ol'],
    action: 'insertorderedlist'
    
});