# JSTypeAsserter
A small function for javascript runtime type assertion.

```
    TypeAsserter.assertMatch("string","someString")
    --> { match: true }
    
    TypeAsserter.assertMatch(["[object]","...number"],{ x: "a", y: "b" }, 2.123, -1234.23)
    --> { match: true }
    
    TypeAsserter.assertMatch(["[object]","...number"],function () {}, 2.123, -1234.23)
    --> { match: false, reason: { message: "Bad match in argument 0. Expected [object] but found function" }
    
    TypeAsserter.assertMatch(["string",{ a: "[string]", b: "function"}], "someString",{ b: function () {}})
    --> { match: true }
    
    TypeAsserter.assertMatch(["string",{ a: "[string]", b: "function", c: { d: "{Function}" }], "someString",{ b: function () {}, c: { d: new Object() })
    --> { match: false, reason: { message: "Bad match in argument 1, path c.d. Expected {Function}, but found {Object}" }

```

### Use
First note the kinds of type patterns you can pass TypeAsserter.

1. A string representing a javascript type, in one of several varieties:
    * "type" -- e.g. "string", assert that typeof target == "string"
    * "[type]" -- e.g. "[number]", assert that if target is not nil, then typeof target == "number"
    * "...type" -- e.g. "[...object]", assert that the (non-nil) target, and all not nil targets following it of type "object"
    * "{class}" -- e.g. "{MyFunction}", assert that target instanceof MyFunction
    * "[{class}]" -- e.g. "[{MyFunction}], assert that if the target is non-nil, then target instanceof MyFunction
2. A PlainObject with properties of PlainObject or any of the above 
    *  e.g. { a: "string", b: "boolean", c: { d: "{MyFunction}", e: "[number]" } }
    * assert that the target has non-nil values for all the non-optional properties, and that the values are of the asserted type

TypeAsserter can be used in three ways:

1. `TypeAsserter.assertMatch(types: string|Object|Array<string|Object>, ...args: any): { match: boolean, reason: [string] }`
    * assert that the passed in args map to the passed in types
    * if types is an array, then args[0] will be matched with types[0], args[1] with types[1], etc.
        * if a non-optional type is specfied for which there is a non-truthy arg, then match will be set to false

2. `TypeAsserter.createFn(fn: Function, types: string|Object|Array<string|Object>, [returnType: string|Object]): Function`
    * pass a Function, type assertions, and an optional return type assertion, and get back a new function which will do the checks at runtime, and throw an exception if the runtime args and optionally return type do not match
     
3. `<T> new TypeAsserter.AssertableFunction(fn: (args: ...any): T)`
    * Creates a new TypeAsserter.AssertableFunction which has the following methods
    * `AssertableFunction.addSignature(types: string|Object|Array<string|Object>): this`
        * add one possible type assertion for how the fn could be called
        * can be called successively to build multiple signatures for overloaded functions
    * `AssertableFunction.doFn(args: ...any): T`
        * compare the args to each of the signatures passed in AssertableFunction.addSignature, invoking the function as soon as a signature match is found and returning then returning its result
        * throws exception if the arguments to match any signtuares for the the AssertalbeFunction

### To include
Just copy dist/TypeAsserter.js and include it in your project. TypeAsserter does not have any dependencies.

### To test
Open test/index.html in a browser. This will run the QUnit tests.


