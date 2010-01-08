// $Id: toolbar.separator.js 443 2009-05-21 13:31:59Z pagameba $
/**
 * Class: Jx.Toolbar.Separator
 *
 * Extends: <Jx.Object>
 *
 * A helper class that represents a visual separator in a <Jx.Toolbar>
 *
 * Example:
 * (code)
 * (end)
 *
 * License: 
 * Copyright (c) 2008, DM Solutions Group Inc.
 * 
 * This file is licensed under an MIT style license
 */
Jx.Toolbar.Separator = new Class({
    Family: 'Jx.Toolbar.Separator',
    Extends: Jx.Object,
    /**
     * Property: domObj
     * {HTMLElement} The DOM element that goes in the <Jx.Toolbar>
     */
    domObj: null,
    /**
     * Constructor: Jx.Toolbar.Separator
     * Create a new Jx.Toolbar.Separator
     */
    initialize: function() {
        this.domObj = new Element('li', {'class':'jxToolItem'});
        this.domSpan = new Element('span', {'class':'jxBarSeparator'});
        this.domObj.appendChild(this.domSpan);
    }
});
