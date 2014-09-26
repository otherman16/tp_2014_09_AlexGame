requirejs.config({
    baseUrl: '/js',
    paths:{
        // Libs
        "jquery" : "lib/jquery",
        "backbone" : "lib/backbone",
        "underscore" : "lib/underscore",
        "my_ajax" : "lib/my_ajax",
        // Templates
        "alert_tmpl" : "tmpl/alert_tmpl",
        "game_tmpl" : "tmpl/game_tmpl",
        "login_tmpl" : "tmpl/login_tmpl",
        "main_tmpl" : "tmpl/main_tmpl",
        "registration_tmpl" : "tmpl/registration_tmpl",
        "scoreboard_tmpl" : "tmpl/scoreboard_tmpl",
        "toolbar_tmpl" : "tmpl/toolbar_tmpl",
        // Router
        "router" : "router",
        // Views
        "main_view" : "views/main_view",
        "game_view" : "views/game_view",
        "login_view" : "views/login_view",
        "scoreboard_view" : "views/scoreboard_view",
        "registration_view" : "views/registration_view",
        "toolbar_view" : "views/toolbar_view",
        // Models
        "score_model" : "models/score_model",
        "user_model" : "models/user_model",
        // Collections
        "score_collection" : "collections/score_collection",
    },
    shim: {
        'backbone' : {
            deps: ['jquery', 'underscore'],
            exports: 'Backbone'
        },
        'jquery' : {
            exports: '$'
        },
        'underscore' : {
            deps: ['jquery'],
            exports: '_'
        }
    }
});

requirejs([
    // Libs
    'jquery',
    'backbone',
    'underscore',
    // Deps
    'router'
], function($, Backbone, _, Router) {
    new Router();
    Backbone.history.start();
})