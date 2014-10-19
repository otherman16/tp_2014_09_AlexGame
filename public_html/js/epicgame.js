requirejs.config({
    baseUrl: '/js',
    paths:{
        // Libs
        "jquery" : "lib/jquery",
        "backbone" : "lib/backbone",
        "underscore" : "lib/underscore",
        "kinetic" : "lib/kinetic",
        "backbone.kineticview.js" : "lib/backbone.kineticview.js",
        "my_ajax" : "lib/my_ajax",
        "logout" : "lib/logout",
        "validate" : "lib/validate",
        "jquery.validate" : "lib/jquery.validate",
        // Templates
        "game_tmpl" : "tmpl/game_tmpl",
        "login_tmpl" : "tmpl/login_tmpl",
        "main_user_tmpl" : "tmpl/main_user_tmpl",
        "main_guest_tmpl" : "tmpl/main_guest_tmpl",
        "registration_tmpl" : "tmpl/registration_tmpl",
        "scoreboard_tmpl" : "tmpl/scoreboard_tmpl",
        "profile_tmpl" : "tmpl/profile_tmpl",
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
        // Models
        "score_model" : "models/score_model",
        "user_model" : "models/user_model",
        "vertex_model" : "models/vertex_model",
        // Collections
        "score_collection" : "collections/score_collection",
        "vertex_collection" : "collections/vertex_collection",
        // Game_mechanics
        "vertex_controller" : "mechanics/vertex_controller",
        "vertex_view" : "mechanics/vertex_view",
        "vertex_app" : "mechanics/vertex_app",
        "kinetic_example" : "mechanics/kinetic_example",
    },
    shim: {
        'backbone' : {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'underscore' : {
            deps: ['jquery'],
            exports: '_'
        },
        'jquery.validate' : {
            deps: ['jquery'],
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