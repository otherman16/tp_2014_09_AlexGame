define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'registration_tmpl',
	'my_ajax',
], function($, Backbone, registration_tmpl, my_ajax) {
	var RegistrationView = Backbone.View.extend({
		tagName: "div",
		className: "screen__registration",
		template: registration_tmpl,
		el: $('.screen__registration'),
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
			"submit form.registration" : "submit"
		},
		submit: function(event) {
			my_ajax(event);
		}
	});
	return RegistrationView;
})