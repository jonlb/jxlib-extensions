/**
 * Jx.Adapter namespace
 */
Jx.Adapter = new Class({
    
    Family: 'Jx.Adapter',
    
    Extends: Jx.Object,
    
    options: {
        template: '',
        useTemplate: true
    },
    
    parameters: ['store','widget','options'],
    
    init: function () {
        this.parent();
        this.widget = this.options.widget;
        this.store = this.options.store;
        
        if (this.options.useTemplate) {
            this.columnsNeeded = this.parseTemplate();
        }
    },
    
    /**
     * Method: parseTemplate
     * parses the provided template to determine which store columns are
     * required to complete it.
     *
     * Parameters:
     * template - the template to parse
     */
    parseTemplate: function () {
        //we parse the template based on the columns in the data store looking
        //for the pattern {column-name}. If it's in there we add it to the
        //array of ones to look for
        var columns = this.store.getColumns();
        var arr = [];
        columns.each(function (col) {
            var s = '{' + col.name + '}';
            if (this.options.template.contains(s)) {
                arr.push(col.name);
            }
        }, this);
        return arr;
    }.protect(),
    
    /**
     * Method: fillTemplate
     * Actually does the work of getting the data from the store
     * and creating a single item based on the provided template
     * 
     * Parameters: 
     * index - the index of the data in the store to use in populating the
     *          template.
     */
    fillTemplate: function (index) {
        //create the item
        var itemObj = {};
        this.columnsNeeded.each(function (col) {
            itemObj[col] = this.store.get(col, index);
        }, this);
        return this.options.template.substitute(itemObj);
    }.protect(),
    
    /**
     * APIMethod: fill
     * Takes data from the store and fills in the widget object. This
     * should be implemented by the adapter subclasses.
     */
    fill: $empty
    
});