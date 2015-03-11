
(function ($) {
    // items
    var $size = $("#sandpile-size")
    ,   $seed = $("#sandpile-seed")
    ,   $canvas = $("#sandpile")
    ,   $run = $("#sandpile-run")
    ,   $stop = $("#sandpile-stop")
    ,   $pre = $("#sandpile-report")
    ,   $ticks = $("#sandpile-ticks")
    ,   $vol = $("#sandpile-volume")
    ,   MAX_GRAINS = 4
    ,   PIXEL_SIZE = 3
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
        return Math.floor(Math.random() * (maxExcl - 1));
    }
    
    function formatArray (arr) {
        return arr
                .map(function (num, idx) {
                    if (typeof it !== "undefined") return false;
                    return idx + "\t" + num;
                })
                .filter(function (it) {
                    return it;
                })
                .join("\n")
        ;
    }
    
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
    
    // XXX
    //  more metrics:
    //      - distance travelled by avalanche?
    //      - ratio of size to duration
    //  use more sandy colours?
    //  the canary needs to be the offset of the last header
    //  graph the evolution of the data (volume of sand and distribution)
    //  off by one: the last row is never touched?
    
    // manage the form & grid
    var grid;
    $("#bak").submit(function (ev) {
        var size = $size.val()
        ,   seed = $seed.val()
        ,   avSizes = []
        ,   avDurations = []
        ;
        $canvas.attr({ width: size * PIXEL_SIZE, height: size * PIXEL_SIZE });
        $pre.text("n/a");
        ev.preventDefault();
        
        $stop[0].disabled = false;
        $run[0].disabled = true;
        grid = new Grid($canvas, size, seed);
        grid.fillGrid();
        grid.sub("avalanche", function (_, data) {
            if (!avSizes[data.size]) avSizes[data.size] = 0;
            if (!avDurations[data.duration]) avDurations[data.duration] = 0;
            if (data.size) avSizes[data.size]++;
            if (data.duration) avDurations[data.duration]++;
            // XXX this breaks offsets, of course...
            $pre.text(
                formatArray(avSizes) +
                "\n------------------------\n" +
                formatArray(avDurations)
            );
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
        $run[0].disabled = false;
    });
}(jQuery));
