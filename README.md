# Comprende - List Comprehensions for JavaScript

Comprende is a JavaScript library for building compiled, parameterized list comprehensions.

#### Features
* Iterate over arrays or numeric ranges.
* Supports both string-based comprehensions and chained comprehension expressions.
* Expressions are compiled into functions and memoized on first use.
* Expressions can and should be parameterized to improve performance and security.

## Get Started

* [Project Home](http://www.codistic.com/projects/comprende/)
* [Examples](http://www.codistic.com/projects/comprende/examples/)


## Warning

Incorrect use of Comprende on the server-side can lead to SQL Injection-like attacks. Always use the params object for parameterized queries.

You will also get better performance using params because it allows an expression to be compiled only once, instead of once per parameter.

**Don't do this:**

```javascript
comprende(list1).from('i').where('i.a == ' + value).exec(); //BAD
```

**Do this instead:**
```javascript
comprende(list1, { value: 1 }).from('i').where('i.a == params.value').exec(); //GOOD
```


## The `comprende` Global Function

Use Comprende via the comprende() global function.

```javascript
comprende()
comprende([array list])
comprende(string expression, [array list])
comprende(string expression, [object params])
comprende(string expression, [array list], [object params])
comprende([object params])
```

```array list```

Uses the passed array as the source of the comprehension. If the comprehension includes an ```of``` clause, the array argument is optional.

```object params```

Makes the object's properties available within expressions via the ```params``` object.

```string expression```

The expression to be comprehended.


## String Comprehensions

```javascript
comprende('from i of [0..10] where i % 2 === 0 select i orderBy i').exec();
```

#### from _itemIdentifier_
Specifies the local variable name of the currently iterated item.
#### of _range_
Specifies the source list for the comprehension.
#### where _expression_
Specifies the filter criteria for the comprehension.
#### orderBy _expression_
Specifies the sort order for the comprehension's results.
#### orderByDesc _expression_
Specifies the reversed sort order for the comprehension's results.
#### select _expression_
Specifies the resultant value of each item returned by the comprehension (AKA map).

## Chained Comprehensions

```javascript
comprende().from('i').of('[0..10]').where('i % 2 === 0').select('i').orderBy('i').exec()
```

#### `.from(string itemIdentifier)`
Specifies the local variable name of the currently iterated item.
#### `.of(string rangeExpression | array list)`
Specifies the source list for the comprehension.
#### `.where(string expression | function func | object filterObject)`
Specifies the filter criteria for the comprehension.
#### `.orderBy(string expression)`
Specifies the sort order for the comprehension's results.
#### `.orderByDesc(string expression)`
Specifies the reversed sort order for the comprehension's results.
#### `.select(string expression | function func | array fieldList)`
Specifies the resultant value of each item returned by the comprehension (AKA map).

## Executing the Comprehension

Chain from, of, where, orderBy, and select methods together, then execute the comprehension with one of the following methods:

#### `exec()` aka `all()`

Returns the results of the comprehension.

#### ```each(func, [context])```

Executes ```func``` on each of the comprehension results. The optional argument ```context``` will be the ```this``` for the mapping function.

```func``` should have the signature: (element, index, list).

#### ```first([n])```

Returns the first item of the comprehension. If ```n``` is provided, an array of up to ```n``` items will be returned.

#### ```map(func, [context])```

Returns the comprehension results transformed by ```func```. The optional argument ```context``` will be the ```this``` for the mapping function.

```func``` should have the signature: (element, index, list).

## Range Comprehensions

#### Range Syntax

```javascript
[start..end, (step)]
```

#### Range Examples

```javascript
comprende('from i of [0..10] where i % 2 === 0 select i').exec(); //[0,2,4,6,8,10]
comprende('from i of [0..10,2] select i').exec(); //[0,2,4,6,8,10]
```

## Dependencies
Comprende can run in the browser or in Node.

Comprende requires [Underscore.js](http://underscorejs.org).

## License
Comprende is distributed under the MIT license as tweetware. If you like it, please tweet about it.

## Contributors
Comprende was written by Jason Stehle.

## Acknowledgements
Comprende was influenced by and borrows from Linq, Python, CoffeeScript, and SQL.
