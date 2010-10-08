/*
---

name: Jx.Adaptor.ListView.Fill

description:

license: MIT-style license.

requires:
 - Jx.Adaptor.ListView
 - jxlib/Jx.ListItem

provides: [Jx.Adaptor.ListView.Fill]

css:
-

images:
-

...
 */
Jx.Adaptor.ListView.Fill = new Class({

    Family: 'Jx.Adaptor.Listview.Fill',
    Extends: Jx.Adaptor,
    Binds: ['fill'],

    name: 'listview.fill',

    options: {
        itemTemplate: "<li class='jxListItemContainer'><a class='jxListItem' href='javascript:void(0);'><span class='itemLabel'>{label}</span></a></li>",
        emptyMessage: null
    },

    itemColumnsNeeded: null,

    init: function () {
        this.parent();
    },

    attach: function (listview) {
        this.parent(listview);

        this.currentIndex = 0;

        this.store.addEvents({
            'storeDataLoaded': this.fill,
            'storeDataLoadFailed': this.fill,
            'storeRecordDeleted': this.fill
        });
        if (this.store.loaded) {
            this.fill();
        }
    },

    detach: function () {
        this.parent();
        this.store.removeEvents({
            'storeDataLoaded': this.fill,
            'storeDataLoadFailed': this.fill,
            'storeRecordAdded': this.fill,
            'storeRecordDeleted': this.fill
        });
    },

    fill: function () {
        this.widget.empty();

        if (!$defined(this.columnsNeeded)) {
            this.columnsNeeded = this.store.parseTemplate(this.options.template);
        }

        if (!$defined(this.itemColumnsNeeded)) {
            this.itemColumnsNeeded = this.store.parseTemplate(this.options.itemTemplate);
        }


        var items = [];

        var maxRecords = this.store.count();
        if (maxRecords > 0) {
            for (var i = 0; i < maxRecords; i++) {
                var template = this.store.fillTemplate(this.store.getRecord(i), this.options.template, this.columnsNeeded);
                var o = {label: template};
                var theTemplate = this.store.fillTemplate(this.store.getRecord(i), this.options.itemTemplate, this.columnsNeeded, o);
                var item = new Jx.ListItem({template:theTemplate});
                document.id(item).store('storeId',i);
                items.push(item);
            }
        } else {
            var template = "<li class='jxListItemContainer'><a class='jxListItem' href='javascript:void(0);'><span class='itemLabel'>{label}</span></a></li>";
            var o = {
                label: this.options.emptyMessage
            }
            var theTemplate = new String(template).substitute(o);
            var item = new Jx.ListItem({template:theTemplate});
            items.push(item);
        }

        this.widget.add(items);

        this.store.addEvent('storeRecordAdded', this.fill);
        

    }
});