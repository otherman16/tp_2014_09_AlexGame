define([
    // Libs
    'backbone',
    'phoria',
], function(Backbone, Phoria) {
    var PuckModel = Backbone.Model.extend({

        x: 0,
        y: 0,
        dnextX: 0.1,
        dnextY: -0.1,
        velocityX: 0,
        velocityY: 0,
        speed: 0.8,

        height : 0.25,
        radius : 1,
        accuracy : 50, // детальность прорисовки фигуры
        tmp : {},
        Shape : {},
        who_is : "nobody",
        stepX : 0.2,
        startY : 8,
        start : false,
        mass: 0.1,
        angle : 280,
        radians : 0,

        update : function() {
            this.radians = this.angle * Math.PI/ 180;
            this.velocityX = Math.cos(this.radians) * this.speed;
            this.velocityY = Math.sin(this.radians) * this.speed;
            this.dnextX = this.velocityX;
            this.dnextY = this.velocityY;
        },

        render: function() {
            if ( this.start) {
                this.Shape.translateX(this.dnextX);
                this.Shape.translateZ(this.dnextY);
                this.x += this.dnextX;
                this.y += this.dnextY;
                this.velocityX = 0;
                this.velocityY = 0;
            }
        },

        initialize: function() {
            this.tmp = Phoria.Util.generateCylinder(this.radius,this.height,this.accuracy);
            this.Shape = Phoria.Entity.create({
                points: this.tmp.points,
                edges: this.tmp.edges,
                polygons: this.tmp.polygons,
                style : {
                    color: [20,20,20]
                }
            });
        }
    });
    return PuckModel;
})