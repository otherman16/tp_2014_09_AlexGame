define([
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Tmpl
	'game_tmpl',
	// Models
	'user_model',
	'vertex_app',
	'vertex_controller'
], function($, Backbone, logout, game_tmpl, UserModel, VertexApp, VertexController) {

	var GameView = Backbone.View.extend({
	    //vertexApp : VertexApp,
		template: game_tmpl,
		el: $('.screen__game'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},
		show_game: function() {
        	this.VertexApp = new VertexApp();
		},
		show: function() {
			if( this.model.isLogin() ) {
				this.$el.delay(300).fadeIn(300);
			}
			else{
				window.location.hash = "";
			}
			this.show_game();
		},
		hide: function() {
			this.$el.fadeOut(300);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		},
		events: {
			"click .screen__toolbar__logout" : "logout",
		},
		logout: function(event) {
			logout(event);
		}
	});
	return GameView;
})