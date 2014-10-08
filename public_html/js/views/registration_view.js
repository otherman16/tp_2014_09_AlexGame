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
	'jquery.validate'
], function($, Backbone, validate, registration_tmpl, UserModel) {
	var RegistrationView = Backbone.View.extend({
		template: registration_tmpl,
		el: $('.screen__registration'),
		render: function() {
			this.$el.html(this.template());
		},
		show: function() {
			if( !this.model.isLogin() ) {
				this.$el.delay(300).fadeIn(300);
				validate($('form.registration'));
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
	return RegistrationView;
})