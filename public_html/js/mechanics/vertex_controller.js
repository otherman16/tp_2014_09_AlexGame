define([
    'vertex_collection',
    'vertex_model'
], function(models, Vertex){
	var VertexController = Backbone.View.extend({
        findVertexUnderPoint: function() {
        },
		initialize: function() {
		    this.canvas = document.getElementById("myCanvas");
            this.canvas.addEventListener('mousedown', function(e){
                models.add(new Vertex({
                    x: e.pageX,
                    y: e.pageY - 45
                }));
            });
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