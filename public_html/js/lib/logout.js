define([
    // Libs
    'jquery',
    // Deps
    'alert_tmpl',
], function($, alert_tmpl){
    return function(event){

        event.preventDefault();

        var $page = $('#page');
        var $btn = $('.toolbar__tools__logout');

        $page.find('.alert').remove();

        $.ajax({
            url: $btn.attr('href'),
            type: 'POST',
            beforeSend: function() {
                $btn.prop('disabled',true);
            },
            success: function() {
                $page.append(alert_tmpl);
                $page.find('.alert span').text("Success Logout");
                $page.find('.alert').slideDown().delay(1000).slideUp();
                window.location.assign('/#');
            },
            error: function() {
                $page.append(alert_tmpl);
                $page.find('.alert span').text("Wrong Logout");
                $page.find('.alert').slideDown().delay(1000).slideUp();
            },
            complete: function() {
                $btn.prop('disabled',false);
            }
        })
    };
})