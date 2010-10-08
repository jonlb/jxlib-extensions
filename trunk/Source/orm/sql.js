/**
 * Class: sgd.orm.sql
 */
sgd.orm.sql = new Class({
	
	Implements: [Options,Events],
	
	options: {},
	
	initialize: function(store){
		this.options = store.options;
	},
	
	/**
	 * Method: getDeleteSql
	 * Returns an sql statement that will delete an object based on 
	 * the where clause that is passed in.
	 * 
	 * Parameters:
	 * where - an array that contains all of the components of the where. Will be 
	 * 			joined by AND
	 */
	getDeleteSql: function(where){
		var sql = ["DELETE FROM ", this.options.table];
		if ($defined(where)){
			sql.include(" WHERE ");
			if ($type(where) === 'array' && where.length > 1) {
				sql.include(where.join(" AND "));
			} else {
				sql.include(where);
			}
		}
		return sql.join("");
	},
	
	getCountSql: function(where){
		var sql = ["SELECT COUNT(", this.options.primary.columnName, ") AS c FROM ", this.options.table];
		if ($defined(where)){
			sql.include(" WHERE ");
			if (where.length > 1) {
				sql.include(where.join(" AND "));
			} else {
				sql.include(where);
			}
		}
		return sql.join("");
	},
	
	getSelectSql: function(fields, where, orderBy, limit, offset){
		if (!$defined(fields) || fields.length < 1){
			fields = ["*"];
		} else {
			fields = fields.join(",");
		}
		
		var sql = ["SELECT ", fields," FROM ",this.options.table];
		if ($defined(where) && where.length > 0) {
			sql.include(" WHERE ");
			if ($type(where) === "array") {
				sql.include(where.join(" AND "));
			} else {
				sql.include(where);
			}
		}
		if ($defined(orderBy) && orderBy.length > 0) {
			sql.include(" ORDER BY ");
			if ($type(orderBy) === "array") {
				sql.include(orderBy.join(","));
			} else {
				sql.include(orderBy);
			}
		}
		if ($defined(limit) && limit != 0) {
			sql.include(" LIMIT ");
			sql.include(limit);
		}
		if ($defined(limit) && $defined(offset) && limit != 0 && offset != 0){
			sql.include(" OFFSET ");
			sql.include(offset);
		}
		return sql.join("");
	},
	
	getCreateTableSql: function(){
		
		var sql = ["CREATE TABLE IF NOT EXISTS ",this.options.table," ("];
		
		sql.push(this.options.primary.columnName," ",this.options.primary.type,",");
		this.options.fields.each(function(field){
			sql.push(field.columnName," ",field.type,",");
		},this);
		sql = sql.splice(0,sql.length-1);
		sql.push(")");
		return sql.join("");
	},
	
	getInsertSql: function(obj){
		var sql = ["INSERT INTO ",this.options.table," ("];
		if ($defined(obj)){
			sql.push(this._fields(obj));
			sql.push(") VALUES (");
			sql.push(this._values(obj));
		} else {
			sql.push(this._fields())
			sql.push(") VALUES (");
			sql.push(this._values());
		}
		sql.push(")");
		return sql.join("");
	},
	
	getUpdateSql: function(obj){
		var sql = ["UPDATE ",this.options.table," SET "];
		if ($defined(obj)){
			sql.push(this._fieldsValue(obj));
		} else {
			sql.push(this._fieldsValue());
		}
		sql.push(" WHERE ",this.options.primary.columnName," = ?");
		return sql.join("");
	},
	
	getDropTableSql: function(){
		return "DROP TABLE IF EXISTS " + this.options.table;
	},
	
	getTableExistsSql: function(){
		return "SELECT name FROM sqlite_master WHERE type='table' and name='" + this.options.table + "'";
	},
	
	_fieldsValue: function(obj){
		var fields = [];
		var flag = $defined(obj);
		//if we are passed an object, build this based on the object not the fields options
		this.options.fields.each(function(field){
			if (flag){		
				if (obj.has(field.columnName)){
					fields.push(field.columnName + " = ?");
				}
			} else {
				fields.push(field.columnName + " = ?");
			}
		},this);
		return fields.join(",");
		
	},
	
	_fields: function(obj){
		var fields = [];
		var flag = $defined(obj);
		//if we are passed an object, build this based on the object not the fields options
			if (flag){		
				var keys = obj.getKeys();
				fields = fields.concat(keys);
			} else {
				this.options.fields.each(function(field){
					fields.push(field.columnName);
				},this);
			}

		return fields.join(",");
	},
	
	_values: function(obj){
		var values = [];
		var l;
		//if we are passed an object, build this based on the object not the fields options
		if ($defined(obj)){		
			l = obj.getLength();
		} else {
			l = this.options.fields.length;
		}
		for (var i = 0; i<l;i++){
			values.push("?");
		}
		return values.join(",");
	}
});
