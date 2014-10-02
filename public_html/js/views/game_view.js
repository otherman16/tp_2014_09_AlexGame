define([
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Tmpl
	'game_tmpl'
], function($, Backbone, logout, game_tmpl) {
	var GameView = Backbone.View.extend({
		tagName: "div",
		className: "screen__game",
		template: game_tmpl,
		el: $('.screen__game'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
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
		},
		events: {
			"click .screen__toolbar__logout" : "logout"
		},
		logout: function(event) {
			logout(event);
		}
	});
	return GameView;
})