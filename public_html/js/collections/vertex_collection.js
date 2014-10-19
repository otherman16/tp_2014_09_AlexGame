define([
    // Libs
    'backbone',
    // Models
    'vertex_model'
], function(Backbone, Vertex){
       var Vertices = Backbone.Collection.extend({
       models: Vertex
    });
    return new Vertices();
});