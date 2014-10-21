define([
	// Libs
	'jquery',
	'backbone',
	'vertex_collection',
    'vertex_view',
    'vertex_controller',
], function($, Backbone, models, view, controller){
	var VertexApp = Backbone.View.extend({
		initialize: function() {
            this.vertex_view = new view();
            this.vertex_controller = new controller();
		}
	});
	return VertexApp;
})
