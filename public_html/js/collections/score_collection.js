define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps,
	'score_model',
], function($, Backbone, _, ScoreModel) {
	var ScoreCollection = Backbone.Collection.extend({
		model: ScoreModel
	})
	return ScoreCollection;
})