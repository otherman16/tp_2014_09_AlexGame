define([
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Deps
	'profile_tmpl',
	// Models
	'user_model',
], function($, Backbone, logout, profile_tmpl, UserModel) {
	var ScoreboardView = Backbone.View.extend({
		template: profile_tmpl,
		el: $('.screen__profile'),
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
	return ScoreboardView;
})