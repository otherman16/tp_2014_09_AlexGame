define([
	// Libs
	'jquery',
	'backbone',
	// Tmpl
	'game_tmpl',
	// Models
	'user_model',
	'vertex_app',
], function($, Backbone, game_tmpl, UserModel, VertexApp ) {

	var GameView = Backbone.View.extend({
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