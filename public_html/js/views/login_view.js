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
		template: login_tmpl,
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
	return LoginView;
})