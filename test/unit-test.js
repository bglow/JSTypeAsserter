// Type assertion unit test

QUnit.test("Test type assertion", function (assert) {
    assert.ok(TypeAsserter.assertMatch("string","someString").match, "assert typeof string is string");
    assert.ok(TypeAsserter.assertMatch("boolean",true).match, "assert typeof boolean is boolean");
    assert.ok(TypeAsserter.assertMatch("number",1).match, "assert typeof number is number");
    assert.ok(TypeAsserter.assertMatch("object",{}).match, "assert typeof object is object");
    assert.ok(TypeAsserter.assertMatch("object",[]).match, "assert typeof array is object");
    assert.ok(TypeAsserter.assertMatch("function",function () {}).match, "assert typeof function is function");
    assert.ok(TypeAsserter.assertMatch(["string","string"],"a","b").match, "assert two required string arguments");
    assert.ok(!TypeAsserter.assertMatch(["string","string"],"a",12).match, "assert `string, string` not match `string, number`");
    assert.ok(TypeAsserter.assertMatch(["string","[string]"],"a").match, "assert `string, string` matches `string, undefined`");
    assert.ok(TypeAsserter.assertMatch(["...string"],"a","b").match, "assert `...string` matches `string, string`");
    assert.ok(!TypeAsserter.assertMatch(["...string"],"a","b",false).match, "assert `...string` not match `string, string, boolean`");
    assert.ok(TypeAsserter.assertMatch(["[object]","...number"],undefined, 2.123, -1234.23).match, "assert `[object], ...number` matches `undefined, number, number`");
    assert.ok(TypeAsserter.assertMatch(["[object]","...number"],{}, 2.123, -1234.23).match, "assert `[object], ...number` matches `{}, number, number`");
    assert.ok(!TypeAsserter.assertMatch(["[object]","...number"],function () {}, 2.123, -1234.23).match, "assert `[object], ...number` not match `function, number, number`");
    assert.ok(TypeAsserter.assertMatch(["string","[number]","[function]","[boolean]","...object"],"a").match,
              "assert `string, [number], [function], [boolean], ...object` matches `string`");
    assert.ok(TypeAsserter.assertMatch(["string","[number]","[function]","[boolean]","...object"],"a",null,undefined,false,[]).match,
              "assert `string, [number], [function], [boolean], ...object` matches `string, null, undefined, false, array`");
    assert.ok(TypeAsserter.assertMatch("{Object}",{}).match, "assert {} instanceof Object");
    assert.ok(TypeAsserter.assertMatch("{Function}",function () {}).match, "assert function () {} instanceof Function");
    assert.ok(TypeAsserter.assertMatch(["{Object}","{RegExp}"],{}, new RegExp("abc")).match, "assert {}, RegExp match {Object}, {RegExp}");
    assert.ok(TypeAsserter.assertMatch(["[{Object}]","{RegExp}"],undefined, new RegExp("abc")).match, "assert undefined, RegExp matches [{Object}], {RegExp}");
    assert.ok(!TypeAsserter.assertMatch(["[{Object}]","[{RegExp}]"],undefined, function () {}).match, "assert undefined, function not match [{Object}], {RegExp}");
    assert.ok(TypeAsserter.assertMatch({ a: "string"},{ a: "a"}).match, "assert string object properties match");
    assert.ok(TypeAsserter.assertMatch({ a: "string", b: "number"},{ a: "a", b: 2}).match, "assert string and number object properties match");
    assert.ok(!TypeAsserter.assertMatch({ a: "string", b: "number"},{ a: 123.23, b: 2}).match, "assert string and number object properties do not match two numbers");
    assert.ok(TypeAsserter.assertMatch({ a: "string", b: "{Object}"},{ a: "a", b: {}}).match, "assert string and object match string and object");
    assert.throws(TypeAsserter.assertMatch.bind(TypeAsserter, ["string",123], "some string",1234), "assert throws exception if passed a number as a type assertion parameter");
    assert.throws(TypeAsserter.assertMatch.bind(TypeAsserter, ["string",{ a: "[string]", b: function () {}}], "blah",{ b: function () {}}), "assert throws exception if passed a function as a member of an object type assertion parameter");

    // test TypeAsserter.createFn
    function originalFunction(a,b,c) { return true; }
    var testFn = TypeAsserter.createFn(originalFunction, ["string","number","boolean"]);
    assert.ok(testFn.bind(testFn, "a",123,false),"Assert created function called with good arguments does not throw exception.");
    assert.throws(testFn.bind(testFn, "a","b",123),"Assert created function called with bad arguments throws exception.");

    function originalFunctionWithReturnType(a, b, c) { return { a: "a", b: 123 } }
    var testFn2 = TypeAsserter.createFn(originalFunctionWithReturnType, "...number", { a: "string", b: "number"});
    assert.ok(testFn2.bind(testFn2, 1,2,3), "Assert created function called with good arguments and good return type does not throw exception");
    var testFn3 = TypeAsserter.createFn(originalFunctionWithReturnType, "...number", { a: "string", b: "string"});
    assert.throws(testFn3.bind(testFn2, 1,2,3), "Assert created function called with good arguments and bad return type throws exception");

    // test TypeAsserter.AssertableFunction

    var originalFunction3 = function () {
        if (arguments.length == 1) {
            a = arguments[0].a;
            b = arguments[0].b;
        } else if (arguments.length == 2) {
            a = arguments[0];
            b = arguments[1];
        }
        return a + b;
    };
    var testAssertableFunction =
            new TypeAsserter.AssertableFunction(originalFunction3)
                .addSignature({ a: "string", b: "string"})
                .addSignature(["string","string"]);
    assert.equal(testAssertableFunction.doFn("x", "y"), "xy", "Test assertable function passed good arguments for signature 1");
    assert.equal(testAssertableFunction.doFn({ a: "x", b: "y"}), "xy", "Test assertable function passed good arguments for signature 2");
    assert.throws(testAssertableFunction.doFn.bind(testAssertableFunction.doFn, "x",2), "Test assertable function passed good arguments for signature 2");
});