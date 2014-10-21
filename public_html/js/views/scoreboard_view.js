define([
	// Libs
	'jquery',
	'backbone',
	// Collections
	'score_collection',
	// Tmpl
	'scoreboard_tmpl',
	// Models
	'user_model'
], function($, Backbone, ScoreCollection, scoreboard_tmpl, UserModel) {
	var ScoreboardView = Backbone.View.extend({
		template: scoreboard_tmpl,
		el: $('.screen__scoreboard'),
		render: function() {
			this.$el.html(this.template(this.score_collection.toJSON()));
		},
		show: function() {
			var collection = this.score_collection;
			this.score_collection.fetch().done(function() {
				collection.trigger("change");
			});  // ????? два запроса сразу и поэтому виснет???
			if( this.model.isLogin() ) {
				this.trigger("showView", this)
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
			// this.score_collection = new ScoreCollection([
			// 	{"login":"alex","score":200},
			// 	{"login":"max","score":100},
			// 	{"login":"john","score":10},
			// 	{"login":"arnold","score":0},
			// 	{"login":"alexander","score":50},
			// 	{"login":"dirk","score":40},
			// 	{"login":"gleb","score":500},
			// 	{"login":"kevin","score":600},
			// 	{"login":"cassandra","score":100},
			// 	{"login":"kate","score":1}
			// ]);
			this.score_collection = new ScoreCollection();
			this.listenTo(this.model,'change', this.render);
			this.listenTo(this.score_collection,'change', this.render);
			this.render();
		}
	});
	return ScoreboardView;
})