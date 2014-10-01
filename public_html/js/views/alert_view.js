define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
], function($, Backbone, _) {
	var AlertView = Backbone.View.extend({
		tagName: "div",
		className: "alert",
		template: _.template("<span><%= message %></span>"),
		el: $('.alert'),
		render: function(message) {
			this.$el.html(this.template({"message":message}));
		},
		show: function(message) {
			this.render(message);
			this.$el.slideDown().delay(2000).slideUp();
		}
	})
	return AlertView;
})