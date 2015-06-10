module.exports = {}
var abc = (function(){
	var a,b,c;
	abc = function(name){
		a = name;
	}
	abc.prototype.getName = function(){
		return a;
	}
	return abc;
})()


function class1(name){
	var t = this;
	(function(){
		var _name;
		_name = name;
		this.sey = 'my name is ' + name;
		this.getName = function(){
			return _name;
		}	
	}).call(this)
}
class1.prototype.getSey = function(){
	return this.sey;
}
var c1 = new class1('c1')
var c2 = new class1('c2')