define([
	// Libs
	'jquery',
	'backbone',
	'vertex_collection',
    'vertex_view',
    'vertex_controller',
    'vertex_model'
], function($, Backbone, models, view, controller, Vertex){
	var VertexApp = Backbone.View.extend({
		initialize: function() {
		    models.add(new Vertex({
                x: 100,
                y: 100
            }));
            this.vertex_view = new view();
            this.vertex_controller = new controller();
		},
	});
	return VertexApp;
})
