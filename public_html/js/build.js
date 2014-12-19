/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */
var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;
    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }
    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};
//Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
//If have a base name, try to normalize against it,
//otherwise, assume it is a top-level require that will
//be relative to baseUrl in the end.
            if (baseName) {
//Convert baseName to array, and lop off the last part,
//so that . matches that "directory" and not name of the baseName's
//module. For instance, baseName of "one/two/three", maps to
//"one/two/three.js", but we want the directory, "one/two" for
//this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;
// Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }
                name = baseParts.concat(name);
//start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
//End of the line. Keep at least one non-dot
//path segment at the front so it can be mapped
//correctly to disk. Otherwise, there is likely
//no path mapping for a path starting with '..'.
//This can still fail, but catches the most reasonable
//uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
//end trimDots
                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
// No baseName, so this is ID is resolved relative
// to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }
//Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');
            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");
                if (baseParts) {
//Find the longest baseName segment match in the config.
//So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];
//baseName segment has config, find if it has one for
//this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
//Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }
                if (foundMap) {
                    break;
                }
//Check for a star map match, but just hold on to it,
//if there is a shorter segment match later in a matching
//config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }
            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }
            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }
        return name;
    }
    function makeRequire(relName, forceSync) {
        return function () {
//A version of a require function that passes a moduleName
//value for items that may need to
//look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }
    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }
    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }
    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }
        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }
//Turns a plugin!resource to [plugin, resource]
//with the plugin being undefined if the name
//did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }
    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];
        name = parts[1];
        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }
//Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }
//Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };
    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }
    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };
    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;
//Use name if no relName
        relName = relName || name;
//Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
//Pull out the defined dependencies and pass the ordered
//values to the callback.
//Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;
//Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
//CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
//CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                    hasProp(waiting, depName) ||
                    hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }
            ret = callback ? callback.apply(defined[name], args) : undefined;
            if (name) {
//If setting exports via "module" is in play,
//favor that over return value and exports. After that,
//favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                    cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
//Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
//May just be an object definition for the module. Only
//worry about defining if have a module name.
            defined[name] = callback;
        }
    };
    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
//callback in this case is really relName
                return handlers[deps](callback);
            }
//Just return the module wanted. In this scenario, the
//deps arg is the module name, and second arg (if passed)
//is just the relName.
//Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
//deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }
            if (callback.splice) {
//callback is an array, which means it is a dependency list.
//Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }
//Support require(['a'])
        callback = callback || function () {};
//If relName is a function, it is an errback handler,
//so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }
//Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
//Using a non-zero value because of concern for what old browsers
//do, and latest browsers "upgrade" to 4 if lower value is used:
//http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
//If want a value immediately, use require('id') instead -- something
//that works in almond on the global level, but not guaranteed and
//unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }
        return req;
    };
    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };
    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;
    define = function (name, deps, callback) {
//This module may not have dependencies
        if (!deps.splice) {
//deps is not an array, so probably means
//an object literal or factory function for
//the value. Adjust args.
            callback = deps;
            deps = [];
        }
        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };
    define.amd = {
        jQuery: true
    };
}());;
/*! jQuery v1.11.1 | (c) 2005, 2014 jQuery Foundation, Inc. | jquery.org/license */
!function(a,b){"object"==typeof module&&"object"==typeof module.exports?module.exports=a.document?b(a,!0):function(a){if(!a.document)throw new Error("jQuery requires a window with a document");return b(a)}:b(a)}("undefined"!=typeof window?window:this,function(a,b){var c=[],d=c.slice,e=c.concat,f=c.push,g=c.indexOf,h={},i=h.toString,j=h.hasOwnProperty,k={},l="1.11.1",m=function(a,b){return new m.fn.init(a,b)},n=/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,o=/^-ms-/,p=/-([\da-z])/gi,q=function(a,b){return b.toUpperCase()};m.fn=m.prototype={jquery:l,constructor:m,selector:"",length:0,toArray:function(){return d.call(this)},get:function(a){return null!=a?0>a?this[a+this.length]:this[a]:d.call(this)},pushStack:function(a){var b=m.merge(this.constructor(),a);return b.prevObject=this,b.context=this.context,b},each:function(a,b){return m.each(this,a,b)},map:function(a){return this.pushStack(m.map(this,function(b,c){return a.call(b,c,b)}))},slice:function(){return this.pushStack(d.apply(this,arguments))},first:function(){return this.eq(0)},last:function(){return this.eq(-1)},eq:function(a){var b=this.length,c=+a+(0>a?b:0);return this.pushStack(c>=0&&b>c?[this[c]]:[])},end:function(){return this.prevObject||this.constructor(null)},push:f,sort:c.sort,splice:c.splice},m.extend=m.fn.extend=function(){var a,b,c,d,e,f,g=arguments[0]||{},h=1,i=arguments.length,j=!1;for("boolean"==typeof g&&(j=g,g=arguments[h]||{},h++),"object"==typeof g||m.isFunction(g)||(g={}),h===i&&(g=this,h--);i>h;h++)if(null!=(e=arguments[h]))for(d in e)a=g[d],c=e[d],g!==c&&(j&&c&&(m.isPlainObject(c)||(b=m.isArray(c)))?(b?(b=!1,f=a&&m.isArray(a)?a:[]):f=a&&m.isPlainObject(a)?a:{},g[d]=m.extend(j,f,c)):void 0!==c&&(g[d]=c));return g},m.extend({expando:"jQuery"+(l+Math.random()).replace(/\D/g,""),isReady:!0,error:function(a){throw new Error(a)},noop:function(){},isFunction:function(a){return"function"===m.type(a)},isArray:Array.isArray||function(a){return"array"===m.type(a)},isWindow:function(a){return null!=a&&a==a.window},isNumeric:function(a){return!m.isArray(a)&&a-parseFloat(a)>=0},isEmptyObject:function(a){var b;for(b in a)return!1;return!0},isPlainObject:function(a){var b;if(!a||"object"!==m.type(a)||a.nodeType||m.isWindow(a))return!1;try{if(a.constructor&&!j.call(a,"constructor")&&!j.call(a.constructor.prototype,"isPrototypeOf"))return!1}catch(c){return!1}if(k.ownLast)for(b in a)return j.call(a,b);for(b in a);return void 0===b||j.call(a,b)},type:function(a){return null==a?a+"":"object"==typeof a||"function"==typeof a?h[i.call(a)]||"object":typeof a},globalEval:function(b){b&&m.trim(b)&&(a.execScript||function(b){a.eval.call(a,b)})(b)},camelCase:function(a){return a.replace(o,"ms-").replace(p,q)},nodeName:function(a,b){return a.nodeName&&a.nodeName.toLowerCase()===b.toLowerCase()},each:function(a,b,c){var d,e=0,f=a.length,g=r(a);if(c){if(g){for(;f>e;e++)if(d=b.apply(a[e],c),d===!1)break}else for(e in a)if(d=b.apply(a[e],c),d===!1)break}else if(g){for(;f>e;e++)if(d=b.call(a[e],e,a[e]),d===!1)break}else for(e in a)if(d=b.call(a[e],e,a[e]),d===!1)break;return a},trim:function(a){return null==a?"":(a+"").replace(n,"")},makeArray:function(a,b){var c=b||[];return null!=a&&(r(Object(a))?m.merge(c,"string"==typeof a?[a]:a):f.call(c,a)),c},inArray:function(a,b,c){var d;if(b){if(g)return g.call(b,a,c);for(d=b.length,c=c?0>c?Math.max(0,d+c):c:0;d>c;c++)if(c in b&&b[c]===a)return c}return-1},merge:function(a,b){var c=+b.length,d=0,e=a.length;while(c>d)a[e++]=b[d++];if(c!==c)while(void 0!==b[d])a[e++]=b[d++];return a.length=e,a},grep:function(a,b,c){for(var d,e=[],f=0,g=a.length,h=!c;g>f;f++)d=!b(a[f],f),d!==h&&e.push(a[f]);return e},map:function(a,b,c){var d,f=0,g=a.length,h=r(a),i=[];if(h)for(;g>f;f++)d=b(a[f],f,c),null!=d&&i.push(d);else for(f in a)d=b(a[f],f,c),null!=d&&i.push(d);return e.apply([],i)},guid:1,proxy:function(a,b){var c,e,f;return"string"==typeof b&&(f=a[b],b=a,a=f),m.isFunction(a)?(c=d.call(arguments,2),e=function(){return a.apply(b||this,c.concat(d.call(arguments)))},e.guid=a.guid=a.guid||m.guid++,e):void 0},now:function(){return+new Date},support:k}),m.each("Boolean Number String Function Array Date RegExp Object Error".split(" "),function(a,b){h["[object "+b+"]"]=b.toLowerCase()});function r(a){var b=a.length,c=m.type(a);return"function"===c||m.isWindow(a)?!1:1===a.nodeType&&b?!0:"array"===c||0===b||"number"==typeof b&&b>0&&b-1 in a}var s=function(a){var b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s,t,u="sizzle"+-new Date,v=a.document,w=0,x=0,y=gb(),z=gb(),A=gb(),B=function(a,b){return a===b&&(l=!0),0},C="undefined",D=1<<31,E={}.hasOwnProperty,F=[],G=F.pop,H=F.push,I=F.push,J=F.slice,K=F.indexOf||function(a){for(var b=0,c=this.length;c>b;b++)if(this[b]===a)return b;return-1},L="checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|ismap|loop|multiple|open|readonly|required|scoped",M="[\\x20\\t\\r\\n\\f]",N="(?:\\\\.|[\\w-]|[^\\x00-\\xa0])+",O=N.replace("w","w#"),P="\\["+M+"*("+N+")(?:"+M+"*([*^$|!~]?=)"+M+"*(?:'((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\"|("+O+"))|)"+M+"*\\]",Q=":("+N+")(?:\\((('((?:\\\\.|[^\\\\'])*)'|\"((?:\\\\.|[^\\\\\"])*)\")|((?:\\\\.|[^\\\\()[\\]]|"+P+")*)|.*)\\)|)",R=new RegExp("^"+M+"+|((?:^|[^\\\\])(?:\\\\.)*)"+M+"+$","g"),S=new RegExp("^"+M+"*,"+M+"*"),T=new RegExp("^"+M+"*([>+~]|"+M+")"+M+"*"),U=new RegExp("="+M+"*([^\\]'\"]*?)"+M+"*\\]","g"),V=new RegExp(Q),W=new RegExp("^"+O+"$"),X={ID:new RegExp("^#("+N+")"),CLASS:new RegExp("^\\.("+N+")"),TAG:new RegExp("^("+N.replace("w","w*")+")"),ATTR:new RegExp("^"+P),PSEUDO:new RegExp("^"+Q),CHILD:new RegExp("^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\("+M+"*(even|odd|(([+-]|)(\\d*)n|)"+M+"*(?:([+-]|)"+M+"*(\\d+)|))"+M+"*\\)|)","i"),bool:new RegExp("^(?:"+L+")$","i"),needsContext:new RegExp("^"+M+"*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\("+M+"*((?:-\\d)?\\d*)"+M+"*\\)|)(?=[^-]|$)","i")},Y=/^(?:input|select|textarea|button)$/i,Z=/^h\d$/i,$=/^[^{]+\{\s*\[native \w/,_=/^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,ab=/[+~]/,bb=/'|\\/g,cb=new RegExp("\\\\([\\da-f]{1,6}"+M+"?|("+M+")|.)","ig"),db=function(a,b,c){var d="0x"+b-65536;return d!==d||c?b:0>d?String.fromCharCode(d+65536):String.fromCharCode(d>>10|55296,1023&d|56320)};try{I.apply(F=J.call(v.childNodes),v.childNodes),F[v.childNodes.length].nodeType}catch(eb){I={apply:F.length?function(a,b){H.apply(a,J.call(b))}:function(a,b){var c=a.length,d=0;while(a[c++]=b[d++]);a.length=c-1}}}function fb(a,b,d,e){var f,h,j,k,l,o,r,s,w,x;if((b?b.ownerDocument||b:v)!==n&&m(b),b=b||n,d=d||[],!a||"string"!=typeof a)return d;if(1!==(k=b.nodeType)&&9!==k)return[];if(p&&!e){if(f=_.exec(a))if(j=f[1]){if(9===k){if(h=b.getElementById(j),!h||!h.parentNode)return d;if(h.id===j)return d.push(h),d}else if(b.ownerDocument&&(h=b.ownerDocument.getElementById(j))&&t(b,h)&&h.id===j)return d.push(h),d}else{if(f[2])return I.apply(d,b.getElementsByTagName(a)),d;if((j=f[3])&&c.getElementsByClassName&&b.getElementsByClassName)return I.apply(d,b.getElementsByClassName(j)),d}if(c.qsa&&(!q||!q.test(a))){if(s=r=u,w=b,x=9===k&&a,1===k&&"object"!==b.nodeName.toLowerCase()){o=g(a),(r=b.getAttribute("id"))?s=r.replace(bb,"\\$&"):b.setAttribute("id",s),s="[id='"+s+"'] ",l=o.length;while(l--)o[l]=s+qb(o[l]);w=ab.test(a)&&ob(b.parentNode)||b,x=o.join(",")}if(x)try{return I.apply(d,w.querySelectorAll(x)),d}catch(y){}finally{r||b.removeAttribute("id")}}}return i(a.replace(R,"$1"),b,d,e)}function gb(){var a=[];function b(c,e){return a.push(c+" ")>d.cacheLength&&delete b[a.shift()],b[c+" "]=e}return b}function hb(a){return a[u]=!0,a}function ib(a){var b=n.createElement("div");try{return!!a(b)}catch(c){return!1}finally{b.parentNode&&b.parentNode.removeChild(b),b=null}}function jb(a,b){var c=a.split("|"),e=a.length;while(e--)d.attrHandle[c[e]]=b}function kb(a,b){var c=b&&a,d=c&&1===a.nodeType&&1===b.nodeType&&(~b.sourceIndex||D)-(~a.sourceIndex||D);if(d)return d;if(c)while(c=c.nextSibling)if(c===b)return-1;return a?1:-1}function lb(a){return function(b){var c=b.nodeName.toLowerCase();return"input"===c&&b.type===a}}function mb(a){return function(b){var c=b.nodeName.toLowerCase();return("input"===c||"button"===c)&&b.type===a}}function nb(a){return hb(function(b){return b=+b,hb(function(c,d){var e,f=a([],c.length,b),g=f.length;while(g--)c[e=f[g]]&&(c[e]=!(d[e]=c[e]))})})}function ob(a){return a&&typeof a.getElementsByTagName!==C&&a}c=fb.support={},f=fb.isXML=function(a){var b=a&&(a.ownerDocument||a).documentElement;return b?"HTML"!==b.nodeName:!1},m=fb.setDocument=function(a){var b,e=a?a.ownerDocument||a:v,g=e.defaultView;return e!==n&&9===e.nodeType&&e.documentElement?(n=e,o=e.documentElement,p=!f(e),g&&g!==g.top&&(g.addEventListener?g.addEventListener("unload",function(){m()},!1):g.attachEvent&&g.attachEvent("onunload",function(){m()})),c.attributes=ib(function(a){return a.className="i",!a.getAttribute("className")}),c.getElementsByTagName=ib(function(a){return a.appendChild(e.createComment("")),!a.getElementsByTagName("*").length}),c.getElementsByClassName=$.test(e.getElementsByClassName)&&ib(function(a){return a.innerHTML="<div class='a'></div><div class='a i'></div>",a.firstChild.className="i",2===a.getElementsByClassName("i").length}),c.getById=ib(function(a){return o.appendChild(a).id=u,!e.getElementsByName||!e.getElementsByName(u).length}),c.getById?(d.find.ID=function(a,b){if(typeof b.getElementById!==C&&p){var c=b.getElementById(a);return c&&c.parentNode?[c]:[]}},d.filter.ID=function(a){var b=a.replace(cb,db);return function(a){return a.getAttribute("id")===b}}):(delete d.find.ID,d.filter.ID=function(a){var b=a.replace(cb,db);return function(a){var c=typeof a.getAttributeNode!==C&&a.getAttributeNode("id");return c&&c.value===b}}),d.find.TAG=c.getElementsByTagName?function(a,b){return typeof b.getElementsByTagName!==C?b.getElementsByTagName(a):void 0}:function(a,b){var c,d=[],e=0,f=b.getElementsByTagName(a);if("*"===a){while(c=f[e++])1===c.nodeType&&d.push(c);return d}return f},d.find.CLASS=c.getElementsByClassName&&function(a,b){return typeof b.getElementsByClassName!==C&&p?b.getElementsByClassName(a):void 0},r=[],q=[],(c.qsa=$.test(e.querySelectorAll))&&(ib(function(a){a.innerHTML="<select msallowclip=''><option selected=''></option></select>",a.querySelectorAll("[msallowclip^='']").length&&q.push("[*^$]="+M+"*(?:''|\"\")"),a.querySelectorAll("[selected]").length||q.push("\\["+M+"*(?:value|"+L+")"),a.querySelectorAll(":checked").length||q.push(":checked")}),ib(function(a){var b=e.createElement("input");b.setAttribute("type","hidden"),a.appendChild(b).setAttribute("name","D"),a.querySelectorAll("[name=d]").length&&q.push("name"+M+"*[*^$|!~]?="),a.querySelectorAll(":enabled").length||q.push(":enabled",":disabled"),a.querySelectorAll("*,:x"),q.push(",.*:")})),(c.matchesSelector=$.test(s=o.matches||o.webkitMatchesSelector||o.mozMatchesSelector||o.oMatchesSelector||o.msMatchesSelector))&&ib(function(a){c.disconnectedMatch=s.call(a,"div"),s.call(a,"[s!='']:x"),r.push("!=",Q)}),q=q.length&&new RegExp(q.join("|")),r=r.length&&new RegExp(r.join("|")),b=$.test(o.compareDocumentPosition),t=b||$.test(o.contains)?function(a,b){var c=9===a.nodeType?a.documentElement:a,d=b&&b.parentNode;return a===d||!(!d||1!==d.nodeType||!(c.contains?c.contains(d):a.compareDocumentPosition&&16&a.compareDocumentPosition(d)))}:function(a,b){if(b)while(b=b.parentNode)if(b===a)return!0;return!1},B=b?function(a,b){if(a===b)return l=!0,0;var d=!a.compareDocumentPosition-!b.compareDocumentPosition;return d?d:(d=(a.ownerDocument||a)===(b.ownerDocument||b)?a.compareDocumentPosition(b):1,1&d||!c.sortDetached&&b.compareDocumentPosition(a)===d?a===e||a.ownerDocument===v&&t(v,a)?-1:b===e||b.ownerDocument===v&&t(v,b)?1:k?K.call(k,a)-K.call(k,b):0:4&d?-1:1)}:function(a,b){if(a===b)return l=!0,0;var c,d=0,f=a.parentNode,g=b.parentNode,h=[a],i=[b];if(!f||!g)return a===e?-1:b===e?1:f?-1:g?1:k?K.call(k,a)-K.call(k,b):0;if(f===g)return kb(a,b);c=a;while(c=c.parentNode)h.unshift(c);c=b;while(c=c.parentNode)i.unshift(c);while(h[d]===i[d])d++;return d?kb(h[d],i[d]):h[d]===v?-1:i[d]===v?1:0},e):n},fb.matches=function(a,b){return fb(a,null,null,b)},fb.matchesSelector=function(a,b){if((a.ownerDocument||a)!==n&&m(a),b=b.replace(U,"='$1']"),!(!c.matchesSelector||!p||r&&r.test(b)||q&&q.test(b)))try{var d=s.call(a,b);if(d||c.disconnectedMatch||a.document&&11!==a.document.nodeType)return d}catch(e){}return fb(b,n,null,[a]).length>0},fb.contains=function(a,b){return(a.ownerDocument||a)!==n&&m(a),t(a,b)},fb.attr=function(a,b){(a.ownerDocument||a)!==n&&m(a);var e=d.attrHandle[b.toLowerCase()],f=e&&E.call(d.attrHandle,b.toLowerCase())?e(a,b,!p):void 0;return void 0!==f?f:c.attributes||!p?a.getAttribute(b):(f=a.getAttributeNode(b))&&f.specified?f.value:null},fb.error=function(a){throw new Error("Syntax error, unrecognized expression: "+a)},fb.uniqueSort=function(a){var b,d=[],e=0,f=0;if(l=!c.detectDuplicates,k=!c.sortStable&&a.slice(0),a.sort(B),l){while(b=a[f++])b===a[f]&&(e=d.push(f));while(e--)a.splice(d[e],1)}return k=null,a},e=fb.getText=function(a){var b,c="",d=0,f=a.nodeType;if(f){if(1===f||9===f||11===f){if("string"==typeof a.textContent)return a.textContent;for(a=a.firstChild;a;a=a.nextSibling)c+=e(a)}else if(3===f||4===f)return a.nodeValue}else while(b=a[d++])c+=e(b);return c},d=fb.selectors={cacheLength:50,createPseudo:hb,match:X,attrHandle:{},find:{},relative:{">":{dir:"parentNode",first:!0}," ":{dir:"parentNode"},"+":{dir:"previousSibling",first:!0},"~":{dir:"previousSibling"}},preFilter:{ATTR:function(a){return a[1]=a[1].replace(cb,db),a[3]=(a[3]||a[4]||a[5]||"").replace(cb,db),"~="===a[2]&&(a[3]=" "+a[3]+" "),a.slice(0,4)},CHILD:function(a){return a[1]=a[1].toLowerCase(),"nth"===a[1].slice(0,3)?(a[3]||fb.error(a[0]),a[4]=+(a[4]?a[5]+(a[6]||1):2*("even"===a[3]||"odd"===a[3])),a[5]=+(a[7]+a[8]||"odd"===a[3])):a[3]&&fb.error(a[0]),a},PSEUDO:function(a){var b,c=!a[6]&&a[2];return X.CHILD.test(a[0])?null:(a[3]?a[2]=a[4]||a[5]||"":c&&V.test(c)&&(b=g(c,!0))&&(b=c.indexOf(")",c.length-b)-c.length)&&(a[0]=a[0].slice(0,b),a[2]=c.slice(0,b)),a.slice(0,3))}},filter:{TAG:function(a){var b=a.replace(cb,db).toLowerCase();return"*"===a?function(){return!0}:function(a){return a.nodeName&&a.nodeName.toLowerCase()===b}},CLASS:function(a){var b=y[a+" "];return b||(b=new RegExp("(^|"+M+")"+a+"("+M+"|$)"))&&y(a,function(a){return b.test("string"==typeof a.className&&a.className||typeof a.getAttribute!==C&&a.getAttribute("class")||"")})},ATTR:function(a,b,c){return function(d){var e=fb.attr(d,a);return null==e?"!="===b:b?(e+="","="===b?e===c:"!="===b?e!==c:"^="===b?c&&0===e.indexOf(c):"*="===b?c&&e.indexOf(c)>-1:"$="===b?c&&e.slice(-c.length)===c:"~="===b?(" "+e+" ").indexOf(c)>-1:"|="===b?e===c||e.slice(0,c.length+1)===c+"-":!1):!0}},CHILD:function(a,b,c,d,e){var f="nth"!==a.slice(0,3),g="last"!==a.slice(-4),h="of-type"===b;return 1===d&&0===e?function(a){return!!a.parentNode}:function(b,c,i){var j,k,l,m,n,o,p=f!==g?"nextSibling":"previousSibling",q=b.parentNode,r=h&&b.nodeName.toLowerCase(),s=!i&&!h;if(q){if(f){while(p){l=b;while(l=l[p])if(h?l.nodeName.toLowerCase()===r:1===l.nodeType)return!1;o=p="only"===a&&!o&&"nextSibling"}return!0}if(o=[g?q.firstChild:q.lastChild],g&&s){k=q[u]||(q[u]={}),j=k[a]||[],n=j[0]===w&&j[1],m=j[0]===w&&j[2],l=n&&q.childNodes[n];while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if(1===l.nodeType&&++m&&l===b){k[a]=[w,n,m];break}}else if(s&&(j=(b[u]||(b[u]={}))[a])&&j[0]===w)m=j[1];else while(l=++n&&l&&l[p]||(m=n=0)||o.pop())if((h?l.nodeName.toLowerCase()===r:1===l.nodeType)&&++m&&(s&&((l[u]||(l[u]={}))[a]=[w,m]),l===b))break;return m-=e,m===d||m%d===0&&m/d>=0}}},PSEUDO:function(a,b){var c,e=d.pseudos[a]||d.setFilters[a.toLowerCase()]||fb.error("unsupported pseudo: "+a);return e[u]?e(b):e.length>1?(c=[a,a,"",b],d.setFilters.hasOwnProperty(a.toLowerCase())?hb(function(a,c){var d,f=e(a,b),g=f.length;while(g--)d=K.call(a,f[g]),a[d]=!(c[d]=f[g])}):function(a){return e(a,0,c)}):e}},pseudos:{not:hb(function(a){var b=[],c=[],d=h(a.replace(R,"$1"));return d[u]?hb(function(a,b,c,e){var f,g=d(a,null,e,[]),h=a.length;while(h--)(f=g[h])&&(a[h]=!(b[h]=f))}):function(a,e,f){return b[0]=a,d(b,null,f,c),!c.pop()}}),has:hb(function(a){return function(b){return fb(a,b).length>0}}),contains:hb(function(a){return function(b){return(b.textContent||b.innerText||e(b)).indexOf(a)>-1}}),lang:hb(function(a){return W.test(a||"")||fb.error("unsupported lang: "+a),a=a.replace(cb,db).toLowerCase(),function(b){var c;do if(c=p?b.lang:b.getAttribute("xml:lang")||b.getAttribute("lang"))return c=c.toLowerCase(),c===a||0===c.indexOf(a+"-");while((b=b.parentNode)&&1===b.nodeType);return!1}}),target:function(b){var c=a.location&&a.location.hash;return c&&c.slice(1)===b.id},root:function(a){return a===o},focus:function(a){return a===n.activeElement&&(!n.hasFocus||n.hasFocus())&&!!(a.type||a.href||~a.tabIndex)},enabled:function(a){return a.disabled===!1},disabled:function(a){return a.disabled===!0},checked:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&!!a.checked||"option"===b&&!!a.selected},selected:function(a){return a.parentNode&&a.parentNode.selectedIndex,a.selected===!0},empty:function(a){for(a=a.firstChild;a;a=a.nextSibling)if(a.nodeType<6)return!1;return!0},parent:function(a){return!d.pseudos.empty(a)},header:function(a){return Z.test(a.nodeName)},input:function(a){return Y.test(a.nodeName)},button:function(a){var b=a.nodeName.toLowerCase();return"input"===b&&"button"===a.type||"button"===b},text:function(a){var b;return"input"===a.nodeName.toLowerCase()&&"text"===a.type&&(null==(b=a.getAttribute("type"))||"text"===b.toLowerCase())},first:nb(function(){return[0]}),last:nb(function(a,b){return[b-1]}),eq:nb(function(a,b,c){return[0>c?c+b:c]}),even:nb(function(a,b){for(var c=0;b>c;c+=2)a.push(c);return a}),odd:nb(function(a,b){for(var c=1;b>c;c+=2)a.push(c);return a}),lt:nb(function(a,b,c){for(var d=0>c?c+b:c;--d>=0;)a.push(d);return a}),gt:nb(function(a,b,c){for(var d=0>c?c+b:c;++d<b;)a.push(d);return a})}},d.pseudos.nth=d.pseudos.eq;for(b in{radio:!0,checkbox:!0,file:!0,password:!0,image:!0})d.pseudos[b]=lb(b);for(b in{submit:!0,reset:!0})d.pseudos[b]=mb(b);function pb(){}pb.prototype=d.filters=d.pseudos,d.setFilters=new pb,g=fb.tokenize=function(a,b){var c,e,f,g,h,i,j,k=z[a+" "];if(k)return b?0:k.slice(0);h=a,i=[],j=d.preFilter;while(h){(!c||(e=S.exec(h)))&&(e&&(h=h.slice(e[0].length)||h),i.push(f=[])),c=!1,(e=T.exec(h))&&(c=e.shift(),f.push({value:c,type:e[0].replace(R," ")}),h=h.slice(c.length));for(g in d.filter)!(e=X[g].exec(h))||j[g]&&!(e=j[g](e))||(c=e.shift(),f.push({value:c,type:g,matches:e}),h=h.slice(c.length));if(!c)break}return b?h.length:h?fb.error(a):z(a,i).slice(0)};function qb(a){for(var b=0,c=a.length,d="";c>b;b++)d+=a[b].value;return d}function rb(a,b,c){var d=b.dir,e=c&&"parentNode"===d,f=x++;return b.first?function(b,c,f){while(b=b[d])if(1===b.nodeType||e)return a(b,c,f)}:function(b,c,g){var h,i,j=[w,f];if(g){while(b=b[d])if((1===b.nodeType||e)&&a(b,c,g))return!0}else while(b=b[d])if(1===b.nodeType||e){if(i=b[u]||(b[u]={}),(h=i[d])&&h[0]===w&&h[1]===f)return j[2]=h[2];if(i[d]=j,j[2]=a(b,c,g))return!0}}}function sb(a){return a.length>1?function(b,c,d){var e=a.length;while(e--)if(!a[e](b,c,d))return!1;return!0}:a[0]}function tb(a,b,c){for(var d=0,e=b.length;e>d;d++)fb(a,b[d],c);return c}function ub(a,b,c,d,e){for(var f,g=[],h=0,i=a.length,j=null!=b;i>h;h++)(f=a[h])&&(!c||c(f,d,e))&&(g.push(f),j&&b.push(h));return g}function vb(a,b,c,d,e,f){return d&&!d[u]&&(d=vb(d)),e&&!e[u]&&(e=vb(e,f)),hb(function(f,g,h,i){var j,k,l,m=[],n=[],o=g.length,p=f||tb(b||"*",h.nodeType?[h]:h,[]),q=!a||!f&&b?p:ub(p,m,a,h,i),r=c?e||(f?a:o||d)?[]:g:q;if(c&&c(q,r,h,i),d){j=ub(r,n),d(j,[],h,i),k=j.length;while(k--)(l=j[k])&&(r[n[k]]=!(q[n[k]]=l))}if(f){if(e||a){if(e){j=[],k=r.length;while(k--)(l=r[k])&&j.push(q[k]=l);e(null,r=[],j,i)}k=r.length;while(k--)(l=r[k])&&(j=e?K.call(f,l):m[k])>-1&&(f[j]=!(g[j]=l))}}else r=ub(r===g?r.splice(o,r.length):r),e?e(null,g,r,i):I.apply(g,r)})}function wb(a){for(var b,c,e,f=a.length,g=d.relative[a[0].type],h=g||d.relative[" "],i=g?1:0,k=rb(function(a){return a===b},h,!0),l=rb(function(a){return K.call(b,a)>-1},h,!0),m=[function(a,c,d){return!g&&(d||c!==j)||((b=c).nodeType?k(a,c,d):l(a,c,d))}];f>i;i++)if(c=d.relative[a[i].type])m=[rb(sb(m),c)];else{if(c=d.filter[a[i].type].apply(null,a[i].matches),c[u]){for(e=++i;f>e;e++)if(d.relative[a[e].type])break;return vb(i>1&&sb(m),i>1&&qb(a.slice(0,i-1).concat({value:" "===a[i-2].type?"*":""})).replace(R,"$1"),c,e>i&&wb(a.slice(i,e)),f>e&&wb(a=a.slice(e)),f>e&&qb(a))}m.push(c)}return sb(m)}function xb(a,b){var c=b.length>0,e=a.length>0,f=function(f,g,h,i,k){var l,m,o,p=0,q="0",r=f&&[],s=[],t=j,u=f||e&&d.find.TAG("*",k),v=w+=null==t?1:Math.random()||.1,x=u.length;for(k&&(j=g!==n&&g);q!==x&&null!=(l=u[q]);q++){if(e&&l){m=0;while(o=a[m++])if(o(l,g,h)){i.push(l);break}k&&(w=v)}c&&((l=!o&&l)&&p--,f&&r.push(l))}if(p+=q,c&&q!==p){m=0;while(o=b[m++])o(r,s,g,h);if(f){if(p>0)while(q--)r[q]||s[q]||(s[q]=G.call(i));s=ub(s)}I.apply(i,s),k&&!f&&s.length>0&&p+b.length>1&&fb.uniqueSort(i)}return k&&(w=v,j=t),r};return c?hb(f):f}return h=fb.compile=function(a,b){var c,d=[],e=[],f=A[a+" "];if(!f){b||(b=g(a)),c=b.length;while(c--)f=wb(b[c]),f[u]?d.push(f):e.push(f);f=A(a,xb(e,d)),f.selector=a}return f},i=fb.select=function(a,b,e,f){var i,j,k,l,m,n="function"==typeof a&&a,o=!f&&g(a=n.selector||a);if(e=e||[],1===o.length){if(j=o[0]=o[0].slice(0),j.length>2&&"ID"===(k=j[0]).type&&c.getById&&9===b.nodeType&&p&&d.relative[j[1].type]){if(b=(d.find.ID(k.matches[0].replace(cb,db),b)||[])[0],!b)return e;n&&(b=b.parentNode),a=a.slice(j.shift().value.length)}i=X.needsContext.test(a)?0:j.length;while(i--){if(k=j[i],d.relative[l=k.type])break;if((m=d.find[l])&&(f=m(k.matches[0].replace(cb,db),ab.test(j[0].type)&&ob(b.parentNode)||b))){if(j.splice(i,1),a=f.length&&qb(j),!a)return I.apply(e,f),e;break}}}return(n||h(a,o))(f,b,!p,e,ab.test(a)&&ob(b.parentNode)||b),e},c.sortStable=u.split("").sort(B).join("")===u,c.detectDuplicates=!!l,m(),c.sortDetached=ib(function(a){return 1&a.compareDocumentPosition(n.createElement("div"))}),ib(function(a){return a.innerHTML="<a href='#'></a>","#"===a.firstChild.getAttribute("href")})||jb("type|href|height|width",function(a,b,c){return c?void 0:a.getAttribute(b,"type"===b.toLowerCase()?1:2)}),c.attributes&&ib(function(a){return a.innerHTML="<input/>",a.firstChild.setAttribute("value",""),""===a.firstChild.getAttribute("value")})||jb("value",function(a,b,c){return c||"input"!==a.nodeName.toLowerCase()?void 0:a.defaultValue}),ib(function(a){return null==a.getAttribute("disabled")})||jb(L,function(a,b,c){var d;return c?void 0:a[b]===!0?b.toLowerCase():(d=a.getAttributeNode(b))&&d.specified?d.value:null}),fb}(a);m.find=s,m.expr=s.selectors,m.expr[":"]=m.expr.pseudos,m.unique=s.uniqueSort,m.text=s.getText,m.isXMLDoc=s.isXML,m.contains=s.contains;var t=m.expr.match.needsContext,u=/^<(\w+)\s*\/?>(?:<\/\1>|)$/,v=/^.[^:#\[\.,]*$/;function w(a,b,c){if(m.isFunction(b))return m.grep(a,function(a,d){return!!b.call(a,d,a)!==c});if(b.nodeType)return m.grep(a,function(a){return a===b!==c});if("string"==typeof b){if(v.test(b))return m.filter(b,a,c);b=m.filter(b,a)}return m.grep(a,function(a){return m.inArray(a,b)>=0!==c})}m.filter=function(a,b,c){var d=b[0];return c&&(a=":not("+a+")"),1===b.length&&1===d.nodeType?m.find.matchesSelector(d,a)?[d]:[]:m.find.matches(a,m.grep(b,function(a){return 1===a.nodeType}))},m.fn.extend({find:function(a){var b,c=[],d=this,e=d.length;if("string"!=typeof a)return this.pushStack(m(a).filter(function(){for(b=0;e>b;b++)if(m.contains(d[b],this))return!0}));for(b=0;e>b;b++)m.find(a,d[b],c);return c=this.pushStack(e>1?m.unique(c):c),c.selector=this.selector?this.selector+" "+a:a,c},filter:function(a){return this.pushStack(w(this,a||[],!1))},not:function(a){return this.pushStack(w(this,a||[],!0))},is:function(a){return!!w(this,"string"==typeof a&&t.test(a)?m(a):a||[],!1).length}});var x,y=a.document,z=/^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,A=m.fn.init=function(a,b){var c,d;if(!a)return this;if("string"==typeof a){if(c="<"===a.charAt(0)&&">"===a.charAt(a.length-1)&&a.length>=3?[null,a,null]:z.exec(a),!c||!c[1]&&b)return!b||b.jquery?(b||x).find(a):this.constructor(b).find(a);if(c[1]){if(b=b instanceof m?b[0]:b,m.merge(this,m.parseHTML(c[1],b&&b.nodeType?b.ownerDocument||b:y,!0)),u.test(c[1])&&m.isPlainObject(b))for(c in b)m.isFunction(this[c])?this[c](b[c]):this.attr(c,b[c]);return this}if(d=y.getElementById(c[2]),d&&d.parentNode){if(d.id!==c[2])return x.find(a);this.length=1,this[0]=d}return this.context=y,this.selector=a,this}return a.nodeType?(this.context=this[0]=a,this.length=1,this):m.isFunction(a)?"undefined"!=typeof x.ready?x.ready(a):a(m):(void 0!==a.selector&&(this.selector=a.selector,this.context=a.context),m.makeArray(a,this))};A.prototype=m.fn,x=m(y);var B=/^(?:parents|prev(?:Until|All))/,C={children:!0,contents:!0,next:!0,prev:!0};m.extend({dir:function(a,b,c){var d=[],e=a[b];while(e&&9!==e.nodeType&&(void 0===c||1!==e.nodeType||!m(e).is(c)))1===e.nodeType&&d.push(e),e=e[b];return d},sibling:function(a,b){for(var c=[];a;a=a.nextSibling)1===a.nodeType&&a!==b&&c.push(a);return c}}),m.fn.extend({has:function(a){var b,c=m(a,this),d=c.length;return this.filter(function(){for(b=0;d>b;b++)if(m.contains(this,c[b]))return!0})},closest:function(a,b){for(var c,d=0,e=this.length,f=[],g=t.test(a)||"string"!=typeof a?m(a,b||this.context):0;e>d;d++)for(c=this[d];c&&c!==b;c=c.parentNode)if(c.nodeType<11&&(g?g.index(c)>-1:1===c.nodeType&&m.find.matchesSelector(c,a))){f.push(c);break}return this.pushStack(f.length>1?m.unique(f):f)},index:function(a){return a?"string"==typeof a?m.inArray(this[0],m(a)):m.inArray(a.jquery?a[0]:a,this):this[0]&&this[0].parentNode?this.first().prevAll().length:-1},add:function(a,b){return this.pushStack(m.unique(m.merge(this.get(),m(a,b))))},addBack:function(a){return this.add(null==a?this.prevObject:this.prevObject.filter(a))}});function D(a,b){do a=a[b];while(a&&1!==a.nodeType);return a}m.each({parent:function(a){var b=a.parentNode;return b&&11!==b.nodeType?b:null},parents:function(a){return m.dir(a,"parentNode")},parentsUntil:function(a,b,c){return m.dir(a,"parentNode",c)},next:function(a){return D(a,"nextSibling")},prev:function(a){return D(a,"previousSibling")},nextAll:function(a){return m.dir(a,"nextSibling")},prevAll:function(a){return m.dir(a,"previousSibling")},nextUntil:function(a,b,c){return m.dir(a,"nextSibling",c)},prevUntil:function(a,b,c){return m.dir(a,"previousSibling",c)},siblings:function(a){return m.sibling((a.parentNode||{}).firstChild,a)},children:function(a){return m.sibling(a.firstChild)},contents:function(a){return m.nodeName(a,"iframe")?a.contentDocument||a.contentWindow.document:m.merge([],a.childNodes)}},function(a,b){m.fn[a]=function(c,d){var e=m.map(this,b,c);return"Until"!==a.slice(-5)&&(d=c),d&&"string"==typeof d&&(e=m.filter(d,e)),this.length>1&&(C[a]||(e=m.unique(e)),B.test(a)&&(e=e.reverse())),this.pushStack(e)}});var E=/\S+/g,F={};function G(a){var b=F[a]={};return m.each(a.match(E)||[],function(a,c){b[c]=!0}),b}m.Callbacks=function(a){a="string"==typeof a?F[a]||G(a):m.extend({},a);var b,c,d,e,f,g,h=[],i=!a.once&&[],j=function(l){for(c=a.memory&&l,d=!0,f=g||0,g=0,e=h.length,b=!0;h&&e>f;f++)if(h[f].apply(l[0],l[1])===!1&&a.stopOnFalse){c=!1;break}b=!1,h&&(i?i.length&&j(i.shift()):c?h=[]:k.disable())},k={add:function(){if(h){var d=h.length;!function f(b){m.each(b,function(b,c){var d=m.type(c);"function"===d?a.unique&&k.has(c)||h.push(c):c&&c.length&&"string"!==d&&f(c)})}(arguments),b?e=h.length:c&&(g=d,j(c))}return this},remove:function(){return h&&m.each(arguments,function(a,c){var d;while((d=m.inArray(c,h,d))>-1)h.splice(d,1),b&&(e>=d&&e--,f>=d&&f--)}),this},has:function(a){return a?m.inArray(a,h)>-1:!(!h||!h.length)},empty:function(){return h=[],e=0,this},disable:function(){return h=i=c=void 0,this},disabled:function(){return!h},lock:function(){return i=void 0,c||k.disable(),this},locked:function(){return!i},fireWith:function(a,c){return!h||d&&!i||(c=c||[],c=[a,c.slice?c.slice():c],b?i.push(c):j(c)),this},fire:function(){return k.fireWith(this,arguments),this},fired:function(){return!!d}};return k},m.extend({Deferred:function(a){var b=[["resolve","done",m.Callbacks("once memory"),"resolved"],["reject","fail",m.Callbacks("once memory"),"rejected"],["notify","progress",m.Callbacks("memory")]],c="pending",d={state:function(){return c},always:function(){return e.done(arguments).fail(arguments),this},then:function(){var a=arguments;return m.Deferred(function(c){m.each(b,function(b,f){var g=m.isFunction(a[b])&&a[b];e[f[1]](function(){var a=g&&g.apply(this,arguments);a&&m.isFunction(a.promise)?a.promise().done(c.resolve).fail(c.reject).progress(c.notify):c[f[0]+"With"](this===d?c.promise():this,g?[a]:arguments)})}),a=null}).promise()},promise:function(a){return null!=a?m.extend(a,d):d}},e={};return d.pipe=d.then,m.each(b,function(a,f){var g=f[2],h=f[3];d[f[1]]=g.add,h&&g.add(function(){c=h},b[1^a][2].disable,b[2][2].lock),e[f[0]]=function(){return e[f[0]+"With"](this===e?d:this,arguments),this},e[f[0]+"With"]=g.fireWith}),d.promise(e),a&&a.call(e,e),e},when:function(a){var b=0,c=d.call(arguments),e=c.length,f=1!==e||a&&m.isFunction(a.promise)?e:0,g=1===f?a:m.Deferred(),h=function(a,b,c){return function(e){b[a]=this,c[a]=arguments.length>1?d.call(arguments):e,c===i?g.notifyWith(b,c):--f||g.resolveWith(b,c)}},i,j,k;if(e>1)for(i=new Array(e),j=new Array(e),k=new Array(e);e>b;b++)c[b]&&m.isFunction(c[b].promise)?c[b].promise().done(h(b,k,c)).fail(g.reject).progress(h(b,j,i)):--f;return f||g.resolveWith(k,c),g.promise()}});var H;m.fn.ready=function(a){return m.ready.promise().done(a),this},m.extend({isReady:!1,readyWait:1,holdReady:function(a){a?m.readyWait++:m.ready(!0)},ready:function(a){if(a===!0?!--m.readyWait:!m.isReady){if(!y.body)return setTimeout(m.ready);m.isReady=!0,a!==!0&&--m.readyWait>0||(H.resolveWith(y,[m]),m.fn.triggerHandler&&(m(y).triggerHandler("ready"),m(y).off("ready")))}}});function I(){y.addEventListener?(y.removeEventListener("DOMContentLoaded",J,!1),a.removeEventListener("load",J,!1)):(y.detachEvent("onreadystatechange",J),a.detachEvent("onload",J))}function J(){(y.addEventListener||"load"===event.type||"complete"===y.readyState)&&(I(),m.ready())}m.ready.promise=function(b){if(!H)if(H=m.Deferred(),"complete"===y.readyState)setTimeout(m.ready);else if(y.addEventListener)y.addEventListener("DOMContentLoaded",J,!1),a.addEventListener("load",J,!1);else{y.attachEvent("onreadystatechange",J),a.attachEvent("onload",J);var c=!1;try{c=null==a.frameElement&&y.documentElement}catch(d){}c&&c.doScroll&&!function e(){if(!m.isReady){try{c.doScroll("left")}catch(a){return setTimeout(e,50)}I(),m.ready()}}()}return H.promise(b)};var K="undefined",L;for(L in m(k))break;k.ownLast="0"!==L,k.inlineBlockNeedsLayout=!1,m(function(){var a,b,c,d;c=y.getElementsByTagName("body")[0],c&&c.style&&(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),typeof b.style.zoom!==K&&(b.style.cssText="display:inline;margin:0;border:0;padding:1px;width:1px;zoom:1",k.inlineBlockNeedsLayout=a=3===b.offsetWidth,a&&(c.style.zoom=1)),c.removeChild(d))}),function(){var a=y.createElement("div");if(null==k.deleteExpando){k.deleteExpando=!0;try{delete a.test}catch(b){k.deleteExpando=!1}}a=null}(),m.acceptData=function(a){var b=m.noData[(a.nodeName+" ").toLowerCase()],c=+a.nodeType||1;return 1!==c&&9!==c?!1:!b||b!==!0&&a.getAttribute("classid")===b};var M=/^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,N=/([A-Z])/g;function O(a,b,c){if(void 0===c&&1===a.nodeType){var d="data-"+b.replace(N,"-$1").toLowerCase();if(c=a.getAttribute(d),"string"==typeof c){try{c="true"===c?!0:"false"===c?!1:"null"===c?null:+c+""===c?+c:M.test(c)?m.parseJSON(c):c}catch(e){}m.data(a,b,c)}else c=void 0}return c}function P(a){var b;for(b in a)if(("data"!==b||!m.isEmptyObject(a[b]))&&"toJSON"!==b)return!1;return!0}function Q(a,b,d,e){if(m.acceptData(a)){var f,g,h=m.expando,i=a.nodeType,j=i?m.cache:a,k=i?a[h]:a[h]&&h;
if(k&&j[k]&&(e||j[k].data)||void 0!==d||"string"!=typeof b)return k||(k=i?a[h]=c.pop()||m.guid++:h),j[k]||(j[k]=i?{}:{toJSON:m.noop}),("object"==typeof b||"function"==typeof b)&&(e?j[k]=m.extend(j[k],b):j[k].data=m.extend(j[k].data,b)),g=j[k],e||(g.data||(g.data={}),g=g.data),void 0!==d&&(g[m.camelCase(b)]=d),"string"==typeof b?(f=g[b],null==f&&(f=g[m.camelCase(b)])):f=g,f}}function R(a,b,c){if(m.acceptData(a)){var d,e,f=a.nodeType,g=f?m.cache:a,h=f?a[m.expando]:m.expando;if(g[h]){if(b&&(d=c?g[h]:g[h].data)){m.isArray(b)?b=b.concat(m.map(b,m.camelCase)):b in d?b=[b]:(b=m.camelCase(b),b=b in d?[b]:b.split(" ")),e=b.length;while(e--)delete d[b[e]];if(c?!P(d):!m.isEmptyObject(d))return}(c||(delete g[h].data,P(g[h])))&&(f?m.cleanData([a],!0):k.deleteExpando||g!=g.window?delete g[h]:g[h]=null)}}}m.extend({cache:{},noData:{"applet ":!0,"embed ":!0,"object ":"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"},hasData:function(a){return a=a.nodeType?m.cache[a[m.expando]]:a[m.expando],!!a&&!P(a)},data:function(a,b,c){return Q(a,b,c)},removeData:function(a,b){return R(a,b)},_data:function(a,b,c){return Q(a,b,c,!0)},_removeData:function(a,b){return R(a,b,!0)}}),m.fn.extend({data:function(a,b){var c,d,e,f=this[0],g=f&&f.attributes;if(void 0===a){if(this.length&&(e=m.data(f),1===f.nodeType&&!m._data(f,"parsedAttrs"))){c=g.length;while(c--)g[c]&&(d=g[c].name,0===d.indexOf("data-")&&(d=m.camelCase(d.slice(5)),O(f,d,e[d])));m._data(f,"parsedAttrs",!0)}return e}return"object"==typeof a?this.each(function(){m.data(this,a)}):arguments.length>1?this.each(function(){m.data(this,a,b)}):f?O(f,a,m.data(f,a)):void 0},removeData:function(a){return this.each(function(){m.removeData(this,a)})}}),m.extend({queue:function(a,b,c){var d;return a?(b=(b||"fx")+"queue",d=m._data(a,b),c&&(!d||m.isArray(c)?d=m._data(a,b,m.makeArray(c)):d.push(c)),d||[]):void 0},dequeue:function(a,b){b=b||"fx";var c=m.queue(a,b),d=c.length,e=c.shift(),f=m._queueHooks(a,b),g=function(){m.dequeue(a,b)};"inprogress"===e&&(e=c.shift(),d--),e&&("fx"===b&&c.unshift("inprogress"),delete f.stop,e.call(a,g,f)),!d&&f&&f.empty.fire()},_queueHooks:function(a,b){var c=b+"queueHooks";return m._data(a,c)||m._data(a,c,{empty:m.Callbacks("once memory").add(function(){m._removeData(a,b+"queue"),m._removeData(a,c)})})}}),m.fn.extend({queue:function(a,b){var c=2;return"string"!=typeof a&&(b=a,a="fx",c--),arguments.length<c?m.queue(this[0],a):void 0===b?this:this.each(function(){var c=m.queue(this,a,b);m._queueHooks(this,a),"fx"===a&&"inprogress"!==c[0]&&m.dequeue(this,a)})},dequeue:function(a){return this.each(function(){m.dequeue(this,a)})},clearQueue:function(a){return this.queue(a||"fx",[])},promise:function(a,b){var c,d=1,e=m.Deferred(),f=this,g=this.length,h=function(){--d||e.resolveWith(f,[f])};"string"!=typeof a&&(b=a,a=void 0),a=a||"fx";while(g--)c=m._data(f[g],a+"queueHooks"),c&&c.empty&&(d++,c.empty.add(h));return h(),e.promise(b)}});var S=/[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source,T=["Top","Right","Bottom","Left"],U=function(a,b){return a=b||a,"none"===m.css(a,"display")||!m.contains(a.ownerDocument,a)},V=m.access=function(a,b,c,d,e,f,g){var h=0,i=a.length,j=null==c;if("object"===m.type(c)){e=!0;for(h in c)m.access(a,b,h,c[h],!0,f,g)}else if(void 0!==d&&(e=!0,m.isFunction(d)||(g=!0),j&&(g?(b.call(a,d),b=null):(j=b,b=function(a,b,c){return j.call(m(a),c)})),b))for(;i>h;h++)b(a[h],c,g?d:d.call(a[h],h,b(a[h],c)));return e?a:j?b.call(a):i?b(a[0],c):f},W=/^(?:checkbox|radio)$/i;!function(){var a=y.createElement("input"),b=y.createElement("div"),c=y.createDocumentFragment();if(b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",k.leadingWhitespace=3===b.firstChild.nodeType,k.tbody=!b.getElementsByTagName("tbody").length,k.htmlSerialize=!!b.getElementsByTagName("link").length,k.html5Clone="<:nav></:nav>"!==y.createElement("nav").cloneNode(!0).outerHTML,a.type="checkbox",a.checked=!0,c.appendChild(a),k.appendChecked=a.checked,b.innerHTML="<textarea>x</textarea>",k.noCloneChecked=!!b.cloneNode(!0).lastChild.defaultValue,c.appendChild(b),b.innerHTML="<input type='radio' checked='checked' name='t'/>",k.checkClone=b.cloneNode(!0).cloneNode(!0).lastChild.checked,k.noCloneEvent=!0,b.attachEvent&&(b.attachEvent("onclick",function(){k.noCloneEvent=!1}),b.cloneNode(!0).click()),null==k.deleteExpando){k.deleteExpando=!0;try{delete b.test}catch(d){k.deleteExpando=!1}}}(),function(){var b,c,d=y.createElement("div");for(b in{submit:!0,change:!0,focusin:!0})c="on"+b,(k[b+"Bubbles"]=c in a)||(d.setAttribute(c,"t"),k[b+"Bubbles"]=d.attributes[c].expando===!1);d=null}();var X=/^(?:input|select|textarea)$/i,Y=/^key/,Z=/^(?:mouse|pointer|contextmenu)|click/,$=/^(?:focusinfocus|focusoutblur)$/,_=/^([^.]*)(?:\.(.+)|)$/;function ab(){return!0}function bb(){return!1}function cb(){try{return y.activeElement}catch(a){}}m.event={global:{},add:function(a,b,c,d,e){var f,g,h,i,j,k,l,n,o,p,q,r=m._data(a);if(r){c.handler&&(i=c,c=i.handler,e=i.selector),c.guid||(c.guid=m.guid++),(g=r.events)||(g=r.events={}),(k=r.handle)||(k=r.handle=function(a){return typeof m===K||a&&m.event.triggered===a.type?void 0:m.event.dispatch.apply(k.elem,arguments)},k.elem=a),b=(b||"").match(E)||[""],h=b.length;while(h--)f=_.exec(b[h])||[],o=q=f[1],p=(f[2]||"").split(".").sort(),o&&(j=m.event.special[o]||{},o=(e?j.delegateType:j.bindType)||o,j=m.event.special[o]||{},l=m.extend({type:o,origType:q,data:d,handler:c,guid:c.guid,selector:e,needsContext:e&&m.expr.match.needsContext.test(e),namespace:p.join(".")},i),(n=g[o])||(n=g[o]=[],n.delegateCount=0,j.setup&&j.setup.call(a,d,p,k)!==!1||(a.addEventListener?a.addEventListener(o,k,!1):a.attachEvent&&a.attachEvent("on"+o,k))),j.add&&(j.add.call(a,l),l.handler.guid||(l.handler.guid=c.guid)),e?n.splice(n.delegateCount++,0,l):n.push(l),m.event.global[o]=!0);a=null}},remove:function(a,b,c,d,e){var f,g,h,i,j,k,l,n,o,p,q,r=m.hasData(a)&&m._data(a);if(r&&(k=r.events)){b=(b||"").match(E)||[""],j=b.length;while(j--)if(h=_.exec(b[j])||[],o=q=h[1],p=(h[2]||"").split(".").sort(),o){l=m.event.special[o]||{},o=(d?l.delegateType:l.bindType)||o,n=k[o]||[],h=h[2]&&new RegExp("(^|\\.)"+p.join("\\.(?:.*\\.|)")+"(\\.|$)"),i=f=n.length;while(f--)g=n[f],!e&&q!==g.origType||c&&c.guid!==g.guid||h&&!h.test(g.namespace)||d&&d!==g.selector&&("**"!==d||!g.selector)||(n.splice(f,1),g.selector&&n.delegateCount--,l.remove&&l.remove.call(a,g));i&&!n.length&&(l.teardown&&l.teardown.call(a,p,r.handle)!==!1||m.removeEvent(a,o,r.handle),delete k[o])}else for(o in k)m.event.remove(a,o+b[j],c,d,!0);m.isEmptyObject(k)&&(delete r.handle,m._removeData(a,"events"))}},trigger:function(b,c,d,e){var f,g,h,i,k,l,n,o=[d||y],p=j.call(b,"type")?b.type:b,q=j.call(b,"namespace")?b.namespace.split("."):[];if(h=l=d=d||y,3!==d.nodeType&&8!==d.nodeType&&!$.test(p+m.event.triggered)&&(p.indexOf(".")>=0&&(q=p.split("."),p=q.shift(),q.sort()),g=p.indexOf(":")<0&&"on"+p,b=b[m.expando]?b:new m.Event(p,"object"==typeof b&&b),b.isTrigger=e?2:3,b.namespace=q.join("."),b.namespace_re=b.namespace?new RegExp("(^|\\.)"+q.join("\\.(?:.*\\.|)")+"(\\.|$)"):null,b.result=void 0,b.target||(b.target=d),c=null==c?[b]:m.makeArray(c,[b]),k=m.event.special[p]||{},e||!k.trigger||k.trigger.apply(d,c)!==!1)){if(!e&&!k.noBubble&&!m.isWindow(d)){for(i=k.delegateType||p,$.test(i+p)||(h=h.parentNode);h;h=h.parentNode)o.push(h),l=h;l===(d.ownerDocument||y)&&o.push(l.defaultView||l.parentWindow||a)}n=0;while((h=o[n++])&&!b.isPropagationStopped())b.type=n>1?i:k.bindType||p,f=(m._data(h,"events")||{})[b.type]&&m._data(h,"handle"),f&&f.apply(h,c),f=g&&h[g],f&&f.apply&&m.acceptData(h)&&(b.result=f.apply(h,c),b.result===!1&&b.preventDefault());if(b.type=p,!e&&!b.isDefaultPrevented()&&(!k._default||k._default.apply(o.pop(),c)===!1)&&m.acceptData(d)&&g&&d[p]&&!m.isWindow(d)){l=d[g],l&&(d[g]=null),m.event.triggered=p;try{d[p]()}catch(r){}m.event.triggered=void 0,l&&(d[g]=l)}return b.result}},dispatch:function(a){a=m.event.fix(a);var b,c,e,f,g,h=[],i=d.call(arguments),j=(m._data(this,"events")||{})[a.type]||[],k=m.event.special[a.type]||{};if(i[0]=a,a.delegateTarget=this,!k.preDispatch||k.preDispatch.call(this,a)!==!1){h=m.event.handlers.call(this,a,j),b=0;while((f=h[b++])&&!a.isPropagationStopped()){a.currentTarget=f.elem,g=0;while((e=f.handlers[g++])&&!a.isImmediatePropagationStopped())(!a.namespace_re||a.namespace_re.test(e.namespace))&&(a.handleObj=e,a.data=e.data,c=((m.event.special[e.origType]||{}).handle||e.handler).apply(f.elem,i),void 0!==c&&(a.result=c)===!1&&(a.preventDefault(),a.stopPropagation()))}return k.postDispatch&&k.postDispatch.call(this,a),a.result}},handlers:function(a,b){var c,d,e,f,g=[],h=b.delegateCount,i=a.target;if(h&&i.nodeType&&(!a.button||"click"!==a.type))for(;i!=this;i=i.parentNode||this)if(1===i.nodeType&&(i.disabled!==!0||"click"!==a.type)){for(e=[],f=0;h>f;f++)d=b[f],c=d.selector+" ",void 0===e[c]&&(e[c]=d.needsContext?m(c,this).index(i)>=0:m.find(c,this,null,[i]).length),e[c]&&e.push(d);e.length&&g.push({elem:i,handlers:e})}return h<b.length&&g.push({elem:this,handlers:b.slice(h)}),g},fix:function(a){if(a[m.expando])return a;var b,c,d,e=a.type,f=a,g=this.fixHooks[e];g||(this.fixHooks[e]=g=Z.test(e)?this.mouseHooks:Y.test(e)?this.keyHooks:{}),d=g.props?this.props.concat(g.props):this.props,a=new m.Event(f),b=d.length;while(b--)c=d[b],a[c]=f[c];return a.target||(a.target=f.srcElement||y),3===a.target.nodeType&&(a.target=a.target.parentNode),a.metaKey=!!a.metaKey,g.filter?g.filter(a,f):a},props:"altKey bubbles cancelable ctrlKey currentTarget eventPhase metaKey relatedTarget shiftKey target timeStamp view which".split(" "),fixHooks:{},keyHooks:{props:"char charCode key keyCode".split(" "),filter:function(a,b){return null==a.which&&(a.which=null!=b.charCode?b.charCode:b.keyCode),a}},mouseHooks:{props:"button buttons clientX clientY fromElement offsetX offsetY pageX pageY screenX screenY toElement".split(" "),filter:function(a,b){var c,d,e,f=b.button,g=b.fromElement;return null==a.pageX&&null!=b.clientX&&(d=a.target.ownerDocument||y,e=d.documentElement,c=d.body,a.pageX=b.clientX+(e&&e.scrollLeft||c&&c.scrollLeft||0)-(e&&e.clientLeft||c&&c.clientLeft||0),a.pageY=b.clientY+(e&&e.scrollTop||c&&c.scrollTop||0)-(e&&e.clientTop||c&&c.clientTop||0)),!a.relatedTarget&&g&&(a.relatedTarget=g===a.target?b.toElement:g),a.which||void 0===f||(a.which=1&f?1:2&f?3:4&f?2:0),a}},special:{load:{noBubble:!0},focus:{trigger:function(){if(this!==cb()&&this.focus)try{return this.focus(),!1}catch(a){}},delegateType:"focusin"},blur:{trigger:function(){return this===cb()&&this.blur?(this.blur(),!1):void 0},delegateType:"focusout"},click:{trigger:function(){return m.nodeName(this,"input")&&"checkbox"===this.type&&this.click?(this.click(),!1):void 0},_default:function(a){return m.nodeName(a.target,"a")}},beforeunload:{postDispatch:function(a){void 0!==a.result&&a.originalEvent&&(a.originalEvent.returnValue=a.result)}}},simulate:function(a,b,c,d){var e=m.extend(new m.Event,c,{type:a,isSimulated:!0,originalEvent:{}});d?m.event.trigger(e,null,b):m.event.dispatch.call(b,e),e.isDefaultPrevented()&&c.preventDefault()}},m.removeEvent=y.removeEventListener?function(a,b,c){a.removeEventListener&&a.removeEventListener(b,c,!1)}:function(a,b,c){var d="on"+b;a.detachEvent&&(typeof a[d]===K&&(a[d]=null),a.detachEvent(d,c))},m.Event=function(a,b){return this instanceof m.Event?(a&&a.type?(this.originalEvent=a,this.type=a.type,this.isDefaultPrevented=a.defaultPrevented||void 0===a.defaultPrevented&&a.returnValue===!1?ab:bb):this.type=a,b&&m.extend(this,b),this.timeStamp=a&&a.timeStamp||m.now(),void(this[m.expando]=!0)):new m.Event(a,b)},m.Event.prototype={isDefaultPrevented:bb,isPropagationStopped:bb,isImmediatePropagationStopped:bb,preventDefault:function(){var a=this.originalEvent;this.isDefaultPrevented=ab,a&&(a.preventDefault?a.preventDefault():a.returnValue=!1)},stopPropagation:function(){var a=this.originalEvent;this.isPropagationStopped=ab,a&&(a.stopPropagation&&a.stopPropagation(),a.cancelBubble=!0)},stopImmediatePropagation:function(){var a=this.originalEvent;this.isImmediatePropagationStopped=ab,a&&a.stopImmediatePropagation&&a.stopImmediatePropagation(),this.stopPropagation()}},m.each({mouseenter:"mouseover",mouseleave:"mouseout",pointerenter:"pointerover",pointerleave:"pointerout"},function(a,b){m.event.special[a]={delegateType:b,bindType:b,handle:function(a){var c,d=this,e=a.relatedTarget,f=a.handleObj;return(!e||e!==d&&!m.contains(d,e))&&(a.type=f.origType,c=f.handler.apply(this,arguments),a.type=b),c}}}),k.submitBubbles||(m.event.special.submit={setup:function(){return m.nodeName(this,"form")?!1:void m.event.add(this,"click._submit keypress._submit",function(a){var b=a.target,c=m.nodeName(b,"input")||m.nodeName(b,"button")?b.form:void 0;c&&!m._data(c,"submitBubbles")&&(m.event.add(c,"submit._submit",function(a){a._submit_bubble=!0}),m._data(c,"submitBubbles",!0))})},postDispatch:function(a){a._submit_bubble&&(delete a._submit_bubble,this.parentNode&&!a.isTrigger&&m.event.simulate("submit",this.parentNode,a,!0))},teardown:function(){return m.nodeName(this,"form")?!1:void m.event.remove(this,"._submit")}}),k.changeBubbles||(m.event.special.change={setup:function(){return X.test(this.nodeName)?(("checkbox"===this.type||"radio"===this.type)&&(m.event.add(this,"propertychange._change",function(a){"checked"===a.originalEvent.propertyName&&(this._just_changed=!0)}),m.event.add(this,"click._change",function(a){this._just_changed&&!a.isTrigger&&(this._just_changed=!1),m.event.simulate("change",this,a,!0)})),!1):void m.event.add(this,"beforeactivate._change",function(a){var b=a.target;X.test(b.nodeName)&&!m._data(b,"changeBubbles")&&(m.event.add(b,"change._change",function(a){!this.parentNode||a.isSimulated||a.isTrigger||m.event.simulate("change",this.parentNode,a,!0)}),m._data(b,"changeBubbles",!0))})},handle:function(a){var b=a.target;return this!==b||a.isSimulated||a.isTrigger||"radio"!==b.type&&"checkbox"!==b.type?a.handleObj.handler.apply(this,arguments):void 0},teardown:function(){return m.event.remove(this,"._change"),!X.test(this.nodeName)}}),k.focusinBubbles||m.each({focus:"focusin",blur:"focusout"},function(a,b){var c=function(a){m.event.simulate(b,a.target,m.event.fix(a),!0)};m.event.special[b]={setup:function(){var d=this.ownerDocument||this,e=m._data(d,b);e||d.addEventListener(a,c,!0),m._data(d,b,(e||0)+1)},teardown:function(){var d=this.ownerDocument||this,e=m._data(d,b)-1;e?m._data(d,b,e):(d.removeEventListener(a,c,!0),m._removeData(d,b))}}}),m.fn.extend({on:function(a,b,c,d,e){var f,g;if("object"==typeof a){"string"!=typeof b&&(c=c||b,b=void 0);for(f in a)this.on(f,b,c,a[f],e);return this}if(null==c&&null==d?(d=b,c=b=void 0):null==d&&("string"==typeof b?(d=c,c=void 0):(d=c,c=b,b=void 0)),d===!1)d=bb;else if(!d)return this;return 1===e&&(g=d,d=function(a){return m().off(a),g.apply(this,arguments)},d.guid=g.guid||(g.guid=m.guid++)),this.each(function(){m.event.add(this,a,d,c,b)})},one:function(a,b,c,d){return this.on(a,b,c,d,1)},off:function(a,b,c){var d,e;if(a&&a.preventDefault&&a.handleObj)return d=a.handleObj,m(a.delegateTarget).off(d.namespace?d.origType+"."+d.namespace:d.origType,d.selector,d.handler),this;if("object"==typeof a){for(e in a)this.off(e,b,a[e]);return this}return(b===!1||"function"==typeof b)&&(c=b,b=void 0),c===!1&&(c=bb),this.each(function(){m.event.remove(this,a,c,b)})},trigger:function(a,b){return this.each(function(){m.event.trigger(a,b,this)})},triggerHandler:function(a,b){var c=this[0];return c?m.event.trigger(a,b,c,!0):void 0}});function db(a){var b=eb.split("|"),c=a.createDocumentFragment();if(c.createElement)while(b.length)c.createElement(b.pop());return c}var eb="abbr|article|aside|audio|bdi|canvas|data|datalist|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video",fb=/ jQuery\d+="(?:null|\d+)"/g,gb=new RegExp("<(?:"+eb+")[\\s/>]","i"),hb=/^\s+/,ib=/<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi,jb=/<([\w:]+)/,kb=/<tbody/i,lb=/<|&#?\w+;/,mb=/<(?:script|style|link)/i,nb=/checked\s*(?:[^=]|=\s*.checked.)/i,ob=/^$|\/(?:java|ecma)script/i,pb=/^true\/(.*)/,qb=/^\s*<!(?:\[CDATA\[|--)|(?:\]\]|--)>\s*$/g,rb={option:[1,"<select multiple='multiple'>","</select>"],legend:[1,"<fieldset>","</fieldset>"],area:[1,"<map>","</map>"],param:[1,"<object>","</object>"],thead:[1,"<table>","</table>"],tr:[2,"<table><tbody>","</tbody></table>"],col:[2,"<table><tbody></tbody><colgroup>","</colgroup></table>"],td:[3,"<table><tbody><tr>","</tr></tbody></table>"],_default:k.htmlSerialize?[0,"",""]:[1,"X<div>","</div>"]},sb=db(y),tb=sb.appendChild(y.createElement("div"));rb.optgroup=rb.option,rb.tbody=rb.tfoot=rb.colgroup=rb.caption=rb.thead,rb.th=rb.td;function ub(a,b){var c,d,e=0,f=typeof a.getElementsByTagName!==K?a.getElementsByTagName(b||"*"):typeof a.querySelectorAll!==K?a.querySelectorAll(b||"*"):void 0;if(!f)for(f=[],c=a.childNodes||a;null!=(d=c[e]);e++)!b||m.nodeName(d,b)?f.push(d):m.merge(f,ub(d,b));return void 0===b||b&&m.nodeName(a,b)?m.merge([a],f):f}function vb(a){W.test(a.type)&&(a.defaultChecked=a.checked)}function wb(a,b){return m.nodeName(a,"table")&&m.nodeName(11!==b.nodeType?b:b.firstChild,"tr")?a.getElementsByTagName("tbody")[0]||a.appendChild(a.ownerDocument.createElement("tbody")):a}function xb(a){return a.type=(null!==m.find.attr(a,"type"))+"/"+a.type,a}function yb(a){var b=pb.exec(a.type);return b?a.type=b[1]:a.removeAttribute("type"),a}function zb(a,b){for(var c,d=0;null!=(c=a[d]);d++)m._data(c,"globalEval",!b||m._data(b[d],"globalEval"))}function Ab(a,b){if(1===b.nodeType&&m.hasData(a)){var c,d,e,f=m._data(a),g=m._data(b,f),h=f.events;if(h){delete g.handle,g.events={};for(c in h)for(d=0,e=h[c].length;e>d;d++)m.event.add(b,c,h[c][d])}g.data&&(g.data=m.extend({},g.data))}}function Bb(a,b){var c,d,e;if(1===b.nodeType){if(c=b.nodeName.toLowerCase(),!k.noCloneEvent&&b[m.expando]){e=m._data(b);for(d in e.events)m.removeEvent(b,d,e.handle);b.removeAttribute(m.expando)}"script"===c&&b.text!==a.text?(xb(b).text=a.text,yb(b)):"object"===c?(b.parentNode&&(b.outerHTML=a.outerHTML),k.html5Clone&&a.innerHTML&&!m.trim(b.innerHTML)&&(b.innerHTML=a.innerHTML)):"input"===c&&W.test(a.type)?(b.defaultChecked=b.checked=a.checked,b.value!==a.value&&(b.value=a.value)):"option"===c?b.defaultSelected=b.selected=a.defaultSelected:("input"===c||"textarea"===c)&&(b.defaultValue=a.defaultValue)}}m.extend({clone:function(a,b,c){var d,e,f,g,h,i=m.contains(a.ownerDocument,a);if(k.html5Clone||m.isXMLDoc(a)||!gb.test("<"+a.nodeName+">")?f=a.cloneNode(!0):(tb.innerHTML=a.outerHTML,tb.removeChild(f=tb.firstChild)),!(k.noCloneEvent&&k.noCloneChecked||1!==a.nodeType&&11!==a.nodeType||m.isXMLDoc(a)))for(d=ub(f),h=ub(a),g=0;null!=(e=h[g]);++g)d[g]&&Bb(e,d[g]);if(b)if(c)for(h=h||ub(a),d=d||ub(f),g=0;null!=(e=h[g]);g++)Ab(e,d[g]);else Ab(a,f);return d=ub(f,"script"),d.length>0&&zb(d,!i&&ub(a,"script")),d=h=e=null,f},buildFragment:function(a,b,c,d){for(var e,f,g,h,i,j,l,n=a.length,o=db(b),p=[],q=0;n>q;q++)if(f=a[q],f||0===f)if("object"===m.type(f))m.merge(p,f.nodeType?[f]:f);else if(lb.test(f)){h=h||o.appendChild(b.createElement("div")),i=(jb.exec(f)||["",""])[1].toLowerCase(),l=rb[i]||rb._default,h.innerHTML=l[1]+f.replace(ib,"<$1></$2>")+l[2],e=l[0];while(e--)h=h.lastChild;if(!k.leadingWhitespace&&hb.test(f)&&p.push(b.createTextNode(hb.exec(f)[0])),!k.tbody){f="table"!==i||kb.test(f)?"<table>"!==l[1]||kb.test(f)?0:h:h.firstChild,e=f&&f.childNodes.length;while(e--)m.nodeName(j=f.childNodes[e],"tbody")&&!j.childNodes.length&&f.removeChild(j)}m.merge(p,h.childNodes),h.textContent="";while(h.firstChild)h.removeChild(h.firstChild);h=o.lastChild}else p.push(b.createTextNode(f));h&&o.removeChild(h),k.appendChecked||m.grep(ub(p,"input"),vb),q=0;while(f=p[q++])if((!d||-1===m.inArray(f,d))&&(g=m.contains(f.ownerDocument,f),h=ub(o.appendChild(f),"script"),g&&zb(h),c)){e=0;while(f=h[e++])ob.test(f.type||"")&&c.push(f)}return h=null,o},cleanData:function(a,b){for(var d,e,f,g,h=0,i=m.expando,j=m.cache,l=k.deleteExpando,n=m.event.special;null!=(d=a[h]);h++)if((b||m.acceptData(d))&&(f=d[i],g=f&&j[f])){if(g.events)for(e in g.events)n[e]?m.event.remove(d,e):m.removeEvent(d,e,g.handle);j[f]&&(delete j[f],l?delete d[i]:typeof d.removeAttribute!==K?d.removeAttribute(i):d[i]=null,c.push(f))}}}),m.fn.extend({text:function(a){return V(this,function(a){return void 0===a?m.text(this):this.empty().append((this[0]&&this[0].ownerDocument||y).createTextNode(a))},null,a,arguments.length)},append:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=wb(this,a);b.appendChild(a)}})},prepend:function(){return this.domManip(arguments,function(a){if(1===this.nodeType||11===this.nodeType||9===this.nodeType){var b=wb(this,a);b.insertBefore(a,b.firstChild)}})},before:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this)})},after:function(){return this.domManip(arguments,function(a){this.parentNode&&this.parentNode.insertBefore(a,this.nextSibling)})},remove:function(a,b){for(var c,d=a?m.filter(a,this):this,e=0;null!=(c=d[e]);e++)b||1!==c.nodeType||m.cleanData(ub(c)),c.parentNode&&(b&&m.contains(c.ownerDocument,c)&&zb(ub(c,"script")),c.parentNode.removeChild(c));return this},empty:function(){for(var a,b=0;null!=(a=this[b]);b++){1===a.nodeType&&m.cleanData(ub(a,!1));while(a.firstChild)a.removeChild(a.firstChild);a.options&&m.nodeName(a,"select")&&(a.options.length=0)}return this},clone:function(a,b){return a=null==a?!1:a,b=null==b?a:b,this.map(function(){return m.clone(this,a,b)})},html:function(a){return V(this,function(a){var b=this[0]||{},c=0,d=this.length;if(void 0===a)return 1===b.nodeType?b.innerHTML.replace(fb,""):void 0;if(!("string"!=typeof a||mb.test(a)||!k.htmlSerialize&&gb.test(a)||!k.leadingWhitespace&&hb.test(a)||rb[(jb.exec(a)||["",""])[1].toLowerCase()])){a=a.replace(ib,"<$1></$2>");try{for(;d>c;c++)b=this[c]||{},1===b.nodeType&&(m.cleanData(ub(b,!1)),b.innerHTML=a);b=0}catch(e){}}b&&this.empty().append(a)},null,a,arguments.length)},replaceWith:function(){var a=arguments[0];return this.domManip(arguments,function(b){a=this.parentNode,m.cleanData(ub(this)),a&&a.replaceChild(b,this)}),a&&(a.length||a.nodeType)?this:this.remove()},detach:function(a){return this.remove(a,!0)},domManip:function(a,b){a=e.apply([],a);var c,d,f,g,h,i,j=0,l=this.length,n=this,o=l-1,p=a[0],q=m.isFunction(p);if(q||l>1&&"string"==typeof p&&!k.checkClone&&nb.test(p))return this.each(function(c){var d=n.eq(c);q&&(a[0]=p.call(this,c,d.html())),d.domManip(a,b)});if(l&&(i=m.buildFragment(a,this[0].ownerDocument,!1,this),c=i.firstChild,1===i.childNodes.length&&(i=c),c)){for(g=m.map(ub(i,"script"),xb),f=g.length;l>j;j++)d=i,j!==o&&(d=m.clone(d,!0,!0),f&&m.merge(g,ub(d,"script"))),b.call(this[j],d,j);if(f)for(h=g[g.length-1].ownerDocument,m.map(g,yb),j=0;f>j;j++)d=g[j],ob.test(d.type||"")&&!m._data(d,"globalEval")&&m.contains(h,d)&&(d.src?m._evalUrl&&m._evalUrl(d.src):m.globalEval((d.text||d.textContent||d.innerHTML||"").replace(qb,"")));i=c=null}return this}}),m.each({appendTo:"append",prependTo:"prepend",insertBefore:"before",insertAfter:"after",replaceAll:"replaceWith"},function(a,b){m.fn[a]=function(a){for(var c,d=0,e=[],g=m(a),h=g.length-1;h>=d;d++)c=d===h?this:this.clone(!0),m(g[d])[b](c),f.apply(e,c.get());return this.pushStack(e)}});var Cb,Db={};function Eb(b,c){var d,e=m(c.createElement(b)).appendTo(c.body),f=a.getDefaultComputedStyle&&(d=a.getDefaultComputedStyle(e[0]))?d.display:m.css(e[0],"display");return e.detach(),f}function Fb(a){var b=y,c=Db[a];return c||(c=Eb(a,b),"none"!==c&&c||(Cb=(Cb||m("<iframe frameborder='0' width='0' height='0'/>")).appendTo(b.documentElement),b=(Cb[0].contentWindow||Cb[0].contentDocument).document,b.write(),b.close(),c=Eb(a,b),Cb.detach()),Db[a]=c),c}!function(){var a;k.shrinkWrapBlocks=function(){if(null!=a)return a;a=!1;var b,c,d;return c=y.getElementsByTagName("body")[0],c&&c.style?(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),typeof b.style.zoom!==K&&(b.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:1px;width:1px;zoom:1",b.appendChild(y.createElement("div")).style.width="5px",a=3!==b.offsetWidth),c.removeChild(d),a):void 0}}();var Gb=/^margin/,Hb=new RegExp("^("+S+")(?!px)[a-z%]+$","i"),Ib,Jb,Kb=/^(top|right|bottom|left)$/;a.getComputedStyle?(Ib=function(a){return a.ownerDocument.defaultView.getComputedStyle(a,null)},Jb=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Ib(a),g=c?c.getPropertyValue(b)||c[b]:void 0,c&&(""!==g||m.contains(a.ownerDocument,a)||(g=m.style(a,b)),Hb.test(g)&&Gb.test(b)&&(d=h.width,e=h.minWidth,f=h.maxWidth,h.minWidth=h.maxWidth=h.width=g,g=c.width,h.width=d,h.minWidth=e,h.maxWidth=f)),void 0===g?g:g+""}):y.documentElement.currentStyle&&(Ib=function(a){return a.currentStyle},Jb=function(a,b,c){var d,e,f,g,h=a.style;return c=c||Ib(a),g=c?c[b]:void 0,null==g&&h&&h[b]&&(g=h[b]),Hb.test(g)&&!Kb.test(b)&&(d=h.left,e=a.runtimeStyle,f=e&&e.left,f&&(e.left=a.currentStyle.left),h.left="fontSize"===b?"1em":g,g=h.pixelLeft+"px",h.left=d,f&&(e.left=f)),void 0===g?g:g+""||"auto"});function Lb(a,b){return{get:function(){var c=a();if(null!=c)return c?void delete this.get:(this.get=b).apply(this,arguments)}}}!function(){var b,c,d,e,f,g,h;if(b=y.createElement("div"),b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",d=b.getElementsByTagName("a")[0],c=d&&d.style){c.cssText="float:left;opacity:.5",k.opacity="0.5"===c.opacity,k.cssFloat=!!c.cssFloat,b.style.backgroundClip="content-box",b.cloneNode(!0).style.backgroundClip="",k.clearCloneStyle="content-box"===b.style.backgroundClip,k.boxSizing=""===c.boxSizing||""===c.MozBoxSizing||""===c.WebkitBoxSizing,m.extend(k,{reliableHiddenOffsets:function(){return null==g&&i(),g},boxSizingReliable:function(){return null==f&&i(),f},pixelPosition:function(){return null==e&&i(),e},reliableMarginRight:function(){return null==h&&i(),h}});function i(){var b,c,d,i;c=y.getElementsByTagName("body")[0],c&&c.style&&(b=y.createElement("div"),d=y.createElement("div"),d.style.cssText="position:absolute;border:0;width:0;height:0;top:0;left:-9999px",c.appendChild(d).appendChild(b),b.style.cssText="-webkit-box-sizing:border-box;-moz-box-sizing:border-box;box-sizing:border-box;display:block;margin-top:1%;top:1%;border:1px;padding:1px;width:4px;position:absolute",e=f=!1,h=!0,a.getComputedStyle&&(e="1%"!==(a.getComputedStyle(b,null)||{}).top,f="4px"===(a.getComputedStyle(b,null)||{width:"4px"}).width,i=b.appendChild(y.createElement("div")),i.style.cssText=b.style.cssText="-webkit-box-sizing:content-box;-moz-box-sizing:content-box;box-sizing:content-box;display:block;margin:0;border:0;padding:0",i.style.marginRight=i.style.width="0",b.style.width="1px",h=!parseFloat((a.getComputedStyle(i,null)||{}).marginRight)),b.innerHTML="<table><tr><td></td><td>t</td></tr></table>",i=b.getElementsByTagName("td"),i[0].style.cssText="margin:0;border:0;padding:0;display:none",g=0===i[0].offsetHeight,g&&(i[0].style.display="",i[1].style.display="none",g=0===i[0].offsetHeight),c.removeChild(d))}}}(),m.swap=function(a,b,c,d){var e,f,g={};for(f in b)g[f]=a.style[f],a.style[f]=b[f];e=c.apply(a,d||[]);for(f in b)a.style[f]=g[f];return e};var Mb=/alpha\([^)]*\)/i,Nb=/opacity\s*=\s*([^)]*)/,Ob=/^(none|table(?!-c[ea]).+)/,Pb=new RegExp("^("+S+")(.*)$","i"),Qb=new RegExp("^([+-])=("+S+")","i"),Rb={position:"absolute",visibility:"hidden",display:"block"},Sb={letterSpacing:"0",fontWeight:"400"},Tb=["Webkit","O","Moz","ms"];function Ub(a,b){if(b in a)return b;var c=b.charAt(0).toUpperCase()+b.slice(1),d=b,e=Tb.length;while(e--)if(b=Tb[e]+c,b in a)return b;return d}function Vb(a,b){for(var c,d,e,f=[],g=0,h=a.length;h>g;g++)d=a[g],d.style&&(f[g]=m._data(d,"olddisplay"),c=d.style.display,b?(f[g]||"none"!==c||(d.style.display=""),""===d.style.display&&U(d)&&(f[g]=m._data(d,"olddisplay",Fb(d.nodeName)))):(e=U(d),(c&&"none"!==c||!e)&&m._data(d,"olddisplay",e?c:m.css(d,"display"))));for(g=0;h>g;g++)d=a[g],d.style&&(b&&"none"!==d.style.display&&""!==d.style.display||(d.style.display=b?f[g]||"":"none"));return a}function Wb(a,b,c){var d=Pb.exec(b);return d?Math.max(0,d[1]-(c||0))+(d[2]||"px"):b}function Xb(a,b,c,d,e){for(var f=c===(d?"border":"content")?4:"width"===b?1:0,g=0;4>f;f+=2)"margin"===c&&(g+=m.css(a,c+T[f],!0,e)),d?("content"===c&&(g-=m.css(a,"padding"+T[f],!0,e)),"margin"!==c&&(g-=m.css(a,"border"+T[f]+"Width",!0,e))):(g+=m.css(a,"padding"+T[f],!0,e),"padding"!==c&&(g+=m.css(a,"border"+T[f]+"Width",!0,e)));return g}function Yb(a,b,c){var d=!0,e="width"===b?a.offsetWidth:a.offsetHeight,f=Ib(a),g=k.boxSizing&&"border-box"===m.css(a,"boxSizing",!1,f);if(0>=e||null==e){if(e=Jb(a,b,f),(0>e||null==e)&&(e=a.style[b]),Hb.test(e))return e;d=g&&(k.boxSizingReliable()||e===a.style[b]),e=parseFloat(e)||0}return e+Xb(a,b,c||(g?"border":"content"),d,f)+"px"}m.extend({cssHooks:{opacity:{get:function(a,b){if(b){var c=Jb(a,"opacity");return""===c?"1":c}}}},cssNumber:{columnCount:!0,fillOpacity:!0,flexGrow:!0,flexShrink:!0,fontWeight:!0,lineHeight:!0,opacity:!0,order:!0,orphans:!0,widows:!0,zIndex:!0,zoom:!0},cssProps:{"float":k.cssFloat?"cssFloat":"styleFloat"},style:function(a,b,c,d){if(a&&3!==a.nodeType&&8!==a.nodeType&&a.style){var e,f,g,h=m.camelCase(b),i=a.style;if(b=m.cssProps[h]||(m.cssProps[h]=Ub(i,h)),g=m.cssHooks[b]||m.cssHooks[h],void 0===c)return g&&"get"in g&&void 0!==(e=g.get(a,!1,d))?e:i[b];if(f=typeof c,"string"===f&&(e=Qb.exec(c))&&(c=(e[1]+1)*e[2]+parseFloat(m.css(a,b)),f="number"),null!=c&&c===c&&("number"!==f||m.cssNumber[h]||(c+="px"),k.clearCloneStyle||""!==c||0!==b.indexOf("background")||(i[b]="inherit"),!(g&&"set"in g&&void 0===(c=g.set(a,c,d)))))try{i[b]=c}catch(j){}}},css:function(a,b,c,d){var e,f,g,h=m.camelCase(b);return b=m.cssProps[h]||(m.cssProps[h]=Ub(a.style,h)),g=m.cssHooks[b]||m.cssHooks[h],g&&"get"in g&&(f=g.get(a,!0,c)),void 0===f&&(f=Jb(a,b,d)),"normal"===f&&b in Sb&&(f=Sb[b]),""===c||c?(e=parseFloat(f),c===!0||m.isNumeric(e)?e||0:f):f}}),m.each(["height","width"],function(a,b){m.cssHooks[b]={get:function(a,c,d){return c?Ob.test(m.css(a,"display"))&&0===a.offsetWidth?m.swap(a,Rb,function(){return Yb(a,b,d)}):Yb(a,b,d):void 0},set:function(a,c,d){var e=d&&Ib(a);return Wb(a,c,d?Xb(a,b,d,k.boxSizing&&"border-box"===m.css(a,"boxSizing",!1,e),e):0)}}}),k.opacity||(m.cssHooks.opacity={get:function(a,b){return Nb.test((b&&a.currentStyle?a.currentStyle.filter:a.style.filter)||"")?.01*parseFloat(RegExp.$1)+"":b?"1":""},set:function(a,b){var c=a.style,d=a.currentStyle,e=m.isNumeric(b)?"alpha(opacity="+100*b+")":"",f=d&&d.filter||c.filter||"";c.zoom=1,(b>=1||""===b)&&""===m.trim(f.replace(Mb,""))&&c.removeAttribute&&(c.removeAttribute("filter"),""===b||d&&!d.filter)||(c.filter=Mb.test(f)?f.replace(Mb,e):f+" "+e)}}),m.cssHooks.marginRight=Lb(k.reliableMarginRight,function(a,b){return b?m.swap(a,{display:"inline-block"},Jb,[a,"marginRight"]):void 0}),m.each({margin:"",padding:"",border:"Width"},function(a,b){m.cssHooks[a+b]={expand:function(c){for(var d=0,e={},f="string"==typeof c?c.split(" "):[c];4>d;d++)e[a+T[d]+b]=f[d]||f[d-2]||f[0];return e}},Gb.test(a)||(m.cssHooks[a+b].set=Wb)}),m.fn.extend({css:function(a,b){return V(this,function(a,b,c){var d,e,f={},g=0;if(m.isArray(b)){for(d=Ib(a),e=b.length;e>g;g++)f[b[g]]=m.css(a,b[g],!1,d);return f}return void 0!==c?m.style(a,b,c):m.css(a,b)},a,b,arguments.length>1)},show:function(){return Vb(this,!0)},hide:function(){return Vb(this)},toggle:function(a){return"boolean"==typeof a?a?this.show():this.hide():this.each(function(){U(this)?m(this).show():m(this).hide()})}});function Zb(a,b,c,d,e){return new Zb.prototype.init(a,b,c,d,e)}m.Tween=Zb,Zb.prototype={constructor:Zb,init:function(a,b,c,d,e,f){this.elem=a,this.prop=c,this.easing=e||"swing",this.options=b,this.start=this.now=this.cur(),this.end=d,this.unit=f||(m.cssNumber[c]?"":"px")
},cur:function(){var a=Zb.propHooks[this.prop];return a&&a.get?a.get(this):Zb.propHooks._default.get(this)},run:function(a){var b,c=Zb.propHooks[this.prop];return this.pos=b=this.options.duration?m.easing[this.easing](a,this.options.duration*a,0,1,this.options.duration):a,this.now=(this.end-this.start)*b+this.start,this.options.step&&this.options.step.call(this.elem,this.now,this),c&&c.set?c.set(this):Zb.propHooks._default.set(this),this}},Zb.prototype.init.prototype=Zb.prototype,Zb.propHooks={_default:{get:function(a){var b;return null==a.elem[a.prop]||a.elem.style&&null!=a.elem.style[a.prop]?(b=m.css(a.elem,a.prop,""),b&&"auto"!==b?b:0):a.elem[a.prop]},set:function(a){m.fx.step[a.prop]?m.fx.step[a.prop](a):a.elem.style&&(null!=a.elem.style[m.cssProps[a.prop]]||m.cssHooks[a.prop])?m.style(a.elem,a.prop,a.now+a.unit):a.elem[a.prop]=a.now}}},Zb.propHooks.scrollTop=Zb.propHooks.scrollLeft={set:function(a){a.elem.nodeType&&a.elem.parentNode&&(a.elem[a.prop]=a.now)}},m.easing={linear:function(a){return a},swing:function(a){return.5-Math.cos(a*Math.PI)/2}},m.fx=Zb.prototype.init,m.fx.step={};var $b,_b,ac=/^(?:toggle|show|hide)$/,bc=new RegExp("^(?:([+-])=|)("+S+")([a-z%]*)$","i"),cc=/queueHooks$/,dc=[ic],ec={"*":[function(a,b){var c=this.createTween(a,b),d=c.cur(),e=bc.exec(b),f=e&&e[3]||(m.cssNumber[a]?"":"px"),g=(m.cssNumber[a]||"px"!==f&&+d)&&bc.exec(m.css(c.elem,a)),h=1,i=20;if(g&&g[3]!==f){f=f||g[3],e=e||[],g=+d||1;do h=h||".5",g/=h,m.style(c.elem,a,g+f);while(h!==(h=c.cur()/d)&&1!==h&&--i)}return e&&(g=c.start=+g||+d||0,c.unit=f,c.end=e[1]?g+(e[1]+1)*e[2]:+e[2]),c}]};function fc(){return setTimeout(function(){$b=void 0}),$b=m.now()}function gc(a,b){var c,d={height:a},e=0;for(b=b?1:0;4>e;e+=2-b)c=T[e],d["margin"+c]=d["padding"+c]=a;return b&&(d.opacity=d.width=a),d}function hc(a,b,c){for(var d,e=(ec[b]||[]).concat(ec["*"]),f=0,g=e.length;g>f;f++)if(d=e[f].call(c,b,a))return d}function ic(a,b,c){var d,e,f,g,h,i,j,l,n=this,o={},p=a.style,q=a.nodeType&&U(a),r=m._data(a,"fxshow");c.queue||(h=m._queueHooks(a,"fx"),null==h.unqueued&&(h.unqueued=0,i=h.empty.fire,h.empty.fire=function(){h.unqueued||i()}),h.unqueued++,n.always(function(){n.always(function(){h.unqueued--,m.queue(a,"fx").length||h.empty.fire()})})),1===a.nodeType&&("height"in b||"width"in b)&&(c.overflow=[p.overflow,p.overflowX,p.overflowY],j=m.css(a,"display"),l="none"===j?m._data(a,"olddisplay")||Fb(a.nodeName):j,"inline"===l&&"none"===m.css(a,"float")&&(k.inlineBlockNeedsLayout&&"inline"!==Fb(a.nodeName)?p.zoom=1:p.display="inline-block")),c.overflow&&(p.overflow="hidden",k.shrinkWrapBlocks()||n.always(function(){p.overflow=c.overflow[0],p.overflowX=c.overflow[1],p.overflowY=c.overflow[2]}));for(d in b)if(e=b[d],ac.exec(e)){if(delete b[d],f=f||"toggle"===e,e===(q?"hide":"show")){if("show"!==e||!r||void 0===r[d])continue;q=!0}o[d]=r&&r[d]||m.style(a,d)}else j=void 0;if(m.isEmptyObject(o))"inline"===("none"===j?Fb(a.nodeName):j)&&(p.display=j);else{r?"hidden"in r&&(q=r.hidden):r=m._data(a,"fxshow",{}),f&&(r.hidden=!q),q?m(a).show():n.done(function(){m(a).hide()}),n.done(function(){var b;m._removeData(a,"fxshow");for(b in o)m.style(a,b,o[b])});for(d in o)g=hc(q?r[d]:0,d,n),d in r||(r[d]=g.start,q&&(g.end=g.start,g.start="width"===d||"height"===d?1:0))}}function jc(a,b){var c,d,e,f,g;for(c in a)if(d=m.camelCase(c),e=b[d],f=a[c],m.isArray(f)&&(e=f[1],f=a[c]=f[0]),c!==d&&(a[d]=f,delete a[c]),g=m.cssHooks[d],g&&"expand"in g){f=g.expand(f),delete a[d];for(c in f)c in a||(a[c]=f[c],b[c]=e)}else b[d]=e}function kc(a,b,c){var d,e,f=0,g=dc.length,h=m.Deferred().always(function(){delete i.elem}),i=function(){if(e)return!1;for(var b=$b||fc(),c=Math.max(0,j.startTime+j.duration-b),d=c/j.duration||0,f=1-d,g=0,i=j.tweens.length;i>g;g++)j.tweens[g].run(f);return h.notifyWith(a,[j,f,c]),1>f&&i?c:(h.resolveWith(a,[j]),!1)},j=h.promise({elem:a,props:m.extend({},b),opts:m.extend(!0,{specialEasing:{}},c),originalProperties:b,originalOptions:c,startTime:$b||fc(),duration:c.duration,tweens:[],createTween:function(b,c){var d=m.Tween(a,j.opts,b,c,j.opts.specialEasing[b]||j.opts.easing);return j.tweens.push(d),d},stop:function(b){var c=0,d=b?j.tweens.length:0;if(e)return this;for(e=!0;d>c;c++)j.tweens[c].run(1);return b?h.resolveWith(a,[j,b]):h.rejectWith(a,[j,b]),this}}),k=j.props;for(jc(k,j.opts.specialEasing);g>f;f++)if(d=dc[f].call(j,a,k,j.opts))return d;return m.map(k,hc,j),m.isFunction(j.opts.start)&&j.opts.start.call(a,j),m.fx.timer(m.extend(i,{elem:a,anim:j,queue:j.opts.queue})),j.progress(j.opts.progress).done(j.opts.done,j.opts.complete).fail(j.opts.fail).always(j.opts.always)}m.Animation=m.extend(kc,{tweener:function(a,b){m.isFunction(a)?(b=a,a=["*"]):a=a.split(" ");for(var c,d=0,e=a.length;e>d;d++)c=a[d],ec[c]=ec[c]||[],ec[c].unshift(b)},prefilter:function(a,b){b?dc.unshift(a):dc.push(a)}}),m.speed=function(a,b,c){var d=a&&"object"==typeof a?m.extend({},a):{complete:c||!c&&b||m.isFunction(a)&&a,duration:a,easing:c&&b||b&&!m.isFunction(b)&&b};return d.duration=m.fx.off?0:"number"==typeof d.duration?d.duration:d.duration in m.fx.speeds?m.fx.speeds[d.duration]:m.fx.speeds._default,(null==d.queue||d.queue===!0)&&(d.queue="fx"),d.old=d.complete,d.complete=function(){m.isFunction(d.old)&&d.old.call(this),d.queue&&m.dequeue(this,d.queue)},d},m.fn.extend({fadeTo:function(a,b,c,d){return this.filter(U).css("opacity",0).show().end().animate({opacity:b},a,c,d)},animate:function(a,b,c,d){var e=m.isEmptyObject(a),f=m.speed(b,c,d),g=function(){var b=kc(this,m.extend({},a),f);(e||m._data(this,"finish"))&&b.stop(!0)};return g.finish=g,e||f.queue===!1?this.each(g):this.queue(f.queue,g)},stop:function(a,b,c){var d=function(a){var b=a.stop;delete a.stop,b(c)};return"string"!=typeof a&&(c=b,b=a,a=void 0),b&&a!==!1&&this.queue(a||"fx",[]),this.each(function(){var b=!0,e=null!=a&&a+"queueHooks",f=m.timers,g=m._data(this);if(e)g[e]&&g[e].stop&&d(g[e]);else for(e in g)g[e]&&g[e].stop&&cc.test(e)&&d(g[e]);for(e=f.length;e--;)f[e].elem!==this||null!=a&&f[e].queue!==a||(f[e].anim.stop(c),b=!1,f.splice(e,1));(b||!c)&&m.dequeue(this,a)})},finish:function(a){return a!==!1&&(a=a||"fx"),this.each(function(){var b,c=m._data(this),d=c[a+"queue"],e=c[a+"queueHooks"],f=m.timers,g=d?d.length:0;for(c.finish=!0,m.queue(this,a,[]),e&&e.stop&&e.stop.call(this,!0),b=f.length;b--;)f[b].elem===this&&f[b].queue===a&&(f[b].anim.stop(!0),f.splice(b,1));for(b=0;g>b;b++)d[b]&&d[b].finish&&d[b].finish.call(this);delete c.finish})}}),m.each(["toggle","show","hide"],function(a,b){var c=m.fn[b];m.fn[b]=function(a,d,e){return null==a||"boolean"==typeof a?c.apply(this,arguments):this.animate(gc(b,!0),a,d,e)}}),m.each({slideDown:gc("show"),slideUp:gc("hide"),slideToggle:gc("toggle"),fadeIn:{opacity:"show"},fadeOut:{opacity:"hide"},fadeToggle:{opacity:"toggle"}},function(a,b){m.fn[a]=function(a,c,d){return this.animate(b,a,c,d)}}),m.timers=[],m.fx.tick=function(){var a,b=m.timers,c=0;for($b=m.now();c<b.length;c++)a=b[c],a()||b[c]!==a||b.splice(c--,1);b.length||m.fx.stop(),$b=void 0},m.fx.timer=function(a){m.timers.push(a),a()?m.fx.start():m.timers.pop()},m.fx.interval=13,m.fx.start=function(){_b||(_b=setInterval(m.fx.tick,m.fx.interval))},m.fx.stop=function(){clearInterval(_b),_b=null},m.fx.speeds={slow:600,fast:200,_default:400},m.fn.delay=function(a,b){return a=m.fx?m.fx.speeds[a]||a:a,b=b||"fx",this.queue(b,function(b,c){var d=setTimeout(b,a);c.stop=function(){clearTimeout(d)}})},function(){var a,b,c,d,e;b=y.createElement("div"),b.setAttribute("className","t"),b.innerHTML="  <link/><table></table><a href='/a'>a</a><input type='checkbox'/>",d=b.getElementsByTagName("a")[0],c=y.createElement("select"),e=c.appendChild(y.createElement("option")),a=b.getElementsByTagName("input")[0],d.style.cssText="top:1px",k.getSetAttribute="t"!==b.className,k.style=/top/.test(d.getAttribute("style")),k.hrefNormalized="/a"===d.getAttribute("href"),k.checkOn=!!a.value,k.optSelected=e.selected,k.enctype=!!y.createElement("form").enctype,c.disabled=!0,k.optDisabled=!e.disabled,a=y.createElement("input"),a.setAttribute("value",""),k.input=""===a.getAttribute("value"),a.value="t",a.setAttribute("type","radio"),k.radioValue="t"===a.value}();var lc=/\r/g;m.fn.extend({val:function(a){var b,c,d,e=this[0];{if(arguments.length)return d=m.isFunction(a),this.each(function(c){var e;1===this.nodeType&&(e=d?a.call(this,c,m(this).val()):a,null==e?e="":"number"==typeof e?e+="":m.isArray(e)&&(e=m.map(e,function(a){return null==a?"":a+""})),b=m.valHooks[this.type]||m.valHooks[this.nodeName.toLowerCase()],b&&"set"in b&&void 0!==b.set(this,e,"value")||(this.value=e))});if(e)return b=m.valHooks[e.type]||m.valHooks[e.nodeName.toLowerCase()],b&&"get"in b&&void 0!==(c=b.get(e,"value"))?c:(c=e.value,"string"==typeof c?c.replace(lc,""):null==c?"":c)}}}),m.extend({valHooks:{option:{get:function(a){var b=m.find.attr(a,"value");return null!=b?b:m.trim(m.text(a))}},select:{get:function(a){for(var b,c,d=a.options,e=a.selectedIndex,f="select-one"===a.type||0>e,g=f?null:[],h=f?e+1:d.length,i=0>e?h:f?e:0;h>i;i++)if(c=d[i],!(!c.selected&&i!==e||(k.optDisabled?c.disabled:null!==c.getAttribute("disabled"))||c.parentNode.disabled&&m.nodeName(c.parentNode,"optgroup"))){if(b=m(c).val(),f)return b;g.push(b)}return g},set:function(a,b){var c,d,e=a.options,f=m.makeArray(b),g=e.length;while(g--)if(d=e[g],m.inArray(m.valHooks.option.get(d),f)>=0)try{d.selected=c=!0}catch(h){d.scrollHeight}else d.selected=!1;return c||(a.selectedIndex=-1),e}}}}),m.each(["radio","checkbox"],function(){m.valHooks[this]={set:function(a,b){return m.isArray(b)?a.checked=m.inArray(m(a).val(),b)>=0:void 0}},k.checkOn||(m.valHooks[this].get=function(a){return null===a.getAttribute("value")?"on":a.value})});var mc,nc,oc=m.expr.attrHandle,pc=/^(?:checked|selected)$/i,qc=k.getSetAttribute,rc=k.input;m.fn.extend({attr:function(a,b){return V(this,m.attr,a,b,arguments.length>1)},removeAttr:function(a){return this.each(function(){m.removeAttr(this,a)})}}),m.extend({attr:function(a,b,c){var d,e,f=a.nodeType;if(a&&3!==f&&8!==f&&2!==f)return typeof a.getAttribute===K?m.prop(a,b,c):(1===f&&m.isXMLDoc(a)||(b=b.toLowerCase(),d=m.attrHooks[b]||(m.expr.match.bool.test(b)?nc:mc)),void 0===c?d&&"get"in d&&null!==(e=d.get(a,b))?e:(e=m.find.attr(a,b),null==e?void 0:e):null!==c?d&&"set"in d&&void 0!==(e=d.set(a,c,b))?e:(a.setAttribute(b,c+""),c):void m.removeAttr(a,b))},removeAttr:function(a,b){var c,d,e=0,f=b&&b.match(E);if(f&&1===a.nodeType)while(c=f[e++])d=m.propFix[c]||c,m.expr.match.bool.test(c)?rc&&qc||!pc.test(c)?a[d]=!1:a[m.camelCase("default-"+c)]=a[d]=!1:m.attr(a,c,""),a.removeAttribute(qc?c:d)},attrHooks:{type:{set:function(a,b){if(!k.radioValue&&"radio"===b&&m.nodeName(a,"input")){var c=a.value;return a.setAttribute("type",b),c&&(a.value=c),b}}}}}),nc={set:function(a,b,c){return b===!1?m.removeAttr(a,c):rc&&qc||!pc.test(c)?a.setAttribute(!qc&&m.propFix[c]||c,c):a[m.camelCase("default-"+c)]=a[c]=!0,c}},m.each(m.expr.match.bool.source.match(/\w+/g),function(a,b){var c=oc[b]||m.find.attr;oc[b]=rc&&qc||!pc.test(b)?function(a,b,d){var e,f;return d||(f=oc[b],oc[b]=e,e=null!=c(a,b,d)?b.toLowerCase():null,oc[b]=f),e}:function(a,b,c){return c?void 0:a[m.camelCase("default-"+b)]?b.toLowerCase():null}}),rc&&qc||(m.attrHooks.value={set:function(a,b,c){return m.nodeName(a,"input")?void(a.defaultValue=b):mc&&mc.set(a,b,c)}}),qc||(mc={set:function(a,b,c){var d=a.getAttributeNode(c);return d||a.setAttributeNode(d=a.ownerDocument.createAttribute(c)),d.value=b+="","value"===c||b===a.getAttribute(c)?b:void 0}},oc.id=oc.name=oc.coords=function(a,b,c){var d;return c?void 0:(d=a.getAttributeNode(b))&&""!==d.value?d.value:null},m.valHooks.button={get:function(a,b){var c=a.getAttributeNode(b);return c&&c.specified?c.value:void 0},set:mc.set},m.attrHooks.contenteditable={set:function(a,b,c){mc.set(a,""===b?!1:b,c)}},m.each(["width","height"],function(a,b){m.attrHooks[b]={set:function(a,c){return""===c?(a.setAttribute(b,"auto"),c):void 0}}})),k.style||(m.attrHooks.style={get:function(a){return a.style.cssText||void 0},set:function(a,b){return a.style.cssText=b+""}});var sc=/^(?:input|select|textarea|button|object)$/i,tc=/^(?:a|area)$/i;m.fn.extend({prop:function(a,b){return V(this,m.prop,a,b,arguments.length>1)},removeProp:function(a){return a=m.propFix[a]||a,this.each(function(){try{this[a]=void 0,delete this[a]}catch(b){}})}}),m.extend({propFix:{"for":"htmlFor","class":"className"},prop:function(a,b,c){var d,e,f,g=a.nodeType;if(a&&3!==g&&8!==g&&2!==g)return f=1!==g||!m.isXMLDoc(a),f&&(b=m.propFix[b]||b,e=m.propHooks[b]),void 0!==c?e&&"set"in e&&void 0!==(d=e.set(a,c,b))?d:a[b]=c:e&&"get"in e&&null!==(d=e.get(a,b))?d:a[b]},propHooks:{tabIndex:{get:function(a){var b=m.find.attr(a,"tabindex");return b?parseInt(b,10):sc.test(a.nodeName)||tc.test(a.nodeName)&&a.href?0:-1}}}}),k.hrefNormalized||m.each(["href","src"],function(a,b){m.propHooks[b]={get:function(a){return a.getAttribute(b,4)}}}),k.optSelected||(m.propHooks.selected={get:function(a){var b=a.parentNode;return b&&(b.selectedIndex,b.parentNode&&b.parentNode.selectedIndex),null}}),m.each(["tabIndex","readOnly","maxLength","cellSpacing","cellPadding","rowSpan","colSpan","useMap","frameBorder","contentEditable"],function(){m.propFix[this.toLowerCase()]=this}),k.enctype||(m.propFix.enctype="encoding");var uc=/[\t\r\n\f]/g;m.fn.extend({addClass:function(a){var b,c,d,e,f,g,h=0,i=this.length,j="string"==typeof a&&a;if(m.isFunction(a))return this.each(function(b){m(this).addClass(a.call(this,b,this.className))});if(j)for(b=(a||"").match(E)||[];i>h;h++)if(c=this[h],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(uc," "):" ")){f=0;while(e=b[f++])d.indexOf(" "+e+" ")<0&&(d+=e+" ");g=m.trim(d),c.className!==g&&(c.className=g)}return this},removeClass:function(a){var b,c,d,e,f,g,h=0,i=this.length,j=0===arguments.length||"string"==typeof a&&a;if(m.isFunction(a))return this.each(function(b){m(this).removeClass(a.call(this,b,this.className))});if(j)for(b=(a||"").match(E)||[];i>h;h++)if(c=this[h],d=1===c.nodeType&&(c.className?(" "+c.className+" ").replace(uc," "):"")){f=0;while(e=b[f++])while(d.indexOf(" "+e+" ")>=0)d=d.replace(" "+e+" "," ");g=a?m.trim(d):"",c.className!==g&&(c.className=g)}return this},toggleClass:function(a,b){var c=typeof a;return"boolean"==typeof b&&"string"===c?b?this.addClass(a):this.removeClass(a):this.each(m.isFunction(a)?function(c){m(this).toggleClass(a.call(this,c,this.className,b),b)}:function(){if("string"===c){var b,d=0,e=m(this),f=a.match(E)||[];while(b=f[d++])e.hasClass(b)?e.removeClass(b):e.addClass(b)}else(c===K||"boolean"===c)&&(this.className&&m._data(this,"__className__",this.className),this.className=this.className||a===!1?"":m._data(this,"__className__")||"")})},hasClass:function(a){for(var b=" "+a+" ",c=0,d=this.length;d>c;c++)if(1===this[c].nodeType&&(" "+this[c].className+" ").replace(uc," ").indexOf(b)>=0)return!0;return!1}}),m.each("blur focus focusin focusout load resize scroll unload click dblclick mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave change select submit keydown keypress keyup error contextmenu".split(" "),function(a,b){m.fn[b]=function(a,c){return arguments.length>0?this.on(b,null,a,c):this.trigger(b)}}),m.fn.extend({hover:function(a,b){return this.mouseenter(a).mouseleave(b||a)},bind:function(a,b,c){return this.on(a,null,b,c)},unbind:function(a,b){return this.off(a,null,b)},delegate:function(a,b,c,d){return this.on(b,a,c,d)},undelegate:function(a,b,c){return 1===arguments.length?this.off(a,"**"):this.off(b,a||"**",c)}});var vc=m.now(),wc=/\?/,xc=/(,)|(\[|{)|(}|])|"(?:[^"\\\r\n]|\\["\\\/bfnrt]|\\u[\da-fA-F]{4})*"\s*:?|true|false|null|-?(?!0\d)\d+(?:\.\d+|)(?:[eE][+-]?\d+|)/g;m.parseJSON=function(b){if(a.JSON&&a.JSON.parse)return a.JSON.parse(b+"");var c,d=null,e=m.trim(b+"");return e&&!m.trim(e.replace(xc,function(a,b,e,f){return c&&b&&(d=0),0===d?a:(c=e||b,d+=!f-!e,"")}))?Function("return "+e)():m.error("Invalid JSON: "+b)},m.parseXML=function(b){var c,d;if(!b||"string"!=typeof b)return null;try{a.DOMParser?(d=new DOMParser,c=d.parseFromString(b,"text/xml")):(c=new ActiveXObject("Microsoft.XMLDOM"),c.async="false",c.loadXML(b))}catch(e){c=void 0}return c&&c.documentElement&&!c.getElementsByTagName("parsererror").length||m.error("Invalid XML: "+b),c};var yc,zc,Ac=/#.*$/,Bc=/([?&])_=[^&]*/,Cc=/^(.*?):[ \t]*([^\r\n]*)\r?$/gm,Dc=/^(?:about|app|app-storage|.+-extension|file|res|widget):$/,Ec=/^(?:GET|HEAD)$/,Fc=/^\/\//,Gc=/^([\w.+-]+:)(?:\/\/(?:[^\/?#]*@|)([^\/?#:]*)(?::(\d+)|)|)/,Hc={},Ic={},Jc="*/".concat("*");try{zc=location.href}catch(Kc){zc=y.createElement("a"),zc.href="",zc=zc.href}yc=Gc.exec(zc.toLowerCase())||[];function Lc(a){return function(b,c){"string"!=typeof b&&(c=b,b="*");var d,e=0,f=b.toLowerCase().match(E)||[];if(m.isFunction(c))while(d=f[e++])"+"===d.charAt(0)?(d=d.slice(1)||"*",(a[d]=a[d]||[]).unshift(c)):(a[d]=a[d]||[]).push(c)}}function Mc(a,b,c,d){var e={},f=a===Ic;function g(h){var i;return e[h]=!0,m.each(a[h]||[],function(a,h){var j=h(b,c,d);return"string"!=typeof j||f||e[j]?f?!(i=j):void 0:(b.dataTypes.unshift(j),g(j),!1)}),i}return g(b.dataTypes[0])||!e["*"]&&g("*")}function Nc(a,b){var c,d,e=m.ajaxSettings.flatOptions||{};for(d in b)void 0!==b[d]&&((e[d]?a:c||(c={}))[d]=b[d]);return c&&m.extend(!0,a,c),a}function Oc(a,b,c){var d,e,f,g,h=a.contents,i=a.dataTypes;while("*"===i[0])i.shift(),void 0===e&&(e=a.mimeType||b.getResponseHeader("Content-Type"));if(e)for(g in h)if(h[g]&&h[g].test(e)){i.unshift(g);break}if(i[0]in c)f=i[0];else{for(g in c){if(!i[0]||a.converters[g+" "+i[0]]){f=g;break}d||(d=g)}f=f||d}return f?(f!==i[0]&&i.unshift(f),c[f]):void 0}function Pc(a,b,c,d){var e,f,g,h,i,j={},k=a.dataTypes.slice();if(k[1])for(g in a.converters)j[g.toLowerCase()]=a.converters[g];f=k.shift();while(f)if(a.responseFields[f]&&(c[a.responseFields[f]]=b),!i&&d&&a.dataFilter&&(b=a.dataFilter(b,a.dataType)),i=f,f=k.shift())if("*"===f)f=i;else if("*"!==i&&i!==f){if(g=j[i+" "+f]||j["* "+f],!g)for(e in j)if(h=e.split(" "),h[1]===f&&(g=j[i+" "+h[0]]||j["* "+h[0]])){g===!0?g=j[e]:j[e]!==!0&&(f=h[0],k.unshift(h[1]));break}if(g!==!0)if(g&&a["throws"])b=g(b);else try{b=g(b)}catch(l){return{state:"parsererror",error:g?l:"No conversion from "+i+" to "+f}}}return{state:"success",data:b}}m.extend({active:0,lastModified:{},etag:{},ajaxSettings:{url:zc,type:"GET",isLocal:Dc.test(yc[1]),global:!0,processData:!0,async:!0,contentType:"application/x-www-form-urlencoded; charset=UTF-8",accepts:{"*":Jc,text:"text/plain",html:"text/html",xml:"application/xml, text/xml",json:"application/json, text/javascript"},contents:{xml:/xml/,html:/html/,json:/json/},responseFields:{xml:"responseXML",text:"responseText",json:"responseJSON"},converters:{"* text":String,"text html":!0,"text json":m.parseJSON,"text xml":m.parseXML},flatOptions:{url:!0,context:!0}},ajaxSetup:function(a,b){return b?Nc(Nc(a,m.ajaxSettings),b):Nc(m.ajaxSettings,a)},ajaxPrefilter:Lc(Hc),ajaxTransport:Lc(Ic),ajax:function(a,b){"object"==typeof a&&(b=a,a=void 0),b=b||{};var c,d,e,f,g,h,i,j,k=m.ajaxSetup({},b),l=k.context||k,n=k.context&&(l.nodeType||l.jquery)?m(l):m.event,o=m.Deferred(),p=m.Callbacks("once memory"),q=k.statusCode||{},r={},s={},t=0,u="canceled",v={readyState:0,getResponseHeader:function(a){var b;if(2===t){if(!j){j={};while(b=Cc.exec(f))j[b[1].toLowerCase()]=b[2]}b=j[a.toLowerCase()]}return null==b?null:b},getAllResponseHeaders:function(){return 2===t?f:null},setRequestHeader:function(a,b){var c=a.toLowerCase();return t||(a=s[c]=s[c]||a,r[a]=b),this},overrideMimeType:function(a){return t||(k.mimeType=a),this},statusCode:function(a){var b;if(a)if(2>t)for(b in a)q[b]=[q[b],a[b]];else v.always(a[v.status]);return this},abort:function(a){var b=a||u;return i&&i.abort(b),x(0,b),this}};if(o.promise(v).complete=p.add,v.success=v.done,v.error=v.fail,k.url=((a||k.url||zc)+"").replace(Ac,"").replace(Fc,yc[1]+"//"),k.type=b.method||b.type||k.method||k.type,k.dataTypes=m.trim(k.dataType||"*").toLowerCase().match(E)||[""],null==k.crossDomain&&(c=Gc.exec(k.url.toLowerCase()),k.crossDomain=!(!c||c[1]===yc[1]&&c[2]===yc[2]&&(c[3]||("http:"===c[1]?"80":"443"))===(yc[3]||("http:"===yc[1]?"80":"443")))),k.data&&k.processData&&"string"!=typeof k.data&&(k.data=m.param(k.data,k.traditional)),Mc(Hc,k,b,v),2===t)return v;h=k.global,h&&0===m.active++&&m.event.trigger("ajaxStart"),k.type=k.type.toUpperCase(),k.hasContent=!Ec.test(k.type),e=k.url,k.hasContent||(k.data&&(e=k.url+=(wc.test(e)?"&":"?")+k.data,delete k.data),k.cache===!1&&(k.url=Bc.test(e)?e.replace(Bc,"$1_="+vc++):e+(wc.test(e)?"&":"?")+"_="+vc++)),k.ifModified&&(m.lastModified[e]&&v.setRequestHeader("If-Modified-Since",m.lastModified[e]),m.etag[e]&&v.setRequestHeader("If-None-Match",m.etag[e])),(k.data&&k.hasContent&&k.contentType!==!1||b.contentType)&&v.setRequestHeader("Content-Type",k.contentType),v.setRequestHeader("Accept",k.dataTypes[0]&&k.accepts[k.dataTypes[0]]?k.accepts[k.dataTypes[0]]+("*"!==k.dataTypes[0]?", "+Jc+"; q=0.01":""):k.accepts["*"]);for(d in k.headers)v.setRequestHeader(d,k.headers[d]);if(k.beforeSend&&(k.beforeSend.call(l,v,k)===!1||2===t))return v.abort();u="abort";for(d in{success:1,error:1,complete:1})v[d](k[d]);if(i=Mc(Ic,k,b,v)){v.readyState=1,h&&n.trigger("ajaxSend",[v,k]),k.async&&k.timeout>0&&(g=setTimeout(function(){v.abort("timeout")},k.timeout));try{t=1,i.send(r,x)}catch(w){if(!(2>t))throw w;x(-1,w)}}else x(-1,"No Transport");function x(a,b,c,d){var j,r,s,u,w,x=b;2!==t&&(t=2,g&&clearTimeout(g),i=void 0,f=d||"",v.readyState=a>0?4:0,j=a>=200&&300>a||304===a,c&&(u=Oc(k,v,c)),u=Pc(k,u,v,j),j?(k.ifModified&&(w=v.getResponseHeader("Last-Modified"),w&&(m.lastModified[e]=w),w=v.getResponseHeader("etag"),w&&(m.etag[e]=w)),204===a||"HEAD"===k.type?x="nocontent":304===a?x="notmodified":(x=u.state,r=u.data,s=u.error,j=!s)):(s=x,(a||!x)&&(x="error",0>a&&(a=0))),v.status=a,v.statusText=(b||x)+"",j?o.resolveWith(l,[r,x,v]):o.rejectWith(l,[v,x,s]),v.statusCode(q),q=void 0,h&&n.trigger(j?"ajaxSuccess":"ajaxError",[v,k,j?r:s]),p.fireWith(l,[v,x]),h&&(n.trigger("ajaxComplete",[v,k]),--m.active||m.event.trigger("ajaxStop")))}return v},getJSON:function(a,b,c){return m.get(a,b,c,"json")},getScript:function(a,b){return m.get(a,void 0,b,"script")}}),m.each(["get","post"],function(a,b){m[b]=function(a,c,d,e){return m.isFunction(c)&&(e=e||d,d=c,c=void 0),m.ajax({url:a,type:b,dataType:e,data:c,success:d})}}),m.each(["ajaxStart","ajaxStop","ajaxComplete","ajaxError","ajaxSuccess","ajaxSend"],function(a,b){m.fn[b]=function(a){return this.on(b,a)}}),m._evalUrl=function(a){return m.ajax({url:a,type:"GET",dataType:"script",async:!1,global:!1,"throws":!0})},m.fn.extend({wrapAll:function(a){if(m.isFunction(a))return this.each(function(b){m(this).wrapAll(a.call(this,b))});if(this[0]){var b=m(a,this[0].ownerDocument).eq(0).clone(!0);this[0].parentNode&&b.insertBefore(this[0]),b.map(function(){var a=this;while(a.firstChild&&1===a.firstChild.nodeType)a=a.firstChild;return a}).append(this)}return this},wrapInner:function(a){return this.each(m.isFunction(a)?function(b){m(this).wrapInner(a.call(this,b))}:function(){var b=m(this),c=b.contents();c.length?c.wrapAll(a):b.append(a)})},wrap:function(a){var b=m.isFunction(a);return this.each(function(c){m(this).wrapAll(b?a.call(this,c):a)})},unwrap:function(){return this.parent().each(function(){m.nodeName(this,"body")||m(this).replaceWith(this.childNodes)}).end()}}),m.expr.filters.hidden=function(a){return a.offsetWidth<=0&&a.offsetHeight<=0||!k.reliableHiddenOffsets()&&"none"===(a.style&&a.style.display||m.css(a,"display"))},m.expr.filters.visible=function(a){return!m.expr.filters.hidden(a)};var Qc=/%20/g,Rc=/\[\]$/,Sc=/\r?\n/g,Tc=/^(?:submit|button|image|reset|file)$/i,Uc=/^(?:input|select|textarea|keygen)/i;function Vc(a,b,c,d){var e;if(m.isArray(b))m.each(b,function(b,e){c||Rc.test(a)?d(a,e):Vc(a+"["+("object"==typeof e?b:"")+"]",e,c,d)});else if(c||"object"!==m.type(b))d(a,b);else for(e in b)Vc(a+"["+e+"]",b[e],c,d)}m.param=function(a,b){var c,d=[],e=function(a,b){b=m.isFunction(b)?b():null==b?"":b,d[d.length]=encodeURIComponent(a)+"="+encodeURIComponent(b)};if(void 0===b&&(b=m.ajaxSettings&&m.ajaxSettings.traditional),m.isArray(a)||a.jquery&&!m.isPlainObject(a))m.each(a,function(){e(this.name,this.value)});else for(c in a)Vc(c,a[c],b,e);return d.join("&").replace(Qc,"+")},m.fn.extend({serialize:function(){return m.param(this.serializeArray())},serializeArray:function(){return this.map(function(){var a=m.prop(this,"elements");return a?m.makeArray(a):this}).filter(function(){var a=this.type;return this.name&&!m(this).is(":disabled")&&Uc.test(this.nodeName)&&!Tc.test(a)&&(this.checked||!W.test(a))}).map(function(a,b){var c=m(this).val();return null==c?null:m.isArray(c)?m.map(c,function(a){return{name:b.name,value:a.replace(Sc,"\r\n")}}):{name:b.name,value:c.replace(Sc,"\r\n")}}).get()}}),m.ajaxSettings.xhr=void 0!==a.ActiveXObject?function(){return!this.isLocal&&/^(get|post|head|put|delete|options)$/i.test(this.type)&&Zc()||$c()}:Zc;var Wc=0,Xc={},Yc=m.ajaxSettings.xhr();a.ActiveXObject&&m(a).on("unload",function(){for(var a in Xc)Xc[a](void 0,!0)}),k.cors=!!Yc&&"withCredentials"in Yc,Yc=k.ajax=!!Yc,Yc&&m.ajaxTransport(function(a){if(!a.crossDomain||k.cors){var b;return{send:function(c,d){var e,f=a.xhr(),g=++Wc;if(f.open(a.type,a.url,a.async,a.username,a.password),a.xhrFields)for(e in a.xhrFields)f[e]=a.xhrFields[e];a.mimeType&&f.overrideMimeType&&f.overrideMimeType(a.mimeType),a.crossDomain||c["X-Requested-With"]||(c["X-Requested-With"]="XMLHttpRequest");for(e in c)void 0!==c[e]&&f.setRequestHeader(e,c[e]+"");f.send(a.hasContent&&a.data||null),b=function(c,e){var h,i,j;if(b&&(e||4===f.readyState))if(delete Xc[g],b=void 0,f.onreadystatechange=m.noop,e)4!==f.readyState&&f.abort();else{j={},h=f.status,"string"==typeof f.responseText&&(j.text=f.responseText);try{i=f.statusText}catch(k){i=""}h||!a.isLocal||a.crossDomain?1223===h&&(h=204):h=j.text?200:404}j&&d(h,i,j,f.getAllResponseHeaders())},a.async?4===f.readyState?setTimeout(b):f.onreadystatechange=Xc[g]=b:b()},abort:function(){b&&b(void 0,!0)}}}});function Zc(){try{return new a.XMLHttpRequest}catch(b){}}function $c(){try{return new a.ActiveXObject("Microsoft.XMLHTTP")}catch(b){}}m.ajaxSetup({accepts:{script:"text/javascript, application/javascript, application/ecmascript, application/x-ecmascript"},contents:{script:/(?:java|ecma)script/},converters:{"text script":function(a){return m.globalEval(a),a}}}),m.ajaxPrefilter("script",function(a){void 0===a.cache&&(a.cache=!1),a.crossDomain&&(a.type="GET",a.global=!1)}),m.ajaxTransport("script",function(a){if(a.crossDomain){var b,c=y.head||m("head")[0]||y.documentElement;return{send:function(d,e){b=y.createElement("script"),b.async=!0,a.scriptCharset&&(b.charset=a.scriptCharset),b.src=a.url,b.onload=b.onreadystatechange=function(a,c){(c||!b.readyState||/loaded|complete/.test(b.readyState))&&(b.onload=b.onreadystatechange=null,b.parentNode&&b.parentNode.removeChild(b),b=null,c||e(200,"success"))},c.insertBefore(b,c.firstChild)},abort:function(){b&&b.onload(void 0,!0)}}}});var _c=[],ad=/(=)\?(?=&|$)|\?\?/;m.ajaxSetup({jsonp:"callback",jsonpCallback:function(){var a=_c.pop()||m.expando+"_"+vc++;return this[a]=!0,a}}),m.ajaxPrefilter("json jsonp",function(b,c,d){var e,f,g,h=b.jsonp!==!1&&(ad.test(b.url)?"url":"string"==typeof b.data&&!(b.contentType||"").indexOf("application/x-www-form-urlencoded")&&ad.test(b.data)&&"data");return h||"jsonp"===b.dataTypes[0]?(e=b.jsonpCallback=m.isFunction(b.jsonpCallback)?b.jsonpCallback():b.jsonpCallback,h?b[h]=b[h].replace(ad,"$1"+e):b.jsonp!==!1&&(b.url+=(wc.test(b.url)?"&":"?")+b.jsonp+"="+e),b.converters["script json"]=function(){return g||m.error(e+" was not called"),g[0]},b.dataTypes[0]="json",f=a[e],a[e]=function(){g=arguments},d.always(function(){a[e]=f,b[e]&&(b.jsonpCallback=c.jsonpCallback,_c.push(e)),g&&m.isFunction(f)&&f(g[0]),g=f=void 0}),"script"):void 0}),m.parseHTML=function(a,b,c){if(!a||"string"!=typeof a)return null;"boolean"==typeof b&&(c=b,b=!1),b=b||y;var d=u.exec(a),e=!c&&[];return d?[b.createElement(d[1])]:(d=m.buildFragment([a],b,e),e&&e.length&&m(e).remove(),m.merge([],d.childNodes))};var bd=m.fn.load;m.fn.load=function(a,b,c){if("string"!=typeof a&&bd)return bd.apply(this,arguments);var d,e,f,g=this,h=a.indexOf(" ");return h>=0&&(d=m.trim(a.slice(h,a.length)),a=a.slice(0,h)),m.isFunction(b)?(c=b,b=void 0):b&&"object"==typeof b&&(f="POST"),g.length>0&&m.ajax({url:a,type:f,dataType:"html",data:b}).done(function(a){e=arguments,g.html(d?m("<div>").append(m.parseHTML(a)).find(d):a)}).complete(c&&function(a,b){g.each(c,e||[a.responseText,b,a])}),this},m.expr.filters.animated=function(a){return m.grep(m.timers,function(b){return a===b.elem}).length};var cd=a.document.documentElement;function dd(a){return m.isWindow(a)?a:9===a.nodeType?a.defaultView||a.parentWindow:!1}m.offset={setOffset:function(a,b,c){var d,e,f,g,h,i,j,k=m.css(a,"position"),l=m(a),n={};"static"===k&&(a.style.position="relative"),h=l.offset(),f=m.css(a,"top"),i=m.css(a,"left"),j=("absolute"===k||"fixed"===k)&&m.inArray("auto",[f,i])>-1,j?(d=l.position(),g=d.top,e=d.left):(g=parseFloat(f)||0,e=parseFloat(i)||0),m.isFunction(b)&&(b=b.call(a,c,h)),null!=b.top&&(n.top=b.top-h.top+g),null!=b.left&&(n.left=b.left-h.left+e),"using"in b?b.using.call(a,n):l.css(n)}},m.fn.extend({offset:function(a){if(arguments.length)return void 0===a?this:this.each(function(b){m.offset.setOffset(this,a,b)});var b,c,d={top:0,left:0},e=this[0],f=e&&e.ownerDocument;if(f)return b=f.documentElement,m.contains(b,e)?(typeof e.getBoundingClientRect!==K&&(d=e.getBoundingClientRect()),c=dd(f),{top:d.top+(c.pageYOffset||b.scrollTop)-(b.clientTop||0),left:d.left+(c.pageXOffset||b.scrollLeft)-(b.clientLeft||0)}):d},position:function(){if(this[0]){var a,b,c={top:0,left:0},d=this[0];return"fixed"===m.css(d,"position")?b=d.getBoundingClientRect():(a=this.offsetParent(),b=this.offset(),m.nodeName(a[0],"html")||(c=a.offset()),c.top+=m.css(a[0],"borderTopWidth",!0),c.left+=m.css(a[0],"borderLeftWidth",!0)),{top:b.top-c.top-m.css(d,"marginTop",!0),left:b.left-c.left-m.css(d,"marginLeft",!0)}}},offsetParent:function(){return this.map(function(){var a=this.offsetParent||cd;while(a&&!m.nodeName(a,"html")&&"static"===m.css(a,"position"))a=a.offsetParent;return a||cd})}}),m.each({scrollLeft:"pageXOffset",scrollTop:"pageYOffset"},function(a,b){var c=/Y/.test(b);m.fn[a]=function(d){return V(this,function(a,d,e){var f=dd(a);return void 0===e?f?b in f?f[b]:f.document.documentElement[d]:a[d]:void(f?f.scrollTo(c?m(f).scrollLeft():e,c?e:m(f).scrollTop()):a[d]=e)},a,d,arguments.length,null)}}),m.each(["top","left"],function(a,b){m.cssHooks[b]=Lb(k.pixelPosition,function(a,c){return c?(c=Jb(a,b),Hb.test(c)?m(a).position()[b]+"px":c):void 0})}),m.each({Height:"height",Width:"width"},function(a,b){m.each({padding:"inner"+a,content:b,"":"outer"+a},function(c,d){m.fn[d]=function(d,e){var f=arguments.length&&(c||"boolean"!=typeof d),g=c||(d===!0||e===!0?"margin":"border");return V(this,function(b,c,d){var e;return m.isWindow(b)?b.document.documentElement["client"+a]:9===b.nodeType?(e=b.documentElement,Math.max(b.body["scroll"+a],e["scroll"+a],b.body["offset"+a],e["offset"+a],e["client"+a])):void 0===d?m.css(b,c,g):m.style(b,c,d,g)},b,f?d:void 0,f,null)}})}),m.fn.size=function(){return this.length},m.fn.andSelf=m.fn.addBack,"function"==typeof define&&define.amd&&define("jquery",[],function(){return m});var ed=a.jQuery,fd=a.$;return m.noConflict=function(b){return a.$===m&&(a.$=fd),b&&a.jQuery===m&&(a.jQuery=ed),m},typeof b===K&&(a.jQuery=a.$=m),m});

// Underscore.js 1.7.0
// http://underscorejs.org
// (c) 2009-2014 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
// Underscore may be freely distributed under the MIT license.
(function(){var n=this,t=n._,r=Array.prototype,e=Object.prototype,u=Function.prototype,i=r.push,a=r.slice,o=r.concat,l=e.toString,c=e.hasOwnProperty,f=Array.isArray,s=Object.keys,p=u.bind,h=function(n){return n instanceof h?n:this instanceof h?void(this._wrapped=n):new h(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=h),exports._=h):n._=h,h.VERSION="1.7.0";var g=function(n,t,r){if(t===void 0)return n;switch(null==r?3:r){case 1:return function(r){return n.call(t,r)};case 2:return function(r,e){return n.call(t,r,e)};case 3:return function(r,e,u){return n.call(t,r,e,u)};case 4:return function(r,e,u,i){return n.call(t,r,e,u,i)}}return function(){return n.apply(t,arguments)}};h.iteratee=function(n,t,r){return null==n?h.identity:h.isFunction(n)?g(n,t,r):h.isObject(n)?h.matches(n):h.property(n)},h.each=h.forEach=function(n,t,r){if(null==n)return n;t=g(t,r);var e,u=n.length;if(u===+u)for(e=0;u>e;e++)t(n[e],e,n);else{var i=h.keys(n);for(e=0,u=i.length;u>e;e++)t(n[i[e]],i[e],n)}return n},h.map=h.collect=function(n,t,r){if(null==n)return[];t=h.iteratee(t,r);for(var e,u=n.length!==+n.length&&h.keys(n),i=(u||n).length,a=Array(i),o=0;i>o;o++)e=u?u[o]:o,a[o]=t(n[e],e,n);return a};var v="Reduce of empty array with no initial value";h.reduce=h.foldl=h.inject=function(n,t,r,e){null==n&&(n=[]),t=g(t,e,4);var u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length,o=0;if(arguments.length<3){if(!a)throw new TypeError(v);r=n[i?i[o++]:o++]}for(;a>o;o++)u=i?i[o]:o,r=t(r,n[u],u,n);return r},h.reduceRight=h.foldr=function(n,t,r,e){null==n&&(n=[]),t=g(t,e,4);var u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;if(arguments.length<3){if(!a)throw new TypeError(v);r=n[i?i[--a]:--a]}for(;a--;)u=i?i[a]:a,r=t(r,n[u],u,n);return r},h.find=h.detect=function(n,t,r){var e;return t=h.iteratee(t,r),h.some(n,function(n,r,u){return t(n,r,u)?(e=n,!0):void 0}),e},h.filter=h.select=function(n,t,r){var e=[];return null==n?e:(t=h.iteratee(t,r),h.each(n,function(n,r,u){t(n,r,u)&&e.push(n)}),e)},h.reject=function(n,t,r){return h.filter(n,h.negate(h.iteratee(t)),r)},h.every=h.all=function(n,t,r){if(null==n)return!0;t=h.iteratee(t,r);var e,u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;for(e=0;a>e;e++)if(u=i?i[e]:e,!t(n[u],u,n))return!1;return!0},h.some=h.any=function(n,t,r){if(null==n)return!1;t=h.iteratee(t,r);var e,u,i=n.length!==+n.length&&h.keys(n),a=(i||n).length;for(e=0;a>e;e++)if(u=i?i[e]:e,t(n[u],u,n))return!0;return!1},h.contains=h.include=function(n,t){return null==n?!1:(n.length!==+n.length&&(n=h.values(n)),h.indexOf(n,t)>=0)},h.invoke=function(n,t){var r=a.call(arguments,2),e=h.isFunction(t);return h.map(n,function(n){return(e?t:n[t]).apply(n,r)})},h.pluck=function(n,t){return h.map(n,h.property(t))},h.where=function(n,t){return h.filter(n,h.matches(t))},h.findWhere=function(n,t){return h.find(n,h.matches(t))},h.max=function(n,t,r){var e,u,i=-1/0,a=-1/0;if(null==t&&null!=n){n=n.length===+n.length?n:h.values(n);for(var o=0,l=n.length;l>o;o++)e=n[o],e>i&&(i=e)}else t=h.iteratee(t,r),h.each(n,function(n,r,e){u=t(n,r,e),(u>a||u===-1/0&&i===-1/0)&&(i=n,a=u)});return i},h.min=function(n,t,r){var e,u,i=1/0,a=1/0;if(null==t&&null!=n){n=n.length===+n.length?n:h.values(n);for(var o=0,l=n.length;l>o;o++)e=n[o],i>e&&(i=e)}else t=h.iteratee(t,r),h.each(n,function(n,r,e){u=t(n,r,e),(a>u||1/0===u&&1/0===i)&&(i=n,a=u)});return i},h.shuffle=function(n){for(var t,r=n&&n.length===+n.length?n:h.values(n),e=r.length,u=Array(e),i=0;e>i;i++)t=h.random(0,i),t!==i&&(u[i]=u[t]),u[t]=r[i];return u},h.sample=function(n,t,r){return null==t||r?(n.length!==+n.length&&(n=h.values(n)),n[h.random(n.length-1)]):h.shuffle(n).slice(0,Math.max(0,t))},h.sortBy=function(n,t,r){return t=h.iteratee(t,r),h.pluck(h.map(n,function(n,r,e){return{value:n,index:r,criteria:t(n,r,e)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var m=function(n){return function(t,r,e){var u={};return r=h.iteratee(r,e),h.each(t,function(e,i){var a=r(e,i,t);n(u,e,a)}),u}};h.groupBy=m(function(n,t,r){h.has(n,r)?n[r].push(t):n[r]=[t]}),h.indexBy=m(function(n,t,r){n[r]=t}),h.countBy=m(function(n,t,r){h.has(n,r)?n[r]++:n[r]=1}),h.sortedIndex=function(n,t,r,e){r=h.iteratee(r,e,1);for(var u=r(t),i=0,a=n.length;a>i;){var o=i+a>>>1;r(n[o])<u?i=o+1:a=o}return i},h.toArray=function(n){return n?h.isArray(n)?a.call(n):n.length===+n.length?h.map(n,h.identity):h.values(n):[]},h.size=function(n){return null==n?0:n.length===+n.length?n.length:h.keys(n).length},h.partition=function(n,t,r){t=h.iteratee(t,r);var e=[],u=[];return h.each(n,function(n,r,i){(t(n,r,i)?e:u).push(n)}),[e,u]},h.first=h.head=h.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:0>t?[]:a.call(n,0,t)},h.initial=function(n,t,r){return a.call(n,0,Math.max(0,n.length-(null==t||r?1:t)))},h.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:a.call(n,Math.max(n.length-t,0))},h.rest=h.tail=h.drop=function(n,t,r){return a.call(n,null==t||r?1:t)},h.compact=function(n){return h.filter(n,h.identity)};var y=function(n,t,r,e){if(t&&h.every(n,h.isArray))return o.apply(e,n);for(var u=0,a=n.length;a>u;u++){var l=n[u];h.isArray(l)||h.isArguments(l)?t?i.apply(e,l):y(l,t,r,e):r||e.push(l)}return e};h.flatten=function(n,t){return y(n,t,!1,[])},h.without=function(n){return h.difference(n,a.call(arguments,1))},h.uniq=h.unique=function(n,t,r,e){if(null==n)return[];h.isBoolean(t)||(e=r,r=t,t=!1),null!=r&&(r=h.iteratee(r,e));for(var u=[],i=[],a=0,o=n.length;o>a;a++){var l=n[a];if(t)a&&i===l||u.push(l),i=l;else if(r){var c=r(l,a,n);h.indexOf(i,c)<0&&(i.push(c),u.push(l))}else h.indexOf(u,l)<0&&u.push(l)}return u},h.union=function(){return h.uniq(y(arguments,!0,!0,[]))},h.intersection=function(n){if(null==n)return[];for(var t=[],r=arguments.length,e=0,u=n.length;u>e;e++){var i=n[e];if(!h.contains(t,i)){for(var a=1;r>a&&h.contains(arguments[a],i);a++);a===r&&t.push(i)}}return t},h.difference=function(n){var t=y(a.call(arguments,1),!0,!0,[]);return h.filter(n,function(n){return!h.contains(t,n)})},h.zip=function(n){if(null==n)return[];for(var t=h.max(arguments,"length").length,r=Array(t),e=0;t>e;e++)r[e]=h.pluck(arguments,e);return r},h.object=function(n,t){if(null==n)return{};for(var r={},e=0,u=n.length;u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},h.indexOf=function(n,t,r){if(null==n)return-1;var e=0,u=n.length;if(r){if("number"!=typeof r)return e=h.sortedIndex(n,t),n[e]===t?e:-1;e=0>r?Math.max(0,u+r):r}for(;u>e;e++)if(n[e]===t)return e;return-1},h.lastIndexOf=function(n,t,r){if(null==n)return-1;var e=n.length;for("number"==typeof r&&(e=0>r?e+r+1:Math.min(e,r+1));--e>=0;)if(n[e]===t)return e;return-1},h.range=function(n,t,r){arguments.length<=1&&(t=n||0,n=0),r=r||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=Array(e),i=0;e>i;i++,n+=r)u[i]=n;return u};var d=function(){};h.bind=function(n,t){var r,e;if(p&&n.bind===p)return p.apply(n,a.call(arguments,1));if(!h.isFunction(n))throw new TypeError("Bind must be called on a function");return r=a.call(arguments,2),e=function(){if(!(this instanceof e))return n.apply(t,r.concat(a.call(arguments)));d.prototype=n.prototype;var u=new d;d.prototype=null;var i=n.apply(u,r.concat(a.call(arguments)));return h.isObject(i)?i:u}},h.partial=function(n){var t=a.call(arguments,1);return function(){for(var r=0,e=t.slice(),u=0,i=e.length;i>u;u++)e[u]===h&&(e[u]=arguments[r++]);for(;r<arguments.length;)e.push(arguments[r++]);return n.apply(this,e)}},h.bindAll=function(n){var t,r,e=arguments.length;if(1>=e)throw new Error("bindAll must be passed function names");for(t=1;e>t;t++)r=arguments[t],n[r]=h.bind(n[r],n);return n},h.memoize=function(n,t){var r=function(e){var u=r.cache,i=t?t.apply(this,arguments):e;return h.has(u,i)||(u[i]=n.apply(this,arguments)),u[i]};return r.cache={},r},h.delay=function(n,t){var r=a.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},h.defer=function(n){return h.delay.apply(h,[n,1].concat(a.call(arguments,1)))},h.throttle=function(n,t,r){var e,u,i,a=null,o=0;r||(r={});var l=function(){o=r.leading===!1?0:h.now(),a=null,i=n.apply(e,u),a||(e=u=null)};return function(){var c=h.now();o||r.leading!==!1||(o=c);var f=t-(c-o);return e=this,u=arguments,0>=f||f>t?(clearTimeout(a),a=null,o=c,i=n.apply(e,u),a||(e=u=null)):a||r.trailing===!1||(a=setTimeout(l,f)),i}},h.debounce=function(n,t,r){var e,u,i,a,o,l=function(){var c=h.now()-a;t>c&&c>0?e=setTimeout(l,t-c):(e=null,r||(o=n.apply(i,u),e||(i=u=null)))};return function(){i=this,u=arguments,a=h.now();var c=r&&!e;return e||(e=setTimeout(l,t)),c&&(o=n.apply(i,u),i=u=null),o}},h.wrap=function(n,t){return h.partial(t,n)},h.negate=function(n){return function(){return!n.apply(this,arguments)}},h.compose=function(){var n=arguments,t=n.length-1;return function(){for(var r=t,e=n[t].apply(this,arguments);r--;)e=n[r].call(this,e);return e}},h.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},h.before=function(n,t){var r;return function(){return--n>0?r=t.apply(this,arguments):t=null,r}},h.once=h.partial(h.before,2),h.keys=function(n){if(!h.isObject(n))return[];if(s)return s(n);var t=[];for(var r in n)h.has(n,r)&&t.push(r);return t},h.values=function(n){for(var t=h.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},h.pairs=function(n){for(var t=h.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},h.invert=function(n){for(var t={},r=h.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},h.functions=h.methods=function(n){var t=[];for(var r in n)h.isFunction(n[r])&&t.push(r);return t.sort()},h.extend=function(n){if(!h.isObject(n))return n;for(var t,r,e=1,u=arguments.length;u>e;e++){t=arguments[e];for(r in t)c.call(t,r)&&(n[r]=t[r])}return n},h.pick=function(n,t,r){var e,u={};if(null==n)return u;if(h.isFunction(t)){t=g(t,r);for(e in n){var i=n[e];t(i,e,n)&&(u[e]=i)}}else{var l=o.apply([],a.call(arguments,1));n=new Object(n);for(var c=0,f=l.length;f>c;c++)e=l[c],e in n&&(u[e]=n[e])}return u},h.omit=function(n,t,r){if(h.isFunction(t))t=h.negate(t);else{var e=h.map(o.apply([],a.call(arguments,1)),String);t=function(n,t){return!h.contains(e,t)}}return h.pick(n,t,r)},h.defaults=function(n){if(!h.isObject(n))return n;for(var t=1,r=arguments.length;r>t;t++){var e=arguments[t];for(var u in e)n[u]===void 0&&(n[u]=e[u])}return n},h.clone=function(n){return h.isObject(n)?h.isArray(n)?n.slice():h.extend({},n):n},h.tap=function(n,t){return t(n),n};var b=function(n,t,r,e){if(n===t)return 0!==n||1/n===1/t;if(null==n||null==t)return n===t;n instanceof h&&(n=n._wrapped),t instanceof h&&(t=t._wrapped);var u=l.call(n);if(u!==l.call(t))return!1;switch(u){case"[object RegExp]":case"[object String]":return""+n==""+t;case"[object Number]":return+n!==+n?+t!==+t:0===+n?1/+n===1/t:+n===+t;case"[object Date]":case"[object Boolean]":return+n===+t}if("object"!=typeof n||"object"!=typeof t)return!1;for(var i=r.length;i--;)if(r[i]===n)return e[i]===t;var a=n.constructor,o=t.constructor;if(a!==o&&"constructor"in n&&"constructor"in t&&!(h.isFunction(a)&&a instanceof a&&h.isFunction(o)&&o instanceof o))return!1;r.push(n),e.push(t);var c,f;if("[object Array]"===u){if(c=n.length,f=c===t.length)for(;c--&&(f=b(n[c],t[c],r,e)););}else{var s,p=h.keys(n);if(c=p.length,f=h.keys(t).length===c)for(;c--&&(s=p[c],f=h.has(t,s)&&b(n[s],t[s],r,e)););}return r.pop(),e.pop(),f};h.isEqual=function(n,t){return b(n,t,[],[])},h.isEmpty=function(n){if(null==n)return!0;if(h.isArray(n)||h.isString(n)||h.isArguments(n))return 0===n.length;for(var t in n)if(h.has(n,t))return!1;return!0},h.isElement=function(n){return!(!n||1!==n.nodeType)},h.isArray=f||function(n){return"[object Array]"===l.call(n)},h.isObject=function(n){var t=typeof n;return"function"===t||"object"===t&&!!n},h.each(["Arguments","Function","String","Number","Date","RegExp"],function(n){h["is"+n]=function(t){return l.call(t)==="[object "+n+"]"}}),h.isArguments(arguments)||(h.isArguments=function(n){return h.has(n,"callee")}),"function"!=typeof/./&&(h.isFunction=function(n){return"function"==typeof n||!1}),h.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},h.isNaN=function(n){return h.isNumber(n)&&n!==+n},h.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"===l.call(n)},h.isNull=function(n){return null===n},h.isUndefined=function(n){return n===void 0},h.has=function(n,t){return null!=n&&c.call(n,t)},h.noConflict=function(){return n._=t,this},h.identity=function(n){return n},h.constant=function(n){return function(){return n}},h.noop=function(){},h.property=function(n){return function(t){return t[n]}},h.matches=function(n){var t=h.pairs(n),r=t.length;return function(n){if(null==n)return!r;n=new Object(n);for(var e=0;r>e;e++){var u=t[e],i=u[0];if(u[1]!==n[i]||!(i in n))return!1}return!0}},h.times=function(n,t,r){var e=Array(Math.max(0,n));t=g(t,r,1);for(var u=0;n>u;u++)e[u]=t(u);return e},h.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},h.now=Date.now||function(){return(new Date).getTime()};var _={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},w=h.invert(_),j=function(n){var t=function(t){return n[t]},r="(?:"+h.keys(n).join("|")+")",e=RegExp(r),u=RegExp(r,"g");return function(n){return n=null==n?"":""+n,e.test(n)?n.replace(u,t):n}};h.escape=j(_),h.unescape=j(w),h.result=function(n,t){if(null==n)return void 0;var r=n[t];return h.isFunction(r)?n[t]():r};var x=0;h.uniqueId=function(n){var t=++x+"";return n?n+t:t},h.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var A=/(.)^/,k={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},O=/\\|'|\r|\n|\u2028|\u2029/g,F=function(n){return"\\"+k[n]};h.template=function(n,t,r){!t&&r&&(t=r),t=h.defaults({},t,h.templateSettings);var e=RegExp([(t.escape||A).source,(t.interpolate||A).source,(t.evaluate||A).source].join("|")+"|$","g"),u=0,i="__p+='";n.replace(e,function(t,r,e,a,o){return i+=n.slice(u,o).replace(O,F),u=o+t.length,r?i+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'":e?i+="'+\n((__t=("+e+"))==null?'':__t)+\n'":a&&(i+="';\n"+a+"\n__p+='"),t}),i+="';\n",t.variable||(i="with(obj||{}){\n"+i+"}\n"),i="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+i+"return __p;\n";try{var a=new Function(t.variable||"obj","_",i)}catch(o){throw o.source=i,o}var l=function(n){return a.call(this,n,h)},c=t.variable||"obj";return l.source="function("+c+"){\n"+i+"}",l},h.chain=function(n){var t=h(n);return t._chain=!0,t};var E=function(n){return this._chain?h(n).chain():n};h.mixin=function(n){h.each(h.functions(n),function(t){var r=h[t]=n[t];h.prototype[t]=function(){var n=[this._wrapped];return i.apply(n,arguments),E.call(this,r.apply(h,n))}})},h.mixin(h),h.each(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=r[n];h.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!==n&&"splice"!==n||0!==r.length||delete r[0],E.call(this,r)}}),h.each(["concat","join","slice"],function(n){var t=r[n];h.prototype[n]=function(){return E.call(this,t.apply(this._wrapped,arguments))}}),h.prototype.value=function(){return this._wrapped},"function"==typeof define&&define.amd&&define("underscore",[],function(){return h})}).call(this);
//# sourceMappingURL=underscore-min.map;
//     Backbone.js 1.0.0

//     (c) 2010-2011 Jeremy Ashkenas, DocumentCloud Inc.
//     (c) 2011-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Backbone may be freely distributed under the MIT license.
//     For all details and documentation:
//     http://backbonejs.org

(function(){

    // Initial Setup
    // -------------

    // Save a reference to the global object (`window` in the browser, `exports`
    // on the server).
    var root = this;

    // Save the previous value of the `Backbone` variable, so that it can be
    // restored later on, if `noConflict` is used.
    var previousBackbone = root.Backbone;

    // Create local references to array methods we'll want to use later.
    var array = [];
    var push = array.push;
    var slice = array.slice;
    var splice = array.splice;

    // The top-level namespace. All public Backbone classes and modules will
    // be attached to this. Exported for both the browser and the server.
    var Backbone;
    if (typeof exports !== 'undefined') {
        Backbone = exports;
    } else {
        Backbone = root.Backbone = {};
    }

    // Current version of the library. Keep in sync with `package.json`.
    Backbone.VERSION = '1.0.0';

    // Require Underscore, if we're on the server, and it's not already present.
    var _ = root._;
    if (!_ && (typeof require !== 'undefined')) _ = require('underscore');

    // For Backbone's purposes, jQuery, Zepto, Ender, or My Library (kidding) owns
    // the `$` variable.
    Backbone.$ = root.jQuery || root.Zepto || root.ender || root.$;

    // Runs Backbone.js in *noConflict* mode, returning the `Backbone` variable
    // to its previous owner. Returns a reference to this Backbone object.
    Backbone.noConflict = function() {
        root.Backbone = previousBackbone;
        return this;
    };

    // Turn on `emulateHTTP` to support legacy HTTP servers. Setting this option
    // will fake `"PATCH"`, `"PUT"` and `"DELETE"` requests via the `_method` parameter and
    // set a `X-Http-Method-Override` header.
    Backbone.emulateHTTP = false;

    // Turn on `emulateJSON` to support legacy servers that can't deal with direct
    // `application/json` requests ... will encode the body as
    // `application/x-www-form-urlencoded` instead and will send the model in a
    // form param named `model`.
    Backbone.emulateJSON = false;

    // Backbone.Events
    // ---------------

    // A module that can be mixed in to *any object* in order to provide it with
    // custom events. You may bind with `on` or remove with `off` callback
    // functions to an event; `trigger`-ing an event fires all callbacks in
    // succession.
    //
    //     var object = {};
    //     _.extend(object, Backbone.Events);
    //     object.on('expand', function(){ alert('expanded'); });
    //     object.trigger('expand');
    //
    var Events = Backbone.Events = {

        // Bind an event to a `callback` function. Passing `"all"` will bind
        // the callback to all events fired.
        on: function(name, callback, context) {
            if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
            this._events || (this._events = {});
            var events = this._events[name] || (this._events[name] = []);
            events.push({callback: callback, context: context, ctx: context || this});
            return this;
        },

        // Bind an event to only be triggered a single time. After the first time
        // the callback is invoked, it will be removed.
        once: function(name, callback, context) {
            if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
            var self = this;
            var once = _.once(function() {
                self.off(name, once);
                callback.apply(this, arguments);
            });
            once._callback = callback;
            return this.on(name, once, context);
        },

        // Remove one or many callbacks. If `context` is null, removes all
        // callbacks with that function. If `callback` is null, removes all
        // callbacks for the event. If `name` is null, removes all bound
        // callbacks for all events.
        off: function(name, callback, context) {
            var retain, ev, events, names, i, l, j, k;
            if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
            if (!name && !callback && !context) {
                this._events = {};
                return this;
            }

            names = name ? [name] : _.keys(this._events);
            for (i = 0, l = names.length; i < l; i++) {
                name = names[i];
                if (events = this._events[name]) {
                    this._events[name] = retain = [];
                    if (callback || context) {
                        for (j = 0, k = events.length; j < k; j++) {
                            ev = events[j];
                            if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                                (context && context !== ev.context)) {
                                retain.push(ev);
                            }
                        }
                    }
                    if (!retain.length) delete this._events[name];
                }
            }

            return this;
        },

        // Trigger one or many events, firing all bound callbacks. Callbacks are
        // passed the same arguments as `trigger` is, apart from the event name
        // (unless you're listening on `"all"`, which will cause your callback to
        // receive the true name of the event as the first argument).
        trigger: function(name) {
            if (!this._events) return this;
            var args = slice.call(arguments, 1);
            if (!eventsApi(this, 'trigger', name, args)) return this;
            var events = this._events[name];
            var allEvents = this._events.all;
            if (events) triggerEvents(events, args);
            if (allEvents) triggerEvents(allEvents, arguments);
            return this;
        },

        // Tell this object to stop listening to either specific events ... or
        // to every object it's currently listening to.
        stopListening: function(obj, name, callback) {
            var listeners = this._listeners;
            if (!listeners) return this;
            var deleteListener = !name && !callback;
            if (typeof name === 'object') callback = this;
            if (obj) (listeners = {})[obj._listenerId] = obj;
            for (var id in listeners) {
                listeners[id].off(name, callback, this);
                if (deleteListener) delete this._listeners[id];
            }
            return this;
        }

    };

    // Regular expression used to split event strings.
    var eventSplitter = /\s+/;

    // Implement fancy features of the Events API such as multiple event
    // names `"change blur"` and jQuery-style event maps `{change: action}`
    // in terms of the existing API.
    var eventsApi = function(obj, action, name, rest) {
        if (!name) return true;

        // Handle event maps.
        if (typeof name === 'object') {
            for (var key in name) {
                obj[action].apply(obj, [key, name[key]].concat(rest));
            }
            return false;
        }

        // Handle space separated event names.
        if (eventSplitter.test(name)) {
            var names = name.split(eventSplitter);
            for (var i = 0, l = names.length; i < l; i++) {
                obj[action].apply(obj, [names[i]].concat(rest));
            }
            return false;
        }

        return true;
    };

    // A difficult-to-believe, but optimized internal dispatch function for
    // triggering events. Tries to keep the usual cases speedy (most internal
    // Backbone events have 3 arguments).
    var triggerEvents = function(events, args) {
        var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
        switch (args.length) {
            case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
            case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
            case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
            case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
            default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
        }
    };

    var listenMethods = {listenTo: 'on', listenToOnce: 'once'};

    // Inversion-of-control versions of `on` and `once`. Tell *this* object to
    // listen to an event in another object ... keeping track of what it's
    // listening to.
    _.each(listenMethods, function(implementation, method) {
        Events[method] = function(obj, name, callback) {
            var listeners = this._listeners || (this._listeners = {});
            var id = obj._listenerId || (obj._listenerId = _.uniqueId('l'));
            listeners[id] = obj;
            if (typeof name === 'object') callback = this;
            obj[implementation](name, callback, this);
            return this;
        };
    });

    // Aliases for backwards compatibility.
    Events.bind   = Events.on;
    Events.unbind = Events.off;

    // Allow the `Backbone` object to serve as a global event bus, for folks who
    // want global "pubsub" in a convenient place.
    _.extend(Backbone, Events);

    // Backbone.Model
    // --------------

    // Backbone **Models** are the basic data object in the framework --
    // frequently representing a row in a table in a database on your server.
    // A discrete chunk of data and a bunch of useful, related methods for
    // performing computations and transformations on that data.

    // Create a new model with the specified attributes. A client id (`cid`)
    // is automatically generated and assigned for you.
    var Model = Backbone.Model = function(attributes, options) {
        var defaults;
        var attrs = attributes || {};
        options || (options = {});
        this.cid = _.uniqueId('c');
        this.attributes = {};
        if (options.collection) this.collection = options.collection;
        if (options.parse) attrs = this.parse(attrs, options) || {};
        options._attrs || (options._attrs = attrs);
        if (defaults = _.result(this, 'defaults')) {
            attrs = _.defaults({}, attrs, defaults);
        }
        this.set(attrs, options);
        this.changed = {};
        this.initialize.apply(this, arguments);
    };

    // Attach all inheritable methods to the Model prototype.
    _.extend(Model.prototype, Events, {

        // A hash of attributes whose current and previous value differ.
        changed: null,

        // The value returned during the last failed validation.
        validationError: null,

        // The default name for the JSON `id` attribute is `"id"`. MongoDB and
        // CouchDB users may want to set this to `"_id"`.
        idAttribute: 'id',

        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize: function(){},

        // Return a copy of the model's `attributes` object.
        toJSON: function(options) {
            return _.clone(this.attributes);
        },

        // Proxy `Backbone.sync` by default -- but override this if you need
        // custom syncing semantics for *this* particular model.
        sync: function() {
            return Backbone.sync.apply(this, arguments);
        },

        // Get the value of an attribute.
        get: function(attr) {
            return this.attributes[attr];
        },

        // Get the HTML-escaped value of an attribute.
        escape: function(attr) {
            return _.escape(this.get(attr));
        },

        // Returns `true` if the attribute contains a value that is not null
        // or undefined.
        has: function(attr) {
            return this.get(attr) != null;
        },

        // Set a hash of model attributes on the object, firing `"change"`. This is
        // the core primitive operation of a model, updating the data and notifying
        // anyone who needs to know about the change in state. The heart of the beast.
        set: function(key, val, options) {
            var attr, attrs, unset, changes, silent, changing, prev, current;
            if (key == null) return this;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            options || (options = {});

            // Run validation.
            if (!this._validate(attrs, options)) return false;

            // Extract attributes and options.
            unset           = options.unset;
            silent          = options.silent;
            changes         = [];
            changing        = this._changing;
            this._changing  = true;

            if (!changing) {
                this._previousAttributes = _.clone(this.attributes);
                this.changed = {};
            }
            current = this.attributes, prev = this._previousAttributes;

            // Check for changes of `id`.
            if (this.idAttribute in attrs) this.id = attrs[this.idAttribute];

            // For each `set` attribute, update or delete the current value.
            for (attr in attrs) {
                val = attrs[attr];
                if (!_.isEqual(current[attr], val)) changes.push(attr);
                if (!_.isEqual(prev[attr], val)) {
                    this.changed[attr] = val;
                } else {
                    delete this.changed[attr];
                }
                unset ? delete current[attr] : current[attr] = val;
            }

            // Trigger all relevant attribute changes.
            if (!silent) {
                if (changes.length) this._pending = true;
                for (var i = 0, l = changes.length; i < l; i++) {
                    this.trigger('change:' + changes[i], this, current[changes[i]], options);
                }
            }

            // You might be wondering why there's a `while` loop here. Changes can
            // be recursively nested within `"change"` events.
            if (changing) return this;
            if (!silent) {
                while (this._pending) {
                    this._pending = false;
                    this.trigger('change', this, options);
                }
            }
            this._pending = false;
            this._changing = false;
            return this;
        },

        // Remove an attribute from the model, firing `"change"`. `unset` is a noop
        // if the attribute doesn't exist.
        unset: function(attr, options) {
            return this.set(attr, void 0, _.extend({}, options, {unset: true}));
        },

        // Clear all attributes on the model, firing `"change"`.
        clear: function(options) {
            var attrs = {};
            for (var key in this.attributes) attrs[key] = void 0;
            return this.set(attrs, _.extend({}, options, {unset: true}));
        },

        // Determine if the model has changed since the last `"change"` event.
        // If you specify an attribute name, determine if that attribute has changed.
        hasChanged: function(attr) {
            if (attr == null) return !_.isEmpty(this.changed);
            return _.has(this.changed, attr);
        },

        // Return an object containing all the attributes that have changed, or
        // false if there are no changed attributes. Useful for determining what
        // parts of a view need to be updated and/or what attributes need to be
        // persisted to the server. Unset attributes will be set to undefined.
        // You can also pass an attributes object to diff against the model,
        // determining if there *would be* a change.
        changedAttributes: function(diff) {
            if (!diff) return this.hasChanged() ? _.clone(this.changed) : false;
            var val, changed = false;
            var old = this._changing ? this._previousAttributes : this.attributes;
            for (var attr in diff) {
                if (_.isEqual(old[attr], (val = diff[attr]))) continue;
                (changed || (changed = {}))[attr] = val;
            }
            return changed;
        },

        // Get the previous value of an attribute, recorded at the time the last
        // `"change"` event was fired.
        previous: function(attr) {
            if (attr == null || !this._previousAttributes) return null;
            return this._previousAttributes[attr];
        },

        // Get all of the attributes of the model at the time of the previous
        // `"change"` event.
        previousAttributes: function() {
            return _.clone(this._previousAttributes);
        },

        // Fetch the model from the server. If the server's representation of the
        // model differs from its current attributes, they will be overridden,
        // triggering a `"change"` event.
        fetch: function(options) {
            options = options ? _.clone(options) : {};
            if (options.parse === void 0) options.parse = true;
            var model = this;
            var success = options.success;
            options.success = function(resp) {
                if (!model.set(model.parse(resp, options), options)) return false;
                if (success) success(model, resp, options);
                model.trigger('sync', model, resp, options);
            };
            wrapError(this, options);
            return this.sync('read', this, options);
        },

        // Set a hash of model attributes, and sync the model to the server.
        // If the server returns an attributes hash that differs, the model's
        // state will be `set` again.
        save: function(key, val, options) {
            var attrs, method, xhr, attributes = this.attributes;

            // Handle both `"key", value` and `{key: value}` -style arguments.
            if (key == null || typeof key === 'object') {
                attrs = key;
                options = val;
            } else {
                (attrs = {})[key] = val;
            }

            options = _.extend({validate: true}, options);

            // If we're not waiting and attributes exist, save acts as
            // `set(attr).save(null, opts)` with validation. Otherwise, check if
            // the model will be valid when the attributes, if any, are set.
            if (attrs && !options.wait) {
                if (!this.set(attrs, options)) return false;
            } else {
                if (!this._validate(attrs, options)) return false;
            }

            // Set temporary attributes if `{wait: true}`.
            if (attrs && options.wait) {
                this.attributes = _.extend({}, attributes, attrs);
            }

            // After a successful server-side save, the client is (optionally)
            // updated with the server-side state.
            if (options.parse === void 0) options.parse = true;
            var model = this;
            var success = options.success;
            options.success = function(resp) {
                // Ensure attributes are restored during synchronous saves.
                model.attributes = attributes;
                var serverAttrs = model.parse(resp, options);
                if (options.wait) serverAttrs = _.extend(attrs || {}, serverAttrs);
                if (_.isObject(serverAttrs) && !model.set(serverAttrs, options)) {
                    return false;
                }
                if (success) success(model, resp, options);
                model.trigger('sync', model, resp, options);
            };
            wrapError(this, options);

            method = this.isNew() ? 'create' : (options.patch ? 'patch' : 'update');
            if (method === 'patch') options.attrs = attrs;
            xhr = this.sync(method, this, options);

            // Restore attributes.
            if (attrs && options.wait) this.attributes = attributes;

            return xhr;
        },

        // Destroy this model on the server if it was already persisted.
        // Optimistically removes the model from its collection, if it has one.
        // If `wait: true` is passed, waits for the server to respond before removal.
        destroy: function(options) {
            options = options ? _.clone(options) : {};
            var model = this;
            var success = options.success;

            var destroy = function() {
                model.trigger('destroy', model, model.collection, options);
            };

            options.success = function(resp) {
                if (options.wait || model.isNew()) destroy();
                if (success) success(model, resp, options);
                if (!model.isNew()) model.trigger('sync', model, resp, options);
            };

            if (this.isNew()) {
                options.success();
                return false;
            }
            wrapError(this, options);

            var xhr = this.sync('delete', this, options);
            if (!options.wait) destroy();
            return xhr;
        },

        // Default URL for the model's representation on the server -- if you're
        // using Backbone's restful methods, override this to change the endpoint
        // that will be called.
        url: function() {
            var base = _.result(this, 'urlRoot') || _.result(this.collection, 'url') || urlError();
            if (this.isNew()) return base;
            return base + (base.charAt(base.length - 1) === '/' ? '' : '/') + encodeURIComponent(this.id);
        },

        // **parse** converts a response into the hash of attributes to be `set` on
        // the model. The default implementation is just to pass the response along.
        parse: function(resp, options) {
            return resp;
        },

        // Create a new model with identical attributes to this one.
        clone: function() {
            return new this.constructor(this.attributes);
        },

        // A model is new if it has never been saved to the server, and lacks an id.
        isNew: function() {
            return this.id == null;
        },

        // Check if the model is currently in a valid state.
        isValid: function(options) {
            return this._validate({}, _.extend(options || {}, { validate: true }));
        },

        // Run validation against the next complete set of model attributes,
        // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
        _validate: function(attrs, options) {
            if (!options.validate || !this.validate) return true;
            attrs = _.extend({}, this.attributes, attrs);
            var error = this.validationError = this.validate(attrs, options) || null;
            if (!error) return true;
            this.trigger('invalid', this, error, _.extend(options, {validationError: error}));
            return false;
        }

    });

    // Underscore methods that we want to implement on the Model.
    var modelMethods = ['keys', 'values', 'pairs', 'invert', 'pick', 'omit'];

    // Mix in each Underscore method as a proxy to `Model#attributes`.
    _.each(modelMethods, function(method) {
        Model.prototype[method] = function() {
            var args = slice.call(arguments);
            args.unshift(this.attributes);
            return _[method].apply(_, args);
        };
    });

    // Backbone.Collection
    // -------------------

    // If models tend to represent a single row of data, a Backbone Collection is
    // more analagous to a table full of data ... or a small slice or page of that
    // table, or a collection of rows that belong together for a particular reason
    // -- all of the messages in this particular folder, all of the documents
    // belonging to this particular author, and so on. Collections maintain
    // indexes of their models, both in order, and for lookup by `id`.

    // Create a new **Collection**, perhaps to contain a specific type of `model`.
    // If a `comparator` is specified, the Collection will maintain
    // its models in sort order, as they're added and removed.
    var Collection = Backbone.Collection = function(models, options) {
        options || (options = {});
        if (options.model) this.model = options.model;
        if (options.comparator !== void 0) this.comparator = options.comparator;
        this._reset();
        this.initialize.apply(this, arguments);
        if (models) this.reset(models, _.extend({silent: true}, options));
    };

    // Default options for `Collection#set`.
    var setOptions = {add: true, remove: true, merge: true};
    var addOptions = {add: true, remove: false};

    // Define the Collection's inheritable methods.
    _.extend(Collection.prototype, Events, {

        // The default model for a collection is just a **Backbone.Model**.
        // This should be overridden in most cases.
        model: Model,

        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize: function(){},

        // The JSON representation of a Collection is an array of the
        // models' attributes.
        toJSON: function(options) {
            return this.map(function(model){ return model.toJSON(options); });
        },

        // Proxy `Backbone.sync` by default.
        sync: function() {
            return Backbone.sync.apply(this, arguments);
        },

        // Add a model, or list of models to the set.
        add: function(models, options) {
            return this.set(models, _.extend({merge: false}, options, addOptions));
        },

        // Remove a model, or a list of models from the set.
        remove: function(models, options) {
            models = _.isArray(models) ? models.slice() : [models];
            options || (options = {});
            var i, l, index, model;
            for (i = 0, l = models.length; i < l; i++) {
                model = this.get(models[i]);
                if (!model) continue;
                delete this._byId[model.id];
                delete this._byId[model.cid];
                index = this.indexOf(model);
                this.models.splice(index, 1);
                this.length--;
                if (!options.silent) {
                    options.index = index;
                    model.trigger('remove', model, this, options);
                }
                this._removeReference(model);
            }
            return this;
        },

        // Update a collection by `set`-ing a new list of models, adding new ones,
        // removing models that are no longer present, and merging models that
        // already exist in the collection, as necessary. Similar to **Model#set**,
        // the core operation for updating the data contained by the collection.
        set: function(models, options) {
            options = _.defaults({}, options, setOptions);
            if (options.parse) models = this.parse(models, options);
            if (!_.isArray(models)) models = models ? [models] : [];
            var i, l, model, attrs, existing, sort;
            var at = options.at;
            var sortable = this.comparator && (at == null) && options.sort !== false;
            var sortAttr = _.isString(this.comparator) ? this.comparator : null;
            var toAdd = [], toRemove = [], modelMap = {};
            var add = options.add, merge = options.merge, remove = options.remove;
            var order = !sortable && add && remove ? [] : false;

            // Turn bare objects into model references, and prevent invalid models
            // from being added.
            for (i = 0, l = models.length; i < l; i++) {
                if (!(model = this._prepareModel(attrs = models[i], options))) continue;

                // If a duplicate is found, prevent it from being added and
                // optionally merge it into the existing model.
                if (existing = this.get(model)) {
                    if (remove) modelMap[existing.cid] = true;
                    if (merge) {
                        attrs = attrs === model ? model.attributes : options._attrs;
                        existing.set(attrs, options);
                        if (sortable && !sort && existing.hasChanged(sortAttr)) sort = true;
                    }

                    // This is a new model, push it to the `toAdd` list.
                } else if (add) {
                    toAdd.push(model);

                    // Listen to added models' events, and index models for lookup by
                    // `id` and by `cid`.
                    model.on('all', this._onModelEvent, this);
                    this._byId[model.cid] = model;
                    if (model.id != null) this._byId[model.id] = model;
                }
                if (order) order.push(existing || model);
                delete options._attrs;
            }

            // Remove nonexistent models if appropriate.
            if (remove) {
                for (i = 0, l = this.length; i < l; ++i) {
                    if (!modelMap[(model = this.models[i]).cid]) toRemove.push(model);
                }
                if (toRemove.length) this.remove(toRemove, options);
            }

            // See if sorting is needed, update `length` and splice in new models.
            if (toAdd.length || (order && order.length)) {
                if (sortable) sort = true;
                this.length += toAdd.length;
                if (at != null) {
                    splice.apply(this.models, [at, 0].concat(toAdd));
                } else {
                    if (order) this.models.length = 0;
                    push.apply(this.models, order || toAdd);
                }
            }

            // Silently sort the collection if appropriate.
            if (sort) this.sort({silent: true});

            if (options.silent) return this;

            // Trigger `add` events.
            for (i = 0, l = toAdd.length; i < l; i++) {
                (model = toAdd[i]).trigger('add', model, this, options);
            }

            // Trigger `sort` if the collection was sorted.
            if (sort || (order && order.length)) this.trigger('sort', this, options);
            return this;
        },

        // When you have more items than you want to add or remove individually,
        // you can reset the entire set with a new list of models, without firing
        // any granular `add` or `remove` events. Fires `reset` when finished.
        // Useful for bulk operations and optimizations.
        reset: function(models, options) {
            options || (options = {});
            for (var i = 0, l = this.models.length; i < l; i++) {
                this._removeReference(this.models[i]);
            }
            options.previousModels = this.models;
            this._reset();
            this.add(models, _.extend({silent: true}, options));
            if (!options.silent) this.trigger('reset', this, options);
            return this;
        },

        // Add a model to the end of the collection.
        push: function(model, options) {
            model = this._prepareModel(model, options);
            this.add(model, _.extend({at: this.length}, options));
            return model;
        },

        // Remove a model from the end of the collection.
        pop: function(options) {
            var model = this.at(this.length - 1);
            this.remove(model, options);
            return model;
        },

        // Add a model to the beginning of the collection.
        unshift: function(model, options) {
            model = this._prepareModel(model, options);
            this.add(model, _.extend({at: 0}, options));
            return model;
        },

        // Remove a model from the beginning of the collection.
        shift: function(options) {
            var model = this.at(0);
            this.remove(model, options);
            return model;
        },

        // Slice out a sub-array of models from the collection.
        slice: function() {
            return slice.apply(this.models, arguments);
        },

        // Get a model from the set by id.
        get: function(obj) {
            if (obj == null) return void 0;
            return this._byId[obj.id] || this._byId[obj.cid] || this._byId[obj];
        },

        // Get the model at the given index.
        at: function(index) {
            return this.models[index];
        },

        // Return models with matching attributes. Useful for simple cases of
        // `filter`.
        where: function(attrs, first) {
            if (_.isEmpty(attrs)) return first ? void 0 : [];
            return this[first ? 'find' : 'filter'](function(model) {
                for (var key in attrs) {
                    if (attrs[key] !== model.get(key)) return false;
                }
                return true;
            });
        },

        // Return the first model with matching attributes. Useful for simple cases
        // of `find`.
        findWhere: function(attrs) {
            return this.where(attrs, true);
        },

        // Force the collection to re-sort itself. You don't need to call this under
        // normal circumstances, as the set will maintain sort order as each item
        // is added.
        sort: function(options) {
            if (!this.comparator) throw new Error('Cannot sort a set without a comparator');
            options || (options = {});

            // Run sort based on type of `comparator`.
            if (_.isString(this.comparator) || this.comparator.length === 1) {
                this.models = this.sortBy(this.comparator, this);
            } else {
                this.models.sort(_.bind(this.comparator, this));
            }

            if (!options.silent) this.trigger('sort', this, options);
            return this;
        },

        // Figure out the smallest index at which a model should be inserted so as
        // to maintain order.
        sortedIndex: function(model, value, context) {
            value || (value = this.comparator);
            var iterator = _.isFunction(value) ? value : function(model) {
                return model.get(value);
            };
            return _.sortedIndex(this.models, model, iterator, context);
        },

        // Pluck an attribute from each model in the collection.
        pluck: function(attr) {
            return _.invoke(this.models, 'get', attr);
        },

        // Fetch the default set of models for this collection, resetting the
        // collection when they arrive. If `reset: true` is passed, the response
        // data will be passed through the `reset` method instead of `set`.
        fetch: function(options) {
            options = options ? _.clone(options) : {};
            if (options.parse === void 0) options.parse = true;
            var success = options.success;
            var collection = this;
            options.success = function(resp) {
                var method = options.reset ? 'reset' : 'set';
                collection[method](resp, options);
                if (success) success(collection, resp, options);
                collection.trigger('sync', collection, resp, options);
            };
            wrapError(this, options);
            return this.sync('read', this, options);
        },

        // Create a new instance of a model in this collection. Add the model to the
        // collection immediately, unless `wait: true` is passed, in which case we
        // wait for the server to agree.
        create: function(model, options) {
            options = options ? _.clone(options) : {};
            if (!(model = this._prepareModel(model, options))) return false;
            if (!options.wait) this.add(model, options);
            var collection = this;
            var success = options.success;
            options.success = function(model, resp, options) {
                if (options.wait) collection.add(model, options);
                if (success) success(model, resp, options);
            };
            model.save(null, options);
            return model;
        },

        // **parse** converts a response into a list of models to be added to the
        // collection. The default implementation is just to pass it through.
        parse: function(resp, options) {
            return resp;
        },

        // Create a new collection with an identical list of models as this one.
        clone: function() {
            return new this.constructor(this.models);
        },

        // Private method to reset all internal state. Called when the collection
        // is first initialized or reset.
        _reset: function() {
            this.length = 0;
            this.models = [];
            this._byId  = {};
        },

        // Prepare a hash of attributes (or other model) to be added to this
        // collection.
        _prepareModel: function(attrs, options) {
            if (attrs instanceof Model) {
                if (!attrs.collection) attrs.collection = this;
                return attrs;
            }
            options || (options = {});
            options.collection = this;
            var model = new this.model(attrs, options);
            if (!model.validationError) return model;
            this.trigger('invalid', this, attrs, options);
            return false;
        },

        // Internal method to sever a model's ties to a collection.
        _removeReference: function(model) {
            if (this === model.collection) delete model.collection;
            model.off('all', this._onModelEvent, this);
        },

        // Internal method called every time a model in the set fires an event.
        // Sets need to update their indexes when models change ids. All other
        // events simply proxy through. "add" and "remove" events that originate
        // in other collections are ignored.
        _onModelEvent: function(event, model, collection, options) {
            if ((event === 'add' || event === 'remove') && collection !== this) return;
            if (event === 'destroy') this.remove(model, options);
            if (model && event === 'change:' + model.idAttribute) {
                delete this._byId[model.previous(model.idAttribute)];
                if (model.id != null) this._byId[model.id] = model;
            }
            this.trigger.apply(this, arguments);
        }

    });

    // Underscore methods that we want to implement on the Collection.
    // 90% of the core usefulness of Backbone Collections is actually implemented
    // right here:
    var methods = ['forEach', 'each', 'map', 'collect', 'reduce', 'foldl',
        'inject', 'reduceRight', 'foldr', 'find', 'detect', 'filter', 'select',
        'reject', 'every', 'all', 'some', 'any', 'include', 'contains', 'invoke',
        'max', 'min', 'toArray', 'size', 'first', 'head', 'take', 'initial', 'rest',
        'tail', 'drop', 'last', 'without', 'difference', 'indexOf', 'shuffle',
        'lastIndexOf', 'isEmpty', 'chain'];

    // Mix in each Underscore method as a proxy to `Collection#models`.
    _.each(methods, function(method) {
        Collection.prototype[method] = function() {
            var args = slice.call(arguments);
            args.unshift(this.models);
            return _[method].apply(_, args);
        };
    });

    // Underscore methods that take a property name as an argument.
    var attributeMethods = ['groupBy', 'countBy', 'sortBy'];

    // Use attributes instead of properties.
    _.each(attributeMethods, function(method) {
        Collection.prototype[method] = function(value, context) {
            var iterator = _.isFunction(value) ? value : function(model) {
                return model.get(value);
            };
            return _[method](this.models, iterator, context);
        };
    });

    // Backbone.View
    // -------------

    // Backbone Views are almost more convention than they are actual code. A View
    // is simply a JavaScript object that represents a logical chunk of UI in the
    // DOM. This might be a single item, an entire list, a sidebar or panel, or
    // even the surrounding frame which wraps your whole app. Defining a chunk of
    // UI as a **View** allows you to define your DOM events declaratively, without
    // having to worry about render order ... and makes it easy for the view to
    // react to specific changes in the state of your models.

    // Options with special meaning *(e.g. model, collection, id, className)* are
    // attached directly to the view.  See `viewOptions` for an exhaustive
    // list.

    // Creating a Backbone.View creates its initial element outside of the DOM,
    // if an existing element is not provided...
    var View = Backbone.View = function(options) {
        this.cid = _.uniqueId('view');
        options || (options = {});
        _.extend(this, _.pick(options, viewOptions));
        this._ensureElement();
        this.initialize.apply(this, arguments);
        this.delegateEvents();
    };

    // Cached regex to split keys for `delegate`.
    var delegateEventSplitter = /^(\S+)\s*(.*)$/;

    // List of view options to be merged as properties.
    var viewOptions = ['model', 'collection', 'el', 'id', 'attributes', 'className', 'tagName', 'events'];

    // Set up all inheritable **Backbone.View** properties and methods.
    _.extend(View.prototype, Events, {

        // The default `tagName` of a View's element is `"div"`.
        tagName: 'div',

        // jQuery delegate for element lookup, scoped to DOM elements within the
        // current view. This should be preferred to global lookups where possible.
        $: function(selector) {
            return this.$el.find(selector);
        },

        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize: function(){},

        // **render** is the core function that your view should override, in order
        // to populate its element (`this.el`), with the appropriate HTML. The
        // convention is for **render** to always return `this`.
        render: function() {
            return this;
        },

        // Remove this view by taking the element out of the DOM, and removing any
        // applicable Backbone.Events listeners.
        remove: function() {
            this.$el.remove();
            this.stopListening();
            return this;
        },

        // Change the view's element (`this.el` property), including event
        // re-delegation.
        setElement: function(element, delegate) {
            if (this.$el) this.undelegateEvents();
            this.$el = element instanceof Backbone.$ ? element : Backbone.$(element);
            this.el = this.$el[0];
            if (delegate !== false) this.delegateEvents();
            return this;
        },

        // Set callbacks, where `this.events` is a hash of
        //
        // *{"event selector": "callback"}*
        //
        //     {
        //       'mousedown .title':  'edit',
        //       'click .button':     'save',
        //       'click .open':       function(e) { ... }
        //     }
        //
        // pairs. Callbacks will be bound to the view, with `this` set properly.
        // Uses event delegation for efficiency.
        // Omitting the selector binds the event to `this.el`.
        // This only works for delegate-able events: not `focus`, `blur`, and
        // not `change`, `submit`, and `reset` in Internet Explorer.
        delegateEvents: function(events) {
            if (!(events || (events = _.result(this, 'events')))) return this;
            this.undelegateEvents();
            for (var key in events) {
                var method = events[key];
                if (!_.isFunction(method)) method = this[events[key]];
                if (!method) continue;

                var match = key.match(delegateEventSplitter);
                var eventName = match[1], selector = match[2];
                method = _.bind(method, this);
                eventName += '.delegateEvents' + this.cid;
                if (selector === '') {
                    this.$el.on(eventName, method);
                } else {
                    this.$el.on(eventName, selector, method);
                }
            }
            return this;
        },

        // Clears all callbacks previously bound to the view with `delegateEvents`.
        // You usually don't need to use this, but may wish to if you have multiple
        // Backbone views attached to the same DOM element.
        undelegateEvents: function() {
            this.$el.off('.delegateEvents' + this.cid);
            return this;
        },

        // Ensure that the View has a DOM element to render into.
        // If `this.el` is a string, pass it through `$()`, take the first
        // matching element, and re-assign it to `el`. Otherwise, create
        // an element from the `id`, `className` and `tagName` properties.
        _ensureElement: function() {
            if (!this.el) {
                var attrs = _.extend({}, _.result(this, 'attributes'));
                if (this.id) attrs.id = _.result(this, 'id');
                if (this.className) attrs['class'] = _.result(this, 'className');
                var $el = Backbone.$('<' + _.result(this, 'tagName') + '>').attr(attrs);
                this.setElement($el, false);
            } else {
                this.setElement(_.result(this, 'el'), false);
            }
        }

    });

    // Backbone.sync
    // -------------

    // Override this function to change the manner in which Backbone persists
    // models to the server. You will be passed the type of request, and the
    // model in question. By default, makes a RESTful Ajax request
    // to the model's `url()`. Some possible customizations could be:
    //
    // * Use `setTimeout` to batch rapid-fire updates into a single request.
    // * Send up the models as XML instead of JSON.
    // * Persist models via WebSockets instead of Ajax.
    //
    // Turn on `Backbone.emulateHTTP` in order to send `PUT` and `DELETE` requests
    // as `POST`, with a `_method` parameter containing the true HTTP method,
    // as well as all requests with the body as `application/x-www-form-urlencoded`
    // instead of `application/json` with the model in a param named `model`.
    // Useful when interfacing with server-side languages like **PHP** that make
    // it difficult to read the body of `PUT` requests.
    Backbone.sync = function(method, model, options) {
        var type = methodMap[method];

        // Default options, unless specified.
        _.defaults(options || (options = {}), {
            emulateHTTP: Backbone.emulateHTTP,
            emulateJSON: Backbone.emulateJSON
        });

        // Default JSON-request options.
        var params = {type: type, dataType: 'json'};

        // Ensure that we have a URL.
        if (!options.url) {
            params.url = _.result(model, 'url') || urlError();
        }

        // Ensure that we have the appropriate request data.
        if (options.data == null && model && (method === 'create' || method === 'update' || method === 'patch')) {
            params.contentType = 'application/json';
            params.data = JSON.stringify(options.attrs || model.toJSON(options));
        }

        // For older servers, emulate JSON by encoding the request into an HTML-form.
        if (options.emulateJSON) {
            params.contentType = 'application/x-www-form-urlencoded';
            params.data = params.data ? {model: params.data} : {};
        }

        // For older servers, emulate HTTP by mimicking the HTTP method with `_method`
        // And an `X-HTTP-Method-Override` header.
        if (options.emulateHTTP && (type === 'PUT' || type === 'DELETE' || type === 'PATCH')) {
            params.type = 'POST';
            if (options.emulateJSON) params.data._method = type;
            var beforeSend = options.beforeSend;
            options.beforeSend = function(xhr) {
                xhr.setRequestHeader('X-HTTP-Method-Override', type);
                if (beforeSend) return beforeSend.apply(this, arguments);
            };
        }

        // Don't process data on a non-GET request.
        if (params.type !== 'GET' && !options.emulateJSON) {
            params.processData = false;
        }

        // If we're sending a `PATCH` request, and we're in an old Internet Explorer
        // that still has ActiveX enabled by default, override jQuery to use that
        // for XHR instead. Remove this line when jQuery supports `PATCH` on IE8.
        if (params.type === 'PATCH' && noXhrPatch) {
            params.xhr = function() {
                return new ActiveXObject("Microsoft.XMLHTTP");
            };
        }

        // Make the request, allowing the user to override any Ajax options.
        var xhr = options.xhr = Backbone.ajax(_.extend(params, options));
        model.trigger('request', model, xhr, options);
        return xhr;
    };

    var noXhrPatch = typeof window !== 'undefined' && !!window.ActiveXObject && !(window.XMLHttpRequest && (new XMLHttpRequest).dispatchEvent);

    // Map from CRUD to HTTP for our default `Backbone.sync` implementation.
    var methodMap = {
        'create': 'POST',
        'update': 'PUT',
        'patch':  'PATCH',
        'delete': 'DELETE',
        'read':   'GET'
    };

    // Set the default implementation of `Backbone.ajax` to proxy through to `$`.
    // Override this if you'd like to use a different library.
    Backbone.ajax = function() {
        return Backbone.$.ajax.apply(Backbone.$, arguments);
    };

    // Backbone.Router
    // ---------------

    // Routers map faux-URLs to actions, and fire events when routes are
    // matched. Creating a new one sets its `routes` hash, if not set statically.
    var Router = Backbone.Router = function(options) {
        options || (options = {});
        if (options.routes) this.routes = options.routes;
        this._bindRoutes();
        this.initialize.apply(this, arguments);
    };

    // Cached regular expressions for matching named param parts and splatted
    // parts of route strings.
    var optionalParam = /\((.*?)\)/g;
    var namedParam    = /(\(\?)?:\w+/g;
    var splatParam    = /\*\w+/g;
    var escapeRegExp  = /[\-{}\[\]+?.,\\\^$|#\s]/g;

    // Set up all inheritable **Backbone.Router** properties and methods.
    _.extend(Router.prototype, Events, {

        // Initialize is an empty function by default. Override it with your own
        // initialization logic.
        initialize: function(){},

        // Manually bind a single named route to a callback. For example:
        //
        //     this.route('search/:query/p:num', 'search', function(query, num) {
        //       ...
        //     });
        //
        route: function(route, name, callback) {
            if (!_.isRegExp(route)) route = this._routeToRegExp(route);
            if (_.isFunction(name)) {
                callback = name;
                name = '';
            }
            if (!callback) callback = this[name];
            var router = this;
            Backbone.history.route(route, function(fragment) {
                var args = router._extractParameters(route, fragment);
                callback && callback.apply(router, args);
                router.trigger.apply(router, ['route:' + name].concat(args));
                router.trigger('route', name, args);
                Backbone.history.trigger('route', router, name, args);
            });
            return this;
        },

        // Simple proxy to `Backbone.history` to save a fragment into the history.
        navigate: function(fragment, options) {
            Backbone.history.navigate(fragment, options);
            return this;
        },

        // Bind all defined routes to `Backbone.history`. We have to reverse the
        // order of the routes here to support behavior where the most general
        // routes can be defined at the bottom of the route map.
        _bindRoutes: function() {
            if (!this.routes) return;
            this.routes = _.result(this, 'routes');
            var route, routes = _.keys(this.routes);
            while ((route = routes.pop()) != null) {
                this.route(route, this.routes[route]);
            }
        },

        // Convert a route string into a regular expression, suitable for matching
        // against the current location hash.
        _routeToRegExp: function(route) {
            route = route.replace(escapeRegExp, '\\$&')
                .replace(optionalParam, '(?:$1)?')
                .replace(namedParam, function(match, optional) {
                    return optional ? match : '([^\/]+)';
                })
                .replace(splatParam, '(.*?)');
            return new RegExp('^' + route + '$');
        },

        // Given a route, and a URL fragment that it matches, return the array of
        // extracted decoded parameters. Empty or unmatched parameters will be
        // treated as `null` to normalize cross-browser behavior.
        _extractParameters: function(route, fragment) {
            var params = route.exec(fragment).slice(1);
            return _.map(params, function(param) {
                return param ? decodeURIComponent(param) : null;
            });
        }

    });

    // Backbone.History
    // ----------------

    // Handles cross-browser history management, based on either
    // [pushState](http://diveintohtml5.info/history.html) and real URLs, or
    // [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
    // and URL fragments. If the browser supports neither (old IE, natch),
    // falls back to polling.
    var History = Backbone.History = function() {
        this.handlers = [];
        _.bindAll(this, 'checkUrl');

        // Ensure that `History` can be used outside of the browser.
        if (typeof window !== 'undefined') {
            this.location = window.location;
            this.history = window.history;
        }
    };

    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for detecting MSIE.
    var isExplorer = /msie [\w.]+/;

    // Cached regex for removing a trailing slash.
    var trailingSlash = /\/$/;

    // Has the history handling already been started?
    History.started = false;

    // Set up all inheritable **Backbone.History** properties and methods.
    _.extend(History.prototype, Events, {

        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        interval: 50,

        // Gets the true hash value. Cannot use location.hash directly due to bug
        // in Firefox where location.hash will always be decoded.
        getHash: function(window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },

        // Get the cross-browser normalized URL fragment, either from the URL,
        // the hash, or the override.
        getFragment: function(fragment, forcePushState) {
            if (fragment == null) {
                if (this._hasPushState || !this._wantsHashChange || forcePushState) {
                    fragment = this.location.pathname;
                    var root = this.root.replace(trailingSlash, '');
                    if (!fragment.indexOf(root)) fragment = fragment.slice(root.length);
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(routeStripper, '');
        },

        // Start the hash change handling, returning `true` if the current URL matches
        // an existing route, and `false` otherwise.
        start: function(options) {
            if (History.started) throw new Error("Backbone.history has already been started");
            History.started = true;

            // Figure out the initial configuration. Do we need an iframe?
            // Is pushState desired ... is it available?
            this.options          = _.extend({}, {root: '/'}, this.options, options);
            this.root             = this.options.root;
            this._wantsHashChange = this.options.hashChange !== false;
            this._wantsPushState  = !!this.options.pushState;
            this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
            var fragment          = this.getFragment();
            var docMode           = document.documentMode;
            var oldIE             = (isExplorer.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7));

            // Normalize root to always include a leading and trailing slash.
            this.root = ('/' + this.root + '/').replace(rootStripper, '/');

            if (oldIE && this._wantsHashChange) {
                this.iframe = Backbone.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo('body')[0].contentWindow;
                this.navigate(fragment);
            }

            // Depending on whether we're using pushState or hashes, and whether
            // 'onhashchange' is supported, determine how we check the URL state.
            if (this._hasPushState) {
                Backbone.$(window).on('popstate', this.checkUrl);
            } else if (this._wantsHashChange && ('onhashchange' in window) && !oldIE) {
                Backbone.$(window).on('hashchange', this.checkUrl);
            } else if (this._wantsHashChange) {
                this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
            }

            // Determine if we need to change the base url, for a pushState link
            // opened by a non-pushState browser.
            this.fragment = fragment;
            var loc = this.location;
            var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

            // Transition from hashChange to pushState or vice versa if both are
            // requested.
            if (this._wantsHashChange && this._wantsPushState) {

                // If we've started off with a route from a `pushState`-enabled
                // browser, but we're currently in a browser that doesn't support it...
                if (!this._hasPushState && !atRoot) {
                    this.fragment = this.getFragment(null, true);
                    this.location.replace(this.root + this.location.search + '#' + this.fragment);
                    // Return immediately as browser will do redirect to new url
                    return true;

                    // Or if we've started out with a hash-based route, but we're currently
                    // in a browser where it could be `pushState`-based instead...
                } else if (this._hasPushState && atRoot && loc.hash) {
                    this.fragment = this.getHash().replace(routeStripper, '');
                    this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
                }

            }

            if (!this.options.silent) return this.loadUrl();
        },

        // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
        // but possibly useful for unit testing Routers.
        stop: function() {
            Backbone.$(window).off('popstate', this.checkUrl).off('hashchange', this.checkUrl);
            clearInterval(this._checkUrlInterval);
            History.started = false;
        },

        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        route: function(route, callback) {
            this.handlers.unshift({route: route, callback: callback});
        },

        // Checks the current URL to see if it has changed, and if it has,
        // calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl: function(e) {
            var current = this.getFragment();
            if (current === this.fragment && this.iframe) {
                current = this.getFragment(this.getHash(this.iframe));
            }
            if (current === this.fragment) return false;
            if (this.iframe) this.navigate(current);
            this.loadUrl();
        },

        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl: function(fragmentOverride) {
            var fragment = this.fragment = this.getFragment(fragmentOverride);
            return _.any(this.handlers, function(handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
        },

        // Save a fragment into the hash history, or replace the URL state if the
        // 'replace' option is passed. You are responsible for properly URL-encoding
        // the fragment in advance.
        //
        // The options object can contain `trigger: true` if you wish to have the
        // route callback be fired (not usually desirable), or `replace: true`, if
        // you wish to modify the current URL without adding an entry to the history.
        navigate: function(fragment, options) {
            if (!History.started) return false;
            if (!options || options === true) options = {trigger: !!options};

            fragment = this.getFragment(fragment || '');
            if (this.fragment === fragment) return;
            this.fragment = fragment;

            var url = this.root + fragment;

            // Don't include a trailing slash on the root.
            if (fragment === '' && url !== '/') url = url.slice(0, -1);

            // If pushState is available, we use it to set the fragment as a real URL.
            if (this._hasPushState) {
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

                // If hash changes haven't been explicitly disabled, update the hash
                // fragment to store history.
            } else if (this._wantsHashChange) {
                this._updateHash(this.location, fragment, options.replace);
                if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
                    // Opening and closing the iframe tricks IE7 and earlier to push a
                    // history entry on hash-tag change.  When replace is true, we don't
                    // want this.
                    if(!options.replace) this.iframe.document.open().close();
                    this._updateHash(this.iframe.location, fragment, options.replace);
                }

                // If you've told us that you explicitly don't want fallback hashchange-
                // based history, then `navigate` becomes a page refresh.
            } else {
                return this.location.assign(url);
            }
            if (options.trigger) return this.loadUrl(fragment);
        },

        // Update the hash location, either replacing the current entry, or adding
        // a new one to the browser history.
        _updateHash: function(location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + '#' + fragment);
            } else {
                // Some browsers require that `hash` contains a leading #.
                location.hash = '#' + fragment;
            }
        }

    });

    // Create the default Backbone.history.
    Backbone.history = new History;

    // Helpers
    // -------

    // Helper function to correctly set up the prototype chain, for subclasses.
    // Similar to `goog.inherits`, but uses a hash of prototype properties and
    // class properties to be extended.
    var extend = function(protoProps, staticProps) {
        var parent = this;
        var child;

        // The constructor function for the new subclass is either defined by you
        // (the "constructor" property in your `extend` definition), or defaulted
        // by us to simply call the parent's constructor.
        if (protoProps && _.has(protoProps, 'constructor')) {
            child = protoProps.constructor;
        } else {
            child = function(){ return parent.apply(this, arguments); };
        }

        // Add static properties to the constructor function, if supplied.
        _.extend(child, parent, staticProps);

        // Set the prototype chain to inherit from `parent`, without calling
        // `parent`'s constructor function.
        var Surrogate = function(){ this.constructor = child; };
        Surrogate.prototype = parent.prototype;
        child.prototype = new Surrogate;

        // Add prototype properties (instance properties) to the subclass,
        // if supplied.
        if (protoProps) _.extend(child.prototype, protoProps);

        // Set a convenience property in case the parent's prototype is needed
        // later.
        child.__super__ = parent.prototype;

        return child;
    };

    // Set up inheritance for the model, collection, router, view and history.
    Model.extend = Collection.extend = Router.extend = View.extend = History.extend = extend;

    // Throw an error when a URL is needed, and none is supplied.
    var urlError = function() {
        throw new Error('A "url" property or function must be specified');
    };

    // Wrap an optional error callback with a fallback error event.
    var wrapError = function(model, options) {
        var error = options.error;
        options.error = function(resp) {
            if (error) error(model, resp, options);
            model.trigger('error', model, resp, options);
        };
    };

}).call(this);

define("backbone", ["jquery","underscore"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Backbone;
    };
}(this)));

define('main_guest_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<h2 class=\"screen__header\">Main Menu</h2><a href=\"#login\" class=\"btn screen__main__btn\">Login</a><br/><a href=\"#registration\" class=\"btn screen__main__btn\">Registration</a>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('main_user_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<h2 class=\"screen__header\">Main Menu</h2><a href=\"#scoreboard\" class=\"btn screen__main__btn\">Score Board</a><br/><a href=\"#game\" class=\"btn screen__main__btn\">Start Game</a>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('user_model',[
	// Libs
	'backbone'
], function(Backbone) {
	var UserModel = Backbone.Model.extend({
		defaults: {
			id: 0,
			login: "Guest",
			email: "Guest",
			score: 0
		},
		url: "/get_user",
		isLogin: function() {
			return (this.id > 0);
		},
		resetModel: function() {
			this.set({"id":0,"email":"Guest","score":0,"login":"Guest"});
		},
		initialize: function() {
			this.fetch();
		}
	});
	return UserModel;
});
define('main_view',[
	// Libs
	'jquery',
	'backbone',
	// Tmpl
	'main_guest_tmpl',
	'main_user_tmpl',
	// Models
	'user_model'
], function($, Backbone, main_guest_tmpl, main_user_tmpl, UserModel) {
	var MainView = Backbone.View.extend({
		template_user: main_user_tmpl,
		template_guest: main_guest_tmpl,
		el: $('.screen__main'),
		render: function() {
			if( this.model.isLogin() ) {
				this.$el.html(this.template_user());
			}
			else {
				this.$el.html(this.template_guest());
			}
		},
		show: function() {
			this.trigger("showView",[ this ]);
			this.$el.delay(200).fadeIn(200);
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		}
	});
	return MainView;
});
define('alert_view',[
	// Libs
	'jquery',
	'backbone',
	'underscore'
], function($, Backbone, _) {
	var AlertView = Backbone.View.extend({
		template: _.template("<label><%= message %></label>"),
		el: $('.screen__alert'),
		render: function(message) {
			this.$el.html(this.template({"message":message}));
		},
		show: function(message) {
			this.render(message);
			this.$el.slideDown().delay(message.length * 150).slideUp();
		}
	})
	return AlertView;
});
/*! jQuery Validation Plugin - v1.13.0 - 7/1/2014
 * http://jqueryvalidation.org/
 * Copyright (c) 2014 Jörn Zaefferer; Licensed MIT */
!function(a){"function"==typeof define&&define.amd?define('jquery.validate',["jquery"],a):a(jQuery)}(function(a){a.extend(a.fn,{validate:function(b){if(!this.length)return void(b&&b.debug&&window.console&&console.warn("Nothing selected, can't validate, returning nothing."));var c=a.data(this[0],"validator");return c?c:(this.attr("novalidate","novalidate"),c=new a.validator(b,this[0]),a.data(this[0],"validator",c),c.settings.onsubmit&&(this.validateDelegate(":submit","click",function(b){c.settings.submitHandler&&(c.submitButton=b.target),a(b.target).hasClass("cancel")&&(c.cancelSubmit=!0),void 0!==a(b.target).attr("formnovalidate")&&(c.cancelSubmit=!0)}),this.submit(function(b){function d(){var d;return c.settings.submitHandler?(c.submitButton&&(d=a("<input type='hidden'/>").attr("name",c.submitButton.name).val(a(c.submitButton).val()).appendTo(c.currentForm)),c.settings.submitHandler.call(c,c.currentForm,b),c.submitButton&&d.remove(),!1):!0}return c.settings.debug&&b.preventDefault(),c.cancelSubmit?(c.cancelSubmit=!1,d()):c.form()?c.pendingRequest?(c.formSubmitted=!0,!1):d():(c.focusInvalid(),!1)})),c)},valid:function(){var b,c;return a(this[0]).is("form")?b=this.validate().form():(b=!0,c=a(this[0].form).validate(),this.each(function(){b=c.element(this)&&b})),b},removeAttrs:function(b){var c={},d=this;return a.each(b.split(/\s/),function(a,b){c[b]=d.attr(b),d.removeAttr(b)}),c},rules:function(b,c){var d,e,f,g,h,i,j=this[0];if(b)switch(d=a.data(j.form,"validator").settings,e=d.rules,f=a.validator.staticRules(j),b){case"add":a.extend(f,a.validator.normalizeRule(c)),delete f.messages,e[j.name]=f,c.messages&&(d.messages[j.name]=a.extend(d.messages[j.name],c.messages));break;case"remove":return c?(i={},a.each(c.split(/\s/),function(b,c){i[c]=f[c],delete f[c],"required"===c&&a(j).removeAttr("aria-required")}),i):(delete e[j.name],f)}return g=a.validator.normalizeRules(a.extend({},a.validator.classRules(j),a.validator.attributeRules(j),a.validator.dataRules(j),a.validator.staticRules(j)),j),g.required&&(h=g.required,delete g.required,g=a.extend({required:h},g),a(j).attr("aria-required","true")),g.remote&&(h=g.remote,delete g.remote,g=a.extend(g,{remote:h})),g}}),a.extend(a.expr[":"],{blank:function(b){return!a.trim(""+a(b).val())},filled:function(b){return!!a.trim(""+a(b).val())},unchecked:function(b){return!a(b).prop("checked")}}),a.validator=function(b,c){this.settings=a.extend(!0,{},a.validator.defaults,b),this.currentForm=c,this.init()},a.validator.format=function(b,c){return 1===arguments.length?function(){var c=a.makeArray(arguments);return c.unshift(b),a.validator.format.apply(this,c)}:(arguments.length>2&&c.constructor!==Array&&(c=a.makeArray(arguments).slice(1)),c.constructor!==Array&&(c=[c]),a.each(c,function(a,c){b=b.replace(new RegExp("\\{"+a+"\\}","g"),function(){return c})}),b)},a.extend(a.validator,{defaults:{messages:{},groups:{},rules:{},errorClass:"error",validClass:"valid",errorElement:"label",focusInvalid:!0,errorContainer:a([]),errorLabelContainer:a([]),onsubmit:!0,ignore:":hidden",ignoreTitle:!1,onfocusin:function(a){this.lastActive=a,this.settings.focusCleanup&&!this.blockFocusCleanup&&(this.settings.unhighlight&&this.settings.unhighlight.call(this,a,this.settings.errorClass,this.settings.validClass),this.hideThese(this.errorsFor(a)))},onfocusout:function(a){this.checkable(a)||!(a.name in this.submitted)&&this.optional(a)||this.element(a)},onkeyup:function(a,b){(9!==b.which||""!==this.elementValue(a))&&(a.name in this.submitted||a===this.lastElement)&&this.element(a)},onclick:function(a){a.name in this.submitted?this.element(a):a.parentNode.name in this.submitted&&this.element(a.parentNode)},highlight:function(b,c,d){"radio"===b.type?this.findByName(b.name).addClass(c).removeClass(d):a(b).addClass(c).removeClass(d)},unhighlight:function(b,c,d){"radio"===b.type?this.findByName(b.name).removeClass(c).addClass(d):a(b).removeClass(c).addClass(d)}},setDefaults:function(b){a.extend(a.validator.defaults,b)},messages:{required:"This field is required.",remote:"Please fix this field.",email:"Please enter a valid email address.",url:"Please enter a valid URL.",date:"Please enter a valid date.",dateISO:"Please enter a valid date ( ISO ).",number:"Please enter a valid number.",digits:"Please enter only digits.",creditcard:"Please enter a valid credit card number.",equalTo:"Please enter the same value again.",maxlength:a.validator.format("Please enter no more than {0} characters."),minlength:a.validator.format("Please enter at least {0} characters."),rangelength:a.validator.format("Please enter a value between {0} and {1} characters long."),range:a.validator.format("Please enter a value between {0} and {1}."),max:a.validator.format("Please enter a value less than or equal to {0}."),min:a.validator.format("Please enter a value greater than or equal to {0}.")},autoCreateRanges:!1,prototype:{init:function(){function b(b){var c=a.data(this[0].form,"validator"),d="on"+b.type.replace(/^validate/,""),e=c.settings;e[d]&&!this.is(e.ignore)&&e[d].call(c,this[0],b)}this.labelContainer=a(this.settings.errorLabelContainer),this.errorContext=this.labelContainer.length&&this.labelContainer||a(this.currentForm),this.containers=a(this.settings.errorContainer).add(this.settings.errorLabelContainer),this.submitted={},this.valueCache={},this.pendingRequest=0,this.pending={},this.invalid={},this.reset();var c,d=this.groups={};a.each(this.settings.groups,function(b,c){"string"==typeof c&&(c=c.split(/\s/)),a.each(c,function(a,c){d[c]=b})}),c=this.settings.rules,a.each(c,function(b,d){c[b]=a.validator.normalizeRule(d)}),a(this.currentForm).validateDelegate(":text, [type='password'], [type='file'], select, textarea, [type='number'], [type='search'] ,[type='tel'], [type='url'], [type='email'], [type='datetime'], [type='date'], [type='month'], [type='week'], [type='time'], [type='datetime-local'], [type='range'], [type='color'], [type='radio'], [type='checkbox']","focusin focusout keyup",b).validateDelegate("select, option, [type='radio'], [type='checkbox']","click",b),this.settings.invalidHandler&&a(this.currentForm).bind("invalid-form.validate",this.settings.invalidHandler),a(this.currentForm).find("[required], [data-rule-required], .required").attr("aria-required","true")},form:function(){return this.checkForm(),a.extend(this.submitted,this.errorMap),this.invalid=a.extend({},this.errorMap),this.valid()||a(this.currentForm).triggerHandler("invalid-form",[this]),this.showErrors(),this.valid()},checkForm:function(){this.prepareForm();for(var a=0,b=this.currentElements=this.elements();b[a];a++)this.check(b[a]);return this.valid()},element:function(b){var c=this.clean(b),d=this.validationTargetFor(c),e=!0;return this.lastElement=d,void 0===d?delete this.invalid[c.name]:(this.prepareElement(d),this.currentElements=a(d),e=this.check(d)!==!1,e?delete this.invalid[d.name]:this.invalid[d.name]=!0),a(b).attr("aria-invalid",!e),this.numberOfInvalids()||(this.toHide=this.toHide.add(this.containers)),this.showErrors(),e},showErrors:function(b){if(b){a.extend(this.errorMap,b),this.errorList=[];for(var c in b)this.errorList.push({message:b[c],element:this.findByName(c)[0]});this.successList=a.grep(this.successList,function(a){return!(a.name in b)})}this.settings.showErrors?this.settings.showErrors.call(this,this.errorMap,this.errorList):this.defaultShowErrors()},resetForm:function(){a.fn.resetForm&&a(this.currentForm).resetForm(),this.submitted={},this.lastElement=null,this.prepareForm(),this.hideErrors(),this.elements().removeClass(this.settings.errorClass).removeData("previousValue").removeAttr("aria-invalid")},numberOfInvalids:function(){return this.objectLength(this.invalid)},objectLength:function(a){var b,c=0;for(b in a)c++;return c},hideErrors:function(){this.hideThese(this.toHide)},hideThese:function(a){a.not(this.containers).text(""),this.addWrapper(a).hide()},valid:function(){return 0===this.size()},size:function(){return this.errorList.length},focusInvalid:function(){if(this.settings.focusInvalid)try{a(this.findLastActive()||this.errorList.length&&this.errorList[0].element||[]).filter(":visible").focus().trigger("focusin")}catch(b){}},findLastActive:function(){var b=this.lastActive;return b&&1===a.grep(this.errorList,function(a){return a.element.name===b.name}).length&&b},elements:function(){var b=this,c={};return a(this.currentForm).find("input, select, textarea").not(":submit, :reset, :image, [disabled]").not(this.settings.ignore).filter(function(){return!this.name&&b.settings.debug&&window.console&&console.error("%o has no name assigned",this),this.name in c||!b.objectLength(a(this).rules())?!1:(c[this.name]=!0,!0)})},clean:function(b){return a(b)[0]},errors:function(){var b=this.settings.errorClass.split(" ").join(".");return a(this.settings.errorElement+"."+b,this.errorContext)},reset:function(){this.successList=[],this.errorList=[],this.errorMap={},this.toShow=a([]),this.toHide=a([]),this.currentElements=a([])},prepareForm:function(){this.reset(),this.toHide=this.errors().add(this.containers)},prepareElement:function(a){this.reset(),this.toHide=this.errorsFor(a)},elementValue:function(b){var c,d=a(b),e=b.type;return"radio"===e||"checkbox"===e?a("input[name='"+b.name+"']:checked").val():"number"===e&&"undefined"!=typeof b.validity?b.validity.badInput?!1:d.val():(c=d.val(),"string"==typeof c?c.replace(/\r/g,""):c)},check:function(b){b=this.validationTargetFor(this.clean(b));var c,d,e,f=a(b).rules(),g=a.map(f,function(a,b){return b}).length,h=!1,i=this.elementValue(b);for(d in f){e={method:d,parameters:f[d]};try{if(c=a.validator.methods[d].call(this,i,b,e.parameters),"dependency-mismatch"===c&&1===g){h=!0;continue}if(h=!1,"pending"===c)return void(this.toHide=this.toHide.not(this.errorsFor(b)));if(!c)return this.formatAndAdd(b,e),!1}catch(j){throw this.settings.debug&&window.console&&console.log("Exception occurred when checking element "+b.id+", check the '"+e.method+"' method.",j),j}}if(!h)return this.objectLength(f)&&this.successList.push(b),!0},customDataMessage:function(b,c){return a(b).data("msg"+c.charAt(0).toUpperCase()+c.substring(1).toLowerCase())||a(b).data("msg")},customMessage:function(a,b){var c=this.settings.messages[a];return c&&(c.constructor===String?c:c[b])},findDefined:function(){for(var a=0;a<arguments.length;a++)if(void 0!==arguments[a])return arguments[a];return void 0},defaultMessage:function(b,c){return this.findDefined(this.customMessage(b.name,c),this.customDataMessage(b,c),!this.settings.ignoreTitle&&b.title||void 0,a.validator.messages[c],"<strong>Warning: No message defined for "+b.name+"</strong>")},formatAndAdd:function(b,c){var d=this.defaultMessage(b,c.method),e=/\$?\{(\d+)\}/g;"function"==typeof d?d=d.call(this,c.parameters,b):e.test(d)&&(d=a.validator.format(d.replace(e,"{$1}"),c.parameters)),this.errorList.push({message:d,element:b,method:c.method}),this.errorMap[b.name]=d,this.submitted[b.name]=d},addWrapper:function(a){return this.settings.wrapper&&(a=a.add(a.parent(this.settings.wrapper))),a},defaultShowErrors:function(){var a,b,c;for(a=0;this.errorList[a];a++)c=this.errorList[a],this.settings.highlight&&this.settings.highlight.call(this,c.element,this.settings.errorClass,this.settings.validClass),this.showLabel(c.element,c.message);if(this.errorList.length&&(this.toShow=this.toShow.add(this.containers)),this.settings.success)for(a=0;this.successList[a];a++)this.showLabel(this.successList[a]);if(this.settings.unhighlight)for(a=0,b=this.validElements();b[a];a++)this.settings.unhighlight.call(this,b[a],this.settings.errorClass,this.settings.validClass);this.toHide=this.toHide.not(this.toShow),this.hideErrors(),this.addWrapper(this.toShow).show()},validElements:function(){return this.currentElements.not(this.invalidElements())},invalidElements:function(){return a(this.errorList).map(function(){return this.element})},showLabel:function(b,c){var d,e,f,g=this.errorsFor(b),h=this.idOrName(b),i=a(b).attr("aria-describedby");g.length?(g.removeClass(this.settings.validClass).addClass(this.settings.errorClass),g.html(c)):(g=a("<"+this.settings.errorElement+">").attr("id",h+"-error").addClass(this.settings.errorClass).html(c||""),d=g,this.settings.wrapper&&(d=g.hide().show().wrap("<"+this.settings.wrapper+"/>").parent()),this.labelContainer.length?this.labelContainer.append(d):this.settings.errorPlacement?this.settings.errorPlacement(d,a(b)):d.insertAfter(b),g.is("label")?g.attr("for",h):0===g.parents("label[for='"+h+"']").length&&(f=g.attr("id"),i?i.match(new RegExp("\b"+f+"\b"))||(i+=" "+f):i=f,a(b).attr("aria-describedby",i),e=this.groups[b.name],e&&a.each(this.groups,function(b,c){c===e&&a("[name='"+b+"']",this.currentForm).attr("aria-describedby",g.attr("id"))}))),!c&&this.settings.success&&(g.text(""),"string"==typeof this.settings.success?g.addClass(this.settings.success):this.settings.success(g,b)),this.toShow=this.toShow.add(g)},errorsFor:function(b){var c=this.idOrName(b),d=a(b).attr("aria-describedby"),e="label[for='"+c+"'], label[for='"+c+"'] *";return d&&(e=e+", #"+d.replace(/\s+/g,", #")),this.errors().filter(e)},idOrName:function(a){return this.groups[a.name]||(this.checkable(a)?a.name:a.id||a.name)},validationTargetFor:function(a){return this.checkable(a)&&(a=this.findByName(a.name).not(this.settings.ignore)[0]),a},checkable:function(a){return/radio|checkbox/i.test(a.type)},findByName:function(b){return a(this.currentForm).find("[name='"+b+"']")},getLength:function(b,c){switch(c.nodeName.toLowerCase()){case"select":return a("option:selected",c).length;case"input":if(this.checkable(c))return this.findByName(c.name).filter(":checked").length}return b.length},depend:function(a,b){return this.dependTypes[typeof a]?this.dependTypes[typeof a](a,b):!0},dependTypes:{"boolean":function(a){return a},string:function(b,c){return!!a(b,c.form).length},"function":function(a,b){return a(b)}},optional:function(b){var c=this.elementValue(b);return!a.validator.methods.required.call(this,c,b)&&"dependency-mismatch"},startRequest:function(a){this.pending[a.name]||(this.pendingRequest++,this.pending[a.name]=!0)},stopRequest:function(b,c){this.pendingRequest--,this.pendingRequest<0&&(this.pendingRequest=0),delete this.pending[b.name],c&&0===this.pendingRequest&&this.formSubmitted&&this.form()?(a(this.currentForm).submit(),this.formSubmitted=!1):!c&&0===this.pendingRequest&&this.formSubmitted&&(a(this.currentForm).triggerHandler("invalid-form",[this]),this.formSubmitted=!1)},previousValue:function(b){return a.data(b,"previousValue")||a.data(b,"previousValue",{old:null,valid:!0,message:this.defaultMessage(b,"remote")})}},classRuleSettings:{required:{required:!0},email:{email:!0},url:{url:!0},date:{date:!0},dateISO:{dateISO:!0},number:{number:!0},digits:{digits:!0},creditcard:{creditcard:!0}},addClassRules:function(b,c){b.constructor===String?this.classRuleSettings[b]=c:a.extend(this.classRuleSettings,b)},classRules:function(b){var c={},d=a(b).attr("class");return d&&a.each(d.split(" "),function(){this in a.validator.classRuleSettings&&a.extend(c,a.validator.classRuleSettings[this])}),c},attributeRules:function(b){var c,d,e={},f=a(b),g=b.getAttribute("type");for(c in a.validator.methods)"required"===c?(d=b.getAttribute(c),""===d&&(d=!0),d=!!d):d=f.attr(c),/min|max/.test(c)&&(null===g||/number|range|text/.test(g))&&(d=Number(d)),d||0===d?e[c]=d:g===c&&"range"!==g&&(e[c]=!0);return e.maxlength&&/-1|2147483647|524288/.test(e.maxlength)&&delete e.maxlength,e},dataRules:function(b){var c,d,e={},f=a(b);for(c in a.validator.methods)d=f.data("rule"+c.charAt(0).toUpperCase()+c.substring(1).toLowerCase()),void 0!==d&&(e[c]=d);return e},staticRules:function(b){var c={},d=a.data(b.form,"validator");return d.settings.rules&&(c=a.validator.normalizeRule(d.settings.rules[b.name])||{}),c},normalizeRules:function(b,c){return a.each(b,function(d,e){if(e===!1)return void delete b[d];if(e.param||e.depends){var f=!0;switch(typeof e.depends){case"string":f=!!a(e.depends,c.form).length;break;case"function":f=e.depends.call(c,c)}f?b[d]=void 0!==e.param?e.param:!0:delete b[d]}}),a.each(b,function(d,e){b[d]=a.isFunction(e)?e(c):e}),a.each(["minlength","maxlength"],function(){b[this]&&(b[this]=Number(b[this]))}),a.each(["rangelength","range"],function(){var c;b[this]&&(a.isArray(b[this])?b[this]=[Number(b[this][0]),Number(b[this][1])]:"string"==typeof b[this]&&(c=b[this].replace(/[\[\]]/g,"").split(/[\s,]+/),b[this]=[Number(c[0]),Number(c[1])]))}),a.validator.autoCreateRanges&&(b.min&&b.max&&(b.range=[b.min,b.max],delete b.min,delete b.max),b.minlength&&b.maxlength&&(b.rangelength=[b.minlength,b.maxlength],delete b.minlength,delete b.maxlength)),b},normalizeRule:function(b){if("string"==typeof b){var c={};a.each(b.split(/\s/),function(){c[this]=!0}),b=c}return b},addMethod:function(b,c,d){a.validator.methods[b]=c,a.validator.messages[b]=void 0!==d?d:a.validator.messages[b],c.length<3&&a.validator.addClassRules(b,a.validator.normalizeRule(b))},methods:{required:function(b,c,d){if(!this.depend(d,c))return"dependency-mismatch";if("select"===c.nodeName.toLowerCase()){var e=a(c).val();return e&&e.length>0}return this.checkable(c)?this.getLength(b,c)>0:a.trim(b).length>0},email:function(a,b){return this.optional(b)||/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/.test(a)},url:function(a,b){return this.optional(b)||/^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(a)},date:function(a,b){return this.optional(b)||!/Invalid|NaN/.test(new Date(a).toString())},dateISO:function(a,b){return this.optional(b)||/^\d{4}[\/\-](0?[1-9]|1[012])[\/\-](0?[1-9]|[12][0-9]|3[01])$/.test(a)},number:function(a,b){return this.optional(b)||/^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(a)},digits:function(a,b){return this.optional(b)||/^\d+$/.test(a)},creditcard:function(a,b){if(this.optional(b))return"dependency-mismatch";if(/[^0-9 \-]+/.test(a))return!1;var c,d,e=0,f=0,g=!1;if(a=a.replace(/\D/g,""),a.length<13||a.length>19)return!1;for(c=a.length-1;c>=0;c--)d=a.charAt(c),f=parseInt(d,10),g&&(f*=2)>9&&(f-=9),e+=f,g=!g;return e%10===0},minlength:function(b,c,d){var e=a.isArray(b)?b.length:this.getLength(a.trim(b),c);return this.optional(c)||e>=d},maxlength:function(b,c,d){var e=a.isArray(b)?b.length:this.getLength(a.trim(b),c);return this.optional(c)||d>=e},rangelength:function(b,c,d){var e=a.isArray(b)?b.length:this.getLength(a.trim(b),c);return this.optional(c)||e>=d[0]&&e<=d[1]},min:function(a,b,c){return this.optional(b)||a>=c},max:function(a,b,c){return this.optional(b)||c>=a},range:function(a,b,c){return this.optional(b)||a>=c[0]&&a<=c[1]},equalTo:function(b,c,d){var e=a(d);return this.settings.onfocusout&&e.unbind(".validate-equalTo").bind("blur.validate-equalTo",function(){a(c).valid()}),b===e.val()},remote:function(b,c,d){if(this.optional(c))return"dependency-mismatch";var e,f,g=this.previousValue(c);return this.settings.messages[c.name]||(this.settings.messages[c.name]={}),g.originalMessage=this.settings.messages[c.name].remote,this.settings.messages[c.name].remote=g.message,d="string"==typeof d&&{url:d}||d,g.old===b?g.valid:(g.old=b,e=this,this.startRequest(c),f={},f[c.name]=b,a.ajax(a.extend(!0,{url:d,mode:"abort",port:"validate"+c.name,dataType:"json",data:f,context:e.currentForm,success:function(d){var f,h,i,j=d===!0||"true"===d;e.settings.messages[c.name].remote=g.originalMessage,j?(i=e.formSubmitted,e.prepareElement(c),e.formSubmitted=i,e.successList.push(c),delete e.invalid[c.name],e.showErrors()):(f={},h=d||e.defaultMessage(c,"remote"),f[c.name]=g.message=a.isFunction(h)?h(b):h,e.invalid[c.name]=!0,e.showErrors(f)),g.valid=j,e.stopRequest(c,j)}},d)),"pending")}}}),a.format=function(){throw"$.format has been deprecated. Please use $.validator.format instead."};var b,c={};a.ajaxPrefilter?a.ajaxPrefilter(function(a,b,d){var e=a.port;"abort"===a.mode&&(c[e]&&c[e].abort(),c[e]=d)}):(b=a.ajax,a.ajax=function(d){var e=("mode"in d?d:a.ajaxSettings).mode,f=("port"in d?d:a.ajaxSettings).port;return"abort"===e?(c[f]&&c[f].abort(),c[f]=b.apply(this,arguments),c[f]):b.apply(this,arguments)}),a.extend(a.fn,{validateDelegate:function(b,c,d){return this.bind(c,function(c){var e=a(c.target);return e.is(b)?d.apply(e,arguments):void 0})}})});
define('validate',[
	// Libs
	'jquery',
	// Views
	'alert_view',
	'jquery.validate'
], function($, AlertView) {
	return function(form,model) {
		$(form).validate({
			rules: {
				login: {
					required: true
				},
				email: {
					required: true,
					email: true
				},
				password: {
					required: true
				}
			},
			messages: {
				login: {
					required: "We need your login"
				},
				email: {
					required: "We need your Email",
					email: "Email must be the next format: name@domain.ru"
				},
				password: {
					required: "We need your password"
				}
			},
			validClass: "valid",
			errorClass: "invalid",
			wrapper: "div",
			errorElement: "label",
			submitHandler: function() {
				var data = {};
		        $.each($(form)[0].elements, function(field_count, field){
		            data[$(field).attr("name")] = $(field).val();
		            delete data["undefined"];
		        });
		        $.ajax({
		            url: $(form).attr('action'),
		            data: JSON.stringify(data),
		            type: $(form).attr('method'),
		            beforeSend: function() {
		                $(form).find('input[type=submit]').prop('disabled',true);
		                this.alert = new AlertView();
		            },
		            success: function(response) {
		            	model.set({"id":response["id"],"email":response["email"],"score":response["score"],"login":response["login"]})
		                this.alert.show('Success');
		                window.location.hash = "";
		            },
		            error: function(response) {
		            	$.each($(form)[0].elements, function(field_count, field){
				            if(($(field).attr("name") == "password") || ($(field).attr("name") == "email")) {
				            	$(field).val('');
				            }
				        });
		                this.alert.show(response.responseJSON["message"]);
		            },
		            complete: function() {
		                $(form).find('input[type=submit]').prop('disabled',false);
		            }
		        });
			}
		});
	};
});
define('login_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<h2 class=\"screen__header\">Login</h2><form method=\"post\" action=\"\/login\" class=\"screen__login__form\"><input type=\"text\" name=\"email\" id=\"email\" placeholder=\"Email\" class=\"screen__login__form__input\"/><br/><input type=\"password\" name=\"password\" id=\"password\" placeholder=\"Password\" class=\"screen__login__form__input\"/><br/><input type=\"submit\" value=\"Login\" class=\"screen__login__form__btn\"/><br/></form>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('login_view',[
	// Libs
	'jquery',
	'backbone',
	'validate',
	// Tmpl
	'login_tmpl',
	// Models
	'user_model',
], function($, Backbone, validate, login_tmpl, UserModel) {
	var LoginView = Backbone.View.extend({
		template: login_tmpl,
		el: $('.screen__login'),
		render: function() {
			this.$el.html(this.template());
		},
		show: function() {
			if( !this.model.isLogin() ) {
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
				validate($('.screen__login__form'),this.model);
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		}
	});
	return LoginView;
});
define('registration_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<h2 class=\"screen__header\">Registration</h2><form method=\"post\" action=\"\/registration\" class=\"screen__registration__form\"><input type=\"text\" name=\"login\" id=\"login\" placeholder=\"Login\" class=\"screen__registration__form__input\"/><br/><input type=\"text\" name=\"email\" id=\"email\" placeholder=\"Email\" class=\"screen__registration__form__input\"/><br/><input type=\"password\" name=\"password\" id=\"password\" placeholder=\"Password\" class=\"screen__registration__form__input\"/><br/><input type=\"submit\" value=\"Register\" class=\"screen__registration__form__btn\"/><br/></form>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('registration_view',[
	// Libs
	'jquery',
	'backbone',
	'validate',
	// Tmpl
	'registration_tmpl',
	// Models
	'user_model',
], function($, Backbone, validate, registration_tmpl, UserModel) {
	var RegistrationView = Backbone.View.extend({
		template: registration_tmpl,
		el: $('.screen__registration'),
		render: function() {
			this.$el.html(this.template());
		},
		show: function() {
			if( !this.model.isLogin() ) {
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
				validate($('.screen__registration__form'),this.model);
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		}
	});
	return RegistrationView;
});
define('game_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<div id=\"hello\"><p>Hello,");try{__fest_buf+=(__fest_escapeHTML(json.login))}catch(e){__fest_log_error(e.message + "3");}__fest_buf+=("!</p></div><div id=\"token\"><p><span id=\"token\"></span></p></div><div id=\"wait\"><p>Prepare yourself. Wait for enemy!</p></div><div id=\"gameplay\" style=\"display: none\"><div id=\"score\"><p><span id=\"myName\">");try{__fest_buf+=(__fest_escapeHTML(json.login))}catch(e){__fest_log_error(e.message + "16");}__fest_buf+=("</span>:<span id=\"myScore\">0</span></p><p><span id=\"enemyName\"></span>:<span id=\"enemyScore\">0</span></p></div></div><div id=\"gameOver\" style=\"display: none\"><p>Game over! You are<span id=\"win\"></span></p></div><div class=\"screen__canvas\"><canvas id=\"myCanvas\" width=\"368\" height=\"212\" style=\"background-color: #eee\">Your browser does not support the HTML5 canvas tag.</canvas></div>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
/**
 * @fileoverview gl-matrix - High performance matrix and vector operations
 * @author Brandon Jones
 * @author Colin MacKenzie IV
 * @version 2.2.0
 */

/* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

 Redistribution and use in source and binary forms, with or without modification,
 are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this
 list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
 ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */



    
    var glMatrix = {};
    var mat4 = {};
    var vec4 = {};
    var vec3 = {};
    var vec2 = {};
    var shim = {};
    vec4.fromXYZ = function(xyz, w) {
    var out = new Array(4);
    out[0] = xyz.x;
    out[1] = xyz.y;
    out[2] = xyz.z;
    out[3] = w;
    return out;
};
    if (typeof(exports) === 'undefined') {
        if(typeof define == 'function' && typeof define.amd == 'object' && define.amd) {
            shim.exports = {};
            define('gl.matrix',[],function() {
                return shim.exports;
            });
        } else {
            // gl-matrix lives in a browser, define its namespaces in global
            shim.exports = typeof(window) !== 'undefined' ? window : _global;
        }
    }
    else {
        // gl-matrix lives in commonjs, define its namespaces in exports
        shim.exports = exports;
    }

    (function(exports) {
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */


        if(!GLMAT_EPSILON) {
            var GLMAT_EPSILON = 0.000001;
        }

        if(!GLMAT_ARRAY_TYPE) {
            var GLMAT_ARRAY_TYPE = (typeof Float32Array !== 'undefined') ? Float32Array : Array;
        }

        if(!GLMAT_RANDOM) {
            var GLMAT_RANDOM = Math.random;
        }

        /**
         * @class Common utilities
         * @name glMatrix
         */


        /**
         * Sets the type of array used when creating new vectors and matricies
         *
         * @param {Type} type Array type, such as Float32Array or Array
         */
        glMatrix.setMatrixArrayType = function(type) {
            GLMAT_ARRAY_TYPE = type;
        }

        if(typeof(exports) !== 'undefined') {
            exports.glMatrix = glMatrix;
        }

        var degree = Math.PI / 180;

        /**
         * Convert Degree To Radian
         *
         * @param {Number} Angle in Degrees
         */
        glMatrix.toRadian = function(a){
            return a * degree;
        }
        ;
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

        /**
         * @class 2 Dimensional Vector
         * @name vec2
         */



        /**
         * Creates a new, empty vec2
         *
         * @returns {vec2} a new 2D vector
         */
        vec2.create = function() {
            var out = new GLMAT_ARRAY_TYPE(2);
            out[0] = 0;
            out[1] = 0;
            return out;
        };

        /**
         * Creates a new vec2 initialized with values from an existing vector
         *
         * @param {vec2} a vector to clone
         * @returns {vec2} a new 2D vector
         */
        vec2.clone = function(a) {
            var out = new GLMAT_ARRAY_TYPE(2);
            out[0] = a[0];
            out[1] = a[1];
            return out;
        };

        /**
         * Creates a new vec2 initialized with the given values
         *
         * @param {Number} x X component
         * @param {Number} y Y component
         * @returns {vec2} a new 2D vector
         */
        vec2.fromValues = function(x, y) {
            var out = new GLMAT_ARRAY_TYPE(2);
            out[0] = x;
            out[1] = y;
            return out;
        };

        /**
         * Copy the values from one vec2 to another
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the source vector
         * @returns {vec2} out
         */
        vec2.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            return out;
        };

        /**
         * Set the components of a vec2 to the given values
         *
         * @param {vec2} out the receiving vector
         * @param {Number} x X component
         * @param {Number} y Y component
         * @returns {vec2} out
         */
        vec2.set = function(out, x, y) {
            out[0] = x;
            out[1] = y;
            return out;
        };

        /**
         * Adds two vec2's
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {vec2} out
         */
        vec2.add = function(out, a, b) {
            out[0] = a[0] + b[0];
            out[1] = a[1] + b[1];
            return out;
        };

        /**
         * Subtracts vector b from vector a
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {vec2} out
         */
        vec2.subtract = function(out, a, b) {
            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            return out;
        };

        /**
         * Alias for {@link vec2.subtract}
         * @function
         */
        vec2.sub = vec2.subtract;

        /**
         * Multiplies two vec2's
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {vec2} out
         */
        vec2.multiply = function(out, a, b) {
            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];
            return out;
        };

        /**
         * Alias for {@link vec2.multiply}
         * @function
         */
        vec2.mul = vec2.multiply;

        /**
         * Divides two vec2's
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {vec2} out
         */
        vec2.divide = function(out, a, b) {
            out[0] = a[0] / b[0];
            out[1] = a[1] / b[1];
            return out;
        };

        /**
         * Alias for {@link vec2.divide}
         * @function
         */
        vec2.div = vec2.divide;

        /**
         * Returns the minimum of two vec2's
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {vec2} out
         */
        vec2.min = function(out, a, b) {
            out[0] = Math.min(a[0], b[0]);
            out[1] = Math.min(a[1], b[1]);
            return out;
        };

        /**
         * Returns the maximum of two vec2's
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {vec2} out
         */
        vec2.max = function(out, a, b) {
            out[0] = Math.max(a[0], b[0]);
            out[1] = Math.max(a[1], b[1]);
            return out;
        };

        /**
         * Scales a vec2 by a scalar number
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the vector to scale
         * @param {Number} b amount to scale the vector by
         * @returns {vec2} out
         */
        vec2.scale = function(out, a, b) {
            out[0] = a[0] * b;
            out[1] = a[1] * b;
            return out;
        };

        /**
         * Adds two vec2's after scaling the second operand by a scalar value
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @param {Number} scale the amount to scale b by before adding
         * @returns {vec2} out
         */
        vec2.scaleAndAdd = function(out, a, b, scale) {
            out[0] = a[0] + (b[0] * scale);
            out[1] = a[1] + (b[1] * scale);
            return out;
        };

        /**
         * Calculates the euclidian distance between two vec2's
         *
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {Number} distance between a and b
         */
        vec2.distance = function(a, b) {
            var x = b[0] - a[0],
                y = b[1] - a[1];
            return Math.sqrt(x*x + y*y);
        };

        /**
         * Alias for {@link vec2.distance}
         * @function
         */
        vec2.dist = vec2.distance;

        /**
         * Calculates the squared euclidian distance between two vec2's
         *
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {Number} squared distance between a and b
         */
        vec2.squaredDistance = function(a, b) {
            var x = b[0] - a[0],
                y = b[1] - a[1];
            return x*x + y*y;
        };

        /**
         * Alias for {@link vec2.squaredDistance}
         * @function
         */
        vec2.sqrDist = vec2.squaredDistance;

        /**
         * Calculates the length of a vec2
         *
         * @param {vec2} a vector to calculate length of
         * @returns {Number} length of a
         */
        vec2.length = function (a) {
            var x = a[0],
                y = a[1];
            return Math.sqrt(x*x + y*y);
        };

        /**
         * Alias for {@link vec2.length}
         * @function
         */
        vec2.len = vec2.length;

        /**
         * Calculates the squared length of a vec2
         *
         * @param {vec2} a vector to calculate squared length of
         * @returns {Number} squared length of a
         */
        vec2.squaredLength = function (a) {
            var x = a[0],
                y = a[1];
            return x*x + y*y;
        };

        /**
         * Alias for {@link vec2.squaredLength}
         * @function
         */
        vec2.sqrLen = vec2.squaredLength;

        /**
         * Negates the components of a vec2
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a vector to negate
         * @returns {vec2} out
         */
        vec2.negate = function(out, a) {
            out[0] = -a[0];
            out[1] = -a[1];
            return out;
        };

        /**
         * Normalize a vec2
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a vector to normalize
         * @returns {vec2} out
         */
        vec2.normalize = function(out, a) {
            var x = a[0],
                y = a[1];
            var len = x*x + y*y;
            if (len > 0) {
                //TODO: evaluate use of glm_invsqrt here?
                len = 1 / Math.sqrt(len);
                out[0] = a[0] * len;
                out[1] = a[1] * len;
            }
            return out;
        };

        /**
         * Calculates the dot product of two vec2's
         *
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {Number} dot product of a and b
         */
        vec2.dot = function (a, b) {
            return a[0] * b[0] + a[1] * b[1];
        };

        /**
         * Computes the cross product of two vec2's
         * Note that the cross product must by definition produce a 3D vector
         *
         * @param {vec3} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @returns {vec3} out
         */
        vec2.cross = function(out, a, b) {
            var z = a[0] * b[1] - a[1] * b[0];
            out[0] = out[1] = 0;
            out[2] = z;
            return out;
        };

        /**
         * Performs a linear interpolation between two vec2's
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the first operand
         * @param {vec2} b the second operand
         * @param {Number} t interpolation amount between the two inputs
         * @returns {vec2} out
         */
        vec2.lerp = function (out, a, b, t) {
            var ax = a[0],
                ay = a[1];
            out[0] = ax + t * (b[0] - ax);
            out[1] = ay + t * (b[1] - ay);
            return out;
        };

        /**
         * Generates a random vector with the given scale
         *
         * @param {vec2} out the receiving vector
         * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
         * @returns {vec2} out
         */
        vec2.random = function (out, scale) {
            scale = scale || 1.0;
            var r = GLMAT_RANDOM() * 2.0 * Math.PI;
            out[0] = Math.cos(r) * scale;
            out[1] = Math.sin(r) * scale;
            return out;
        };

        /**
         * Transforms the vec2 with a mat2
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the vector to transform
         * @param {mat2} m matrix to transform with
         * @returns {vec2} out
         */
        vec2.transformMat2 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = m[0] * x + m[2] * y;
            out[1] = m[1] * x + m[3] * y;
            return out;
        };

        /**
         * Transforms the vec2 with a mat2d
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the vector to transform
         * @param {mat2d} m matrix to transform with
         * @returns {vec2} out
         */
        vec2.transformMat2d = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = m[0] * x + m[2] * y + m[4];
            out[1] = m[1] * x + m[3] * y + m[5];
            return out;
        };

        /**
         * Transforms the vec2 with a mat3
         * 3rd vector component is implicitly '1'
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the vector to transform
         * @param {mat3} m matrix to transform with
         * @returns {vec2} out
         */
        vec2.transformMat3 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = m[0] * x + m[3] * y + m[6];
            out[1] = m[1] * x + m[4] * y + m[7];
            return out;
        };

        /**
         * Transforms the vec2 with a mat4
         * 3rd vector component is implicitly '0'
         * 4th vector component is implicitly '1'
         *
         * @param {vec2} out the receiving vector
         * @param {vec2} a the vector to transform
         * @param {mat4} m matrix to transform with
         * @returns {vec2} out
         */
        vec2.transformMat4 = function(out, a, m) {
            var x = a[0],
                y = a[1];
            out[0] = m[0] * x + m[4] * y + m[12];
            out[1] = m[1] * x + m[5] * y + m[13];
            return out;
        };

        /**
         * Perform some operation over an array of vec2s.
         *
         * @param {Array} a the array of vectors to iterate over
         * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
         * @param {Number} offset Number of elements to skip at the beginning of the array
         * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
         * @param {Function} fn Function to call for each vector in the array
         * @param {Object} [arg] additional argument to pass to fn
         * @returns {Array} a
         * @function
         */
        vec2.forEach = (function() {
            var vec = vec2.create();

            return function(a, stride, offset, count, fn, arg) {
                var i, l;
                if(!stride) {
                    stride = 2;
                }

                if(!offset) {
                    offset = 0;
                }

                if(count) {
                    l = Math.min((count * stride) + offset, a.length);
                } else {
                    l = a.length;
                }

                for(i = offset; i < l; i += stride) {
                    vec[0] = a[i]; vec[1] = a[i+1];
                    fn(vec, vec, arg);
                    a[i] = vec[0]; a[i+1] = vec[1];
                }

                return a;
            };
        })();

        /**
         * Returns a string representation of a vector
         *
         * @param {vec2} vec vector to represent as a string
         * @returns {String} string representation of the vector
         */
        vec2.str = function (a) {
            return 'vec2(' + a[0] + ', ' + a[1] + ')';
        };

        if(typeof(exports) !== 'undefined') {
            exports.vec2 = vec2;
        }
        ;
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

        /**
         * @class 3 Dimensional Vector
         * @name vec3
         */



        /**
         * Creates a new, empty vec3
         *
         * @returns {vec3} a new 3D vector
         */
        vec3.create = function() {
            var out = new GLMAT_ARRAY_TYPE(3);
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            return out;
        };

        /**
         * Creates a new vec3 initialized with values from an existing vector
         *
         * @param {vec3} a vector to clone
         * @returns {vec3} a new 3D vector
         */
        vec3.clone = function(a) {
            var out = new GLMAT_ARRAY_TYPE(3);
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            return out;
        };

        /**
         * Creates a new vec3 initialized with the given values
         *
         * @param {Number} x X component
         * @param {Number} y Y component
         * @param {Number} z Z component
         * @returns {vec3} a new 3D vector
         */
        vec3.fromValues = function(x, y, z) {
            var out = new GLMAT_ARRAY_TYPE(3);
            out[0] = x;
            out[1] = y;
            out[2] = z;
            return out;
        };

        /**
         * Copy the values from one vec3 to another
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the source vector
         * @returns {vec3} out
         */
        vec3.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            return out;
        };

        /**
         * Set the components of a vec3 to the given values
         *
         * @param {vec3} out the receiving vector
         * @param {Number} x X component
         * @param {Number} y Y component
         * @param {Number} z Z component
         * @returns {vec3} out
         */
        vec3.set = function(out, x, y, z) {
            out[0] = x;
            out[1] = y;
            out[2] = z;
            return out;
        };

        /**
         * Adds two vec3's
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {vec3} out
         */
        vec3.add = function(out, a, b) {
            out[0] = a[0] + b[0];
            out[1] = a[1] + b[1];
            out[2] = a[2] + b[2];
            return out;
        };

        /**
         * Subtracts vector b from vector a
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {vec3} out
         */
        vec3.subtract = function(out, a, b) {
            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            out[2] = a[2] - b[2];
            return out;
        };

        /**
         * Alias for {@link vec3.subtract}
         * @function
         */
        vec3.sub = vec3.subtract;

        /**
         * Multiplies two vec3's
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {vec3} out
         */
        vec3.multiply = function(out, a, b) {
            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];
            out[2] = a[2] * b[2];
            return out;
        };

        /**
         * Alias for {@link vec3.multiply}
         * @function
         */
        vec3.mul = vec3.multiply;

        /**
         * Divides two vec3's
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {vec3} out
         */
        vec3.divide = function(out, a, b) {
            out[0] = a[0] / b[0];
            out[1] = a[1] / b[1];
            out[2] = a[2] / b[2];
            return out;
        };

        /**
         * Alias for {@link vec3.divide}
         * @function
         */
        vec3.div = vec3.divide;

        /**
         * Returns the minimum of two vec3's
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {vec3} out
         */
        vec3.min = function(out, a, b) {
            out[0] = Math.min(a[0], b[0]);
            out[1] = Math.min(a[1], b[1]);
            out[2] = Math.min(a[2], b[2]);
            return out;
        };

        /**
         * Returns the maximum of two vec3's
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {vec3} out
         */
        vec3.max = function(out, a, b) {
            out[0] = Math.max(a[0], b[0]);
            out[1] = Math.max(a[1], b[1]);
            out[2] = Math.max(a[2], b[2]);
            return out;
        };

        /**
         * Scales a vec3 by a scalar number
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the vector to scale
         * @param {Number} b amount to scale the vector by
         * @returns {vec3} out
         */
        vec3.scale = function(out, a, b) {
            out[0] = a[0] * b;
            out[1] = a[1] * b;
            out[2] = a[2] * b;
            return out;
        };

        /**
         * Adds two vec3's after scaling the second operand by a scalar value
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @param {Number} scale the amount to scale b by before adding
         * @returns {vec3} out
         */
        vec3.scaleAndAdd = function(out, a, b, scale) {
            out[0] = a[0] + (b[0] * scale);
            out[1] = a[1] + (b[1] * scale);
            out[2] = a[2] + (b[2] * scale);
            return out;
        };

        /**
         * Calculates the euclidian distance between two vec3's
         *
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {Number} distance between a and b
         */
        vec3.distance = function(a, b) {
            var x = b[0] - a[0],
                y = b[1] - a[1],
                z = b[2] - a[2];
            return Math.sqrt(x*x + y*y + z*z);
        };

        /**
         * Alias for {@link vec3.distance}
         * @function
         */
        vec3.dist = vec3.distance;

        /**
         * Calculates the squared euclidian distance between two vec3's
         *
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {Number} squared distance between a and b
         */
        vec3.squaredDistance = function(a, b) {
            var x = b[0] - a[0],
                y = b[1] - a[1],
                z = b[2] - a[2];
            return x*x + y*y + z*z;
        };

        /**
         * Alias for {@link vec3.squaredDistance}
         * @function
         */
        vec3.sqrDist = vec3.squaredDistance;

        /**
         * Calculates the length of a vec3
         *
         * @param {vec3} a vector to calculate length of
         * @returns {Number} length of a
         */
        vec3.length = function (a) {
            var x = a[0],
                y = a[1],
                z = a[2];
            return Math.sqrt(x*x + y*y + z*z);
        };

        /**
         * Alias for {@link vec3.length}
         * @function
         */
        vec3.len = vec3.length;

        /**
         * Calculates the squared length of a vec3
         *
         * @param {vec3} a vector to calculate squared length of
         * @returns {Number} squared length of a
         */
        vec3.squaredLength = function (a) {
            var x = a[0],
                y = a[1],
                z = a[2];
            return x*x + y*y + z*z;
        };

        /**
         * Alias for {@link vec3.squaredLength}
         * @function
         */
        vec3.sqrLen = vec3.squaredLength;

        /**
         * Negates the components of a vec3
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a vector to negate
         * @returns {vec3} out
         */
        vec3.negate = function(out, a) {
            out[0] = -a[0];
            out[1] = -a[1];
            out[2] = -a[2];
            return out;
        };

        /**
         * Normalize a vec3
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a vector to normalize
         * @returns {vec3} out
         */
        vec3.normalize = function(out, a) {
            var x = a[0],
                y = a[1],
                z = a[2];
            var len = x*x + y*y + z*z;
            if (len > 0) {
                //TODO: evaluate use of glm_invsqrt here?
                len = 1 / Math.sqrt(len);
                out[0] = a[0] * len;
                out[1] = a[1] * len;
                out[2] = a[2] * len;
            }
            return out;
        };

        /**
         * Calculates the dot product of two vec3's
         *
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {Number} dot product of a and b
         */
        vec3.dot = function (a, b) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
        };

        /**
         * Computes the cross product of two vec3's
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @returns {vec3} out
         */
        vec3.cross = function(out, a, b) {
            var ax = a[0], ay = a[1], az = a[2],
                bx = b[0], by = b[1], bz = b[2];

            out[0] = ay * bz - az * by;
            out[1] = az * bx - ax * bz;
            out[2] = ax * by - ay * bx;
            return out;
        };

        /**
         * Performs a linear interpolation between two vec3's
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the first operand
         * @param {vec3} b the second operand
         * @param {Number} t interpolation amount between the two inputs
         * @returns {vec3} out
         */
        vec3.lerp = function (out, a, b, t) {
            var ax = a[0],
                ay = a[1],
                az = a[2];
            out[0] = ax + t * (b[0] - ax);
            out[1] = ay + t * (b[1] - ay);
            out[2] = az + t * (b[2] - az);
            return out;
        };

        /**
         * Generates a random vector with the given scale
         *
         * @param {vec3} out the receiving vector
         * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
         * @returns {vec3} out
         */
        vec3.random = function (out, scale) {
            scale = scale || 1.0;

            var r = GLMAT_RANDOM() * 2.0 * Math.PI;
            var z = (GLMAT_RANDOM() * 2.0) - 1.0;
            var zScale = Math.sqrt(1.0-z*z) * scale;

            out[0] = Math.cos(r) * zScale;
            out[1] = Math.sin(r) * zScale;
            out[2] = z * scale;
            return out;
        };

        /**
         * Transforms the vec3 with a mat4.
         * 4th vector component is implicitly '1'
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the vector to transform
         * @param {mat4} m matrix to transform with
         * @returns {vec3} out
         */
        vec3.transformMat4 = function(out, a, m) {
            var x = a[0], y = a[1], z = a[2];
            out[0] = m[0] * x + m[4] * y + m[8] * z + m[12];
            out[1] = m[1] * x + m[5] * y + m[9] * z + m[13];
            out[2] = m[2] * x + m[6] * y + m[10] * z + m[14];
            return out;
        };

        /**
         * Transforms the vec3 with a mat3.
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the vector to transform
         * @param {mat4} m the 3x3 matrix to transform with
         * @returns {vec3} out
         */
        vec3.transformMat3 = function(out, a, m) {
            var x = a[0], y = a[1], z = a[2];
            out[0] = x * m[0] + y * m[3] + z * m[6];
            out[1] = x * m[1] + y * m[4] + z * m[7];
            out[2] = x * m[2] + y * m[5] + z * m[8];
            return out;
        };

        /**
         * Transforms the vec3 with a quat
         *
         * @param {vec3} out the receiving vector
         * @param {vec3} a the vector to transform
         * @param {quat} q quaternion to transform with
         * @returns {vec3} out
         */
        vec3.transformQuat = function(out, a, q) {
            // benchmarks: http://jsperf.com/quaternion-transform-vec3-implementations

            var x = a[0], y = a[1], z = a[2],
                qx = q[0], qy = q[1], qz = q[2], qw = q[3],

            // calculate quat * vec
                ix = qw * x + qy * z - qz * y,
                iy = qw * y + qz * x - qx * z,
                iz = qw * z + qx * y - qy * x,
                iw = -qx * x - qy * y - qz * z;

            // calculate result * inverse quat
            out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return out;
        };

        /**
         * Perform some operation over an array of vec3s.
         *
         * @param {Array} a the array of vectors to iterate over
         * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
         * @param {Number} offset Number of elements to skip at the beginning of the array
         * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
         * @param {Function} fn Function to call for each vector in the array
         * @param {Object} [arg] additional argument to pass to fn
         * @returns {Array} a
         * @function
         */
        vec3.forEach = (function() {
            var vec = vec3.create();

            return function(a, stride, offset, count, fn, arg) {
                var i, l;
                if(!stride) {
                    stride = 3;
                }

                if(!offset) {
                    offset = 0;
                }

                if(count) {
                    l = Math.min((count * stride) + offset, a.length);
                } else {
                    l = a.length;
                }

                for(i = offset; i < l; i += stride) {
                    vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2];
                    fn(vec, vec, arg);
                    a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2];
                }

                return a;
            };
        })();

        /**
         * Returns a string representation of a vector
         *
         * @param {vec3} vec vector to represent as a string
         * @returns {String} string representation of the vector
         */
        vec3.str = function (a) {
            return 'vec3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ')';
        };

        if(typeof(exports) !== 'undefined') {
            exports.vec3 = vec3;
        }
        ;
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

        /**
         * @class 4 Dimensional Vector
         * @name vec4
         */



        /**
         * Creates a new, empty vec4
         *
         * @returns {vec4} a new 4D vector
         */
        vec4.create = function() {
            var out = new GLMAT_ARRAY_TYPE(4);
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            return out;
        };

        /**
         * Creates a new vec4 initialized with values from an existing vector
         *
         * @param {vec4} a vector to clone
         * @returns {vec4} a new 4D vector
         */
        vec4.clone = function(a) {
            var out = new GLMAT_ARRAY_TYPE(4);
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            return out;
        };

        /**
         * Creates a new vec4 initialized with the given values
         *
         * @param {Number} x X component
         * @param {Number} y Y component
         * @param {Number} z Z component
         * @param {Number} w W component
         * @returns {vec4} a new 4D vector
         */
        vec4.fromValues = function(x, y, z, w) {
            var out = new GLMAT_ARRAY_TYPE(4);
            out[0] = x;
            out[1] = y;
            out[2] = z;
            out[3] = w;
            return out;
        };

        /**
         * Copy the values from one vec4 to another
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the source vector
         * @returns {vec4} out
         */
        vec4.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            return out;
        };

        /**
         * Set the components of a vec4 to the given values
         *
         * @param {vec4} out the receiving vector
         * @param {Number} x X component
         * @param {Number} y Y component
         * @param {Number} z Z component
         * @param {Number} w W component
         * @returns {vec4} out
         */
        vec4.set = function(out, x, y, z, w) {
            out[0] = x;
            out[1] = y;
            out[2] = z;
            out[3] = w;
            return out;
        };

        /**
         * Adds two vec4's
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {vec4} out
         */
        vec4.add = function(out, a, b) {
            out[0] = a[0] + b[0];
            out[1] = a[1] + b[1];
            out[2] = a[2] + b[2];
            out[3] = a[3] + b[3];
            return out;
        };

        /**
         * Subtracts vector b from vector a
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {vec4} out
         */
        vec4.subtract = function(out, a, b) {
            out[0] = a[0] - b[0];
            out[1] = a[1] - b[1];
            out[2] = a[2] - b[2];
            out[3] = a[3] - b[3];
            return out;
        };

        /**
         * Alias for {@link vec4.subtract}
         * @function
         */
        vec4.sub = vec4.subtract;

        /**
         * Multiplies two vec4's
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {vec4} out
         */
        vec4.multiply = function(out, a, b) {
            out[0] = a[0] * b[0];
            out[1] = a[1] * b[1];
            out[2] = a[2] * b[2];
            out[3] = a[3] * b[3];
            return out;
        };

        /**
         * Alias for {@link vec4.multiply}
         * @function
         */
        vec4.mul = vec4.multiply;

        /**
         * Divides two vec4's
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {vec4} out
         */
        vec4.divide = function(out, a, b) {
            out[0] = a[0] / b[0];
            out[1] = a[1] / b[1];
            out[2] = a[2] / b[2];
            out[3] = a[3] / b[3];
            return out;
        };

        /**
         * Alias for {@link vec4.divide}
         * @function
         */
        vec4.div = vec4.divide;

        /**
         * Returns the minimum of two vec4's
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {vec4} out
         */
        vec4.min = function(out, a, b) {
            out[0] = Math.min(a[0], b[0]);
            out[1] = Math.min(a[1], b[1]);
            out[2] = Math.min(a[2], b[2]);
            out[3] = Math.min(a[3], b[3]);
            return out;
        };

        /**
         * Returns the maximum of two vec4's
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {vec4} out
         */
        vec4.max = function(out, a, b) {
            out[0] = Math.max(a[0], b[0]);
            out[1] = Math.max(a[1], b[1]);
            out[2] = Math.max(a[2], b[2]);
            out[3] = Math.max(a[3], b[3]);
            return out;
        };

        /**
         * Scales a vec4 by a scalar number
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the vector to scale
         * @param {Number} b amount to scale the vector by
         * @returns {vec4} out
         */
        vec4.scale = function(out, a, b) {
            out[0] = a[0] * b;
            out[1] = a[1] * b;
            out[2] = a[2] * b;
            out[3] = a[3] * b;
            return out;
        };

        /**
         * Adds two vec4's after scaling the second operand by a scalar value
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @param {Number} scale the amount to scale b by before adding
         * @returns {vec4} out
         */
        vec4.scaleAndAdd = function(out, a, b, scale) {
            out[0] = a[0] + (b[0] * scale);
            out[1] = a[1] + (b[1] * scale);
            out[2] = a[2] + (b[2] * scale);
            out[3] = a[3] + (b[3] * scale);
            return out;
        };

        /**
         * Calculates the euclidian distance between two vec4's
         *
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {Number} distance between a and b
         */
        vec4.distance = function(a, b) {
            var x = b[0] - a[0],
                y = b[1] - a[1],
                z = b[2] - a[2],
                w = b[3] - a[3];
            return Math.sqrt(x*x + y*y + z*z + w*w);
        };

        /**
         * Alias for {@link vec4.distance}
         * @function
         */
        vec4.dist = vec4.distance;

        /**
         * Calculates the squared euclidian distance between two vec4's
         *
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {Number} squared distance between a and b
         */
        vec4.squaredDistance = function(a, b) {
            var x = b[0] - a[0],
                y = b[1] - a[1],
                z = b[2] - a[2],
                w = b[3] - a[3];
            return x*x + y*y + z*z + w*w;
        };

        /**
         * Alias for {@link vec4.squaredDistance}
         * @function
         */
        vec4.sqrDist = vec4.squaredDistance;

        /**
         * Calculates the length of a vec4
         *
         * @param {vec4} a vector to calculate length of
         * @returns {Number} length of a
         */
        vec4.length = function (a) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3];
            return Math.sqrt(x*x + y*y + z*z + w*w);
        };

        /**
         * Alias for {@link vec4.length}
         * @function
         */
        vec4.len = vec4.length;

        /**
         * Calculates the squared length of a vec4
         *
         * @param {vec4} a vector to calculate squared length of
         * @returns {Number} squared length of a
         */
        vec4.squaredLength = function (a) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3];
            return x*x + y*y + z*z + w*w;
        };

        /**
         * Alias for {@link vec4.squaredLength}
         * @function
         */
        vec4.sqrLen = vec4.squaredLength;

        /**
         * Negates the components of a vec4
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a vector to negate
         * @returns {vec4} out
         */
        vec4.negate = function(out, a) {
            out[0] = -a[0];
            out[1] = -a[1];
            out[2] = -a[2];
            out[3] = -a[3];
            return out;
        };

        /**
         * Normalize a vec4
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a vector to normalize
         * @returns {vec4} out
         */
        vec4.normalize = function(out, a) {
            var x = a[0],
                y = a[1],
                z = a[2],
                w = a[3];
            var len = x*x + y*y + z*z + w*w;
            if (len > 0) {
                len = 1 / Math.sqrt(len);
                out[0] = a[0] * len;
                out[1] = a[1] * len;
                out[2] = a[2] * len;
                out[3] = a[3] * len;
            }
            return out;
        };

        /**
         * Calculates the dot product of two vec4's
         *
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @returns {Number} dot product of a and b
         */
        vec4.dot = function (a, b) {
            return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
        };

        /**
         * Performs a linear interpolation between two vec4's
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the first operand
         * @param {vec4} b the second operand
         * @param {Number} t interpolation amount between the two inputs
         * @returns {vec4} out
         */
        vec4.lerp = function (out, a, b, t) {
            var ax = a[0],
                ay = a[1],
                az = a[2],
                aw = a[3];
            out[0] = ax + t * (b[0] - ax);
            out[1] = ay + t * (b[1] - ay);
            out[2] = az + t * (b[2] - az);
            out[3] = aw + t * (b[3] - aw);
            return out;
        };

        /**
         * Generates a random vector with the given scale
         *
         * @param {vec4} out the receiving vector
         * @param {Number} [scale] Length of the resulting vector. If ommitted, a unit vector will be returned
         * @returns {vec4} out
         */
        vec4.random = function (out, scale) {
            scale = scale || 1.0;

            //TODO: This is a pretty awful way of doing this. Find something better.
            out[0] = GLMAT_RANDOM();
            out[1] = GLMAT_RANDOM();
            out[2] = GLMAT_RANDOM();
            out[3] = GLMAT_RANDOM();
            vec4.normalize(out, out);
            vec4.scale(out, out, scale);
            return out;
        };

        /**
         * Transforms the vec4 with a mat4.
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the vector to transform
         * @param {mat4} m matrix to transform with
         * @returns {vec4} out
         */
        vec4.transformMat4 = function(out, a, m) {
            var x = a[0], y = a[1], z = a[2], w = a[3];
            out[0] = m[0] * x + m[4] * y + m[8] * z + m[12] * w;
            out[1] = m[1] * x + m[5] * y + m[9] * z + m[13] * w;
            out[2] = m[2] * x + m[6] * y + m[10] * z + m[14] * w;
            out[3] = m[3] * x + m[7] * y + m[11] * z + m[15] * w;
            return out;
        };

        /**
         * Transforms the vec4 with a quat
         *
         * @param {vec4} out the receiving vector
         * @param {vec4} a the vector to transform
         * @param {quat} q quaternion to transform with
         * @returns {vec4} out
         */
        vec4.transformQuat = function(out, a, q) {
            var x = a[0], y = a[1], z = a[2],
                qx = q[0], qy = q[1], qz = q[2], qw = q[3],

            // calculate quat * vec
                ix = qw * x + qy * z - qz * y,
                iy = qw * y + qz * x - qx * z,
                iz = qw * z + qx * y - qy * x,
                iw = -qx * x - qy * y - qz * z;

            // calculate result * inverse quat
            out[0] = ix * qw + iw * -qx + iy * -qz - iz * -qy;
            out[1] = iy * qw + iw * -qy + iz * -qx - ix * -qz;
            out[2] = iz * qw + iw * -qz + ix * -qy - iy * -qx;
            return out;
        };

        /**
         * Perform some operation over an array of vec4s.
         *
         * @param {Array} a the array of vectors to iterate over
         * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
         * @param {Number} offset Number of elements to skip at the beginning of the array
         * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
         * @param {Function} fn Function to call for each vector in the array
         * @param {Object} [arg] additional argument to pass to fn
         * @returns {Array} a
         * @function
         */
        vec4.forEach = (function() {
            var vec = vec4.create();

            return function(a, stride, offset, count, fn, arg) {
                var i, l;
                if(!stride) {
                    stride = 4;
                }

                if(!offset) {
                    offset = 0;
                }

                if(count) {
                    l = Math.min((count * stride) + offset, a.length);
                } else {
                    l = a.length;
                }

                for(i = offset; i < l; i += stride) {
                    vec[0] = a[i]; vec[1] = a[i+1]; vec[2] = a[i+2]; vec[3] = a[i+3];
                    fn(vec, vec, arg);
                    a[i] = vec[0]; a[i+1] = vec[1]; a[i+2] = vec[2]; a[i+3] = vec[3];
                }

                return a;
            };
        })();

        /**
         * Returns a string representation of a vector
         *
         * @param {vec4} vec vector to represent as a string
         * @returns {String} string representation of the vector
         */
        vec4.str = function (a) {
            return 'vec4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
        };

        if(typeof(exports) !== 'undefined') {
            exports.vec4 = vec4;
        }
        ;
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

        /**
         * @class 2x2 Matrix
         * @name mat2
         */

        var mat2 = {};

        /**
         * Creates a new identity mat2
         *
         * @returns {mat2} a new 2x2 matrix
         */
        mat2.create = function() {
            var out = new GLMAT_ARRAY_TYPE(4);
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        };

        /**
         * Creates a new mat2 initialized with values from an existing matrix
         *
         * @param {mat2} a matrix to clone
         * @returns {mat2} a new 2x2 matrix
         */
        mat2.clone = function(a) {
            var out = new GLMAT_ARRAY_TYPE(4);
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            return out;
        };

        /**
         * Copy the values from one mat2 to another
         *
         * @param {mat2} out the receiving matrix
         * @param {mat2} a the source matrix
         * @returns {mat2} out
         */
        mat2.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            return out;
        };

        /**
         * Set a mat2 to the identity matrix
         *
         * @param {mat2} out the receiving matrix
         * @returns {mat2} out
         */
        mat2.identity = function(out) {
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        };

        /**
         * Transpose the values of a mat2
         *
         * @param {mat2} out the receiving matrix
         * @param {mat2} a the source matrix
         * @returns {mat2} out
         */
        mat2.transpose = function(out, a) {
            // If we are transposing ourselves we can skip a few steps but have to cache some values
            if (out === a) {
                var a1 = a[1];
                out[1] = a[2];
                out[2] = a1;
            } else {
                out[0] = a[0];
                out[1] = a[2];
                out[2] = a[1];
                out[3] = a[3];
            }

            return out;
        };

        /**
         * Inverts a mat2
         *
         * @param {mat2} out the receiving matrix
         * @param {mat2} a the source matrix
         * @returns {mat2} out
         */
        mat2.invert = function(out, a) {
            var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],

            // Calculate the determinant
                det = a0 * a3 - a2 * a1;

            if (!det) {
                return null;
            }
            det = 1.0 / det;

            out[0] =  a3 * det;
            out[1] = -a1 * det;
            out[2] = -a2 * det;
            out[3] =  a0 * det;

            return out;
        };

        /**
         * Calculates the adjugate of a mat2
         *
         * @param {mat2} out the receiving matrix
         * @param {mat2} a the source matrix
         * @returns {mat2} out
         */
        mat2.adjoint = function(out, a) {
            // Caching this value is nessecary if out == a
            var a0 = a[0];
            out[0] =  a[3];
            out[1] = -a[1];
            out[2] = -a[2];
            out[3] =  a0;

            return out;
        };

        /**
         * Calculates the determinant of a mat2
         *
         * @param {mat2} a the source matrix
         * @returns {Number} determinant of a
         */
        mat2.determinant = function (a) {
            return a[0] * a[3] - a[2] * a[1];
        };

        /**
         * Multiplies two mat2's
         *
         * @param {mat2} out the receiving matrix
         * @param {mat2} a the first operand
         * @param {mat2} b the second operand
         * @returns {mat2} out
         */
        mat2.multiply = function (out, a, b) {
            var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3];
            var b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
            out[0] = a0 * b0 + a1 * b2;
            out[1] = a0 * b1 + a1 * b3;
            out[2] = a2 * b0 + a3 * b2;
            out[3] = a2 * b1 + a3 * b3;
            return out;
        };

        /**
         * Alias for {@link mat2.multiply}
         * @function
         */
        mat2.mul = mat2.multiply;

        /**
         * Rotates a mat2 by the given angle
         *
         * @param {mat2} out the receiving matrix
         * @param {mat2} a the matrix to rotate
         * @param {Number} rad the angle to rotate the matrix by
         * @returns {mat2} out
         */
        mat2.rotate = function (out, a, rad) {
            var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
                s = Math.sin(rad),
                c = Math.cos(rad);
            out[0] = a0 *  c + a1 * s;
            out[1] = a0 * -s + a1 * c;
            out[2] = a2 *  c + a3 * s;
            out[3] = a2 * -s + a3 * c;
            return out;
        };

        /**
         * Scales the mat2 by the dimensions in the given vec2
         *
         * @param {mat2} out the receiving matrix
         * @param {mat2} a the matrix to rotate
         * @param {vec2} v the vec2 to scale the matrix by
         * @returns {mat2} out
         **/
        mat2.scale = function(out, a, v) {
            var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
                v0 = v[0], v1 = v[1];
            out[0] = a0 * v0;
            out[1] = a1 * v1;
            out[2] = a2 * v0;
            out[3] = a3 * v1;
            return out;
        };

        /**
         * Returns a string representation of a mat2
         *
         * @param {mat2} mat matrix to represent as a string
         * @returns {String} string representation of the matrix
         */
        mat2.str = function (a) {
            return 'mat2(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
        };

        if(typeof(exports) !== 'undefined') {
            exports.mat2 = mat2;
        }
        ;
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

        /**
         * @class 2x3 Matrix
         * @name mat2d
         *
         * @description
         * A mat2d contains six elements defined as:
         * <pre>
         * [a, b,
         *  c, d,
         *  tx,ty]
         * </pre>
         * This is a short form for the 3x3 matrix:
         * <pre>
         * [a, b, 0
         *  c, d, 0
         *  tx,ty,1]
         * </pre>
         * The last column is ignored so the array is shorter and operations are faster.
         */

        var mat2d = {};

        /**
         * Creates a new identity mat2d
         *
         * @returns {mat2d} a new 2x3 matrix
         */
        mat2d.create = function() {
            var out = new GLMAT_ARRAY_TYPE(6);
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            out[4] = 0;
            out[5] = 0;
            return out;
        };

        /**
         * Creates a new mat2d initialized with values from an existing matrix
         *
         * @param {mat2d} a matrix to clone
         * @returns {mat2d} a new 2x3 matrix
         */
        mat2d.clone = function(a) {
            var out = new GLMAT_ARRAY_TYPE(6);
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            return out;
        };

        /**
         * Copy the values from one mat2d to another
         *
         * @param {mat2d} out the receiving matrix
         * @param {mat2d} a the source matrix
         * @returns {mat2d} out
         */
        mat2d.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            return out;
        };

        /**
         * Set a mat2d to the identity matrix
         *
         * @param {mat2d} out the receiving matrix
         * @returns {mat2d} out
         */
        mat2d.identity = function(out) {
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            out[4] = 0;
            out[5] = 0;
            return out;
        };

        /**
         * Inverts a mat2d
         *
         * @param {mat2d} out the receiving matrix
         * @param {mat2d} a the source matrix
         * @returns {mat2d} out
         */
        mat2d.invert = function(out, a) {
            var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
                atx = a[4], aty = a[5];

            var det = aa * ad - ab * ac;
            if(!det){
                return null;
            }
            det = 1.0 / det;

            out[0] = ad * det;
            out[1] = -ab * det;
            out[2] = -ac * det;
            out[3] = aa * det;
            out[4] = (ac * aty - ad * atx) * det;
            out[5] = (ab * atx - aa * aty) * det;
            return out;
        };

        /**
         * Calculates the determinant of a mat2d
         *
         * @param {mat2d} a the source matrix
         * @returns {Number} determinant of a
         */
        mat2d.determinant = function (a) {
            return a[0] * a[3] - a[1] * a[2];
        };

        /**
         * Multiplies two mat2d's
         *
         * @param {mat2d} out the receiving matrix
         * @param {mat2d} a the first operand
         * @param {mat2d} b the second operand
         * @returns {mat2d} out
         */
        mat2d.multiply = function (out, a, b) {
            var aa = a[0], ab = a[1], ac = a[2], ad = a[3],
                atx = a[4], aty = a[5],
                ba = b[0], bb = b[1], bc = b[2], bd = b[3],
                btx = b[4], bty = b[5];

            out[0] = aa*ba + ab*bc;
            out[1] = aa*bb + ab*bd;
            out[2] = ac*ba + ad*bc;
            out[3] = ac*bb + ad*bd;
            out[4] = ba*atx + bc*aty + btx;
            out[5] = bb*atx + bd*aty + bty;
            return out;
        };

        /**
         * Alias for {@link mat2d.multiply}
         * @function
         */
        mat2d.mul = mat2d.multiply;


        /**
         * Rotates a mat2d by the given angle
         *
         * @param {mat2d} out the receiving matrix
         * @param {mat2d} a the matrix to rotate
         * @param {Number} rad the angle to rotate the matrix by
         * @returns {mat2d} out
         */
        mat2d.rotate = function (out, a, rad) {
            var aa = a[0],
                ab = a[1],
                ac = a[2],
                ad = a[3],
                atx = a[4],
                aty = a[5],
                st = Math.sin(rad),
                ct = Math.cos(rad);

            out[0] = aa*ct + ab*st;
            out[1] = -aa*st + ab*ct;
            out[2] = ac*ct + ad*st;
            out[3] = -ac*st + ct*ad;
            out[4] = ct*atx + st*aty;
            out[5] = ct*aty - st*atx;
            return out;
        };

        /**
         * Scales the mat2d by the dimensions in the given vec2
         *
         * @param {mat2d} out the receiving matrix
         * @param {mat2d} a the matrix to translate
         * @param {vec2} v the vec2 to scale the matrix by
         * @returns {mat2d} out
         **/
        mat2d.scale = function(out, a, v) {
            var vx = v[0], vy = v[1];
            out[0] = a[0] * vx;
            out[1] = a[1] * vy;
            out[2] = a[2] * vx;
            out[3] = a[3] * vy;
            out[4] = a[4] * vx;
            out[5] = a[5] * vy;
            return out;
        };

        /**
         * Translates the mat2d by the dimensions in the given vec2
         *
         * @param {mat2d} out the receiving matrix
         * @param {mat2d} a the matrix to translate
         * @param {vec2} v the vec2 to translate the matrix by
         * @returns {mat2d} out
         **/
        mat2d.translate = function(out, a, v) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4] + v[0];
            out[5] = a[5] + v[1];
            return out;
        };

        /**
         * Returns a string representation of a mat2d
         *
         * @param {mat2d} a matrix to represent as a string
         * @returns {String} string representation of the matrix
         */
        mat2d.str = function (a) {
            return 'mat2d(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' +
                a[3] + ', ' + a[4] + ', ' + a[5] + ')';
        };

        if(typeof(exports) !== 'undefined') {
            exports.mat2d = mat2d;
        }
        ;
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

        /**
         * @class 3x3 Matrix
         * @name mat3
         */

        var mat3 = {};

        /**
         * Creates a new identity mat3
         *
         * @returns {mat3} a new 3x3 matrix
         */
        mat3.create = function() {
            var out = new GLMAT_ARRAY_TYPE(9);
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 1;
            out[5] = 0;
            out[6] = 0;
            out[7] = 0;
            out[8] = 1;
            return out;
        };

        /**
         * Copies the upper-left 3x3 values into the given mat3.
         *
         * @param {mat3} out the receiving 3x3 matrix
         * @param {mat4} a   the source 4x4 matrix
         * @returns {mat3} out
         */
        mat3.fromMat4 = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[4];
            out[4] = a[5];
            out[5] = a[6];
            out[6] = a[8];
            out[7] = a[9];
            out[8] = a[10];
            return out;
        };

        /**
         * Creates a new mat3 initialized with values from an existing matrix
         *
         * @param {mat3} a matrix to clone
         * @returns {mat3} a new 3x3 matrix
         */
        mat3.clone = function(a) {
            var out = new GLMAT_ARRAY_TYPE(9);
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];
            return out;
        };

        /**
         * Copy the values from one mat3 to another
         *
         * @param {mat3} out the receiving matrix
         * @param {mat3} a the source matrix
         * @returns {mat3} out
         */
        mat3.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];
            return out;
        };

        /**
         * Set a mat3 to the identity matrix
         *
         * @param {mat3} out the receiving matrix
         * @returns {mat3} out
         */
        mat3.identity = function(out) {
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 1;
            out[5] = 0;
            out[6] = 0;
            out[7] = 0;
            out[8] = 1;
            return out;
        };

        /**
         * Transpose the values of a mat3
         *
         * @param {mat3} out the receiving matrix
         * @param {mat3} a the source matrix
         * @returns {mat3} out
         */
        mat3.transpose = function(out, a) {
            // If we are transposing ourselves we can skip a few steps but have to cache some values
            if (out === a) {
                var a01 = a[1], a02 = a[2], a12 = a[5];
                out[1] = a[3];
                out[2] = a[6];
                out[3] = a01;
                out[5] = a[7];
                out[6] = a02;
                out[7] = a12;
            } else {
                out[0] = a[0];
                out[1] = a[3];
                out[2] = a[6];
                out[3] = a[1];
                out[4] = a[4];
                out[5] = a[7];
                out[6] = a[2];
                out[7] = a[5];
                out[8] = a[8];
            }

            return out;
        };

        /**
         * Inverts a mat3
         *
         * @param {mat3} out the receiving matrix
         * @param {mat3} a the source matrix
         * @returns {mat3} out
         */
        mat3.invert = function(out, a) {
            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8],

                b01 = a22 * a11 - a12 * a21,
                b11 = -a22 * a10 + a12 * a20,
                b21 = a21 * a10 - a11 * a20,

            // Calculate the determinant
                det = a00 * b01 + a01 * b11 + a02 * b21;

            if (!det) {
                return null;
            }
            det = 1.0 / det;

            out[0] = b01 * det;
            out[1] = (-a22 * a01 + a02 * a21) * det;
            out[2] = (a12 * a01 - a02 * a11) * det;
            out[3] = b11 * det;
            out[4] = (a22 * a00 - a02 * a20) * det;
            out[5] = (-a12 * a00 + a02 * a10) * det;
            out[6] = b21 * det;
            out[7] = (-a21 * a00 + a01 * a20) * det;
            out[8] = (a11 * a00 - a01 * a10) * det;
            return out;
        };

        /**
         * Calculates the adjugate of a mat3
         *
         * @param {mat3} out the receiving matrix
         * @param {mat3} a the source matrix
         * @returns {mat3} out
         */
        mat3.adjoint = function(out, a) {
            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8];

            out[0] = (a11 * a22 - a12 * a21);
            out[1] = (a02 * a21 - a01 * a22);
            out[2] = (a01 * a12 - a02 * a11);
            out[3] = (a12 * a20 - a10 * a22);
            out[4] = (a00 * a22 - a02 * a20);
            out[5] = (a02 * a10 - a00 * a12);
            out[6] = (a10 * a21 - a11 * a20);
            out[7] = (a01 * a20 - a00 * a21);
            out[8] = (a00 * a11 - a01 * a10);
            return out;
        };

        /**
         * Calculates the determinant of a mat3
         *
         * @param {mat3} a the source matrix
         * @returns {Number} determinant of a
         */
        mat3.determinant = function (a) {
            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8];

            return a00 * (a22 * a11 - a12 * a21) + a01 * (-a22 * a10 + a12 * a20) + a02 * (a21 * a10 - a11 * a20);
        };

        /**
         * Multiplies two mat3's
         *
         * @param {mat3} out the receiving matrix
         * @param {mat3} a the first operand
         * @param {mat3} b the second operand
         * @returns {mat3} out
         */
        mat3.multiply = function (out, a, b) {
            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8],

                b00 = b[0], b01 = b[1], b02 = b[2],
                b10 = b[3], b11 = b[4], b12 = b[5],
                b20 = b[6], b21 = b[7], b22 = b[8];

            out[0] = b00 * a00 + b01 * a10 + b02 * a20;
            out[1] = b00 * a01 + b01 * a11 + b02 * a21;
            out[2] = b00 * a02 + b01 * a12 + b02 * a22;

            out[3] = b10 * a00 + b11 * a10 + b12 * a20;
            out[4] = b10 * a01 + b11 * a11 + b12 * a21;
            out[5] = b10 * a02 + b11 * a12 + b12 * a22;

            out[6] = b20 * a00 + b21 * a10 + b22 * a20;
            out[7] = b20 * a01 + b21 * a11 + b22 * a21;
            out[8] = b20 * a02 + b21 * a12 + b22 * a22;
            return out;
        };

        /**
         * Alias for {@link mat3.multiply}
         * @function
         */
        mat3.mul = mat3.multiply;

        /**
         * Translate a mat3 by the given vector
         *
         * @param {mat3} out the receiving matrix
         * @param {mat3} a the matrix to translate
         * @param {vec2} v vector to translate by
         * @returns {mat3} out
         */
        mat3.translate = function(out, a, v) {
            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8],
                x = v[0], y = v[1];

            out[0] = a00;
            out[1] = a01;
            out[2] = a02;

            out[3] = a10;
            out[4] = a11;
            out[5] = a12;

            out[6] = x * a00 + y * a10 + a20;
            out[7] = x * a01 + y * a11 + a21;
            out[8] = x * a02 + y * a12 + a22;
            return out;
        };

        /**
         * Rotates a mat3 by the given angle
         *
         * @param {mat3} out the receiving matrix
         * @param {mat3} a the matrix to rotate
         * @param {Number} rad the angle to rotate the matrix by
         * @returns {mat3} out
         */
        mat3.rotate = function (out, a, rad) {
            var a00 = a[0], a01 = a[1], a02 = a[2],
                a10 = a[3], a11 = a[4], a12 = a[5],
                a20 = a[6], a21 = a[7], a22 = a[8],

                s = Math.sin(rad),
                c = Math.cos(rad);

            out[0] = c * a00 + s * a10;
            out[1] = c * a01 + s * a11;
            out[2] = c * a02 + s * a12;

            out[3] = c * a10 - s * a00;
            out[4] = c * a11 - s * a01;
            out[5] = c * a12 - s * a02;

            out[6] = a20;
            out[7] = a21;
            out[8] = a22;
            return out;
        };

        /**
         * Scales the mat3 by the dimensions in the given vec2
         *
         * @param {mat3} out the receiving matrix
         * @param {mat3} a the matrix to rotate
         * @param {vec2} v the vec2 to scale the matrix by
         * @returns {mat3} out
         **/
        mat3.scale = function(out, a, v) {
            var x = v[0], y = v[1];

            out[0] = x * a[0];
            out[1] = x * a[1];
            out[2] = x * a[2];

            out[3] = y * a[3];
            out[4] = y * a[4];
            out[5] = y * a[5];

            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];
            return out;
        };

        /**
         * Copies the values from a mat2d into a mat3
         *
         * @param {mat3} out the receiving matrix
         * @param {mat2d} a the matrix to copy
         * @returns {mat3} out
         **/
        mat3.fromMat2d = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = 0;

            out[3] = a[2];
            out[4] = a[3];
            out[5] = 0;

            out[6] = a[4];
            out[7] = a[5];
            out[8] = 1;
            return out;
        };

        /**
         * Calculates a 3x3 matrix from the given quaternion
         *
         * @param {mat3} out mat3 receiving operation result
         * @param {quat} q Quaternion to create matrix from
         *
         * @returns {mat3} out
         */
        mat3.fromQuat = function (out, q) {
            var x = q[0], y = q[1], z = q[2], w = q[3],
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,

                xx = x * x2,
                yx = y * x2,
                yy = y * y2,
                zx = z * x2,
                zy = z * y2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2;

            out[0] = 1 - yy - zz;
            out[3] = yx - wz;
            out[6] = zx + wy;

            out[1] = yx + wz;
            out[4] = 1 - xx - zz;
            out[7] = zy - wx;

            out[2] = zx - wy;
            out[5] = zy + wx;
            out[8] = 1 - xx - yy;

            return out;
        };

        /**
         * Calculates a 3x3 normal matrix (transpose inverse) from the 4x4 matrix
         *
         * @param {mat3} out mat3 receiving operation result
         * @param {mat4} a Mat4 to derive the normal matrix from
         *
         * @returns {mat3} out
         */
        mat3.normalFromMat4 = function (out, a) {
            var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
                a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
                a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
                a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

                b00 = a00 * a11 - a01 * a10,
                b01 = a00 * a12 - a02 * a10,
                b02 = a00 * a13 - a03 * a10,
                b03 = a01 * a12 - a02 * a11,
                b04 = a01 * a13 - a03 * a11,
                b05 = a02 * a13 - a03 * a12,
                b06 = a20 * a31 - a21 * a30,
                b07 = a20 * a32 - a22 * a30,
                b08 = a20 * a33 - a23 * a30,
                b09 = a21 * a32 - a22 * a31,
                b10 = a21 * a33 - a23 * a31,
                b11 = a22 * a33 - a23 * a32,

            // Calculate the determinant
                det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

            if (!det) {
                return null;
            }
            det = 1.0 / det;

            out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
            out[1] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
            out[2] = (a10 * b10 - a11 * b08 + a13 * b06) * det;

            out[3] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
            out[4] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
            out[5] = (a01 * b08 - a00 * b10 - a03 * b06) * det;

            out[6] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
            out[7] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
            out[8] = (a30 * b04 - a31 * b02 + a33 * b00) * det;

            return out;
        };

        /**
         * Returns a string representation of a mat3
         *
         * @param {mat3} mat matrix to represent as a string
         * @returns {String} string representation of the matrix
         */
        mat3.str = function (a) {
            return 'mat3(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' +
                a[3] + ', ' + a[4] + ', ' + a[5] + ', ' +
                a[6] + ', ' + a[7] + ', ' + a[8] + ')';
        };

        if(typeof(exports) !== 'undefined') {
            exports.mat3 = mat3;
        }
        ;
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

        /**
         * @class 4x4 Matrix
         * @name mat4
         */



        /**
         * Creates a new identity mat4
         *
         * @returns {mat4} a new 4x4 matrix
         */
        mat4.create = function() {
            var out = new GLMAT_ARRAY_TYPE(16);
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = 1;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = 1;
            out[11] = 0;
            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[15] = 1;
            return out;
        };

        /**
         * Creates a new mat4 initialized with values from an existing matrix
         *
         * @param {mat4} a matrix to clone
         * @returns {mat4} a new 4x4 matrix
         */
        mat4.clone = function(a) {
            var out = new GLMAT_ARRAY_TYPE(16);
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];
            out[9] = a[9];
            out[10] = a[10];
            out[11] = a[11];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
            return out;
        };

        /**
         * Copy the values from one mat4 to another
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the source matrix
         * @returns {mat4} out
         */
        mat4.copy = function(out, a) {
            out[0] = a[0];
            out[1] = a[1];
            out[2] = a[2];
            out[3] = a[3];
            out[4] = a[4];
            out[5] = a[5];
            out[6] = a[6];
            out[7] = a[7];
            out[8] = a[8];
            out[9] = a[9];
            out[10] = a[10];
            out[11] = a[11];
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
            return out;
        };

        /**
         * Set a mat4 to the identity matrix
         *
         * @param {mat4} out the receiving matrix
         * @returns {mat4} out
         */
        mat4.identity = function(out) {
            out[0] = 1;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = 1;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = 1;
            out[11] = 0;
            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[15] = 1;
            return out;
        };

        /**
         * Transpose the values of a mat4
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the source matrix
         * @returns {mat4} out
         */
        mat4.transpose = function(out, a) {
            // If we are transposing ourselves we can skip a few steps but have to cache some values
            if (out === a) {
                var a01 = a[1], a02 = a[2], a03 = a[3],
                    a12 = a[6], a13 = a[7],
                    a23 = a[11];

                out[1] = a[4];
                out[2] = a[8];
                out[3] = a[12];
                out[4] = a01;
                out[6] = a[9];
                out[7] = a[13];
                out[8] = a02;
                out[9] = a12;
                out[11] = a[14];
                out[12] = a03;
                out[13] = a13;
                out[14] = a23;
            } else {
                out[0] = a[0];
                out[1] = a[4];
                out[2] = a[8];
                out[3] = a[12];
                out[4] = a[1];
                out[5] = a[5];
                out[6] = a[9];
                out[7] = a[13];
                out[8] = a[2];
                out[9] = a[6];
                out[10] = a[10];
                out[11] = a[14];
                out[12] = a[3];
                out[13] = a[7];
                out[14] = a[11];
                out[15] = a[15];
            }

            return out;
        };

        /**
         * Inverts a mat4
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the source matrix
         * @returns {mat4} out
         */
        mat4.invert = function(out, a) {
            var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
                a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
                a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
                a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

                b00 = a00 * a11 - a01 * a10,
                b01 = a00 * a12 - a02 * a10,
                b02 = a00 * a13 - a03 * a10,
                b03 = a01 * a12 - a02 * a11,
                b04 = a01 * a13 - a03 * a11,
                b05 = a02 * a13 - a03 * a12,
                b06 = a20 * a31 - a21 * a30,
                b07 = a20 * a32 - a22 * a30,
                b08 = a20 * a33 - a23 * a30,
                b09 = a21 * a32 - a22 * a31,
                b10 = a21 * a33 - a23 * a31,
                b11 = a22 * a33 - a23 * a32,

            // Calculate the determinant
                det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;

            if (!det) {
                return null;
            }
            det = 1.0 / det;

            out[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det;
            out[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det;
            out[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det;
            out[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
            out[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det;
            out[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det;
            out[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det;
            out[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
            out[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det;
            out[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det;
            out[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det;
            out[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
            out[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det;
            out[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det;
            out[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det;
            out[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;

            return out;
        };

        /**
         * Calculates the adjugate of a mat4
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the source matrix
         * @returns {mat4} out
         */
        mat4.adjoint = function(out, a) {
            var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
                a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
                a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
                a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

            out[0]  =  (a11 * (a22 * a33 - a23 * a32) - a21 * (a12 * a33 - a13 * a32) + a31 * (a12 * a23 - a13 * a22));
            out[1]  = -(a01 * (a22 * a33 - a23 * a32) - a21 * (a02 * a33 - a03 * a32) + a31 * (a02 * a23 - a03 * a22));
            out[2]  =  (a01 * (a12 * a33 - a13 * a32) - a11 * (a02 * a33 - a03 * a32) + a31 * (a02 * a13 - a03 * a12));
            out[3]  = -(a01 * (a12 * a23 - a13 * a22) - a11 * (a02 * a23 - a03 * a22) + a21 * (a02 * a13 - a03 * a12));
            out[4]  = -(a10 * (a22 * a33 - a23 * a32) - a20 * (a12 * a33 - a13 * a32) + a30 * (a12 * a23 - a13 * a22));
            out[5]  =  (a00 * (a22 * a33 - a23 * a32) - a20 * (a02 * a33 - a03 * a32) + a30 * (a02 * a23 - a03 * a22));
            out[6]  = -(a00 * (a12 * a33 - a13 * a32) - a10 * (a02 * a33 - a03 * a32) + a30 * (a02 * a13 - a03 * a12));
            out[7]  =  (a00 * (a12 * a23 - a13 * a22) - a10 * (a02 * a23 - a03 * a22) + a20 * (a02 * a13 - a03 * a12));
            out[8]  =  (a10 * (a21 * a33 - a23 * a31) - a20 * (a11 * a33 - a13 * a31) + a30 * (a11 * a23 - a13 * a21));
            out[9]  = -(a00 * (a21 * a33 - a23 * a31) - a20 * (a01 * a33 - a03 * a31) + a30 * (a01 * a23 - a03 * a21));
            out[10] =  (a00 * (a11 * a33 - a13 * a31) - a10 * (a01 * a33 - a03 * a31) + a30 * (a01 * a13 - a03 * a11));
            out[11] = -(a00 * (a11 * a23 - a13 * a21) - a10 * (a01 * a23 - a03 * a21) + a20 * (a01 * a13 - a03 * a11));
            out[12] = -(a10 * (a21 * a32 - a22 * a31) - a20 * (a11 * a32 - a12 * a31) + a30 * (a11 * a22 - a12 * a21));
            out[13] =  (a00 * (a21 * a32 - a22 * a31) - a20 * (a01 * a32 - a02 * a31) + a30 * (a01 * a22 - a02 * a21));
            out[14] = -(a00 * (a11 * a32 - a12 * a31) - a10 * (a01 * a32 - a02 * a31) + a30 * (a01 * a12 - a02 * a11));
            out[15] =  (a00 * (a11 * a22 - a12 * a21) - a10 * (a01 * a22 - a02 * a21) + a20 * (a01 * a12 - a02 * a11));
            return out;
        };

        /**
         * Calculates the determinant of a mat4
         *
         * @param {mat4} a the source matrix
         * @returns {Number} determinant of a
         */
        mat4.determinant = function (a) {
            var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
                a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
                a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
                a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15],

                b00 = a00 * a11 - a01 * a10,
                b01 = a00 * a12 - a02 * a10,
                b02 = a00 * a13 - a03 * a10,
                b03 = a01 * a12 - a02 * a11,
                b04 = a01 * a13 - a03 * a11,
                b05 = a02 * a13 - a03 * a12,
                b06 = a20 * a31 - a21 * a30,
                b07 = a20 * a32 - a22 * a30,
                b08 = a20 * a33 - a23 * a30,
                b09 = a21 * a32 - a22 * a31,
                b10 = a21 * a33 - a23 * a31,
                b11 = a22 * a33 - a23 * a32;

            // Calculate the determinant
            return b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
        };

        /**
         * Multiplies two mat4's
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the first operand
         * @param {mat4} b the second operand
         * @returns {mat4} out
         */
        mat4.multiply = function (out, a, b) {
            var a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3],
                a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7],
                a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11],
                a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];

            // Cache only the current line of the second matrix
            var b0  = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
            out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
            out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
            out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
            out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

            b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
            out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
            out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
            out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
            out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

            b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
            out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
            out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
            out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
            out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;

            b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
            out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
            out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
            out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
            out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
            return out;
        };

        /**
         * Alias for {@link mat4.multiply}
         * @function
         */
        mat4.mul = mat4.multiply;

        /**
         * Translate a mat4 by the given vector
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the matrix to translate
         * @param {vec3} v vector to translate by
         * @returns {mat4} out
         */
        mat4.translate = function (out, a, v) {
            var x = v[0], y = v[1], z = v[2],
                a00, a01, a02, a03,
                a10, a11, a12, a13,
                a20, a21, a22, a23;

            if (a === out) {
                out[12] = a[0] * x + a[4] * y + a[8] * z + a[12];
                out[13] = a[1] * x + a[5] * y + a[9] * z + a[13];
                out[14] = a[2] * x + a[6] * y + a[10] * z + a[14];
                out[15] = a[3] * x + a[7] * y + a[11] * z + a[15];
            } else {
                a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
                a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
                a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

                out[0] = a00; out[1] = a01; out[2] = a02; out[3] = a03;
                out[4] = a10; out[5] = a11; out[6] = a12; out[7] = a13;
                out[8] = a20; out[9] = a21; out[10] = a22; out[11] = a23;

                out[12] = a00 * x + a10 * y + a20 * z + a[12];
                out[13] = a01 * x + a11 * y + a21 * z + a[13];
                out[14] = a02 * x + a12 * y + a22 * z + a[14];
                out[15] = a03 * x + a13 * y + a23 * z + a[15];
            }

            return out;
        };

        /**
         * Scales the mat4 by the dimensions in the given vec3
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the matrix to scale
         * @param {vec3} v the vec3 to scale the matrix by
         * @returns {mat4} out
         **/
        mat4.scale = function(out, a, v) {
            var x = v[0], y = v[1], z = v[2];

            out[0] = a[0] * x;
            out[1] = a[1] * x;
            out[2] = a[2] * x;
            out[3] = a[3] * x;
            out[4] = a[4] * y;
            out[5] = a[5] * y;
            out[6] = a[6] * y;
            out[7] = a[7] * y;
            out[8] = a[8] * z;
            out[9] = a[9] * z;
            out[10] = a[10] * z;
            out[11] = a[11] * z;
            out[12] = a[12];
            out[13] = a[13];
            out[14] = a[14];
            out[15] = a[15];
            return out;
        };

        /**
         * Rotates a mat4 by the given angle
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the matrix to rotate
         * @param {Number} rad the angle to rotate the matrix by
         * @param {vec3} axis the axis to rotate around
         * @returns {mat4} out
         */
        mat4.rotate = function (out, a, rad, axis) {
            var x = axis[0], y = axis[1], z = axis[2],
                len = Math.sqrt(x * x + y * y + z * z),
                s, c, t,
                a00, a01, a02, a03,
                a10, a11, a12, a13,
                a20, a21, a22, a23,
                b00, b01, b02,
                b10, b11, b12,
                b20, b21, b22;

            if (Math.abs(len) < GLMAT_EPSILON) { return null; }

            len = 1 / len;
            x *= len;
            y *= len;
            z *= len;

            s = Math.sin(rad);
            c = Math.cos(rad);
            t = 1 - c;

            a00 = a[0]; a01 = a[1]; a02 = a[2]; a03 = a[3];
            a10 = a[4]; a11 = a[5]; a12 = a[6]; a13 = a[7];
            a20 = a[8]; a21 = a[9]; a22 = a[10]; a23 = a[11];

            // Construct the elements of the rotation matrix
            b00 = x * x * t + c; b01 = y * x * t + z * s; b02 = z * x * t - y * s;
            b10 = x * y * t - z * s; b11 = y * y * t + c; b12 = z * y * t + x * s;
            b20 = x * z * t + y * s; b21 = y * z * t - x * s; b22 = z * z * t + c;

            // Perform rotation-specific matrix multiplication
            out[0] = a00 * b00 + a10 * b01 + a20 * b02;
            out[1] = a01 * b00 + a11 * b01 + a21 * b02;
            out[2] = a02 * b00 + a12 * b01 + a22 * b02;
            out[3] = a03 * b00 + a13 * b01 + a23 * b02;
            out[4] = a00 * b10 + a10 * b11 + a20 * b12;
            out[5] = a01 * b10 + a11 * b11 + a21 * b12;
            out[6] = a02 * b10 + a12 * b11 + a22 * b12;
            out[7] = a03 * b10 + a13 * b11 + a23 * b12;
            out[8] = a00 * b20 + a10 * b21 + a20 * b22;
            out[9] = a01 * b20 + a11 * b21 + a21 * b22;
            out[10] = a02 * b20 + a12 * b21 + a22 * b22;
            out[11] = a03 * b20 + a13 * b21 + a23 * b22;

            if (a !== out) { // If the source and destination differ, copy the unchanged last row
                out[12] = a[12];
                out[13] = a[13];
                out[14] = a[14];
                out[15] = a[15];
            }
            return out;
        };

        /**
         * Rotates a matrix by the given angle around the X axis
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the matrix to rotate
         * @param {Number} rad the angle to rotate the matrix by
         * @returns {mat4} out
         */
        mat4.rotateX = function (out, a, rad) {
            var s = Math.sin(rad),
                c = Math.cos(rad),
                a10 = a[4],
                a11 = a[5],
                a12 = a[6],
                a13 = a[7],
                a20 = a[8],
                a21 = a[9],
                a22 = a[10],
                a23 = a[11];

            if (a !== out) { // If the source and destination differ, copy the unchanged rows
                out[0]  = a[0];
                out[1]  = a[1];
                out[2]  = a[2];
                out[3]  = a[3];
                out[12] = a[12];
                out[13] = a[13];
                out[14] = a[14];
                out[15] = a[15];
            }

            // Perform axis-specific matrix multiplication
            out[4] = a10 * c + a20 * s;
            out[5] = a11 * c + a21 * s;
            out[6] = a12 * c + a22 * s;
            out[7] = a13 * c + a23 * s;
            out[8] = a20 * c - a10 * s;
            out[9] = a21 * c - a11 * s;
            out[10] = a22 * c - a12 * s;
            out[11] = a23 * c - a13 * s;
            return out;
        };

        /**
         * Rotates a matrix by the given angle around the Y axis
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the matrix to rotate
         * @param {Number} rad the angle to rotate the matrix by
         * @returns {mat4} out
         */
        mat4.rotateY = function (out, a, rad) {
            var s = Math.sin(rad),
                c = Math.cos(rad),
                a00 = a[0],
                a01 = a[1],
                a02 = a[2],
                a03 = a[3],
                a20 = a[8],
                a21 = a[9],
                a22 = a[10],
                a23 = a[11];

            if (a !== out) { // If the source and destination differ, copy the unchanged rows
                out[4]  = a[4];
                out[5]  = a[5];
                out[6]  = a[6];
                out[7]  = a[7];
                out[12] = a[12];
                out[13] = a[13];
                out[14] = a[14];
                out[15] = a[15];
            }

            // Perform axis-specific matrix multiplication
            out[0] = a00 * c - a20 * s;
            out[1] = a01 * c - a21 * s;
            out[2] = a02 * c - a22 * s;
            out[3] = a03 * c - a23 * s;
            out[8] = a00 * s + a20 * c;
            out[9] = a01 * s + a21 * c;
            out[10] = a02 * s + a22 * c;
            out[11] = a03 * s + a23 * c;
            return out;
        };

        /**
         * Rotates a matrix by the given angle around the Z axis
         *
         * @param {mat4} out the receiving matrix
         * @param {mat4} a the matrix to rotate
         * @param {Number} rad the angle to rotate the matrix by
         * @returns {mat4} out
         */
        mat4.rotateZ = function (out, a, rad) {
            var s = Math.sin(rad),
                c = Math.cos(rad),
                a00 = a[0],
                a01 = a[1],
                a02 = a[2],
                a03 = a[3],
                a10 = a[4],
                a11 = a[5],
                a12 = a[6],
                a13 = a[7];

            if (a !== out) { // If the source and destination differ, copy the unchanged last row
                out[8]  = a[8];
                out[9]  = a[9];
                out[10] = a[10];
                out[11] = a[11];
                out[12] = a[12];
                out[13] = a[13];
                out[14] = a[14];
                out[15] = a[15];
            }

            // Perform axis-specific matrix multiplication
            out[0] = a00 * c + a10 * s;
            out[1] = a01 * c + a11 * s;
            out[2] = a02 * c + a12 * s;
            out[3] = a03 * c + a13 * s;
            out[4] = a10 * c - a00 * s;
            out[5] = a11 * c - a01 * s;
            out[6] = a12 * c - a02 * s;
            out[7] = a13 * c - a03 * s;
            return out;
        };

        /**
         * Creates a matrix from a quaternion rotation and vector translation
         * This is equivalent to (but much faster than):
         *
         *     mat4.identity(dest);
         *     mat4.translate(dest, vec);
         *     var quatMat = mat4.create();
         *     quat4.toMat4(quat, quatMat);
         *     mat4.multiply(dest, quatMat);
         *
         * @param {mat4} out mat4 receiving operation result
         * @param {quat4} q Rotation quaternion
         * @param {vec3} v Translation vector
         * @returns {mat4} out
         */
        mat4.fromRotationTranslation = function (out, q, v) {
            // Quaternion math
            var x = q[0], y = q[1], z = q[2], w = q[3],
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,

                xx = x * x2,
                xy = x * y2,
                xz = x * z2,
                yy = y * y2,
                yz = y * z2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2;

            out[0] = 1 - (yy + zz);
            out[1] = xy + wz;
            out[2] = xz - wy;
            out[3] = 0;
            out[4] = xy - wz;
            out[5] = 1 - (xx + zz);
            out[6] = yz + wx;
            out[7] = 0;
            out[8] = xz + wy;
            out[9] = yz - wx;
            out[10] = 1 - (xx + yy);
            out[11] = 0;
            out[12] = v[0];
            out[13] = v[1];
            out[14] = v[2];
            out[15] = 1;

            return out;
        };

        mat4.fromQuat = function (out, q) {
            var x = q[0], y = q[1], z = q[2], w = q[3],
                x2 = x + x,
                y2 = y + y,
                z2 = z + z,

                xx = x * x2,
                yx = y * x2,
                yy = y * y2,
                zx = z * x2,
                zy = z * y2,
                zz = z * z2,
                wx = w * x2,
                wy = w * y2,
                wz = w * z2;

            out[0] = 1 - yy - zz;
            out[1] = yx + wz;
            out[2] = zx - wy;
            out[3] = 0;

            out[4] = yx - wz;
            out[5] = 1 - xx - zz;
            out[6] = zy + wx;
            out[7] = 0;

            out[8] = zx + wy;
            out[9] = zy - wx;
            out[10] = 1 - xx - yy;
            out[11] = 0;

            out[12] = 0;
            out[13] = 0;
            out[14] = 0;
            out[15] = 1;

            return out;
        };

        /**
         * Generates a frustum matrix with the given bounds
         *
         * @param {mat4} out mat4 frustum matrix will be written into
         * @param {Number} left Left bound of the frustum
         * @param {Number} right Right bound of the frustum
         * @param {Number} bottom Bottom bound of the frustum
         * @param {Number} top Top bound of the frustum
         * @param {Number} near Near bound of the frustum
         * @param {Number} far Far bound of the frustum
         * @returns {mat4} out
         */
        mat4.frustum = function (out, left, right, bottom, top, near, far) {
            var rl = 1 / (right - left),
                tb = 1 / (top - bottom),
                nf = 1 / (near - far);
            out[0] = (near * 2) * rl;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = (near * 2) * tb;
            out[6] = 0;
            out[7] = 0;
            out[8] = (right + left) * rl;
            out[9] = (top + bottom) * tb;
            out[10] = (far + near) * nf;
            out[11] = -1;
            out[12] = 0;
            out[13] = 0;
            out[14] = (far * near * 2) * nf;
            out[15] = 0;
            return out;
        };

        /**
         * Generates a perspective projection matrix with the given bounds
         *
         * @param {mat4} out mat4 frustum matrix will be written into
         * @param {number} fovy Vertical field of view in radians
         * @param {number} aspect Aspect ratio. typically viewport width/height
         * @param {number} near Near bound of the frustum
         * @param {number} far Far bound of the frustum
         * @returns {mat4} out
         */
        mat4.perspective = function (out, fovy, aspect, near, far) {
            var f = 1.0 / Math.tan(fovy / 2),
                nf = 1 / (near - far);
            out[0] = f / aspect;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = f;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = (far + near) * nf;
            out[11] = -1;
            out[12] = 0;
            out[13] = 0;
            out[14] = (2 * far * near) * nf;
            out[15] = 0;
            return out;
        };

        /**
         * Generates a orthogonal projection matrix with the given bounds
         *
         * @param {mat4} out mat4 frustum matrix will be written into
         * @param {number} left Left bound of the frustum
         * @param {number} right Right bound of the frustum
         * @param {number} bottom Bottom bound of the frustum
         * @param {number} top Top bound of the frustum
         * @param {number} near Near bound of the frustum
         * @param {number} far Far bound of the frustum
         * @returns {mat4} out
         */
        mat4.ortho = function (out, left, right, bottom, top, near, far) {
            var lr = 1 / (left - right),
                bt = 1 / (bottom - top),
                nf = 1 / (near - far);
            out[0] = -2 * lr;
            out[1] = 0;
            out[2] = 0;
            out[3] = 0;
            out[4] = 0;
            out[5] = -2 * bt;
            out[6] = 0;
            out[7] = 0;
            out[8] = 0;
            out[9] = 0;
            out[10] = 2 * nf;
            out[11] = 0;
            out[12] = (left + right) * lr;
            out[13] = (top + bottom) * bt;
            out[14] = (far + near) * nf;
            out[15] = 1;
            return out;
        };

        /**
         * Generates a look-at matrix with the given eye position, focal point, and up axis
         *
         * @param {mat4} out mat4 frustum matrix will be written into
         * @param {vec3} eye Position of the viewer
         * @param {vec3} center Point the viewer is looking at
         * @param {vec3} up vec3 pointing up
         * @returns {mat4} out
         */
        mat4.lookAt = function (out, eye, center, up) {
            var x0, x1, x2, y0, y1, y2, z0, z1, z2, len,
                eyex = eye[0],
                eyey = eye[1],
                eyez = eye[2],
                upx = up[0],
                upy = up[1],
                upz = up[2],
                centerx = center[0],
                centery = center[1],
                centerz = center[2];

            if (Math.abs(eyex - centerx) < GLMAT_EPSILON &&
                Math.abs(eyey - centery) < GLMAT_EPSILON &&
                Math.abs(eyez - centerz) < GLMAT_EPSILON) {
                return mat4.identity(out);
            }

            z0 = eyex - centerx;
            z1 = eyey - centery;
            z2 = eyez - centerz;

            len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
            z0 *= len;
            z1 *= len;
            z2 *= len;

            x0 = upy * z2 - upz * z1;
            x1 = upz * z0 - upx * z2;
            x2 = upx * z1 - upy * z0;
            len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);
            if (!len) {
                x0 = 0;
                x1 = 0;
                x2 = 0;
            } else {
                len = 1 / len;
                x0 *= len;
                x1 *= len;
                x2 *= len;
            }

            y0 = z1 * x2 - z2 * x1;
            y1 = z2 * x0 - z0 * x2;
            y2 = z0 * x1 - z1 * x0;

            len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);
            if (!len) {
                y0 = 0;
                y1 = 0;
                y2 = 0;
            } else {
                len = 1 / len;
                y0 *= len;
                y1 *= len;
                y2 *= len;
            }

            out[0] = x0;
            out[1] = y0;
            out[2] = z0;
            out[3] = 0;
            out[4] = x1;
            out[5] = y1;
            out[6] = z1;
            out[7] = 0;
            out[8] = x2;
            out[9] = y2;
            out[10] = z2;
            out[11] = 0;
            out[12] = -(x0 * eyex + x1 * eyey + x2 * eyez);
            out[13] = -(y0 * eyex + y1 * eyey + y2 * eyez);
            out[14] = -(z0 * eyex + z1 * eyey + z2 * eyez);
            out[15] = 1;

            return out;
        };

        /**
         * Returns a string representation of a mat4
         *
         * @param {mat4} mat matrix to represent as a string
         * @returns {String} string representation of the matrix
         */
        mat4.str = function (a) {
            return 'mat4(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ', ' +
                a[4] + ', ' + a[5] + ', ' + a[6] + ', ' + a[7] + ', ' +
                a[8] + ', ' + a[9] + ', ' + a[10] + ', ' + a[11] + ', ' +
                a[12] + ', ' + a[13] + ', ' + a[14] + ', ' + a[15] + ')';
        };

        if(typeof(exports) !== 'undefined') {
            exports.mat4 = mat4;
        }
        ;
        /* Copyright (c) 2013, Brandon Jones, Colin MacKenzie IV. All rights reserved.

         Redistribution and use in source and binary forms, with or without modification,
         are permitted provided that the following conditions are met:

         * Redistributions of source code must retain the above copyright notice, this
         list of conditions and the following disclaimer.
         * Redistributions in binary form must reproduce the above copyright notice,
         this list of conditions and the following disclaimer in the documentation
         and/or other materials provided with the distribution.

         THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
         ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
         WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
         DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR
         ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
         (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
         LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
         ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
         (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
         SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE. */

        /**
         * @class Quaternion
         * @name quat
         */

        var quat = {};

        /**
         * Creates a new identity quat
         *
         * @returns {quat} a new quaternion
         */
        quat.create = function() {
            var out = new GLMAT_ARRAY_TYPE(4);
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        };

        /**
         * Sets a quaternion to represent the shortest rotation from one
         * vector to another.
         *
         * Both vectors are assumed to be unit length.
         *
         * @param {quat} out the receiving quaternion.
         * @param {vec3} a the initial vector
         * @param {vec3} b the destination vector
         * @returns {quat} out
         */
        quat.rotationTo = (function() {
            var tmpvec3 = vec3.create();
            var xUnitVec3 = vec3.fromValues(1,0,0);
            var yUnitVec3 = vec3.fromValues(0,1,0);

            return function(out, a, b) {
                var dot = vec3.dot(a, b);
                if (dot < -0.999999) {
                    vec3.cross(tmpvec3, xUnitVec3, a);
                    if (vec3.length(tmpvec3) < 0.000001)
                        vec3.cross(tmpvec3, yUnitVec3, a);
                    vec3.normalize(tmpvec3, tmpvec3);
                    quat.setAxisAngle(out, tmpvec3, Math.PI);
                    return out;
                } else if (dot > 0.999999) {
                    out[0] = 0;
                    out[1] = 0;
                    out[2] = 0;
                    out[3] = 1;
                    return out;
                } else {
                    vec3.cross(tmpvec3, a, b);
                    out[0] = tmpvec3[0];
                    out[1] = tmpvec3[1];
                    out[2] = tmpvec3[2];
                    out[3] = 1 + dot;
                    return quat.normalize(out, out);
                }
            };
        })();

        /**
         * Sets the specified quaternion with values corresponding to the given
         * axes. Each axis is a vec3 and is expected to be unit length and
         * perpendicular to all other specified axes.
         *
         * @param {vec3} view  the vector representing the viewing direction
         * @param {vec3} right the vector representing the local "right" direction
         * @param {vec3} up    the vector representing the local "up" direction
         * @returns {quat} out
         */
        quat.setAxes = (function() {
            var matr = mat3.create();

            return function(out, view, right, up) {
                matr[0] = right[0];
                matr[3] = right[1];
                matr[6] = right[2];

                matr[1] = up[0];
                matr[4] = up[1];
                matr[7] = up[2];

                matr[2] = -view[0];
                matr[5] = -view[1];
                matr[8] = -view[2];

                return quat.normalize(out, quat.fromMat3(out, matr));
            };
        })();

        /**
         * Creates a new quat initialized with values from an existing quaternion
         *
         * @param {quat} a quaternion to clone
         * @returns {quat} a new quaternion
         * @function
         */
        quat.clone = vec4.clone;

        /**
         * Creates a new quat initialized with the given values
         *
         * @param {Number} x X component
         * @param {Number} y Y component
         * @param {Number} z Z component
         * @param {Number} w W component
         * @returns {quat} a new quaternion
         * @function
         */
        quat.fromValues = vec4.fromValues;

        /**
         * Copy the values from one quat to another
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a the source quaternion
         * @returns {quat} out
         * @function
         */
        quat.copy = vec4.copy;

        /**
         * Set the components of a quat to the given values
         *
         * @param {quat} out the receiving quaternion
         * @param {Number} x X component
         * @param {Number} y Y component
         * @param {Number} z Z component
         * @param {Number} w W component
         * @returns {quat} out
         * @function
         */
        quat.set = vec4.set;

        /**
         * Set a quat to the identity quaternion
         *
         * @param {quat} out the receiving quaternion
         * @returns {quat} out
         */
        quat.identity = function(out) {
            out[0] = 0;
            out[1] = 0;
            out[2] = 0;
            out[3] = 1;
            return out;
        };

        /**
         * Sets a quat from the given angle and rotation axis,
         * then returns it.
         *
         * @param {quat} out the receiving quaternion
         * @param {vec3} axis the axis around which to rotate
         * @param {Number} rad the angle in radians
         * @returns {quat} out
         **/
        quat.setAxisAngle = function(out, axis, rad) {
            rad = rad * 0.5;
            var s = Math.sin(rad);
            out[0] = s * axis[0];
            out[1] = s * axis[1];
            out[2] = s * axis[2];
            out[3] = Math.cos(rad);
            return out;
        };

        /**
         * Adds two quat's
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a the first operand
         * @param {quat} b the second operand
         * @returns {quat} out
         * @function
         */
        quat.add = vec4.add;

        /**
         * Multiplies two quat's
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a the first operand
         * @param {quat} b the second operand
         * @returns {quat} out
         */
        quat.multiply = function(out, a, b) {
            var ax = a[0], ay = a[1], az = a[2], aw = a[3],
                bx = b[0], by = b[1], bz = b[2], bw = b[3];

            out[0] = ax * bw + aw * bx + ay * bz - az * by;
            out[1] = ay * bw + aw * by + az * bx - ax * bz;
            out[2] = az * bw + aw * bz + ax * by - ay * bx;
            out[3] = aw * bw - ax * bx - ay * by - az * bz;
            return out;
        };

        /**
         * Alias for {@link quat.multiply}
         * @function
         */
        quat.mul = quat.multiply;

        /**
         * Scales a quat by a scalar number
         *
         * @param {quat} out the receiving vector
         * @param {quat} a the vector to scale
         * @param {Number} b amount to scale the vector by
         * @returns {quat} out
         * @function
         */
        quat.scale = vec4.scale;

        /**
         * Rotates a quaternion by the given angle about the X axis
         *
         * @param {quat} out quat receiving operation result
         * @param {quat} a quat to rotate
         * @param {number} rad angle (in radians) to rotate
         * @returns {quat} out
         */
        quat.rotateX = function (out, a, rad) {
            rad *= 0.5;

            var ax = a[0], ay = a[1], az = a[2], aw = a[3],
                bx = Math.sin(rad), bw = Math.cos(rad);

            out[0] = ax * bw + aw * bx;
            out[1] = ay * bw + az * bx;
            out[2] = az * bw - ay * bx;
            out[3] = aw * bw - ax * bx;
            return out;
        };

        /**
         * Rotates a quaternion by the given angle about the Y axis
         *
         * @param {quat} out quat receiving operation result
         * @param {quat} a quat to rotate
         * @param {number} rad angle (in radians) to rotate
         * @returns {quat} out
         */
        quat.rotateY = function (out, a, rad) {
            rad *= 0.5;

            var ax = a[0], ay = a[1], az = a[2], aw = a[3],
                by = Math.sin(rad), bw = Math.cos(rad);

            out[0] = ax * bw - az * by;
            out[1] = ay * bw + aw * by;
            out[2] = az * bw + ax * by;
            out[3] = aw * bw - ay * by;
            return out;
        };

        /**
         * Rotates a quaternion by the given angle about the Z axis
         *
         * @param {quat} out quat receiving operation result
         * @param {quat} a quat to rotate
         * @param {number} rad angle (in radians) to rotate
         * @returns {quat} out
         */
        quat.rotateZ = function (out, a, rad) {
            rad *= 0.5;

            var ax = a[0], ay = a[1], az = a[2], aw = a[3],
                bz = Math.sin(rad), bw = Math.cos(rad);

            out[0] = ax * bw + ay * bz;
            out[1] = ay * bw - ax * bz;
            out[2] = az * bw + aw * bz;
            out[3] = aw * bw - az * bz;
            return out;
        };

        /**
         * Calculates the W component of a quat from the X, Y, and Z components.
         * Assumes that quaternion is 1 unit in length.
         * Any existing W component will be ignored.
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a quat to calculate W component of
         * @returns {quat} out
         */
        quat.calculateW = function (out, a) {
            var x = a[0], y = a[1], z = a[2];

            out[0] = x;
            out[1] = y;
            out[2] = z;
            out[3] = -Math.sqrt(Math.abs(1.0 - x * x - y * y - z * z));
            return out;
        };

        /**
         * Calculates the dot product of two quat's
         *
         * @param {quat} a the first operand
         * @param {quat} b the second operand
         * @returns {Number} dot product of a and b
         * @function
         */
        quat.dot = vec4.dot;

        /**
         * Performs a linear interpolation between two quat's
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a the first operand
         * @param {quat} b the second operand
         * @param {Number} t interpolation amount between the two inputs
         * @returns {quat} out
         * @function
         */
        quat.lerp = vec4.lerp;

        /**
         * Performs a spherical linear interpolation between two quat
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a the first operand
         * @param {quat} b the second operand
         * @param {Number} t interpolation amount between the two inputs
         * @returns {quat} out
         */
        quat.slerp = function (out, a, b, t) {
            // benchmarks:
            //    http://jsperf.com/quaternion-slerp-implementations

            var ax = a[0], ay = a[1], az = a[2], aw = a[3],
                bx = b[0], by = b[1], bz = b[2], bw = b[3];

            var        omega, cosom, sinom, scale0, scale1;

            // calc cosine
            cosom = ax * bx + ay * by + az * bz + aw * bw;
            // adjust signs (if necessary)
            if ( cosom < 0.0 ) {
                cosom = -cosom;
                bx = - bx;
                by = - by;
                bz = - bz;
                bw = - bw;
            }
            // calculate coefficients
            if ( (1.0 - cosom) > 0.000001 ) {
                // standard case (slerp)
                omega  = Math.acos(cosom);
                sinom  = Math.sin(omega);
                scale0 = Math.sin((1.0 - t) * omega) / sinom;
                scale1 = Math.sin(t * omega) / sinom;
            } else {
                // "from" and "to" quaternions are very close
                //  ... so we can do a linear interpolation
                scale0 = 1.0 - t;
                scale1 = t;
            }
            // calculate final values
            out[0] = scale0 * ax + scale1 * bx;
            out[1] = scale0 * ay + scale1 * by;
            out[2] = scale0 * az + scale1 * bz;
            out[3] = scale0 * aw + scale1 * bw;

            return out;
        };

        /**
         * Calculates the inverse of a quat
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a quat to calculate inverse of
         * @returns {quat} out
         */
        quat.invert = function(out, a) {
            var a0 = a[0], a1 = a[1], a2 = a[2], a3 = a[3],
                dot = a0*a0 + a1*a1 + a2*a2 + a3*a3,
                invDot = dot ? 1.0/dot : 0;

            // TODO: Would be faster to return [0,0,0,0] immediately if dot == 0

            out[0] = -a0*invDot;
            out[1] = -a1*invDot;
            out[2] = -a2*invDot;
            out[3] = a3*invDot;
            return out;
        };

        /**
         * Calculates the conjugate of a quat
         * If the quaternion is normalized, this function is faster than quat.inverse and produces the same result.
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a quat to calculate conjugate of
         * @returns {quat} out
         */
        quat.conjugate = function (out, a) {
            out[0] = -a[0];
            out[1] = -a[1];
            out[2] = -a[2];
            out[3] = a[3];
            return out;
        };

        /**
         * Calculates the length of a quat
         *
         * @param {quat} a vector to calculate length of
         * @returns {Number} length of a
         * @function
         */
        quat.length = vec4.length;

        /**
         * Alias for {@link quat.length}
         * @function
         */
        quat.len = quat.length;

        /**
         * Calculates the squared length of a quat
         *
         * @param {quat} a vector to calculate squared length of
         * @returns {Number} squared length of a
         * @function
         */
        quat.squaredLength = vec4.squaredLength;

        /**
         * Alias for {@link quat.squaredLength}
         * @function
         */
        quat.sqrLen = quat.squaredLength;

        /**
         * Normalize a quat
         *
         * @param {quat} out the receiving quaternion
         * @param {quat} a quaternion to normalize
         * @returns {quat} out
         * @function
         */
        quat.normalize = vec4.normalize;

        /**
         * Creates a quaternion from the given 3x3 rotation matrix.
         *
         * NOTE: The resultant quaternion is not normalized, so you should be sure
         * to renormalize the quaternion yourself where necessary.
         *
         * @param {quat} out the receiving quaternion
         * @param {mat3} m rotation matrix
         * @returns {quat} out
         * @function
         */
        quat.fromMat3 = function(out, m) {
            // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
            // article "Quaternion Calculus and Fast Animation".
            var fTrace = m[0] + m[4] + m[8];
            var fRoot;

            if ( fTrace > 0.0 ) {
                // |w| > 1/2, may as well choose w > 1/2
                fRoot = Math.sqrt(fTrace + 1.0);  // 2w
                out[3] = 0.5 * fRoot;
                fRoot = 0.5/fRoot;  // 1/(4w)
                out[0] = (m[7]-m[5])*fRoot;
                out[1] = (m[2]-m[6])*fRoot;
                out[2] = (m[3]-m[1])*fRoot;
            } else {
                // |w| <= 1/2
                var i = 0;
                if ( m[4] > m[0] )
                    i = 1;
                if ( m[8] > m[i*3+i] )
                    i = 2;
                var j = (i+1)%3;
                var k = (i+2)%3;

                fRoot = Math.sqrt(m[i*3+i]-m[j*3+j]-m[k*3+k] + 1.0);
                out[i] = 0.5 * fRoot;
                fRoot = 0.5 / fRoot;
                out[3] = (m[k*3+j] - m[j*3+k]) * fRoot;
                out[j] = (m[j*3+i] + m[i*3+j]) * fRoot;
                out[k] = (m[k*3+i] + m[i*3+k]) * fRoot;
            }

            return out;
        };

        /**
         * Returns a string representation of a quatenion
         *
         * @param {quat} vec vector to represent as a string
         * @returns {String} string representation of the vector
         */
        quat.str = function (a) {
            return 'quat(' + a[0] + ', ' + a[1] + ', ' + a[2] + ', ' + a[3] + ')';
        };

        if(typeof(exports) !== 'undefined') {
            exports.quat = quat;
        }
        ;
    })(shim.exports);


var dat=dat||{};dat.gui=dat.gui||{};dat.utils=dat.utils||{};dat.controllers=dat.controllers||{};dat.dom=dat.dom||{};dat.color=dat.color||{};dat.utils.css=(function(){return{load:function(a,c){c=c||document;var b=c.createElement("link");b.type="text/css";b.rel="stylesheet";b.href=a;c.getElementsByTagName("head")[0].appendChild(b)},inject:function(b,c){c=c||document;var a=document.createElement("style");a.type="text/css";a.innerHTML=b;c.getElementsByTagName("head")[0].appendChild(a)}}})();dat.utils.common=(function(){var a=Array.prototype.forEach;var b=Array.prototype.slice;return{BREAK:{},extend:function(c){this.each(b.call(arguments,1),function(e){for(var d in e){if(!this.isUndefined(e[d])){c[d]=e[d]}}},this);return c},defaults:function(c){this.each(b.call(arguments,1),function(e){for(var d in e){if(this.isUndefined(c[d])){c[d]=e[d]}}},this);return c},compose:function(){var c=b.call(arguments);return function(){var d=b.call(arguments);for(var e=c.length-1;e>=0;e--){d=[c[e].apply(this,d)]}return d[0]}},each:function(g,f,e){if(a&&g.forEach===a){g.forEach(f,e)}else{if(g.length===g.length+0){for(var d=0,c=g.length;d<c;d++){if(d in g&&f.call(e,g[d],d)===this.BREAK){return}}}else{for(var d in g){if(f.call(e,g[d],d)===this.BREAK){return}}}}},defer:function(c){setTimeout(c,0)},toArray:function(c){if(c.toArray){return c.toArray()}return b.call(c)},isUndefined:function(c){return c===undefined},isNull:function(c){return c===null},isNaN:function(c){return c!==c},isArray:Array.isArray||function(c){return c.constructor===Array},isObject:function(c){return c===Object(c)},isNumber:function(c){return c===c+0},isString:function(c){return c===c+""},isBoolean:function(c){return c===false||c===true},isFunction:function(c){return Object.prototype.toString.call(c)==="[object Function]"}}})();dat.controllers.Controller=(function(a){var b=function(c,d){this.initialValue=c[d];this.domElement=document.createElement("div");this.object=c;this.property=d;this.__onChange=undefined;this.__onFinishChange=undefined};a.extend(b.prototype,{onChange:function(c){this.__onChange=c;return this},onFinishChange:function(c){this.__onFinishChange=c;return this},setValue:function(c){this.object[this.property]=c;if(this.__onChange){this.__onChange.call(this,c)}this.updateDisplay();return this},getValue:function(){return this.object[this.property]},updateDisplay:function(){return this},isModified:function(){return this.initialValue!==this.getValue()}});return b})(dat.utils.common);dat.dom.dom=(function(b){var f={HTMLEvents:["change"],MouseEvents:["click","mousemove","mousedown","mouseup","mouseover"],KeyboardEvents:["keydown"]};var e={};b.each(f,function(h,g){b.each(h,function(i){e[i]=g})});var a=/(\d+(\.\d+)?)px/;function c(h){if(h==="0"||b.isUndefined(h)){return 0}var g=h.match(a);if(!b.isNull(g)){return parseFloat(g[1])}return 0}var d={makeSelectable:function(h,g){if(h===undefined||h.style===undefined){return}h.onselectstart=g?function(){return false}:function(){};h.style.MozUserSelect=g?"auto":"none";h.style.KhtmlUserSelect=g?"auto":"none";h.unselectable=g?"on":"off"},makeFullscreen:function(i,g,h){if(b.isUndefined(g)){g=true}if(b.isUndefined(h)){h=true}i.style.position="absolute";if(g){i.style.left=0;i.style.right=0}if(h){i.style.top=0;i.style.bottom=0}},fakeEvent:function(k,i,l,j){l=l||{};var m=e[i];if(!m){throw new Error("Event type "+i+" not supported.")}var n=document.createEvent(m);switch(m){case"MouseEvents":var h=l.x||l.clientX||0;var g=l.y||l.clientY||0;n.initMouseEvent(i,l.bubbles||false,l.cancelable||true,window,l.clickCount||1,0,0,h,g,false,false,false,false,0,null);break;case"KeyboardEvents":var o=n.initKeyboardEvent||n.initKeyEvent;b.defaults(l,{cancelable:true,ctrlKey:false,altKey:false,shiftKey:false,metaKey:false,keyCode:undefined,charCode:undefined});o(i,l.bubbles||false,l.cancelable,window,l.ctrlKey,l.altKey,l.shiftKey,l.metaKey,l.keyCode,l.charCode);break;default:n.initEvent(i,l.bubbles||false,l.cancelable||true);break}b.defaults(n,j);k.dispatchEvent(n)},bind:function(j,i,h,g){g=g||false;if(j.addEventListener){j.addEventListener(i,h,g)}else{if(j.attachEvent){j.attachEvent("on"+i,h)}}return d},unbind:function(j,i,h,g){g=g||false;if(j.removeEventListener){j.removeEventListener(i,h,g)}else{if(j.detachEvent){j.detachEvent("on"+i,h)}}return d},addClass:function(i,h){if(i.className===undefined){i.className=h}else{if(i.className!==h){var g=i.className.split(/ +/);if(g.indexOf(h)==-1){g.push(h);i.className=g.join(" ").replace(/^\s+/,"").replace(/\s+$/,"")}}}return d},removeClass:function(j,i){if(i){if(j.className===undefined){}else{if(j.className===i){j.removeAttribute("class")}else{var h=j.className.split(/ +/);var g=h.indexOf(i);if(g!=-1){h.splice(g,1);j.className=h.join(" ")}}}}else{j.className=undefined}return d},hasClass:function(h,g){return new RegExp("(?:^|\\s+)"+g+"(?:\\s+|$)").test(h.className)||false},getWidth:function(h){var g=getComputedStyle(h);return c(g["border-left-width"])+c(g["border-right-width"])+c(g["padding-left"])+c(g["padding-right"])+c(g.width)},getHeight:function(h){var g=getComputedStyle(h);return c(g["border-top-width"])+c(g["border-bottom-width"])+c(g["padding-top"])+c(g["padding-bottom"])+c(g.height)},getOffset:function(g){var h={left:0,top:0};if(g.offsetParent){do{h.left+=g.offsetLeft;h.top+=g.offsetTop}while(g=g.offsetParent)}return h},isActive:function(g){return g===document.activeElement&&(g.type||g.href)}};return d})(dat.utils.common);dat.controllers.OptionController=(function(c,d,a){var b=function(f,g,e){b.superclass.call(this,f,g);var i=this;this.__select=document.createElement("select");if(a.isArray(e)){var h={};a.each(e,function(j){h[j]=j});e=h}a.each(e,function(l,k){var j=document.createElement("option");j.innerHTML=k;j.setAttribute("value",l);i.__select.appendChild(j)});this.updateDisplay();d.bind(this.__select,"change",function(){var j=this.options[this.selectedIndex].value;i.setValue(j)});this.domElement.appendChild(this.__select)};b.superclass=c;a.extend(b.prototype,c.prototype,{setValue:function(e){var f=b.superclass.prototype.setValue.call(this,e);if(this.__onFinishChange){this.__onFinishChange.call(this,this.getValue())}return f},updateDisplay:function(){this.__select.value=this.getValue();return b.superclass.prototype.updateDisplay.call(this)}});return b})(dat.controllers.Controller,dat.dom.dom,dat.utils.common);dat.controllers.NumberController=(function(d,b){var c=function(e,f,g){c.superclass.call(this,e,f);g=g||{};this.__min=g.min;this.__max=g.max;this.__step=g.step;if(b.isUndefined(this.__step)){if(this.initialValue==0){this.__impliedStep=1}else{this.__impliedStep=Math.pow(10,Math.floor(Math.log(this.initialValue)/Math.LN10))/10}}else{this.__impliedStep=this.__step}this.__precision=a(this.__impliedStep)};c.superclass=d;b.extend(c.prototype,d.prototype,{setValue:function(e){if(this.__min!==undefined&&e<this.__min){e=this.__min}else{if(this.__max!==undefined&&e>this.__max){e=this.__max}}if(this.__step!==undefined&&e%this.__step!=0){e=Math.round(e/this.__step)*this.__step}return c.superclass.prototype.setValue.call(this,e)},min:function(e){this.__min=e;return this},max:function(e){this.__max=e;return this},step:function(e){this.__step=e;return this}});function a(e){e=e.toString();if(e.indexOf(".")>-1){return e.length-e.indexOf(".")-1}else{return 0}}return c})(dat.controllers.Controller,dat.utils.common);dat.controllers.NumberControllerBox=(function(d,e,c){var b=function(h,o,g){this.__truncationSuspended=false;b.superclass.call(this,h,o,g);var l=this;var j;this.__input=document.createElement("input");this.__input.setAttribute("type","text");e.bind(this.__input,"change",m);e.bind(this.__input,"blur",f);e.bind(this.__input,"mousedown",n);e.bind(this.__input,"keydown",function(p){if(p.keyCode===13){l.__truncationSuspended=true;this.blur();l.__truncationSuspended=false}});function m(){var p=parseFloat(l.__input.value);if(!c.isNaN(p)){l.setValue(p)}}function f(){m();if(l.__onFinishChange){l.__onFinishChange.call(l,l.getValue())}}function n(p){e.bind(window,"mousemove",i);e.bind(window,"mouseup",k);j=p.clientY}function i(q){var p=j-q.clientY;l.setValue(l.getValue()+p*l.__impliedStep);j=q.clientY}function k(){e.unbind(window,"mousemove",i);e.unbind(window,"mouseup",k)}this.updateDisplay();this.domElement.appendChild(this.__input)};b.superclass=d;c.extend(b.prototype,d.prototype,{updateDisplay:function(){this.__input.value=this.__truncationSuspended?this.getValue():a(this.getValue(),this.__precision);return b.superclass.prototype.updateDisplay.call(this)}});function a(g,f){var h=Math.pow(10,f);return Math.round(g*h)/h}return b})(dat.controllers.NumberController,dat.dom.dom,dat.utils.common);dat.controllers.NumberControllerSlider=(function(d,f,a,b,g){var c=function(i,p,j,n,h){c.superclass.call(this,i,p,{min:j,max:n,step:h});var m=this;this.__background=document.createElement("div");this.__foreground=document.createElement("div");f.bind(this.__background,"mousedown",o);f.addClass(this.__background,"slider");f.addClass(this.__foreground,"slider-fg");function o(q){f.bind(window,"mousemove",k);f.bind(window,"mouseup",l);k(q)}function k(r){r.preventDefault();var s=f.getOffset(m.__background);var q=f.getWidth(m.__background);m.setValue(e(r.clientX,s.left,s.left+q,m.__min,m.__max));return false}function l(){f.unbind(window,"mousemove",k);f.unbind(window,"mouseup",l);if(m.__onFinishChange){m.__onFinishChange.call(m,m.getValue())}}this.updateDisplay();this.__background.appendChild(this.__foreground);this.domElement.appendChild(this.__background)};c.superclass=d;c.useDefaultStyles=function(){a.inject(g)};b.extend(c.prototype,d.prototype,{updateDisplay:function(){var h=(this.getValue()-this.__min)/(this.__max-this.__min);this.__foreground.style.width=h*100+"%";return c.superclass.prototype.updateDisplay.call(this)}});function e(h,k,i,l,j){return l+(j-l)*((h-k)/(i-k))}return c})(dat.controllers.NumberController,dat.dom.dom,dat.utils.css,dat.utils.common,".slider {\n  box-shadow: inset 0 2px 4px rgba(0,0,0,0.15);\n  height: 1em;\n  border-radius: 1em;\n  background-color: #eee;\n  padding: 0 0.5em;\n  overflow: hidden;\n}\n\n.slider-fg {\n  padding: 1px 0 2px 0;\n  background-color: #aaa;\n  height: 1em;\n  margin-left: -0.5em;\n  padding-right: 0.5em;\n  border-radius: 1em 0 0 1em;\n}\n\n.slider-fg:after {\n  display: inline-block;\n  border-radius: 1em;\n  background-color: #fff;\n  border:  1px solid #aaa;\n  content: '';\n  float: right;\n  margin-right: -1em;\n  margin-top: -1px;\n  height: 0.9em;\n  width: 0.9em;\n}");dat.controllers.FunctionController=(function(b,c,a){var d=function(e,f,g){d.superclass.call(this,e,f);var h=this;this.__button=document.createElement("div");this.__button.innerHTML=g===undefined?"Fire":g;c.bind(this.__button,"click",function(i){i.preventDefault();h.fire();return false});c.addClass(this.__button,"button");this.domElement.appendChild(this.__button)};d.superclass=b;a.extend(d.prototype,b.prototype,{fire:function(){if(this.__onChange){this.__onChange.call(this)}if(this.__onFinishChange){this.__onFinishChange.call(this,this.getValue())}this.getValue().call(this.object)}});return d})(dat.controllers.Controller,dat.dom.dom,dat.utils.common);dat.controllers.BooleanController=(function(c,d,a){var b=function(f,g){b.superclass.call(this,f,g);var h=this;this.__prev=this.getValue();this.__checkbox=document.createElement("input");this.__checkbox.setAttribute("type","checkbox");d.bind(this.__checkbox,"change",e,false);this.domElement.appendChild(this.__checkbox);this.updateDisplay();function e(){h.setValue(!h.__prev)}};b.superclass=c;a.extend(b.prototype,c.prototype,{setValue:function(e){var f=b.superclass.prototype.setValue.call(this,e);if(this.__onFinishChange){this.__onFinishChange.call(this,this.getValue())}this.__prev=this.getValue();return f},updateDisplay:function(){if(this.getValue()===true){this.__checkbox.setAttribute("checked","checked");this.__checkbox.checked=true}else{this.__checkbox.checked=false}return b.superclass.prototype.updateDisplay.call(this)}});return b})(dat.controllers.Controller,dat.dom.dom,dat.utils.common);dat.color.toString=(function(a){return function(b){if(b.a==1||a.isUndefined(b.a)){var c=b.hex.toString(16);while(c.length<6){c="0"+c}return"#"+c}else{return"rgba("+Math.round(b.r)+","+Math.round(b.g)+","+Math.round(b.b)+","+b.a+")"}}})(dat.utils.common);dat.color.interpret=(function(d,c){var a,f;var b=function(){f=false;var g=arguments.length>1?c.toArray(arguments):arguments[0];c.each(e,function(h){if(h.litmus(g)){c.each(h.conversions,function(j,i){a=j.read(g);if(f===false&&a!==false){f=a;a.conversionName=i;a.conversion=j;return c.BREAK}});return c.BREAK}});return f};var e=[{litmus:c.isString,conversions:{THREE_CHAR_HEX:{read:function(g){var h=g.match(/^#([A-F0-9])([A-F0-9])([A-F0-9])$/i);if(h===null){return false}return{space:"HEX",hex:parseInt("0x"+h[1].toString()+h[1].toString()+h[2].toString()+h[2].toString()+h[3].toString()+h[3].toString())}},write:d},SIX_CHAR_HEX:{read:function(g){var h=g.match(/^#([A-F0-9]{6})$/i);if(h===null){return false}return{space:"HEX",hex:parseInt("0x"+h[1].toString())}},write:d},CSS_RGB:{read:function(g){var h=g.match(/^rgb\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\)/);if(h===null){return false}return{space:"RGB",r:parseFloat(h[1]),g:parseFloat(h[2]),b:parseFloat(h[3])}},write:d},CSS_RGBA:{read:function(g){var h=g.match(/^rgba\(\s*(.+)\s*,\s*(.+)\s*,\s*(.+)\s*\,\s*(.+)\s*\)/);if(h===null){return false}return{space:"RGB",r:parseFloat(h[1]),g:parseFloat(h[2]),b:parseFloat(h[3]),a:parseFloat(h[4])}},write:d}}},{litmus:c.isNumber,conversions:{HEX:{read:function(g){return{space:"HEX",hex:g,conversionName:"HEX"}},write:function(g){return g.hex}}}},{litmus:c.isArray,conversions:{RGB_ARRAY:{read:function(g){if(g.length!=3){return false}return{space:"RGB",r:g[0],g:g[1],b:g[2]}},write:function(g){return[g.r,g.g,g.b]}},RGBA_ARRAY:{read:function(g){if(g.length!=4){return false}return{space:"RGB",r:g[0],g:g[1],b:g[2],a:g[3]}},write:function(g){return[g.r,g.g,g.b,g.a]}}}},{litmus:c.isObject,conversions:{RGBA_OBJ:{read:function(g){if(c.isNumber(g.r)&&c.isNumber(g.g)&&c.isNumber(g.b)&&c.isNumber(g.a)){return{space:"RGB",r:g.r,g:g.g,b:g.b,a:g.a}}return false},write:function(g){return{r:g.r,g:g.g,b:g.b,a:g.a}}},RGB_OBJ:{read:function(g){if(c.isNumber(g.r)&&c.isNumber(g.g)&&c.isNumber(g.b)){return{space:"RGB",r:g.r,g:g.g,b:g.b}}return false},write:function(g){return{r:g.r,g:g.g,b:g.b}}},HSVA_OBJ:{read:function(g){if(c.isNumber(g.h)&&c.isNumber(g.s)&&c.isNumber(g.v)&&c.isNumber(g.a)){return{space:"HSV",h:g.h,s:g.s,v:g.v,a:g.a}}return false},write:function(g){return{h:g.h,s:g.s,v:g.v,a:g.a}}},HSV_OBJ:{read:function(g){if(c.isNumber(g.h)&&c.isNumber(g.s)&&c.isNumber(g.v)){return{space:"HSV",h:g.h,s:g.s,v:g.v}}return false},write:function(g){return{h:g.h,s:g.s,v:g.v}}}}}];return b})(dat.color.toString,dat.utils.common);dat.GUI=dat.gui.GUI=(function(E,G,i,h,f,y,o,r,L,A,t,l,j,c,s){E.inject(i);var B="dg";var z=72;var k=20;var b="Default";var a=(function(){try{return"localStorage" in window&&window.localStorage}catch(N){return false}})();var w;var M=true;var p;var H=false;var D=[];var g=function(R){var S=this;this.domElement=document.createElement("div");this.__ul=document.createElement("ul");this.domElement.appendChild(this.__ul);c.addClass(this.domElement,B);this.__folders={};this.__controllers=[];this.__rememberedObjects=[];this.__rememberedObjectIndecesToControllers=[];this.__listening=[];R=R||{};R=s.defaults(R,{autoPlace:true,width:g.DEFAULT_WIDTH});R=s.defaults(R,{resizable:R.autoPlace,hideable:R.autoPlace});if(!s.isUndefined(R.load)){if(R.preset){R.load.preset=R.preset}}else{R.load={preset:b}}if(s.isUndefined(R.parent)&&R.hideable){D.push(this)}R.resizable=s.isUndefined(R.parent)&&R.resizable;if(R.autoPlace&&s.isUndefined(R.scrollable)){R.scrollable=true}var U=a&&localStorage.getItem(q(this,"isLocal"))==="true";Object.defineProperties(this,{parent:{get:function(){return R.parent}},scrollable:{get:function(){return R.scrollable}},autoPlace:{get:function(){return R.autoPlace}},preset:{get:function(){if(S.parent){return S.getRoot().preset}else{return R.load.preset}},set:function(X){if(S.parent){S.getRoot().preset=X}else{R.load.preset=X}u(this);S.revert()}},width:{get:function(){return R.width},set:function(X){R.width=X;I(S,X)}},name:{get:function(){return R.name},set:function(X){R.name=X;if(O){O.innerHTML=R.name}}},closed:{get:function(){return R.closed},set:function(X){R.closed=X;if(R.closed){c.addClass(S.__ul,g.CLASS_CLOSED)}else{c.removeClass(S.__ul,g.CLASS_CLOSED)}this.onResize();if(S.__closeButton){S.__closeButton.innerHTML=X?g.TEXT_OPEN:g.TEXT_CLOSED}}},load:{get:function(){return R.load}},useLocalStorage:{get:function(){return U},set:function(X){if(a){U=X;if(X){c.bind(window,"unload",Q)}else{c.unbind(window,"unload",Q)}localStorage.setItem(q(S,"isLocal"),X)}}}});if(s.isUndefined(R.parent)){R.closed=false;c.addClass(this.domElement,g.CLASS_MAIN);c.makeSelectable(this.domElement,false);if(a){if(U){S.useLocalStorage=true;var N=localStorage.getItem(q(this,"gui"));if(N){R.load=JSON.parse(N)}}}this.__closeButton=document.createElement("div");this.__closeButton.innerHTML=g.TEXT_CLOSED;c.addClass(this.__closeButton,g.CLASS_CLOSE_BUTTON);this.domElement.appendChild(this.__closeButton);c.bind(this.__closeButton,"click",function(){S.closed=!S.closed})}else{if(R.closed===undefined){R.closed=true}var O=document.createTextNode(R.name);c.addClass(O,"controller-name");var V=C(S,O);var W=function(X){X.preventDefault();S.closed=!S.closed;return false};c.addClass(this.__ul,g.CLASS_CLOSED);c.addClass(V,"title");c.bind(V,"click",W);if(!R.closed){this.closed=false}}if(R.autoPlace){if(s.isUndefined(R.parent)){if(M){p=document.createElement("div");c.addClass(p,B);c.addClass(p,g.CLASS_AUTO_PLACE_CONTAINER);document.body.appendChild(p);M=false}p.appendChild(this.domElement);c.addClass(this.domElement,g.CLASS_AUTO_PLACE)}if(!this.parent){I(S,R.width)}}c.bind(window,"resize",function(){S.onResize()});c.bind(this.__ul,"webkitTransitionEnd",function(){S.onResize()});c.bind(this.__ul,"transitionend",function(){S.onResize()});c.bind(this.__ul,"oTransitionEnd",function(){S.onResize()});this.onResize();if(R.resizable){K(this)}function Q(){localStorage.setItem(q(S,"gui"),JSON.stringify(S.getSaveObject()))}var T=S.getRoot();function P(){var X=S.getRoot();X.width+=1;s.defer(function(){X.width-=1})}if(!R.parent){P()}};g.toggleHide=function(){H=!H;s.each(D,function(N){N.domElement.style.zIndex=H?-999:999;N.domElement.style.opacity=H?0:1})};g.CLASS_AUTO_PLACE="a";g.CLASS_AUTO_PLACE_CONTAINER="ac";g.CLASS_MAIN="main";g.CLASS_CONTROLLER_ROW="cr";g.CLASS_TOO_TALL="taller-than-window";g.CLASS_CLOSED="closed";g.CLASS_CLOSE_BUTTON="close-button";g.CLASS_DRAG="drag";g.DEFAULT_WIDTH=245;g.TEXT_CLOSED="Close Controls";g.TEXT_OPEN="Open Controls";c.bind(window,"keydown",function(N){if(document.activeElement.type!=="text"&&(N.which===z||N.keyCode==z)){g.toggleHide()}},false);s.extend(g.prototype,{add:function(N,O){return d(this,N,O,{factoryArgs:Array.prototype.slice.call(arguments,2)})},addColor:function(N,O){return d(this,N,O,{color:true})},remove:function(N){this.__ul.removeChild(N.__li);this.__controllers.slice(this.__controllers.indexOf(N),1);var O=this;s.defer(function(){O.onResize()})},destroy:function(){if(this.autoPlace){p.removeChild(this.domElement)}},addFolder:function(P){if(this.__folders[P]!==undefined){throw new Error('You already have a folder in this GUI by the name "'+P+'"')}var Q={name:P,parent:this};Q.autoPlace=this.autoPlace;if(this.load&&this.load.folders&&this.load.folders[P]){Q.closed=this.load.folders[P].closed;Q.load=this.load.folders[P]}var O=new g(Q);this.__folders[P]=O;var N=C(this,O.domElement);c.addClass(N,"folder");return O},open:function(){this.closed=false},close:function(){this.closed=true},onResize:function(){var N=this.getRoot();if(N.scrollable){var P=c.getOffset(N.__ul).top;var O=0;s.each(N.__ul.childNodes,function(Q){if(!(N.autoPlace&&Q===N.__save_row)){O+=c.getHeight(Q)}});if(window.innerHeight-P-k<O){c.addClass(N.domElement,g.CLASS_TOO_TALL);N.__ul.style.height=window.innerHeight-P-k+"px"}else{c.removeClass(N.domElement,g.CLASS_TOO_TALL);N.__ul.style.height="auto"}}if(N.__resize_handle){s.defer(function(){N.__resize_handle.style.height=N.__ul.offsetHeight+"px"})}if(N.__closeButton){N.__closeButton.style.width=N.width+"px"}},remember:function(){if(s.isUndefined(w)){w=new j();w.domElement.innerHTML=G}if(this.parent){throw new Error("You can only call remember on a top level GUI.")}var N=this;s.each(Array.prototype.slice.call(arguments),function(O){if(N.__rememberedObjects.length==0){v(N)}if(N.__rememberedObjects.indexOf(O)==-1){N.__rememberedObjects.push(O)}});if(this.autoPlace){I(this,this.width)}},getRoot:function(){var N=this;while(N.parent){N=N.parent}return N},getSaveObject:function(){var N=this.load;N.closed=this.closed;if(this.__rememberedObjects.length>0){N.preset=this.preset;if(!N.remembered){N.remembered={}}N.remembered[this.preset]=F(this)}N.folders={};s.each(this.__folders,function(P,O){N.folders[O]=P.getSaveObject()});return N},save:function(){if(!this.load.remembered){this.load.remembered={}}this.load.remembered[this.preset]=F(this);n(this,false)},saveAs:function(N){if(!this.load.remembered){this.load.remembered={};this.load.remembered[b]=F(this,true)}this.load.remembered[N]=F(this);this.preset=N;x(this,N,true)},revert:function(N){s.each(this.__controllers,function(O){if(!this.getRoot().load.remembered){O.setValue(O.initialValue)}else{e(N||this.getRoot(),O)}},this);s.each(this.__folders,function(O){O.revert(O)});if(!N){n(this.getRoot(),false)}},listen:function(N){var O=this.__listening.length==0;this.__listening.push(N);if(O){J(this.__listening)}}});function d(P,R,U,Q){if(R[U]===undefined){throw new Error("Object "+R+' has no property "'+U+'"')}var S;if(Q.color){S=new t(R,U)}else{var V=[R,U].concat(Q.factoryArgs);S=h.apply(P,V)}if(Q.before instanceof f){Q.before=Q.before.__li}e(P,S);c.addClass(S.domElement,"c");var N=document.createElement("span");c.addClass(N,"property-name");N.innerHTML=S.property;var O=document.createElement("div");O.appendChild(N);O.appendChild(S.domElement);var T=C(P,O,Q.before);c.addClass(T,g.CLASS_CONTROLLER_ROW);c.addClass(T,typeof S.getValue());m(P,T,S);P.__controllers.push(S);return S}function C(O,Q,P){var N=document.createElement("li");if(Q){N.appendChild(Q)}if(P){O.__ul.insertBefore(N,params.before)}else{O.__ul.appendChild(N)}O.onResize();return N}function m(P,N,O){O.__li=N;O.__gui=P;s.extend(O,{options:function(S){if(arguments.length>1){O.remove();return d(P,O.object,O.property,{before:O.__li.nextElementSibling,factoryArgs:[s.toArray(arguments)]})}if(s.isArray(S)||s.isObject(S)){O.remove();return d(P,O.object,O.property,{before:O.__li.nextElementSibling,factoryArgs:[S]})}},name:function(S){O.__li.firstElementChild.firstElementChild.innerHTML=S;return O},listen:function(){O.__gui.listen(O);return O},remove:function(){O.__gui.remove(O);return O}});if(O instanceof L){var R=new r(O.object,O.property,{min:O.__min,max:O.__max,step:O.__step});s.each(["updateDisplay","onChange","onFinishChange"],function(U){var S=O[U];var T=R[U];O[U]=R[U]=function(){var V=Array.prototype.slice.call(arguments);S.apply(O,V);return T.apply(R,V)}});c.addClass(N,"has-slider");O.domElement.insertBefore(R.domElement,O.domElement.firstElementChild)}else{if(O instanceof r){var Q=function(S){if(s.isNumber(O.__min)&&s.isNumber(O.__max)){O.remove();return d(P,O.object,O.property,{before:O.__li.nextElementSibling,factoryArgs:[O.__min,O.__max,O.__step]})}return S};O.min=s.compose(Q,O.min);O.max=s.compose(Q,O.max)}else{if(O instanceof y){c.bind(N,"click",function(){c.fakeEvent(O.__checkbox,"click")});c.bind(O.__checkbox,"click",function(S){S.stopPropagation()})}else{if(O instanceof o){c.bind(N,"click",function(){c.fakeEvent(O.__button,"click")});c.bind(N,"mouseover",function(){c.addClass(O.__button,"hover")});c.bind(N,"mouseout",function(){c.removeClass(O.__button,"hover")})}else{if(O instanceof t){c.addClass(N,"color");O.updateDisplay=s.compose(function(S){N.style.borderLeftColor=O.__color.toString();return S},O.updateDisplay);O.updateDisplay()}}}}}O.setValue=s.compose(function(S){if(P.getRoot().__preset_select&&O.isModified()){n(P.getRoot(),true)}return S},O.setValue)}function e(P,O){var N=P.getRoot();var U=N.__rememberedObjects.indexOf(O.object);if(U!=-1){var R=N.__rememberedObjectIndecesToControllers[U];if(R===undefined){R={};N.__rememberedObjectIndecesToControllers[U]=R}R[O.property]=O;if(N.load&&N.load.remembered){var Q=N.load.remembered;var S;if(Q[P.preset]){S=Q[P.preset]}else{if(Q[b]){S=Q[b]}else{return}}if(S[U]&&S[U][O.property]!==undefined){var T=S[U][O.property];O.initialValue=T;O.setValue(T)}}}}function q(N,O){return document.location.href+"."+O}function v(Q){var N=Q.__save_row=document.createElement("li");c.addClass(Q.domElement,"has-save");Q.__ul.insertBefore(N,Q.__ul.firstChild);c.addClass(N,"save-row");var P=document.createElement("span");P.innerHTML="&nbsp;";c.addClass(P,"button gears");var R=document.createElement("span");R.innerHTML="Save";c.addClass(R,"button");c.addClass(R,"save");var U=document.createElement("span");U.innerHTML="New";c.addClass(U,"button");c.addClass(U,"save-as");var S=document.createElement("span");S.innerHTML="Revert";c.addClass(S,"button");c.addClass(S,"revert");var Y=Q.__preset_select=document.createElement("select");if(Q.load&&Q.load.remembered){s.each(Q.load.remembered,function(aa,Z){x(Q,Z,Z==Q.preset)})}else{x(Q,b,false)}c.bind(Y,"change",function(){for(var Z=0;Z<Q.__preset_select.length;Z++){Q.__preset_select[Z].innerHTML=Q.__preset_select[Z].value}Q.preset=this.value});N.appendChild(Y);N.appendChild(P);N.appendChild(R);N.appendChild(U);N.appendChild(S);if(a){var X=document.getElementById("dg-save-locally");var T=document.getElementById("dg-local-explain");X.style.display="block";var V=document.getElementById("dg-local-storage");if(localStorage.getItem(q(Q,"isLocal"))==="true"){V.setAttribute("checked","checked")}function O(){T.style.display=Q.useLocalStorage?"block":"none"}O();c.bind(V,"change",function(){Q.useLocalStorage=!Q.useLocalStorage;O()})}var W=document.getElementById("dg-new-constructor");c.bind(W,"keydown",function(Z){if(Z.metaKey&&(Z.which===67||Z.keyCode==67)){w.hide()}});c.bind(P,"click",function(){W.innerHTML=JSON.stringify(Q.getSaveObject(),undefined,2);w.show();W.focus();W.select()});c.bind(R,"click",function(){Q.save()});c.bind(U,"click",function(){var Z=prompt("Enter a new preset name.");if(Z){Q.saveAs(Z)}});c.bind(S,"click",function(){Q.revert()})}function K(P){P.__resize_handle=document.createElement("div");s.extend(P.__resize_handle.style,{width:"6px",marginLeft:"-3px",height:"200px",cursor:"ew-resize",position:"absolute"});var O;c.bind(P.__resize_handle,"mousedown",N);c.bind(P.__closeButton,"mousedown",N);P.domElement.insertBefore(P.__resize_handle,P.domElement.firstElementChild);function N(S){S.preventDefault();O=S.clientX;c.addClass(P.__closeButton,g.CLASS_DRAG);c.bind(window,"mousemove",R);c.bind(window,"mouseup",Q);return false}function R(S){S.preventDefault();P.width+=O-S.clientX;P.onResize();O=S.clientX;return false}function Q(){c.removeClass(P.__closeButton,g.CLASS_DRAG);c.unbind(window,"mousemove",R);c.unbind(window,"mouseup",Q)}}function I(O,N){O.domElement.style.width=N+"px";if(O.__save_row&&O.autoPlace){O.__save_row.style.width=N+"px"}if(O.__closeButton){O.__closeButton.style.width=N+"px"}}function F(N,O){var P={};s.each(N.__rememberedObjects,function(T,R){var Q={};var S=N.__rememberedObjectIndecesToControllers[R];s.each(S,function(U,V){Q[V]=O?U.initialValue:U.getValue()});P[R]=Q});return P}function x(N,O,Q){var P=document.createElement("option");P.innerHTML=O;P.value=O;N.__preset_select.appendChild(P);if(Q){N.__preset_select.selectedIndex=N.__preset_select.length-1}}function u(N){for(var O=0;O<N.__preset_select.length;O++){if(N.__preset_select[O].value==N.preset){N.__preset_select.selectedIndex=O}}}function n(N,O){var P=N.__preset_select[N.__preset_select.selectedIndex];if(O){P.innerHTML=P.value+"*"}else{P.innerHTML=P.value}}function J(N){if(N.length!=0){l(function(){J(N)})}s.each(N,function(O){O.updateDisplay()})}return g})(dat.utils.css,'<div id="dg-save" class="dg dialogue">\n\n  Here\'s the new load parameter for your <code>GUI</code>\'s constructor:\n\n  <textarea id="dg-new-constructor"></textarea>\n\n  <div id="dg-save-locally">\n\n    <input id="dg-local-storage" type="checkbox"/> Automatically save\n    values to <code>localStorage</code> on exit.\n\n    <div id="dg-local-explain">The values saved to <code>localStorage</code> will\n      override those passed to <code>dat.GUI</code>\'s constructor. This makes it\n      easier to work incrementally, but <code>localStorage</code> is fragile,\n      and your friends may not see the same values you do.\n      \n    </div>\n    \n  </div>\n\n</div>',".dg ul{list-style:none;margin:0;padding:0;width:100%;clear:both}.dg.ac{position:fixed;top:0;left:0;right:0;height:0;z-index:0}.dg:not(.ac) .main{overflow:hidden}.dg.main{-webkit-transition:opacity 0.1s linear;-o-transition:opacity 0.1s linear;-moz-transition:opacity 0.1s linear;transition:opacity 0.1s linear}.dg.main.taller-than-window{overflow-y:auto}.dg.main.taller-than-window .close-button{opacity:1;margin-top:-1px;border-top:1px solid #2c2c2c}.dg.main ul.closed .close-button{opacity:1 !important}.dg.main:hover .close-button,.dg.main .close-button.drag{opacity:1}.dg.main .close-button{-webkit-transition:opacity 0.1s linear;-o-transition:opacity 0.1s linear;-moz-transition:opacity 0.1s linear;transition:opacity 0.1s linear;border:0;position:absolute;line-height:19px;height:20px;cursor:pointer;text-align:center;background-color:#000}.dg.main .close-button:hover{background-color:#111}.dg.a{float:right;margin-right:15px;overflow-x:hidden}.dg.a.has-save ul{margin-top:27px}.dg.a.has-save ul.closed{margin-top:0}.dg.a .save-row{position:fixed;top:0;z-index:1002}.dg li{-webkit-transition:height 0.1s ease-out;-o-transition:height 0.1s ease-out;-moz-transition:height 0.1s ease-out;transition:height 0.1s ease-out}.dg li:not(.folder){cursor:auto;height:27px;line-height:27px;overflow:hidden;padding:0 4px 0 5px}.dg li.folder{padding:0;border-left:4px solid rgba(0,0,0,0)}.dg li.title{cursor:pointer;margin-left:-4px}.dg .closed li:not(.title),.dg .closed ul li,.dg .closed ul li > *{height:0;overflow:hidden;border:0}.dg .cr{clear:both;padding-left:3px;height:27px}.dg .property-name{cursor:default;float:left;clear:left;width:40%;overflow:hidden;text-overflow:ellipsis}.dg .c{float:left;width:60%}.dg .c input[type=text]{border:0;margin-top:4px;padding:3px;width:100%;float:right}.dg .has-slider input[type=text]{width:30%;margin-left:0}.dg .slider{float:left;width:66%;margin-left:-5px;margin-right:0;height:19px;margin-top:4px}.dg .slider-fg{height:100%}.dg .c input[type=checkbox]{margin-top:9px}.dg .c select{margin-top:5px}.dg .cr.function,.dg .cr.function .property-name,.dg .cr.function *,.dg .cr.boolean,.dg .cr.boolean *{cursor:pointer}.dg .selector{display:none;position:absolute;margin-left:-9px;margin-top:23px;z-index:10}.dg .c:hover .selector,.dg .selector.drag{display:block}.dg li.save-row{padding:0}.dg li.save-row .button{display:inline-block;padding:0px 6px}.dg.dialogue{background-color:#222;width:460px;padding:15px;font-size:13px;line-height:15px}#dg-new-constructor{padding:10px;color:#222;font-family:Monaco, monospace;font-size:10px;border:0;resize:none;box-shadow:inset 1px 1px 1px #888;word-wrap:break-word;margin:12px 0;display:block;width:440px;overflow-y:scroll;height:100px;position:relative}#dg-local-explain{display:none;font-size:11px;line-height:17px;border-radius:3px;background-color:#333;padding:8px;margin-top:10px}#dg-local-explain code{font-size:10px}#dat-gui-save-locally{display:none}.dg{color:#eee;font:11px 'Lucida Grande', sans-serif;text-shadow:0 -1px 0 #111}.dg.main::-webkit-scrollbar{width:5px;background:#1a1a1a}.dg.main::-webkit-scrollbar-corner{height:0;display:none}.dg.main::-webkit-scrollbar-thumb{border-radius:5px;background:#676767}.dg li:not(.folder){background:#1a1a1a;border-bottom:1px solid #2c2c2c}.dg li.save-row{line-height:25px;background:#dad5cb;border:0}.dg li.save-row select{margin-left:5px;width:108px}.dg li.save-row .button{margin-left:5px;margin-top:1px;border-radius:2px;font-size:9px;line-height:7px;padding:4px 4px 5px 4px;background:#c5bdad;color:#fff;text-shadow:0 1px 0 #b0a58f;box-shadow:0 -1px 0 #b0a58f;cursor:pointer}.dg li.save-row .button.gears{background:#c5bdad url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAsAAAANCAYAAAB/9ZQ7AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQJJREFUeNpiYKAU/P//PwGIC/ApCABiBSAW+I8AClAcgKxQ4T9hoMAEUrxx2QSGN6+egDX+/vWT4e7N82AMYoPAx/evwWoYoSYbACX2s7KxCxzcsezDh3evFoDEBYTEEqycggWAzA9AuUSQQgeYPa9fPv6/YWm/Acx5IPb7ty/fw+QZblw67vDs8R0YHyQhgObx+yAJkBqmG5dPPDh1aPOGR/eugW0G4vlIoTIfyFcA+QekhhHJhPdQxbiAIguMBTQZrPD7108M6roWYDFQiIAAv6Aow/1bFwXgis+f2LUAynwoIaNcz8XNx3Dl7MEJUDGQpx9gtQ8YCueB+D26OECAAQDadt7e46D42QAAAABJRU5ErkJggg==) 2px 1px no-repeat;height:7px;width:8px}.dg li.save-row .button:hover{background-color:#bab19e;box-shadow:0 -1px 0 #b0a58f}.dg li.folder{border-bottom:0}.dg li.title{padding-left:16px;background:#000 url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlI+hKgFxoCgAOw==) 6px 10px no-repeat;cursor:pointer;border-bottom:1px solid rgba(255,255,255,0.2)}.dg .closed li.title{background-image:url(data:image/gif;base64,R0lGODlhBQAFAJEAAP////Pz8////////yH5BAEAAAIALAAAAAAFAAUAAAIIlGIWqMCbWAEAOw==)}.dg .cr.boolean{border-left:3px solid #806787}.dg .cr.function{border-left:3px solid #e61d5f}.dg .cr.number{border-left:3px solid #2fa1d6}.dg .cr.number input[type=text]{color:#2fa1d6}.dg .cr.string{border-left:3px solid #1ed36f}.dg .cr.string input[type=text]{color:#1ed36f}.dg .cr.function:hover,.dg .cr.boolean:hover{background:#111}.dg .c input[type=text]{background:#303030;outline:none}.dg .c input[type=text]:hover{background:#3c3c3c}.dg .c input[type=text]:focus{background:#494949;color:#fff}.dg .c .slider{background:#303030;cursor:ew-resize}.dg .c .slider-fg{background:#2fa1d6}.dg .c .slider:hover{background:#3c3c3c}.dg .c .slider:hover .slider-fg{background:#44abda}\n",dat.controllers.factory=(function(e,c,d,a,g,f,b){return function(i,j){var h=i[j];if(b.isArray(arguments[2])||b.isObject(arguments[2])){return new e(i,j,arguments[2])}if(b.isNumber(h)){if(b.isNumber(arguments[2])&&b.isNumber(arguments[3])){return new d(i,j,arguments[2],arguments[3])}else{return new c(i,j,{min:arguments[2],max:arguments[3]})}}if(b.isString(h)){return new a(i,j)}if(b.isFunction(h)){return new g(i,j,"")}if(b.isBoolean(h)){return new f(i,j)}}})(dat.controllers.OptionController,dat.controllers.NumberControllerBox,dat.controllers.NumberControllerSlider,dat.controllers.StringController=(function(c,d,b){var a=function(f,h){a.superclass.call(this,f,h);var i=this;this.__input=document.createElement("input");this.__input.setAttribute("type","text");d.bind(this.__input,"keyup",e);d.bind(this.__input,"change",e);d.bind(this.__input,"blur",g);d.bind(this.__input,"keydown",function(j){if(j.keyCode===13){this.blur()}});function e(){i.setValue(i.__input.value)}function g(){if(i.__onFinishChange){i.__onFinishChange.call(i,i.getValue())}}this.updateDisplay();this.domElement.appendChild(this.__input)};a.superclass=c;b.extend(a.prototype,c.prototype,{updateDisplay:function(){if(!d.isActive(this.__input)){this.__input.value=this.getValue()}return a.superclass.prototype.updateDisplay.call(this)}});return a})(dat.controllers.Controller,dat.dom.dom,dat.utils.common),dat.controllers.FunctionController,dat.controllers.BooleanController,dat.utils.common),dat.controllers.Controller,dat.controllers.BooleanController,dat.controllers.FunctionController,dat.controllers.NumberControllerBox,dat.controllers.NumberControllerSlider,dat.controllers.OptionController,dat.controllers.ColorController=(function(c,d,a,b,f){var e=function(m,r){e.superclass.call(this,m,r);this.__color=new a(this.getValue());this.__temp=new a(0);var p=this;this.domElement=document.createElement("div");d.makeSelectable(this.domElement,false);this.__selector=document.createElement("div");this.__selector.className="selector";this.__saturation_field=document.createElement("div");this.__saturation_field.className="saturation-field";this.__field_knob=document.createElement("div");this.__field_knob.className="field-knob";this.__field_knob_border="2px solid ";this.__hue_knob=document.createElement("div");this.__hue_knob.className="hue-knob";this.__hue_field=document.createElement("div");this.__hue_field.className="hue-field";this.__input=document.createElement("input");this.__input.type="text";this.__input_textShadow="0 1px 1px ";d.bind(this.__input,"keydown",function(t){if(t.keyCode===13){j.call(this)}});d.bind(this.__input,"blur",j);d.bind(this.__selector,"mousedown",function(t){d.addClass(this,"drag").bind(window,"mouseup",function(u){d.removeClass(p.__selector,"drag")})});var n=document.createElement("div");f.extend(this.__selector.style,{width:"122px",height:"102px",padding:"3px",backgroundColor:"#222",boxShadow:"0px 1px 3px rgba(0,0,0,0.3)"});f.extend(this.__field_knob.style,{position:"absolute",width:"12px",height:"12px",border:this.__field_knob_border+(this.__color.v<0.5?"#fff":"#000"),boxShadow:"0px 1px 3px rgba(0,0,0,0.5)",borderRadius:"12px",zIndex:1});f.extend(this.__hue_knob.style,{position:"absolute",width:"15px",height:"2px",borderRight:"4px solid #fff",zIndex:1});f.extend(this.__saturation_field.style,{width:"100px",height:"100px",border:"1px solid #555",marginRight:"3px",display:"inline-block",cursor:"pointer"});f.extend(n.style,{width:"100%",height:"100%",background:"none"});g(n,"top","rgba(0,0,0,0)","#000");f.extend(this.__hue_field.style,{width:"15px",height:"100px",display:"inline-block",border:"1px solid #555",cursor:"ns-resize"});i(this.__hue_field);f.extend(this.__input.style,{outline:"none",textAlign:"center",color:"#fff",border:0,fontWeight:"bold",textShadow:this.__input_textShadow+"rgba(0,0,0,0.7)"});d.bind(this.__saturation_field,"mousedown",q);d.bind(this.__field_knob,"mousedown",q);d.bind(this.__hue_field,"mousedown",function(t){o(t);d.bind(window,"mousemove",o);d.bind(window,"mouseup",k)});function q(t){l(t);d.bind(window,"mousemove",l);d.bind(window,"mouseup",s)}function s(){d.unbind(window,"mousemove",l);d.unbind(window,"mouseup",s)}function j(){var t=b(this.value);if(t!==false){p.__color.__state=t;p.setValue(p.__color.toOriginal())}else{this.value=p.__color.toString()}}function k(){d.unbind(window,"mousemove",o);d.unbind(window,"mouseup",k)}this.__saturation_field.appendChild(n);this.__selector.appendChild(this.__field_knob);this.__selector.appendChild(this.__saturation_field);this.__selector.appendChild(this.__hue_field);this.__hue_field.appendChild(this.__hue_knob);this.domElement.appendChild(this.__input);this.domElement.appendChild(this.__selector);this.updateDisplay();function l(y){y.preventDefault();var t=d.getWidth(p.__saturation_field);var z=d.getOffset(p.__saturation_field);var x=(y.clientX-z.left+document.body.scrollLeft)/t;var u=1-(y.clientY-z.top+document.body.scrollTop)/t;if(u>1){u=1}else{if(u<0){u=0}}if(x>1){x=1}else{if(x<0){x=0}}p.__color.v=u;p.__color.s=x;p.setValue(p.__color.toOriginal());return false}function o(v){v.preventDefault();var u=d.getHeight(p.__hue_field);var w=d.getOffset(p.__hue_field);var t=1-(v.clientY-w.top+document.body.scrollTop)/u;if(t>1){t=1}else{if(t<0){t=0}}p.__color.h=t*360;p.setValue(p.__color.toOriginal());return false}};e.superclass=c;f.extend(e.prototype,c.prototype,{updateDisplay:function(){var k=b(this.getValue());if(k!==false){var j=false;f.each(a.COMPONENTS,function(n){if(!f.isUndefined(k[n])&&!f.isUndefined(this.__color.__state[n])&&k[n]!==this.__color.__state[n]){j=true;return{}}},this);if(j){f.extend(this.__color.__state,k)}}f.extend(this.__temp.__state,this.__color.__state);this.__temp.a=1;var m=(this.__color.v<0.5||this.__color.s>0.5)?255:0;var l=255-m;f.extend(this.__field_knob.style,{marginLeft:100*this.__color.s-7+"px",marginTop:100*(1-this.__color.v)-7+"px",backgroundColor:this.__temp.toString(),border:this.__field_knob_border+"rgb("+m+","+m+","+m+")"});this.__hue_knob.style.marginTop=(1-this.__color.h/360)*100+"px";this.__temp.s=1;this.__temp.v=1;g(this.__saturation_field,"left","#fff",this.__temp.toString());f.extend(this.__input.style,{backgroundColor:this.__input.value=this.__color.toString(),color:"rgb("+m+","+m+","+m+")",textShadow:this.__input_textShadow+"rgba("+l+","+l+","+l+",.7)"})}});var h=["-moz-","-o-","-webkit-","-ms-",""];function g(m,k,l,j){m.style.background="";f.each(h,function(n){m.style.cssText+="background: "+n+"linear-gradient("+k+", "+l+" 0%, "+j+" 100%); "})}function i(j){j.style.background="";j.style.cssText+="background: -moz-linear-gradient(top,  #ff0000 0%, #ff00ff 17%, #0000ff 34%, #00ffff 50%, #00ff00 67%, #ffff00 84%, #ff0000 100%);";j.style.cssText+="background: -webkit-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";j.style.cssText+="background: -o-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";j.style.cssText+="background: -ms-linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);";j.style.cssText+="background: linear-gradient(top,  #ff0000 0%,#ff00ff 17%,#0000ff 34%,#00ffff 50%,#00ff00 67%,#ffff00 84%,#ff0000 100%);"}return e})(dat.controllers.Controller,dat.dom.dom,dat.color.Color=(function(b,h,c,g){var a=function(){this.__state=b.apply(this,arguments);if(this.__state===false){throw"Failed to interpret color arguments"}this.__state.a=this.__state.a||1};a.COMPONENTS=["r","g","b","h","s","v","hex","a"];g.extend(a.prototype,{toString:function(){return c(this)},toOriginal:function(){return this.__state.conversion.write(this)}});f(a.prototype,"r",2);f(a.prototype,"g",1);f(a.prototype,"b",0);i(a.prototype,"h");i(a.prototype,"s");i(a.prototype,"v");Object.defineProperty(a.prototype,"a",{get:function(){return this.__state.a},set:function(j){this.__state.a=j}});Object.defineProperty(a.prototype,"hex",{get:function(){if(!this.__state.space!=="HEX"){this.__state.hex=h.rgb_to_hex(this.r,this.g,this.b)}return this.__state.hex},set:function(j){this.__state.space="HEX";this.__state.hex=j}});function f(l,k,j){Object.defineProperty(l,k,{get:function(){if(this.__state.space==="RGB"){return this.__state[k]}e(this,k,j);return this.__state[k]},set:function(m){if(this.__state.space!=="RGB"){e(this,k,j);this.__state.space="RGB"}this.__state[k]=m}})}function i(k,j){Object.defineProperty(k,j,{get:function(){if(this.__state.space==="HSV"){return this.__state[j]}d(this);return this.__state[j]},set:function(l){if(this.__state.space!=="HSV"){d(this);this.__state.space="HSV"}this.__state[j]=l}})}function e(j,l,k){if(j.__state.space==="HEX"){j.__state[l]=h.component_from_hex(j.__state.hex,k)}else{if(j.__state.space==="HSV"){g.extend(j.__state,h.hsv_to_rgb(j.__state.h,j.__state.s,j.__state.v))}else{throw"Corrupted color state"}}}function d(k){var j=h.rgb_to_hsv(k.r,k.g,k.b);g.extend(k.__state,{s:j.s,v:j.v});if(!g.isNaN(j.h)){k.__state.h=j.h}else{if(g.isUndefined(k.__state.h)){k.__state.h=0}}}return a})(dat.color.interpret,dat.color.math=(function(){var a;return{hsv_to_rgb:function(g,m,k){var e=Math.floor(g/60)%6;var i=g/60-Math.floor(g/60);var d=k*(1-m);var b=k*(1-(i*m));var l=k*(1-((1-i)*m));var j=[[k,l,d],[b,k,d],[d,k,l],[d,b,k],[l,d,k],[k,d,b]][e];return{r:j[0]*255,g:j[1]*255,b:j[2]*255}},rgb_to_hsv:function(k,j,d){var e=Math.min(k,j,d),c=Math.max(k,j,d),l=c-e,i,f;if(c!=0){f=l/c}else{return{h:NaN,s:0,v:0}}if(k==c){i=(j-d)/l}else{if(j==c){i=2+(d-k)/l}else{i=4+(k-j)/l}}i/=6;if(i<0){i+=1}return{h:i*360,s:f,v:c/255}},rgb_to_hex:function(f,e,c){var d=this.hex_with_component(0,2,f);d=this.hex_with_component(d,1,e);d=this.hex_with_component(d,0,c);return d},component_from_hex:function(c,b){return(c>>(b*8))&255},hex_with_component:function(c,b,d){return d<<(a=b*8)|(c&~(255<<a))}}})(),dat.color.toString,dat.utils.common),dat.color.interpret,dat.utils.common),dat.utils.requestAnimationFrame=(function(){return window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(b,a){window.setTimeout(b,1000/60)}})(),dat.dom.CenteredDiv=(function(d,c){var b=function(){this.backgroundElement=document.createElement("div");c.extend(this.backgroundElement.style,{backgroundColor:"rgba(0,0,0,0.8)",top:0,left:0,display:"none",zIndex:"1000",opacity:0,WebkitTransition:"opacity 0.2s linear"});d.makeFullscreen(this.backgroundElement);this.backgroundElement.style.position="fixed";this.domElement=document.createElement("div");c.extend(this.domElement.style,{position:"fixed",display:"none",zIndex:"1001",opacity:0,WebkitTransition:"-webkit-transform 0.2s ease-out, opacity 0.2s linear"});document.body.appendChild(this.backgroundElement);document.body.appendChild(this.domElement);var e=this;d.bind(this.backgroundElement,"click",function(){e.hide()})};b.prototype.show=function(){var e=this;this.backgroundElement.style.display="block";this.domElement.style.display="block";this.domElement.style.opacity=0;this.domElement.style.webkitTransform="scale(1.1)";this.layout();c.defer(function(){e.backgroundElement.style.opacity=1;e.domElement.style.opacity=1;e.domElement.style.webkitTransform="scale(1)"})};b.prototype.hide=function(){var f=this;var e=function(){f.domElement.style.display="none";f.backgroundElement.style.display="none";d.unbind(f.domElement,"webkitTransitionEnd",e);d.unbind(f.domElement,"transitionend",e);d.unbind(f.domElement,"oTransitionEnd",e)};d.bind(this.domElement,"webkitTransitionEnd",e);d.bind(this.domElement,"transitionend",e);d.bind(this.domElement,"oTransitionEnd",e);this.backgroundElement.style.opacity=0;this.domElement.style.opacity=0;this.domElement.style.webkitTransform="scale(1.1)"};b.prototype.layout=function(){this.domElement.style.left=window.innerWidth/2-d.getWidth(this.domElement)/2+"px";this.domElement.style.top=window.innerHeight/2-d.getHeight(this.domElement)/2+"px"};function a(f){console.log(f)}return b})(dat.dom.dom,dat.utils.common),dat.dom.dom,dat.utils.common);

define("dat.gui", function(){});

/*glMatrix.setMatrixArrayType(Array);
vec3.fromXYZ=function(xyz){var out=new Array(3);out[0]=xyz.x;out[1]=xyz.y;out[2]=xyz.z;return out};
vec3.toXYZ=function(vec){return{x:vec[0],y:vec[1],z:vec[2]}};
vec4.fromXYZ=function(xyz,w){var out=new Array(4);out[0]=xyz.x;out[1]=xyz.y;out[2]=xyz.z;out[3]=w;return out};
mat4.fromYPR=function(yaw,pitch,roll){var out=new Array(16);var angles0=Math.sin(roll),angles1=Math.cos(roll),angles2=Math.sin(pitch),angles3=Math.cos(pitch),angles4=Math.sin(yaw),angles5=Math.cos(yaw);out[0]=angles5*angles1;out[4]=-(angles5*angles0);out[8]=angles4;out[1]=(angles2*angles4*angles1)+(angles3*angles0);out[5]=(angles3*angles1)-(angles2*angles4*angles0);out[9]=-(angles2*angles5);out[2]=(angles2*angles0)-(angles3*angles4*angles1);out[6]=(angles2*angles1)+(angles3*angles4*angles0);out[10]=angles3*angles5;out[3]=0;out[7]=0;out[11]=0;out[12]=0;out[13]=0;out[14]=0;out[15]=1;return out};
quat.fromYPR=function(yaw,pitch,roll){var num9=roll*0.5;var num6=Math.sin(num9);var num5=Math.cos(num9);var num8=pitch*0.5;var num4=Math.sin(num8);var num3=Math.cos(num8);var num7=yaw*0.5;var num2=Math.sin(num7);var num=Math.cos(num7);var out=new Array(4);out[0]=((num*num4)*num5)+((num2*num3)*num6);out[1]=((num2*num3)*num5)-((num*num4)*num6);out[2]=((num*num3)*num6)-((num2*num4)*num5);out[3]=((num*num3)*num5)+((num2*num4)*num6);return out};*/
if(typeof Phoria==="undefined"||!Phoria){var Phoria={};Phoria.RADIANS=Math.PI/180;Phoria.TWOPI=Math.PI*2;Phoria.ONEOPI=1/Math.PI;Phoria.PIO2=Math.PI/2;Phoria.PIO4=Math.PI/4;Phoria.EPSILON=0.000001}(function(){Phoria.Util={};Phoria.Util.extend=function extend(subc,superc,overrides){var F=function(){},i;F.prototype=superc.prototype;subc.prototype=new F();subc.prototype.constructor=subc;subc.superclass=superc.prototype;if(superc.prototype.constructor==Object.prototype.constructor){superc.prototype.constructor=superc}if(overrides){for(i in overrides){if(overrides.hasOwnProperty(i)){subc.prototype[i]=overrides[i]}}}};Phoria.Util.augment=function augment(r,s){for(var p in s.prototype){if(typeof r.prototype[p]==="undefined"){r.prototype[p]=s.prototype[p]}}};Phoria.Util.merge=function merge(target,src){var array=Array.isArray(src),dst=array&&[]||{};if(array){target=target||[];dst=dst.concat(target);src.forEach(function(e,i){if(typeof e==="object"){dst[i]=Phoria.Util.merge(target[i],e)}else{dst[i]=e}})}else{if(target&&typeof target==="object"){Object.keys(target).forEach(function(key){dst[key]=target[key]})}Object.keys(src).forEach(function(key){if(typeof src[key]!=="object"||!src[key]){dst[key]=src[key]}else{if(!target||!target[key]){dst[key]=src[key]}else{dst[key]=Phoria.Util.merge(target[key],src[key])}}})}return dst};Phoria.Util.combine=function combine(target,src){var array=Array.isArray(src)&&Array.isArray(target);if(array){if(target.length<src.length){target.length=src.length}src.forEach(function(e,i){if(typeof e==="object"){target[i]=target[i]||{};Phoria.Util.combine(target[i],e)}else{target[i]=e}})}else{Object.keys(src).forEach(function(key){if(typeof src[key]!=="object"||!src[key]){target[key]=src[key]}else{target[key]=target[key]||(Array.isArray(src[key])?[]:{});Phoria.Util.combine(target[key],src[key])}})}};Phoria.Util.clone=function clone(src){var n=null,dst={};for(var p in src){n=src[p];if(Array.isArray(n)){dst[p]=[].concat(n)}else{dst[p]=n}}return dst};Phoria.Util.isIdentity=function isIdentity(mat){return(mat[0]===1&&mat[1]===0&&mat[2]===0&&mat[3]===0&&mat[4]===0&&mat[5]===1&&mat[6]===0&&mat[7]===0&&mat[8]===0&&mat[9]===0&&mat[10]===1&&mat[11]===0&&mat[12]===0&&mat[13]===0&&mat[14]===0&&mat[15]===1)};Phoria.Util.calcNormalVector=function calcNormalVector(x1,y1,z1,x2,y2,z2){var v=vec4.fromValues((y1*z2)-(z1*y2),-((z2*x1)-(x2*z1)),(x1*y2)-(y1*x2),0);return vec3.normalize(v,v)};Phoria.Util.thetaTo=function thetaTo(v1,v2){return Math.acos(vec3.dot(v1,v2)/(Math.sqrt(v1[0]*v1[0]+v1[1]*v1[1]+v1[2]*v1[2])*Math.sqrt(v2[0]*v2[0]+v2[1]*v2[1]+v2[2]*v2[2])))};Phoria.Util.averagePolyVertex=function averagePolyVertex(vertices,worldcoords){for(var i=0,avx=0,avy=0,avz=0;i<vertices.length;i++){avx+=worldcoords[vertices[i]][0];avy+=worldcoords[vertices[i]][1];avz+=worldcoords[vertices[i]][2]}return vec3.fromValues(avx/vertices.length,avy/vertices.length,avz/vertices.length)};Phoria.Util.averageObjectZ=function averageObjectZ(coords){var av=0;for(var i=0;i<coords.length;i++){av+=coords[i][3]}return av/coords.length};Phoria.Util.populateBuffer=function populateBuffer(len,fnFactory){var array=new Array(len);for(var i=0;i<len;i++){array[i]=fnFactory(i)}return array};Phoria.Util.sortPolygons=function sortPolygons(polygons,worldcoords){for(var i=0,verts;i<polygons.length;i++){verts=polygons[i].vertices;if(verts.length===3){polygons[i]._avz=(worldcoords[verts[0]][2]+worldcoords[verts[1]][2]+worldcoords[verts[2]][2])*0.333333}else{polygons[i]._avz=(worldcoords[verts[0]][2]+worldcoords[verts[1]][2]+worldcoords[verts[2]][2]+worldcoords[verts[3]][2])*0.25}}polygons.sort(function sortPolygonsZ(f1,f2){return(f1._avz<f2._avz?-1:1)})};Phoria.Util.sortEdges=function sortEdges(edges,coords){for(var i=0;i<edges.length;i++){edges[i]._avz=(coords[edges[i].a][2]+coords[edges[i].b][2])*0.5}edges.sort(function sortEdgesZ(f1,f2){return(f1._avz<f2._avz?-1:1)})};Phoria.Util.sortPoints=function sortPoints(coords,worldcoords){var quickSort=function qSort(c,a,start,end){if(start<end){var pivotIndex=(start+end)>>1,pivotValue=a[pivotIndex][2],pivotIndexNew=start;var tmp=a[pivotIndex];a[pivotIndex]=a[end];a[end]=tmp;tmp=c[pivotIndex];c[pivotIndex]=c[end];c[end]=tmp;for(var i=start;i<end;i++){if(a[i][2]>pivotValue){tmp=c[i];c[i]=c[pivotIndexNew];c[pivotIndexNew]=tmp;tmp=a[i];a[i]=a[pivotIndexNew];a[pivotIndexNew]=tmp;pivotIndexNew++}}tmp=c[pivotIndexNew];c[pivotIndexNew]=c[end];c[end]=tmp;tmp=a[pivotIndexNew];a[pivotIndexNew]=a[end];a[end]=tmp;qSort(c,a,start,pivotIndexNew-1);qSort(c,a,pivotIndexNew+1,end)}};quickSort(worldcoords,coords,0,coords.length-1)};Phoria.Util.generateTesselatedPlane=function generateTesselatedPlane(vsegs,hsegs,level,scale,generateUVs){var points=[],edges=[],polys=[],hinc=scale/hsegs,vinc=scale/vsegs,c=0;for(var i=0,x,y=scale/2;i<=vsegs;i++){x=-scale/2;for(var j=0;j<=hsegs;j++){points.push({x:x,y:0,z:y});if(j!==0){edges.push({a:c,b:c-1})}if(i!==0){edges.push({a:c,b:c-hsegs-1})}if(i!==0&&j!==0){var p={vertices:[c-hsegs-1,c,c-1,c-hsegs-2]};if(generateUVs){var uvs=[(1/hsegs)*j,(1/vsegs)*(i-1),(1/hsegs)*j,(1/vsegs)*i,(1/hsegs)*(j-1),(1/vsegs)*i,(1/hsegs)*(j-1),(1/vsegs)*(i-1)];p.uvs=uvs}polys.push(p)}x+=hinc;c++}y-=vinc}return{points:points,edges:edges,polygons:polys}};Phoria.Util.generateUnitCube=function generateUnitCube(scale){var s=scale||1;return{points:[{x:-1*s,y:1*s,z:-1*s},{x:1*s,y:1*s,z:-1*s},{x:1*s,y:-1*s,z:-1*s},{x:-1*s,y:-1*s,z:-1*s},{x:-1*s,y:1*s,z:1*s},{x:1*s,y:1*s,z:1*s},{x:1*s,y:-1*s,z:1*s},{x:-1*s,y:-1*s,z:1*s}],edges:[{a:0,b:1},{a:1,b:2},{a:2,b:3},{a:3,b:0},{a:4,b:5},{a:5,b:6},{a:6,b:7},{a:7,b:4},{a:0,b:4},{a:1,b:5},{a:2,b:6},{a:3,b:7}],polygons:[{vertices:[0,1,2,3]},{vertices:[1,5,6,2]},{vertices:[5,4,7,6]},{vertices:[4,0,3,7]},{vertices:[4,5,1,0]},{vertices:[3,2,6,7]}]}};Phoria.Util.generatePyramid=function generatePyramid(scale){var s=scale||1;return{points:[{x:-1*s,y:0,z:-1*s},{x:-1*s,y:0,z:1*s},{x:1*s,y:0,z:1*s},{x:1*s,y:0*s,z:-1*s},{x:0,y:1.5*s,z:0}],edges:[{a:0,b:1},{a:1,b:2},{a:2,b:3},{a:3,b:0},{a:0,b:4},{a:1,b:4},{a:2,b:4},{a:3,b:4}],polygons:[{vertices:[0,1,4]},{vertices:[1,2,4]},{vertices:[2,3,4]},{vertices:[3,0,4]},{vertices:[3,2,1,0]}]}};Phoria.Util.generateIcosahedron=function generateIcosahedron(scale){var s=scale||1;var t=(1+Math.sqrt(5))/2,tau=(t/Math.sqrt(1+t*t))*s,one=(1/Math.sqrt(1+t*t))*s;return{points:[{x:tau,y:one,z:0},{x:-tau,y:one,z:0},{x:-tau,y:-one,z:0},{x:tau,y:-one,z:0},{x:one,y:0,z:tau},{x:one,y:0,z:-tau},{x:-one,y:0,z:-tau},{x:-one,y:0,z:tau},{x:0,y:tau,z:one},{x:0,y:-tau,z:one},{x:0,y:-tau,z:-one},{x:0,y:tau,z:-one}],edges:[{a:4,b:8},{a:8,b:7},{a:7,b:4},{a:7,b:9},{a:9,b:4},{a:5,b:6},{a:6,b:11},{a:11,b:5},{a:5,b:10},{a:10,b:6},{a:0,b:4},{a:4,b:3},{a:3,b:0},{a:3,b:5},{a:5,b:0},{a:2,b:7},{a:7,b:1},{a:1,b:2},{a:1,b:6},{a:6,b:2},{a:8,b:0},{a:0,b:11},{a:11,b:8},{a:11,b:1},{a:1,b:8},{a:9,b:10},{a:10,b:3},{a:3,b:9},{a:9,b:2},{a:2,b:10}],polygons:[{vertices:[4,8,7]},{vertices:[4,7,9]},{vertices:[5,6,11]},{vertices:[5,10,6]},{vertices:[0,4,3]},{vertices:[0,3,5]},{vertices:[2,7,1]},{vertices:[2,1,6]},{vertices:[8,0,11]},{vertices:[8,11,1]},{vertices:[9,10,3]},{vertices:[9,2,10]},{vertices:[8,4,0]},{vertices:[11,0,5]},{vertices:[4,9,3]},{vertices:[5,3,10]},{vertices:[7,8,1]},{vertices:[6,1,11]},{vertices:[7,2,9]},{vertices:[6,10,2]}]}};Phoria.Util.subdivide=function subdivide(v,p){var vertices=[],polys=[];var fnNormalize=function(vn){var len=vn.x*vn.x+vn.y*vn.y+vn.z*vn.z;len=1/Math.sqrt(len);vn.x*=len;vn.y*=len;vn.z*=len};var fnSubDivide=function(v1,v2,v3){var v12={x:0,y:0,z:0},v23={x:0,y:0,z:0},v31={x:0,y:0,z:0};v12.x=v1.x+v2.x;v12.y=v1.y+v2.y;v12.z=v1.z+v2.z;v23.x=v2.x+v3.x;v23.y=v2.y+v3.y;v23.z=v2.z+v3.z;v31.x=v3.x+v1.x;v31.y=v3.y+v1.y;v31.z=v3.z+v1.z;fnNormalize(v12);fnNormalize(v23);fnNormalize(v31);var pn=vertices.length;vertices.push(v1,v2,v3,v12,v23,v31);polys.push({vertices:[pn+0,pn+3,pn+5]});polys.push({vertices:[pn+1,pn+4,pn+3]});polys.push({vertices:[pn+2,pn+5,pn+4]});polys.push({vertices:[pn+3,pn+4,pn+5]})};for(var i=0,vs;i<p.length;i++){vs=p[i].vertices;if(vs.length===3){fnSubDivide.call(this,v[vs[0]],v[vs[1]],v[vs[2]])}else{if(vs.length===4){fnSubDivide.call(this,v[vs[0]],v[vs[1]],v[vs[2]]);fnSubDivide.call(this,v[vs[2]],v[vs[3]],v[vs[0]])}}}return{points:vertices,polygons:polys}};Phoria.Util.generateCylinder=function generateCylinder(radius,length,strips){var points=[],polygons=[],edges=[];var inc=2*Math.PI/strips;for(var s=0,offset=0;s<=strips;s++){points.push({x:Math.cos(offset)*radius,z:Math.sin(offset)*radius,y:length/2});points.push({x:Math.cos(offset)*radius,z:Math.sin(offset)*radius,y:-length/2});offset+=inc;if(s!==0){polygons.push({vertices:[s*2-2,s*2,s*2+1,s*2-1]});edges.push({a:s*2,b:s*2-2},{a:s*2-2,b:s*2-1},{a:s*2+1,b:s*2-1});if(s===strips-1){var vs=[];for(var i=strips;i>=0;i--){vs.push(i*2)}polygons.push({vertices:vs});vs=[];for(var i=0;i<strips;i++){vs.push(i*2+1)}polygons.push({vertices:vs})}}}return{points:points,edges:edges,polygons:polygons}};Phoria.Util.generateCuboid=function generateCuboid(desc){var scalex=desc.scalex||1,scaley=desc.scaley||1,scalez=desc.scalez||1,offsetx=desc.offsetx||0,offsety=desc.offsety||0,offsetz=desc.offsetz||0;return{points:[{x:-1*scalex,y:1*scaley,z:-1*scalez},{x:1*scalex,y:1*scaley,z:-1*scalez},{x:1*scalex,y:-1*scaley,z:-1*scalez},{x:-1*scalex,y:-1*scaley,z:-1*scalez},{x:-1*scalex,y:1*scaley,z:1*scalez},{x:1*scalex,y:1*scaley,z:1*scalez},{x:1*scalex,y:-1*scaley,z:1*scalez},{x:-1*scalex,y:-1*scaley,z:1*scalez}],edges:[{a:0,b:1},{a:1,b:2},{a:2,b:3},{a:3,b:0},{a:4,b:5},{a:5,b:6},{a:6,b:7},{a:7,b:4},{a:0,b:4},{a:1,b:5},{a:2,b:6},{a:3,b:7}],polygons:[{vertices:[0,1,2,3]},{vertices:[0,4,5,1]},{vertices:[1,5,6,2]},{vertices:[2,6,7,3]},{vertices:[4,0,3,7]},{vertices:[5,4,7,6]}]}};Phoria.Util.generateSphere=function generateSphere(scale,lats,longs,generateUVs){var points=[],edges=[],polys=[],uvs=[];for(var latNumber=0;latNumber<=lats;++latNumber){for(var longNumber=0;longNumber<=longs;++longNumber){var theta=latNumber*Math.PI/lats;var phi=longNumber*2*Math.PI/longs;var sinTheta=Math.sin(theta);var sinPhi=Math.sin(phi);var cosTheta=Math.cos(theta);var cosPhi=Math.cos(phi);var x=cosPhi*sinTheta;var y=cosTheta;var z=sinPhi*sinTheta;if(generateUVs){var u=longNumber/longs;var v=latNumber/lats;uvs.push({u:u,v:v})}points.push({x:scale*x,y:scale*y,z:scale*z})}}for(var latNumber=0;latNumber<lats;++latNumber){for(var longNumber=0;longNumber<longs;++longNumber){var first=(latNumber*(longs+1))+longNumber;var second=first+longs+1;if(latNumber===0){var p={vertices:[first+1,second+1,second]};if(generateUVs){p.uvs=[uvs[first+1].u,uvs[first+1].v,uvs[second+1].u,uvs[second+1].v,uvs[second].u,uvs[second].v]}polys.push(p);edges.push({a:first,b:second})}else{if(latNumber===lats-1){var p={vertices:[first+1,second,first]};if(generateUVs){p.uvs=[uvs[first+1].u,uvs[first+1].v,uvs[second].u,uvs[second].v,uvs[first].u,uvs[first].v]}polys.push(p);edges.push({a:first,b:second})}else{var p={vertices:[first+1,second+1,second,first]};if(generateUVs){p.uvs=[uvs[first+1].u,uvs[first+1].v,uvs[second+1].u,uvs[second+1].v,uvs[second].u,uvs[second].v,uvs[first].u,uvs[first].v]}polys.push(p);edges.push({a:first,b:second});edges.push({a:second,b:second+1})}}}}return{points:points,edges:edges,polygons:polys}};Phoria.Util.generateRadialGradientBitmap=function generateRadialGradientBitmap(size,innerColour,outerColour){var buffer=document.createElement("canvas"),width=size<<1;buffer.width=buffer.height=width;var ctx=buffer.getContext("2d"),radgrad=ctx.createRadialGradient(size,size,size>>1,size,size,size);radgrad.addColorStop(0,innerColour);radgrad.addColorStop(1,outerColour);ctx.fillStyle=radgrad;ctx.fillRect(0,0,width,width);var img=new Image();img.src=buffer.toDataURL("image/png");return img};Phoria.Util.request=function request(config){var req=new XMLHttpRequest();var data=config.data||"";if(config.responseContentType&&req.overrideMimeType){req.overrideMimeType(config.responseContentType)}req.open(config.method?config.method:"GET",config.url);if(config.requestContentType){req.setRequestHeader("Accept",config.requestContentType)}req.onreadystatechange=function(){if(req.readyState===4){if(req.status===200){if(config.fnSuccess){config.fnSuccess.call(this,req.responseText,req.status)}}else{if(config.fnFailure){config.fnFailure.call(this,req.responseText,req.status)}else{alert(req.status+"\n\n"+req.responseText)}}}};try{if(config.method==="POST"||config.method==="PUT"){req.send(data)}else{req.send(null)}}catch(e){alert(e.message)}};Phoria.Util.importGeometryWavefront=function importGeometryWavefront(config){var vertex=[],faces=[],uvs=[];var re=/\s+/;var scale=config.scale||1;var minx,miny,minz,maxx,maxy,maxz;minx=miny=minz=maxx=maxy=maxz=0;Phoria.Util.request({url:config.url,fnSuccess:function(data){var lines=data.split("\n");for(var i=0;i<lines.length;i++){var line=lines[i].split(re);switch(line[0]){case"v":var x=parseFloat(line[1])*scale,y=parseFloat(line[2])*scale,z=parseFloat(line[3])*scale;vertex.push({x:x,y:y,z:z});if(x<minx){minx=x}else{if(x>maxx){maxx=x}}if(y<miny){miny=y}else{if(y>maxy){maxy=y}}if(z<minz){minz=z}else{if(z>maxz){maxz=z}}break;case"vt":var u=parseFloat(line[1]),v=parseFloat(line[2]);uvs.push([u,v]);break;case"f":line.splice(0,1);var vertices=[],uvcoords=[];for(var j=0,vindex,vps;j<line.length;j++){vindex=line[config.reorder?line.length-j-1:j];if(vindex.length!==0){vps=vindex.split("/");vertices.push(parseInt(vps[0])-1);if(vps.length>1&&vindex.indexOf("//")===-1){var uv=parseInt(vps[1])-1;if(uvs.length>uv){uvcoords.push(uvs[uv][0],uvs[uv][1])}}}}var poly={vertices:vertices};faces.push(poly);if(uvcoords.length!==0){poly.uvs=uvcoords}break}}if(config.center){var cdispx=(minx+maxx)/2,cdispy=(miny+maxy)/2,cdispz=(minz+maxz)/2;for(var i=0;i<vertex.length;i++){vertex[i].x-=cdispx;vertex[i].y-=cdispy;vertex[i].z-=cdispz}}if(config.scaleTo){var sizex=maxx-minx,sizey=maxy-miny,sizez=maxz-minz;var scalefactor=0;if(sizey>sizex){if(sizez>sizey){scalefactor=1/(sizez/config.scaleTo)}else{scalefactor=1/(sizey/config.scaleTo)}}else{if(sizez>sizex){scalefactor=1/(sizez/config.scaleTo)}else{scalefactor=1/(sizex/config.scaleTo)}}for(var i=0;i<vertex.length;i++){vertex[i].x*=scalefactor;vertex[i].y*=scalefactor;vertex[i].z*=scalefactor}}if(config.fnSuccess){config.fnSuccess.call(this,{points:vertex,polygons:faces})}},fnFailure:function(error){if(config.fnFailure){config.fnFailure.call(this,error)}}})};Phoria.Util.calculatePolarFromPlanar=function calculatePolarFromPlanar(planar){var point=new vec3.create();point[0]=vec3.length(planar);point[1]=Math.acos(planar[2]/point[0]);if(planar[0]!==0){if(planar[0]>0){point[2]=Math.atan(planar[1]/planar[0])}else{point[2]=Math.PI+Math.atan(planar[1]/planar[0])}}else{if(planar[1]>0){point[2]=Math.PI/2}else{point[2]=Math.PI*3/2}}return point};Phoria.Util.calculatePlanarFromPolar=function calculatePlanarFromPolar(polar){return new vec3.fromValues(Math.round(polar[0]*Math.sin(polar[1])*Math.cos(polar[2])*100)/100,Math.round(polar[0]*Math.sin(polar[1])*Math.sin(polar[2])*100)/100,Math.round(polar[0]*Math.cos(polar[1])*100)/100)};Phoria.Util.planeLineIntersection=function planeLineIntersection(planeNormal,planePoint,lineVector,linePoint){var dotProduct=vec3.dot(lineVector,planeNormal);if(dotProduct!==0){var pointVector=new vec3.create();vec3.subtract(pointVector,planePoint,linePoint);var lineScalar=vec3.dot(planeNormal,pointVector)/dotProduct;var intersection=vec3.create();vec3.scaleAndAdd(intersection,linePoint,lineVector,lineScalar);return intersection}else{return null}};Phoria.Util.intersectionInsidePolygon=function intersectionInsidePolygon(polygon,points,intersection){var absNormal=vec3.fromValues(Math.abs(polygon._worldnormal[0]),Math.abs(polygon._worldnormal[1]),Math.abs(polygon._worldnormal[2]));var numIntersects=0;var testVector=vec2.fromValues(1,1);for(var l=0;l<polygon.vertices.length;l++){var point1,point2,intersection2D;if(absNormal[2]>=absNormal[0]&&absNormal[2]>=absNormal[1]){point1=vec2.fromValues(points[polygon.vertices[l]][0],points[polygon.vertices[l]][1]);point2;if(l<polygon.vertices.length-1){point2=vec2.fromValues(points[polygon.vertices[l+1]][0],points[polygon.vertices[l+1]][1])}else{point2=vec2.fromValues(points[polygon.vertices[0]][0],points[polygon.vertices[0]][1])}intersection2D=vec2.fromValues(intersection[0],intersection[1])}else{if(absNormal[1]>absNormal[0]){point1=vec2.fromValues(points[polygon.vertices[l]][2],points[polygon.vertices[l]][0]);point2;if(l<polygon.vertices.length-1){point2=vec2.fromValues(points[polygon.vertices[l+1]][2],points[polygon.vertices[l+1]][0])}else{point2=vec2.fromValues(points[polygon.vertices[0]][2],points[polygon.vertices[0]][0])}intersection2D=vec2.fromValues(intersection[2],intersection[0])}else{point1=vec2.fromValues(points[polygon.vertices[l]][1],points[polygon.vertices[l]][2]);point2;if(l<polygon.vertices.length-1){point2=vec2.fromValues(points[polygon.vertices[l+1]][1],points[polygon.vertices[l+1]][2])}else{point2=vec2.fromValues(points[polygon.vertices[0]][1],points[polygon.vertices[0]][2])}intersection2D=vec2.fromValues(intersection[1],intersection[2])}}if(Phoria.Util.sectionLineIntersect2D(point1,point2,intersection2D,testVector)){numIntersects++}}return(numIntersects%2===1)};Phoria.Util.sectionLineIntersect2D=function sectionLineIntersect2D(p1,p2,p,v){var s=vec2.create();vec2.subtract(s,p2,p1);var svCross=vec3.create();vec2.cross(svCross,s,v);if(svCross[2]===0){return false}var t=(p[0]*v[1]-p[1]*v[0]-p1[0]*v[1]+p1[1]*v[0])/svCross[2];var u;if(v[0]!==0){u=(p1[0]+t*s[0]-p[0])/v[0]}else{u=(p1[1]+t*s[1]-p[1])/v[1]}var ip=vec2.create();vec2.scaleAndAdd(ip,p1,s,t);var doesIntersect={x:false,y:false};if(u>=0){if(p1[0]>p2[0]){if(ip[0]<=p1[0]&&ip[0]>=p2[0]){doesIntersect.x=true}}else{if(ip[0]>=p1[0]&&ip[0]<=p2[0]){doesIntersect.x=true}}if(p1[1]>p2[1]){if(ip[1]<=p1[1]&&ip[1]>=p2[1]){doesIntersect.y=true}}else{if(ip[1]>=p1[1]&&ip[1]<=p2[1]){doesIntersect.y=true}}}return(doesIntersect.x&&doesIntersect.y)}})();(function(){Phoria.Preloader=function(){this.images=[];return this};Phoria.Preloader.prototype={images:null,callback:null,counter:0,addImage:function addImage(img,url){var me=this;img.url=url;img.onload=function(){me.counter++;if(me.counter===me.images.length){me.callback.call(me)}};this.images.push(img)},onLoadCallback:function onLoadCallback(fn){this.counter=0;this.callback=fn;for(var i=0,j=this.images.length;i<j;i++){this.images[i].src=this.images[i].url}}}})();(function(){Phoria.Scene=function(){this.camera={up:{x:0,y:1,z:0},lookat:{x:0,y:0,z:0},position:{x:0,y:0,z:-10}};this.perspective={fov:35,aspect:1,near:1,far:10000};this.viewport={x:0,y:0,width:1024,height:1024};this.graph=[];this.triggerHandlers=[];return this};Phoria.Scene.create=function(desc){var s=new Phoria.Scene();if(desc.camera){s.camera=Phoria.Util.merge(s.camera,desc.camera)}if(desc.perspective){s.perspective=Phoria.Util.merge(s.perspective,desc.perspective)}if(desc.viewport){s.viewport=Phoria.Util.merge(s.viewport,desc.viewport)}if(desc.graph){s.graph=desc.graph}if(desc.onCamera){s.onCamera(desc.onCamera)}return s};Phoria.Scene.createFromJSON=function(json){var scene=null;var jscene=JSON.parse(json);if(jscene){if(jscene.graph){var fnProcessEntities=function(entities){for(var i=0,e;i<entities.length;i++){e=entities[i];for(var p in e){if(e.hasOwnProperty(p)){if(p.indexOf("on")===0&&(e[p] instanceof string||e[p] instanceof Array)){try{}catch(error){console.log("Failed to convert expected event handler to function: "+p+"="+e[p]);throw error}}if(p==="children"&&e[p] instanceof Array){fnProcessEntities(e[p])}}}}};fnProcessEntities(jscene.graph)}}return scene};Phoria.Scene.toJSON=function(scene){for(var p in scene){if(scene.hasOwnProperty(p)&&p.indexOf("_")===0){delete scene[p]}}if(scene.graph){var fnProcessEntities=function(entities){for(var i=0,e;i<entities.length;i++){e=entities[i];for(var p in e){if(e.hasOwnProperty(p)){if(p.indexOf("on")===0&&e[p] instanceof Array){e[p]=e[p].toString()}if(p.indexOf("_")===0){delete e[p]}switch(p){case"textures":delete e[p];break;case"children":if(e[p] instanceof Array){fnProcessEntities(e[p])}break}}}}};fnProcessEntities(scene.graph)}return JSON.stringify(scene)};Phoria.Scene.prototype={camera:null,perspective:null,graph:null,viewport:null,renderlist:null,lights:null,triggerHandlers:null,onCameraHandlers:null,_entities:null,_lastTime:0,_cameraPosition:null,_perspectiveScale:0,findEntity:function findEntity(id){return this._entities[id]},onCamera:function onCamera(fn){if(this.onCameraHandlers===null){this.onCameraHandlers=[]}this.onCameraHandlers=this.onCameraHandlers.concat(fn)},modelView:function modelView(){var now=Date.now(),time=(now-this._lastTime)/1000;this._lastTime=now;var vpx=this.viewport.x,vpy=this.viewport.y,vpw=this.viewport.width*0.5,vph=this.viewport.height*0.5;this._cameraPosition=vec4.fromValues(this.camera.position.x,this.camera.position.y,this.camera.position.z,0);var camera=mat4.create(),cameraLookat=vec4.fromValues(this.camera.lookat.x,this.camera.lookat.y,this.camera.lookat.z,0),cameraUp=vec4.fromValues(this.camera.up.x,this.camera.up.y,this.camera.up.z,0);if(this.onCameraHandlers!==null){for(var h=0;h<this.onCameraHandlers.length;h++){this.onCameraHandlers[h].call(this,this._cameraPosition,cameraLookat,cameraUp)}}mat4.lookAt(camera,this._cameraPosition,cameraLookat,cameraUp);var perspective=mat4.create();mat4.perspective(perspective,-this.perspective.fov*Phoria.RADIANS,this.perspective.aspect,this.perspective.near,this.perspective.far);this._perspectiveScale=(256-this.perspective.fov)/16;var renderlist=[],lights=[],entityById={};var fnProcessEntities=function processEntities(entities,matParent){for(var n=0,obj,len,isIdentity;n<entities.length;n++){obj=entities[n];if(obj.disabled){continue}if(obj.id){entityById[obj.id]=obj}if(obj.onBeforeSceneHandlers!==null){for(var h=0;h<obj.onBeforeSceneHandlers.length;h++){obj.onBeforeSceneHandlers[h].call(obj,this,time)}}var matLocal=obj.matrix;if(matParent){matLocal=matLocal?mat4.multiply(mat4.create(),matLocal,matParent):matParent}if(obj.onSceneHandlers!==null){for(var h=0;h<obj.onSceneHandlers.length;h++){obj.onSceneHandlers[h].call(obj,this,matLocal,time)}}if(obj instanceof Phoria.BaseLight){lights.push(obj)}else{if(obj instanceof Phoria.Entity){len=obj.points.length;obj.initCoordinateBuffers();var objClip=0,clipOffset=0;if(obj.style.drawmode==="point"){if(obj.style.linescale===0){clipOffset=obj.style.linewidth*0.5}else{clipOffset=(obj.style.linewidth*obj.style.linescale)/this._perspectiveScale*0.5}}for(var v=0,verts,vec,w,avz=0;v<len;v++){verts=obj.points[v];vec=vec4.set(obj._worldcoords[v],verts.x,verts.y,verts.z,1);if(matLocal){vec4.transformMat4(obj._worldcoords[v],vec,matLocal)}vec4.transformMat4(obj._cameracoords[v],obj._worldcoords[v],camera);vec4.transformMat4(obj._coords[v],obj._cameracoords[v],perspective);vec=obj._coords[v];w=vec[3];if(w===0){w=Phoria.EPSILON}objClip+=(obj._clip[v]=(vec[0]>w+clipOffset||vec[0]<-w-clipOffset||vec[1]>w+clipOffset||vec[1]<-w-clipOffset||vec[2]>w||vec[2]<-w)?1:0);vec[0]/=w;vec[1]/=w;vec[0]=vpw*vec[0]+vpx+vpw;vec[1]=vph*vec[1]+vpy+vph;avz+=vec[2]}obj._averagez=len>1?avz/len:avz;if(objClip!==len){switch(obj.style.geometrysortmode){default:case"automatic":case"sorted":if(obj.style.geometrysortmode==="sorted"||obj.style.drawmode==="solid"||obj.style.shademode==="lightsource"){switch(obj.style.drawmode){case"solid":Phoria.Util.sortPolygons(obj.polygons,obj._cameracoords);break;case"wireframe":Phoria.Util.sortEdges(obj.edges,obj._cameracoords);break;case"point":Phoria.Util.sortPoints(obj._coords,obj._worldcoords);break}}break}if(obj.style.drawmode==="solid"&&obj.polygons.length!==0){var matNormals=mat4.invert(mat4.create(),matLocal?matLocal:mat4.create());mat4.transpose(matNormals,matNormals);switch(obj.style.shademode){case"lightsource":for(var i=0,normal,wnormal;i<obj.polygons.length;i++){if(!obj.polygons[i]._worldnormal){obj.polygons[i]._worldnormal=vec4.create()}normal=obj.polygons[i].normal;wnormal=obj.polygons[i]._worldnormal;vec3.transformMat4(wnormal,normal,matNormals);vec3.normalize(wnormal,wnormal)}break}}renderlist.push(obj)}}}if(obj.children&&obj.children.length!==0){fnProcessEntities.call(this,obj.children,matLocal)}}};fnProcessEntities.call(this,this.graph,null);this.renderlist=renderlist;this.lights=lights;this._entities=entityById;for(var t=0,len=this.triggerHandlers.length;t<len;t++){if(this.triggerHandlers[t].trigger.call(this,this._cameraPosition,cameraLookat,cameraUp)){this.triggerHandlers.splice(t,1);len--}}}}})();(function(){Phoria.BaseEntity=function(){this.matrix=mat4.create();this.children=[];return this};Phoria.BaseEntity.create=function create(desc,e){if(!e){e=new Phoria.BaseEntity()}if(desc.id){e.id=desc.id}if(desc.matrix){e.matrix=desc.matrix}if(desc.children){e.children=desc.children}if(desc.onBeforeScene){e.onBeforeScene(desc.onBeforeScene)}if(desc.onScene){e.onScene(desc.onScene)}if(desc.disabled!==undefined){e.disabled=desc.disabled}return e};Phoria.BaseEntity.prototype={id:null,children:null,matrix:null,disabled:false,onBeforeSceneHandlers:null,onSceneHandlers:null,onBeforeScene:function onBeforeScene(fn){if(this.onBeforeSceneHandlers===null){this.onBeforeSceneHandlers=[]}this.onBeforeSceneHandlers=this.onBeforeSceneHandlers.concat(fn)},onScene:function onScene(fn){if(this.onSceneHandlers===null){this.onSceneHandlers=[]}this.onSceneHandlers=this.onSceneHandlers.concat(fn)},identity:function identity(){mat4.identity(this.matrix);return this},invert:function invert(){mat4.invert(this.matrix,this.matrix);return this},multiply:function multiply(m){mat4.multiply(this.matrix,this.matrix,m);return this},scale:function scale(vec){mat4.scale(this.matrix,this.matrix,vec);return this},scaleN:function scale(n){mat4.scale(this.matrix,this.matrix,vec3.fromValues(n,n,n));return this},rotate:function rotate(rad,axis){mat4.rotate(this.matrix,this.matrix,rad,axis);return this},rotateX:function rotateX(rad){mat4.rotateX(this.matrix,this.matrix,rad);return this},rotateY:function rotateY(rad){mat4.rotateY(this.matrix,this.matrix,rad);return this},rotateZ:function rotateZ(rad){mat4.rotateZ(this.matrix,this.matrix,rad);return this},rotateYPR:function rotateYPR(yaw,pitch,roll){var m=mat4.fromYPR(yaw,pitch,roll);mat4.multiply(this.matrix,this.matrix,m)},translate:function translate(vec){mat4.translate(this.matrix,this.matrix,vec);return this},translateX:function translateX(n){mat4.translate(this.matrix,this.matrix,vec3.fromValues(n,0,0));return this},translateY:function translateY(n){mat4.translate(this.matrix,this.matrix,vec3.fromValues(0,n,0));return this},translateZ:function translateZ(n){mat4.translate(this.matrix,this.matrix,vec3.fromValues(0,0,n));return this},determinant:function determinant(){return mat4.determinant(this.matrix)},transpose:function transpose(){mat4.transpose(this.matrix,this.matrix);return this}}})();Phoria.CLIP_ARRAY_TYPE=(typeof Uint32Array!=="undefined")?Uint32Array:Array;(function(){Phoria.Entity=function(){Phoria.Entity.superclass.constructor.call(this);this.points=[];this.edges=[];this.polygons=[];this.textures=[];this.style=Phoria.Entity.createStyle();return this};Phoria.Entity.create=function create(desc,e){if(!e){e=new Phoria.Entity()}Phoria.BaseEntity.create(desc,e);if(desc.points){e.points=desc.points}if(desc.polygons){e.polygons=desc.polygons}if(desc.edges){e.edges=desc.edges}if(desc.style){Phoria.Util.combine(e.style,desc.style)}if(desc.onRender){e.onRender(desc.onRender)}e.generatePolygonNormals();return e};Phoria.Entity.createStyle=function createStyle(s){var style={color:[128,128,128],diffuse:1,specular:0,drawmode:"solid",shademode:"lightsource",fillmode:"inflate",objectsortmode:"sorted",geometrysortmode:"automatic",linewidth:1,linescale:0,opacity:1,doublesided:false};if(s){Phoria.Util.combine(style,s)}return style};Phoria.Util.extend(Phoria.Entity,Phoria.BaseEntity,{points:null,edges:null,polygons:null,style:null,textures:null,onRenderHandlers:null,_worldcoords:null,_cameracoords:null,_coords:null,_clip:null,_averagez:0,_sorted:true,onRender:function onRender(fn){if(this.onRenderHandlers===null){this.onRenderHandlers=[]}this.onRenderHandlers=this.onRenderHandlers.concat(fn)},generatePolygonNormals:function generatePolygonNormals(){if(this.polygons){var points=this.points,polygons=this.polygons;for(var i=0,vertices,x1,y1,z1,x2,y2,z2;i<polygons.length;i++){vertices=polygons[i].vertices;x1=points[vertices[1]].x-points[vertices[0]].x;y1=points[vertices[1]].y-points[vertices[0]].y;z1=points[vertices[1]].z-points[vertices[0]].z;x2=points[vertices[2]].x-points[vertices[0]].x;y2=points[vertices[2]].y-points[vertices[0]].y;z2=points[vertices[2]].z-points[vertices[0]].z;polygons[i].normal=Phoria.Util.calcNormalVector(x1,y1,z1,x2,y2,z2)}}},initCoordinateBuffers:function initCoordinateBuffers(){var len=this.points.length;if(this._worldcoords===null||this._worldcoords.length<len){this._worldcoords=new Array(len);for(var i=0;i<len;i++){this._worldcoords[i]=vec4.create()}}if(this._cameracoords===null||this._cameracoords.length<len){this._cameracoords=new Array(len);for(var i=0;i<len;i++){this._cameracoords[i]=vec4.create()}}if(this._coords===null||this._coords.length<len){this._coords=new Array(len);for(var i=0;i<len;i++){this._coords[i]=vec4.create()}}if(this._clip===null||this._clip.length<len){this._clip=new Phoria.CLIP_ARRAY_TYPE(len)}},getScreenBounds:function getScreenBounds(){var minx=10000,miny=10000,maxx=-10000,maxy=-10000;for(var i=0,p;i<this._coords.length;i++){p=this._coords[i];if(p[0]<minx){minx=p[0]}if(p[0]>maxx){maxx=p[0]}if(p[1]<miny){miny=p[1]}if(p[1]>maxy){maxy=p[1]}}return{minx:minx,miny:miny,maxx:maxx,maxy:maxy}},getWorldBounds:function getWorldBounds(){var minx=10000,miny=10000,minz=10000,maxx=-10000,maxy=-10000,maxz=-10000;for(var i=0,p;i<this._worldcoords.length;i++){p=this._worldcoords[i];if(p[0]<minx){minx=p[0]}if(p[0]>maxx){maxx=p[0]}if(p[1]<miny){miny=p[1]}if(p[1]>maxy){maxy=p[1]}if(p[2]<minz){minz=p[2]}if(p[2]>maxz){maxz=p[2]}}return{minx:minx,miny:miny,maxx:maxx,maxy:maxy,minz:minz,maxz:maxz}}});Phoria.Entity.debug=function debug(entity,config){var id="Phoria.Debug"+(entity.id?(" "+entity.id):"");var debugEntity=null;for(var i=0;i<entity.children.length;i++){if(entity.children[i].id===id){debugEntity=entity.children[i];break}}if(debugEntity===null){debugEntity=new Phoria.Entity();debugEntity.id=id;debugEntity.points=[{x:0,y:0,z:0}];debugEntity.style={drawmode:"point",shademode:"callback",geometrysortmode:"none",objectsortmode:"front"};debugEntity.config={};debugEntity.onRender(function(ctx,x,y){ctx.fillStyle="#333";ctx.font="14pt Helvetica";var textPos=y;if(this.config.showId){ctx.fillText(entity.id?entity.id:"unknown - set Entity 'id' property",x,textPos);textPos+=16}if(this.config.showPosition){var p=entity.worldposition?entity.worldposition:debugEntity._worldcoords[0];ctx.fillText("{x:"+p[0].toFixed(2)+", y:"+p[1].toFixed(2)+", z:"+p[2].toFixed(2)+"}",x,textPos)}});entity.children.push(debugEntity);var fnCreateAxis=function(letter,vector,color){var axisEntity=new Phoria.Entity();axisEntity.points=[{x:0,y:0,z:0},{x:2*vector[0],y:2*vector[1],z:2*vector[2]}];axisEntity.edges=[{a:0,b:1}];axisEntity.style={drawmode:"wireframe",shademode:"plain",geometrysortmode:"none",objectsortmode:"front",linewidth:2,color:color};axisEntity.disabled=true;return axisEntity};debugEntity.children.push(fnCreateAxis("X",vec3.fromValues(1,0,0),[255,0,0]));debugEntity.children.push(fnCreateAxis("Y",vec3.fromValues(0,1,0),[0,255,0]));debugEntity.children.push(fnCreateAxis("Z",vec3.fromValues(0,0,1),[0,0,255]))}Phoria.Util.combine(debugEntity.config,config);for(var i=0;i<debugEntity.children.length;i++){debugEntity.children[i].disabled=!debugEntity.config.showAxis}}})();(function(){Phoria.PositionalAspect={};Phoria.PositionalAspect.prototype={position:null,worldposition:null,updatePosition:function updatePosition(matLocal){var vec=vec4.fromXYZ(this.position,1);vec4.transformMat4(vec,vec,matLocal);this.worldposition=vec}}})();(function(){Phoria.PhysicsEntity=function(){Phoria.PhysicsEntity.superclass.constructor.call(this);this.velocity={x:0,y:0,z:0};this.position={x:0,y:0,z:0};this._force={x:0,y:0,z:0};this._acceleration=null;this.gravity=true;this.onBeforeScene(this.applyPhysics);this.onScene(this.transformToScene);return this};Phoria.PhysicsEntity.create=function create(desc){var e=new Phoria.PhysicsEntity();Phoria.Entity.create(desc,e);if(desc.velocity){e.velocity=desc.velocity}if(desc.position){e.position=desc.position}if(desc.force){e._force=desc.force}if(desc.gravity!==undefined){e.gravity=desc.gravity}return e};Phoria.Util.extend(Phoria.PhysicsEntity,Phoria.Entity,{velocity:null,gravity:false,_force:null,_acceleration:null,impulse:function impulse(f){this._acceleration=f},force:function force(f){this._force=f},applyPhysics:function applyPhysics(scene){var time=1000/60/1000;var tt=time*time;if(this._acceleration){this.velocity.x+=(this._acceleration.x*tt);this.velocity.y+=(this._acceleration.y*tt);this.velocity.z+=(this._acceleration.z*tt);this._acceleration=null}if(this._force){this.velocity.x+=(this._force.x*tt);this.velocity.y+=(this._force.y*tt);this.velocity.z+=(this._force.z*tt)}if(this.gravity){this.velocity.x+=(Phoria.PhysicsEntity.GRAVITY.x*tt);this.velocity.y+=(Phoria.PhysicsEntity.GRAVITY.y*tt);this.velocity.z+=(Phoria.PhysicsEntity.GRAVITY.z*tt)}this.translate(vec3.fromXYZ(this.velocity))},transformToScene:function transformToScene(scene,matLocal){this.updatePosition(matLocal)}});Phoria.Util.augment(Phoria.PhysicsEntity,Phoria.PositionalAspect)})();Phoria.PhysicsEntity.GRAVITY={x:0,y:-9.8,z:0};(function(){Phoria.EmitterEntity=function(){Phoria.EmitterEntity.superclass.constructor.call(this);this.position={x:0,y:0,z:0};this.positionRnd={x:0,y:0,z:0};this.velocity={x:0,y:1,z:0};this.velocityRnd={x:0,y:0,z:0};this.maximum=1000;this.gravity=true;var style=Phoria.Entity.createStyle();style.drawmode="point";style.shademode="plain";style.geometrysortmode="none";style.linewidth=5;style.linescale=2;this.style=style;this.textures=[];this._lastEmitTime=Date.now();this.onScene(this.emitParticles);return this};Phoria.EmitterEntity.create=function create(desc){var e=new Phoria.EmitterEntity();Phoria.BaseEntity.create(desc,e);if(desc.position){e.position=desc.position}if(desc.positionRnd){e.positionRnd=desc.positionRnd}if(desc.rate){e.rate=desc.rate}if(desc.maximum){e.maximum=desc.maximum}if(desc.velocity){e.velocity=desc.velocity}if(desc.velocityRnd){e.velocityRnd=desc.velocityRnd}if(desc.lifetime){e.lifetime=desc.lifetime}if(desc.lifetimeRnd){e.lifetimeRnd=desc.lifetimeRnd}if(desc.gravity!==undefined){e.gravity=desc.gravity}if(desc.style){Phoria.Util.combine(e.style,desc.style)}if(desc.onParticle){e.onParticle(desc.onParticle)}return e};Phoria.Util.extend(Phoria.EmitterEntity,Phoria.BaseEntity,{style:null,rate:0,maximum:0,velocity:null,velocityRnd:null,lifetime:0,lifetimeRnd:0,gravity:false,_lastEmitTime:0,onParticleHandlers:null,onParticle:function onParticle(fn){if(this.onParticleHandlers===null){this.onParticleHandlers=[]}this.onParticleHandlers=this.onParticleHandlers.concat(fn)},emitParticles:function emitParticles(scene,matLocal,time){this.updatePosition(matLocal);var now=Date.now();for(var i=0,p;i<this.children.length;i++){p=this.children[i];if(p._gravetime&&now>p._gravetime){this.children.splice(i,1)}}var since=now-this._lastEmitTime;var count=Math.floor((this.rate/1000)*since);if(count>0){for(var c=0;c<count&&(this.maximum===0||this.children.length<this.maximum);c++){var pos={x:this.position.x,y:this.position.y,z:this.position.z};pos.x+=(Math.random()*this.positionRnd.x)-(this.positionRnd.x*0.5);pos.y+=(Math.random()*this.positionRnd.y)-(this.positionRnd.y*0.5);pos.z+=(Math.random()*this.positionRnd.z)-(this.positionRnd.z*0.5);var vel={x:this.velocity.x,y:this.velocity.y,z:this.velocity.z};vel.x+=(Math.random()*this.velocityRnd.x)-(this.velocityRnd.x*0.5);vel.y+=(Math.random()*this.velocityRnd.y)-(this.velocityRnd.y*0.5);vel.z+=(Math.random()*this.velocityRnd.z)-(this.velocityRnd.z*0.5);var particle=new Phoria.PhysicsEntity();particle.position=pos;particle.points=[pos];particle.velocity=vel;particle.gravity=this.gravity;particle.style=this.style;particle.textures=this.textures;if(this.lifetime!==0){particle._gravetime=Math.floor(now+this.lifetime+(this.lifetimeRnd*Math.random())-this.lifetimeRnd*0.5)}if(this.onParticleHandlers!==null){for(var h=0;h<this.onParticleHandlers.length;h++){this.onParticleHandlers[h].call(this,particle)}}this.children.push(particle)}this._lastEmitTime=now}}});Phoria.Util.augment(Phoria.EmitterEntity,Phoria.PositionalAspect)})();(function(){Phoria.BaseLight=function(){Phoria.BaseLight.superclass.constructor.call(this);this.color=[1,1,1];this.intensity=1;return this};Phoria.Util.extend(Phoria.BaseLight,Phoria.BaseEntity,{color:null,intensity:0})})();(function(){Phoria.DistantLight=function(){Phoria.DistantLight.superclass.constructor.call(this);this.direction={x:0,y:0,z:1};this.onScene(this.transformToScene);return this};Phoria.DistantLight.create=function create(desc){var e=new Phoria.DistantLight();Phoria.BaseEntity.create(desc,e);if(desc.color){e.color=desc.color}if(desc.intensity){e.intensity=desc.intensity}if(desc.direction){e.direction=vec3.toXYZ(vec3.normalize(e.direction,vec3.fromXYZ(desc.direction)))}return e};Phoria.Util.extend(Phoria.DistantLight,Phoria.BaseLight,{direction:null,worlddirection:null,transformToScene:function transformToScene(){this.worlddirection=vec3.fromValues(-this.direction.x,-this.direction.y,-this.direction.z)}})})();(function(){Phoria.PointLight=function(){Phoria.PointLight.superclass.constructor.call(this);this.position={x:0,y:0,z:-1};this.attenuation=0.1;this.attenuationFactor="linear";this.onScene(this.transformToScene);return this};Phoria.PointLight.create=function create(desc){var e=new Phoria.PointLight();Phoria.BaseEntity.create(desc,e);if(desc.color){e.color=desc.color}if(desc.intensity){e.intensity=desc.intensity}if(desc.position){e.position=desc.position}if(desc.attenuation){e.attenuation=desc.attenuation}if(desc.attenuationFactor){e.attenuationFactor=desc.attenuationFactor}return e};Phoria.Util.extend(Phoria.PointLight,Phoria.BaseLight,{attenuation:0,attenuationFactor:null,transformToScene:function transformToScene(scene,matLocal,time){this.updatePosition(matLocal)}});Phoria.Util.augment(Phoria.PointLight,Phoria.PositionalAspect)})();(function(){Phoria.Renderer=function(){};Phoria.Renderer.prototype={sort:true,sortObjects:function sortObjects(scene){if(this.sort){for(var n=0,obj;n<scene.renderlist.length;n++){obj=scene.renderlist[n];switch(obj.style.objectsortmode){case"sorted":break;case"front":obj._averagez=Number.MIN_VALUE;break;case"back":default:obj._averagez=Number.MAX_VALUE;break}}scene.renderlist.sort(function sortObjectsZ(a,b){return(a._averagez<b._averagez?1:-1)})}},calcNormalBrightness:function calcNormalBrightness(position,normal,scene,obj){var rgb=[0,0,0],lights=scene.lights;for(var e=0,light,brightness;e<lights.length;e++){light=lights[e];if(light instanceof Phoria.DistantLight){var dotVP=vec3.dot(normal,light.worlddirection);if(dotVP<=0){continue}brightness=dotVP*light.intensity*obj.style.diffuse}else{if(light instanceof Phoria.PointLight){var vecToLight=vec3.subtract(vec3.create(),position,light.worldposition),distance=vec3.length(vecToLight),attenuation;vec3.normalize(vecToLight,vecToLight);var dotVP=vec3.dot(normal,vec3.negate(vecToLight,vecToLight));if(dotVP<=0){continue}switch(light.attenuationFactor){default:case"none":attenuation=light.attenuation;break;case"linear":attenuation=light.attenuation*distance;break;case"squared":attenuation=light.attenuation*distance*distance;break}if(obj.style.specular!==0){var halfV=vec3.add(vec3.create(),vecToLight,scene._cameraPosition),dotHV=vec3.dot(normal,vec3.normalize(halfV,halfV)),pf=Math.pow(dotHV,obj.style.specular)*light.intensity/attenuation;rgb[0]+=pf*light.color[0];rgb[1]+=pf*light.color[1];rgb[2]+=pf*light.color[2]}brightness=obj.style.diffuse*dotVP*light.intensity/attenuation}}rgb[0]+=brightness*light.color[0];rgb[1]+=brightness*light.color[1];rgb[2]+=brightness*light.color[2]}return rgb},calcPositionBrightness:function calcPositionBrightness(position,lights){var rgb=[0,0,0];for(var e=0,light,brightness;e<lights.length;e++){light=lights[e];if(light instanceof Phoria.DistantLight){brightness=light.intensity}else{if(light instanceof Phoria.PointLight){var vecToLight=vec3.subtract(vec3.create(),position,light.worldposition),distance=vec3.length(vecToLight),attenuation;vec3.normalize(vecToLight,vecToLight);switch(light.attenuationFactor){case"linear":attenuation=light.attenuation*distance;break;case"squared":attenuation=light.attenuation*distance*distance;break;default:case"none":attenuation=light.attenuation;break}brightness=light.intensity/(attenuation*2)}}rgb[0]+=brightness*light.color[0];rgb[1]+=brightness*light.color[1];rgb[2]+=brightness*light.color[2]}return rgb},inflatePolygon:function inflatePolygon(vertices,coords,pixels){pixels=pixels||0.5;var inflatedVertices=new Array(vertices.length);for(var i=0;i<vertices.length;i++){inflatedVertices[i]=[coords[vertices[i]][0],coords[vertices[i]][1]]}for(var i=0,j=vertices.length,k,x1,y1,x2,y2,dx,dy,len;i<j;i++){k=(i<j-1)?(i+1):0;x1=inflatedVertices[i][0];y1=inflatedVertices[i][1];x2=inflatedVertices[k][0];y2=inflatedVertices[k][1];var x=x2-x1,y=y2-y1,det=x*x+y*y,idet;if(det===0){det===Phoria.EPSILON}idet=pixels/Math.sqrt(det);x*=idet;y*=idet;inflatedVertices[i][0]-=x;inflatedVertices[i][1]-=y;inflatedVertices[k][0]+=x;inflatedVertices[k][1]+=y}return inflatedVertices},inflatePolygonFull:function inflatePolygonFull(vertices,coords,pixels){pixels=pixels||0.5;var pedges=[],inflatedVertices=new Array(vertices.length);for(var i=0,j=vertices.length,x1,y1,x2,y2,dx,dy,len;i<j;i++){x1=coords[vertices[i]][0];y1=coords[vertices[i]][1];if(i<j-1){x2=coords[vertices[i+1]][0];y2=coords[vertices[i+1]][1]}else{x2=coords[vertices[0]][0];y2=coords[vertices[0]][1]}dx=y2-y1;dy=-(x2-x1);len=Math.sqrt(dx*dx+dy*dy);dx/=len;dy/=len;dx*=pixels;dy*=pixels;pedges.push({x:x1+dx,y:y1+dy});pedges.push({x:x2+dx,y:y2+dy})}for(var i=0,j=vertices.length,vec;i<j;i++){if(i===0){vec=this.intersection(pedges[(j-1)*2],pedges[(j-1)*2+1],pedges[0],pedges[1])}else{vec=this.intersection(pedges[(i-1)*2],pedges[(i-1)*2+1],pedges[i*2],pedges[i*2+1])}if(Math.abs(vec[0]-coords[vertices[i]][0])>1.5||Math.abs(vec[1]-coords[vertices[i]][1])>1.5){vec[0]=coords[vertices[i]][0];vec[1]=coords[vertices[i]][1]}inflatedVertices[i]=vec}return inflatedVertices},intersection:function intersection(line0v0,line0v1,line1v0,line1v1){var a1=line0v1.x-line0v0.x,b1=line1v0.x-line1v1.x,c1=line1v0.x-line0v0.x,a2=line0v1.y-line0v0.y,b2=line1v0.y-line1v1.y,c2=line1v0.y-line0v0.y,t=(b1*c2-b2*c1)/(a2*b1-a1*b2);return[line0v0.x+t*(line0v1.x-line0v0.x),line0v0.y+t*(line0v1.y-line0v0.y)]}}})();(function(){Phoria.CanvasRenderer=function(canvas){Phoria.CanvasRenderer.superclass.constructor.call(this);this.canvas=canvas;this.ctx=canvas.getContext("2d");return this};Phoria.Util.extend(Phoria.CanvasRenderer,Phoria.Renderer,{canvas:null,ctx:null,render:function render(scene,fnClear){this.sortObjects(scene);var ctx=this.ctx;if(!fnClear){ctx.clearRect(0,0,this.canvas.width,this.canvas.height)}else{fnClear.call(this,ctx)}for(var n=0,obj;n<scene.renderlist.length;n++){obj=scene.renderlist[n];ctx.save();if(obj.style.compositeOperation){ctx.globalCompositeOperation=obj.style.compositeOperation}switch(obj.style.drawmode){case"solid":if(obj.style.fillmode==="fillstroke"||obj.style.fillmode==="hiddenline"){ctx.lineWidth=1}for(var i=0;i<obj.polygons.length;i++){this.renderPolygon(ctx,obj,scene,obj.polygons[i])}break;case"wireframe":ctx.lineWidth=obj.style.linewidth;ctx.globalAlpha=obj.style.opacity;if(obj.style.shademode==="plain"){ctx.strokeStyle="rgb("+obj.style.color[0]+","+obj.style.color[1]+","+obj.style.color[2]+")";ctx.beginPath();for(var i=0;i<obj.edges.length;i++){this.renderEdge(ctx,obj,scene,obj.edges[i])}ctx.closePath();ctx.stroke()}else{for(var i=0;i<obj.edges.length;i++){this.renderEdge(ctx,obj,scene,obj.edges[i])}}break;case"point":if(obj.style.shademode==="sprite"&&obj.style.sprite!==undefined){if(!obj.textures){throw new Error("Entity has shademode 'sprite' but no textures defined on parent emitter.")}if(obj.style.sprite>obj.textures.length-1){throw new Error("Entity has shademode 'sprite' index but references missing texture on parent emitter.")}}ctx.globalAlpha=obj.style.opacity;var coords=obj._coords;if(obj.style.shademode==="plain"){ctx.fillStyle="rgb("+obj.style.color[0]+","+obj.style.color[1]+","+obj.style.color[2]+")"}for(var i=0;i<coords.length;i++){this.renderPoint(ctx,obj,scene,coords[i],i)}}ctx.restore()}},renderPoint:function renderPoint(ctx,obj,scene,coord,index){if(obj._clip[index]){return}var w=obj.style.linewidth;if(obj.style.linescale!==0){w=(obj.style.linewidth*obj.style.linescale*scene._perspectiveScale)/obj._coords[index][3]}switch(obj.style.shademode){case"plain":ctx.beginPath();ctx.arc(coord[0],coord[1],w,0,Phoria.TWOPI,true);ctx.closePath();ctx.fill();break;case"sprite":if(obj.style.sprite!==undefined){ctx.drawImage(obj.textures[obj.style.sprite],coord[0]-w,coord[1]-w,w+w,w+w)}break;case"callback":if(obj.onRenderHandlers!==null){for(var h=0;h<obj.onRenderHandlers.length;h++){obj.onRenderHandlers[h].call(obj,ctx,coord[0],coord[1],w)}}break;case"lightsource":var rgb=this.calcPositionBrightness(obj._worldcoords[index],scene.lights);ctx.fillStyle="rgb("+Math.min(Math.ceil(rgb[0]*obj.style.color[0]),255)+","+Math.min(Math.ceil(rgb[1]*obj.style.color[1]),255)+","+Math.min(Math.ceil(rgb[2]*obj.style.color[2]),255)+")";ctx.beginPath();ctx.arc(coord[0],coord[1],w,0,Phoria.TWOPI,true);ctx.closePath();ctx.fill();break}},renderEdge:function renderEdge(ctx,obj,scene,edge){if(obj._clip[edge.a]&obj._clip[edge.b]){return}var coords=obj._coords;if(obj.style.linescale!==0){ctx.lineWidth=((obj.style.linewidth*obj.style.linescale)/((obj._coords[edge.a][3]+obj._coords[edge.b][3])*0.5))*scene._perspectiveScale}if(obj.style.shademode==="lightsource"){var edgea=obj._worldcoords[edge.a],edgeb=obj._worldcoords[edge.b],position=vec3.fromValues((edgea[0]+edgeb[0])*0.5,(edgea[1]+edgeb[1])*0.5,(edgea[2]+edgeb[2])*0.5);var rgb=this.calcPositionBrightness(position,scene.lights);ctx.beginPath();ctx.strokeStyle="rgb("+Math.min(Math.ceil(rgb[0]*obj.style.color[0]),255)+","+Math.min(Math.ceil(rgb[1]*obj.style.color[1]),255)+","+Math.min(Math.ceil(rgb[2]*obj.style.color[2]),255)+")";ctx.moveTo(coords[edge.a][0],coords[edge.a][1]);ctx.lineTo(coords[edge.b][0],coords[edge.b][1]);ctx.closePath();ctx.stroke()}else{ctx.moveTo(coords[edge.a][0],coords[edge.a][1]);ctx.lineTo(coords[edge.b][0],coords[edge.b][1])}},renderPolygon:function renderPolygon(ctx,obj,scene,poly){var coords=obj._coords,clip=obj._clip,vertices=poly.vertices,color=poly.color?poly.color:obj.style.color,fillStyle=null,rgb,emit=0,opacity=(poly.opacity?poly.opacity:obj.style.opacity);var clippoly=1;for(var i=0;i<vertices.length;i++){clippoly&=clip[vertices[i]]}if(clippoly){return}if(!obj.style.doublesided&&((coords[vertices[0]][0]*coords[vertices[1]][1]-coords[vertices[1]][0]*coords[vertices[0]][1])+(coords[vertices[1]][0]*coords[vertices[2]][1]-coords[vertices[2]][0]*coords[vertices[1]][1])+(coords[vertices[2]][0]*coords[vertices[0]][1]-coords[vertices[0]][0]*coords[vertices[2]][1])<0)){return}switch(obj.style.shademode){case"plain":if(obj.style.texture===undefined&&poly.texture===undefined){fillStyle=color[0]+","+color[1]+","+color[2]}break;case"lightsource":rgb=this.calcNormalBrightness(Phoria.Util.averagePolyVertex(vertices,obj._worldcoords),poly._worldnormal,scene,obj);if(poly.emit||obj.style.emit){emit=poly.emit?poly.emit:obj.style.emit}fillStyle=Math.min(Math.ceil(rgb[0]*color[0]+color[0]*emit),255)+","+Math.min(Math.ceil(rgb[1]*color[1]+color[1]*emit),255)+","+Math.min(Math.ceil(rgb[2]*color[2]+color[1]*emit),255);break}ctx.save();if(obj.style.texture!==undefined||poly.texture!==undefined){var bitmap=obj.textures[poly.texture!==undefined?poly.texture:obj.style.texture],tx0,ty0,tx1,ty1,tx2,ty2;var fRenderTriangle=function(vs,sx0,sy0,sx1,sy1,sx2,sy2){var x0=vs[0][0],y0=vs[0][1],x1=vs[1][0],y1=vs[1][1],x2=vs[2][0],y2=vs[2][1];ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.lineTo(x2,y2);ctx.closePath();ctx.clip();var denom=denom=1/(sx0*(sy2-sy1)-sx1*sy2+sx2*sy1+(sx1-sx2)*sy0);var m11=-(sy0*(x2-x1)-sy1*x2+sy2*x1+(sy1-sy2)*x0)*denom,m12=(sy1*y2+sy0*(y1-y2)-sy2*y1+(sy2-sy1)*y0)*denom,m21=(sx0*(x2-x1)-sx1*x2+sx2*x1+(sx1-sx2)*x0)*denom,m22=-(sx1*y2+sx0*(y1-y2)-sx2*y1+(sx2-sx1)*y0)*denom,dx=(sx0*(sy2*x1-sy1*x2)+sy0*(sx1*x2-sx2*x1)+(sx2*sy1-sx1*sy2)*x0)*denom,dy=(sx0*(sy2*y1-sy1*y2)+sy0*(sx1*y2-sx2*y1)+(sx2*sy1-sx1*sy2)*y0)*denom;ctx.transform(m11,m12,m21,m22,dx,dy);ctx.globalAlpha=opacity;ctx.drawImage(bitmap,0,0)};if(fillStyle!==null){var alpha=rgb[0]*0.3+rgb[1]*0.6+rgb[2]*0.1;if(alpha>1){alpha=1}ctx.fillStyle="rgba("+fillStyle+","+(1-alpha).toFixed(3)+")"}if(vertices.length===3){tx0=0,ty0=0,tx1=bitmap.width,ty1=0,tx2=bitmap.width,ty2=bitmap.height;if(poly.uvs!==undefined){tx0=bitmap.width*poly.uvs[0];ty0=bitmap.height*poly.uvs[1];tx1=bitmap.width*poly.uvs[2];ty1=bitmap.height*poly.uvs[3];tx2=bitmap.width*poly.uvs[4];ty2=bitmap.height*poly.uvs[5]}var inflatedVertices=this.inflatePolygon(vertices,coords,0.5);fRenderTriangle.call(this,inflatedVertices,tx0,ty0,tx1,ty1,tx2,ty2);if(fillStyle!==null){ctx.fill()}}else{if(vertices.length===4){tx0=0,ty0=0,tx1=bitmap.width,ty1=0,tx2=bitmap.width,ty2=bitmap.height;if(poly.uvs!==undefined){tx0=bitmap.width*poly.uvs[0];ty0=bitmap.height*poly.uvs[1];tx1=bitmap.width*poly.uvs[2];ty1=bitmap.height*poly.uvs[3];tx2=bitmap.width*poly.uvs[4];ty2=bitmap.height*poly.uvs[5]}ctx.save();var inflatedVertices=this.inflatePolygon(vertices.slice(0,3),coords,0.5);fRenderTriangle.call(this,inflatedVertices,tx0,ty0,tx1,ty1,tx2,ty2);ctx.restore();tx0=bitmap.width,ty0=bitmap.height,tx1=0,ty1=bitmap.height,tx2=0,ty2=0;if(poly.uvs!==undefined){tx0=bitmap.width*poly.uvs[4];ty0=bitmap.height*poly.uvs[5];tx1=bitmap.width*poly.uvs[6];ty1=bitmap.height*poly.uvs[7];tx2=bitmap.width*poly.uvs[0];ty2=bitmap.height*poly.uvs[1]}ctx.save();var v=new Array(3);v[0]=vertices[2];v[1]=vertices[3];v[2]=vertices[0];inflatedVertices=this.inflatePolygon(v,coords,0.5);fRenderTriangle.call(this,inflatedVertices,tx0,ty0,tx1,ty1,tx2,ty2);ctx.restore();if(fillStyle!==null){inflatedVertices=this.inflatePolygon(vertices,coords,0.75);ctx.beginPath();ctx.moveTo(inflatedVertices[0][0],inflatedVertices[0][1]);for(var i=1,j=inflatedVertices.length;i<j;i++){ctx.lineTo(inflatedVertices[i][0],inflatedVertices[i][1])}ctx.closePath();ctx.globalAlpha=opacity;ctx.fill()}}}}else{if(obj.style.fillmode==="inflate"){var inflatedVertices=this.inflatePolygon(vertices,coords,0.5);ctx.beginPath();ctx.moveTo(inflatedVertices[0][0],inflatedVertices[0][1]);for(var i=1,j=vertices.length;i<j;i++){ctx.lineTo(inflatedVertices[i][0],inflatedVertices[i][1])}ctx.closePath()}else{ctx.beginPath();ctx.moveTo(coords[vertices[0]][0],coords[vertices[0]][1]);for(var i=1;i<vertices.length;i++){ctx.lineTo(coords[vertices[i]][0],coords[vertices[i]][1])}ctx.closePath()}fillStyle="rgba("+fillStyle+","+opacity+")";switch(obj.style.fillmode){case"fill":ctx.fillStyle=fillStyle;ctx.fill();break;case"filltwice":ctx.fillStyle=fillStyle;ctx.fill();ctx.fill();break;case"inflate":ctx.fillStyle=fillStyle;ctx.fill();break;case"fillstroke":ctx.fillStyle=fillStyle;ctx.fill();ctx.strokeStyle=fillStyle;ctx.stroke();break;case"hiddenline":ctx.strokeStyle=fillStyle;ctx.stroke();break}}ctx.restore()}})})();(function(){Phoria.SoftwareRenderer=function(canvas){Phoria.SoftwareRenderer.superclass.constructor.call(this);this.canvas=canvas;this.ctx=canvas.getContext("2d");this._imagedata=this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);this._data=this._imagedata.data;return this};Phoria.Util.extend(Phoria.SoftwareRenderer,Phoria.Renderer,{canvas:null,ctx:null,_imagedata:null,_data:null,render:function render(scene){this.sortObjects(scene);this.clearCanvasRect(0,0,this.canvas.width,this.canvas.height);for(var n=0,obj;n<scene.renderlist.length;n++){obj=scene.renderlist[n];switch(obj.style.drawmode){case"solid":var rendercount=0;for(var i=0;i<obj.polygons.length;i++){if(this.renderPolygon(null,obj,scene,obj.polygons[i])){rendercount++}}break}}this.ctx.putImageData(this._imagedata,0,0,0,0,this.canvas.width,this.canvas.height)},clearCanvasRect:function clearCanvasRect(xmin,ymin,xmax,ymax){var offset=(xmin+ymin*this.canvas.width-1)*4+3,linestep=(this.canvas.width-(xmax-xmin))*4,data=this._data;for(var y=ymin;y<ymax;y++){for(var x=xmin;x<xmax;x++){data[offset+=4]=0}offset+=linestep}},renderPolygon:function renderPolygon(ctx,obj,scene,poly){var coords=obj._coords,clip=obj._clip,vertices=poly.vertices,color=poly.color?poly.color:obj.style.color;var clippoly=1;for(var i=0;i<vertices.length;i++){clippoly&=clip[vertices[i]]}if(clippoly){return false}if(!obj.style.doublesided&&((coords[vertices[0]][0]*coords[vertices[1]][1]-coords[vertices[1]][0]*coords[vertices[0]][1])+(coords[vertices[1]][0]*coords[vertices[2]][1]-coords[vertices[2]][0]*coords[vertices[1]][1])+(coords[vertices[2]][0]*coords[vertices[0]][1]-coords[vertices[0]][0]*coords[vertices[2]][1])<0)){return}var rgb;switch(obj.style.shademode){case"plain":rgb=new Array(3);rgb[0]=color[0];rgb[1]=color[1];rgb[2]=color[2];break;case"lightsource":rgb=this.calcNormalBrightness(Phoria.Util.averagePolyVertex(vertices,obj._worldcoords),poly._worldnormal,scene,obj);rgb[0]=Math.ceil(Math.min(rgb[0]*color[0],255));rgb[1]=Math.ceil(Math.min(rgb[1]*color[1],255));rgb[2]=Math.ceil(Math.min(rgb[2]*color[2],255));break}this.drawTriangle(coords[vertices[2]][0],coords[vertices[2]][1],coords[vertices[1]][0],coords[vertices[1]][1],coords[vertices[0]][0],coords[vertices[0]][1],rgb[0],rgb[1],rgb[2]);if(vertices.length===4){this.drawTriangle(coords[vertices[0]][0],coords[vertices[0]][1],coords[vertices[3]][0],coords[vertices[3]][1],coords[vertices[2]][0],coords[vertices[2]][1],rgb[0],rgb[1],rgb[2])}return true},drawTriangle:function drawTriangle(x1,y1,x2,y2,x3,y3,r,g,b){var x1=Math.round(16*x1),x2=Math.round(16*x2),x3=Math.round(16*x3),y1=Math.round(16*y1),y2=Math.round(16*y2),y3=Math.round(16*y3);var dx12=x1-x2,dx23=x2-x3,dx31=x3-x1,dy12=y1-y2,dy23=y2-y3,dy31=y3-y1;var fdx12=dx12<<4,fdx23=dx23<<4,fdx31=dx31<<4,fdy12=dy12<<4,fdy23=dy23<<4,fdy31=dy31<<4;var canvasWidth=this.canvas.width,canvasHeight=this.canvas.height,data=this._data;var xmin=Math.max((Math.min(x1,x2,x3)+15)>>4,0),xmax=Math.min((Math.max(x1,x2,x3)+15)>>4,canvasWidth),ymin=Math.max((Math.min(y1,y2,y3)+15)>>4,0),ymax=Math.min((Math.max(y1,y2,y3)+15)>>4,canvasHeight);if(xmax<=xmin||ymax<=ymin){return}var c1=dy12*x1-dx12*y1,c2=dy23*x2-dx23*y2,c3=dy31*x3-dx31*y3;if(dy12<0||(dy12==0&&dx12>0)){c1++}if(dy23<0||(dy23==0&&dx23>0)){c2++}if(dy31<0||(dy31==0&&dx31>0)){c3++}var cy1=c1+dx12*(ymin<<4)-dy12*(xmin<<4),cy2=c2+dx23*(ymin<<4)-dy23*(xmin<<4),cy3=c3+dx31*(ymin<<4)-dy31*(xmin<<4),cx1,cx2,cx3;for(var y=ymin,x,offset;y<ymax;y++){cx1=cy1;cx2=cy2;cx3=cy3;for(x=xmin;x<xmax;x++){if(cx1>0&&cx2>0&&cx3>0){offset=(x+y*canvasWidth)<<2;data[offset]=r;data[offset+1]=g;data[offset+2]=b;data[offset+3]=255}cx1-=fdy12;cx2-=fdy23;cx3-=fdy31}cy1+=fdx12;cy2+=fdx23;cy3+=fdx31}}})})();(function(){Phoria.View={};Phoria.View.events={};Phoria.View.addMouseEvents=function addMouseEvents(el,fnOnClick){if(el.id){var mouse={velocityH:0,velocityLastH:0,positionX:0,clickPositionX:0,velocityV:0,velocityLastV:0,positionY:0,clickPositionY:0};Phoria.View.events[el.id]=mouse;mouse.onMouseMove=function onMouseMove(evt){mouse.positionX=evt.clientX;mouse.velocityH=mouse.velocityLastH+(mouse.positionX-mouse.clickPositionX)*0.5;mouse.positionY=evt.clientY;mouse.velocityV=mouse.velocityLastV+(mouse.positionY-mouse.clickPositionY)*0.5};mouse.onMouseUp=function onMouseUp(evt){el.removeEventListener("mousemove",mouse.onMouseMove,false)};mouse.onMouseOut=function onMouseOut(evt){el.removeEventListener("mousemove",mouse.onMouseMove,false)};mouse.onMouseDown=function onMouseDown(evt){evt.preventDefault();el.addEventListener("mousemove",mouse.onMouseMove,false);mouse.clickPositionX=evt.clientX;mouse.velocityLastH=mouse.velocityH;mouse.clickPositionY=evt.clientY;mouse.velocityLastV=mouse.velocityV};el.addEventListener("mousedown",mouse.onMouseDown,false);el.addEventListener("mouseup",mouse.onMouseUp,false);el.addEventListener("mouseout",mouse.onMouseOut,false);if(fnOnClick){el.addEventListener("click",fnOnClick,false)}return mouse}};Phoria.View.removeMouseEvents=function removeMouseEvents(el,fnOnClick){if(el.id){var mouse=Phoria.View.events[el.id];if(mouse){el.removeEventListener("mousemove",mouse.onMouseMove,false);el.removeEventListener("mousedown",mouse.onMouseDown,false);el.removeEventListener("mouseup",mouse.onMouseUp,false);el.removeEventListener("mouseout",mouse.onMouseOut,false);if(fnOnClick){el.removeEventListener("click",fnOnClick,false)}Phoria.View.events[el.id]=null}}};Phoria.View.getMouse=function getMouse(el){return Phoria.View.events[el.id]};Phoria.View.calculateClickPointAndVector=function calculateClickPointAndVector(scene,mousex,mousey){var camLookAt=vec3.fromValues(scene.camera.lookat.x,scene.camera.lookat.y,scene.camera.lookat.z);var camOff=vec3.subtract(vec3.create(),scene._cameraPosition,camLookAt);var pixelsPerUnit=(scene.viewport.height/2)/(vec3.length(camOff)*Math.tan((scene.perspective.fov/180*Math.PI)/2));var dif=vec2.fromValues(mousex-(scene.viewport.width/2),mousey-(scene.viewport.height/2));vec2.subtract(dif,dif,new vec2.fromValues(8,8));var units=vec2.create();vec2.scale(units,dif,1/pixelsPerUnit);var upVector=vec3.fromValues(scene.camera.up.x,scene.camera.up.y,scene.camera.up.z);var normalVectorSide=vec3.create();vec3.cross(normalVectorSide,camOff,upVector);vec3.normalize(normalVectorSide,normalVectorSide);var clickPoint=vec3.scaleAndAdd(vec3.create(),camLookAt,normalVectorSide,units[0]);var normalVectorUp=vec3.create();vec3.cross(normalVectorUp,normalVectorSide,camOff);vec3.normalize(normalVectorUp,normalVectorUp);vec3.scale(normalVectorUp,normalVectorUp,units[1]);vec3.subtract(clickPoint,clickPoint,normalVectorUp);var camVector=vec3.add(vec3.create(),camLookAt,camOff);return{clickPoint:clickPoint,clickVector:vec3.subtract(vec3.create(),clickPoint,camVector)}};Phoria.View.getIntersectedObjects=function getIntersectedObjects(scene,clickPoint,clickVector){var intersections=[],obj,polygonNormal,polygonPoint,polygonCoords,polygonPlaneIntersection,pointVector;var objects=scene.renderlist;for(var n=0,obj;n<objects.length;n++){obj=objects[n];if(obj.style.drawmode!=="solid"){continue}for(var m=0;m<obj.polygons.length;m++){polygonNormal=vec3.clone(obj.polygons[m]._worldnormal);polygonPoint=vec3.clone(obj._worldcoords[obj.polygons[m].vertices[0]]);polygonPlaneIntersection=Phoria.Util.planeLineIntersection(polygonNormal,polygonPoint,clickVector,clickPoint);if(polygonPlaneIntersection!==null){if(Phoria.Util.intersectionInsidePolygon(obj.polygons[m],obj._worldcoords,polygonPlaneIntersection)){var returnObject={entity:obj,polygonIndex:m,intersectionPoint:polygonPlaneIntersection};intersections.push(returnObject)}}}}for(var i=0;i<intersections.length;i++){intersections[i].distance=vec3.distance(scene._cameraPosition,intersections[i].intersectionPoint)}for(var i=0;i<intersections.length-1;i++){for(var j=i+1,keepVal;j<intersections.length;j++){if(intersections[i].distance>=intersections[j].distance){keepVal=intersections[j];intersections[j]=intersections[i];intersections[i]=keepVal}}}return intersections}})();

define("phoria", ["gl.matrix","dat.gui"], (function (global) {
    return function () {
        var ret, fn;
        return ret || global.Phoria;
    };
}(this)));

define('bat_model',[
    // Libs
    'backbone',
    'phoria',
], function(Backbone, Phoria) {
    var BatModel = Backbone.Model.extend({

        x: 0,
        y: 0,
        // приращение координаты, для удобства при отрисовки
        dnextX: 0,
        dnextY: 0,
        velocityX: 0,
        velocityY: 0,
        speed: 0,

        height : 0.5,
        radius : 1.5,
        accuracy : 50,
        tmp : {},
        Shape : {},
        who_is : "nobody",
        mass: 0.2,
        stepX : 0.5,
        stepY : 0.5,
        startY : 8,
        score: 0,

        sqrt2: Math.sqrt(2),

        top: function() {
            this.velocityY = this.stepY;
            this.dnextY = this.velocityY;
            this.dnextX = 0;
        },

        bottom: function() {
            this.velocityY = -this.stepY;
            this.dnextY = this.velocityY;
            this.dnextX = 0;
        },

        left: function() {
            this.velocityX = -this.stepX;
            this.dnextX = this.velocityX;
            this.dnextY = 0;
        },

        right: function() {
            this.velocityX = this.stepX;
            this.dnextX = this.velocityX;
            this.dnextY = 0;
        },

        left_top : function () {
            this.velocityX = -this.stepX/this.sqrt2;
            this.velocityY = this.stepY/this.sqrt2;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        left_bottom : function () {
            this.velocityX = -this.stepX/this.sqrt2;
            this.velocityY = -this.stepY/this.sqrt2;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        right_top : function () {
            this.velocityX = this.stepX/this.sqrt2;
            this.velocityY = this.stepY/this.sqrt2;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        right_bottom : function () {
            this.velocityX = this.stepX/this.sqrt2;
            this.velocityY = -this.stepY/this.sqrt2;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        testBorder: function(width, height) {
            if (this.x + this.dnextX + this.radius > width) {
                this.velocityX *=-1;
                this.dnextX = width - this.radius - this.x - this.velocityX;
            } else if (this.x + this.dnextX - this.radius < -width ) {
                this.velocityX *=-1;
                this.dnextX = -width + this.radius - this.x - this.velocityX;
            } else if (this.y + this.dnextY + this.radius > -height/10) {
                this.dnextY = -this.radius - this.y - height / 10;
            } else if(this.y + this.dnextY - this.radius < -height) {
                this.dnextY = -height + this.radius - this.y;
            }
        },

        render : function () {
            this.x += this.dnextX;
            this.y += this.dnextY;
            this.Shape.translateX(this.dnextX).translateZ(this.dnextY);
            this.dnextX = 0;
            this.dnextY = 0;
            this.velocityX = 0;
            this.velocityY = 0;
        },

        setStartY : function(_y) {
            if (this.who_is === "my") {
                this.Shape.translateZ(-_y);
                this.nextY += -_y;
                this.y += -_y;
            }
            else if (this.who_is === "enemy") {
                this.Shape.translateZ(_y);
                this.nextY += _y;
                this.y += _y;
            }
        },

        initAsMy : function() {
            this.who_is = "my";
            this.setStartY(this.startY);
        },

        initAsEnemy : function() {
            this.who_is = "enemy";
            this.setStartY(this.startY);
        },

        initialize: function() {
            this.tmp = Phoria.Util.generateCylinder(this.radius,this.height,this.accuracy);
            this.Shape = Phoria.Entity.create({
                points: this.tmp.points,
                edges: this.tmp.edges,
                polygons: this.tmp.polygons,
                style : {
                    color: [20,100,200]
                }
            });
        }
    });
    return BatModel;
});
define('puck_model',[
    // Libs
    'backbone',
    'phoria',
], function(Backbone, Phoria) {
    var PuckModel = Backbone.Model.extend({

        x: 0,
        y: 0,
        dnextX: 0.1,
        dnextY: -0.1,
        velocityX: 0,
        velocityY: 0,
        speed: 0.8,

        height : 0.25,
        radius : 1,
        accuracy : 50, // детальность прорисовки фигуры
        tmp : {},
        Shape : {},
        who_is : "nobody",
        stepX : 0.2,
        startY : 8,
        start : false,
        mass: 0.1,
        angle : 280,
        radians : 0,

        update : function() {
            this.radians = this.angle * Math.PI/ 180;
            this.velocityX = Math.cos(this.radians) * this.speed;
            this.velocityY = Math.sin(this.radians) * this.speed;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        render: function() {
            if ( this.start) {
                this.Shape.translateX(this.dnextX);
                this.Shape.translateZ(this.dnextY);
                this.x += this.dnextX;
                this.y += this.dnextY;
                this.velocityX = 0;
                this.velocityY = 0;
            }
        },

        initialize: function() {
            this.tmp = Phoria.Util.generateCylinder(this.radius,this.height,this.accuracy);
            this.Shape = Phoria.Entity.create({
                points: this.tmp.points,
                edges: this.tmp.edges,
                polygons: this.tmp.polygons,
                style : {
                    color: [20,20,20]
                }
            });
        }
    });
    return PuckModel;
});
define('air_hockey_app',[
    // Libs
    'jquery',
    'backbone',
    'phoria',
    'bat_model',
    'puck_model',
    'user_model',
], function($, Backbone, P, BatModel, PuckModel, UserModel){
    var AirHockeyApp = Backbone.View.extend({
        el: $('.screen__game'),
        initialize: function() {

            var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
                function(c) {window.setTimeout(c, 15)};

            var keyPressList = [];

            var net = {
                x : 8,
                y : 8,
                c : 0,
                length : 20
            };

            var block1 = {
                x : net.length/40,
                y : net.length/40,
                z : net.length
            };

            var block2 = {
                x : net.length/4,
                y : net.length/40,
                z : net.length/40
            };

            var border = function(b) {
                return Phoria.Entity.create({
                    points: [   {x:0,y:0,z:0},
                        {x:b.x, y:0, z:0},
                        {x:0, y: 0, z:b.z},
                        {x:b.x, y: 0, z:b.z},
                        {x:0,y:b.y,z:0},
                        {x:b.x, y:b.y, z:0},
                        {x:0, y:b.y, z:b.z},
                        {x:b.x, y:b.y, z:b.z}
                    ],
                    polygons: [
                        {vertices:[1,0,4,5]},
                        {vertices:[0,2,6,4]},
                        {vertices:[1,5,7,3]},
                        {vertices:[2,6,7,3]},
                        {vertices:[5,4,6,7]},
                        {vertices:[1,0,2,3]},
                    ],
                    style: {
                        drawmode: "solid",
                        fillmode: "fill",
                        linewidth: 1.0,
                        color : [87,20,13]
                    }
                });
            };
            var border1 = border(block1);
            var border2 = border(block1);
            var border5 = border(block2);
            var border6 = border(block2);
            var border7 = border(block2);
            var border8 = border(block2);

            border1.translateZ(-net.length/2).translateX(-net.length/2-block1.x);
            border2.translateX(net.length/2).translateZ(-net.length/2);
            border5.translateX(net.length/2-block2.x+block1.x).translateZ(net.length/2);
            border6.translateX(net.length/2-block2.x+block1.x).translateZ(-net.length/2-block2.z);
            border7.translateX(-net.length/2-block1.x).translateZ(net.length/2);
            border8.translateX(-net.length/2-block1.x).translateZ(-net.length/2-block2.z);

            var light1 = Phoria.PointLight.create({
                position: {x:7.5, y:10, z:-7.5},
                intensity: 5,
                attenuation: 2,
                attenuationFactor: "squared",
                color: [255, 255, 255]
            });
            var light2 = Phoria.PointLight.create({
                position: {x:7.5, y:10, z:7.5},
                intensity: 5,
                attenuation: 2,
                attenuationFactor: "squared",
                color: [255, 255, 255]
            });
            var light3 = Phoria.PointLight.create({
                position: {x:-7.5, y:10, z:7.5},
                intensity: 5,
                attenuation: 2,
                attenuationFactor: "squared",
                color: [255, 255, 255]
            });
            var light4 = Phoria.PointLight.create({
                position: {x:-7.5, y:10, z:-7.5},
                intensity: 5,
                attenuation: 2,
                attenuationFactor: "squared",
                color: [255, 255, 255]
            });

            var send_message_enemy_score = function() {
                var data = JSON.stringify({code: 3});
                ws.send(data);
            };

            var score = 0;

            var local_storage = function () {
                localStorage.setItem('score', myBat.score);
            };

            var send_message_puck = function( dnextX, dnextY, velocityX, velocityY, speed, angle) {
                var data = JSON.stringify({code: 1, dnextX: dnextX, dnextY: dnextY,velocityX:velocityX,
                    velocityY: velocityY, speed: speed, angle : angle});
                ws.send(data);
            };

            var send_message_position_enemy_bat = function (dnextX, dnextY) {
                var data = JSON.stringify({code: 2, dnextX: dnextX, dnextY: dnextY});
                ws.send(data);
            };

             var sendStartBatPosition = function () {
                var data = JSON.stringify({code: 5, dnextX: myBat.x, dnextY: myBat.y});
                console.log(data);
                ws.send(data);
             }

            if ( !this.ws) {
                var ws = new WebSocket("ws://localhost:8096/gameSocket");
            }
            var canvas = document.getElementById('myCanvas');
            var scene = new P.Scene();
            this.setScene(scene, canvas);

            var renderer = new P.CanvasRenderer(canvas);

            // add a grid to help visualise camera position etc.
            var plane = P.Util.generateTesselatedPlane(net.x,net.y,0,net.length);
            scene.graph.push(Phoria.Entity.create({
                points: plane.points,
                edges: plane.edges,
                polygons: plane.polygons,
                style: {
                    drawmode: "solid",
                    shademode: "plain",
                    linewidth: 0.5,
                    objectsortmode: "back",
                    color : [200,200,200]
                }
            }));

            var myBat = new BatModel();
            var enemyBat = new BatModel();
            var puck = new PuckModel();
            myBat.initAsMy();
            enemyBat.initAsEnemy();
            scene.graph.push(new Phoria.DistantLight());
            scene.graph.push(myBat.Shape);
            scene.graph.push(enemyBat.Shape);
            scene.graph.push(puck.Shape);
            scene.graph.push(light1);
            scene.graph.push(light2);
            scene.graph.push(light3);
            scene.graph.push(light4);
            scene.graph.push(border1);
            scene.graph.push(border2);
            scene.graph.push(border5);
            scene.graph.push(border6);
            scene.graph.push(border7);
            scene.graph.push(border8);


            document.onkeydown = function(e){
                e = e?e:window.event;
                keyPressList[e.keyCode] = true;
            };

            document.onkeyup = function(e){
                e = e?e:window.event;
                keyPressList[e.keyCode] = false;
            };

           var keyPressListHandler = function() {
               handler:
               {
                    if (keyPressList[37]) {
                        if (keyPressList[38]) {
                            myBat.left_top();
                            break handler;
                        }
                        if (keyPressList[40]) {
                            myBat.left_bottom();
                            break handler;
                        }
                        myBat.left();
                    }
                    if (keyPressList[39]) {
                        if (keyPressList[38]) {
                            myBat.right_top();
                            break handler;
                        }
                        if (keyPressList[40]) {
                            myBat.right_bottom();
                            break handler;
                        }
                        myBat.right();
                    }
                   if (keyPressList[38]) {
                       myBat.top();
                   }
                   if (keyPressList[40]) {
                       myBat.bottom();
                   }
               }
            };



           var setStartParameters = function(code, speed) {
               // если второй соперник, то разворачиваем для него угол направление движения шайбы на 180 градусов
               puck.speed = speed;
               if (code == 2) {
                   puck.angle += 180;
               }
               puck.update();
               puck.start = true;
           };

            var EnemyPositionHandler = function (dnextX, dnextY) {
                //console.log(dnextX);
                //console.log(dnextY);
                enemyBat.dnextX = -dnextX;
                enemyBat.dnextY = -dnextY;
                enemyBat.render();
            };

            var setStartPosition = function (_x, _y ) {
                console.log("setStartposition" + " x" + _x + " y " + _y);
                enemyBat.dnextX = enemyBat.x - _x;
                //enemyBat.dnextY = (enemyBat.y + _y);
                console.log(enemyBat.dnextX);
                console.log(enemyBat.dnextY);
                enemyBat.render();
            };

            var MyPositionHandler = function (dnextX, dnextY) {
                //console.log(velocityX);
                //console.log(velocityY);
                myBat.velocityX = -dnextX;
                myBat.velocityY = -dnextY;
                myBat.dnextX = -dnextX;
                myBat.dnextY = -dnextY;
                //send_message_position_enemy_bat(myBat.dnextX, myBat.dnextY);
                //myBat.render();
             };

            var kickHandler = function (dnextX, dnextY, velocityX, velocityY, speed, angle) {
                puck.dnextX += -dnextX;
                puck.dnextY += -dnextY;
                puck.velocityX += -velocityX;
                puck.velocityY += -velocityY;
                puck.speed = speed;
                puck.angle = 180 + angle;
            };

            var collide = function(myBat, puck) {
                if (hitTest(myBat, puck)) {

                    var dx = (myBat.x + myBat.dnextX) - (puck.x + puck.dnextX);
                    var dy = (myBat.y + myBat.dnextY) - (puck.y + puck.dnextY);

                    var collisionAngle = Math.atan2(dy, dx);
                    //console.log("X" + myBat.velocityX);
                    //console.log("Y" + myBat.velocityY)
                    var speed1 = Math.sqrt(myBat.velocityX * myBat.velocityX +
                        myBat.velocityY * myBat.velocityY);
                    var speed2 = Math.sqrt(puck.velocityX * puck.velocityX +
                        puck.velocityY * puck.velocityY);
                    var direction1 = Math.atan2(myBat.velocityY, myBat.velocityX);
                    var direction2 = Math.atan2(puck.velocityY, puck.velocityX);

                    var velocityx_1 = speed1 * Math.cos(direction1 - collisionAngle);
                    var velocityy_1 = speed1 * Math.sin(direction1 - collisionAngle);
                    var velocityx_2 = speed2 * Math.cos(direction2 - collisionAngle);
                    var velocityy_2 = speed2 * Math.sin(direction2 - collisionAngle);

                    var final_velocityx_1 = ((myBat.mass - puck.mass) * velocityx_1 +
                        (puck.mass + puck.mass) * velocityx_2)/(myBat.mass + puck.mass);
                    var final_velocityx_2 = ((myBat.mass + myBat.mass) * velocityx_1 +
                        (puck.mass - myBat.mass) * velocityx_2)/(myBat.mass + puck.mass);

                    var final_velocityy_1 = velocityy_1;
                    var final_velocityy_2 = velocityy_2;

                    myBat.velocityX = Math.cos(collisionAngle) * final_velocityx_1 +
                        Math.cos(collisionAngle + Math.PI/2) * final_velocityy_1;
                    myBat.velocityY = Math.sin(collisionAngle) * final_velocityx_1 +
                        Math.sin(collisionAngle + Math.PI/2) * final_velocityy_1;
                    puck.velocityX = Math.cos(collisionAngle) * final_velocityx_2 +
                        Math.cos(collisionAngle + Math.PI/2) * final_velocityy_2;
                    puck.velocityY = Math.sin(collisionAngle) * final_velocityx_2 +
                        Math.sin(collisionAngle + Math.PI/2) * final_velocityy_2;

                    puck.speed = Math.sqrt(puck.velocityX*puck.velocityX + puck.velocityY*puck.velocityY);
                    myBat.dnextX = (myBat.dnextX += myBat.velocityX);
                    myBat.dnextY = (myBat.dnextY += myBat.velocityY);
                    puck.dnextX = (puck.dnextX += puck.velocityX);
                    puck.dnextY = (puck.dnextY += puck.velocityY);
                    puck.angle = Math.atan2(puck.velocityY, puck.velocityX)*180/Math.PI;
                    send_message_puck(puck.dnextX, puck.dnextY, puck.velocityX, puck.velocityY, puck.speed, puck.angle);
                }
            };

            var hitTest = function (myBat, puck) {
                var retval = false;
                var dx = (myBat.x + myBat.dnextX) - (puck.x + puck.dnextX);
                var dy = (myBat.y + myBat.dnextX) - (puck.y + puck.dnextY);
                var distance = (dx * dx + dy * dy);
                if (distance <= (myBat.radius + puck.radius) *
                    (myBat.radius + puck.radius) ) {
                    retval = true;
                    console.log("hit");
                }
                return retval;
            };

            var setEndParameters = function () {
                game_session = false;
            };

            var game_session = true;

            puck.update();
            this.initSocket(ws, enemyBat, setStartParameters, kickHandler, EnemyPositionHandler, MyPositionHandler, setEndParameters, local_storage(), UserModel, sendStartBatPosition, setStartPosition);

            var fnAnimate = function() {
                if (game_session) {
                    console.log("fn Animate");
                    keyPressListHandler();
                    myBat.testBorder(net.length / 2, net.length / 2);
                    if (puck.start) {
                        if (puck.x > net.length / 2 - puck.radius - puck.dnextX || puck.x < -net.length / 2 + puck.radius - puck.dnextX) {
                            puck.angle = 180 - puck.angle;
                        } else if (puck.y > net.length / 2 - puck.radius - puck.dnextY) {
                            puck.angle = 360 - puck.angle;
                        } else if (puck.y < -net.length / 2 + puck.radius - puck.dnextY) {
                            puck.angle = 360 - puck.angle;
                            if (puck.x > -block2.x + puck.radius - puck.dnextX && puck.x < block2.x - puck.radius - puck.dnextX) {
                                //console.log("score");
                                //console.log(puck.x);
                                //console.log("lexa");
                                myBat.score = myBat.score + 1;
                                send_message_enemy_score();
                            }
                        }
                        puck.update();
                        collide(myBat, puck);
                        //send_message_puck(puck.dnextX, puck.dnextY, puck.velocityX, puck.velocityY, puck.speed, puck.angle);
                        send_message_position_enemy_bat(myBat.dnextX, myBat.dnextY);
                        puck.update();
                    }
                    puck.render();
                    myBat.render();
                    scene.modelView();
                    renderer.render(scene);
                    requestAnimFrame(fnAnimate);
                }
            };

            requestAnimFrame(fnAnimate);
        },

        setScene: function (scene, canvas) {
            scene.camera.position = {x:0.0, y:25.0, z:-25.0};
            scene.perspective.aspect = canvas.width / canvas.height;
            scene.viewport.width = canvas.width;
            scene.viewport.height = canvas.height;
        },


        initSocket : function(ws, enemyCylinder, setStartParameters, kickHandler, EnemyPositionHandler, MyPositionHandler, setEndParameters, local_storage, UserModel, sendStartBatPosition, setStartPosition) {
            var wscl = ws;

            ws.onopen = function (event) {
                $( "#gameOver" ).hide();
                $( "#wait" ).show();
                console.log("Open Socket - ready for Game");
            };
            ws.onmessage = function (event) {
                var data = JSON.parse(event.data);
                if(data.code == "token") {
                    console.log("token");
                    document.getElementById("token").innerHTML = data.token;
                    $( "#token" ).show();
                }

                if(data.code == "start_game") {
                    $( "#gameOver" ).hide();
                    $( "#wait" ).hide();
                    $( "#token" ).hide();
                    $( "#gameplay" ).show();
                    $("#enemyScore").html("0");
                    $("#myScore").html("0");
                    //$("enemyName").append(data.enemyEmail);
                    document.getElementById("enemyName").innerHTML = data.enemyEmail;
                    setStartParameters(data.number, data.speed);
                    sendStartBatPosition();
                    console.log("senStartBatPosition");
                }

                if(data.code == "game_over"){
                    $( "#gameOver" ).show();
                    $( "#gameplay" ).hide();
                    if(data.win)
                        document.getElementById("win").innerHTML = "winner!";
                    else
                        document.getElementById("win").innerHTML = "loser!";
                    this.canvas = document.getElementById("myCanvas");
                    this.c = this.canvas.getContext('2d');
                    // очистить экран
                    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    var ms = 2000;
                    setEndParameters();
                    function sleep(ms) {
                        console.log("sleep");
                        ms += new Date().getTime();
                        while (new Date() < ms){}
                    }
                    sleep(ms);
                    wscl.close();
                }
                if(data.code == "set_my_new_score") {
                    document.getElementById("myScore").innerHTML = data.score;
                }
                if(data.code == "set_enemy_new_score") {
                    document.getElementById("enemyScore").innerHTML = data.score;
                }

                if (data.code == "kick") {
                    var dnextX = data.dnextX;
                    var dnextY = data.dnextY;
                    var velocityX = data.velocityX;
                    var velocityY = data.velocityY;
                    var speed = data.speed;
                    var angle = data.angle;
                    kickHandler(dnextX, dnextY, velocityX, velocityY, speed, angle);
                }
                if ( data.code == "enemy_position") {
                    EnemyPositionHandler(data.dnextX, data.dnextY);
                }
                if ( data.code == "my_position" ) {
                    console.log(data.dnextX);
                    console.log(data.dnextY);
                    MyPositionHandler(data.dnextX, data.dnextY);
                }

                if ( data.code == "start_position" ) {
                    console.log("data пришла");
                    console.log(data);
                    setStartPosition(data.dnextX, data.dnextY);
                }
            };
            ws.onclose = function (event) {
                //UserModel.sync();
                console.log("game_stop");
                //local_storage();
            }
        }
    });
    return AirHockeyApp;
});
define('game_view',[
	// Libs
	'jquery',
	'backbone',
	// Tmpl
	'game_tmpl',
	// Models
	'user_model',
	'air_hockey_app',
], function($, Backbone, game_tmpl, UserModel, AirHockeyApp ) {

	var GameView = Backbone.View.extend({
		template: game_tmpl,
		el: $('.screen__game'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},
		show_game: function() {
            //console.log("game start");
        	this.AirHockeyApp = new AirHockeyApp();
		},
		show: function() {
			if( this.model.isLogin() ) {
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
                this.show_game();
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		}
	});
	return GameView;
});
define('score_model',[
	// Libs
	'backbone'
], function(Backbone) {
	var ScoreModel = Backbone.Model.extend({
		defaults: {
			login: "",
			score: 0
		}
	});
	return ScoreModel;
});
define('score_collection',[
	// Libs
	'backbone',
	// Models
	'score_model',
], function(Backbone, ScoreModel) {
	var ScoreCollection = Backbone.Collection.extend({
		model: ScoreModel,
		url: "/get_scores"
	})
	return ScoreCollection;
});
define('scoreboard_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<h2 class=\"screen__header\">Score Board</h2><table class=\"screen__scoreboard__table\"><tr><th>Place</th><th>Score</th><th>Login</th></tr>");var i,__fest_iterator0;try{__fest_iterator0=json.sort(function (a, b) {
								if (a.score > b.score) {return -1;}
								if (a.score < b.score) {return 1;}
								return 0;}) || {};}catch(e){__fest_iterator={};__fest_log_error(e.message);}for(i in __fest_iterator0){__fest_buf+=("<tr><td>");try{__fest_buf+=(__fest_escapeHTML(parseInt(i) + 1))}catch(e){__fest_log_error(e.message + "13");}__fest_buf+=("</td><td>");try{__fest_buf+=(__fest_escapeHTML(json[i].score))}catch(e){__fest_log_error(e.message + "14");}__fest_buf+=("</td><td>");try{__fest_buf+=(__fest_escapeHTML(json[i].login))}catch(e){__fest_log_error(e.message + "15");}__fest_buf+=("</td></tr>");}__fest_buf+=("</table>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('scoreboard_view',[
	// Libs
	'jquery',
	'backbone',
	// Collections
	'score_collection',
	// Tmpl
	'scoreboard_tmpl',
	// Models
	'user_model'
], function($, Backbone, ScoreCollection, scoreboard_tmpl, UserModel) {
	var ScoreboardView = Backbone.View.extend({
		template: scoreboard_tmpl,
		el: $('.screen__scoreboard'),
		render: function() {
			this.$el.html(this.template(this.score_collection.toJSON()));
		},
		show: function() {
			var collection = this.score_collection;
			this.score_collection.fetch().done(function() {
				collection.trigger("change");
			});  // ????? два запроса сразу и поэтому виснет???
			if( this.model.isLogin() ) {
				this.trigger("showView", this)
				this.$el.delay(200).fadeIn(200);
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			// this.score_collection = new ScoreCollection([
			// 	{"login":"alex","score":200},
			// 	{"login":"max","score":100},
			// 	{"login":"john","score":10},
			// 	{"login":"arnold","score":0},
			// 	{"login":"alexander","score":50},
			// 	{"login":"dirk","score":40},
			// 	{"login":"gleb","score":500},
			// 	{"login":"kevin","score":600},
			// 	{"login":"cassandra","score":100},
			// 	{"login":"kate","score":1}
			// ]);
			this.score_collection = new ScoreCollection();
			this.listenTo(this.model,'change', this.render);
			this.listenTo(this.score_collection,'change', this.render);
			this.render();
		}
	});
	return ScoreboardView;
});
define('profile_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<h2 class=\"screen__header\">My Profile</h2><ul class=\"screen__profile__info\"><li>ID: ");try{__fest_buf+=(__fest_escapeHTML(json.id))}catch(e){__fest_log_error(e.message + "3");}__fest_buf+=("</li><li>LOGIN: ");try{__fest_buf+=(__fest_escapeHTML(json.login))}catch(e){__fest_log_error(e.message + "4");}__fest_buf+=("</li><li>EMAIL: ");try{__fest_buf+=(__fest_escapeHTML(json.email))}catch(e){__fest_log_error(e.message + "5");}__fest_buf+=("</li><li>SCORE: ");try{__fest_buf+=(__fest_escapeHTML(json.score))}catch(e){__fest_log_error(e.message + "6");}__fest_buf+=("</li></ul>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('profile_view',[
	// Libs
	'jquery',
	'backbone',
	// Deps
	'profile_tmpl',
	// Models
	'user_model',
], function($, Backbone, profile_tmpl, UserModel) {
	var ScoreboardView = Backbone.View.extend({
		template: profile_tmpl,
		el: $('.screen__profile'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},
		show: function() {
			if( this.model.isLogin() ) {
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		},
		events: {
			"click .screen__toolbar__logout" : "logout"
		}
	});
	return ScoreboardView;
});
define('view_manager',[
	// Libs
	'backbone',
], function(Backbone) {
	var ViewManager = Backbone.View.extend({
		addView: function(view) {
			this.viewList.push(view)
			var me = this;
			view.on("showView", function(event){
				me.hideAll(view);
			});
		},
		hideAll: function(except_view) {
			this.viewList.forEach(function(element, index, array){
				if (element != except_view) {
					element.hide();
				}
			});
		},
		initialize: function() {
			this.viewList = [];
		}
	});
	return ViewManager;
});
define('logout',[
    // Libs
    'jquery',
    // Deps
    'alert_view',
], function($, AlertView){
    return function(event){

        event.preventDefault();
        var $btn = $(event.currentTarget);

        $.ajax({
            url: $btn.attr('href'),
            type: 'POST',
            beforeSend: function() {
                $btn.prop('disabled',true);
                this.alert = new AlertView();
            },
            success: function(response) {
                this.alert.show(response["message"]);
                window.location.hash = '';
            },
            error: function(response) {
                this.alert.show(response.responseJSON["message"]);
            },
            complete: function() {
                $btn.prop('disabled',false);
            }
        })
    };
});
define('toolbar_guest_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<a href=\"\/#\" class=\"btn screen__toolbar__name\">AlexGame</a>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('toolbar_user_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<a href=\"\/#\" class=\"btn screen__toolbar__name\">AlexGame</a><a href=\"#profile\" class=\"btn screen__toolbar__profile\">Profile</a><a href=\"\/logout\" class=\"btn screen__toolbar__logout\">Logout</a>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('toolbar_view',[
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Tmpl
	'toolbar_guest_tmpl',
	'toolbar_user_tmpl',
	// Models
	'user_model'
], function($, Backbone, logout, toolbar_guest_tmpl, toolbar_user_tmpl, UserModel) {
	var ToolbarView = Backbone.View.extend({
		template_user: toolbar_user_tmpl,
		template_guest: toolbar_guest_tmpl,
		el: $('.screen__toolbar'),
		render: function() {
			if( this.model.isLogin() ) {
				this.$el.html(this.template_user());
			}
			else {
				this.$el.html(this.template_guest());
			}
		},
		initialize: function() {
            console.log("parapapam");
            console.log(this.ababa);
			this.listenTo(this.model,'change', this.render);
			this.render();
		},
		events: {
			"click .screen__toolbar__logout" : "logout",
		},
		logout: function(event) {
			logout(event);
			this.model.resetModel();
		}
	});
	return ToolbarView;
});
define('canvas_view',[
	// Libs
	'jquery',
	'backbone',
], function($, Backbone){
	var CanvasView = Backbone.View.extend({
		el: $('.screen__canvas'),
		render: function() {
			this.$el.html("canvas");
		},
		show: function() {
			this.trigger("showView",[ this ]);
			this.$el.delay(200).fadeIn(200);
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.render();
		}
	});
	return CanvasView;
});
define('joystick_tmpl',[],function () { return function (__fest_context){var __fest_self=this,__fest_buf="",__fest_chunks=[],__fest_chunk,__fest_attrs=[],__fest_select,__fest_if,__fest_iterator,__fest_to,__fest_fn,__fest_html="",__fest_blocks={},__fest_params,__fest_element,__fest_debug_file="",__fest_debug_line="",__fest_debug_block="",__fest_htmlchars=/[&<>"]/g,__fest_htmlchars_test=/[&<>"]/,__fest_short_tags = {"area":true,"base":true,"br":true,"col":true,"command":true,"embed":true,"hr":true,"img":true,"input":true,"keygen":true,"link":true,"meta":true,"param":true,"source":true,"wbr":true},__fest_element_stack = [],__fest_htmlhash={"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"},__fest_jschars=/[\\'"\/\n\r\t\b\f<>]/g,__fest_jschars_test=/[\\'"\/\n\r\t\b\f<>]/,__fest_jshash={"\"":"\\\"","\\":"\\\\","/":"\\/","\n":"\\n","\r":"\\r","\t":"\\t","\b":"\\b","\f":"\\f","'":"\\'","<":"\\u003C",">":"\\u003E"},___fest_log_error;if(typeof __fest_error === "undefined"){___fest_log_error = (typeof console !== "undefined" && console.error) ? function(){return Function.prototype.apply.call(console.error, console, arguments)} : function(){};}else{___fest_log_error=__fest_error};function __fest_log_error(msg){___fest_log_error(msg+"\nin block \""+__fest_debug_block+"\" at line: "+__fest_debug_line+"\nfile: "+__fest_debug_file)}function __fest_replaceHTML(chr){return __fest_htmlhash[chr]}function __fest_replaceJS(chr){return __fest_jshash[chr]}function __fest_extend(dest, src){for(var i in src)if(src.hasOwnProperty(i))dest[i]=src[i];}function __fest_param(fn){fn.param=true;return fn}function __fest_call(fn, params,cp){if(cp)for(var i in params)if(typeof params[i]=="function"&&params[i].param)params[i]=params[i]();return fn.call(__fest_self,params)}function __fest_escapeJS(s){if (typeof s==="string") {if (__fest_jschars_test.test(s))return s.replace(__fest_jschars,__fest_replaceJS);} else if (typeof s==="undefined")return "";return s;}function __fest_escapeHTML(s){if (typeof s==="string") {if (__fest_htmlchars_test.test(s))return s.replace(__fest_htmlchars,__fest_replaceHTML);} else if (typeof s==="undefined")return "";return s;}var json=__fest_context;__fest_buf+=("<form method=\"post\" class=\"screen__joystick__form\">Enter token:<br/><input type=\"text\" name=\"token\"/><br/><input type=\"submit\" value=\"Submit\"/></form>");__fest_to=__fest_chunks.length;if (__fest_to) {__fest_iterator = 0;for (;__fest_iterator<__fest_to;__fest_iterator++) {__fest_chunk=__fest_chunks[__fest_iterator];if (typeof __fest_chunk==="string") {__fest_html+=__fest_chunk;} else {__fest_fn=__fest_blocks[__fest_chunk.name];if (__fest_fn) __fest_html+=__fest_call(__fest_fn,__fest_chunk.params,__fest_chunk.cp);}}return __fest_html+__fest_buf;} else {return __fest_buf;}} ; });
define('joystick',[
    // Libs
    'jquery',
    'backbone',
    'phoria',
    'bat_model',
    'puck_model',
    'user_model',
], function($, Backbone, P, BatModel, PuckModel, UserModel){
    var joystickView = Backbone.View.extend({
        initialize: function() {
            var Email;
            // не забывать менять url на 192.168.43.43
            var socket = new WebSocket("ws://192.168.43.43:8096/gameSocket");

            socket.onopen = function () {
                alert("Соединение установлено.");
            };

            socket.onclose = function (event) {
                if (event.wasClean) {
                    alert('Соединение закрыто чисто');
                } else {
                    alert('Обрыв соединения'); // например, "убит" процесс сервера
                }
                alert('Код: ' + event.code + ' причина: ' + event.reason);
                window.removeEventListener('deviceorientation', handleOrientation);
            };

            socket.onmessage = function (event) {
                var data = JSON.parse(event.data);
                console.log(data);
                if(data.code == "new_email") {
                    Email = data.new_email;
                    window.addEventListener('deviceorientation', handleOrientation);
                }
                alert("Получены данные " + event.data);
            };

            socket.onerror = function (error) {
                alert("Ошибка " + error.message);
            };
            var i = 0;
            // посмотрим что сейчас получается без setInterval
            function handleOrientation(event) {

                var x = -event.beta / 50;  // In degree in the range [-180,180]
                var y = -event.gamma / 50; // In degree in the range [-90,90]

                if (i % 100 == 0) {
                    console.log("x " + x);
                    console.log("y " + y);
                }

                var data = JSON.stringify({code: 0, email: Email, dnextX: x, dnextY: y});
                socket.send(data);
            }

             // Send message to chat server
             $('form').submit(function() {
                var data = JSON.stringify({code: -1, token : $('form').find('input[name="token"]').val()});
                socket.send( data );
                console.log( $('form').find('input[name="token"]').val() );
                return false;
             });
        }
    });
    return joystickView;
});


define('joystick_view',[
    // Libs
    'jquery',
    'backbone',
    // Tmpl
    'joystick_tmpl',
    // Models
    'user_model',
    'joystick',
], function($, Backbone, joystick_tmpl, UserModel, joystick ) {

    var joyStickView = Backbone.View.extend({
        template: joystick_tmpl,
        el: $('.screen__joystick'),
        render: function() {
            this.$el.html(this.template(this.model.toJSON()));
        },
        show_joystick: function() {
            //console.log("game start");
            this.joystick = new joystick();
        },
        show: function() {
            this.show_joystick();
            /*if( this.model.isLogin() ) {
                this.trigger("showView",[ this ]);
                this.$el.delay(200).fadeIn(200);

            }
            else{
                window.location.hash = "";
            }*/
        },
        hide: function() {
            this.$el.fadeOut(200);
        },
        initialize: function() {
            this.render();
        }
    });
    return joyStickView;
});
define('router',[
    // Libs
    'backbone',
    // Views
    'main_view',
    'login_view',
    'registration_view',
    'game_view',
    'scoreboard_view',
    'profile_view',
    'view_manager',
    'toolbar_view',
    'canvas_view',
    'joystick_view',
    // Model
    'user_model',
], function(Backbone, MainView, LoginView, RegistrationView, 
                    GameView, ScoreboardView, ProfileView, ViewManager, ToolbarView, CanvasView, JoystickView,
                    UserModel) {
    var Router = Backbone.Router.extend({
        routes: {
            'scoreboard': 'scoreboardAction',
            'game': 'gameAction',
            'login': 'loginAction',
            'registration': 'registrationAction',
            'profile' : 'profileAction',
            'canvas' : 'canvasAction',
            'joystick' : 'joystickAction',
            '': 'mainAction'
        },
        mainAction: function () {
            if (!this.mainView) {
                this.mainView = new MainView({model:this.model});
                this.viewManager.addView(this.mainView)
            }
            this.mainView.show();
        },
        gameAction: function () {
            if (!this.gameView) {
                this.gameView = new GameView({model:this.model});
                this.viewManager.addView(this.gameView)
            }
            this.gameView.show();
        },
        loginAction: function () {
            if (!this.loginView) {
                this.loginView = new LoginView({model:this.model});
                this.viewManager.addView(this.loginView)
            }
            this.loginView.show();
        },
        registrationAction: function () {
            if (!this.registrationView) {
                this.registrationView = new RegistrationView({model:this.model});
                this.viewManager.addView(this.registrationView)
            }
            this.registrationView.show();
        },
        scoreboardAction: function () {
            if (!this.scoreboardView) {
                this.scoreboardView = new ScoreboardView({model:this.model});
                this.viewManager.addView(this.scoreboardView)
            }
            this.scoreboardView.show();
        },
        profileAction: function() {
            if (!this.profileView) {
                this.profileView = new ProfileView({model:this.model});
                this.viewManager.addView(this.profileView)
            }
            this.profileView.show();
        },
        canvasAction: function() {
            if (!this.canvasView) {
                this.canvasView = new CanvasView();
                this.viewManager.addView(this.canvasView)
            }
            this.canvasView.show();
        },
        joystickAction: function () {
            if (!this.joystickView) {
                this.joystickView = new JoystickView({model:this.model});
                this.viewManager.addView(this.joystickView)
            }
            this.joystickView.show();
        },
        initialize: function() {
            this.viewManager = new ViewManager();
            this.model = new UserModel();
            this.toolbarView = new ToolbarView({model:this.model});
        }
    });
    return new Router();
});
requirejs.config({
    baseUrl: '/js',
    paths:{
        // Libs
        "jquery" : "lib/jquery",
        "backbone" : "lib/backbone",
        "underscore" : "lib/underscore",
        "logout" : "lib/logout",
        "validate" : "lib/validate",
        "jquery.validate" : "lib/jquery.validate",
        // Libs for mechanics
        "phoria" : "lib/mechanics/phoria",
        "dat.gui" : "lib/mechanics/dat.gui.min",
        "gl.matrix" : "lib/mechanics/gl.matrix",
        // Templates/**
        "game_tmpl" : "tmpl/game_tmpl",
        "login_tmpl" : "tmpl/login_tmpl",
        "joystick_tmpl" : "tmpl/joystick_tmpl",
        "main_user_tmpl" : "tmpl/main_user_tmpl",
        "main_guest_tmpl" : "tmpl/main_guest_tmpl",
        "registration_tmpl" : "tmpl/registration_tmpl",
        "scoreboard_tmpl" : "tmpl/scoreboard_tmpl",
        "profile_tmpl" : "tmpl/profile_tmpl",
        "toolbar_user_tmpl" : "tmpl/toolbar_user_tmpl",
        "toolbar_guest_tmpl" : "tmpl/toolbar_guest_tmpl",
        // Router
        "router" : "router",
        // Views
        "main_view" : "views/main_view",
        "game_view" : "views/game_view",
        "login_view" : "views/login_view",
        "scoreboard_view" : "views/scoreboard_view",
        "registration_view" : "views/registration_view",
        "profile_view" : "views/profile_view",
        "alert_view" : "views/alert_view",
        "view_manager" : "views/view_manager",
        "toolbar_view" : "views/toolbar_view",
        "canvas_view" : "views/canvas_view",
        "joystick_view" : "views/joystick_view",
        // Models
        "score_model" : "models/score_model",
        "user_model" : "models/user_model",
        "bat_model" : "models/bat_model",
        'puck_model' : "models/puck_model",
        // Collections
        "score_collection" : "collections/score_collection",
        "vertex_collection" : "collections/vertex_collection",
        // Game_mechanics
        "air_hockey_app" : "mechanics/air_hockey_app",
        "joystick" : "mechanics/joystick"
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'backbone' : {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'underscore' : {
            deps: ['jquery'],
            exports: '_'
        },
        'jquery.validate' : {
            deps: ['jquery']
        },
        'phoria' : {
            deps: ['gl.matrix', 'dat.gui'],
            exports: 'Phoria'
        }
    }
});

requirejs([
    // Libs
    'backbone',
    // Deps
    'router'
], function(Backbone, Router) {
    Backbone.history.start();
});
define("epicgame", function(){});

