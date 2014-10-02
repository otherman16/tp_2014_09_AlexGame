define([
    // Libs
    'jquery',
    'validate',
    // Views
    'alert_view',
], function($, validate, AlertView){
    return function(event){

        var $page = $('.screen');
        var $form = $(event.currentTarget);

        var data = {};
        $.each($form[0].elements, function(field_count, field){
            data[$(field).attr("name")] = $(field).val();
            delete data["undefined"];
        });

        $.ajax({
            url: $form.attr('action'),
            data: JSON.stringify(data),
            type: $form.attr('method'),
            beforeSend: function() {
                $form.find('input[type=submit]').prop('disabled',true);
                this.alert = new AlertView();
            },
            success: function() {
                this.alert.show('Success');
                window.location.assign('/#');
                return true;
            },
            error: function() {
                this.alert.show('Error');
                return false;
            },
            complete: function() {
                $form.find('input[type=submit]').prop('disabled',false);
            }
        })
    };
})