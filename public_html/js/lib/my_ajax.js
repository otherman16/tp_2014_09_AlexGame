define([
    // Libs
    'jquery',
    // Deps
    'alert_tmpl',
], function($, alert_tmpl){
    return function(){
        var $page = $('#page');
        var $form = $('form');

        $page.find('.alert').remove();

        var data = {};
        $.each($form[0].elements, function(field_count, field){
            data[$(field).attr("name")] = $(field).val();
            delete data["undefined"];
        });

        $.ajax({
            url: $form.attr('action'),
            dataType: "application/json",
            data: JSON.stringify(data),
            type: $form.attr('method'),
            success: function(response) {
                $page.append(alert_tmpl);
                $page.find('.alert span').text("Success");
                $page.find('.alert').slideDown().delay(1000).slideUp();
            },
            error: function(response) {
                $page.append(alert_tmpl);
                $page.find('.alert span').text("Error");
                $page.find('.alert').slideDown().delay(1000).slideUp();
            }
        })
    };
})