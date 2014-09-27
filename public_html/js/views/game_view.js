define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'game_tmpl',
], function($, Backbone, game_tmpl) {
	var GameView = Backbone.View.extend({
		tagName: "div",
		className: "screen__game",
		template: game_tmpl,
		el: $('.screen__game'),
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
	return GameView;
})