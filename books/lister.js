
(function ($) {
    var $layout = $("#book-layout")
    ;
    function addBooks (pile, books) {
        for (var i = 0, n = books.length; i < n; i++) {
            var item = books[i]
            ,   authors = item.authors ? item.authors.join(", ") : ""
            ;
            $("<div></div>")
                .addClass("book")
                .addClass(pile)
                .attr({
                    "data-title":       item.title
                ,   "data-subtitle":    item.subtitle || ""
                ,   "data-url":         item.url || ""
                ,   "data-authors":     authors
                ,   "data-publisher":   item.publisher ? item.publisher.join(", ") : ""
                ,   "data-year":        item.year || ""
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
            itemSelector:   "div.book"
        ,   gutter:         3
        });

        // XXX
        //  styling
        // throw in tooltips when needs
        // hover effect

    });
}(jQuery));
