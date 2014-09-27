define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'profile_tmpl',
], function($, Backbone, profile_tmpl) {
	var ScoreboardView = Backbone.View.extend({
		tagName: "div",
		className: "screen__profile",
		template: profile_tmpl,
		el: $('.screen__profile'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},
		show: function() {
			if( this.model.get("id") > 0 ) {
				this.$el.show();
			}
			else {
				window.location.assign("/#login");
			}
		},
		hide: function() {
			this.$el.hide();
		},
		initialize: function() {
			this.render();
			this.listenTo(this.model,'change', this.render);
		}
	});
	return ScoreboardView;
})