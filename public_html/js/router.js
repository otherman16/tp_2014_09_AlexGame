define([
    // Libs
    'backbone',
    // Views
    'main_view',
    'login_view',
    'registration_view',
    'game_view',
    'scoreboard_view',
    'profile_view',
    'view_manager',
    "toolbar_view",
    // Model
    'user_model',
    'vertex_app',
], function(Backbone, MainView, LoginView, RegistrationView, 
                    GameView, ScoreboardView, ProfileView, ViewManager, ToolbarView, UserModel, VertexApp) {
    var Router = Backbone.Router.extend({
        routes: {
            'scoreboard': 'scoreboardAction',
            'game': 'gameAction',
            'login': 'loginAction',
            'registration': 'registrationAction',
            'profile' : 'profileAction',
            '': 'mainAction',
        },
        mainAction: function () {
            if (!this.mainView) {
                this.mainView = new MainView({model:this.model});
                this.viewManager.addView(this.mainView)
            }
            this.mainView.show();
        },
        gameAction: function () {
            if (!this.gameView) {
                this.gameView = new GameView({model:this.model});
                this.viewManager.addView(this.gameView)
                //this.VertexApp = new VertexApp({model:this.model});
            }
            this.gameView.show();
        },
        loginAction: function () {
            if (!this.loginView) {
                this.loginView = new LoginView({model:this.model});
                this.viewManager.addView(this.loginView)
            }
            this.loginView.show();
        },
        registrationAction: function () {
            if (!this.registrationView) {
                this.registrationView = new RegistrationView({model:this.model});
                this.viewManager.addView(this.registrationView)
            }
            this.registrationView.show();
        },
        scoreboardAction: function () {
            if (!this.scoreboardView) {
                this.scoreboardView = new ScoreboardView({model:this.model});
                this.viewManager.addView(this.scoreboardView)
            }
            this.scoreboardView.show();
        },
        profileAction: function() {
            if (!this.profileView) {
                this.profileView = new ProfileView({model:this.model});
                this.viewManager.addView(this.profileView)
            }
            this.profileView.show();
        },
        initialize: function() {
            this.viewManager = new ViewManager();
            this.model = new UserModel();
            this.toolbarView = new ToolbarView({model:this.model});
        }
    });
    return new Router();
})