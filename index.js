var NativePromise = global['Promise'];
//判断是否支持Promise
var nativePromiseSupported =
  NativePromise &&
  'resolve' in NativePromise &&
  'reject' in NativePromise &&
  'all' in NativePromise &&
  'race' in NativePromise &&
  (function(){
    var resolve,reject;
    var p = new NativePromise(function(ok,no){
      resolve = ok;
      reject = no;
    });
    var then = p.then;
    return typeof resolve === 'function' && typeof reject === 'function' && typeof then === 'function';
  })();
module.exports = require("./src/queue")(nativePromiseSupported ? NativePromise : require("bluebird"));