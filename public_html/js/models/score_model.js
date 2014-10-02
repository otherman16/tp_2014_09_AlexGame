define([
	// Libs
	'backbone'
], function(Backbone) {
	var ScoreModel = Backbone.Model.extend({
		defaults: {
			login: "",
			score: 0
		},
		urlRoot: "/get_user"
	});
	return ScoreModel;
})