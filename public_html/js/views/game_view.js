define([
	// Libs
	'jquery',
	'backbone',
	// Tmpl
	'game_tmpl',
	// Models
	'user_model',
	'vertex_app',
	'vertex_controller'
], function($, Backbone, game_tmpl, UserModel, VertexApp, VertexController) {

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
				this.trigger("showView",[ this ]);
				this.$el.delay(200).fadeIn(200);
			}
			else{
				window.location.hash = "";
			}
			this.show_game();
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