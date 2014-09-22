requirejs.config({
    baseUrl: '/js',
    paths:{
        "jquery" : "lib/jquery",
        "backbone" : "lib/backbone",
        "my_ajax" : "lib/my_ajax",
        "underscore" : "lib/underscore",
        "alert_tmpl" : "tmpl/alert_tmpl",
        "game_tmpl" : "tmpl/game_tmpl",
        "login_tmpl" : "tmpl/login_tmpl",
        "main_tmpl" : "tmpl/main_tmpl",
        "registration_tmpl" : "tmpl/registration_tmpl",
        "scoreboard_tmpl" : "tmpl/scoreboard_tmpl",
        "router" : "router",
        "main_view" : "views/main_view",
        "game_view" : "views/game_view",
        "login_view" : "views/login_view",
        "scoreboard_view" : "views/scoreboard_view",
        "registration_view" : "views/registration_view",
        "score_model" : "models/score_model",
        "score_collection" : "collections/score_collection",
        "score_view" : "views/score_view"
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
    // var $page = $('#page');

    // function showScoreboardScreen() {
    //     hideMainScreen();
    //     $page.html(scoreboardTmpl());
    //     $page.find('.js-back').on('click', hideScoreboardScreen);
    // }
    // function hideScoreboardScreen() {
    //     $page.find('.js-back').off('click', hideScoreboardScreen);
    //     showMainScreen();
    // }

    // function showGameScreen() {
    //     hideMainScreen();
    //     $page.html(gameTmpl());
    //     $page.find('.js-back').on('click', hideGameScreen);
    // }
    // function hideGameScreen() {
    //     $page.find('.js-back').off('click', hideGameScreen);
    //     showMainScreen();
    // }

    // function showLoginScreen() {
    //     hideMainScreen();
    //     $page.html(loginTmpl());
    //     $page.find('.js-back').on('click', hideLoginScreen);
    //     $page.find('form').submit(my_ajax);
    // }
    // function hideLoginScreen() {
    //     $page.find('.js-back').off('click', hideLoginScreen);
    //     showMainScreen();
    // }

    // function showMainScreen() {
    //     $page.html(mainTmpl());
    //     $page.find('.js-scoreboard').on('click', showScoreboardScreen);
    //     $page.find('.js-login').on('click', showLoginScreen);
    //     $page.find('.js-start_game').on('click', showGameScreen);
    //     $page.find('.js-registration').on('click', showRegistrationScreen);
    // }
    // function hideMainScreen() {
    //     $page.find('.js-scoreboard').off('click', showScoreboardScreen);
    //     $page.find('.js-login').off('click', showLoginScreen);
    //     $page.find('.js-start_game').off('click', showGameScreen);
    //     $page.find('.js-registration').off('click', showRegistrationScreen);
    // }

    // function showRegistrationScreen() {
    //     hideMainScreen();
    //     $page.html(registrationTmpl());
    //     $page.find('.js-back').on('click', hideRegistrationScreen);
    //     $page.find('form').submit(my_ajax);
    // }
    // function hideRegistrationScreen() {
    //     $page.find('.js-back').off('click', hideRegistrationScreen);
    //     showMainScreen();
    // }

    // showMainScreen();
})

    // var $page = $('#page');

    // function showScoreboardScreen() {
    //     hideMainScreen();
    //     $page.html(scoreboardTmpl());
    //     $page.find('.js-back').on('click', hideScoreboardScreen);
    // }
    // function hideScoreboardScreen() {
    //     $page.find('.js-back').off('click', hideScoreboardScreen);
    //     showMainScreen();
    // }

    // function showGameScreen() {
    //     hideMainScreen();
    //     $page.html(gameTmpl());
    //     $page.find('.js-back').on('click', hideGameScreen);
    // }
    // function hideGameScreen() {
    //     $page.find('.js-back').off('click', hideGameScreen);
    //     showMainScreen();
    // }

    // function showLoginScreen() {
    //     hideMainScreen();
    //     $page.html(loginTmpl());
    //     $page.find('.js-back').on('click', hideLoginScreen);

    //     $page.find('form').submit(function(){
    //         $page.find('.alert').remove();

    //         var data = {};
    //         $.each(this.elements, function(field_count, field){
    //             data[$(field).attr("name")] = $(field).val();
    //             delete data["undefined"];
    //         });

    //         $.ajax({
    //             url: $(this).attr('action'),
    //             dataType: "application/json",
    //             data: JSON.stringify(data),
    //             type: $(this).attr('method'),
    //             success: function(response) {
    //                 $page.append(alertTmpl);
    //                 $page.find('.alert span').text("Success");
    //                 $page.find('.alert').slideDown().delay(1000).slideUp();
    //             },
    //             error: function(response) {
    //                 $page.append(alertTmpl);
    //                 $page.find('.alert span').text("Error");
    //                 $page.find('.alert').slideDown().delay(1000).slideUp();
    //             }
    //         })
    //         return false;
    //     });
    // }
    // function hideLoginScreen() {
    //     $page.find('.js-back').off('click', hideLoginScreen);
    //     showMainScreen();
    // }

    // function showMainScreen() {
    //     $page.html(mainTmpl());
    //     $page.find('.js-scoreboard').on('click', showScoreboardScreen);
    //     $page.find('.js-login').on('click', showLoginScreen);
    //     $page.find('.js-start_game').on('click', showGameScreen);
    //     $page.find('.js-registration').on('click', showRegistrationScreen);
    // }
    // function hideMainScreen() {
    //     $page.find('.js-scoreboard').off('click', showScoreboardScreen);
    //     $page.find('.js-login').off('click', showLoginScreen);
    //     $page.find('.js-start_game').off('click', showGameScreen);
    //     $page.find('.js-registration').off('click', showRegistrationScreen);
    // }

    // function showRegistrationScreen() {
    //     hideMainScreen();
    //     $page.html(registrationTmpl());
    //     $page.find('.js-back').on('click', hideRegistrationScreen);

    //     $page.find('form').submit(function(){
    //         $page.find('.alert').remove();

    //         var data = {};
    //         $.each(this.elements, function(field_count, field){
    //             data[$(field).attr("name")] = $(field).val();
    //             delete data["undefined"];
    //         });

    //         $.ajax({
    //             url: $(this).attr('action'),
    //             dataType: "application/json",
    //             data: JSON.stringify(data),
    //             type: $(this).attr('method'),
    //             success: function(response) {
    //                 $page.append(alertTmpl);
    //                 $page.find('.alert span').text("Success");
    //                 $page.find('.alert').slideDown().delay(1000).slideUp();
    //             },
    //             error: function(response) {
    //                 $page.append(alertTmpl);
    //                 $page.find('.alert span').text("Error");
    //                 $page.find('.alert').slideDown().delay(1000).slideUp();
    //             }
    //         })
    //         return false;
    //     });
    // }
    // function hideRegistrationScreen() {
    //     $page.find('.js-back').off('click', hideRegistrationScreen);
    //     showMainScreen();
    // }

    // showMainScreen();        