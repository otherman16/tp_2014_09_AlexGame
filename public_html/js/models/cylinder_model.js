define([
    // Libs
    'backbone',
    'phoria',
], function(Backbone, Phoria) {
    var CylinderModel = Backbone.Model.extend({

        x: 0,
        y: 0,
        velocityX: 0,
        velocityY: 0,
        height : 0.5,
        radius : 1,
        accuracy : 50,
        tmp : {},
        Shape : {},
        who_is : "nobody",
        stepX : 0.2,
        stepY : 0.2,
        startY : 8,
        // for shaiba

        /*update : function() {
            this.radians = this.angle * Math.PI/ 180;
            this.xunits = Math.cos(this.radians) * this.speed * this.k;
            this.yunits = Math.sin(this.radians) * this.speed * this.k;
            this.x += this.xunits;
            this.y += this.yunits;
        },*/

        /*setBigCylinder : function(height, radius, accuracy) {
            this.tmp = Phoria.Util.generateCylinder(radius, height, accuracy);
            this.Shape = Phoria.Entity.create({
                points: this.tmp.points,
                edges: this.tmp.edges,
                polygons: this.tmp.polygons
            });
        },*/

        // сделаем движение вперед и вниз для bat

        sqrt2: Math.sqrt(2),

        top: function() {
            this.Shape.translateZ(this.stepY);
            this.y += this.stepY;
        },

        bottom: function() {
            this.Shape.translateZ(-this.stepY);
            this.y += -this.stepY;
        },

        left: function() {
            this.Shape.translateX(-this.stepX);
            this.x += -this.stepX;
        },

        right: function() {
            this.Shape.translateX(this.stepX);
            this.x += this.stepX;
        },

        left_top : function () {
            this.Shape.translateX(-this.stepX/(this.sqrt2));
            this.Shape.translateZ(this.stepY/(this.sqrt2));
            this.velocityX = -this.stepX/this.sqrt2;
            this.velocityY = this.stepY/this.sqrt2;
            this.x += this.velocityX;
            this.y += this.velocityY;
        },

        left_bottom : function () {
            this.Shape.translateX(-this.stepX/(this.sqrt2));
            this.Shape.translateZ(-this.stepY/(this.sqrt2));
            this.velocityX = -this.stepX/this.sqrt2;
            this.velocityY = -this.stepY/this.sqrt2;
            this.x += this.velocityX;
            this.y += this.velocityY;
        },

        right_top : function () {
            this.Shape.translateX(this.stepX/(this.sqrt2));
            this.Shape.translateZ(this.stepY/(this.sqrt2));
            this.velocityX = this.stepX/this.sqrt2;
            this.velocityY = this.stepY/this.sqrt2;
            this.x += this.velocityX;
            this.y += this.velocityY;
        },

        right_bottom : function () {
            this.Shape.translateX(this.stepX/(this.sqrt2));
            this.Shape.translateZ(-this.stepY/(this.sqrt2));
            this.velocityX = this.stepX/this.sqrt2;
            this.velocityY = -this.stepY/this.sqrt2;
            this.x += this.velocityX;
            this.y += this.velocityY;
        },

        setStartY : function(_y) {
            if (this.who_is === "my") {
                this.Shape.translateZ(-_y);
                this.y += -_y;
            }
            else if (this.who_is === "enemy") {
                this.Shape.translateZ(_y);
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
    return CylinderModel;
})