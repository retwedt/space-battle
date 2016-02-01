//**********Canvas Elements
// get canvas elements, create drawing objects
var bgCanvas = document.getElementById("bg-canvas");
var bgCtx = bgCanvas.getContext("2d");

var mainCanvas = document.getElementById("main-canvas");
var mainCtx = mainCanvas.getContext("2d");

var heroCanvas = document.getElementById("hero-canvas");
var heroCtx = heroCanvas.getContext("2d");




//**********requestAnim shim layer by Paul Irish
//Finds the first API that works to optimize the animation loop, otherwise defaults to setTimeout().
window.requestAnimFrame = (function(){
	return  window.requestAnimationFrame   || 
		  window.webkitRequestAnimationFrame ||
		  window.mozRequestAnimationFrame    ||
		  window.oRequestAnimationFrame      ||
		  window.msRequestAnimationFrame     ||
		  function(/* function */ callback, /* DOMElement */ element){
			window.setTimeout(callback, 1000 / 60);
		  };
})();






//**********get text elements from dom
var playerScore = document.getElementById("score");
var playerHealth = document.getElementById("health");
var scoreSpan = document.getElementById("current-score");
var healthSpan = document.getElementById("current-health");

var startMenu = document.getElementById("start-menu");
var startButton = document.getElementById("start-button");
var gameoverMenu = document.getElementById("gameover-menu");
var restartButton = document.getElementById("restart-button");

//pause button
var pauseMenu = document.getElementById("pause-menu");
var pauseButton = document.getElementById("pause-button");
var unpauseButton = document.getElementById("unpause-button");

var startImage = document.getElementById("start-image");



//**********game variables
var monstersCaught = 0;
var isPaused = true;

var counter = 0; // control fire rate
var enemyMoveCounter = 0; // control random variables for enemy movement

var tstcntr = 0; // test counter for debugging fire rate



//**********constructor functions
// object for images
var images = new function() {
	// Define images
	this.bg = new Image();
	this.hero = new Image();
	this.enemy = new Image();
	this.bullet = new Image();
	this.loaded = false;

	// Ensure all images have loaded before starting the game
	var numImages = 4;
	var numLoaded = 0;
	function imageLoaded() {
		numLoaded++;
		if (numLoaded === numImages) {
			images.loaded = true;
		}
	}
	this.bg.onload = function() {
		imageLoaded();
	}
	this.hero.onload = function() {
		imageLoaded();
	}
	this.enemy.onload = function() {
		imageLoaded();
	}
	this.bullet.onload = function() {
		imageLoaded();
	}
	
	// Set images src
	this.bg.src = "img/backgroundFull.png";
	this.hero.src = "img/heroRight.png";
	this.enemy.src = "img/aliensSide.png";
	this.bullet.src = "img/bulletRight.png";
};





//constructor function for background
function Background(){
	//default variables
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;

	this.speed = 0; //movement speed in pixels per second

	//set functions
	this.setPos = function(newX, newY){
		this.x = newX;
		this.y = newY;
	};
	//set default values
	this.setUp = function(newX, newY, newWidth, newHeight, newSpeed){
		this.x = newX;
		this.y = newY;
		this.width = newWidth;
		this.height = newHeight;
		this.speed = newSpeed; //movement speed in pixels per second
	};
}

//create a new background object using the Background() constructor
var bg = new Background();
bg.setUp(0, 0, 600, 600, -32);











//constructor function for bullet
function Bullet() {	
	//set defaults
	this.speed= 512; // movement in pixels per second
	this.height= 14;
	this.width= 28;
	this.x = 0;
	this.y = 0;

	this.direction = " ";  //direction bullet is facing up, down, left, right, upRight, upLeft, downRight, downLeft

	this.alive = false; // Is true if the bullet is currently in use
	
	//Sets the bullet values
	this.setUp = function(x, y, newSpeed) {
		// console.log("this is a bullet");
		this.x = x;
		this.y = y;
		this.speed = newSpeed;
		this.alive = true;
	};
	
	//Resets the bullet values
	this.reset = function() {
		this.x = 0;
		this.y = 0;
		this.speed = 0;
		this.alive = false;
	};
}




//pool object for handling bullets and enemies
//create an array of a specific size, fill it with enemy/bullet objects
//** by filling an array with objects that we can reused, all of the objects are saved in the memory at the beginning of the game,
//** this saves on resources, cheaper than constantly creating and destroying new objects
//when space bar is pressed, bullet is popped off the end of the array, the bullet position and direction are setup, alive is set to true, and the bullet is moved to the front of the array
//when a bullet is on screen, alive is set to true, its position is updated, and the render function draws it 
//when bullet is off screen, alive is set to false, and the bullet is no longer rendered
function Pool(maxSize) {
	this.size = maxSize; // Max bullets allowed in the pool
	this.pool = [];
	
	//Populates the pool array with Bullet objects
	this.setUp = function() {
		for (var i = 0; i < maxSize; i++) {
			// Initalize the bullet object
			// console.log("ammo setup");
			var bullet = new Bullet();

			this.pool[i] = bullet;
		}
	};
	

	// Grabs the last item in the list and initializes it and pushes it to the front of the array.
	this.getBullet = function(x, y, speed, direction) {
		// console.log("bullet direction is " + direction);
		if(!this.pool[maxSize - 1].alive) {
			this.pool[maxSize - 1].setUp(x, y, speed);
			var theBullet = this.pool.pop();
			// this.pool.unshift(this.pool.pop());
			theBullet.direction = direction;

			this.pool.unshift(theBullet);
			
			tstcntr++;
			console.log("fire! " + tstcntr);
		}
	};
}







//constructor function for hero
function Hero(){
	//default variables
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;

	this.speed = 0; //movement speed in pixels per second
	this.direction = " ";  //direction bullet is facing up, down, left, right, upRight, upLeft, downRight, downLeft

	this.fireRate = 25;

	//weapons
	this.ammo = new Pool(10);
	this.ammo.setUp();

	//health
	this.health = 100;


	//set functions
	this.setPos = function(newX, newY){
		this.x = newX;
		this.y = newY;
	};
	//set default values
	this.setUp = function(newX, newY, newWidth, newHeight, newSpeed, newDirection){
		this.x = newX;
		this.y = newY;
		this.width = newWidth;
		this.height = newHeight;
		this.speed = newSpeed; //movement speed in pixels per second
		this.direction = newDirection;  //direction of hero
	};
}

//create a new hero object using the Hero() constructor
var hero = new Hero();
hero.setUp(0, 0, 37, 48, 256, "right");





//constructor function for enemy
function Enemy(){
	//default variables
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;

	this.speed = 0; //movement speed in pixels per second

	//sine movement
	this.amp = 0;
	this.cycles = 0;

	//set functions
	this.setPos = function(newX, newY){
		this.x = newX;
		this.y = newY;
	};
	//set default values
	this.setUp = function(newX, newY, newWidth, newHeight, newSpeed){
		this.x = newX;
		this.y = newY;
		this.width = newWidth;
		this.height = newHeight;
		this.speed = newSpeed; //movement speed in pixels per second
	};
}

//create a new enemy object using the Enemy() constructor
var monster = new Enemy();
monster.setUp(0, 0, 37, 48, 64);











//**********Functions for running game
// Reset the game
var reset = function () {
	heroCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
	// bgCtx.clearRect(0, 0, heroCanvas.width, heroCanvas.height);
	mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

	hero.x = bgCanvas.width*0.2;
	hero.y = bgCanvas.height / 2;

	// Throw the monster somewhere on the screen randomly
	monster.x = 32 + (Math.random() * (bg.width-(bg.width*.7)))+(bg.width*.7);
	monster.y = 32 + (Math.random() * (bgCanvas.height - 64));
};

// Reset the enemy when it leaves a screen
var resetEnemy = function () {
	mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);

	// Throw the enemy somewhere on the screen randomly
	monster.x = 32 + (Math.random() * (bg.width-(bg.width*.7)))+(bg.width*.7);
	monster.y = 32 + (Math.random() * (bgCanvas.height - 64));
};




//update background
var updateBg = function(modifier){
	//pan background
	bg.x += bg.speed * modifier;
	if (bg.x <= 0){
		bg.x=bg.width;
	}
}



// Update scene game objects
var updateScene = function (modifier) {
	enemyMoveCounter++;

	//move enemies
	mainCtx.clearRect(monster.x-17, monster.y-17, monster.width+34, monster.height+34);
	if (   monster.x < (0-hero.width) ) {
		resetEnemy();
	} else {
		if (enemyMoveCounter%60 > 1){
			enemyMoveCounter = 0;
			monster.amp = Math.random();
			monster.cycles =  Math.random();

		}
		// console.log("modifier: " + modifier + " cycles: " + monster.cycles + " counter: " + enemyMoveCounter);

		monster.x -= monster.speed * modifier;
		monster.y += monster.amp*(Math.sin(modifier*monster.x)) * monster.speed * modifier;
	}

	for (var i = 0; i < hero.ammo.size; i++) {
		// Only draw until we find a bullet that is not alive
		if (hero.ammo.pool[i].alive) {
			mainCtx.clearRect(hero.ammo.pool[i].x-20, hero.ammo.pool[i].y-20, hero.ammo.pool[i].width+40, hero.ammo.pool[i].height+40);
			//move bullets
			if (hero.ammo.pool[i].direction == "up"){
				hero.ammo.pool[i].y -= hero.ammo.pool[i].speed * modifier; //up
			// } else if (hero.ammo.pool[i].direction == "rightUp"){
			// 	hero.ammo.pool[i].x += hero.ammo.pool[i].speed * modifier; // diagonal right
			// 	hero.ammo.pool[i].y -= hero.ammo.pool[i].speed * modifier; // diagonal up
			} else if (hero.ammo.pool[i].direction == "right"){
				hero.ammo.pool[i].x += hero.ammo.pool[i].speed * modifier; //right
			// } else if (hero.ammo.pool[i].direction == "rightDown"){
			// 	hero.ammo.pool[i].x += hero.ammo.pool[i].speed * modifier; // diagonal right
			// 	hero.ammo.pool[i].y += hero.ammo.pool[i].speed * modifier; // diagonal down
			} else if (hero.ammo.pool[i].direction == "down"){
				hero.ammo.pool[i].y += hero.ammo.pool[i].speed * modifier; // down
			// } else if (hero.ammo.pool[i].direction == "leftDown"){
			// 	hero.ammo.pool[i].x -= hero.ammo.pool[i].speed * modifier; // diagonal left
			// 	hero.ammo.pool[i].y += hero.ammo.pool[i].speed * modifier; // diagonal down
			} else if (hero.ammo.pool[i].direction == "left"){
				hero.ammo.pool[i].x -= hero.ammo.pool[i].speed * modifier; //left
			// } else if (hero.ammo.pool[i].direction == "leftUp"){
			// 	hero.ammo.pool[i].x -= hero.ammo.pool[i].speed * modifier; // diagonal left
			// 	hero.ammo.pool[i].y -= hero.ammo.pool[i].speed * modifier; // diagonal up
			} else {
				console.log("Directionless...");
			}



			// Are they touching?
			if (   hero.ammo.pool[i].x <= (monster.x + 32)      && monster.x <= (hero.ammo.pool[i].x + 32)      && hero.ammo.pool[i].y <= (monster.y + 32)   && monster.y <= (hero.ammo.pool[i].y + 32)	) {
				monstersCaught++;
				hero.ammo.pool[i].reset();
				resetEnemy();
			}



			//if the bullet is off the map, reset it
			if (hero.ammo.pool[i].x <= 0 || hero.ammo.pool[i].x >= bgCanvas.width || hero.ammo.pool[i].y <= 0 || hero.ammo.pool[i].y >= bgCanvas.height) {
				// console.log("don't draw");
				hero.ammo.pool[i].reset();
			}
		}
		else{
			break;
		}
	}
};


// Update scene game objects
var updateHero = function (modifier) {
	counter++;
	heroCtx.clearRect(hero.x-17, hero.y-17, hero.width+34, hero.height+34); //clear previous player drawing
	heroCtx.clearRect(0, 0, heroCanvas.width, 60);  //clear score and lives

	if (keysPressed[38]) { // Player holding up
		images.hero.src = "img/heroBack.png";
		hero.direction = "up";
		//screen boundaries up
		if (hero.y <= 0){
			hero.y = 0;
		} else {
			hero.y -= hero.speed * modifier;
		}
	}
	else if (keysPressed[40]) { // Player holding down
		images.hero.src = "img/heroFront.png";
		hero.direction = "down";
		//screen boundaries down
		if (hero.y >= (bg.height-hero.height)){
			hero.y = bg.height - hero.height;
		} else {
			hero.y += hero.speed * modifier;
		}
	}
	else if (keysPressed[37]) { // Player holding left
		images.hero.src = "img/heroLeft.png";
		hero.direction = "left";
		//screen boundaries left
		if (hero.x <= 0){
			hero.x = 0;
		} else {
			hero.x -= hero.speed * modifier;
		}
	}
	else if (keysPressed[39]) { // Player holding right
		images.hero.src = "img/heroRight.png";
		hero.direction = "right";
		//screen boundaries right
		if (hero.x >= (bg.width*.65) - hero.width){
			hero.x = (bg.width*.65) - hero.width;
		} else {
		hero.x += hero.speed * modifier;
		}
	}
	//handle diagonal images 
	if (keysPressed[38] && keysPressed[37]){ //player holding up and left
		hero.direction = "leftUp";
		images.hero.src = "img/heroDiagLeftUp.png";
	}
	if (keysPressed[38] && keysPressed[39]){ //player holding up and right
		hero.direction = "rightUp";
		images.hero.src = "img/heroDiagRightUp.png";
	}
	if (keysPressed[40] && keysPressed[37]){ //player holding down and left
		hero.direction = "leftDown";
		images.hero.src = "img/heroDiagLeftDown.png";
	}
	if (keysPressed[40] && keysPressed[39]){ //player holding down and right
		hero.direction = "rightDown";
		images.hero.src = "img/heroDiagRightDown.png";
	}
	if (keysPressed[32] && counter >= hero.fireRate) { // Player holding space
		
	// for (var i = 0; i < hero.ammo.size; i++) {
	// 	console.log(hero.ammo.pool[i]);
	// }
	// console.log(hero.ammo.pool);
		counter = 0;
		hero.ammo.getBullet(hero.x, hero.y, 512, hero.direction);
	}


	// Are they touching?
	if (     hero.x <= (monster.x + monster.width)  && (hero.x + hero.width)  >= monster.x && hero.y <= (monster.y + monster.height) && (hero.y + hero.height) >= monster.y     ) {
		hero.health -= 20;
		reset();
	}
};







// Draw everything
var render = function () {
	 if (images.loaded) {
	 	bgCtx.drawImage(images.bg, bg.x, bg.y);
		bgCtx.drawImage(images.bg, bg.x-bg.width, bg.y);  //draw another image at the top of the page
		mainCtx.drawImage(images.enemy, monster.x, monster.y);
		heroCtx.drawImage(images.hero, hero.x, hero.y);

		for (var i = 0; i < hero.ammo.size; i++) {
			// Only draw until we find a bullet that is not alive
			if (hero.ammo.pool[i].alive) {
				if (hero.ammo.pool[i].direction === "up"){
					images.bullet.src = "img/bulletUp.png";
				// } else if (hero.ammo.pool[i].direction === "rightUp"){
				// 	images.bullet.src = "img/bulletRightUp.png";
				} else if (hero.ammo.pool[i].direction === "right"){
					images.bullet.src = "img/bulletRight.png";
				// } else if (hero.ammo.pool[i].direction === "rightDown"){
				// 	images.bullet.src = "img/bulletRightDown.png";
				} else if (hero.ammo.pool[i].direction === "down"){
					images.bullet.src = "img/bulletDown.png";
				// } else if (hero.ammo.pool[i].direction === "leftDown"){
				// 	images.bullet.src = "img/bulletLeftDown.png";
				} else if (hero.ammo.pool[i].direction === "left"){
					images.bullet.src = "img/bulletLeft.png";
				// } else if (hero.ammo.pool[i].direction === "leftUp"){
				// 	images.bullet.src = "img/bulletLeftUp.png";
				}


				// console.log("shots fired!");
				mainCtx.drawImage(images.bullet, hero.ammo.pool[i].x, hero.ammo.pool[i].y);
				// console.log("bullet direction is " + hero.ammo.pool[i].direction);
			}
			else{
				break;
			}
		}
	}

	scoreSpan.textContent = monstersCaught;

	healthSpan.textContent = hero.health;
};




// The main game loop
var main = function () {
	var now = Date.now();
	var delta = (now - then)/1000;


	if (hero.health <= 0){
		reset();
		hero.health = 100;
		monstersCaught = 0;
		isPaused = true;
		playerScore.style.visibility = "hidden";
		playerHealth.style.visibility = "hidden";
		pauseButton.style.visibility = "hidden";
		startImage.style.display = "block";
		gameoverMenu.style.display = "block";
	}


	if (!isPaused){
		updateBg(delta);
		updateScene(delta);
		updateHero(delta);
		render();
	}

	then = now;

	// Request to do this again ASAP
	requestAnimFrame(main);
};







//**********Events
//object to hold keys pressed
var keysPressed = {};


//detect keypress, add keycode to keysPressed object
document.onkeydown = function(eventObject){
	//any keys that were previously held down, set to false
	// for (key in keysPressed){
	// 	// delete keysPressed[key];
	// 	keysPressed[key] = false;
	// }

	var keyCode = eventObject.keyCode;

	//don't add keys to keycode object if game is paused
	if (!isPaused){
		keysPressed[keyCode] = true;
	}

	//prevent default action of keys when they are pressed
	if (keyCode === 32 || keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40){
		eventObject.preventDefault();
	} else {
		console.log("keyCode pressed: " + keyCode);
	}
}
//remove keycode from keysPressed object
document.onkeyup = function(eventObject){
	//any keys that were previously held down, set to true
	// for (key in keysPressed){
	// 	// delete keysPressed[key];
	// 	keysPressed[key] = true;
	// }

	var keyCode = eventObject.keyCode;

	// if (!isPaused){
		delete keysPressed[keyCode];
	// }
}


//check for start and restart screen events
startButton.onclick = function(){
	playerScore.style.visibility = "visible";
	playerHealth.style.visibility = "visible";
	pauseButton.style.visibility = "visible";
	startImage.style.display = "none";
	startMenu.style.display = "none";
	isPaused = false; //unpause game
	main();
}

restartButton.onclick = function(){
	playerScore.style.visibility = "visible";
	playerHealth.style.visibility = "visible";
	pauseButton.style.visibility = "visible";
	startImage.style.display = "none";
	gameoverMenu.style.display = "none";
	isPaused = false;
	main();
}

//check for pause event
pauseButton.onclick = function(){
	playerScore.style.visibility = "hidden";
	playerHealth.style.visibility = "hidden";
	pauseButton.style.visibility = "hidden";
	startImage.style.display = "block";
	pauseMenu.style.display = "block";
	isPaused = true;
}

//check for unpause event
unpauseButton.onclick = function(){
	playerScore.style.visibility = "visible";
	playerHealth.style.visibility = "visible";
	pauseButton.style.visibility = "visible";
	startImage.style.display = "none";
	pauseMenu.style.display = "none";
	isPaused = false;
	main();
}









//**********Start game
//check if canvas is supported
if (bgCanvas.getContext){
	
	//set default values
	hero.setPos((bgCanvas.width * 0.2), (bgCanvas.height / 2));
	bg.setPos(0,0);

	// Let's play this game!
	var then = Date.now();
	resetEnemy();

	main();

} else {
	console.log("Canvas is not supported!");
}
