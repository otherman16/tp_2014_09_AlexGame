define([
	// Libs
	'jquery',
	'backbone',
	'validate',
	// Tmpl
	'registration_tmpl',
	// Models
	'user_model',
	// Views
	'alert_view',
	'jquery.validate'
], function($, Backbone, validate, registration_tmpl, UserModel, AlertView) {
	var RegistrationView = Backbone.View.extend({
		template: registration_tmpl,
		el: $('.screen__registration'),
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
	return RegistrationView;
})