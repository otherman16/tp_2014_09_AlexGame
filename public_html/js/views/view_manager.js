define([
	// Libs
	'backbone',
], function(Backbone) {
	var ViewManager = Backbone.View.extend({
		addView: function(view) {
			this.viewList.push(view)
			var me = this;
			view.on("showView", function(event){
				me.hideAll(view);
			});
		},
		hideAll: function(except_view) {
			this.viewList.forEach(function(element, index, array){
				if (element != except_view) {
					element.hide();
				}
			});
		},
		initialize: function() {
			this.viewList = [];
		}
	});
	return ViewManager;
})