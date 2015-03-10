#!/usr/local/bin/node

var fs = require("fs")
,   jn = require("path").join
,   CleanCSS = require("clean-css")
,   UglifyJS = require("uglify-js")
,   crypto = require("crypto")
,   rfs = function (file) { return fs.readFileSync(jn(__dirname, file), "utf8"); }
,   wfs = function (file, content) { fs.writeFileSync(jn(__dirname, file), content, "utf8"); }
;

// XXX
// grab each HTML source in turn, and inject it in place
// build the CSS file, uglify it, hash it, save to hashed file, insert into HTML
// same for JS

// load up base skeleton
function loadSkeleton () {
    return rfs("skeleton.html");
}

// produce a hash for some content
function hashContent (str) {
    return crypto.createHash("md5").update(str, "utf8").digest("hex");
}

// process CSS
function processCSS () {
    var sources = ["node_modules/normalize.css/normalize.css", "css/undefined.css"]
    ,   css = ""
    ;
    sources.forEach(function (file) { css += rfs(file); });
    var cssmin = new CleanCSS({
            keepSpecialComments:    0
        ,   root:                   __dirname
        ,   relativeTo:             jn(__dirname, "css")
        ,   processImport:          true
        ,   noAdvanced:             true
        }).minify(css)
    ,   hash = hashContent(cssmin.styles)
    ;
    fs.readdirSync(jn(__dirname, "css"))
        .forEach(function (file) {
            if (!/\.min\.css$/.test(file)) return;
            fs.unlinkSync(jn(__dirname, "css", file));
        })
    ;
    wfs("css/" + hash + ".min.css", cssmin.styles);
    return "<link rel='stylesheet' href='/css/" + hash + ".min.css'>";
}

// process JS
function processJS () {
    var sources = [
            // uncomment this to debug vertical rhythm
            // "node_modules/rizm/rizm.js",
            "node_modules/jquery/dist/jquery.min.js"
        ,   "js/sticky.js"
        ]
    ,   js = ""
    ;
    sources.forEach(function (file) { js += ";" + rfs(file); });
    js = UglifyJS.minify(js, { fromString: true }).code;
    var hash = hashContent(js);
    fs.readdirSync(jn(__dirname, "js"))
        .forEach(function (file) {
            if (!/\.min\.js$/.test(file)) return;
            fs.unlinkSync(jn(__dirname, "js", file));
        })
    ;
    wfs("js/" + hash + ".min.js", js);
    return "<script src='/js/" + hash + ".min.js'></script>";
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
                else {
                    console.error("File not found: " + file);
                    return "";
                }
            }
        });
    return hasReplaced ? applyTemplates(res) : res;
}

// Run, Forrest, run!
wfs("index.html", applyTemplates(loadSkeleton()));
