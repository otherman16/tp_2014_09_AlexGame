define([
    // Libs
    'jquery',
    // Deps
    'alert_view',
], function($, AlertView){
    return function(event){

        event.preventDefault();
        var $btn = $(event.currentTarget);

        $.ajax({
            url: $btn.attr('href'),
            type: 'POST',
            beforeSend: function() {
                $btn.prop('disabled',true);
                this.alert = new AlertView();
            },
            success: function(response) {
                this.alert.show(response["message"]);
                window.location.hash = '';
            },
            error: function(response) {
                this.alert.show(response.responseJSON["message"]);
            },
            complete: function() {
                $btn.prop('disabled',false);
            }
        })
    };
})