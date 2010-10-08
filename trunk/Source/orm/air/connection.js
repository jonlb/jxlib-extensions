/**
 * Class: sgd.orm.air.connection
 */
sgd.orm.air.connection = new Class({
	
	Implements: [Options],
	
	options: {},
	
	conn: null,
	stmt: null,
	
	initialize: function(options){
		this.setOptions(options);
	},
	
	open: function(){
		if (!$defined(this.conn)) {
			this.conn = new air.SQLConnection();
			var dbFile = air.File.applicationStorageDirectory.resolvePath(this.options.host);
			this.conn.open(dbFile);
			this.stmt = new air.SQLStatement();
			this.stmt.sqlConnection = this.conn;
		}
	},
	
	close: function(){
		this.conn.close();
	},
	
	setParams: function(params){
		params.each(function(item,index){
			this.stmt.parameters[index] = item;
		},this);
	},
	
	execute: function(sql,params){
		this.stmt.text = sql;
		if (params) {
			this.setParams(params);
		} 
		this.stmt.execute();
		return this.stmt.getResult();
	},
	
	executeNonQuery: function(sql,params){
		if (params) {
			this.setParams(params);
		} 
		this.stmt.text = sql;
		this.stmt.execute();
	},
	
	executeScalar: function(sql,params) {
		this.stmt.text = sql;
		if (params) {
			this.setParams(params);
		}
		this.stmt.execute();
		var result = this.stmt.getResult();
		return result.data[0][0];
	},
	
	getLastInsertId: function(){
		return this.stmt.lastInsertRowID;
	},
	
	getRowsAffected: function(){
		return this.conn.rowsAffected;
	},
	
	typeToSql: {
		"Integer": function(){
			return 'INTEGER';
		},
		"Float": function(){
			return 'REAL';
		},
		"String": function(){
			return 'TEXT';
		},
		"Blob": function(){
			return 'BLOB';
		}
	}
	
});
