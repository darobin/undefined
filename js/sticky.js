
// XXX
//  - we need to rethink this.
//  - currently this applies to all headers, which is inconvenient
//  - detect passage across top
//  - linked list of headers
//  - manage a single floating instance, not lots of clones?
//  - manage a single background for each

// HOW:
//  - on load, memorise all header offsets
//  - on scroll, detect between which two we are
//  - depending on position, show/hide
//  - the background thing is handled by *constantly* having said bg element at the top and just
//    resizing it to match our needs


(function ($) {
    function show ($el) { $el.addClass("shown"); }
    function hide ($el) { $el.removeClass("shown"); }
    
    var $curBg;
    function backgroundify ($el) {
        if ($curBg) return;
        $curBg = $("<div></div>")
                    .css({
                        width:  $el.width()
                    ,   height: $el.height()
                    ,   top:    $el.offset().top
                    ,   background: "#333"
                    ,   filter:     "blur(4px)"
                    })
        ;
        $el.before($curBg);
    }
    
    function sticky () {
        $("main, section").each(function() {
            var $el = $(this)
            ,   offset = $el.offset()
            ,   stickScroll = 0+$el.attr("data-sticky-scroll") || 0
            ,   top = $(window).scrollTop()
            ,   $floatingHeader = $(".floatingHeader", this)
            ,   $fluidHeader = $(".fluidHeader", this)
            ;
            if ((top > offset.top - stickScroll) && (top < offset.top + $el.height())) {
                show($floatingHeader);
                backgroundify($floatingHeader);
                hide($fluidHeader);
            }
            else {
                hide($floatingHeader);
                $curBg.remove();
                show($fluidHeader);
            }
       });
    }

    $(function() {
        $("main, section").each(function() {
            var $el = $(this)
            ,   $h = $el.find("> :header").first()
            ,   $clone = $h.clone()
            ,   stickScroll = $h.attr("data-sticky-scroll") || "0"
            ;
            $h
                .before($clone)
                .css({
                    width:  $h.width()
                ,   top:    "-" + stickScroll + "px"
                })
                .addClass("floatingHeader")
            ;
            $clone.addClass("fluidHeader");
        });
        $(window)
            .scroll(sticky)
            .trigger("scroll")
        ;
    });
}(jQuery));
