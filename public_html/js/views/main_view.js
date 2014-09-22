define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'main_tmpl',
], function($, Backbone, _, main_tmpl) {
	var MainView = Backbone.View.extend({
		template: main_tmpl,
		el: $('#page'),
		render: function() {
			this.$el.html(this.template());
		},
		initialize: function() {
			this.render();
		}
	});
	return MainView;
})