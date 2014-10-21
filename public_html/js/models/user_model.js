define([
	// Libs
	'backbone'
], function(Backbone) {
	var UserModel = Backbone.Model.extend({
		defaults: {
			id: 0,
			login: "Guest",
			email: "Guest",
			score: 0
		},
		url: "/get_user",
		isLogin: function() {
			return (this.id > 0);
		},
		resetModel: function() {
			this.set({"id":0,"email":"Guest","score":0,"login":"Guest"});
		},
		initialize: function() {
			this.fetch();
		}
	});
	return UserModel;
})