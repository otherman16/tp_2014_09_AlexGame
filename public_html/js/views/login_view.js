define([
	// Libs
	'jquery',
	'backbone',
	'validate',
	// Tmpl
	'login_tmpl',
	// Models
	'user_model',
], function($, Backbone, validate, login_tmpl, UserModel) {
	var LoginView = Backbone.View.extend({
		template: login_tmpl,
		el: $('.screen__login'),
		render: function() {
			this.$el.html(this.template());
		},
		show: function() {
			if( !this.model.isLogin() ) {
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
				validate($('.screen__login__form'),this.model);
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
	return LoginView;
})