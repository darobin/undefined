
var fs = require("fs")
,   jn = require("path").join
;

var isbns = fs.readFileSync(jn(__dirname, "isbn.txt"), "utf8")
              .split("\n")
              .map(function (line) { return line.replace(/\s*#.*/, ""); })
              .filter(function (line) { return line.length !== 0; })
;
console.log(isbns);
