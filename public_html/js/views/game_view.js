define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'game_tmpl'
], function($, Backbone, _, game_tmpl) {
	var GameView = Backbone.View.extend({
		el: $('#page'),
		render: function() {
			this.$el.html(game_tmpl);
		}
	});
	return GameView;
})