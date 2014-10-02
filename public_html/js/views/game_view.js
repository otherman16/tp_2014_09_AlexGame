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
			this.model.fetch();
			if( this.model.isLogin() ) {
				this.$el.show();
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.hide();
		},
		initialize: function() {
			this.model = new UserModel();
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