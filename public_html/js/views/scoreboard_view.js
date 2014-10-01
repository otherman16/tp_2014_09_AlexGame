define([
	// Libs
	'jquery',
	'backbone',
	// Deps
	'scoreboard_tmpl',
	'logout',
	'score_collection',
], function($, Backbone, scoreboard_tmpl, logout, ScoreCollection) {
	var ScoreboardView = Backbone.View.extend({
		tagName: "div",
		className: "screen__scoreboard",
		template: scoreboard_tmpl,
		el: $('.screen__scoreboard'),
		render: function() {
			this.$el.html(this.template(this.score_collection.toJSON()));
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
			this.render();
			this.listenTo(this.model,'change', this.render);
			this.listenTo(this.score_collection,'change', this.render);
		},
		events: {
			"click .screen__toolbar__logout" : "logout"
		},
		logout: function(event) {
			logout(event);
		}
	});
	return ScoreboardView;
})