define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'registration_tmpl'
], function($, Backbone, _, registration_tmpl) {
	var RegistrationView = Backbone.View.extend({
		el: $('#page'),
		render: function() {
			this.$el.html(registration_tmpl);
		}
	});
	return RegistrationView;
})