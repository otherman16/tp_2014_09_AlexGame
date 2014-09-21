define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'main_tmpl',
], function($, Backbone, _, main_tmpl) {
	var MainView = Backbone.View.extend({
		el: $('#page'),
		render: function() {
			this.$el.html(main_tmpl);
		}
	});
	return MainView;
})