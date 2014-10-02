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
	'alert_view',
	'jquery.validate'
], function($, Backbone, validate, login_tmpl, UserModel, AlertView) {
	var LoginView = Backbone.View.extend({
		template: login_tmpl,
		el: $('.screen__login'),
		render: function() {
			this.$el.html(this.template());
			validate($('form'));
		},
		show: function() {
			this.model.fetch();
			if( !this.model.isLogin() ) {
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
		}
	});
	return LoginView;
})