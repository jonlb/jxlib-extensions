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
Jx.Adapter.Tree.Mptt = new Class({
    
    Family: 'Jx.Adapter.Tree.Mptt',
    Extends: Jx.Adapter.Tree,
    
    options: {
        left: 'left',
        right: 'right'
    },
        
    /**
     * APIMethod: hasChildren
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    hasChildren: function (index) {
        var l = this.store.get(this.options.left, index).toInt();
        var r = this.store.get(this.options.right, index).toInt();
        return (l + 1 !== r);
    },
    
    /**
     * APIMethod: hasParent
     * 
     * Parameters: 
     * index - {integer} the array index of the row in the store (not the 
     *          primary key).
     */
    hasParent: function (index) {
        var i = this.getParentIndex(index);
        if ($defined(i)) {
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
        var l = this.store.get(this.options.left, index).toInt();
        var r = this.store.get(this.options.right, index).toInt();
        for (var i = index-1; i >= 0; i--) {
            var pl = this.store.get(this.options.left, i).toInt();
            var pr = this.store.get(this.options.right, i).toInt();
            if (pl < l && pr > r) {
                return i;
            }
        }
        return null;
    }
});