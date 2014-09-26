define([
    // Libs
    'jquery',
    'backbone',
    'underscore',
    // Deps
    'main_view',
    'login_view',
    'registration_view',
    'game_view',
    'scoreboard_view',
], function($, Backbone, _, MainView, LoginView, RegistrationView, GameView, ScoreboardView) {
    var Router = Backbone.Router.extend({
        routes: {
            'scoreboard': 'scoreboardAction',
            'game': 'gameAction',
            'login': 'loginAction',
            'registration': 'registrationAction',
            '': 'mainActions',
            '*defaults': 'mainActions'
        },
        mainAction: function () {
            var mainView = new MainView();
            mainView.show();
        },
        gameAction: function () {
            var gameView = new GameView();
            gameView.show();
        },
        loginAction: function () {
            var loginView = new LoginView();
            loginView.show();
        },
        registrationAction: function () {
            var registrationView = new RegistrationView();
            registrationView.show();
        },
        scoreboardAction: function () {
            var scoreboardView = new ScoreboardView();
            scoreboardView.show();
        },
        initialize: function() {
            var mainView = new MainView();
            mainView.show();
        }
    });
    return Router;
})