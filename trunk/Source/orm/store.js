/**
 * Class: sgd.orm.store
 * This store is an extension of the base <sgd.store>. It allows the definition
 * of the fields in the gears database table as well as the primary key.
 * 
 * Fields should be defined as follows.
 * 
 * (code)
 * fields: [{
 * 		columnName: 'column',
 * 		type: SqlType,
 * 		allowNull: true|false
 * },{...next fields...}]
 * (end)
 * 
 * You should always define a primary key with the same attributes as the 
 * fields. If you fail to define a primary key one will be defined for you.
 * 
 * SqlType is one of "Integer", "Float", "String", and "Blob"
 */
sgd.orm.store = new Class({
	
	Extends: sgd.store.groupable,
	
	options: {
		table: null,
		primary: {
			columnName: "id",
			type: "Integer",
			allowNull: false
		},
		fields: [],
		connection: null,
		
		//events
		onBeforeDelete: $empty,
		onAfterDelete: $empty,
		onBeforeSave: $empty,
		onAfterSave: $empty,
		onBeforeLoad: $empty,
		onAfterLoad: $empty
	},
	
	table: null,
	_connection: null,
	_sql: null,
	_query: null,
	orm: null,
	
	initialize: function(orm, options){
		this.parent(options);
		
		this.orm = orm;
		this.table = this.options.table;
		this._connection = this.orm.getConnection();
		
		//convert the sqlTypes
		this.options.primary.type = this._connection.typeToSql[this.options.primary.type]();
		if (this.options.primary.type === "INTEGER") {
			this.options.primary.type += " PRIMARY KEY"
		}
		this.options.cols.include(this.options.primary.columnName);
		this.options.fields.each(function(field){
			field.type = this._connection.typeToSql[field.type]();
			this.options.cols.include(field.columnName);
		},this);
		
		this._connection.open();
		
		
		this._sql = new sgd.orm.sql(this);
		this._query = new sgd.orm.query(this._sql);
		
		
		orm.addStore(this);
		
		//check to see if the table exists in the DB. If not, create it.
		if (!this.tableExists()) {
			this.createTable();
		}
		
	},
	
	load: function(sql,params){
		this.fireEvent('beforeLoad',this);
		if ($type(sql) === 'number'){
			//this is an id, pull the row.
			c = this.options.primary.columnName + "= ?";
			s = this._sql.getSelectSql(null, c);
			this._processData(this._connection.execute(s,[sql]));
		} else if (sql instanceof sgd.orm.query) {
			this._processData(this._connection.execute(sql.getSql(), sql.getParams()));
		} else {
			this._processData(this._connection.execute(sql,params));
		}
		this.fireEvent('afterLoad',this);
	},
	
	save: function(id){
		this.fireEvent('beforeSave',[this,id]);
		//check for id column. If not set, this is an insert, else an update
		var d;
		if ($defined(id)) {
			d = this._data[id];
		} else {
			d = this._data[this._index];
		}
		if (this._isRowDirty(d)) {
			d.erase('dirty');
			if (d.has(this.options.primary.columnName)) {
				this._update(d);
			}
			else {
				this._insert(d);
			}
		}
		
		this.fireEvent('afterSave',[this,id]);
	},
	
	empty: function(){
		this._data.empty();
		this._index = 0;
	},
	
	update: function(obj){
		if ($defined(obj) && $type(obj)==='hash'){
			this._update(obj);
		}
	},
	
	insertNew: function(obj){
		if ($defined(obj) && $type(obj)==='hash'){
			this._insert(obj);
			this._processData(obj);
		}
	},
	
	remove: function(id){
		this.fireEvent('beforeDelete',[this,id]);
		if (!$defined(id)){
			this._delete(this._data[this._index]);
		} else {
			i = this._resolvePrimary(id);
			this._delete(this._data[i]);
		}
		this.fireEvent('afterDelete',[this,id]);
	},
	
	query: function(){
		return this._query;
	},
	
	resetQuery: function(){
		this._query.reset();
		return this._query;
	},
	
	getRowObject: function(id){
		var d;
		if ($defined(id) && $type(id)==='number') {
			d = this._data[id];
		} else {
			d = this._data[this._index];
		}
		return d;
	},
	
	getRowArray: function(obj){
		var d;
		if ($defined(obj) && $type(obj)==='hash'){
			d = obj;
		} else {
			d = this._data[this._index];			
		}
		arr = [];
		this.options.cols.each(function(col){
			if (col !== this.options.primary.columnName && d.has(col)) {
				arr.push(d.get(col));
			}
		},this);
		//the primary column should be last
		if (d.has(this.options.primary.columnName)){
			arr.push(d.get(this.options.primary.columnName));
		}
		return arr;
	},
	
	moveToPrimaryKey: function(id){
		this.moveTo(this._resolvePrimary(id));
	},
	
	getConnection: function(){
		return this._connection;
	},
	
	tableExists: function(){
		var s = this._sql.getTableExistsSql();
		this._connection.executeNonQuery(s);
		return !!this._connection.getRowsAffected();
	},
	
	createTable: function(){
		this._connection.executeNonQuery(this._sql.getCreateTableSql());
	},
	
	dropTable: function(){
		this._connection.executeNonQuery(this._sql.getDropTableSql());
	},
	
	close: function(){
		this._connection.close();
	},
	
	/**
	 * Method: _processData
	 * Overrides <sgd.store#_processData>. This version accepts only a 
	 * gears resultSet. It will iterate through the columns, setting the
	 * col options, and then iterate the resultSet and create new Hash() objects
	 * for each row of the result set.
	 * 
	 * Parameters:
	 * data - {resultSet} the Gears result set that this store will hold.
	 */
	_processData: function(data){
		if (!$defined(data)) { 
			this.fireEvent('loadError',[this,data]);
		}
		
		if (!$defined(this._data)){
			this._data = new Array();
		}
		
		if (!$defined(this.options.cols)) {
			var numFields = data.fieldCount();
			for (i = 0; i < numfields; i++) {
				this.options.cols.include(data.fieldName(i));
			}
		}
		if ($type(data) === 'hash') {
			this._data.include(data);
		}
		else if ($defined(data.isValidRow)) {
			while (data.isValidRow()) {
				var d = new Hash();
				this.options.cols.each(function(fieldName){
					d.set(fieldName, data.fieldByName(fieldName));
				}, this);
				this._data.include(d);
				data.next();
			}
			data.close();
		}
		
		this.fireEvent('afterLoad',this);
	},
	
	_delete: function(obj){
		this._connection.executeNonQuery(this._sql.getDeleteSql(this.options.primary.columnName + " =  ?"),[obj.get(this.options.primary.columnName)]);
		return this._connection.getRowsAffected();
	},
	
	_update: function(obj){
		var s = this._sql.getUpdateSql(obj);
		this._connection.executeNonQuery(s,this.getRowArray(obj));
		return this._connection.getRowsAffected();
	},
	
	_insert: function(obj){
		var s = this._sql.getInsertSql(obj);
		this._connection.executeNonQuery(s,this.getRowArray(obj))
		obj.set(this.options.primary.columnName, this._connection.getLastInsertId());
		return this._connection.getRowsAffected();
	},
	
	_resolvePrimary: function(id){
		var c = this.options.primary.columnName;
		for (var i = 0,l = this._data.length;i<l;i++){
			if (this._data[i].has(c) && this._data[i].get(c) === id) {
				return i;
			}
		}
		return null;
	}
});
