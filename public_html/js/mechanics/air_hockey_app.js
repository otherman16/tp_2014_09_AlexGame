define([
    // Libs
    'jquery',
    'backbone',
    'phoria',
    'bat_model',
    'puck_model',
    'user_model',
], function($, Backbone, P, BatModel, PuckModel, UserModel){
    var AirHockeyApp = Backbone.View.extend({
        el: $('.screen__game'),
        initialize: function() {

            var requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame || window.msRequestAnimationFrame ||
                function(c) {window.setTimeout(c, 15)};

            var keyPressList = [];

            var net = {
                x : 8,
                y : 8,
                c : 0,
                length : 20
            };

            var block1 = {
                x : net.length/40,
                y : net.length/40,
                z : net.length
            };

            var block2 = {
                x : net.length/4,
                y : net.length/40,
                z : net.length/40
            };

            var border = function(b) {
                return Phoria.Entity.create({
                    points: [   {x:0,y:0,z:0},
                        {x:b.x, y:0, z:0},
                        {x:0, y: 0, z:b.z},
                        {x:b.x, y: 0, z:b.z},
                        {x:0,y:b.y,z:0},
                        {x:b.x, y:b.y, z:0},
                        {x:0, y:b.y, z:b.z},
                        {x:b.x, y:b.y, z:b.z}
                    ],
                    polygons: [
                        {vertices:[1,0,4,5]},
                        {vertices:[0,2,6,4]},
                        {vertices:[1,5,7,3]},
                        {vertices:[2,6,7,3]},
                        {vertices:[5,4,6,7]},
                        {vertices:[1,0,2,3]},
                    ],
                    style: {
                        drawmode: "solid",
                        fillmode: "fill",
                        linewidth: 1.0,
                        color : [87,20,13]
                    }
                });
            };
            var border1 = border(block1);
            var border2 = border(block1);
            var border5 = border(block2);
            var border6 = border(block2);
            var border7 = border(block2);
            var border8 = border(block2);

            border1.translateZ(-net.length/2).translateX(-net.length/2-block1.x);
            border2.translateX(net.length/2).translateZ(-net.length/2);
            border5.translateX(net.length/2-block2.x+block1.x).translateZ(net.length/2);
            border6.translateX(net.length/2-block2.x+block1.x).translateZ(-net.length/2-block2.z);
            border7.translateX(-net.length/2-block1.x).translateZ(net.length/2);
            border8.translateX(-net.length/2-block1.x).translateZ(-net.length/2-block2.z);

            var light1 = Phoria.PointLight.create({
                position: {x:7.5, y:10, z:-7.5},
                intensity: 5,
                attenuation: 2,
                attenuationFactor: "squared",
                color: [255, 255, 255]
            });
            var light2 = Phoria.PointLight.create({
                position: {x:7.5, y:10, z:7.5},
                intensity: 5,
                attenuation: 2,
                attenuationFactor: "squared",
                color: [255, 255, 255]
            });
            var light3 = Phoria.PointLight.create({
                position: {x:-7.5, y:10, z:7.5},
                intensity: 5,
                attenuation: 2,
                attenuationFactor: "squared",
                color: [255, 255, 255]
            });
            var light4 = Phoria.PointLight.create({
                position: {x:-7.5, y:10, z:-7.5},
                intensity: 5,
                attenuation: 2,
                attenuationFactor: "squared",
                color: [255, 255, 255]
            });

            var send_message_enemy_score = function() {
                var data = JSON.stringify({code: 3});
                ws.send(data);
            };

            var score = 0;

            var local_storage = function () {
                localStorage.setItem('score', myBat.score);
            };

            var send_message_puck = function( dnextX, dnextY, velocityX, velocityY, speed, angle) {
                var data = JSON.stringify({code: 1, dnextX: dnextX, dnextY: dnextY,velocityX:velocityX,
                    velocityY: velocityY, speed: speed, angle : angle});
                ws.send(data);
            };

            var send_message_position_enemy_bat = function (dnextX, dnextY) {
                var data = JSON.stringify({code: 2, dnextX: dnextX, dnextY: dnextY});
                ws.send(data);
            };

             var sendStartBatPosition = function () {
                var data = JSON.stringify({code: 5, dnextX: myBat.x, dnextY: myBat.y});
                console.log(data);
                ws.send(data);
             }

            if ( !this.ws) {
                var ws = new WebSocket("ws://localhost:8096/gameSocket");
            }
            var canvas = document.getElementById('myCanvas');
            var scene = new P.Scene();
            this.setScene(scene, canvas);

            var renderer = new P.CanvasRenderer(canvas);

            // add a grid to help visualise camera position etc.
            var plane = P.Util.generateTesselatedPlane(net.x,net.y,0,net.length);
            scene.graph.push(Phoria.Entity.create({
                points: plane.points,
                edges: plane.edges,
                polygons: plane.polygons,
                style: {
                    drawmode: "solid",
                    shademode: "plain",
                    linewidth: 0.5,
                    objectsortmode: "back",
                    color : [200,200,200]
                }
            }));

            var myBat = new BatModel();
            var enemyBat = new BatModel();
            var puck = new PuckModel();
            myBat.initAsMy();
            enemyBat.initAsEnemy();
            scene.graph.push(new Phoria.DistantLight());
            scene.graph.push(myBat.Shape);
            scene.graph.push(enemyBat.Shape);
            scene.graph.push(puck.Shape);
            scene.graph.push(light1);
            scene.graph.push(light2);
            scene.graph.push(light3);
            scene.graph.push(light4);
            scene.graph.push(border1);
            scene.graph.push(border2);
            scene.graph.push(border5);
            scene.graph.push(border6);
            scene.graph.push(border7);
            scene.graph.push(border8);


            document.onkeydown = function(e){
                e = e?e:window.event;
                keyPressList[e.keyCode] = true;
            };

            document.onkeyup = function(e){
                e = e?e:window.event;
                keyPressList[e.keyCode] = false;
            };

           var keyPressListHandler = function() {
               handler:
               {
                    if (keyPressList[37]) {
                        if (keyPressList[38]) {
                            myBat.left_top();
                            break handler;
                        }
                        if (keyPressList[40]) {
                            myBat.left_bottom();
                            break handler;
                        }
                        myBat.left();
                    }
                    if (keyPressList[39]) {
                        if (keyPressList[38]) {
                            myBat.right_top();
                            break handler;
                        }
                        if (keyPressList[40]) {
                            myBat.right_bottom();
                            break handler;
                        }
                        myBat.right();
                    }
                   if (keyPressList[38]) {
                       myBat.top();
                   }
                   if (keyPressList[40]) {
                       myBat.bottom();
                   }
               }
            };



           var setStartParameters = function(code, speed) {
               // если второй соперник, то разворачиваем для него угол направление движения шайбы на 180 градусов
               puck.speed = speed;
               if (code == 2) {
                   puck.angle += 180;
               }
               puck.update();
               puck.start = true;
           };

            var EnemyPositionHandler = function (dnextX, dnextY) {
                //console.log(dnextX);
                //console.log(dnextY);
                enemyBat.dnextX = -dnextX;
                enemyBat.dnextY = -dnextY;
                enemyBat.render();
            };

            var setStartPosition = function (_x, _y ) {
                console.log("setStartposition" + " x" + _x + " y " + _y);
                enemyBat.dnextX = enemyBat.x - _x;
                //enemyBat.dnextY = (enemyBat.y + _y);
                console.log(enemyBat.dnextX);
                console.log(enemyBat.dnextY);
                enemyBat.render();
            };

            var MyPositionHandler = function (dnextX, dnextY) {
                //console.log(velocityX);
                //console.log(velocityY);
                myBat.velocityX = -dnextX;
                myBat.velocityY = -dnextY;
                myBat.dnextX = -dnextX;
                myBat.dnextY = -dnextY;
                //send_message_position_enemy_bat(myBat.dnextX, myBat.dnextY);
                //myBat.render();
             };

            var kickHandler = function (dnextX, dnextY, velocityX, velocityY, speed, angle) {
                puck.dnextX += -dnextX;
                puck.dnextY += -dnextY;
                puck.velocityX += -velocityX;
                puck.velocityY += -velocityY;
                puck.speed = speed;
                puck.angle = 180 + angle;
            };

            var collide = function(myBat, puck) {
                if (hitTest(myBat, puck)) {

                    var dx = (myBat.x + myBat.dnextX) - (puck.x + puck.dnextX);
                    var dy = (myBat.y + myBat.dnextY) - (puck.y + puck.dnextY);

                    var collisionAngle = Math.atan2(dy, dx);
                    //console.log("X" + myBat.velocityX);
                    //console.log("Y" + myBat.velocityY)
                    var speed1 = Math.sqrt(myBat.velocityX * myBat.velocityX +
                        myBat.velocityY * myBat.velocityY);
                    var speed2 = Math.sqrt(puck.velocityX * puck.velocityX +
                        puck.velocityY * puck.velocityY);
                    var direction1 = Math.atan2(myBat.velocityY, myBat.velocityX);
                    var direction2 = Math.atan2(puck.velocityY, puck.velocityX);

                    var velocityx_1 = speed1 * Math.cos(direction1 - collisionAngle);
                    var velocityy_1 = speed1 * Math.sin(direction1 - collisionAngle);
                    var velocityx_2 = speed2 * Math.cos(direction2 - collisionAngle);
                    var velocityy_2 = speed2 * Math.sin(direction2 - collisionAngle);

                    var final_velocityx_1 = ((myBat.mass - puck.mass) * velocityx_1 +
                        (puck.mass + puck.mass) * velocityx_2)/(myBat.mass + puck.mass);
                    var final_velocityx_2 = ((myBat.mass + myBat.mass) * velocityx_1 +
                        (puck.mass - myBat.mass) * velocityx_2)/(myBat.mass + puck.mass);

                    var final_velocityy_1 = velocityy_1;
                    var final_velocityy_2 = velocityy_2;

                    myBat.velocityX = Math.cos(collisionAngle) * final_velocityx_1 +
                        Math.cos(collisionAngle + Math.PI/2) * final_velocityy_1;
                    myBat.velocityY = Math.sin(collisionAngle) * final_velocityx_1 +
                        Math.sin(collisionAngle + Math.PI/2) * final_velocityy_1;
                    puck.velocityX = Math.cos(collisionAngle) * final_velocityx_2 +
                        Math.cos(collisionAngle + Math.PI/2) * final_velocityy_2;
                    puck.velocityY = Math.sin(collisionAngle) * final_velocityx_2 +
                        Math.sin(collisionAngle + Math.PI/2) * final_velocityy_2;

                    puck.speed = Math.sqrt(puck.velocityX*puck.velocityX + puck.velocityY*puck.velocityY);
                    myBat.dnextX = (myBat.dnextX += myBat.velocityX);
                    myBat.dnextY = (myBat.dnextY += myBat.velocityY);
                    puck.dnextX = (puck.dnextX += puck.velocityX);
                    puck.dnextY = (puck.dnextY += puck.velocityY);
                    puck.angle = Math.atan2(puck.velocityY, puck.velocityX)*180/Math.PI;
                    send_message_puck(puck.dnextX, puck.dnextY, puck.velocityX, puck.velocityY, puck.speed, puck.angle);
                }
            };

            var hitTest = function (myBat, puck) {
                var retval = false;
                var dx = (myBat.x + myBat.dnextX) - (puck.x + puck.dnextX);
                var dy = (myBat.y + myBat.dnextX) - (puck.y + puck.dnextY);
                var distance = (dx * dx + dy * dy);
                if (distance <= (myBat.radius + puck.radius) *
                    (myBat.radius + puck.radius) ) {
                    retval = true;
                    console.log("hit");
                }
                return retval;
            };

            var setEndParameters = function () {
                game_session = false;
            };

            var game_session = true;

            puck.update();
            this.initSocket(ws, enemyBat, setStartParameters, kickHandler, EnemyPositionHandler, MyPositionHandler, setEndParameters, local_storage(), UserModel, sendStartBatPosition, setStartPosition);

            var fnAnimate = function() {
                if (game_session) {
                    console.log("fn Animate");
                    keyPressListHandler();
                    myBat.testBorder(net.length / 2, net.length / 2);
                    if (puck.start) {
                        if (puck.x > net.length / 2 - puck.radius - puck.dnextX || puck.x < -net.length / 2 + puck.radius - puck.dnextX) {
                            puck.angle = 180 - puck.angle;
                        } else if (puck.y > net.length / 2 - puck.radius - puck.dnextY) {
                            puck.angle = 360 - puck.angle;
                        } else if (puck.y < -net.length / 2 + puck.radius - puck.dnextY) {
                            puck.angle = 360 - puck.angle;
                            if (puck.x > -block2.x + puck.radius - puck.dnextX && puck.x < block2.x - puck.radius - puck.dnextX) {
                                //console.log("score");
                                //console.log(puck.x);
                                //console.log("lexa");
                                myBat.score = myBat.score + 1;
                                send_message_enemy_score();
                            }
                        }
                        puck.update();
                        collide(myBat, puck);
                        //send_message_puck(puck.dnextX, puck.dnextY, puck.velocityX, puck.velocityY, puck.speed, puck.angle);
                        send_message_position_enemy_bat(myBat.dnextX, myBat.dnextY);
                        puck.update();
                    }
                    puck.render();
                    myBat.render();
                    scene.modelView();
                    renderer.render(scene);
                    requestAnimFrame(fnAnimate);
                }
            };

            requestAnimFrame(fnAnimate);
        },

        setScene: function (scene, canvas) {
            scene.camera.position = {x:0.0, y:25.0, z:-25.0};
            scene.perspective.aspect = canvas.width / canvas.height;
            scene.viewport.width = canvas.width;
            scene.viewport.height = canvas.height;
        },


        initSocket : function(ws, enemyCylinder, setStartParameters, kickHandler, EnemyPositionHandler, MyPositionHandler, setEndParameters, local_storage, UserModel, sendStartBatPosition, setStartPosition) {
            var wscl = ws;

            ws.onopen = function (event) {
                $( "#gameOver" ).hide();
                $( "#wait" ).show();
                console.log("Open Socket - ready for Game");
            };
            ws.onmessage = function (event) {
                var data = JSON.parse(event.data);
                if(data.code == "token") {
                    console.log("token");
                    document.getElementById("token").innerHTML = data.token;
                    $( "#token" ).show();
                }

                if(data.code == "start_game") {
                    $( "#gameOver" ).hide();
                    $( "#wait" ).hide();
                    $( "#token" ).hide();
                    $( "#gameplay" ).show();
                    $("#enemyScore").html("0");
                    $("#myScore").html("0");
                    //$("enemyName").append(data.enemyEmail);
                    document.getElementById("enemyName").innerHTML = data.enemyEmail;
                    setStartParameters(data.number, data.speed);
                    sendStartBatPosition();
                    console.log("senStartBatPosition");
                }

                if(data.code == "game_over"){
                    $( "#gameOver" ).show();
                    $( "#gameplay" ).hide();
                    if(data.win)
                        document.getElementById("win").innerHTML = "winner!";
                    else
                        document.getElementById("win").innerHTML = "loser!";
                    this.canvas = document.getElementById("myCanvas");
                    this.c = this.canvas.getContext('2d');
                    // очистить экран
                    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    var ms = 2000;
                    setEndParameters();
                    function sleep(ms) {
                        console.log("sleep");
                        ms += new Date().getTime();
                        while (new Date() < ms){}
                    }
                    sleep(ms);
                    wscl.close();
                }
                if(data.code == "set_my_new_score") {
                    document.getElementById("myScore").innerHTML = data.score;
                }
                if(data.code == "set_enemy_new_score") {
                    document.getElementById("enemyScore").innerHTML = data.score;
                }

                if (data.code == "kick") {
                    var dnextX = data.dnextX;
                    var dnextY = data.dnextY;
                    var velocityX = data.velocityX;
                    var velocityY = data.velocityY;
                    var speed = data.speed;
                    var angle = data.angle;
                    kickHandler(dnextX, dnextY, velocityX, velocityY, speed, angle);
                }
                if ( data.code == "enemy_position") {
                    EnemyPositionHandler(data.dnextX, data.dnextY);
                }
                if ( data.code == "my_position" ) {
                    console.log(data.dnextX);
                    console.log(data.dnextY);
                    MyPositionHandler(data.dnextX, data.dnextY);
                }

                if ( data.code == "start_position" ) {
                    console.log("data пришла");
                    console.log(data);
                    setStartPosition(data.dnextX, data.dnextY);
                }
            };
            ws.onclose = function (event) {
                //UserModel.sync();
                console.log("game_stop");
                //local_storage();
            }
        }
    });
    return AirHockeyApp;
});