define([
    // Libs
    'backbone',
    // Deps
    'main_view',
    'login_view',
    'registration_view',
    'game_view',
    'scoreboard_view',
    'profile_view',
    // Models
    'user_model',
], function(Backbone, MainView, LoginView, RegistrationView, GameView, ScoreboardView, ProfileView, UserModel) {
    var Router = Backbone.Router.extend({
        routes: {
            'scoreboard': 'scoreboardAction',
            'game': 'gameAction',
            'login': 'loginAction',
            'registration': 'registrationAction',
            'profile' : 'profileAction',
            '': 'mainActions',
        },
        mainActions: function () {
            this.hideAll();
            this.mainView.show();
        },
        gameAction: function () {
            this.hideAll();
            this.gameView.show();
        },
        loginAction: function () {
            this.hideAll();
            this.loginView.show();
        },
        registrationAction: function () {
            this.hideAll();
            this.registrationView.show();
        },
        scoreboardAction: function () {
            this.hideAll();
            this.scoreboardView.show();
        },
        profileAction: function() {
            this.hideAll();
            this.profileView.show();
        },
        initialize: function() {
            this.model = new UserModel();
            this.mainView = new MainView({model: this.model});
            this.gameView = new GameView({model: this.model});
            this.loginView = new LoginView({model: this.model});
            this.registrationView = new RegistrationView({model: this.model});
            this.scoreboardView = new ScoreboardView({model: this.model});
            this.profileView = new ProfileView({model: this.model});
        },
        hideAll: function() {
            this.model.fetch();
            this.gameView.hide();
            this.scoreboardView.hide();
            this.loginView.hide();
            this.registrationView.hide();
            this.profileView.hide();
            this.mainView.hide();
        }
    });
    return new Router();
})