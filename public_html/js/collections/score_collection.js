define([
	// Libs
	'backbone',
	// Models
	'score_model',
], function(Backbone, ScoreModel) {
	var ScoreCollection = Backbone.Collection.extend({
		model: ScoreModel,
		url: "/get_scores"
	})
	return ScoreCollection;
})