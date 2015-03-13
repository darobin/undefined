
(function ($) {
    var $layout = $("#book-layout")
    ;
    // throw Packery at it
    // throw in tooltips when needs
    // hover effect
    function addBooks (pile, books) {
        for (var i = 0, n = books.length; i < n; i++) {
            var item = books[i];
            $("<div></div>")
                .addClass("book")
                .addClass(pile)
                .attr({
                    "data-title":       item.title
                ,   "data-subtitle":    item.subtitle || ""
                ,   "data-url":         item.url || ""
                ,   "data-authors":     item.authors ? item.authors.join(", ") : ""
                ,   "data-publisher":   item.publisher ? item.publisher.join(", ") : ""
                ,   "data-year":        item.year || ""
                })
                .append(
                    item.cover ?
                        $("<img>")
                            .attr({
                                src:    item.cover.replace(/.*\//, "")
                            ,   width:  item.coverSize.width
                            ,   height: item.coverSize.height
                            ,   alt:    item.title
                            })
                        :
                        document.createTextNode(item.title)
                )
                .appendTo($layout)
            ;
        }
    }
    
    $.getJSON("/books/all.json", function (data) {
        addBooks("to-read", data["to-read"]);
        addBooks("reading", data.reading);
        addBooks("read", data.read);
    });
}(jQuery));
