/**
 * Created by Robert on 18/07/2014.
 *
 *  Utility functions for the game
 */

/** ====================================================================================================================
 *  requestAnim shim layer by Paul Irish
 *  Finds the first API that works to optimize the animation loop, otherwise defaults to setTimeout().
 *  ====================================================================================================================
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

/** ====================================================================================================================
 *  Define an object to hold all our images for the game so images are only ever created once.
 *  This type of object is known as a singleton.
 * ====================================================================================================================
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

/** ====================================================================================================================
 * QuadTree object.
 *
 * The quadrant indexes are numbered as below:
 *     |
 *  1  |  0
 * ----+----
 *  2  |  3
 *     |
 * ====================================================================================================================
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

    // Clears the quadTree and all nodes of objects
    this.clear = function () {
        objects = [];

        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].clear();
        }

        this.nodes = [];
    };

    // Get all objects in the quadTree
    this.getAllObjects = function (returnedObjects) {
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i].getAllObjects(returnedObjects);
        }

        for (var i = 0, len = objects.length; i < len; i++) {
            returnedObjects.push(objects[i]);
        }

        return returnedObjects;
    };

    // Return all objects that the object could collide with
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

    // Insert the object into the quadTree. If the tree excedes the capacity, it will split and add all objects to
    // their corresponding nodes.
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
            // Only add the object to a subnode if it can fit completely within one
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

    // Determine which node the object belongs to.
    // -1 means object cannot completely fit within a node and is part of the current node
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

    // Splits the node into 4 subnodes
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


/** ====================================================================================================================
 *  Custom Pool object.
 *  Holds Bullet objects to be managed to prevent garbage collection.
 *
 *  The pool works as follows:
 *  - When the pool is initialized, it populates an array with Bullet objects.
 *  - When the pool needs to create a new object for use, it looks at the last item in the array and checks to see if it
 *    is currently in use or not. If it is in use, the pool is full. If it is not in use, the pool "spawns" the last
 *    item in the array and then pops it from the end and pushed it back onto the front of the array.
 *    This makes the pool have free objects on the back and used objects in the front.
 *    When the pool animates its objects, it checks to see if the object is in use (no need to draw unused objects) and
 *    if it is, draws it.
 *    If the draw() function returns true, the object is ready to be cleaned so it "clears" the object and uses the
 *    array function splice() to remove the item from the array and pushes it to the back.
 *  Doing this makes creating/destroying objects in the pool constant.
 *  ====================================================================================================================
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

/** ====================================================================================================================
 *  A sound pool to use for the sound effects
 *  ====================================================================================================================
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