define([
    // Libs
    'jquery',
    // Deps
    'alert_tmpl',
], function($, alert_tmpl){
    var my_ajax = function(){
        var $page = $('#page');

        $page.find('.alert').remove();

        var data = {};
        $.each(this.elements, function(field_count, field){
            data[$(field).attr("name")] = $(field).val();
            delete data["undefined"];
        });

        $.ajax({
            url: $(this).attr('action'),
            dataType: "application/json",
            data: JSON.stringify(data),
            type: $(this).attr('method'),
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
        return false;
    };
    return my_ajax;
})