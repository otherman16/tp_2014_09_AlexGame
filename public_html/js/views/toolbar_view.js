define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
	'toolbar_tmpl',
	'user_model'
], function($, Backbone, _, toolbar_tmpl, UserModel) {
	var ScoreboardView = Backbone.View.extend({
		template: toolbar_tmpl,
		el: $('#page'),
		model: UserModel,
		render: function() {
			if (this.model.get("id") > 0) {
				this.$el.append(this.template);
			}
		},
		show: function() {
			this.render;
		},
		hide: function() {
			this.$el.remove();
		},
		initialize: function() {
			this.model = new UserModel();
			this.model.fetch();
			this.listenTo(this.model,'change', this.render);
		}
	});
	return ScoreboardView;
})