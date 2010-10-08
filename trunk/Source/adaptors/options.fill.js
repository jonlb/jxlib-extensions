/*
---

name: Jx.Adaptor.OptionGroup.Fill

description:

license: MIT-style license.

requires:
 - Jx.Adaptor.OptionGroup

provides: [Jx.Adaptor.OptionGroup.Fill]


...
 */
Jx.Adaptor.OptionGroup.Fill = new Class({

    Family: 'Jx.Adaptors.OptionGroup.Fill',
    Extends: Jx.Adaptor,
    name: 'optionGroup.Fill',
    Binds: ['fill'],

    options: {
        selectedFn: null,
        valueColumn: null
    },

    init: function () {
        this.parent();
    },

    attach: function (optionGroup) {
        this.parent(optionGroup);

        this.store.addEvent('storeDataLoaded', this.fill);
        if (this.store.loaded) {
            this.fill();
        }
    },

    detach: function () {
        this.parent();

        this.store.removeEvent('storeDataLoaded', this.fill);
    },

    fill: function () {
        this.widget.empty();

        if (!$defined(this.columnsNeeded)) {
            this.columnsNeeded = this.store.parseTemplate(this.options.template);
        }

        var items = [];
        this.store.each(function(record){
            var template = this.store.fillTemplate(record, this.options.template, this.columnsNeeded);
            var selected = false;
            if ($type(this.options.selectedFn) == 'function') {
                selected = this.options.selectedFn.run(record);
            }
            var obj = {
                label: template,
                selected: selected,
                value: record.get(this.options.valueColumn)
            }

            items.push(obj);
        },this);

        this.widget.add(items);
    }
});