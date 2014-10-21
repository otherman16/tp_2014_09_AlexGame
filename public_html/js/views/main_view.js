define([
	// Libs
	'jquery',
	'backbone',
	// Tmpl
	'main_guest_tmpl',
	'main_user_tmpl',
	// Models
	'user_model'
], function($, Backbone, main_guest_tmpl, main_user_tmpl, UserModel) {
	var MainView = Backbone.View.extend({
		template_user: main_user_tmpl,
		template_guest: main_guest_tmpl,
		el: $('.screen__main'),
		render: function() {
			if( this.model.isLogin() ) {
				this.$el.html(this.template_user());
			}
			else {
				this.$el.html(this.template_guest());
			}
		},
		show: function() {
			this.trigger("showView",[ this ]);
			this.$el.delay(200).fadeIn(200);
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		}
	});
	return MainView;
})