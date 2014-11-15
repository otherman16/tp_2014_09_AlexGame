define([
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Tmpl
	'toolbar_guest_tmpl',
	'toolbar_user_tmpl',
	// Models
	'user_model'
], function($, Backbone, logout, toolbar_guest_tmpl, toolbar_user_tmpl, UserModel) {
	var ToolbarView = Backbone.View.extend({
		template_user: toolbar_user_tmpl,
		template_guest: toolbar_guest_tmpl,
		el: $('.screen__toolbar'),
		render: function() {
			if( this.model.isLogin() ) {
				this.$el.html(this.template_user());
			}
			else {
				this.$el.html(this.template_guest());
			}
		},
		initialize: function() {
            console.log("parapapam");
            console.log(this.ababa);
			this.listenTo(this.model,'change', this.render);
			this.render();
		},
		events: {
			"click .screen__toolbar__logout" : "logout",
		},
		logout: function(event) {
			logout(event);
			this.model.resetModel();
		}
	});
	return ToolbarView;
})