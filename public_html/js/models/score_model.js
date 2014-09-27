define([
	// Libs
	'backbone',
	// Deps
], function(Backbone) {
	var ScoreModel = Backbone.Model.extend({
		defaults: {
			login: "",
			score: ""
		},
		urlRoot: "/get_user"
	});
	return ScoreModel;
})