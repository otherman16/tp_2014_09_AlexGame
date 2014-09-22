define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'game_tmpl'
], function($, Backbone, _, game_tmpl) {
	var GameView = Backbone.View.extend({
		template: game_tmpl,
		el: $('#page'),
		render: function() {
			this.$el.html(this.template());
		}
	});
	return GameView;
})