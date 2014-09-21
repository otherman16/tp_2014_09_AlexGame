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
    'scoreboard_view'
], function($, Backbone, _, MainView, LoginView, RegistrationView, GameView, ScoreboardView) {
    var Router = Backbone.Router.extend({
        routes: {
            'scoreboard': 'scoreboardAction',
            'game': 'gameAction',
            'login': 'loginAction',
            'registration': 'registrationAction',
            '*default': 'mainActions'
        },
        mainAction: function () {
            var mainView = new MainView();
            mainView.render();
        },
        gameAction: function () {
            var gameView = new GameView();
            gameView.render();
        },
        loginAction: function () {
            var loginView = new LoginView();
            loginView.render();
        },
        registrationAction: function () {
            var registrationView = new RegistrationView();
            registrationView.render();
        },
        scoreboardAction: function () {
            var scoreboardView = new ScoreboardView();
            scoreboardView.render();
        },
        initialize: function() {
            var mainView = new MainView();
            mainView.render();
        }
    });
    return Router;
})