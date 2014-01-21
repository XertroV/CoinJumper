var activeMenu = undefined;
var activeClass = undefined;
var activeItem = undefined;
var activeOptions = undefined;
var cart = [];
var nonce = randNums() % 0xFFFF;
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
	"#view-option"
];

//
// HELPERS
//

function randNums(){
	return Math.floor(Math.random()*4294967295)
}

function randHex(){
	return randNums().toString(16)+randNums().toString(16);
}

function transition(target, value){
	$(target[0]).slideUp(200);
	$(target[2]).html(value);
	$(target[1]).slideDown(200);
	$(target[1]+" .cj-section-choice").slideDown(200);
}

function transitionBackwards(closeThese, openThis){
	// close each member of closeThese and then expand openThis
	closeThese.forEach(function(closeThis){
		$(closeThis).slideUp(200);
	});
	$(openThis+" .cj-section-choice").slideDown(200);
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

function toggleOverlay(id){
	$("#"+id).fadeToggle(200);
}

function showCart(){
	toggleOverlay("cart-overlay");
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
	// loop through inputList and callbackList and create an unordered
	// list in html where each element links to the callback and is named
	// as in inputList.
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
	// take part of a menu{} and a string of a function to callback and
	// create two corresponding lists of titles and callbacks, pass to genList
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


function updateCart() {
	// update status - number in cart
	$('#cart-status').html(cart.length);
	
	// generate cart html
	cartHTML = "";
	
	cart.forEach(function(cartItem){
		cartHTML += "<li id='"+cartItem["id"]+"'>"+cartItem["itemName"];
		cartHTML += "<span class='glyphicon glyphicon-remove pull-right cart-remove-item' onclick=\"removeItem('"+cartItem["id"]+"')\"></span>";
		cartHTML += "<p class='cart-description'>";
		var firstRun = true;
		cartItem["options"].forEach(function(optPair){
			cartHTML += optPair[0]+": "+optPair[1];
			if(!firstRun){
				cartHTML += "<br />";
			}else{
				firstRun = false;
			}
		});
		cartHTML += "</p>";
		cartHTML += "</li>";
	});
	
	if(cartHTML == ""){
		cartHTML += "<li>Empty :(</li>";
	}
	
	$("#cart-list").html(cartHTML);
}

function removeItem(id){
	for (var i in cart){
		if(cart[i]["id"] == id){
			cart.splice(i, 1);
			break;
		}
	}
	$("#"+id).slideUp(150,function(){updateCart()});
}

//
// WORKFLOW
//

function lookingFor(typeOfEst){
	// dummy - will be replaced later
	target = ["#looking-for .cj-section-choice", "#list-establishments", "#list-establishments .cj-section-title"];
	transition(target, typeOfEst);
}

function chooseEstablishment(establishment){
	// call from html - selects a particular establishment
	// show loading
	$('.loading-section').slideDown(200);
	getMenu(establishment);
	$('.loading-section').slideUp(200);
	target = ["#list-establishments .cj-section-choice", "#view-menu", "#view-menu .cj-section-title"];
	transition(target, establishment);
}

function getMenu(establishment){
	$.ajax({
		url:"menu", // menu should be real menu URL in future
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
	activeClass = classOfItem;
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
	// handle generating everything in the #view-item div
	activeItem = itemName;
	var itemProps = activeMenu['items'][activeClass][activeItem];
	var group = itemProps["group"];
	var desc = itemProps["description"];
	var basePrice = itemProps["basePrice"];
	
	var options = activeMenu["groups"][group]["options"];
	activeOptions = options;
	
	var toRet = "<ul>";
	
	// iterate through options and generate form
	for (var key in activeOptions) {
		var propName = key;
		var optionProps = activeOptions[propName];
		var listOfOptions = optionProps["listOfOptions"];
		var defaultt = optionProps["default"];
		var optionType = optionProps["optionType"]; // selectOne, selectMany
		
		toRet += "<li>" + propName;
		
		switch(optionType){
			case "selectOne":
				toRet += "<select class='pull-right' id='option-"+propName+"'>";
				
				listOfOptions.forEach(function(item){
					toRet += "<option value=\""+item+"\">"+item+"</option>";
				});
				toRet += "</select>";
				break;
		}
		
		toRet += "</li>";
	}
	
	toRet += "</ul>";
	
	
	/*toRet += "<div class='input-group cj-btns-quant'>";
	toRet += "<span class='input-group-btn'>";
	toRet += "<button class='btn btn-default' type='button'><span class='glyphicon glyphicon-chevron-up'></span></button>";
	toRet += "</span>";
	toRet += "<input type='number' class='form-control'>"
	toRet += "<span class='input-group-btn'>";
	toRet += "<button class='btn btn-default' type='button'><span class='glyphicon glyphicon-chevron-down'></span></button>";
	toRet += "</span>";
	toRet += "</div>";*/
	
	
	toRet += "<div class='btn-group cj-btns-order pull-right'>";
	toRet += "<button type='button' class='btn btn-default' onclick='showThis(\"class\")'>Cancel</button>";
	toRet += "<button type='button' class='btn btn-default' onclick='addToCart()'>Add To Cart</button>";
	toRet += "</div>";
	
	return toRet;
}

function addToCart() {
	orderToAdd = {itemName:activeItem,options:[],id:randHex()};
	for (var propName in activeOptions) {
		orderToAdd["options"].push([propName, $('#option-'+propName).val()]);
	}
	cart.push(orderToAdd);
	console.log(cart);
	updateCart();
	showThis('class');
}

function showThis(toShow) {
	switch(toShow){
		case "class":
			transitionBackwards(["#view-item"],"#view-class");
			break;
		case "menu":
			transitionBackwards(["#view-item","#view-class"],"#view-menu");
			
	}
}

/*function chooseProperty(propName) {
	$('#view-option .cj-section-choice').html(genProperties(propName));
	target = ["#view-item .cj-section-choice", "#view-option", "#view-option .cj-section-title"];
	transition(target, propName);
}

function genProperties(propName) {
	
}

function modProperty(propName) {
	// allow user to modify or set a property of the item for order
	
	var optionProps = activeOptions[propName];
	var listOfOptions = optionProps["listOfOptions"];
	var defaultt = optionProps["default"];
	var optionType = optionProps["optionType"];
	
	
}*/

function start(){
	// may load something different to begin with in final product
	// for the moment this is included in index.html
	colorize();
}

window.onload = start;
