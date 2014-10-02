define([
    // Libs
    // 'backbone',
    // Views
    'main_view',
    'login_view',
    'registration_view',
    'game_view',
    'scoreboard_view',
    'profile_view',
], function(MainView, LoginView, RegistrationView, 
                    GameView, ScoreboardView, ProfileView) {
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
            this.mainView = new MainView();
            this.gameView = new GameView();
            this.loginView = new LoginView();
            this.registrationView = new RegistrationView();
            this.scoreboardView = new ScoreboardView();
            this.profileView = new ProfileView();
        },
        hideAll: function() {
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