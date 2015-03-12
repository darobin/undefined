

(function ($) {
    var $timeline = $("#timeline")
    ,   $data = $("#timeline-data")
    ,   items = []
    ;
    
    function parseDate (str) {
        var parts = str.split("-")
        ,   ret = {}
        ;
        if (parts[0] && /^\d{4}$/.test(parts[0])) ret.year = parts[0];
        else return null;
        if (parts[1] && /^\d{2}$/.test(parts[1])) ret.month = parts[1];
        if (parts[2] && /^\d{2}$/.test(parts[2])) ret.day = parts[2];
        return ret;
    }
    
    function fmt2 (str) {
        str = "" + str;
        if (str.length >= 2) return str;
        return "0" + str;
    }
    
    function humanDate (date) {
        var str = "";
        if (date.year) str += date.year;
        if (date.month) str += "-" + fmt2(date.month);
        if (date.day) str += "-" + fmt2(date.day);
        return str;
    }
    
    function monthTR (month, $table) {
        var $tr = $("<tr></tr>").attr("id", "tl-" + year + "-" + month);
        $("<th></th>").addClass("month").text(month).appendTo($tr);
        $tr.appendTo($table);
        return $tr;
    }
    
    // extract the data
    $data.find("div").each(function () {
        var $div = $(this)
        ,   date = parseDate($div.attr("data-date"))
        ;
        items.push({
            date: date
        });
    });
    
    // render
    var $table = $("<table></table>")
    ,   firstDate = { year: 2017, month: 3, day: 15}
    ,   lastDate = { year: 1977, month: 3, day: 15}
    ;
    items.map(function (it) {
        if (humanDate(it.date) < humanDate(firstDate)) firstDate = it.date;
        if (humanDate(it.date) > humanDate(lastDate)) lastDate = it.date;
    });
    console.log(firstDate, lastDate);
    for (var year = firstDate.year; year <= lastDate.year; year++) {
        var startMonth = 1
        ,   endMonth = 12
        ,   rowspan = 12
        ;
        if (year == firstDate.year) {
            startMonth = parseInt(firstDate.month, 10);
            rowspan = 12 - (startMonth - 1);
        }
        if (year == lastDate.year) {
            endMonth = parseInt(lastDate.month, 10);
            rowspan = endMonth;
        }
        var $tr = monthTR(fmt2(startMonth), $table);
        $("<th><div></div></th>")
            .attr("rowspan", rowspan)
            .addClass("year")
            .find("div").text(year).end()
            .prependTo($tr)
        ;
        for (var month = startMonth + 1; month <= endMonth; month++) monthTR(fmt2(month), $table);
    }
    $table.appendTo($timeline);
}(jQuery));

