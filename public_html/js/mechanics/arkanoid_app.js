define([
    // Libs
    'jquery',
    'backbone',
    'phoria',
    'cylinder_model',
    'puck_model'
], function($, Backbone, P,  CylinderModel, PuckModel){
    var ArkanoidApp = Backbone.View.extend({
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

            /* отрисовка границ и карты */

            var block1 = {
                x : net.length/20,
                y : net.length/20,
                z : net.length/2
            };

            var block2 = {
                x : net.length/4,
                y : net.length/20,
                z : net.length/20
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
                    edges: [
                        {a:7, b:4}
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
            var border3 = border(block1);
            var border4 = border(block1);
            var border5 = border(block2);
            var border6 = border(block2);
            var border7 = border(block2);
            var border8 = border(block2);


            border1.translateX(-net.length/2-block1.x);
            border2.translateZ(-net.length/2).translateX(-net.length/2-block1.x);
            border3.translateX(net.length/2);
            border4.translateX(net.length/2).translateZ(-net.length/2);
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

            var send_message = function(direction) {
                var data = JSON.stringify({dir: direction});
                console.log(ws);
                ws.send(data);
            };

            var send_massage_renew = function(renew) {
                var data = JSON.stringify({renew: renew});
                ws.send(data);
            };

            if ( !this.ws) {
                var ws = new WebSocket("ws://localhost:8096/gameSocket");
                console.log(ws);
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
            var t = Date.now()/1000;
            var p = [~~((Math.sin(t))*128)+128,~~((Math.sin(t/2))*128)+128,~~((Math.cos(t))*128)+128];
            var light = Phoria.DistantLight.create({
                position: {x:0, y:0, z:0},
                intensity: 0.75,
                attenuation: 0.2,
                attenuationFactor: "squared",
                color: [p[0]/255,p[1]/255,p[2]/255]
            });

            var myBat = new CylinderModel();
            var enemyBat = new CylinderModel();
            var puck = new PuckModel();
            //puck.setBigCylinder(0.4, 0.5, 50);
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
            scene.graph.push(border3);
            scene.graph.push(border4);
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
                            send_message(3738);
                            break handler;
                        }
                        if (keyPressList[40]) {
                            myBat.left_bottom();
                            send_message(3740);
                            break handler;
                        }
                        //alert("left")
                        myBat.left();
                        send_message(37);
                    }

                    if (keyPressList[39]) {
                        if (keyPressList[38]) {
                            myBat.right_top();
                            send_message(3839);
                            break handler;
                        }
                        if (keyPressList[40]) {
                            myBat.right_bottom();
                            send_message(3840);
                            break handler;
                        }
                        //alert("right")
                        myBat.right();
                        send_message(39);
                    }

                   if (keyPressList[38]) {
                       //alert("top")
                       myBat.top();
                       send_message(38);
                   }

                   if (keyPressList[40]) {
                       //alert("bottom")
                       myBat.bottom();
                       send_message(40);

                   }
               }
            };

           var setStartParameters = function(code, speed) {
               // если второй соперник, то разворачиваем для него угол направление движения шайбы на 180 градусов
               if (code == 2)
                   puck.angle += 180;
               puck.update();
               puck.speed = speed;
               puck.start = true;
           };

           var enemyStepHandler = function(code) {
               console.log(code);
               if (code == 39) {
                   enemyBat.left();
               } else if ( code == 37 ) {
                   enemyBat.right();
               } else if ( code == 38 ) {
                   enemyBat.bottom();
               } else if ( code == 40 ) {
                   enemyBat.top();
               } else if ( code == 3840 ) {
                   enemyBat.left_top();
               } else if ( code == 3839 ) {
                   enemyBat.left_bottom();
               } else if ( code == 3740 ) {
                   enemyBat.right_top();
               } else if ( code == 3738 ) {
                   enemyBat.right_bottom();
               }
           };

            var step = 0;
            var fnAnimate = function() {
                // stop и start не будет
                keyPressListHandler();
                if ( puck.start ) {
                    //console.log(puck.x);
                    puck.move();
                    if (puck.x > net.length/2 -puck.radius || puck.x < -net.length/2 + puck.radius ) {
                        puck.angle = 180 - puck.angle;
                        puck.update();
                    } else if (puck.y > net.length/2-puck.radius || puck.y < -net.length/2 + puck.radius) {
                        puck.angle = 360 - puck.angle;
                        send_massage_renew(1);
                        puck.update();
                    }
                }
                //light.translateX(0.00001);
                scene.modelView();
                renderer.render(scene);
                requestAnimFrame(fnAnimate);
                step++;
            };
            //var startTime = (new Date()).getTime();

            requestAnimFrame(fnAnimate);
            this.initSocket(ws, enemyBat, enemyStepHandler, setStartParameters);
        },

        setScene: function (scene, canvas) {
            scene.camera.position = {x:0.0, y:15.0, z:-25.0};
            scene.perspective.aspect = canvas.width / canvas.height;
            scene.viewport.width = canvas.width;
            scene.viewport.height = canvas.height;
        },

        initSocket : function(ws, enemyCylinder, enemyStepHandler, setStartParameters) {
            console.log("initSocket");
            console.log(ws);
            var wscl = ws; // чтоб вызвать this.ws.close(); в строчке 39

            ws.onopen = function (event) {
                document.getElementById("gameOver").style.display = "none";
                document.getElementById("wait").style.display = "block";
                //alert("Open Socket - ready for Game");
            };
            ws.onmessage = function (event) {
                //alert("Message");
                var data = JSON.parse(event.data);
                //console.log(data);
                if(data.code == "start_game") {
                    document.getElementById("gameOver").style.display = "none";
                    document.getElementById("wait").style.display = "none";
                    document.getElementById("gameplay").style.display = "block";
                    document.getElementById("enemyScore").innerHTML = "0";
                    document.getElementById("myScore").innerHTML = "0";
                    document.getElementById("enemyName").innerHTML = data.enemyEmail;
                    console.log(data.number);
                    console.log(data.speed);
                    setStartParameters(data.number, data.speed);
                }
                if(data.code == "game_over"){
                    document.getElementById("gameOver").style.display = "block";
                    document.getElementById("gameplay").style.display = "none";
                    if(data.win)
                        document.getElementById("win").innerHTML = "winner!";
                    else
                        document.getElementById("win").innerHTML = "loser!";
                    // на закрытии стираем все с экрана.
                    this.canvas = document.getElementById("myCanvas");
                    this.c = this.canvas.getContext('2d');
                    // очистить экран
                    this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    // !!!
                    // закрыть соккет
                    wscl.close();
                    //this.ws = null;
                }
                if(data.code == "set_my_new_score") {
                    document.getElementById("myScore").innerHTML = data.score;
                }
                if(data.code == "set_enemy_new_score") {
                    document.getElementById("enemyScore").innerHTML = data.score;
                }
                if(data.code == "enemy_step"){
                    enemyStepHandler(data.direction);
                    //alert("enemy_step");

                }
            };
            ws.onclose = function (event) {
                //alert("close Socket - game Over");
                window.location.hash = "";
            }
        }
    });
    return ArkanoidApp;
});