
Jx.Plugin.Editor.Alignment = new Class({
    
    Family: 'Jx.Plugin.Editor.Aligmment',
    
    Extends: Jx.Plugin.Editor.ButtonSet,
    
    name: 'alignment',
    
    options: {
        buttons: {
            justifyleft: {
                image: Jx.aPixel.src,
                imageClass: 'JustifyLeft',
                title: 'Align Left',
                css: {'text-align': 'left'}
            },
            justifyright: {
                image: Jx.aPixel.src,
                imageClass: 'JustifyRight',
                title: 'Align Right',
                css: {'text-align': 'right'}
            },
            justifycenter: {
                image: Jx.aPixel.src,
                imageClass: 'JustifyCenter',
                title: 'Align Center',
                css: {'text-align': 'center'},
                tags: ['center']
            },
            justifyfull: {
                image: Jx.aPixel.src,
                imageClass: 'JustifyFull',
                title: 'Align Full',
                css: {'text-align': 'justify'}
            }
        }
    }
        
});