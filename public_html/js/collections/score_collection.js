define([
	// Libs
	'backbone',
	// Deps,
	'score_model',
], function(Backbone, ScoreModel) {
	var ScoreCollection = Backbone.Collection.extend({
		model: ScoreModel
	})
	return ScoreCollection;
})