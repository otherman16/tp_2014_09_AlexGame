define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'login_tmpl',
	'validate',
], function($, Backbone, login_tmpl, Validator) {
	var LoginView = Backbone.View.extend({
		tagName: "div",
		className: "screen__login",
		template: login_tmpl,
		el: $('.screen__login'),
		render: function() {
			this.$el.html(this.template());
			Validator.initialize(this.$el.find('form.login'));
		},
		show: function() {
			if( this.model.get("id") > 0 ) {
				window.location.assign("/#");
			}
			else {
				this.$el.show();
				Validator.initialize(this.$el.find('form.login'));
			}
		},
		hide: function() {
			this.$el.hide();
			Validator.removeEvents(this.$el.find('form.login'));
		},
		initialize: function() {
			this.render();
			this.listenTo(this.model,'change', this.render);
		}
	});
	return LoginView;
})