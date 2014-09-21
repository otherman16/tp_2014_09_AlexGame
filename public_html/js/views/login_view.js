define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'login_tmpl',
	'my_ajax'
], function($, Backbone, _, login_tmpl, my_ajax) {
	var LoginView = Backbone.View.extend({
		el: $('#page'),
		render: function() {
			this.$el.html(login_tmpl);
		},
		events: {
			"submit" : "submit"
		},
		submit: function() {
			my_ajax;
		}
	});
	return LoginView;
})