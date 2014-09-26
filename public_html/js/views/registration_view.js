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
		show: function() {
			this.render();
		},
		hide: function() {
			this.$el.remove();
		},
		initialize: function() {
			// 
		},
		events: {
			"submit form" : "submit"
		},
		submit: function(event) {
			my_ajax(event);
		}
	});
	return RegistrationView;
})