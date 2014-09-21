define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'scoreboard_tmpl'
], function($, Backbone, _, scoreboard_tmpl) {
	var ScoreboardView = Backbone.View.extend({
		el: $('#page'),
		render: function() {
			this.$el.html(scoreboard_tmpl);
		}
	});
	return ScoreboardView;
})