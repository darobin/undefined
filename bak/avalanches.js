/* global d3 */

(function ($, d3) {
    // items
    var $size = $("#sandpile-size")
    ,   $seed = $("#sandpile-seed")
    ,   $canvas = $("#sandpile")
    ,   $run = $("#sandpile-run")
    ,   $stop = $("#sandpile-stop")
    ,   $ticks = $("#sandpile-ticks")
    ,   $avNum = $("#sandpile-avnum")
    ,   MAX_GRAINS = 4
    ,   GRAPH_SIZE = 450
    ,   GRAPH_UPDATE = 10
    //  number of grains of sand in a cell
    ,   colours = [
                    "ghostwhite"    // 0
                ,   "palegreen"     // 1
                ,   "gold"          // 2
                ,   "darkorange"    // 3
                ,   "deeppink"      // 4 (this gets painted over before showing)
                ]
    ;
    
    function getRandomInt (maxExcl) {
        return Math.floor(Math.random() * maxExcl);
    }
    
    function Cell (grid, x, y) {
        this.top = null;
        this.right = null;
        this.bottom = null;
        this.left = null;
        this.count = 0;
        this.x = x;
        this.y = y;
        this.context = grid.context;
        this.scale = grid.scale;
    }
    Cell.prototype = {
        paint:  function () {
            this.context.fillStyle = colours[this.count];
            this.context.fillRect(this.x * this.scale, this.y * this.scale, this.scale, this.scale);
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
        this.scale = GRAPH_SIZE / size;
        this.seed = seed;
        this.context = $canvas[0].getContext("2d");
        this.numTicks = 0;
        this.tickID = null;
        this.handlers = {};
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
            for (var i = 0, n = this.cells.length; i < n; i++) {
                for (var j = 0, m = this.cells[i].length; j < m; j++) {
                    var cell = this.cells[i][j];
                    if (cell.count === 4) ret.push(cell);
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
            this.pub("tick", { ticks: this.numTicks });
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
    function graphSizes (avSizes) {
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
                .text("Number of Avalanches");

        g.selectAll(".dot")
            .data(data)
            .enter().append("circle")
              .attr("class", "dot")
              .attr("r", 3.5)
              .attr("cx", function(d) { return x(d.size); })
              .attr("cy", function(d) { return y(d.number); });
    }
    
    
    // XXX
    //
    // NO REFRESH IN CHROME
    
    // manage the form & grid
    var grid;
    $("#bak").submit(function (ev) {
        var size = $size.val()
        ,   seed = $seed.val()
        ,   avNum = 0
        ,   avSizes = []
        // ,   avDurations = []
        ;
        ev.preventDefault();
        $("#sandpile-graph-sizes").empty();
        $avNum.text(avNum);
        
        $stop[0].disabled = false;
        $run[0].disabled = true;
        grid = new Grid($canvas, size, seed);
        grid.fillGrid();
        grid.sub("avalanche", function (_, data) {
            if (data.size) {
                if (!avSizes[data.size]) avSizes[data.size] = 0;
                avSizes[data.size]++;
                if (avNum % GRAPH_UPDATE === 0) graphSizes(avSizes);
            }
            // if (data.duration) {
            //     if (!avDurations[data.duration]) avDurations[data.duration] = 0;
            //     avDurations[data.duration]++;
            //     graphDurations(avDurations);
            // }
            avNum++;
            $avNum.text(avNum);
        });
        grid.sub("tick", function (_, data) {
            $ticks.text(data.ticks);
        });
        grid.tick();
    });
    $stop.click(function () {
        if (!grid) return;
        grid.stop();
        $stop[0].disabled = true;
        $run[0].disabled = false;
    });
}(jQuery, d3));
