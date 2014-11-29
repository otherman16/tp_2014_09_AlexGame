define([
    // Libs
    'backbone',
    'phoria',
], function(Backbone, Phoria) {
    var BatModel = Backbone.Model.extend({

        x: 0,
        y: 0,
        // приращение координаты, для удобства при отрисовки
        dnextX: 0,
        dnextY: 0,
        velocityX: 0,
        velocityY: 0,
        speed: 0,

        height : 0.5,
        radius : 1.5,
        accuracy : 50,
        tmp : {},
        Shape : {},
        who_is : "nobody",
        mass: 0.2,
        stepX : 0.5,
        stepY : 0.5,
        startY : 8,
        score: 0,

        sqrt2: Math.sqrt(2),

        top: function() {
            this.velocityY = this.stepY;
            this.dnextY = this.velocityY;
            this.dnextX = 0;
        },

        bottom: function() {
            this.velocityY = -this.stepY;
            this.dnextY = this.velocityY;
            this.dnextX = 0;
        },

        left: function() {
            this.velocityX = -this.stepX;
            this.dnextX = this.velocityX;
            this.dnextY = 0;
        },

        right: function() {
            this.velocityX = this.stepX;
            this.dnextX = this.velocityX;
            this.dnextY = 0;
        },

        left_top : function () {
            this.velocityX = -this.stepX/this.sqrt2;
            this.velocityY = this.stepY/this.sqrt2;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        left_bottom : function () {
            this.velocityX = -this.stepX/this.sqrt2;
            this.velocityY = -this.stepY/this.sqrt2;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        right_top : function () {
            this.velocityX = this.stepX/this.sqrt2;
            this.velocityY = this.stepY/this.sqrt2;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        right_bottom : function () {
            this.velocityX = this.stepX/this.sqrt2;
            this.velocityY = -this.stepY/this.sqrt2;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        testBorder: function(width, height) {
            if (this.x + this.dnextX + this.radius > width) {
                this.velocityX *=-1;
                this.dnextX = width - this.radius - this.x - this.velocityX;
            } else if (this.x + this.dnextX - this.radius < -width ) {
                this.velocityX *=-1;
                this.dnextX = -width + this.radius - this.x - this.velocityX;
            } else if (this.y + this.dnextY + this.radius > -height/10) {
                this.dnextY = -this.radius - this.y - height / 10;
            } else if(this.y + this.dnextY - this.radius < -height) {
                this.dnextY = -height + this.radius - this.y;
            }
        },

        render : function () {
            this.x += this.dnextX;
            this.y += this.dnextY;
            this.Shape.translateX(this.dnextX).translateZ(this.dnextY);
            this.dnextX = 0;
            this.dnextY = 0;
            this.velocityX = 0;
            this.velocityY = 0;
        },

        setStartY : function(_y) {
            if (this.who_is === "my") {
                this.Shape.translateZ(-_y);
                this.nextY += -_y;
                this.y += -_y;
            }
            else if (this.who_is === "enemy") {
                this.Shape.translateZ(_y);
                this.nextY += _y;
                this.y += _y;
            }
        },

        initAsMy : function() {
            this.who_is = "my";
            this.setStartY(this.startY);
        },

        initAsEnemy : function() {
            this.who_is = "enemy";
            this.setStartY(this.startY);
        },

        initialize: function() {
            this.tmp = Phoria.Util.generateCylinder(this.radius,this.height,this.accuracy);
            this.Shape = Phoria.Entity.create({
                points: this.tmp.points,
                edges: this.tmp.edges,
                polygons: this.tmp.polygons,
                style : {
                    color: [20,100,200]
                }
            });
        }
    });
    return BatModel;
})