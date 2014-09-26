define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
], function($, Backbone, _) {
	var ScoreModel = Backbone.Model.extend({
		defaults: {
			login: "",
			score: ""
		},
		urlRoot: "/get_user"
	});
	return ScoreModel;
})