define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'registration_tmpl',
	'my_ajax'
], function($, Backbone, _, registration_tmpl, my_ajax) {
	var RegistrationView = Backbone.View.extend({
		template: registration_tmpl,
		el: $('#page'),
		render: function() {
			this.$el.html(this.template());
		},
		events: {
			"submit form" : "submit"
		},
		submit: function() {
			my_ajax();
			return false;
		}
	});
	return RegistrationView;
})