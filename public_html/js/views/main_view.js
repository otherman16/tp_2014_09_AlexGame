define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'main_tmpl',
	'toolbar_view',
], function($, Backbone, _, main_tmpl, ToolbarView) {
	var MainView = Backbone.View.extend({
		template: main_tmpl,
		el: $('#page'),
		render: function() {
			this.$el.html(this.template());
			var toolbarView = new ToolbarView();
			toolbarView.show();
		},
		show: function() {
			this.render();
		},
		hide: function() {
			this.$el.remove();
		},
		initialize: function() {
		}
	});
	return MainView;
})