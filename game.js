/** ====================================================================================================================
 *  Initialize the Game and start it.
 *  ====================================================================================================================
 */
var game = new Game();

function init() {
    game.init();
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
    };

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