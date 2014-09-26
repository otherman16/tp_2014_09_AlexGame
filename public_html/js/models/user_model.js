define([
	// Libs
	'jquery',
	'backbone',
	'underscore',
	// Deps
], function($, Backbone, _) {
	var UserModel = Backbone.Model.extend({
		defaults: {
			id: "",
			login: "",
			email: "",
			score: ""
		},
		url: "/get_user"
	});
	return UserModel;
})