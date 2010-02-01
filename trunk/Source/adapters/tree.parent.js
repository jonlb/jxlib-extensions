/**
 * Class: Jx.Adapter.Tree.Parent
 * This class adapts a table adhering to the classic Parent-style "tree table".
 * 
 * Basically, the store needs to have a column that will indicate each the 
 * parent of each row. The root(s) of the tree should be indicated by a "-1" 
 * in this column. The name of the "parent" column is configurable in the 
 * options.
 * 
 * if useAjax option is set to true then this adapter will send an Ajax request
 * to the server, through the store's strategy (should be Jx.Store.Strategy.Progressive)
 * to request additional nodes. Also, a column indicating whether this is a folder needs 
 * to be set as there is no way to tell if a node has children without it.
 */
Jx.Adapter.Tree.Parent = new Class({
    
    Family: 'Jx.Adapter.Tree.Parent',
    Extends: Jx.Adapter.Tree,
    
    options: {
        parentColumn: 'parent',
        folderColumn: 'folder'
    },
        
    /**
     * APIMethod: hasChildren
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    hasChildren: function (index) {
        if (this.options.useAjax) {
            return this.store.get(this.options.folderColumn, index);
        } else {
            //check to see if there are any rows with the primary key of the passed index
            var id = this.store.get('primaryKey', index);
            for (var i = 0; i < this.store.count()-1;i++) {
                if (this.store.get(this.options.parentColumn, i) === id) {
                    return true;
                }
            }
            return false;
        }
    },
    
    /**
     * APIMethod: hasParent
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    hasParent: function (index) {
        if (this.store.get(this.options.parentColumn, index).toInt() !== -1) {
            return true;
        } 
        return false;
    },
    
    /**
     * APIMethod: getParentIndex
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    getParentIndex: function (index) {
        //get the parent based on the index
        var pk = this.store.get(this.options.parentColumn, index);
        return this.store.findByColumn('primaryKey', pk);
    }
});