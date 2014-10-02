define([
	// Libs
	'jquery',
	'my_ajax',
	// Views
	'alert_view',
	'jquery.validate'
], function($, my_ajax, AlertView) {
	return function(form) {
		$(form).validate({
			rules: {
				login: {
					required: true
				},
				email: {
					required: true,
					email: true
				},
				password: {
					required: true
				}
			},
			messages: {
				login: {
					required: "We need your login"
				},
				email: {
					required: "We need your Email",
					email: "Email must be the next format: name@domain.ru"
				},
				password: {
					required: "We need your password"
				}
			},
			validClass: "valid",
			errorClass: "invalid",
			wrapper: "div",
			errorElement: "label",
			submitHandler: function(form) {
				var data = {};
		        $.each($(form)[0].elements, function(field_count, field){
		            data[$(field).attr("name")] = $(field).val();
		            delete data["undefined"];
		        });
		        $.ajax({
		            url: $(form).attr('action'),
		            data: JSON.stringify(data),
		            type: $(form).attr('method'),
		            beforeSend: function() {
		                $(form).find('input[type=submit]').prop('disabled',true);
		                this.alert = new AlertView();
		            },
		            success: function() {
		                this.alert.show('Success');
		                window.location.hash = "";
		            },
		            error: function() {
		                this.alert.show('Error');
		            },
		            complete: function() {
		                $(form).find('input[type=submit]').prop('disabled',false);
		            }
		        });
			}
		});
	};
})