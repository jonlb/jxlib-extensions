/**
 * Class: Jx.Adapter.Tree
 * This base class is used to change a store (a flat list of records) into the
 * data structure needed for a Jx.Tree. It will have 2 subclasses: <Jx.Adapter.Tree.MPTT>
 * and <Jx.Adapter.Tree.Parent>
 * 
 *  
 */
Jx.Adapter.Tree = new Class({
    
    Family: 'Jx.Adapter.Tree',
    Extends: Jx.Object,
    
    options: {
        /**
         * Option: useAjax
         * Determines if this adapter should use ajax to request data on the
         * fly. 
         */
        useAjax: false
    },
    
    parameters: ['tree', 'store', 'options'],
    
    init: function () {
        this.parent();
        
    },
    
    /**
     * APIMethod: fill
     * Takes data from the store and fills in the Jx.Tree object.
     */
    fill: $empty
});