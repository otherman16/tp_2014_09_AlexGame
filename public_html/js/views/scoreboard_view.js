define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'scoreboard_tmpl',
], function($, Backbone, scoreboard_tmpl) {
	var ScoreboardView = Backbone.View.extend({
		tagName: "div",
		className: "screen__scoreboard",
		template: scoreboard_tmpl,
		el: $('.screen__scoreboard'),
		render: function() {
			this.$el.html(this.template());
		},
		show: function() {
			if( this.model.get("id") > 0 ) {
				this.$el.show();
			}
			else {
				window.location.assign("/#login");
			}
		},
		hide: function() {
			this.$el.hide();
		},
		initialize: function() {
			this.render();
			this.listenTo(this.model,'change', this.render);
		}
	});
	return ScoreboardView;
})