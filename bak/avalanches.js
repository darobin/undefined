/* global d3 */

(function ($, d3) {
    // items
    var $size = $("#sandpile-size")
    ,   $seed = $("#sandpile-seed")
    ,   $canvas = $("#sandpile")
    ,   $run = $("#sandpile-run")
    ,   $stop = $("#sandpile-stop")
    ,   $graph = $("#sandpile-graph")
    ,   $pre = $("#sandpile-report")
    ,   $ticks = $("#sandpile-ticks")
    ,   $vol = $("#sandpile-volume")
    ,   MAX_GRAINS = 4
    ,   PIXEL_SIZE = 4
    ,   GRAPH_SIZE = 500
    ,   avSizes = []
    ,   avDurations = []
    //  number of grains of sand in a cell
    ,   colours = [
                    "ghostwhite"    // 0
                ,   "palegreen"     // 1
                ,   "gold"          // 2
                ,   "darkorange"    // 3
                ,   "deeppink"      // 4
                ]
    ;
    
    function getRandomInt (maxExcl) {
        return Math.floor(Math.random() * maxExcl);
    }
    
    // function formatArray (arr) {
    //     return arr
    //             .map(function (num, idx) {
    //                 if (typeof it !== "undefined") return false;
    //                 return idx + "\t" + num;
    //             })
    //             .filter(function (it) {
    //                 return it;
    //             })
    //             .join("\n")
    //     ;
    // }
    
    function Cell (grid, x, y) {
        this.top = null;
        this.right = null;
        this.bottom = null;
        this.left = null;
        this.count = 0;
        this.x = x;
        this.y = y;
        this.grid = grid;
    }
    Cell.prototype = {
        paint:  function () {
            this.grid.context.fillStyle = colours[this.count];
            this.grid.context.fillRect(this.x * PIXEL_SIZE, this.y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
        }
    ,   drop:   function () {
            if (this.count === MAX_GRAINS) return; // you can't pile up higher
            this.count++; // note that this does *not* trigger avalanches, the grid controls that
            this.paint();
        }
    ,   avalanche:  function () {
            if (this.top) this.top.drop();
            if (this.right) this.right.drop();
            if (this.bottom) this.bottom.drop();
            if (this.left) this.left.drop();
            this.count = 0;
            this.paint();
        }
    };
    
    function Grid ($canvas, size, seed) {
        this.cells = [];
        this.size = size;
        this.seed = seed;
        this.context = $canvas[0].getContext("2d");
        this.numTicks = 0;
        this.tickID = null;
        this.handlers = {};
        this.sandVolume = 0;
    }
    Grid.prototype = {
        fillGrid:   function () {
            var prevRow
            ,   prevCell
            ;
            for (var i = 0, n = this.size; i < n; i++) {
                var curRow = [];
                prevCell = null;
                for (var j = 0, m = this.size; j < m; j++) {
                    var cell = new Cell(this, j, i);
                    if (prevRow) {
                        prevRow[j].bottom = cell;
                        cell.top = prevRow[j];
                    }
                    if (prevCell) {
                        prevCell.right = cell;
                        cell.left = prevCell;
                    }
                    curRow.push(cell);
                    cell.paint();
                    prevCell = cell;
                }
                this.cells.push(curRow);
                prevRow = curRow;
            }
        }
    ,   findCritical:   function () {
            var ret = [];
            this.sandVolume = 0;
            for (var i = 0, n = this.cells.length; i < n; i++) {
                for (var j = 0, m = this.cells[i].length; j < m; j++) {
                    var cell = this.cells[i][j];
                    if (cell.count === 4) ret.push(cell);
                    this.sandVolume += cell.count;
                }
            }
            return ret;
        }
    ,   avalanches: function () {
            var duration = 0
            ,   size = 0
            ,   crit = this.findCritical()
            ;
            while (crit.length) {
                duration++;
                size += crit.length;
                for (var i = 0, n = crit.length; i < n; i++) crit[i].avalanche();
                crit = this.findCritical();
            }
            if (size) this.pub("avalanche", { size: size, duration: duration });
        }
    ,   tick:   function () {
            var dropCell;
            if (this.seed === "random")
                dropCell = this.cells[getRandomInt(this.size)][getRandomInt(this.size)];
            else
                dropCell = this.cells[Math.floor(this.size/2)][Math.floor(this.size/2)];
            dropCell.drop();
            this.numTicks++;
            this.pub("tick", { ticks: this.numTicks, volume: this.sandVolume });
            this.avalanches();
            this.tickID = window.requestAnimationFrame(this.tick.bind(this));
        }
    ,   stop:   function () {
            if (this.tickID) window.cancelAnimationFrame(this.tickID);
        }
    ,   pub:    function (type, data) {
            var handlers = this.handlers[type] || [];
            for (var i = 0, n = handlers.length; i < n; i++) handlers[i](type, data);
        }
    ,   sub:    function (type, cb) {
            if (!this.handlers[type]) this.handlers[type] = [];
            this.handlers[type].push(cb);
        }
    };
    
    // Graphing
    function graphSizes () {
        var svg = d3.select("#sandpile-graph-sizes")
                        .attr("width", GRAPH_SIZE + "px")
                        .attr("height", GRAPH_SIZE + "px")
        ,   margin = { top: 20, right: 20, bottom: 30, left: 40 }
        ,   width = GRAPH_SIZE - margin.left - margin.right
        ,   height = GRAPH_SIZE - margin.top - margin.bottom
        ,   x = d3.scale.log()
                    .rangeRound([0, width])
        ,   y = d3.scale.log()
                    .rangeRound([height, 0])
        ,   xAxis = d3.svg.axis()
                        .scale(x)
                        .orient("bottom")
        ,   yAxis = d3.svg.axis()
                        .scale(y)
                        .orient("left")
        ,   data = avSizes.map(function (num, size) {
                                    if (typeof num === "undefined") return false;
                                    // maxSize = size;
                                    // maxNum = (num > maxNum) ? num : maxNum;
                                    return { size: size, number: num };
                                })
                                .filter(function (it) {
                                    return it;
                                })
        ;
        svg.selectAll("*").remove();
        var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        x.domain(d3.extent(data, function (d) { return d.size; })).nice();
        y.domain(d3.extent(data, function (d) { return d.number; })).nice();

        g.append("g")
                .attr("transform", "translate(0," + height + ")")
                .call(xAxis)
            .append("text")
                .attr("x", width)
                .attr("y", -6)
                .attr("class", "label")
                .text("Avalanche Size");
        g.append("g")
                .call(yAxis)
            .append("text")
                .attr("transform", "rotate(-90)")
                .attr("y", 6)
                .attr("dy", ".71em")
                .attr("class", "label")
                .text("Avalanche Number");

        g.selectAll(".dot")
            .data(data)
            .enter().append("circle")
              .attr("class", "dot")
              .attr("r", 3.5)
              .attr("cx", function(d) { return x(d.size); })
              .attr("cy", function(d) { return y(d.number); });
    }
    
    
    // XXX
    //  use more sandy colours?
    //  graph the evolution of the data (volume of sand and distribution)
    //  style disabled better
    //  keep a running count of the number of avalanches
    //  resize grid onchange of the number input field
    //  draw a diagonal to show how close it gets to log-log
    //  instead of a graph button, maybe paint the graph every 10 or 50 avalanches?
    //  put graph and sandpile next to one another (in a table?)
    //  make canvas size constant and pixel size depend on that / size
    //
    // NO REFRESH IN CHROME
    
    // manage the form & grid
    var grid;
    $("#bak").submit(function (ev) {
        var size = $size.val()
        ,   seed = $seed.val()
        ;
        avSizes = [];
        avDurations = [];
        $canvas.attr({ width: size * PIXEL_SIZE, height: size * PIXEL_SIZE });
        $pre.text("n/a");
        ev.preventDefault();
        
        $stop[0].disabled = false;
        $graph[0].disabled = true;
        $run[0].disabled = true;
        grid = new Grid($canvas, size, seed);
        grid.fillGrid();
        grid.sub("avalanche", function (_, data) {
            if (data.size) {
                if (!avSizes[data.size]) avSizes[data.size] = 0;
                avSizes[data.size]++;
                // graphSizes(avSizes);
            }
            if (data.duration) {
                if (!avDurations[data.duration]) avDurations[data.duration] = 0;
                avDurations[data.duration]++;
                // graphDurations(avDurations);
            }
            // XXX this breaks offsets, of course...
            // $pre.text(
            //     formatArray(avSizes) +
            //     "\n------------------------\n" +
            //     formatArray(avDurations)
            // );
        });
        grid.sub("tick", function (_, data) {
            $ticks.text(data.ticks);
            $vol.text(data.volume);
        });
        grid.tick();
    });
    $stop.click(function () {
        if (!grid) return;
        grid.stop();
        $stop[0].disabled = true;
        $graph[0].disabled = false;
        $run[0].disabled = false;
    });
    $graph.click(graphSizes);
}(jQuery, d3));
