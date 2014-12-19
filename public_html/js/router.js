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
    'toolbar_view',
    'canvas_view',
    'joystick_view',
    // Model
    'user_model',
], function(Backbone, MainView, LoginView, RegistrationView, 
                    GameView, ScoreboardView, ProfileView, ViewManager, ToolbarView, CanvasView, JoystickView,
                    UserModel) {
    var Router = Backbone.Router.extend({
        routes: {
            'scoreboard': 'scoreboardAction',
            'game': 'gameAction',
            'login': 'loginAction',
            'registration': 'registrationAction',
            'profile' : 'profileAction',
            'canvas' : 'canvasAction',
            'joystick' : 'joystickAction',
            '': 'mainAction'
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
        canvasAction: function() {
            if (!this.canvasView) {
                this.canvasView = new CanvasView();
                this.viewManager.addView(this.canvasView)
            }
            this.canvasView.show();
        },
        joystickAction: function () {
            if (!this.joystickView) {
                this.joystickView = new JoystickView({model:this.model});
                this.viewManager.addView(this.joystickView)
            }
            this.joystickView.show();
        },
        initialize: function() {
            this.viewManager = new ViewManager();
            this.model = new UserModel();
            this.toolbarView = new ToolbarView({model:this.model});
        }
    });
    return new Router();
})