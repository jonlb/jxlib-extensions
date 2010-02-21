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
    Extends: Jx.Adapter,
    
    Binds: ['fill','checkFolder'],
    
    options: {
        /**
         * Option: useAjax
         * Determines if this adapter should use ajax to request data on the
         * fly. 
         */
        useAjax: false,
        startingNodeKey: 0,
        folderOptions: {
            image: null,
            imageClass: null
        },
        itemOptions: {
            image: null,
            imageClass: null
        }
    },
    
    folders: new Hash(),
    
    currentRecord: 0,
    
    init: function () {
        this.parent();
        
        this.tree = this.widget;
        
        this.tree.addEvent('disclose', this.checkFolder);
        
        if (this.options.useAjax) {
            this.strategy = this.store.getStrategy('progressive');
        
            if (!$defined(this.strategy)) {
                this.strategy = new Jx.Store.Strategy.Progressive({
                    dropRecords: false,
                    getPaginationParams: function () { return {}; }
                });
                this.store.addStrategy(this.strategy);
            } else {
                this.strategy.options.dropRecords = false;
                this.strategy.options.getPaginationParams = function () { return {}; };
            }
            
        }
        
        this.store.addEvent('storeDataLoaded', this.fill);
        
        //initial store load
        this.store.load({
            node: this.options.startingNodeKey
        });
    },
    
    /**
     * APIMethod: fill
     * This function will start at this.currentRecord and add the remaining
     * items to the tree. 
     */
    fill: function () {
        var l = this.store.count() - 1;
        for (var i = this.currentRecord; i <= l; i++) {
            var template = this.fillTemplate(i);

            var item;
            if (this.hasChildren(i)) {
                //add as folder
                var item = new Jx.TreeFolder($merge(this.options.folderOptions, {
                    label: template
                }));
                
                this.folders.set(i,item);
            } else {
                //add as item
                var item = new Jx.TreeItem($merge(this.options.itemOptions, {
                    label: template
                }));
            }
            $(item).store('index', i);
            $(item).store('jxAdapter', this);
            //check for a parent
            if (this.hasParent(i)) {
                //add as child of parent
                var p = this.getParentIndex(i);
                var folder = this.folders.get(p);
                folder.add(item);
            } else {
                //otherwise add to the tree itself
                this.tree.add(item);
            }
        }
        this.currentRecord = l;
    },
    
    checkFolder: function (folder) {
        var items = folder.items();
        if (!$defined(items) || items.length === 0) {
            //get items via the store
            this.store.load({
                node: $(folder).retrieve('index')
            });
        }
    },
    
    hasChildren: $empty,
    
    hasParent: $empty,
    
    getParentIndex: $empty
    
    
});