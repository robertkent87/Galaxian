/**
 * Created by Robert on 04/07/2014.
 */

/**
 * Define an object to hold all our images for the game so images are only ever created once. This is a Singleton
 */

var imageRepository = function (){
    // define images
    this.background = new Image();

    // Set images src
    this.background.src = 'imgs/bg.png';
};

/**
 * Create the Drawable object which will be the base class for all drawable objects.
 * Set up default variables that all child objects inherit, as well as default functions
 */

function Drawable(){
    this.init = function (x, y){
        this.x = x;
        this.y = y;
    };

    this.speed = 0;
    this.canvasWidth = 0;
    this.canvasHeight = 0;

    this.draw = function()
}