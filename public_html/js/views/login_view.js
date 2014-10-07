define([
	// Libs
	'jquery',
	'backbone',
	'validate',
	// Tmpl
	'login_tmpl',
	// Models
	'user_model',
	// Views
	'jquery.validate'
], function($, Backbone, validate, login_tmpl, UserModel) {
	var LoginView = Backbone.View.extend({
		template: login_tmpl,
		el: $('.screen__login'),
		render: function() {
			this.$el.html(this.template());
		},
		show: function() {
			if( !this.model.isLogin() ) {
				this.$el.delay(300).fadeIn(300);
				validate($('form.login'));
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
		}
	});
	return LoginView;
})