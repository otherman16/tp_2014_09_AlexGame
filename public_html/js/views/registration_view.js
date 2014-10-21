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
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
				validate($('form.registration'),this.model);
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		}
	});
	return RegistrationView;
})