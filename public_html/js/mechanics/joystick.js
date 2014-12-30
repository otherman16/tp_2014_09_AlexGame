define([
    // Libs
    'jquery',
    'backbone',
    'phoria',
    'bat_model',
    'puck_model',
    'user_model',
], function($, Backbone, P, BatModel, PuckModel, UserModel){
    var joystickView = Backbone.View.extend({
        initialize: function() {
            var Email;
            var socket = new WebSocket("ws://" + location.host + "/gameSocket");

            socket.onopen = function () {
                alert("Соединение установлено.");
            };

            socket.onclose = function (event) {
                if (event.wasClean) {
                    alert('Соединение закрыто чисто');
                } else {
                    alert('Обрыв соединения'); // например, "убит" процесс сервера
                }
                alert('Код: ' + event.code + ' причина: ' + event.reason);
                window.removeEventListener('deviceorientation', handleOrientation);
            };

            socket.onmessage = function (event) {
                var data = JSON.parse(event.data);
                console.log(data);
                if(data.code == "new_email") {
                    Email = data.new_email;
                    window.addEventListener('deviceorientation', handleOrientation);
                }
                alert("Получены данные " + event.data);
            };

            socket.onerror = function (error) {
                alert("Ошибка " + error.message);
            };
            var i = 0;
            // посмотрим что сейчас получается без setInterval
            function handleOrientation(event) {

                var x = -event.beta / 50;  // In degree in the range [-180,180]
                var y = -event.gamma / 50; // In degree in the range [-90,90]

                if (i % 100 == 0) {
                    console.log("x " + x);
                    console.log("y " + y);
                }

                var data = JSON.stringify({code: 0, email: Email, dnextX: x, dnextY: y});
                socket.send(data);
            }

             // Send message to chat server
             $('form').submit(function() {
                var data = JSON.stringify({code: -1, token : $('form').find('input[name="token"]').val()});
                socket.send( data );
                console.log( $('form').find('input[name="token"]').val() );
                return false;
             });
        }
    });
    return joystickView;
});

