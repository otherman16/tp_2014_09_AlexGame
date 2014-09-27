define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'login_tmpl',
	'my_ajax',
], function($, Backbone, login_tmpl, my_ajax) {
	var LoginView = Backbone.View.extend({
		tagName: "div",
		className: "screen__login",
		template: login_tmpl,
		el: $('.screen__login'),
		render: function() {
			this.$el.html(this.template());
		},
		show: function() {
			if( this.model.get("id") > 0 ) {
				window.location.assign("/#");
			}
			else {
				this.$el.show();
			}
		},
		hide: function() {
			this.$el.hide();
		},
		initialize: function() {
			this.render();
			this.listenTo(this.model,'change', this.render);
		},
		events: {
			"submit form.login" : "submit"
		},
		submit: function(event) {
			my_ajax(event);
		}
	});
	return LoginView;
})