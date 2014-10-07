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
    // Model
    'user_model',
], function(Backbone, MainView, LoginView, RegistrationView, 
                    GameView, ScoreboardView, ProfileView, UserModel) {
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
            this.hideAll("mainAction");
            if (!this.mainView) {
                this.mainView = new MainView({model:this.model});
            }
            this.mainView.show();
        },
        gameAction: function () {
            this.hideAll("gameAction");
            if (!this.gameView) {
                this.gameView = new GameView({model:this.model});
            }
            this.gameView.show();
        },
        loginAction: function () {
            this.hideAll("loginAction");
            if (!this.loginView) {
                this.loginView = new LoginView({model:this.model});
            }
            this.loginView.show();
        },
        registrationAction: function () {
            this.hideAll("registrationAction");
            if (!this.registrationView) {
                this.registrationView = new RegistrationView({model:this.model});
            }
            this.registrationView.show();
        },
        scoreboardAction: function () {
            this.hideAll("scoreboardAction");
            if (!this.scoreboardView) {
                this.scoreboardView = new ScoreboardView({model:this.model});
            }
            this.scoreboardView.show();
        },
        profileAction: function() {
            this.hideAll("profileAction");
            if (!this.profileView) {
                this.profileView = new ProfileView({model:this.model});
            }
            this.profileView.show();
        },
        initialize: function() {
            this.model = new UserModel();
            this.on("route", function() {
                this.model.fetch();
            });
        },
        hideAll: function(route) {
            if (this.gameView && route != "gameAction") {
                this.gameView.hide();
            }
            if (this.scoreboardView && route != "scoreboardAction") {
                this.scoreboardView.hide();
            }
            if (this.loginView && route != "loginAction") {
                this.loginView.hide();
            }
            if (this.registrationView && route != "registrationAction") {
                this.registrationView.hide();
            }
            if (this.profileView && route != "profileAction") {
                this.profileView.hide();
            }
            if (this.mainView && route != "mainAction") {
                this.mainView.hide();
            }
        }
    });
    return new Router();
})