define([
	// Libs
	'jquery',
	'backbone',
	'logout',
	// Tmpl
	'game_tmpl',
	// Models
	'user_model'
], function($, Backbone, logout, game_tmpl, UserModel) {

	var GameView = Backbone.View.extend({
		template: game_tmpl,
		el: $('.screen__game'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},
		show_game: function() {
		    // просто красный прямоугольник
		    this.c = document.getElementById("myCanvas");
        	console.log(this.c);
        	this.ctx = this.c.getContext("2d");
        	this.ctx.fillStyle = "#FF0000";
        	this.ctx.fillRect(100,200,150,75);
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
			"click .screen__toolbar__logout" : "logout"
		},
		logout: function(event) {
			logout(event);
		}
	});
	return GameView;
})