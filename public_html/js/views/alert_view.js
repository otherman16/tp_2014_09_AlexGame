define([
	// Libs
	'jquery',
	'backbone',
	'underscore'
], function($, Backbone, _) {
	var AlertView = Backbone.View.extend({
		template: _.template("<label><%= message %></label>"),
		el: $('.screen__alert'),
		render: function(message) {
			this.$el.html(this.template({"message":message}));
		},
		show: function(message) {
			this.render(message);
			this.$el.slideDown().delay(message.length * 150).slideUp();
		}
	})
	return AlertView;
})