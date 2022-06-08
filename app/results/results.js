/*
 * Some simple DOM manipulation functions
 */

// append an element
function a(p, e) {
    p.appendChild(e);

    return e;
}

// remove a child element
function r(e) {
    e.parentNode.removeChild(e);
}

// set element text
function t(e, c) {
    e.innerText = c;
    return e;
}

// set element html
function h(e, c) {
    e.innerHTML = c;
    return e;
}

function clear(e) {
    h(e, "");
}

// find an element by id
function f(i) {
    return document.getElementById(i);
}

// create an element
function e(type, atts) {
    var element = document.createElement(type);
    if(atts) {
        for(var a in atts) {
            element.setAttribute(a, atts[a]);
        }
    }

    return element;
}

function addClass(e, c) {
    var existing = e.getAttribute("class");
    e.setAttribute("class",  existing == null ? c : existing + " " + c);

    return e;
}

function removeClass(e, c) {
    var klasses = e.getAttribute("class").split(" ");
    e.setAttribute("class", klasses.filter(function(klass) { return klass != c; }).join(" "));
    return e;
}

/*
 * A very simplistic promise object
 */

function P() {
    this.resolved_value = undefined;
    this.resolved = false;
    this.rejected_value = undefined;
    this.rejected = false;
    this.ok = [];
    this.nope = [];
}

P.prototype.then = function(f) {
    if(this.resolved) {
        f(this.resolved_value);
    } else {
        this.ok.push(f);
    }

    return this;
};

P.prototype.fail = function(f) {
    if(this.rejected) {
        f(this.rejected_value);
    } else {
        this.nope.push(f);
    }
};

P.prototype.resolve = function() {
    if(!this.resolved && !this.rejected) {
        this.resolved_value = arguments;
        this.resolved = true;

        var L = this.ok.length;
        for(var i=0; i<L; i++) {
            var r = this.ok[i].apply(null, this.resolved_value);
            if(r) {
                if(r instanceof P) {
                    // handle the case where a then returns a new promise
                    r.ok = r.ok.concat(this.ok.slice(i + 1));
                    return this;
                } else {
                    this.resolved_value = [r];
                }
            }
        }
    }

    return this;
};

P.prototype.reject = function(v) {
    if(!this.rejected && !this.resolved) {
        this.rejected_value = v;
        this.rejected = true;

        var L = this.nope.length;
        for(var i=0; i<L; i++) {
            this.nope[i](v);
        }
    }

    return this;
};


function make_successful(index, output, dec_done) {
    return function(value) {
        output[index] = value;

        dec_done();
    };
}

function when() {
    var result = new P();
    var L = arguments.length;
    var output = [];

    var failed = function(e) {
        result.reject(e);
    };
    var done = L;
    var dec_done = function () {
        done = done - 1;

        if(done == 0) {
            result.resolve.apply(result, output);
        }
    };

    for(var i=0; i<L; i++) {
        output.push(undefined);
        var p = arguments[i];
        p.then(make_successful(i, output, dec_done)).fail(failed);
    }

    return result;
}

/*
 * AJAX code
 */

function ajax(method, url, obj) {
    var result = new P();

    var xmlhttp;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
    } else {
        // code for older browsers
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function() {
        if(this.readyState == 4) {
            if(this.status >= 200 && this.status <= 299) {
                result.resolve(JSON.parse(this.responseText));
            } else {
                result.reject(this.responseText);
            }
        }
    };

    if(obj && method == "GET") {
        var str = [];
        for(var p in obj) {
            if(obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        }

        if(url.indexOf("?") == -1) {
            url += "?";
        } else {
            url += "&";
        }

        url += str.join("&");
    }

    xmlhttp.open(method, url, true);
    if(obj && method != "GET") {
        xmlhttp.setRequestHeader("Content-Type", "application/json");
        xmlhttp.send(JSON.stringify(obj));
    } else {
        xmlhttp.send();
    }

    return result;
}

// excel export adapted from here: https://javascript.tutorialink.com/how-to-export-an-html-table-as-a-xlsx-file/

function make_export_link(name, table, link) {
    var uri = 'data:application/vnd.ms-excel;base64,',
      template = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>{worksheet}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>{table}</body></html>',
      base64 = function(s) {
        return window.btoa(unescape(encodeURIComponent(s)))
      };

    var data = template.replace("{worksheet}", name).replace("{table}", table.outerHTML);
    link.download = "export.xls";
    link.href = uri + base64(data);
}

// data access methods

function fetch_data(query, options) {
    var now = new Date();
    var params = Object.assign({q: query, _: now.getTime()}, options || {});
    return ajax("GET", "../db.php", params);
}

function fetch_cohorts() {
    return fetch_data("cohorts");
}

function fetch_names(cohort) {
    return fetch_data("names", {cohort: cohort});
}

function fetch_tables() {
    return fetch_data("tables");
}

function order_rows_by_last_name(rows) {
    return rows.sort(function(a, b) {
        var ap = a.name.trim().toUpperCase().split(" ");
        var bp = b.name.trim().toUpperCase().split(" ");

        var result = ap[1].localeCompare(bp[1]);
        if(result === 0) {
            result = ap[0].localeCompare(bp[0]);
        }

        return result;
    });
}

function render_results(root, result, rows) {
    clear(root);
    var date = new Date(result.inserted_at * 1000);

    a(root, t(e("h3"), "Details for " + result.name + " table " + result.times_table + " entered at " + date.toLocaleString()));

    var table = e("table");
    var tr = e("tr");
    a(tr, t(e("th", {align: "left"}), "Question"));
    a(tr, t(e("th", {align: "right"}), "Answer Given"));
    a(tr, t(e("th", {align: "right"}), "Corrent Answer"));
    a(tr, t(e("th", {align: "right"}), "Time Taken"));

    a(table, tr);
    for(var i=0; i<rows.length; i++) {
        var row = rows[i];
        tr = e("tr");

        var answer = rows[i];
        a(tr, h(e("td", {align: "left"}), "What is " + row.value_1 + " " + row.operation + " " + row.value_2 + " ?"));
        a(tr, t(e("td", {align: "right"}), row.given_answer));
        a(tr, t(e("td", {align: "right"}), row.correct_answer));
        a(tr, t(e("td", {align: "right"}), row.time_taken.toFixed(2)));

        if(row.given_answer == row.correct_answer) {
            addClass(tr, "correct");
        } else {
            addClass(tr, "wrong");
        }

        a(table, tr);
    }

    a(root, table);
}

function scoreClass(correct) {
    if(correct === null || correct == "-") {
        return "pink";
    }

    if(correct <= 6) {
        return "pink";
    } else if(correct <= 9) {
        return "yellow";
    }

    return "green";
}

function build_student_table_summary(root, student, rows) {
    clear(root);
    a(root, t(e("h3"), "Table summary for " + student));

    var table_element = e("table");
    var current_table = null;
    var current_tr = null;
    var detail = e("div");

    function make_handle_click(row) {
        return function() {
            clear(detail);
            t(detail, "Loading...");

            fetch_data("results", {id: row.id}).then(function(results) {
                row.name = student;
                render_results(detail, row, results);
            });
        };
    }

    var header = e("tr");
    a(header, t(e("th"), "Table"));
    a(table_element, header);

    for(var i=0; i<rows.length; i++) {
        var row = rows[i];
        if(current_table != row.times_table) {
            current_table = row.times_table;

            current_tr = e("tr");
            a(current_tr, t(e("th", {align: "left"}), row.times_table));
            a(table_element, current_tr);
        }

        var td = t(e("td", {align: "right", title: "Time taken: " + row.time_taken.toFixed(2)}), row.number_correct);
        addClass(td, scoreClass(row.number_correct));
        td.onclick = make_handle_click(row);
        a(current_tr, td);
    }

    a(root, table_element);
    a(root, detail);
}

function build_all_student_table_summary(root, cohort, table, rows) {
    clear(root);
    a(root, t(e("h3"), cohort + " whole class summary for table: " + table));

    order_rows_by_last_name(rows);

    var table_element = e("table");
    var current_student = null;
    var current_tr = null;
    var detail = e("div");

    function make_handle_click(row) {
        return function() {
            clear(detail);
            t(detail, "Working...");

            fetch_data("results", {id: row.id}).then(function(results) {
                render_results(detail, row, results);
            });
        };
    }

    for(var i=0; i<rows.length; i++) {
        var row = rows[i];
        if(current_student != row.name) {
            current_student = row.name;

            current_tr = e("tr");
            a(current_tr, t(e("th", {align: "left"}), row.name));
            a(table_element, current_tr);
        }

        var td = t(e("td", {align: "right", title: "Time taken: " + row.time_taken.toFixed(2)}), row.number_correct);
        addClass(td, scoreClass(row.number_correct));
        td.onclick = make_handle_click(row);
        a(current_tr, td);
    }

    a(root, table_element);
    a(root, detail);
}

function build_all_tables_summary(root, rows, report) {
    clear(root);
    var min;
    var max;
    var title;

    if(report == '-') {
        a(root, t(e("h3"), "Whole class summary for all tables"));
        min = 1;
        max = 12;
        title = "All Tables";
    } else {
        a(root, t(e("h3"), "Whole class summary for tables 1 through 10"));
        min = 1;
        max = 10;
        title = "Tables 1-10";
    }

    if(rows.length == 0) {
        var div = t(e("div"), "No data found");
        a(root, div);
    } else {
        order_rows_by_last_name(rows);

        var table = e("table");
        var tr = e("tr");
        var i, j;
        var th = h(e("th"), "&nbsp;");
        a(tr, th);
        for(i=min; i<=max; i++) {
            th = t(e("th"), i);
            a(tr, th);
        }
        a(tr, t(e("th"), "Total"));

        a(table, tr);

        for(i=0; i<rows.length; i++) {
            var row = rows[i];
            tr = e("tr");
            a(tr, t(e("th"), row.name));

            var total = 0;
            for(j=min; j<=max; j++) {
                var key = "d" + (j<10 ? "0" + j : j);
                var score = row[key];

                if(score === null) {
                    score = "-";
                } else {
                    total = total + Number(score);
                }

                var td = addClass(t(e("td", {align: score == "-" ? "center" : "right"}), score), scoreClass(score));
                a(tr, td);
            }
            a(tr, t(e("td", {align: "right"}), total));

            a(table, tr);
        }

        a(root, table);

        var link = t(e("a"), "Export");
        make_export_link(title, table, link);
        a(root, link);
    }
}

function summary_report(root, cohort, student, name, table) {
    clear(root);
    t(root, "Loading...");

    if(student == "-" && (table == "-" || table=='+'))  {
        // summary for all students across all tables
        fetch_data("all_tables_summary", {cohort: cohort}).then(function(rows) {
            build_all_tables_summary(root, rows, table);
        });
    } else if(student == "-" && table != "-") {
        // summary for all students for a given table
        fetch_data("all_student_table_summary", {cohort: cohort, table: table}).then(function(rows) {
            build_all_student_table_summary(root, cohort, table, rows);
        });
    } else if(student != "-" && table == "-") {
        // summary for a given student across all tables
        fetch_data("student_table_summary", {student_id: student}).then(function(rows) {
            build_student_table_summary(root, name, rows);
        });
    } else {
        // summary for a given student for a given table
        t(root, "Not implemented")
    }
}

function build_ui(cohorts, tables) {
    var root = f("app");
    clear(root);

    var i;
    var param_row = e("div");

    a(param_row, t(e("label"), "Choose a cohort:"));
    var cohort_select = e("select", {class: "margin-right-1"});
    for(i=0; i<cohorts.length; i++) {
        var cohort = cohorts[i][0];
        a(cohort_select, t(e("option", {value: cohort}), cohort));
    }
    a(param_row, cohort_select);

    a(param_row, t(e("label"), "Choose a student:"));
    var student_select = e("select", {class: "margin-right-1"});
    a(param_row, student_select);

    function load_students() {
        fetch_names(cohort_select.value).then(function(names) {
            student_select.innerHTML = "";
            a(student_select, t(e("option", {value: "-"}), "All Students"));
            for(i=0; i<names.length; i++) {
                a(student_select, t(e("option", {value: names[i][0]}), names[i][1]));
            }
        });
    }

    cohort_select.onchange = load_students;

    if(cohorts.length > 0) {
        load_students();
    }

    a(param_row, t(e("label"), "Times Table:"));
    var table_select = e("select", {class: "margin-right-1"});
    a(table_select, t(e("option", {value: "-"}), "All Tables"));
    a(table_select, t(e("option", {value: "+"}), "Tables 1 to 10"));
    for(i=0; i<tables.length; i++) {
        var table = tables[i][0];
        a(table_select, t(e("option", {value: table}), table));
    }
    a(param_row, table_select);

    var summary_btn = t(e("button"), "Summary");
    a(param_row, summary_btn);

    a(root, param_row);
    var report_area = e("div", {class: "report-area"});
    a(root, report_area);

    summary_btn.onclick = function() {
        summary_report(report_area, cohort_select.value, student_select.value, student_select.selectedOptions[0].text, table_select.value);
    };

}

when(fetch_cohorts(), fetch_tables()).then(build_ui);
