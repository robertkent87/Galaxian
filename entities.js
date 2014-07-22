/**
 * Created by Robert on 18/07/2014.
 * 
 *  Game entities that need to be drawn/updated
 */

/** ====================================================================================================================
 * Creates the Drawable object which will be the base class for all drawable objects in the game. Sets up default 
 * variables that all child objects will inherit, as well as the default functions.
 * ====================================================================================================================
 */
function Drawable() {
    this.init = function (x, y, width, height) {
        // Defualt variables
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    };

    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;
    this.collidableWith = "";
    this.isColliding = false;
    this.type = "";

    // Define abstract function to be implemented in child objects
    this.draw = function () {};
    this.move = function () {};
    this.isCollidableWith = function (object) {
        return (this.collidableWith === object.type);
    };
}

/** ====================================================================================================================
 * Creates the Background object which will become a child of the Drawable object. The background is drawn on the
 * "background" canvas and creates the illusion of moving by panning the image.
 * =====================================================================================================================
 */
function Background(object) {
    var self = object;

    if (self === 'background') {
        this.speed = 1;
        this.image = imageRepository.background;
    } else if (self === 'starfield') {
        this.speed = 2;
        this.image = imageRepository.stars;
    }

    // Implement abstract function
    this.draw = function () {
        // Pan background
        this.y += this.speed;
        //this.context.clearRect(0,0, this.canvasWidth, this.canvasHeight);
        this.context.drawImage(this.image, this.x, this.y);

        // Draw another image at the top edge of the first image
        this.context.drawImage(this.image, this.x, this.y - this.canvasHeight);

        // If the image scrolled off the screen, reset
        if (this.y >= this.canvasHeight) {
            this.y = 0;
        }
    };
}
// Set Background to inherit properties from Drawable
Background.prototype = new Drawable();

/** ====================================================================================================================
 * Creates the Bullet object which the ship fires. The bullets are drawn on the "main" canvas.
 *  ====================================================================================================================
 */
function Bullet(object) {
    this.alive = false; // Is true if the bullet is currently in use
    var self = object;
    /*
     * Sets the bullet values
     */
    this.spawn = function (x, y, speed) {
        this.x = x;
        this.y = y;

        this.speedX = speed[0];
        this.speedY = speed[1];

        this.alive = true;
    };

    /*
     * Uses a "drity rectangle" to erase the bullet and moves it.
     * Returns true if the bullet moved of the screen, indicating that
     * the bullet is ready to be cleared by the pool, otherwise draws
     * the bullet.
     */
    this.draw = function () {
        this.context.clearRect(this.x - 1, this.y - 1, this.width + 2, this.height + 2);
        this.y -= this.speedY;
        this.x -= this.speedX;

        if (this.isColliding) {            return true;
        }
        else if (self === "bullet" && this.y <= 0 - this.height) {
            return true;
        }
        else if (self === "enemyBullet" && this.y >= this.canvasHeight) {
            return true;
        }
        else {
            if (self === "bullet") {
                this.context.drawImage(imageRepository.bullet, this.x, this.y);
            }
            else if (self === "enemyBullet") {
                this.context.drawImage(imageRepository.enemyBullet, this.x, this.y);
            }

            return false;
        }
    };

    /*
     * Resets the bullet values
     */
    this.clear = function () {
        this.x = 0;
        this.y = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.alive = false;
        this.isColliding = false;
    };
}
Bullet.prototype = new Drawable();


/** ====================================================================================================================
 * Create the Ship object that the player controls. The ship is drawn on the "ship" canvas and uses dirty rectangles to
 * move around the screen.
 *  ====================================================================================================================
 */
function Ship() {
    this.speed = 3;
    this.bulletPool = new Pool(30);
    var fireRate = 15;
    var counter = 0;
    this.collidableWith = "enemyBullet";
    this.type = "ship";

    this.init = function (x, y, width, height) {
        // Defualt variables
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.alive = true;
        this.isColliding = false;
        this.bulletPool.init("bullet");
    }

    this.draw = function () {
        this.context.drawImage(imageRepository.spaceship, this.x, this.y);
    };
    this.move = function () {
        counter++;
        // Determine if the action is move action
        if (KEY_STATUS.left || KEY_STATUS.right ||
            KEY_STATUS.down || KEY_STATUS.up) {
            // The ship moved, so erase it's current image so it can
            // be redrawn in it's new location
            this.context.clearRect(this.x, this.y, this.width, this.height);

            // Update x and y according to the direction to move and
            // redraw the ship. Change the else if's to if statements
            // to have diagonal movement.
            if (KEY_STATUS.left) {
                this.x -= this.speed
                // Kep player within the screen
                if (this.x <= 0) {
                    this.x = 0;
                }
            } else if (KEY_STATUS.right) {
                this.x += this.speed
                if (this.x >= this.canvasWidth - this.width) {
                    this.x = this.canvasWidth - this.width;
                }
            } else if (KEY_STATUS.up) {
                this.y -= this.speed
                if (this.y <= this.canvasHeight / 4 * 3) {
                    this.y = this.canvasHeight / 4 * 3;
                }
            } else if (KEY_STATUS.down) {
                this.y += this.speed
                if (this.y >= this.canvasHeight - this.height) {
                    this.y = this.canvasHeight - this.height;
                }
            }
        }

        // Redraw the ship
        if (!this.isColliding) {
            this.draw();
        }
        else {
            this.hit();
        }

        if (KEY_STATUS.space && counter >= fireRate && !this.isColliding) {
            this.fire();
            counter = 0;
        }
    };

    /*
     * Fires two bullets
     */
    this.fire = function () {
        this.bulletPool.getTwo(this.x + 6, this.y, [0,3], this.x + 33, this.y, [0,3]);
        game.laser.get();
    };

    this.hit = function () {
        game.playerLives -= 1;

        if (game.playerLives <= 0) {
//            this.context.drawImage(imageRepository.spaceshipDown, this.x, this.y);
            this.alive = false;
            game.gameOver();
            document.getElementById('lives').innerHTML = "";
        } else {
            game.restart('continue');
        }
    };
}
Ship.prototype = new Drawable();


/** ====================================================================================================================
 * Create the Enemy ship object.
 *  ====================================================================================================================
 */
function Enemy() {
    var percentFire = .01;
    var chance = 0;
    this.alive = false;
    this.collidableWith = "bullet";
    this.type = "enemy";

    /*
     * Sets the Enemy values
     */
    this.spawn = function (x, y, speed) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.speedX = 0;
        this.speedY = speed;
        this.alive = true;
        this.leftEdge = this.x - 90;
        this.rightEdge = this.x + 90;
        this.bottomEdge = this.y + 140;
    };

    /*
     * Move the enemy
     */
    this.draw = function () {
        this.context.clearRect(this.x - 1, this.y, this.width + 1, this.height);

        this.x += this.speedX;
        this.y += this.speedY;
        if (this.x <= this.leftEdge) {
            this.speedX = this.speed;
        }
        else if (this.x >= this.rightEdge + this.width) {
            this.speedX = -this.speed;
        }
        else if (this.y >= this.bottomEdge) {
            this.speed = 1.5;
            this.speedY = 0;
            this.y -= 5;
            this.speedX = -this.speed;
        }

        if (!this.isColliding) {
            this.context.drawImage(imageRepository.enemy, this.x, this.y);

            // Enemy has a chance to shoot every movement
            chance = Math.floor(Math.random() * 101);
            if (chance / 100 < percentFire) {
                this.fire();
            }

            return false;
        }
        else {
            game.explosions.push({
                pos: [this.x, this.y],
                sprite: new Sprite(imageRepository.explosion.src, [0, 0], [49, 49], 1, [0, 1, 2, 3, 4, 5, 6, 7], null, true)
            });
            game.playerScore += 10;
            game.explosion.get();
            return true;
        }
    };

    /*
     * Fires a bullet
     */
    this.fire = function () {
        game.enemyBulletPool.get(this.x + this.width / 2, this.y + this.height, [0,-2.5]);
    };

    /*
     * Resets the enemy values
     */
    this.clear = function () {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.speedX = 0;
        this.speedY = 0;
        this.alive = false;
        this.isColliding = false;
    };
}
Enemy.prototype = new Drawable();