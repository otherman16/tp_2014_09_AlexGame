define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'main_tmpl',
], function($, Backbone, main_tmpl) {
	var MainView = Backbone.View.extend({
		tagName: "div",
		className: "screen__main",
		template: main_tmpl,
		el: $('.screen__main'),
		render: function() {
			this.$el.html(this.template());
			if( this.model.get("id") > 0) {
				this.$el.find('.screen__main__button__game').show();
				this.$el.find('.screen__main__button__scoreboard').show();
				this.$el.find('.screen__main__button__login').hide();
				this.$el.find('.screen__main__button__registration').hide();
			}
			else {
				this.$el.find('.screen__main__button__game').hide();
				this.$el.find('.screen__main__button__scoreboard').hide();
				this.$el.find('.screen__main__button__login').show();
				this.$el.find('.screen__main__button__registration').show();
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
		}
	});
	return MainView;
})