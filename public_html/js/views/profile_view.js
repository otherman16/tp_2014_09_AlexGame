define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'profile_tmpl',
	// Models
	'user_model',
], function($, Backbone, profile_tmpl, UserModel) {
	var ScoreboardView = Backbone.View.extend({
		template: profile_tmpl,
		el: $('.screen__profile'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},
		show: function() {
			if( this.model.isLogin() ) {
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		},
		events: {
			"click .screen__toolbar__logout" : "logout"
		}
	});
	return ScoreboardView;
})