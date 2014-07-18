/***************
 * PART FIVE - Finishing touches
 ***************/

/* NOTES TO REMEMBER
 * Could add 
 * - hitboxes to all objects to make collision better
 * - levels
 * - bosses
 * - explosions / particles
 * - parallax background
 * - vectors for movement
 * - lirbraries! http://www.createjs.com/#!/CreateJS
 */

/* RESOURCES
 * http://www.w3schools.com/html5/html5_ref_av_dom.asp
 * http://www.superflashbros.net/as3sfxr/
 */

/**
 * Initialize the Game and start it.
 */
var game = new Game();

function init() {
    game.init();
}


/**
 * Define an object to hold all our images for the game so images
 * are only ever created once. This type of object is known as a
 * singleton.
 */
var imageRepository = new function () {
    // Define images
    this.background = new Image();
    this.stars = new Image();
    this.spaceship = new Image();
    this.bullet = new Image();
    this.enemy = new Image();
    this.enemyBullet = new Image();
    this.explosion = new Image();

    // Ensure all images have loaded before starting the game
    var numImages = 7;
    var numLoaded = 0;

    function imageLoaded() {
        numLoaded++;
        if (numLoaded === numImages) {
            window.init();
        }
    }

    this.background.onload = function () {
        imageLoaded();
    };
    this.stars.onload = function () {
        imageLoaded();
    };
    this.spaceship.onload = function () {
        imageLoaded();
    };
    this.bullet.onload = function () {
        imageLoaded();
    };
    this.enemy.onload = function () {
        imageLoaded();
    };
    this.enemyBullet.onload = function () {
        imageLoaded();
    };
    this.explosion.onload = function () {
        imageLoaded();
    };

    // Set images src
    this.background.src = "images/bg.png";
    this.stars.src = "images/starfield.png";
    this.spaceship.src = "images/ship2.png";
    this.bullet.src = "images/bullet.png";
    this.enemy.src = "images/enemy.png";
    this.enemyBullet.src = "images/bullet_enemy.png";
    this.explosion.src = "images/explosion.png"
};


/**
 * QuadTree object.
 *
 * The quadrant indexes are numbered as below:
 *     |
 *  1  |  0
 * ----+----
 *  2  |  3
 *     |
 */
function QuadTree(boundBox, lvl) {
    var maxObjects = 10;
    this.bounds = boundBox || {
        x: 0,
        y: 0,
        width: 0,
        height: 0
    };
    var objects = [];
    this.nodes = [];
    var level = lvl || 0;
    var maxLevels = 5;

    /*
     * Clears the quadTree and all nodes of objects
     */
    this.clear = function () {
        objects = [];

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }

        this.nodes = [];
    };

    /*
     * Get all objects in the quadTree
     */
    this.getAllObjects = function (returnedObjects) {
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].getAllObjects(returnedObjects);
        }

        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }

        return returnedObjects;
    };

    /*
     * Return all objects that the object could collide with
     */
    this.findObjects = function (returnedObjects, obj) {
        if (typeof obj === "undefined") {
            console.log("UNDEFINED OBJECT");
            return;
        }

        var index = this.getIndex(obj);
        if (index != -1 && this.nodes.length) {
            this.nodes[index].findObjects(returnedObjects, obj);
        }

        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }

        return returnedObjects;
    };

    /*
     * Insert the object into the quadTree. If the tree
     * excedes the capacity, it will split and add all
     * objects to their corresponding nodes.
     */
    this.insert = function (obj) {
        if (typeof obj === "undefined") {
            return;
        }

        if (obj instanceof Array) {
            for (var i = 0, len = obj.length; i < len; i++) {
                this.insert(obj[i]);
            }

            return;
        }

        if (this.nodes.length) {
            var index = this.getIndex(obj);
            // Only add the object to a subnode if it can fit completely
            // within one
            if (index != -1) {
                this.nodes[index].insert(obj);

                return;
            }
        }

        objects.push(obj);

        // Prevent infinite splitting
        if (objects.length > maxObjects && level < maxLevels) {
            if (this.nodes[0] == null) {
                this.split();
            }

            var i = 0;
            while (i < objects.length) {

                var index = this.getIndex(objects[i]);
                if (index != -1) {
                    this.nodes[index].insert((objects.splice(i, 1))[0]);
                }
                else {
                    i++;
                }
            }
        }
    };

    /*
     * Determine which node the object belongs to. -1 means
     * object cannot completely fit within a node and is part
     * of the current node
     */
    this.getIndex = function (obj) {

        var index = -1;
        var verticalMidpoint = this.bounds.x + this.bounds.width / 2;
        var horizontalMidpoint = this.bounds.y + this.bounds.height / 2;

        // Object can fit completely within the top quadrant
        var topQuadrant = (obj.y < horizontalMidpoint && obj.y + obj.height < horizontalMidpoint);
        // Object can fit completely within the bottom quandrant
        var bottomQuadrant = (obj.y > horizontalMidpoint);

        // Object can fit completely within the left quadrants
        if (obj.x < verticalMidpoint &&
            obj.x + obj.width < verticalMidpoint) {
            if (topQuadrant) {
                index = 1;
            }
            else if (bottomQuadrant) {
                index = 2;
            }
        }
        // Object can fix completely within the right quandrants
        else if (obj.x > verticalMidpoint) {
            if (topQuadrant) {
                index = 0;
            }
            else if (bottomQuadrant) {
                index = 3;
            }
        }

        return index;
    };

    /*
     * Splits the node into 4 subnodes
     */
    this.split = function () {
        // Bitwise or [html5rocks]
        var subWidth = (this.bounds.width / 2) | 0;
        var subHeight = (this.bounds.height / 2) | 0;

        this.nodes[0] = new QuadTree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[1] = new QuadTree({
            x: this.bounds.x,
            y: this.bounds.y,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[2] = new QuadTree({
            x: this.bounds.x,
            y: this.bounds.y + subHeight,
            width: subWidth,
            height: subHeight
        }, level + 1);
        this.nodes[3] = new QuadTree({
            x: this.bounds.x + subWidth,
            y: this.bounds.y + subHeight,
            width: subWidth,
            height: subHeight
        }, level + 1);
    };
}


/**
 * Custom Pool object. Holds Bullet objects to be managed to prevent
 * garbage collection.
 * The pool works as follows:
 * - When the pool is initialized, it popoulates an array with
 *   Bullet objects.
 * - When the pool needs to create a new object for use, it looks at
 *   the last item in the array and checks to see if it is currently
 *   in use or not. If it is in use, the pool is full. If it is
 *   not in use, the pool "spawns" the last item in the array and
 *   then pops it from the end and pushed it back onto the front of
 *   the array. This makes the pool have free objects on the back
 *   and used objects in the front.
 * - When the pool animates its objects, it checks to see if the
 *   object is in use (no need to draw unused objects) and if it is,
 *   draws it. If the draw() function returns true, the object is
 *   ready to be cleaned so it "clears" the object and uses the
 *   array function splice() to remove the item from the array and
 *   pushes it to the back.
 * Doing this makes creating/destroying objects in the pool
 * constant.
 */
function Pool(maxSize) {
    var size = maxSize; // Max bullets allowed in the pool
    var pool = [];

    this.getPool = function () {
        var obj = [];
        for (var i = 0; i < size; i++) {
            if (pool[i].alive) {
                obj.push(pool[i]);
            }
        }
        return obj;
    }

    /*
     * Populates the pool array with the given object
     */
    this.init = function (object) {
        if (object == "bullet") {
            for (var i = 0; i < size; i++) {
                // Initalize the object
                var bullet = new Bullet("bullet");
                bullet.init(0, 0, imageRepository.bullet.width,
                    imageRepository.bullet.height);
                bullet.collidableWith = "enemy";
                bullet.type = "bullet";
                pool[i] = bullet;
            }
        }
        else if (object == "enemy") {
            for (var i = 0; i < size; i++) {
                var enemy = new Enemy();
                enemy.init(0, 0, imageRepository.enemy.width,
                    imageRepository.enemy.height);
                pool[i] = enemy;
            }
        }
        else if (object == "enemyBullet") {
            for (var i = 0; i < size; i++) {
                var bullet = new Bullet("enemyBullet");
                bullet.init(0, 0, imageRepository.enemyBullet.width,
                    imageRepository.enemyBullet.height);
                bullet.collidableWith = "ship";
                bullet.type = "enemyBullet";
                pool[i] = bullet;
            }
        }
        else if (object == 'explosion') {
            for (var i = 0; i < size; i++) {
                var explosionAnim = new Explosion(49, 49, 3, 8);
                pool[i] = explosionAnim;
            }
        }
    };

    /*
     * Grabs the last item in the list and initializes it and
     * pushes it to the front of the array.
     */
    this.get = function (x, y, speed) {
        if (!pool[size - 1].alive) {
            pool[size - 1].spawn(x, y, speed);
            pool.unshift(pool.pop());
        }
    };

    /*
     * Used for the ship to be able to get two bullets at once. If
     * only the get() function is used twice, the ship is able to
     * fire and only have 1 bullet spawn instead of 2.
     */
    this.getTwo = function (x1, y1, speed1, x2, y2, speed2) {
        if (!pool[size - 1].alive && !pool[size - 2].alive) {
            this.get(x1, y1, speed1);
            this.get(x2, y2, speed2);
        }
    };

    /*
     * Draws any in use Bullets. If a bullet goes off the screen,
     * clears it and pushes it to the front of the array.
     */
    this.animate = function () {
        for (var i = 0; i < size; i++) {
            // Only draw until we find a bullet that is not alive
            if (pool[i].alive) {
                if (pool[i].draw()) {
                    pool[i].clear();
                    pool.push((pool.splice(i, 1))[0]);
                }
            }
            else {
                break;
            }
        }
    };
}

/**
 * Creates the Game object which will hold all objects and data for
 * the game.
 */
function Game() {
    /*
     * Gets canvas information and context and sets up all game
     * objects.
     * Returns true if the canvas is supported and false if it
     * is not. This is to stop the animation script from constantly
     * running on browsers that do not support the canvas.
     */
    this.init = function () {
        this.playerLives = 3;

        // Get the canvas elements
        this.bgCanvas = document.getElementById('background');
        this.starCanvas = document.getElementById('starfield');
        this.shipCanvas = document.getElementById('ship');
        this.mainCanvas = document.getElementById('main');
        this.explosionCanvas = document.getElementById('explosions');

        // Test to see if canvas is supported. Only need to
        // check one canvas
        if (this.bgCanvas.getContext) {
            this.bgContext = this.bgCanvas.getContext('2d');
            this.starContext = this.starCanvas.getContext('2d');
            this.shipContext = this.shipCanvas.getContext('2d');
            this.mainContext = this.mainCanvas.getContext('2d');
            this.explosionContext = this.explosionCanvas.getContext('2d');

            // Initialize objects to contain their context and canvas
            // information
            Background.prototype.context = this.bgContext;
            Background.prototype.canvasWidth = this.bgCanvas.width;
            Background.prototype.canvasHeight = this.bgCanvas.height;

            Ship.prototype.context = this.shipContext;
            Ship.prototype.canvasWidth = this.shipCanvas.width;
            Ship.prototype.canvasHeight = this.shipCanvas.height;

            Bullet.prototype.context = this.mainContext;
            Bullet.prototype.canvasWidth = this.mainCanvas.width;
            Bullet.prototype.canvasHeight = this.mainCanvas.height;

            Enemy.prototype.context = this.mainContext;
            Enemy.prototype.canvasWidth = this.mainCanvas.width;
            Enemy.prototype.canvasHeight = this.mainCanvas.height;

//            Explosion.prototype.context = this.explosionContext;
//            Explosion.prototype.canvasWidth = this.explosionCanvas.width;
//            Explosion.prototype.canvasHeight = this.explosionCanvas.height;

            // Initialize the background object
            this.background = new Background('background');
            this.background.init(0, 0); // Set draw point to 0,0

            this.starfield = new Background('starfield');
            this.starfield.init(0, 0); // Set draw point to 0,0

            // Initialize the ship object
            this.ship = new Ship();
            // Set the ship to start near the bottom middle of the canvas
            this.shipStartX = this.shipCanvas.width / 2 - imageRepository.spaceship.width;
            this.shipStartY = this.shipCanvas.height / 4 * 3 + imageRepository.spaceship.height * 2;
            this.ship.init(this.shipStartX, this.shipStartY,
                imageRepository.spaceship.width, imageRepository.spaceship.height);

            // Initialize the enemy pool object
            this.enemyPool = new Pool(30);
            this.enemyPool.init("enemy");
            this.spawnWave();

            this.enemyBulletPool = new Pool(50);
            this.enemyBulletPool.init("enemyBullet");

            this.explosions = [];

            // Start QuadTree
            this.quadTree = new QuadTree({x: 0, y: 0, width: this.mainCanvas.width, height: this.mainCanvas.height});

            this.playerScore = 0;

            // Audio files
            this.laser = new SoundPool(10);
            this.laser.init("laser");

            this.explosion = new SoundPool(20);
            this.explosion.init("explosion");

            this.backgroundAudio = new Audio("sounds/fight-for-justice.mp3");
            this.backgroundAudio.loop = true;
            this.backgroundAudio.volume = .25;
            this.backgroundAudio.load();

            this.gameOverAudio = new Audio("sounds/game_over.wav");
            this.gameOverAudio.loop = false;
            this.gameOverAudio.volume = .25;
            this.gameOverAudio.load();

            this.checkAudio = window.setInterval(function () {
                checkReadyState()
            }, 1000);
        }
    };

    // Spawn a new wave of enemies
    this.spawnWave = function () {
        var height = imageRepository.enemy.height;
        var width = imageRepository.enemy.width;
        var x = 100;
        var y = -height;
        var spacer = y * 1.5;
        for (var i = 1; i <= 18; i++) {
            this.enemyPool.get(x, y, 2);
            x += width + 25;
            if (i % 6 == 0) {
                x = 100;
                y += spacer
            }
        }
    }

    // Start the animation loop
    this.start = function () {
        this.ship.draw();
        this.backgroundAudio.play();
        animate();
    };

    // Restart the game
    this.restart = function (condition) {
        var condition = condition || "";

        this.bgContext.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        this.starContext.clearRect(0, 0, this.starCanvas.width, this.starCanvas.height);
        this.shipContext.clearRect(0, 0, this.shipCanvas.width, this.shipCanvas.height);
        this.mainContext.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);

        this.quadTree.clear();

        this.background.init(0, 0);
        this.starfield.init(0, 0);

        this.ship.init(this.shipStartX, this.shipStartY,
            imageRepository.spaceship.width, imageRepository.spaceship.height);

        this.enemyPool.init("enemy");
        this.spawnWave();
        this.enemyBulletPool.init("enemyBullet");
        this.explosions = [];

        if (condition !== 'continue') {
            document.getElementById('game-over').style.display = "none";
            this.playerScore = 0;
            this.playerLives = 3;
            this.backgroundAudio.currentTime = 0;
            this.backgroundAudio.play();

            this.start();
        }

        for (var i = 1, lives = ''; i <= game.playerLives; i++) {
            lives += '<img src="images/lives.png" />'
        }
        document.getElementById('lives').innerHTML = lives;
    };

    // Game over
    this.gameOver = function () {
        this.backgroundAudio.pause();
        this.gameOverAudio.currentTime = 0;
//        this.gameOverAudio.play();
        document.getElementById('game-over').style.display = "block";
    };
}

/**
 * Ensure the game sound has loaded before starting the game
 */
function checkReadyState() {
    if (game.gameOverAudio.readyState === 4 && game.backgroundAudio.readyState === 4) {
        window.clearInterval(game.checkAudio);
        document.getElementById('loading').style.display = "none";
        game.start();
    }
}


/**
 * A sound pool to use for the sound effects
 */
function SoundPool(maxSize) {
    var size = maxSize; // Max bullets allowed in the pool
    var pool = [];
    this.pool = pool;
    var currSound = 0;

    /*
     * Populates the pool array with the given object
     */
    this.init = function (object) {
        if (object == "laser") {
            for (var i = 0; i < size; i++) {
                // Initalize the object
                laser = new Audio("sounds/laser.wav");
                laser.volume = .12;
                laser.load();
                pool[i] = laser;
            }
        }
        else if (object == "explosion") {
            for (var i = 0; i < size; i++) {
                var explosion = new Audio("sounds/explosion.wav");
                explosion.volume = .1;
                explosion.load();
                pool[i] = explosion;
            }
        }
    };

    /*
     * Plays a sound
     */
    this.get = function () {
        if (pool[currSound].currentTime == 0 || pool[currSound].ended) {
            pool[currSound].play();
        }
        currSound = (currSound + 1) % size;
    };
}


/**
 * The animation loop. Calls the requestAnimationFrame shim to
 * optimize the game loop and draws all game objects. This
 * function must be a gobal function and cannot be within an
 * object.
 */
function animate() {
    document.getElementById('score').innerHTML = game.playerScore;

    // Insert objects into quadtree
    game.quadTree.clear();
    game.quadTree.insert(game.ship);
    game.quadTree.insert(game.ship.bulletPool.getPool());
    game.quadTree.insert(game.enemyPool.getPool());
    game.quadTree.insert(game.enemyBulletPool.getPool());

    detectCollision();

    // No more enemies
    if (game.enemyPool.getPool().length === 0) {
        game.spawnWave();
    }

    // Animate game objects
    if (game.ship.alive) {
        requestAnimFrame(animate);

        game.background.draw();
        game.starfield.draw();
        game.ship.move();
        game.ship.bulletPool.animate();
        game.enemyPool.animate();
        game.enemyBulletPool.animate();

        // Update explosions

            game.explosionContext.clearRect(0, 0, game.explosionCanvas.width, game.explosionCanvas.height);
        for (var i = 0; i < game.explosions.length; i++) {
            var explosion = game.explosions[0];
//            var explosion = game.explosions[i];


            explosion.sprite.update(1);

            // Remove if animation is done
            if (explosion.sprite.done) {
                game.explosions.splice(i, 1);
                i--;
            }

//            game.explosionContext.translate(explosion.pos[0], explosion.pos[1]);
            explosion.sprite.render(explosion.pos[0], explosion.pos[1], game.explosionContext);
        }
    }
}

function detectCollision() {
    var objects = [];
    game.quadTree.getAllObjects(objects);

    for (var x = 0, len = objects.length; x < len; x++) {
        game.quadTree.findObjects(obj = [], objects[x]);

        for (y = 0, length = obj.length; y < length; y++) {

            // DETECT COLLISION ALGORITHM
            if (objects[x].collidableWith === obj[y].type &&
                (objects[x].x < obj[y].x + obj[y].width &&
                    objects[x].x + objects[x].width > obj[y].x &&
                    objects[x].y < obj[y].y + obj[y].height &&
                    objects[x].y + objects[y].height > obj[y].y)) {
                objects[x].isColliding = true;
                obj[y].isColliding = true;
            }
        }
    }
};


// The keycodes that will be mapped when a user presses a button.
// Original code by Doug McInnes
KEY_CODES = {
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down'
}

// Creates the array to hold the KEY_CODES and sets all their values
// to true. Checking true/flase is the quickest way to check status
// of a key press and which one was pressed when determining
// when to move and which direction.
KEY_STATUS = {};
for (code in KEY_CODES) {
    KEY_STATUS[KEY_CODES[code]] = false;
}
/**
 * Sets up the document to listen to onkeydown events (fired when
 * any key on the keyboard is pressed down). When a key is pressed,
 * it sets the appropriate direction to true to let us know which
 * key it was.
 */
document.onkeydown = function (e) {
    // Firefox and opera use charCode instead of keyCode to
    // return which key was pressed.
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = true;
    }
}
/**
 * Sets up the document to listen to ownkeyup events (fired when
 * any key on the keyboard is released). When a key is released,
 * it sets teh appropriate direction to false to let us know which
 * key it was.
 */
document.onkeyup = function (e) {
    var keyCode = (e.keyCode) ? e.keyCode : e.charCode;
    if (KEY_CODES[keyCode]) {
        e.preventDefault();
        KEY_STATUS[KEY_CODES[keyCode]] = false;
    }
}

/*
 * Other keyboard shortcuts
 */
document.onkeypress = function (e) {
    // only restart game if player is dead
    if (e.which === 114 && !game.ship.alive) {
        game.restart();
    } else if (e.which === 109) {
        mute();
    }
};

function mute() {
    // bg music is playing
    if (game.backgroundAudio.volume !== 0) {
        game.backgroundAudio.volume = 0;
    } else {
        game.backgroundAudio.volume = .7;
    }

    if (game.gameOverAudio.volume !== 0) {
        game.gameOverAudio.volume = 0;
    } else {
        game.gameOverAudio.volume = .7;
    }
}


/**
 * requestAnim shim layer by Paul Irish
 * Finds the first API that works to optimize the animation loop,
 * otherwise defaults to setTimeout().
 */
window.requestAnimFrame = (function () {
    return  window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();