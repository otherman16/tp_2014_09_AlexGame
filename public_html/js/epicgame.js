requirejs.config({
    baseUrl: '/js',
    paths:{
        // Libs
        "jquery" : "lib/jquery",
        "backbone" : "lib/backbone",
        "underscore" : "lib/underscore",
        "logout" : "lib/logout",
        "validate" : "lib/validate",
        "jquery.validate" : "lib/jquery.validate",
        // Libs for mechanics
        "phoria" : "lib/mechanics/phoria",
        "dat.gui" : "lib/mechanics/dat.gui.min",
        "gl.matrix" : "lib/mechanics/gl.matrix",
        // Templates/**
        "game_tmpl" : "tmpl/game_tmpl",
        "login_tmpl" : "tmpl/login_tmpl",
        "joystick_tmpl" : "tmpl/joystick_tmpl",
        "main_user_tmpl" : "tmpl/main_user_tmpl",
        "main_guest_tmpl" : "tmpl/main_guest_tmpl",
        "registration_tmpl" : "tmpl/registration_tmpl",
        "scoreboard_tmpl" : "tmpl/scoreboard_tmpl",
        "profile_tmpl" : "tmpl/profile_tmpl",
        "toolbar_user_tmpl" : "tmpl/toolbar_user_tmpl",
        "toolbar_guest_tmpl" : "tmpl/toolbar_guest_tmpl",
        // Router
        "router" : "router",
        // Views
        "main_view" : "views/main_view",
        "game_view" : "views/game_view",
        "login_view" : "views/login_view",
        "scoreboard_view" : "views/scoreboard_view",
        "registration_view" : "views/registration_view",
        "profile_view" : "views/profile_view",
        "alert_view" : "views/alert_view",
        "view_manager" : "views/view_manager",
        "toolbar_view" : "views/toolbar_view",
        "canvas_view" : "views/canvas_view",
        "joystick_view" : "views/joystick_view",
        // Models
        "score_model" : "models/score_model",
        "user_model" : "models/user_model",
        "bat_model" : "models/bat_model",
        'puck_model' : "models/puck_model",
        // Collections
        "score_collection" : "collections/score_collection",
        "vertex_collection" : "collections/vertex_collection",
        // Game_mechanics
        "air_hockey_app" : "mechanics/air_hockey_app",
        "joystick" : "mechanics/joystick"
    },
    shim: {
        'jquery': {
            exports: '$'
        },
        'backbone' : {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'underscore' : {
            deps: ['jquery'],
            exports: '_'
        },
        'jquery.validate' : {
            deps: ['jquery']
        },
        'phoria' : {
            deps: ['gl.matrix', 'dat.gui'],
            exports: 'Phoria'
        }
    }
});

requirejs([
    // Libs
    'backbone',
    // Deps
    'router'
], function(Backbone, Router) {
    Backbone.history.start();
})