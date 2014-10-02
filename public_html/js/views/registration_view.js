define([
	// Libs
	'jquery',
	'backbone',
	'validate',
	// Tmpl
	'registration_tmpl'
], function($, Backbone, Validator, registration_tmpl) {
	var RegistrationView = Backbone.View.extend({
		tagName: "div",
		className: "screen__registration",
		template: registration_tmpl,
		el: $('.screen__registration'),
		render: function() {
			this.$el.html(this.template());
			Validator.initialize(this.$el.find('form.registration'));
		},
		show: function() {
			if( this.model.get("id") > 0 ) {
				window.location.assign("/#");
			}
			else {
				this.$el.show();
				Validator.initialize(this.$el.find('form.registration'));
			}
		},
		hide: function() {
			this.$el.hide();
			Validator.removeEvents(this.$el.find('form.registration'));
		},
		initialize: function() {
			this.render();
			this.listenTo(this.model,'change', this.render);
		}
	});
	return RegistrationView;
})