//     Comprende.js 0.1.0
//     (c) 2013 Jason Stehle, http://www.codistic.com/projects/comprende/
//     Comprende.js may be freely distributed under the MIT license.

(function (global) {
	var memories = [];
	var _ = global._ || require('underscore');
	
	if (!global.console) {
		global.console = { log: function () {} };
	}
	
	//Trim shim from Mozilla https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/String/Trim
	if (!String.prototype.trim) {
		String.prototype.trim = function () {
			return this.replace(/^\s+|\s+$/g,'');
		};
	}
	
	function expandRangeExpression(range) {
		var rangeParts = range.replace(/[\[\]]/g, '').split(','),
			i, startEnd = rangeParts[0].split('..'),
			start = parseInt(startEnd[0], 10),
			end = parseInt(startEnd[1], 10),
			step = rangeParts[1] ? parseInt(rangeParts[1], 10) : (start > end ? -1 : 1),
			arr = [];
		
		if (step > 0) {
			for (i = start; i <= end; i += step) {
				arr.push(i);
			}
		} else {
			for (i = start; i >= end; i += step) {
				arr.push(i);
			}
		}
		return arr;
	}
	
	function compileExpr(expr, paramName) {
		var func, memoKey = paramName + '|||' + expr;
		
		if (!memories[memoKey]) {
			//memoize functions for performance.
			func = new Function(paramName, 'params', 'return ' + expr + ';');
			memories[memoKey] = func;
		} else {
			//console.log('Using memoized expression', memoKey);
		}
		
		return memories[memoKey];
	}
	
	function parseComprehension(comprehension, list, params) {
		var forParts = {},
			key = null,
			item,
			i,
			internal,
			orderBy = null,
			forArray = comprehension.match(/\bfrom\b|\bof\b|\bwhere\b|\bselect\b|\borderBy\b|\borderByDesc\b|./g);
		
		if (memories[comprehension]) {
			//grab memoized internal
			internal = memories[comprehension];
			//console.log('Using memoized comprehension', comprehension);
		} else {
			if (!params) {
				params = (list && !_.isArray(list) && _.isObject(list)) ? list : {};
			}
		
			list = list || [];
		
			for (i = 0; i < forArray.length; i++) {
				item = forArray[i];
			
				switch (item) {
					case 'from':
					case 'of':
					case 'select':
					case 'orderBy':
					case 'orderByDesc':
					case 'where':
						key = item;
						forParts[key] = [];
						break;
					default:
						if (key !== null) {
							forParts[key].push(item);
						}
						break;
				}
			}
			
			for (key in forParts) {
				if (forParts.hasOwnProperty(key)) {
					forParts[key] = forParts[key].join('').trim();
				}
			}
			
			//console.log(forParts);
			
			if (forParts.orderBy) {
				orderBy = compileExpr(forParts.orderBy, forParts.from);
			} else if (forParts.orderByDesc) {
				orderBy = compileExpr(forParts.orderByDesc, forParts.from);
				orderBy.desc = true;
			}
		
			internal = {
				wheres: forParts.where ? [compileExpr(forParts.where, forParts.from)] : [],
				from: forParts.from || 'item',
				of: forParts.of ? expandRangeExpression(forParts.of) : null,
				orderBys: orderBy ? [orderBy] : [],
				select: forParts.select ? compileExpr(forParts.select, forParts.from) : passThrough
			};
		
			memories[comprehension] = internal;
			//console.log('Compiled comprehension', comprehension);
		}
		return {
			wheres: internal.wheres,
			from: internal.from,
			of: internal.of || list,
			orderBys: internal.orderBys,
			select: internal.select,
			params: params
		};
	}
	
	function filterExpr(list, func, params) {
		var i, _l, item, results = [];
		
		for (i = 0, _l = list.length; i < _l; i++) {
			item = list[i];
			if (func(item, params)) {
				results.push(item);
			}
		}
		return results;
	}
	
	function Comprende(internal) {
		this._internal = internal;
	}
	
	function passThrough(item) { return item; }
	
	Comprende.prototype = {
		from: function (expr) {
			this._internal.from = expr;
			return this;
		},
		of: function (expr) {
			if (_.isString(expr)) {
				this._internal.of = expandRangeExpression(expr);
			} else {
				this._internal.of = expr;
			}
			return this;
		},
		where: function (expr) {
			if (_.isFunction(expr)) {
				this._internal.wheres.push(expr);
			} else if (_.isString(expr)) {
				this._internal.wheres.push(compileExpr(expr, this._internal.from));
			} else if (_.isObject(expr)) {
				this._internal.wheres.push(function (item) {
					var key;
					for (key in expr) {
						if (expr.hasOwnProperty(key) && (item[key] !== expr[key])) { return false; }
					}
					return true;
				});
			}
			return this;
		},
		orderBy: function (expr, desc) {
			var compiledExpr = compileExpr(expr, this._internal.from);
			compiledExpr.desc = desc;
			this._internal.orderBys.push(compiledExpr);
			return this;
		},
		orderByDesc: function (expr) {
			return this.orderBy(expr, true);
		},
		select: function (expr) {
			if (_.isFunction(expr)) { //map function
				this._internal.select = expr; 
			} else if (_.isString(expr)) { //single property
				this._internal.select = compileExpr(expr, this._internal.from);
			} else if (_.isArray(expr)) { //array of properties
				this._internal.select = function (item) {
					var i, mapped = {}, key;
					if (item == null) { return null; }
					for (i = 0; i < expr.length; i++) {
						key = expr[i];
						mapped[key] = item[key];
					}
					return mapped;
				};
			}
			return this;
		},
		exec: function () {
			var i, _l,
				_internal = this._internal,
				list = _internal.of,
				wheres = _internal.wheres,
				ob,
				orderBys = _internal.orderBys,
				params = _internal.params;
			
			for (i = 0, _l = wheres.length; i < _l; i++) {
				list = filterExpr(list, wheres[i], params);
			}
			
			for (i = 0, _l = orderBys.length; i < _l; i++) {
				ob = orderBys[0];
				list = _.sortBy(list, ob);
				if (ob.desc) { list.reverse(); }
			}
			
			return _.map(list, _internal.select);
		},
		all: function () {
			return this.exec();
		},
		each: function (func, ctx) {
			_.each(this.exec(), func, ctx);
		},
		first: function (num) {
			return _.first(this.exec(), num);
		},
		map: function (func, ctx) {
			return _.map(this.exec(), func, ctx);
		}
	};

	var comprende = function () {
		var _internal = { wheres: [], from: 'item', of: [], orderBys: [], select: passThrough, params: {} },
			arg = arguments[0];
		
		if (arg) {
			if (_.isArray(arg)) {
				_internal.of = arg;
			} else if (_.isString(arg)) {
				_internal = parseComprehension(arg, arguments[1], arguments[2]); //string, array, object, or string, object
			} else if (_.isObject(arg)) {
				_internal.params = arg;
			}
		}
		
		arg = arguments[1];
		
		if (arg) {
			_internal.params = arg;
		}
		
		return new Comprende(_internal);
	};
	
	global.comprende = ((typeof module !== 'undefined' && module.exports) ? module : {}).exports = comprende;
	
})(this);