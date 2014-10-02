define([
	// Libs
	'backbone'
], function(Backbone) {
	var UserModel = Backbone.Model.extend({
		defaults: {
			id: 0,
			login: "",
			email: "",
			score: 0
		},
		url: "/get_user",
		isLogin: function() {
			return (this.id > 0);
		}
	});
	return UserModel;
})