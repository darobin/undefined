// smooth scroller
$(function() {
    $("a[href^='#']").click(function () {
        var $target = $(this.hash);
        if ($target.length) {
            $("html, body")
                .animate({
                    scrollTop:  $target.offset().top
                }, 500);
            // return false;
        }
    });
});
