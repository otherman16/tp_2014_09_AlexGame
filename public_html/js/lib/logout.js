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
            success: function() {
                this.alert.show("Success Logout");
                window.location.hash = '';
            },
            error: function() {
                this.alert.show("Wrong Logout");
            },
            complete: function() {
                $btn.prop('disabled',false);
            }
        })
    };
})