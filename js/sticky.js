
(function ($) {
    function sticky () {
        $("main, section").each(function() {
            var $el = $(this)
            ,   offset = $el.offset()
            ,   top = $(window).scrollTop()
            ,   floatingHeader = $(".floatingHeader", this)
            ;
            if ((top > offset.top) && (top < offset.top + $el.height()))
                floatingHeader.css({ "visibility": "visible" });
            else
                floatingHeader.css({ "visibility": "hidden" });
       });
    }

    $(function() {
        console.log("loading");
        var cloned;
        $("main, section").each(function() {
            cloned = $(this).find("> :header").first();
            cloned
                .before(cloned.clone())
                .css("width", cloned.width())
                .addClass("floatingHeader")
            ;
        });
        $(window)
            .scroll(sticky)
            .trigger("scroll")
        ;
    });
}(jQuery));
