define([
    // Libs
    'jquery',
    // Deps
    'alert_tmpl',
], function($, alert_tmpl){
    return function(event){

        event.preventDefault();

        var $page = $('.screen');
        var $form = $(event.currentTarget);

        $page.find('.alert').remove();

        var data = {};
        $.each($form[0].elements, function(field_count, field){
            data[$(field).attr("name")] = $(field).val();
            delete data["undefined"];
        });

        $.ajax({
            url: $form.attr('action'),
            // dataType: "application/x-www-form-urlencoded", - ??? если вернуть, то всегда выполняется error, несмотря на ответ 200 ???
            data: JSON.stringify(data),
            type: $form.attr('method'),
            beforeSend: function() {
                $page.find('input[type=submit]').prop('disabled',true);
            },
            success: function() {
                $page.append(alert_tmpl);
                $page.find('.alert span').text("Success");
                $page.find('.alert').slideDown().delay(1000).slideUp();
                window.location.assign('/#');
            },
            error: function() {
                $page.append(alert_tmpl);
                $page.find('.alert span').text("Error");
                $page.find('.alert').slideDown().delay(1000).slideUp();
            },
            complete: function() {
                $page.find('input[type=submit]').prop('disabled',false);
            }
        })
    };
})