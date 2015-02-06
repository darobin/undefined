
var fs = require("fs")
,   jn = require("path").join
,   sua = require("superagent")
,   spawn = require("child_process").spawn
,   libxml = require("libxmljs")
,   config = require("../config.json")
,   piles = "read reading to-read".split(" ")
,   pileMap = {}
,   keyList = []
,   downloads = []
,   imgSize = "large"
;

function getISBNs (pile) {
    return fs.readFileSync(jn(__dirname, pile + ".txt"), "utf8")
              .split("\n")
              .map(function (line) { return line.replace(/\s*#.*/, ""); })
              .filter(function (line) { return line.length !== 0; })
    ;
    
}

function fetchBooks (isbns, cb) {
    var bibkeys = isbns.map(function (id) { return "ISBN:" + id.replace(/\D/g, ""); }).join(",");
    sua.get("https://openlibrary.org/api/books")
        .query({ bibkeys: bibkeys })
        .query({ jscmd: "data" })
        .query({ format: "json" })
        .end(function (err, res) {
            cb(err, res.body);
        })
    ;
}

function filterBook (book) {
    // dirty old side-effect
    if (book.cover) downloads.push(book.cover[imgSize]);
    var title = book.title.replace(" (Penguin Science)", "");
    if (/,\s+the$/i.test(title)) {
        title = title.replace(/,\s+the$/i, "");
        title = "The " + title;
    }
    return {
        title:      title
    ,   subtitle:   book.subtitle
    ,   url:        book.url
    ,   cover:      book.cover ? book.cover[imgSize].replace(/.*\//, "") : null
    ,   authors:    book.authors ? book.authors.map(function (it) { return it.name; }) : []
    ,   publishers: book.publishers ? book.publishers.map(function (it) { return it.name; }) : []
    ,   date:       book.publish_date.replace(/.*(\d{4}).*/, "$1")
    };
}

function runDownloads (list) {
    var config = list
                    .filter(function (it) {
                        return !fs.existsSync(jn(__dirname, "img", it.replace(/.*\//, "")));
                    })
                    .map(function (it) {
                        return  'url = "' + it + '"\n' +
                                'output = "' + jn(__dirname, "img", it.replace(/.*\//, "")) + '"';
                    }).join("\n\n")
    ;
    if (config) spawn("curl", ["-L", "--config", "-"], { stdio: ["pipe", 1, 2] }).stdin.end(config);
}

function goodreadFallback (missing, cb) {
    var results = {}
    ,   process = function () {
        if (!missing.length) return cb(results);
        var isbn = missing.shift();
        console.log("Falling back for", isbn);
        sua.get("https://www.goodreads.com/book/isbn")
            .query({ key: config.goodreads.key })
            .query({ isbn: isbn })
            .buffer(true)
            .end(function (err, res) {
                var doc = libxml.parseXml(res.text)
                ,   val = function (path) {
                        var node = doc.get(path);
                        return node ? node.text() : null;
                    }
                ,   book = {
                        title:      val("/GoodreadsResponse/book/title")
                    ,   url:        val("/GoodreadsResponse/book/url")
                    ,   cover:      val("/GoodreadsResponse/book/image_url")
                    ,   publishers: (val("/GoodreadsResponse/book/publisher") || "").split(/\//).filter(function (n) { return n; })
                    ,   date:       val("/GoodreadsResponse/book/publication_year")
                    ,   authors:    []
                    }
                ;
                // if there is no title we assume an error
                if (book.title) {
                    if (/nophoto/.test(book.cover)) book.cover = null;
                    doc.root()
                        .find("/GoodreadsResponse/book/authors/author/name")
                        .forEach(function (name) {
                            book.authors.push(name.text());
                        });
                    results[isbn] = book;
                    if (book.cover) downloads.push(book.cover);
                }
                setTimeout(process, 1000);
            })
        ;
    };
    process();
}

for (var i = 0, n = piles.length; i < n; i++) {
    var pile = piles[i]
    ,   list = getISBNs(pile)
    ;
    for (var j = 0, m = list.length; j < m; j++) pileMap[list[j].replace(/\D/g, "")] = pile;
    keyList = keyList.concat(list);
}

fetchBooks(keyList, function (err, books) {
    for (var i = 0, n = piles.length; i < n; i++) {
        var pile = piles[i], data = [];
        for (var k in books) {
            if (pileMap[k.replace("ISBN:", "")] === pile) {
                data.push(filterBook(books[k]));
                delete pileMap[k.replace("ISBN:", "")];
            }
        }
        fs.writeFileSync(jn(__dirname, pile + ".json"), JSON.stringify(data, null, 4), "utf8");
    }
    if (Object.keys(pileMap).length) {
        console.log("Missing books to find on GoodReads!");
        console.log(pileMap);
        goodreadFallback(Object.keys(pileMap), function (missing) {
            // DRY
            for (var i = 0, n = piles.length; i < n; i++) {
                var pile = piles[i]
                ,   data = JSON.parse(fs.readFileSync(jn(__dirname, pile + ".json"), "utf8"))
                ;
                for (var k in missing) {
                    if (pileMap[k] === pile) {
                        data.push(missing[k]);
                        delete pileMap[k];
                    }
                }
                fs.writeFileSync(jn(__dirname, pile + ".json"), JSON.stringify(data, null, 4));
            }
            if (Object.keys(pileMap).length) {
                console.log("MISSING BOOKS UNRECOVERABLE!");
                console.log(pileMap);
            }
            runDownloads(downloads);
        });
    }
    else runDownloads(downloads);
});
