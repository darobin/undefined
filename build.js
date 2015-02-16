#!/usr/local/bin/node

var fs = require("fs")
,   jn = require("path").join
,   rfs = function (file) { return fs.readFileSync(jn(__dirname, file), "utf8"); }
,   wfs = function (file, content) { fs.writeFileSync(jn(__dirname, file), content, "utf8"); }
;

// XXX
// grab each HTML source in turn, and inject it in place
// build the CSS file, hash it, save to hashed file, insert into HTML
// same for JS

// load up base skeleton
function loadSkeleton () {
    return rfs("skeleton.html");
}

// process CSS
function processCSS () {
    return "";
}

// process JS
function processJS () {
    return "";
}

// apply templating recursively
function applyTemplates (src) {
    var hasReplaced = false
    ,   res = src.replace(/\{\{\#(.*?)}}/g, function (str, m1) {
            hasReplaced = true;
            if      (m1 === "css")  return processCSS();
            else if (m1 === "js")   return processJS();
            else if (/^include/.test(m1)) {
                var file = m1.replace(/^include\s+/, "");
                if (fs.existsSync(jn(__dirname, file))) return rfs(file);
                else console.error("File not found: " + file);
            }
        });
    return hasReplaced ? applyTemplates(res) : res;
}

// Run, Forrest, run!
wfs("index.html", applyTemplates(loadSkeleton()));
