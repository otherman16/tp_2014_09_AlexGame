define([
	// Libs
	'backbone'
], function(Backbone) {
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