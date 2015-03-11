
(function ($) {
    var headers = []
    ,   $win = $(window)
    ,   currentIdx = null
    ;
    function show ($el) { $el.addClass("shown"); }
    function hide ($el) { $el.removeClass("shown"); }
    

    // XXX debounce?
    function sticky () {
        var top = $win.scrollTop();
        if (top - headers[0].margin < headers[0].offset) {
            if (currentIdx !== null) {
                hide(headers[currentIdx].floating);
                show(headers[currentIdx].fluid);
            }
            currentIdx = null;
            return;
        }
        for (var i = 0, n = headers.length; i < n; i++) {
            var h = headers[i];
            if (h.offset >= top) {
                if (i - 1 === currentIdx) return; // the header hasn't changed
                if (currentIdx !== null) {
                    hide(headers[currentIdx].floating);
                    show(headers[currentIdx].fluid);
                }
                currentIdx = i - 1;
                if (i === 0) return; // not sure about this
                show(headers[currentIdx].floating);
                hide(headers[currentIdx].fluid);
                break;
            }
        }
    }

    $(function() {
        $("main, section").each(function() {
            var $el = $(this)
            ,   $h = $el.find("> :header").first()
            ,   $clone = $h.clone().removeAttr("id")
            ,   margin = parseFloat($h.css("margin-top"), 10)
            ;
            headers.push({
                offset:         $h.offset().top - margin
            ,   floating:       $h
            ,   fluid:          $clone
            ,   margin:         margin
            });
            $h
                .before($clone)
                .css({
                    width:  $h.width()
                ,   top:    "-" + margin + "px"
                })
                .addClass("floatingHeader")
            ;
            $clone.addClass("fluidHeader");
        });

        $win.scroll(sticky).trigger("scroll");
        $win.resize(function () {
            $.each(headers, function (_, h) {
                h.offset = h.fluid.offset().top - h.margin;
            });
        });
    });
}(jQuery));
