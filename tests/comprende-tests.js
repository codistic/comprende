
(function (global) {

var testaverde = global.testaverde || require('../dist/testaverde');
var comprende = global.comprende || require('../dist/comprende');

var list1 = [
	{ a: 1, b: 4, c: 1, d: 'z' },
	{ a: 0, b: 1, c: 2, e: 5 },
	{ a: 1, b: 3, c: 3, d: 'y' },
	{ a: 0, b: 2, c: 4, d: 'x' }
];

global.dd = function (i) {
	return i * 3;
}

/*
comprende(coll).from("i").where("i.d === 3").orderBy("i.n").select("i.f").exec();
comprende().from("i").of("0..10, 2").exec();
*/
var testCases = [
	{
		description: 'full string select',
		func: function () { return comprende(list1).from("i").where("i.a === 1").orderBy("i.b").select('i.c').exec(); },
		result: [3, 1]
	},
	{
		description: 'full string select reversed',
		func: function () { return comprende(list1).from("i").where("i.a === 1").orderBy("i.b", true).select('i.c').exec(); },
		result: [1, 3]
	},
	{
		description: 'minimal select map',
		func: function () { return comprende(list1).select(function (item) { return item.b; }).exec(); },
		result: [4, 1, 3, 2]
	},
	{
		description: 'using in',
		func: function () { return comprende().of(list1).select(function (item) { return item.b; }).exec(); },
		result: [4, 1, 3, 2]
	},
	{
		description: 'select array',
		func: function () { return comprende().from('i').of(list1).orderBy('i.b').select(['a', 'b']).exec(); },
		result: [{ a: 0, b: 1 }, { a: 0, b: 2 }, { a: 1, b: 3}, { a: 1, b: 4}]
	},
	{
		description: 'params test 1',
		func: function () { return comprende({ p1: 0 }).from('i').of(list1).where('i.a == params.p1').orderBy('i.b').select('i.b').exec(); },
		result: [1, 2]
	},
	{
		description: 'params test 2',
		func: function () { return comprende({ p1: 1 }).from('i').of(list1).where('i.a == params.p1').select('i.b').exec(); },
		result: [4, 3]
	},
	{
		description: 'range test 1',
		func: function () {
			return comprende({ p1: 3 }).from('i').of('[0..10]').where('i % params.p1 === 0').exec();
		},
		result: [0, 3, 6, 9]
	},
	{
		description: 'range test 2',
		func: function () {
			return comprende({ p1: 5 }).from('i').of('[0..10]').where('i % params.p1 === 0').exec();
		},
		result: [0, 5, 10]
	},
	{
		description: 'range test 3',
		func: function () {
			return comprende().from('i').of('[0..6,2]').exec();
		},
		result: [0, 2, 4, 6]
	},
	{
		description: 'range test 4',
		func: function () {
			return comprende().from('i').of('[5..1]').exec();
		},
		result: [5,4,3,2,1]
	},
	{
		description: 'range test 5',
		func: function () {
			return comprende().from('i').of('[5..1, -2]').exec();
		},
		result: [5,3,1]
	},
	{
		description: 'string comprehension 1',
		func: function () { return comprende('from i of [0..10] where i % 2 === 0 select i').exec(); },
		result: [0, 2, 4, 6, 8, 10]
	},
	{
		description: 'string comprehension 2',
		func: function () { return comprende('from i where i % 2 === 0 select i', [0,1,2,3,4]).exec(); },
		result: [0, 2, 4]
	},
	{
		description: 'string comprehension 3',
		func: function () { return comprende('from i where i % 2 === 0 select i', [9, 8, 7, 6]).exec(); },
		result: [8, 6]
	},
	{
		description: 'string comprehension with params 1',
		func: function () { return comprende('from i of [1..20] where i % params.p1 === 0 select i', { p1: 4 }).exec(); },
		result: [4,8,12,16,20]
	},
	{
		description: 'global function calls within comprehension', skip: 1,
		func: function () {
			return comprende('from i where dd(i.b) > 7 select i.d orderBy i.b', list1).exec();
		},
		result: ['y', 'z']
	},
	{
		description: 'first, compound where',
		func: function () {
			return comprende('from i where i.a === 1 && i.b === 3 select i.d orderBy i.b', list1).first();
		},
		result: 'y'
	},
	{
		description: 'first simple two',
		func: function () {
			return comprende('from i select i.b', list1).first(2);
		},
		result: [4, 1]
	},
	{
		description: 'first simple one',
		func: function () {
			return comprende('from i select i.b', list1).first();
		},
		result: 4
	},
	{
		description: 'first simple one explicit',
		func: function () {
			return comprende('from i select i.b', list1).first(1);
		},
		result: [4]
	},
	{
		description: 'map 1',
		func: function () {
			return comprende('from i', list1).map(function (item) { return { n: item.c }; });
		},
		result: [{n:1},{n:2},{n:3},{n:4}]
	},
	{
		description: 'map 2',
		func: function () {
			return comprende(list1).map(function (item) { return { z: item.c }; });
		},
		result: [{z:1},{z:2},{z:3},{z:4}]
	}
];


testaverde.loadTestCaseSet({
	label: 'Comprende test cases',
	testCases: testCases,
	testFunction: function (testCase, onlyMode) {
		testaverde.deepEqual(testCase.func(), testCase.result, testCase.description);
	},
	testLabel: function (testCase, idx) { return testCase.description; },
	setup: function (testCases, onlyMode) {
	}
});

testaverde.execute();

})(this);
