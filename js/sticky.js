
(function ($) {
    var headers = []
    ,   $win = $(window)
    ,   currentIdx = null
    ,   $canary
    ,   canaryOffset
    ;

    function show ($el) { $el.addClass("shown"); }
    function hide ($el) { $el.removeClass("shown"); }
    function setOffsets () {
        $.each(headers, function (_, h) {
            h.offset = h.fluid.offset().top - h.margin;
        });
        $canary = headers[headers.length - 1].fluid;
        canaryOffset = $canary.offset().top;
    }
    
    function toggle () {
        if (currentIdx !== null) {
            hide(headers[currentIdx].floating);
            show(headers[currentIdx].fluid);
        }
    }

    // XXX debounce?
    function sticky () {
        var top = $win.scrollTop();

        // detect reflows, font size changes, etc.
        if ($canary.offset().top !== canaryOffset) setOffsets();

        // we are before the first header
        if (top - headers[0].margin < headers[0].offset) {
            toggle();
            currentIdx = null;
            return;
        }
        // we are in the last section
        if (top > headers[headers.length - 1].offset) {
            toggle();
            currentIdx = headers.length - 1;
            show(headers[currentIdx].floating);
            hide(headers[currentIdx].fluid);
            return;
        }
        for (var i = 0, n = headers.length; i < n; i++) {
            var h = headers[i];
            if (h.offset >= top) {
                // console.log("offset > top", h.offset, top);
                if (i - 1 === currentIdx) return; // the header hasn't changed
                toggle();
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
            ,   $h = $el.find("> h1, > h2, > h3").first()
            ,   $clone = $h.clone().attr("id", $h.attr("id"))
            ,   margin = parseFloat($h.css("margin-top"), 10)
            ;
            $h.removeAttr("id");
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
        $canary = headers[headers.length - 1].fluid;
        canaryOffset = $canary.offset().top;
        

        $win.scroll(sticky).trigger("scroll");
        $win.resize(setOffsets);
    });
}(jQuery));
