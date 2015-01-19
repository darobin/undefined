
var fs = require("fs")
,   jn = require("path").join
;

var isbsn = fs.readFileSync(jn(__dirname, "isbn.txt"), "utf8")
              .split("\n")
              .filter(function (line) {
                  line = line.replace(/\s*#.*/, "");
                  return line.length !== 0;
              });

