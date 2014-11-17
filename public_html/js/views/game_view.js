define([
	// Libs
	'jquery',
	'backbone',
	// Tmpl
	'game_tmpl',
	// Models
	'user_model',
	'air_hockey_app',
], function($, Backbone, game_tmpl, UserModel, AirHockeyApp ) {

	var GameView = Backbone.View.extend({
		template: game_tmpl,
		el: $('.screen__game'),
		render: function() {
			this.$el.html(this.template(this.model.toJSON()));
		},
		show_game: function() {
            console.log("game start");
        	this.AirHockeyApp = new AirHockeyApp();
		},
		show: function() {
			if( this.model.isLogin() ) {
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
                this.show_game();
			}
			else{
				window.location.hash = "";
			}
		},
		hide: function() {
			this.$el.fadeOut(200);
		},
		initialize: function() {
			this.listenTo(this.model,'change', this.render);
			this.render();
		}
	});
	return GameView;
})