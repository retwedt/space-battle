//game_class.js

//get canvas element
var canvas = document.getElementById("main-canvas");
//create 2d drawing object
var ctx = canvas.getContext("2d");



// get the text elements from the dom
//start menu
var startMenu = document.getElementById("start-menu");
var startButton = document.getElementById("start-button");

//gameover menu
var gameoverMenu = document.getElementById("gameover-menu");
var restartButton = document.getElementById("restart-button");

//pause menu
var pauseMenu = document.getElementById("pause-menu");
var unpauseButton = document.getElementById("unpause-button");
var pauseButton = document.getElementById("pause-button");

//score and health
var scoreElement = document.getElementById("current-score");
var healthElement = document.getElementById("current-health");



//game variables
var playerScore = 0;
var playerHealth = 0;
var isPaused = true;

//**********************************************************************************
//*********************************	Start Here	*********************************
//**********************************************************************************

//add counter for checking fire rate

var counter = 0;  //for checking fire rate
//**********************************************************************************
//*********************************	Stop Here	*********************************
//**********************************************************************************









//requestAnim shim layer by Paul Irish
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







//**********************************************************************************
//*********************************	Start Here	*********************************
//**********************************************************************************

//update image singleton to hold bullet image



//singleton
//object for our images
var images = new function(){
	//new image objects to hold our images
	this.bg = new Image();
	this.hero = new Image();
	this.enemy = new Image();
	this.bullet = new Image();

	this.loaded = false; //set to true when all images are loaded
	var numLoaded = 0; //how many images have been loaded
	var totalImages = 4; //how many images do you want to load

	//when an image has loaded, add one to numLoaded
	function imagesLoaded(){
		numLoaded++;
		if (numLoaded === totalImages){
			images.loaded = true;
		}
	}

	//when images load, run imageLoaded function
	this.bg.onload = function(){
		imagesLoaded();
	}
	this.hero.onload = function(){
		imagesLoaded();
	}
	this.enemy.onload = function(){
		imagesLoaded();
	}
	this.bullet.onload = function(){
		imagesLoaded();
	}

	//set the source for our images
	this.bg.src = "img/spaceBg.png";
	this.hero.src = "img/hero/shipUp.png";
	this.enemy.src = "img/enemy.png";
	this.bullet.src = "img/bullet.png";
}


//**********************************************************************************
//*********************************	Stop Here	*********************************
//**********************************************************************************






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
bg.setUp(0, 0, 600, 600, 32);








//**********************************************************************************
//*********************************	Start Here	*********************************
//**********************************************************************************

//add constructor functions for bullet and pool objects

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
	this.setUp = function(x, y, newSpeed, newDirection) {
		this.x = x;
		this.y = y;
		this.speed = newSpeed;
		this.direction = newDirection;
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
	this.setUpBullets = function() {
		for (var i = 0; i < maxSize; i++) {
			// Initalize the bullet object
			var bullet = new Bullet();

			this.pool[i] = bullet;
		}
	};
	

	// Grabs the last item in the list and initializes it and pushes it to the front of the array.
	this.getBullet = function(x, y, speed, direction) {
		//loop through each bullet in the ammo pool
		for (var i=0; i<this.pool.length; i++){	
			//fire the first bullet that is not alive	
			if(!this.pool[i].alive) {
				this.pool[i].setUp(x, y, speed, direction);
				
				break;
			}
		}
	};
}

//**********************************************************************************
//*********************************	Stop Here	*********************************
//**********************************************************************************









//**********************************************************************************
//*********************************	Start Here	*********************************
//**********************************************************************************

//update hero function to include ammo pool, setUpBullets method, and max fire rate

//constructor function for hero
function Hero(){
	//default variables
	this.x = 0;
	this.y = 0;
	this.width = 0;
	this.height = 0;

	this.speed = 0; //movement speed in pixels per second
	this.direction = " ";

	// set up ammo pool and populate for hero
	this.ammo = new Pool(10);
	this.ammo.setUpBullets();
	this.fireRate = 0;

	this.maxHealth = 0;  //max player health available

	//set functions
	this.setPos = function(newX, newY, newDirection){
		this.x = newX;
		this.y = newY;
		this.direction = newDirection;
	};
	//set default values
	this.setUp = function(newX, newY, newWidth, newHeight, newSpeed, newDirection, newMaxHealth, newFireRate){
		this.x = newX;
		this.y = newY;
		this.width = newWidth;
		this.height = newHeight;
		this.speed = newSpeed; //movement speed in pixels per second
		this.direction = newDirection;  //direction of hero
		this.maxHealth = newMaxHealth;
		this.fireRate = newFireRate;
	};
}

//create a new hero object using the Hero() constructor
var hero = new Hero();
hero.setUp(0, 0, 50, 50, 256, "up", 3, 15);

//**********************************************************************************
//*********************************	Stop Here	*********************************
//**********************************************************************************












//constructor function for enemy
function Enemy(){
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

//create a new enemy object using the Enemy() constructor
var enemy = new Enemy();
enemy.setUp(0, 0, 37, 48, 96);














//resetEnemy
//when called, the enemy is reset to a random position on the screen
var resetEnemy = function(){
	// place the enemy somewhere on the screen randomly
	var rndX = (Math.random() * (bg.width-enemy.width));
	var rndY = (Math.random() * ((bg.height*0.2)-enemy.height));
	enemy.setPos(rndX, rndY);
}


var resetPlayer = function(){
	hero.setPos(canvas.width/2, canvas.height*0.8, "up"); // set hero position to middle of screen



//**********************************************************************************
//*********************************	Start Here	*********************************
//**********************************************************************************

//reset bullets during player reset

	//reset all bullets to alive=false
	for (i = 0; i < hero.ammo.pool.length; i++){
		hero.ammo.pool[i].alive = false;
	}
//**********************************************************************************
//*********************************	Stop Here	*********************************
//**********************************************************************************




	//set image to correspond with the direction of the ship
	if (hero.direction == "up"){
		images.hero.src = "./img/hero/shipUp.png";
	} else if (hero.direction == "right"){
		images.hero.src = "./img/hero/shipRight.png";
	} else if (hero.direction == "down"){
		images.hero.src = "./img/hero/shipDown.png";
	} else if (hero.direction == "left"){
		images.hero.src = "./img/hero/shipLeft.png";
	} else if (hero.direction == "upRight"){
		images.hero.src = "./img/hero/shipUpRight.png";
	} else if (hero.direction == "upLeft"){
			images.hero.src = "./img/hero/shipUpLeft.png";
	} else if (hero.direction == "downRight"){
		images.hero.src = "./img/hero/shipDownRight.png";
	} else if (hero.direction == "downLeft"){
		images.hero.src = "./img/hero/shipDownLeft.png";
	}
}

















//check for user input, update player position, enemy position, variables, etc.
var updateScene = function(modifier){
//**********************************************************************************
//*********************************	Start Here	*********************************
//**********************************************************************************

//update counter every time the updateScene function runs, this keeps track of how many frames have run since the last fire

	//fire rate counter
	counter++;
//**********************************************************************************
//*********************************	Stop Here	*********************************
//**********************************************************************************

	//update background position
	//pan background left
	bg.y += bg.speed * modifier;
	if (bg.y >= bg.height){
		bg.y=0;
	}

	//update player position, check for interaction with border
	if (keysPressed[38]) { // Player holding up
		//update image to correct direction, set direction variable of hero object
		images.hero.src = "img/hero/shipUp.png";
		hero.direction = "up";

		//screen boundaries up
		if (hero.y <= bg.height*0.2){
			hero.y = bg.height*0.2;
		} else {
			hero.y -= hero.speed * modifier;
		}
	}
	if (keysPressed[40]) { // Player holding down
		//update image and direction variable
		images.hero.src = "img/hero/shipDown.png";
		hero.direction = "down";

		//screen boundaries down
		if (hero.y >= (bg.height-hero.height)){
			hero.y = bg.height - hero.height;
		} else {
			hero.y += hero.speed * modifier;
		}
	}
	if (keysPressed[37]) { // Player holding left
		//update image and direction variable
		images.hero.src = "img/hero/shipLeft.png";
		hero.direction = "left";

		//screen boundaries left
		if (hero.x <= 0){
			hero.x = 0;
		} else {
			hero.x -= hero.speed*modifier;
		}
	}
	if (keysPressed[39]) { // Player holding right
		//update image and direction variable
		images.hero.src = "img/hero/shipRight.png";
		hero.direction = "right";

		//screen boundaries right
		if (hero.x >= bg.width - hero.width){
			hero.x = bg.width - hero.width;
		} else {
		hero.x += hero.speed*modifier;
		}
	}

	//check for diagonal images
	if (keysPressed[38] && keysPressed[37]){ //up and left
		images.hero.src = "img/hero/shipUpLeft.png";
		hero.direction = "upLeft";
	}
	if (keysPressed[38] && keysPressed[39]){ //up and right
		images.hero.src = "img/hero/shipUpRight.png";
		hero.direction = "upRight";
	}
	if (keysPressed[40] && keysPressed[37]){ //down and left
		images.hero.src = "img/hero/shipDownLeft.png";
		hero.direction = "downLeft";
	}
	if (keysPressed[40] && keysPressed[39]){ //down and right
		images.hero.src = "img/hero/shipDownRight.png";
		hero.direction = "downRight";
	}


//**********************************************************************************
//*********************************	Start Here	*********************************
//**********************************************************************************

//if space was pressed and it has been more frames than the fire rate, get a bullet from the array

	if (keysPressed[32] && counter >= hero.fireRate) { // Player holding space
		// console.log("fire!");
		counter = 0;
		hero.ammo.getBullet(hero.x, hero.y, 512, hero.direction);
	}


//update bullet position

	//search through the bullet pool, check if each bullet is alive, if it alive, update the position, check boundry collisions, check enemy collisions
	for (var i = 0; i < hero.ammo.size; i++) {
		// Only draw until we find a bullet that is not alive
		if (hero.ammo.pool[i].alive) {
			ctx.clearRect(hero.ammo.pool[i].x-20, hero.ammo.pool[i].y-20, hero.ammo.pool[i].width+40, hero.ammo.pool[i].height+40);


			//move bullets
			hero.ammo.pool[i].y -= hero.ammo.pool[i].speed * modifier; //up


			//if the bullet is off the map, reset it
			if (hero.ammo.pool[i].y <= 0 || hero.ammo.pool[i].x >= canvas.width || hero.ammo.pool[i].y <= 0 || hero.ammo.pool[i].y >= canvas.height) {
				hero.ammo.pool[i].reset();
				var deadBullet = hero.ammo.pool.splice(i, 1);
				hero.ammo.pool.push(deadBullet[0]);
				if (i != 0 && i != hero.ammo.size){
					i--;
				}
			}

			// if bullet is touching enemy, set alive to false
			if ( hero.ammo.pool[i].x <= (enemy.x + 32)      && enemy.x <= (hero.ammo.pool[i].x + 32)      && hero.ammo.pool[i].y <= (enemy.y + 32)   && enemy.y <= (hero.ammo.pool[i].y + 32)	) {
				playerScore += 1;

				hero.ammo.pool[i].reset();
				var deadBullet = hero.ammo.pool.splice(i, 1);
				hero.ammo.pool.push(deadBullet[0]);
				if (i != 0 && i != hero.ammo.size){
					i--;
				}

				resetEnemy();
			}
		}
	}
//**********************************************************************************
//*********************************	Stop Here	*********************************
//**********************************************************************************







	//check if enemy and hero are colliding
	if (     hero.x <= (enemy.x + enemy.width)  && (hero.x + hero.width)  >= enemy.x && hero.y <= (enemy.y + enemy.height) && (hero.y + hero.height) >= enemy.y     ) {
		//when the hero hits the enemy, reset the enemies position
		playerHealth -= 1;
		resetPlayer();
		resetEnemy();
	}

	//move enemy
	if (enemy.y >= bg.height){
		playerHealth -= 1;
		resetPlayer();
		resetEnemy();
	} else {
		enemy.y += enemy.speed * modifier;
	}
}
















//if images have been loaded, draw the image on the canvas
var render = function(){
	//if images have been loaded, draw images
	if (images.loaded) {
		ctx.drawImage(images.bg, bg.x, bg.y); //draw background
		ctx.drawImage(images.bg, bg.x, bg.y-bg.height); //draw background

		ctx.drawImage(images.hero, hero.x, hero.y); //draw hero

		ctx.drawImage(images.enemy, enemy.x, enemy.y); //draw enemy


//**********************************************************************************
//*********************************	Start Here	*********************************
//**********************************************************************************

//draw bullets

		// loop through bullet pool, check if bullet is alive, if bullet is alive, draw bullet
		for (var i = 0; i < hero.ammo.size; i++) {
			// Only draw until we find a bullet that is not alive
			if (hero.ammo.pool[i].alive) {
				ctx.drawImage(images.bullet, hero.ammo.pool[i].x, hero.ammo.pool[i].y);
			}
		}
//**********************************************************************************
//*********************************	Stop Here	*********************************
//**********************************************************************************

	}

	scoreElement.textContent = playerScore;
	healthElement.textContent = playerHealth;

}












//game loop
//call update function, call render function, call requestAnimFrame (for the next frame)
var gameLoop = function(){
	//calc time from last frame
	var now = Date.now();

	//change in time between last frame and now  (how long it took for the last frame to run)
	var delta = now - then;
	var speedModifier = delta/1000;

	//check if player has lost all health
	if (playerHealth <= 0){
		isPaused = true;
		gameoverMenu.style.display = "block";
	}

	//run the game functions if the game is not paused
	if (!isPaused){
		updateScene(speedModifier);
		render();
	} else {
		//draw background for the beginning
		render();
	}

	//update then variable
	then = now;

	requestAnimFrame(gameLoop);
}










//events
//object to hold keys pressed
var keysPressed = {};

//detect keypress, add keycode to keysPressed object
document.onkeydown = function(eventObject){
	var keyCode = eventObject.keyCode;

	keysPressed[keyCode] = true;

	//prevent default action of keys when they are pressed
	if (keyCode === 32 || keyCode === 37 || keyCode === 38 || keyCode === 39 || keyCode === 40){
		eventObject.preventDefault();
	} else {
		console.log("keyCode pressed: " + keyCode);
	}
}
//remove keycode from keysPressed object
document.onkeyup = function(eventObject){
	var keyCode = eventObject.keyCode;
	delete keysPressed[keyCode];
}




//menu events
startButton.onclick = function(){
	startMenu.style.display = "none";
	isPaused = false;
}

restartButton.onclick = function(){
	gameoverMenu.style.display = "none";
	isPaused = false;

	playerScore = 0;
	playerHealth = hero.maxHealth;

	resetPlayer();
	resetEnemy();

}

pauseButton.onclick = function(){
	if (!isPaused){
		pauseMenu.style.display = "block";
		isPaused = true;	
	} else {
		pauseMenu.style.display = "none";
		isPaused = false;
	}
}

unpauseButton.onclick = function(){
	pauseMenu.style.display = "none";
	isPaused = false;
}















//check if canvas element is supported
if (canvas.getContext){
	//set default values
	bg.setPos(0, 0); // set background position to 0,0
	playerHealth = hero.maxHealth;  //set up the player health for the game

	//give enemy a random position
	resetPlayer();
	resetEnemy();

	//get time for first frame
	var then = Date.now();

	//start game!
	gameLoop();
} else{
	console.log("Canvas is not supported!");
}






