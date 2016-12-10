var tests = require('promises-aplus-tests');


var bluebird = require("bluebird");
bluebird.deferred = function(){
	return bluebird.defer();
}

var Q = require("q");
Q.deferred = function(){
	return Q.defer();
}

// bluebird.deferred = function () {
//   var resolve, reject;
//   var promise = new bluebird(function (_resolve, _reject) {
//     resolve = _resolve;
//     reject = _reject;
//   });
//   return {
//     promise: promise,
//     resolve: resolve,
//     reject: reject
//   };
// };
// tests.mocha(bluebird);


var Q = require("./promise");
//var Q = require("./Q");
var outerThenableFactory = function (value) {
        return {
            then: function (onFulfilled,no) {
            	//setTimeout(function () {
                	onFulfilled(value);
                	//onFulfilled({other:"other"});
                	//onFulfilled({other:"other"});
                	throw {other:"other"};
            	//},0)
            }
        };
    }
var innerThenableFactory = function (value) {
        return {
            then: function (onFulfilled) {
            	setTimeout(function(){
                	onFulfilled(value);
            	},0)
            }
        };
    }
function yFactory(value) {
    return outerThenableFactory(innerThenableFactory({aaa:"aaa"}));
    // return {
    //         then: function (onFulfilled) {
    //         	//setTimeout(function () {
    //             	onFulfilled(value);
    //             	onFulfilled({other:"other"});
    //             	//throw {other:"other"};
    //         	//},0)
    //         }
    //     };
}
function xFactory(value) {
                return {
                    then: function (resolvePromise) {
                        setTimeout(function () {
                            resolvePromise(yFactory(value));
                        }, 0);
                    }
                };
            }
// var p = xFactory();
// p.defer.resolve(111);
//Q.resolve(123).then(console.log.bind(null,1),console.log.bind(null,2));
// var t1 = Date.now();
//Q.resolve(123).then(function(){return xFactory();},function(){}).then(console.log.bind(null,1),console.log.bind(null,2))
// .then(function(){console.log(Date.now() - t1);})

//Promise.resolve(123).then(function(){return xFactory();},function(){}).then(console.log.bind(null,1),console.log.bind(null,2))
// .then(function(){console.log(Date.now() - t1);})
//Promise.resolve(function(){}).then(console.log.bind(null,1),console.log.bind(null,2))

// var p = new Promise(function(ok,no){
//   ok({then:function(a,b){a(3)}})
// });
//p.then(console.log.bind(null,1),console.log.bind(null,2))
// var p1 = new Q(function(ok,no){
//   ok({then:function(a,b){a(3)}})
// });
// p1.then(console.log.bind(null,1),console.log.bind(null,2))


var cc = function(v){
	return {
		then:function(a,b){
			a({
				then:function(y,n){
					setTimeout(function(){
						y(v);
					},0)
				}
			});
			a(2);
			b(v);
		}
	};
}
var bb = function(v){
	return {
		then:function(a,b){
			a({
				then:function(y,n){
					setTimeout(function(){
						y(v);
					},0)
				}
			});
			throw ('err')
		}
	};
}
var rfun = cc;

//Q.resolve({then:function(a,b){b(1)}}).then(console.log.bind(null,"ok:"),console.log.bind(null,"no:"))

Q.resolve(1).then(function(v){return rfun(1)}).then(console.log.bind(null,"Q ","ok:"),console.log.bind(null,"Q ","no:"));

Promise.resolve(1).then(function(v){return rfun(1)}).then(console.log.bind(null,"P ","ok:"),console.log.bind(null,"P ","no:"))

//(new Q(function(){throw 'err'})).then(console.log.bind(null,'ok:'),console.log.bind(null,'no:'));

//Promise.resolve(5).then(4).then(console.log)

//var Promise = require("./Q");
//Promise.deferred = Promise.defer;
console.log(bluebird.deferred());
console.log(typeof Promise);
tests.mocha(Q);