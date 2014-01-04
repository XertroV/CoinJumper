var activeMenu = undefined;
var nonce = Math.floor(Math.random()*10000);
var prime = nextPrime(3+nonce-(nonce%2+1));
var colors = [
	"#F3B200",
	"#77B900",
	"#2572EB",
	"#AD103C",
	//"#B01E00",
	//"#C1004F",
	//"#7200AC",
	//"#4617B4",
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
	"#loading-section", // this should be first to avoid it being reset.
	"#looking-for",
	"#list-establishments",
	"#view-menu",
	"#view-class",
	"#view-item",
	"#view-options"
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

function genList(inputList, callbackList){
	ret = "<ul>";
	
	for (var i in inputList){
		//var i = inputList.indexOf(input);
		ret += '<li onclick="'+callbackList[i]+'">'+inputList[i]+'</li>';
	}
	
	ret += "</ul>";
	console.log(ret);
	console.log(inputList);
	return ret;
}

function genSubMenu(submenu, callback) {
	listSub = []
	for (var key in submenu)
		listSub.push(key);
	console.log(listSub);
	listOfCallbacks = [];
	for (var index in listSub){
		stringSub = listSub[index];
		listOfCallbacks.push(callback+'(\''+stringSub+'\');');
	}
	console.log(listOfCallbacks);
	return genList(listSub, listOfCallbacks);
}

//
// WORKFLOW
//

function lookingFor(typeOfEst){
	// dummy
	target = ["#looking-for .cj-section-choice", "#list-establishments", "#list-establishments .cj-section-title"];
	transition(target, typeOfEst);
}

function chooseEstablishment(establishment){
	// show loading
	$('.loading-section').slideDown(200);
	getMenu(establishment);
	$('.loading-section').slideUp(200, function() {
		target = ["#list-establishments .cj-section-choice", "#view-menu", "#view-menu .cj-section-title"];
		transition(target, establishment);
	});
}

function getMenu(establishment){
	$.ajax({
		url:"menu", 
		success:function(data){
			// generate html based on data
			activeMenu = data;
			$('#view-menu .cj-section-choice').html(genMenu());
		},
		error:function(xhr,status,error){
			//fail silently :(
			console.log('getMenu() : ajax failed');
		},
		type: 'GET',
		dataType: 'json'
	});
}

function genMenu(){
	return genSubMenu(activeMenu['items'], 'chooseClass');
	/* listOfClasses = [];
	
	for (var key in activeMenu['items'])
		listOfClasses.push(key);
		
	listOfCallbacks = [];
	for (var cIndex in listOfClasses){
		classOfItem = listOfClasses[cIndex];
		listOfCallbacks.push('chooseClass(\''+classOfItem+'\');');
	}
		
	return genList(listOfClasses, listOfCallbacks); */
}

function chooseClass(classOfItem) {
	$('#view-class .cj-section-choice').html(genClass(classOfItem));
	target = ["#view-menu .cj-section-choice", "#view-class", "#view-class .cj-section-title"];
	transition(target, classOfItem);
}

function genClass(classOfItem){
	return genSubMenu(activeMenu['items'][classOfItem], 'chooseItem');
	/* listOfItems = [];
	
	for (var key in activeMenu['items'][classOfItem]){
		listOfItems.push(key);
	}
	
	listOfCallbacks = [];
	for (var iIndex in listOfItems){
		itemString = listOfItems[iIndex];
		listOfCallbacks.push('chooseItem(\''+itemString+'\');');
	}
	
	return genList(listOfItems, listOfCallbacks); */
}

function chooseItem(itemName) {
	$('#view-item .cj-section-choice').html(genItem(itemName));
	target = ["#view-class .cj-section-choice", "#view-item", "#view-item .cj-section-title"];
	transition(target, itemName);
}

function genItem(itemName) {
	// more complex, need to account for options...
	
}

function start(){
	// may load something different to begin with in final product
	// for the moment this is included in index.html
	colorize();
	//alert($.parseJSON('{"items": {"Food": {"Burrito": {"group": "burrito", "description": "Just scrumptious.", "basePrice": "7.50"}}, "Drinks": {"Tea": {"group": "tea", "description": "Nice cuppa tea.", "basePrice": "2.50"}, "Coffee": {"group": "coffee", "description": "Delicious espresso coffee.", "basePrice": "3.00"}}}, "groups": {"tea": {"options": {"Type": {"default": "Earl Grey", "optionType": "selectOne", "listOfOptions": ["Earl Grey", "English Breakfast"]}}, "class": "Drinks"}, "coffee": {"options": {"Type": {"default": "", "optionType": "selectOne", "listOfOptions": ["latte", "mocha"]}, "Temperature": {"default": "hot", "optionType": "selectOne", "listOfOptions": ["hot", "med", "warm"]}}, "class": "Drinks"}, "burrito": {"options": {"Filling": {"default": "", "optionType": "selectOne", "listOfOptions": ["chicken", "beef", "beans"]}}, "class": "Food"}}}'));
}

window.onload = start;
