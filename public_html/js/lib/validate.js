define([
	// Libs
	'jquery',
	'my_ajax',
	// Views
	'alert_view',
], function($, my_ajax, AlertView) {
	var Validator = {
		initialize: function(form) {
			this.$el = $(form);
			$.each(this.$el[0].elements, function(field_count, field){
				if ( $(field).attr('type') != "submit" ) {
	            	$(field).on("focusout", function() {
	            		if($(field).val() == "") {
				        	$(field).addClass("wrong");
				        }
				        else {
				        	$(field).addClass("right");
				        }
	            	});
	            	$(field).on("focusin", function() {
				        $(field).removeClass("wrong");
				        $(field).removeClass("right");
	            	});
	            }
        	});
        	this.$el.on("submit", function(event) {
        		event.preventDefault();
        		if( Validator.validate() ) {
        			if( !my_ajax(event) ) {
        				Validator.eventsAfterServerWrong();
        			}
        		}
        	});
		},
		eventsAfterServerWrong: function() {
			$.each(this.$el[0].elements, function(field_count, field){
				if($(field).attr('type') != "submit") {
	            	if($(field).attr('name') == 'password' || $(field).attr('name') == 'email') {
	            		$(field).val('');
	            		$(field).removeClass("right");
	            		$(field).addClass("wrong");
	            	}
	            }
        	});
		},
		validate: function() {
			var flag = true;
			var alert = new AlertView();
			$.each(this.$el[0].elements, function(field_count, field){
				if($(field).attr('type') != "submit") {
		            if($(field).val() == "") {
		            	$(field).addClass("wrong");
		            	flag = false;
		            }
		            else {
		            	$(field).addClass("right");
		            }
		        }
	        });
	        if( !flag ) {
	        	alert.show("Fill marked fields!")
	        }
	        return flag;
		},
		removeEvents: function(form) {
			$(form).off();
			$.each($(form)[0].elements, function(field_count, field){
	            $(field).off();
	        });
		}
	};
	return Validator;
})