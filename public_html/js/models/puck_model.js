define([
    // Libs
    'backbone',
    'phoria',
], function(Backbone, Phoria) {
    var PuckModel = Backbone.Model.extend({

        x: 0,
        y: 0,
        height : 0.25,
        radius : 0.5,
        accuracy : 50, // детальность прорисовки фигуры
        tmp : {},
        Shape : {},
        who_is : "nobody",
        stepX : 0.2,
        startY : 8,
        // for shaiba
        start : false,
        k : 1,
        angle : 150,
        speed : 0.2,
        radians : 0,
        xunits : 0,
        yunits : 0,

        update : function() {
            this.radians = this.angle * Math.PI/ 180;
            this.xunits = Math.cos(this.radians) * this.speed * this.k;
            this.yunits = Math.sin(this.radians) * this.speed * this.k;
            this.x += this.xunits;
            this.y += this.yunits;
        },

        setBigShape : function(height, radius, accuracy) {
            this.tmp = Phoria.Util.generateShape(radius, height, accuracy);
            this.Shape = Phoria.Entity.create({
                points: this.tmp.points,
                edges: this.tmp.edges,
                polygons: this.tmp.polygons
            });
        },

        left: function() {
            this.Shape.translateX(-this.stepX);
            this.x += -this.stepX;
        },

        right: function() {
            this.Shape.translateX(this.stepX);
            this.x += this.stepX;
        },

        move: function() {
            this.Shape.translateX(this.xunits);
            this.Shape.translateZ(this.yunits);
            this.x += this.xunits;
            this.y += this.yunits;
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