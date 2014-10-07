define([
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Tmpl
	'game_tmpl',
	// Models
	'user_model'
], function($, Backbone, logout, game_tmpl, UserModel) {
	var GameView = Backbone.View.extend({
		template: game_tmpl,
		el: $('.screen__game'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},
		show: function() {
			if( this.model.isLogin() ) {
				this.$el.delay(300).fadeIn(300);
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(300);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
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