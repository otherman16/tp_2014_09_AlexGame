define([
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Collections
	'score_collection',
	// Tmpl
	'scoreboard_tmpl',
	// Models
	'user_model'
], function($, Backbone, logout, ScoreCollection, scoreboard_tmpl, UserModel) {
	var ScoreboardView = Backbone.View.extend({
		template: scoreboard_tmpl,
		el: $('.screen__scoreboard'),
		render: function() {
			this.$el.html(this.template(this.score_collection.toJSON()));
		},
		show: function() {
			this.model.fetch();
			if( this.model.isLogin() ) {
				this.$el.show();
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.hide();
		},
		initialize: function() {
			this.score_collection = new ScoreCollection([
				{"login":"alex","score":200},
				{"login":"max","score":100},
				{"login":"john","score":10},
				{"login":"arnold","score":0},
				{"login":"alexander","score":50},
				{"login":"dirk","score":40},
				{"login":"gleb","score":500},
				{"login":"kevin","score":600},
				{"login":"cassandra","score":100},
				{"login":"kate","score":1}
			]);
			this.model = new UserModel();
			this.listenTo(this.model,'change', this.render);
			this.listenTo(this.score_collection,'change', this.render);
		},
		events: {
			"click .screen__toolbar__logout" : "logout"
		},
		logout: function(event) {
			logout(event)
		}
	});
	return ScoreboardView;
})