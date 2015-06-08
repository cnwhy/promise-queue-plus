var q = require("q");

function test(i,e){
	var d = q.defer();
	setTimeout(function(){
		if(e) {

			d.reject(i)
		}else{
			console.log('---');
			d.resolve(i)
		}
	},500)
	return d.promise;
}



test(111,1).fin(function(a){
	console.log("fin");
}).then(function(data){
	console.log(data);
},function(err){
	console.error('err:'+err);
})