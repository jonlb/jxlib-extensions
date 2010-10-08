/**
 * Class: sgd.orm.query
 * A Class that allows us to easily construct queries and pull results
 */
sgd.orm.query = new Class({
	
	store: null,
	_sql: null,
	_fields: [],
	_where: [],
	_orderBy: [],
	_params: [],
	_limit: 0,
	_offset: 0,
	
	initialize: function(sql){
		this._sql = sql;
	},
	
	where: function(clause, params){
		if ($type(clause)==='array'){
			this._where = this._where.concat(clause);
		} else {
			this._where.push(clause);
		}
		
		if ($type(params)==='array'){
			this._params = this._params.concat(params);
		} else {
			this._params.push(params);
		}
		return this;
	},
	
	orderBy: function(args){
		if ($type(args)==='array'){
			this._orderBy = this._orderBy.concat(args);
		} else {
			this._orderBy.push(args);
		}
		return this;
	},
	
	limit: function(limit){
		if ($type(limit)==='number'){
			this._limit = limit;
		}
		return this;
	},
	
	offset: function(offset){
		if ($type(offset)==="number"){
			this._offset = offset;
		}
		return this;
	},
	
	field: function(f){
		if ($type(f)==='array'){
			this._fields = this._fields.concat(f);
		} else {
			this._fields.push(f);
		}
		return this; 
	},
	
	getSql: function(){
		return this._sql.getSelectSql(
					this._fields,
					this._where,
					this._orderBy,
					this._limit,
					this._offset
		);
	},
	
	getParams: function(){
		return this._params;
	},
	
	reset: function(){
		this._fields = [];
		this._where = [];
		this._orderBy = [];
		this._params = [];
		this._limit = 0;
		this._offset = 0;
	}
	
	
});
