
var fs = require("fs")
,   jn = require("path").join
,   sizeOf = require("image-size")
,   piles = "read reading to-read".split(" ")
;

piles.forEach(function (pile) {
    var file = jn(__dirname, pile + ".json")
    ,   data = JSON.parse(fs.readFileSync(file, "utf8"));
    for (var k in data) {
        var book = data[k];
        if (book.cover && !book.coverSize) book.coverSize = sizeOf(jn(__dirname, "img", book.cover.replace(/.*\//, "")));
    }
    fs.writeFileSync(file, JSON.stringify(data, null, 4), "utf8");
});
