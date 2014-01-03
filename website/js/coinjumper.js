var activeMenu = undefined;
var nonce = 123456;
var prime = nextPrime(3+nonce-(nonce%2+1));
var colors = [
	"#A700AE",
	"#643EBF",
	"#00A0B1",
	"#DC572E",
	"#2E8DEF",
	"#0A5BC4",
	"#BF1E4B",
	"#00A600",
	"#F7D240"
];
var workflowSteps = [
	"#looking-for",
	"#list-establishments",
	"#view-menu"
];

//
// HELPERS
//

function transition(target, value){
	$(target[0]).slideUp(200);
	$(target[2]).html(value);
	$(target[1]).slideDown(200);
}

function colorize(){
	workflowSteps.forEach(function(step){
		prime = nextPrime(prime);
		newColor = colors[prime%colors.length+(colors.length%2-1)];
		$(step).css("background-color",newColor);
	});
}

function nextPrime(p){
	while(true){
		if (p % 2 == 0)
			p++;
		else
			p+=2;
		if (isPrime(p))
			return p
	}
}

// The following two functions borrowed from: http://www.javascripter.net/faq/numberisprime.htm

function isPrime(n) {
 if (isNaN(n) || !isFinite(n) || n%1 || n<2) return false; 
 if (n==leastFactor(n)) return true;
 return false;
}

// leastFactor(n)
// returns the smallest prime that divides n
//     NaN if n is NaN or Infinity
//      0  if n=0
//      1  if n=1, n=-1, or n is not an integer

function leastFactor(n){
 if (isNaN(n) || !isFinite(n)) return NaN;  
 if (n==0) return 0;  
 if (n%1 || n*n<2) return 1;
 if (n%2==0) return 2;  
 if (n%3==0) return 3;  
 if (n%5==0) return 5;  
 var m = Math.sqrt(n);
 for (var i=7;i<=m;i+=30) {
  if (n%i==0)      return i;
  if (n%(i+4)==0)  return i+4;
  if (n%(i+6)==0)  return i+6;
  if (n%(i+10)==0) return i+10;
  if (n%(i+12)==0) return i+12;
  if (n%(i+16)==0) return i+16;
  if (n%(i+22)==0) return i+22;
  if (n%(i+24)==0) return i+24;
 }
 return n;
}

//
// WORKFLOW
//

function lookingFor(typeOfEst){
	// dummy
	target = ["#looking-for > .cj-section-choice", "#list-establishments", "#list-establishments > .cj-section-title"];
	transition(target, typeOfEst);
}

function chooseEstablishment(establishment){
	// dummy
	target = ["#list-establishments > .cj-section-choice", "#view-menu", "#view-menu > .cj-section-title"];
	transition(target, establishment);
}

function getMenu(establishment){
	$.get( "http://127.0.0.1:5000/api/get/menu", function(data){
		activeMenu = $.parseJSON(data);
		alert(data);
	});
}

function start(){
	// may load something different to begin with in final product
	// for the moment this is included in index.html
	colorize();
}

$.onload(start);
