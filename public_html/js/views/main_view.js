define([
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Tmpl
	'main_guest_tmpl',
	'main_user_tmpl',
	// Models
	'user_model'
], function($, Backbone, logout, main_guest_tmpl, main_user_tmpl, UserModel) {
	var MainView = Backbone.View.extend({
		template_user: main_user_tmpl,
		template_guest: main_guest_tmpl,
		el: $('.screen__main'),
		render: function() {
			if( this.model.isLogin() ) {
				this.$el.html(this.template_user());
			}
			else {
				this.$el.html(this.template_guest());
			}
		},
		show: function() {
			this.model.fetch();
			this.$el.show();
		},
		hide: function() {
			this.$el.hide();
		},
		initialize: function() {
			this.model = new UserModel();
			this.listenTo(this.model,'change', this.render);
		},
		events: {
			"click .screen__toolbar__logout" : "logout",
		},
		logout: function(event) {
			logout(event);
			this.model.fetch();
		}
	});
	return MainView;
})