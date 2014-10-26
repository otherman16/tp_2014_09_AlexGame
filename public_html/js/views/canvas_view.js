define([
	// Libs
	'jquery',
	'backbone',
], function($, Backbone){
	var CanvasView = Backbone.View.extend({
		el: $('.screen__canvas'),
		render: function() {
			this.$el.html("canvas");
		},
		show: function() {
			this.trigger("showView",[ this ]);
			this.$el.delay(200).fadeIn(200);
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.render();
		}
	});
	return CanvasView;
})