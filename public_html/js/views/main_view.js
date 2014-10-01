define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'main_guest_tmpl',
	'main_user_tmpl',
	'logout',
], function($, Backbone, main_guest_tmpl, main_user_tmpl, logout) {
	var MainView = Backbone.View.extend({
		tagName: "div",
		className: "screen__main",
		template_user: main_user_tmpl,
		template_guest: main_guest_tmpl,
		el: $('.screen__main'),
		render: function() {
			if( this.model.get("id") > 0) {
				this.$el.html(this.template_user());
			}
			else {
				this.$el.html(this.template_guest());
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
			"click .screen__toolbar__logout" : "logout"
		},
		logout: function(event) {
			logout(event);
			this.model.fetch();
		}
	});
	return MainView;
})