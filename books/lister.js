
(function ($) {
    var $layout = $("#book-layout")
    ;
    function addBooks (pile, books) {
        for (var i = 0, n = books.length; i < n; i++) {
            var item = books[i]
            ,   authors = item.authors ? item.authors.join(", ") : ""
            ;
            $("<a></a>")
                .addClass("book")
                .addClass(pile)
                .attr({
                    href:       item.url
                ,   target:     "_blank"
                })
                .append(
                    item.cover ?
                        $("<img>")
                            .attr({
                                src:    "/books/img/" + item.cover.replace(/.*\//, "")
                            ,   width:  item.coverSize.width
                            ,   height: item.coverSize.height
                            ,   alt:    item.title
                            })
                        :
                        $("<span>«<cite></cite>»</span>")
                            .find("cite").text(item.title).end()
                            .append(authors ? "<br>" + authors : "")
                )
                .appendTo($layout)
            ;
        }
    }
    
    $.getJSON("/books/all.json", function (data) {
        addBooks("to-read", data["to-read"]);
        addBooks("reading", data.reading);
        addBooks("read", data.read);
        
        $layout.packery({
            itemSelector:   "a.book"
        ,   gutter:         3
        });
    });
}(jQuery));
