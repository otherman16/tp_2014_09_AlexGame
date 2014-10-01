define([
    // Libs
    'jquery',
    // Deps
    'alert_view',
], function($, AlertView){
    return function(event){

        event.preventDefault();

        var $page = $('.screen');
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
                window.location.assign('/#');
            },
            error: function() {
                this.alert.show("Wrong Logout");
                $page.find('.alert').slideDown().delay(1000).slideUp();
            },
            complete: function() {
                $btn.prop('disabled',false);
            }
        })
    };
})