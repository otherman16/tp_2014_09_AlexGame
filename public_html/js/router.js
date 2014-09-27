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
    'toolbar_view',
    'user_model',
], function(Backbone, MainView, LoginView, RegistrationView, GameView, ScoreboardView, ProfileView, ToolbarView, UserModel) {
    var Router = Backbone.Router.extend({
        routes: {
            'scoreboard': 'scoreboardAction',
            'game': 'gameAction',
            'login': 'loginAction',
            'registration': 'registrationAction',
            'profile' : 'profileAction',
            '': 'mainActions',
            // '*defaults': 'mainActions'
        },
        mainActions: function () {
            this.hideAll();
            this.forAll();
            this.mainView.show();
        },
        gameAction: function () {
            this.hideAll();
            this.forAll();
            this.gameView.show();
        },
        loginAction: function () {
            this.hideAll();
            this.forAll();
            this.loginView.show();
        },
        registrationAction: function () {
            this.hideAll();
            this.forAll();
            this.registrationView.show();
        },
        scoreboardAction: function () {
            this.hideAll();
            this.forAll();
            this.scoreboardView.show();
        },
        profileAction: function() {
            this.hideAll();
            this.forAll();
            this.profileView.show();
        },
        initialize: function() {
            this.userModel = new UserModel();
            this.mainView = new MainView({model:this.userModel});
            this.gameView = new GameView({model:this.userModel});
            this.loginView = new LoginView({model:this.userModel});
            this.registrationView = new RegistrationView({model:this.userModel});
            this.scoreboardView = new ScoreboardView({model:this.userModel});
            this.profileView = new ProfileView({model:this.userModel});
            this.toolbarView = new ToolbarView({model:this.userModel});
        },
        hideAll: function() {
            this.gameView.hide();
            this.scoreboardView.hide();
            this.loginView.hide();
            this.registrationView.hide();
            this.profileView.hide();
            this.mainView.hide();
        },
        forAll: function() {
            this.userModel.fetch();
        }
    });
    return new Router();
})