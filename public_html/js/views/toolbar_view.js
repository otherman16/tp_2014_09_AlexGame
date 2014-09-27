define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'toolbar_tmpl',
	'logout',
], function($, Backbone, toolbar_tmpl, logout) {
	var ToolbarView = Backbone.View.extend({
		tagName: "div",
		className: "toolbar",
		template: toolbar_tmpl,
		el: $('.toolbar'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
			if (this.model.get("id") > 0) {
				this.show();
			}
			else {
				this.hide();
			}
		},
		show: function() {
			this.$el.show();
		},
		hide: function() {
			this.$el.hide();
		},
		initialize: function() {
			this.render();
			this.listenTo(this.model,'change', this.render);
		},
		events: {
			"click .toolbar__tools__logout" : "logout"
		},
		logout: function(event) {
			logout(event);
			this.model.fetch();
		}
	});
	return ToolbarView;
})