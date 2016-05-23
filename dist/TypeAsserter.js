(function () {
    function TypeAsserter() {
    }

    function isNil(arg) {
        return arg == null;
    }

    function castArray(arg) {
        if (arg instanceof Array) return arg;
        if (typeof arg == "string" || typeof arg == "object") return [arg];
        return Array.prototype.slice.call(arg);
    }

    var TypeAssertionError = function (message) {
        this.message = message;
    };

    TypeAssertionError.prototype = Error.prototype;

    TypeAsserter.assertMatch = function () {
        var types = castArray(arguments[0]);
        var args  = Array.prototype.slice.call(arguments, 1);

        function checkType(type, arg, path) {
            path       = path || "";
            var result = {match: true};
            if (["string", "[string]", "...string"
                    , "number", "[number]", "...number"
                    , "boolean", "[boolean]", "...boolean"
                    , "object", "[object]", "...object"
                    , "function", "[function]", "..function"
                    , "symbol", "[symbol]", "...symbol"].indexOf(type) > -1) {

                type = type.trim();
                if (type.substring(0,3) === "...") {
                    isVariableLength = true;
                    type             = type.substring(3);
                    while (!isNil(arg)) {
                        if (typeof arg != type) {
                            result.match  = false;
                            result.reason = new TypeAssertionError("Bad match in argument " + i + (path ? ", path " + path: "") + ". Expected " + type + " but found " + typeof arg);
                            return result;
                        }
                        i++;
                        arg = args[i];
                    }
                } else if (/\[.+\]/.test(type)) {
                    var nonOptionalType = type.substring(1, type.length - 1);
                    if (!isNil(arg) && typeof arg !== nonOptionalType) {
                        result.match  = false;
                        result.reason = new TypeAssertionError("Bad match in argument " + i + (path ? ", path " + path: "") + ". Expected " + type + " but found " + typeof arg);
                        return result;
                    }
                } else if (typeof arg !== type) {
                    result.match  = false;
                    result.reason = new TypeAssertionError("Bad match in argument " + i + (path ? ", path " + path: "") + ". Expected " + type + " but found " + typeof arg);
                    return result;
                }
            } else if (/\{.+\}/.test(type)) {
                if (/\[.+\]/.test(type)) {
                    nonOptionalType = type.substring(2, type.length - 1);
                    if (!isNil(arg)) {
                        if (!arg.constructor) {
                            result.match  = false;
                            result.reason = new TypeAssertionError("Bad match in argument " + i + (path ? ", path " + path: "") + ". Expected " + type + ", but argument, " + arg + ", has no constructor.");
                            return result;
                        } else {
                            if (arg.constructor.name !== nonOptionalType) {
                                result.match  = false;
                                result.reason = new TypeAssertionError("Bad match in argument " + i + (path ? ", path " + path: "") + ". Expected " + type + ", but found {" + arg.constructor.name + "}");
                                return result;
                            }
                        }
                    }
                } else {
                    var className = type.substring(1, type.length - 1);
                    if (!arg.constructor) {
                        result.match  = false;
                        result.reason = new TypeAssertionError("Bad match in argument " + i + (path ? ", path " + path: "") + ". Expected " + type + ", but argument, " + arg + ", has no constructor.");
                        return result;
                    } else if (arg.constructor.name !== className) {
                        result.match  = false;
                        result.reason = new TypeAssertionError("Bad match in argument " + i + (path ? ", path " + path: "") + ". Expected " + type + ", but found {" + arg.constructor.name + "}");
                        return result;
                    }
                }
            } else if (typeof type == "object") {
                if (typeof arg !== "object") {
                    result.match  = false;
                    result.reason = new TypeAssertionError("Bad match in argument " + i + (path ? ", path " + path: "") + ". Expected object, but found " + typeof arg);
                    return result;
                }
                for (prop in type) {
                    if (!type.hasOwnProperty(prop)) continue;
                    var propType = type[prop];
                    result = checkType(propType, arg[prop], path + (path ? "." : "") + prop);
                    if (!result.match) break;
                }
                if (!result.match) return result;
            } else {
                throw new TypeAssertionError("Invalid argument passed to TypeAsserter.assertMatch() at argument " + i + (path ? ", path " + path: "") +". Expected string or plain Object, but got " + typeof arg);
            }
            return {match: true};
        }

        var isVariableLength = false;
        var i                = 0;
        var type             = types[i];
        var arg              = args[i];
        while (!isVariableLength && type) {
            var result = checkType(type, arg);
            if (!result.match) break;

            i++;
            type = types[i];
            arg  = args[i];
        }

        return result;

    };

    function AssertableFunction(fn) {
        this.fn = fn;
        this.signatures = [];
    }

    AssertableFunction.prototype = {
        constructor: AssertableFunction,

        addSignature: function (types) {
            var badArgsMessage = "Bad arguments passed to TypeAsserter.addSignature(string|{Array}]";
            if (typeof types !== "string" && !types instanceof Array) throw new TypeAssertionError(badArgsMessage);
            this.signatures.push(this.createFn(types));
            return this;
        },

        createFn: function (types) {
            var self = this;
            return function () {
                var passedArgs = Array.prototype.slice.call(arguments);
                var result = TypeAsserter.assertMatch.apply(TypeAsserter, [types].concat(passedArgs));
                if (!result.match) throw new TypeAssertionError("Bad arguments passed to function! " + result.reason);
                return self.fn.apply(self.fn, passedArgs);
            };
        },

        doFn: function () {
            var failures = [];
            for (var i = 0; i < this.signatures.length; i++) {
                var signature = this.signatures[i];
                try {
                    return signature.apply(signature, Array.prototype.slice.call(arguments));
                } catch (e) {
                    if (e instanceof TypeAssertionError)
                        failures.push(e);
                    else throw e;
                }
            }
            throw new TypeAssertionError("No type signatures for function " + (this.fn.name || "<anonymous>") + " matched for passed arguments. " + failures.join("\n"));
        }

    };

    TypeAsserter.AssertableFunction = AssertableFunction;

    TypeAsserter.createFn = function (fn, types, returnType) {
        var badArgsMessage = "Bad arguments passed to TypeAsserter.createFn(function,string|{Array},[string|{Object}]";
        if (typeof fn !== "function") throw new TypeAssertionError(badArgsMessage);
        if (typeof types !== "string" && !types instanceof Array) throw new TypeAssertionError(badArgsMessage);
        if (!isNil(returnType))
            if (typeof returnType !== "string" && !returnType instanceof Object) throw new TypeAssertionError(badArgsMessage);
        return function () {
            var passedArgs = Array.prototype.slice.call(arguments);
            var result = TypeAsserter.assertMatch.apply(TypeAsserter, [types].concat(passedArgs));
            if (!result.match) throw new TypeAssertionError("Bad arguments passed to function! " + result.reason);
            var returnValue = fn.apply(fn, passedArgs);
            if (!isNil(returnType)) {
                result = TypeAsserter.assertMatch.call(TypeAsserter, returnType, returnValue);
                if (!result.match) throw new TypeAssertionError("Bad result returned from function! " + result.reason);
            }
        };
    };

    window["TypeAsserter"] = TypeAsserter;

})();