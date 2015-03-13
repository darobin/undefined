
var fs = require("fs")
,   jn = require("path").join
,   piles = "read reading to-read".split(" ")
,   out = {}
;

piles.forEach(function (pile) {
    var file = jn(__dirname, pile + ".json")
    ,   data = JSON.parse(fs.readFileSync(file, "utf8"));
    out[pile] = data;
});
fs.writeFileSync(jn(__dirname, "all.json"), JSON.stringify(out, null, 4), "utf8");
