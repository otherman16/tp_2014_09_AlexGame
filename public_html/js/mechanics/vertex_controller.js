define([
    'jquery',
    'backbone',
    'vertex_collection',
    'vertex_model',
], function($, Backcone, models, Vertex){
    var VertexController = Backbone.View.extend({
        // без этого элемента не работает
        el: $('.screen__game'),
        initSocket : function() {
            this.ws.onopen = function (event) {
                alert("Open Socket - ready for Game");
            }
            this.ws.onmessage = function (event) {
                //alert("Message");
                var data = JSON.parse(event.data);
                console.log(data);
                if(data.status == "start"){
                    document.getElementById("wait").style.display = "none";
                    document.getElementById("gameplay").style.display = "block";
                    document.getElementById("enemyName").innerHTML = data.enemyName;
                }
                if(data.status == "finish"){
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
                    //ws.close();
                    //this.ws.call(VertexController).close();
                    //this.ws = null;
                    // очищаем коллекцию вершин
                    models.reset();
                }
                if(data.status == "increment" && data.name == document.getElementById("myName").innerHTML){
                    console.log(data.name);
                    document.getElementById("myScore").innerHTML = data.score;
                }
                if(data.status == "increment" && data.name == document.getElementById("enemyName").innerHTML){
                    console.log(data.name);
                    document.getElementById("enemyScore").innerHTML = data.score;
                }
                if(data.status == "step" && data.name == document.getElementById("enemyName").innerHTML){
                    models.add(new Vertex({
                        x: data.x,
                        y: data.y,
                        who: "enemy"
                    }));
                }
            }
            this.ws.onclose = function (event) {
                alert("close Socket - game Over");
                window.location.hash = "";
            }
        },

        initialize: function() {
            this.send_message = function(e) {
                // я не знаю почему, но надо 45 - чтоб были координаты те, куда кликаешь.
                var data = JSON.stringify({x: e.pageX, y: e.pageY - 45});
                console.log("send message" + e.pageX + " " + e.pageY + "\n");
                console.log(data + "\n");
                this.ws.send(data);
            }
            this.canvas = document.getElementById("myCanvas");
            if ( !this.ws) {
                this.ws = new WebSocket("ws://localhost:8080/gameSocket");
            }
            var self = this;
            console.log("self" + this);
            this.canvas.addEventListener('mousedown', function(e){
                // console.log(this); // this - это окно canvas
                // рисуем вершину у себя
                models.add(new Vertex({
                    x: e.pageX,
                    y: e.pageY - 45,
                    who: "i"
                }));
                // и у противника
                self.send_message(e);
                //console.log("send message = " + (this.send_message  == undefined));
            });
            this.initSocket();
        },
        events: {

        }
    });
    return VertexController;
})

/*define([
    'vertex_collection',
    'vertex_model'
], function(models, Vertex){
  var vertexBeingDragged,
      dragStartX, dragStartY;

  function findVertexUnderPoint(x, y){
    return models.find(function(vertex){
      return vertex.contains(x, y);
    });
  }
/*
    this.canvas = document.getElementById("myCanvas");
        console.log(this.canvas);
       // this.c = this.canvas.getContext('2d');

    //this.canvas = document.getElementById("myCanvas");

     this.canvas.addEventListener('mousedown', function(e){
    vertexBeingDragged = findVertexUnderPoint(e.pageX, e.pageY);
    if(vertexBeingDragged){
      dragStartX = vertexBeingDragged.get('x');
      dragStartY = vertexBeingDragged.get('y');
    }
    else{
      model.add(new Vertex({
        x: e.pageX,
        y: e.pageY
      }));
    }
  });
  this.canvas.addEventListener('mousemove', function(e){
    if(vertexBeingDragged){
      vertexBeingDragged.set({
        x: e.pageX,
        y: e.pageY
      });
    }
  });
  this.canvas.addEventListener('mouseup', function(e){
    if(vertexBeingDragged){
      if(dragStartX == vertexBeingDragged.get('x') &&
         dragStartY == vertexBeingDragged.get('y')){
        model.remove(vertexBeingDragged);
      }
    }
    vertexBeingDragged = null;
  });
});
*/