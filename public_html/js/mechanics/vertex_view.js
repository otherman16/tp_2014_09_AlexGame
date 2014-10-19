define([
	// Libs
	'jquery',
	'backbone',
	'vertex_collection'
], function($, Backbone, models){
	var VertexView = Backbone.View.extend({

        renderVertex: function() {
        },

		render: function() {
            this.canvas = document.getElementById("myCanvas");
            this.c = this.canvas.getContext('2d');
            // очистить экран
            this.c.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.c.beginPath();
            var prev = models.last();
            this.c.moveTo(prev.get('x'), prev.get('y'));
            models.each(function(vertex){
                this.canvas = document.getElementById("myCanvas");
                this.c = this.canvas.getContext('2d');
                this.c.lineTo(vertex.get('x'), vertex.get('y'));
            });
            this.c.closePath();
            this.c.fillStyle = 'gray';
            this.c.fill();
            this.c.stroke();
            // надо о отдельную функцию renderVartex();
            models.each(function(vertex){
                this.canvas = document.getElementById("myCanvas");
                this.c = this.canvas.getContext('2d');
                var x = vertex.get('x'),
                    y = vertex.get('y'),
                    radius = vertex.radius;
                this.c.beginPath();
                this.c.arc(x, y, radius, 0, 2 * Math.PI);
                this.c.closePath();
                this.c.fillStyle = 'black';
                this.c.fill();
                console.log(this);
            });

          },

		initialize: function() {
		     models.on('add', this.render);
             models.on('remove', this.render);
             models.on('change', this.render);
		},
	});
	return VertexView;
})

/*define([
    'vertex_collection'
], function(model){


  function render(){
    this.canvas = document.getElementById("myCanvas");
        console.log(this.canvas);
    this.c = this.canvas.getContext('2d');
    c.clearRect(0, 0, canvas.width, canvas.height);
    c.beginPath();
    var prev = model.last();
    c.moveTo(prev.get('x'), prev.get('y'));
    model.each(function(vertex){
      c.lineTo(vertex.get('x'), vertex.get('y'));
    });
    c.closePath();
    c.fillStyle = 'gray';
    c.fill();
    c.stroke();
    model.each(renderVertex);
  }

  function renderVertex(vertex){
    var x = vertex.get('x'),
        y = vertex.get('y'),
        radius = vertex.radius;
    c.beginPath();
    c.arc(x, y, radius, 0, 2 * Math.PI);
    c.closePath();
    c.fillStyle = 'black';
    c.fill();
  }

  model.on('add', render);
  model.on('remove', render);
  model.on('change', render);
});
*/