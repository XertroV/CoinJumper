var activeMenu = undefined;
var nonce = Math.floor(Math.random()*10000);
var prime = nextPrime(3+nonce-(nonce%2+1));
var colors = [
	"#F3B200",
	"#77B900",
	"#2572EB",
	"#AD103C",
	"#B01E00",
	"#C1004F",
	"#7200AC",
	"#4617B4",
	"#006AC1",
	"#008287",
	"#199900",
	"#00C13F",
	"#FF981D",
	"#FF2E12",
	"#FF1D77",
	"#AA40FF",
	"#1FAEFF",
	"#56C5FF",
	"#00D8CC",
	"#91D100",
	"#E1B700",
	"#FF76BC",
	"#00A3A3",
	"#FE7C22"
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

function genList(inputList){
	
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
	// show loading
	$('.loading-section').slideDown(200);
	getMenu(establishment);
	target = ["#list-establishments > .cj-section-choice", "#view-menu", "#view-menu > .cj-section-title"];
	transition(target, establishment);
}

function getMenu(establishment){
	$.ajax({
		url:"menu", 
		success:function(data){
			// generate html based on data
			genMenu(data);
		},
		error:function(xhr,status,error){
			//fail silently :(
			console.log('getMenu() : ajax failed');
		},
		type: 'GET',
		dataType: 'json'
	});
}

function genMenu(menu){
	listOfClasses = [];
	listOfGroups = [];
	
	for (var key in menu['items'])
		listOfClasses.push(key);
	for (var key in menu['groups'])
		listOfGroups.push(key);
		
	//console.log(listOfClasses);
	//console.log(listOfGroups);
	
	
}

function start(){
	// may load something different to begin with in final product
	// for the moment this is included in index.html
	colorize();
	//alert($.parseJSON('{"items": {"Food": {"Burrito": {"group": "burrito", "description": "Just scrumptious.", "basePrice": "7.50"}}, "Drinks": {"Tea": {"group": "tea", "description": "Nice cuppa tea.", "basePrice": "2.50"}, "Coffee": {"group": "coffee", "description": "Delicious espresso coffee.", "basePrice": "3.00"}}}, "groups": {"tea": {"options": {"Type": {"default": "Earl Grey", "optionType": "selectOne", "listOfOptions": ["Earl Grey", "English Breakfast"]}}, "class": "Drinks"}, "coffee": {"options": {"Type": {"default": "", "optionType": "selectOne", "listOfOptions": ["latte", "mocha"]}, "Temperature": {"default": "hot", "optionType": "selectOne", "listOfOptions": ["hot", "med", "warm"]}}, "class": "Drinks"}, "burrito": {"options": {"Filling": {"default": "", "optionType": "selectOne", "listOfOptions": ["chicken", "beef", "beans"]}}, "class": "Food"}}}'));
}

window.onload = start;
