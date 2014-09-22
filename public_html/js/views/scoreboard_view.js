define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'scoreboard_tmpl'
], function($, Backbone, _, scoreboard_tmpl) {
	var ScoreboardView = Backbone.View.extend({
		template: scoreboard_tmpl,
		el: $('#page'),
		render: function() {
			this.$el.html(this.template());
		}
	});
	return ScoreboardView;
})