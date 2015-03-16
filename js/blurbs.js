
(function ($) {
    var $blurbs = $("#blurbs")
    ,   items = []
    ,   tailItem
    ;
    
    function makeBlurb (item) {
        return $("<a></a>")
                    .attr("href", "#" + item.id)
                    .addClass("half-column")
                    .append($("<h4></h4>").text(item.title))
                    .append(item.para)
        ;
    }
    
    $("#ideas section").each(function () {
        var $sec = $(this)
        ,   $p = $sec.find("p:first").clone()
        ,   $h = $sec.find(":header").first()
        ;
        $p.find("a").each(function () {
            var $a = $(this);
            $a.replaceWith(
                $("<span></span>").addClass("exlink").append($a.contents())
            );
        });
        items.push({
            title:  $h.text()
        ,   para:   $p
        ,   id:     $h.attr("id")
        });
    });
    if (items.length % 2) tailItem = items.pop();
    while (items.length) {
        $("<div></div>")
            .addClass("row")
            .append(makeBlurb(items.shift()))
            .append(makeBlurb(items.shift()))
            .appendTo($blurbs);
    }
    if (tailItem) {
        $("<div></div>")
            .addClass("row tail")
            .append(makeBlurb(tailItem))
            .appendTo($blurbs);
    }
}(jQuery));
