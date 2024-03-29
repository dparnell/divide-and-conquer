/*
 * Application JS here
 */

/*
  Based on CSS Animation code by Osvaldas Valutis, www.osvaldas.info
  Available for use under the MIT License
*/

;( function ( document, window, index )
   {
       var s = (document.body || document.documentElement).style, prefixAnimation = "", prefixTransition = "";

       if( s.WebkitAnimation === "" ) prefixAnimation  = "-webkit-";
       if( s.MozAnimation === "" )    prefixAnimation  = "-moz-";
       if( s.OAnimation === "" )    prefixAnimation  = "-o-";

       if( s.WebkitTransition === "" )  prefixTransition = "-webkit-";
       if( s.MozTransition === "" )   prefixTransition = "-moz-";
       if( s.OTransition === "" )   prefixTransition = "-o-";

       window.onCSSAnimationEnd = function( that, callback )
       {
           var runOnce = function( e ){ callback(); e.target.removeEventListener( e.type, runOnce ); };
           that.addEventListener( "webkitAnimationEnd", runOnce );
           that.addEventListener( "mozAnimationEnd", runOnce );
           that.addEventListener( "oAnimationEnd", runOnce );
           that.addEventListener( "oanimationend", runOnce );
           that.addEventListener( "animationend", runOnce );
           if( ( prefixAnimation === "" && !( "animation" in s ) ) || window.getComputedStyle( that )[ prefixAnimation + "animation-duration" ] == "0s" ) callback();
           return that;
       };
   }( document, window, 0 ));

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
    e.setAttribute("class", e.getAttribute("class") + " " + c);

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
        this.not.push(f);
    }
};

P.prototype.resolve = function(v) {
    if(!this.resolved && !this.rejected) {
        this.resolved_value = v;
        this.resolved = true;

        var L = this.ok.length;
        for(var i=0; i<L; i++) {
            var r = this.ok[i](v);
            if(r) {
                if(r instanceof P) {
                    // handle the case where a then returns a new promise
                    r.ok = r.ok.concat(this.ok.slice(i + 1));
                    return this;
                } else {
                    this.resolved_value = v = r;
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

/*
 * Utility functions
 */

function kill(e) {
    var result = new P();
    addClass(e, "fade");
    window.onCSSAnimationEnd(e, function() {
        r(e);
        result.resolve();
    });

    return result;
}

function ask(m, validate) {
    var result = new P();
    var dlg = e("div", {class: "ask dialog visible"});
    a(dlg, t(e("h1"), m));
    var txt = e("input", {type: "text"});
    a(dlg, txt);
    var btn = t(e("button"), "Okay");
    a(dlg, btn);

    function done() {
        let v = txt.value;
        if(validate && !validate(v)) {
            return;
        }

        if(v) {
            kill(dlg).then(function() {
                result.resolve(txt.value);
            });
        }
    }

    btn.onclick = done;

    a(document.body, dlg);
    txt.focus();
    txt.onkeypress = function(e) {
        if(e.keyCode == 13) {
            done();
        }
    };

    return result;
}

function shuffle(array) {
    // stolen from here: https://www.frankmitchell.org/2015/01/fisher-yates/
    var i = 0, j = 0, temp = null;
    for (i = array.length - 1; i > 0; i -= 1) {
        j = Math.floor(Math.random() * (i + 1));
        temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }

    return array;
}

/*
 *  The actual game starts here
 */

window.timeLimit = 0;
window.disableHighScoreTable = false;


window.buildQuestionUIBuilder = function(dlg) {
    var h1 = e("h1");
    a(dlg, h1);

    return function(q) {
        h(h1, "What is " + q.value_1 + " " + q.operation + " " + q.value_2 + " ?");
    };
};


window.buildQuestions = function(table) {
    var i, questions;

    questions = [];
    for(i = 0; i <= 12; i++) {
        questions.push({
            correct_answer: i,
            value_1: i * table,
            value_2: table,
            operation: "&divide;"
        });
    }

    return questions;
};

function play_game(table) {
    var result = new P();
    var i, questions;


    questions = window.buildQuestions(table);
    shuffle(questions);

    function the_time() {
        return (new Date()).getTime() / 1000;
    }

    var dlg = e("div", {class: "ask dialog visible"});
    var buildQuestionUI = window.buildQuestionUIBuilder(dlg);
    var h1 = e("h1");
    a(dlg, h1);
    var txt = e("input", {type: "text"});
    a(dlg, txt);
    var btn = t(e("button"), "Okay");
    a(dlg, btn);


    var results = [];
    var question = null;
    var start_time = null;

    function done() {
        if(txt.value) {
            var end_time = the_time();

            results.push(Object.assign({
                given_answer: Number(txt.value),
                time_taken: end_time - start_time
            }, question));

            next_question();
        }
    }

    btn.onclick = done;
    var timer;
    if(window.timeLimit) {
        timer = window.setTimeout(function() {
            result.resolve({message: "Times Up!", results: results});
        }, window.timeLimit * 1000);
    } else {
        timer = null;
    }

    a(document.body, dlg);
    txt.focus();
    txt.onkeydown = function(e) {
        if(e.keyCode == 8 || e.keyCode == 13 || (e.keyCode >= 48 && e.keyCode <= 57)) {
            // do nothing;
        } else {
            e.preventDefault();
            e.stopPropagation();
        }
    };

    txt.onkeypress = function(e) {
        if(e.keyCode == 13) {
            done();
        }
    };

    function next_question() {
        if(questions.length === 0) {
            if(timer) {
                window.clearTimeout(timer);
            }

            kill(dlg).then(function() {
                result.resolve({table: table, results: results});
            });
        } else {
            question = questions.pop();
            start_time = the_time();

            buildQuestionUI(question);

            txt.value = "";
            txt.focus();
        }
    }

    next_question();

    return result;
}

window.showMenu = function(dlg, result) {
    a(dlg, t(e("p"), "Choose your divisor"));

    function make_menu_item(index) {
        var btn = t(e("button"), index);
        btn.onclick = function() {
            kill(dlg).then(function() {
                result.resolve(index);
            });
        };
        a(dlg, btn);
    }

    for(var i = 1; i <= 12; i++) {
        make_menu_item(i);
    }

    a(document.body, dlg);
};

function show_menu(player_name) {
    var result = new P();
    var dlg = e("div", {class: "menu dialog visible"});
    a(dlg, t(e("h1"), "Hi " + player_name));

    window.showMenu(dlg, result);

    return result;
}

function format(n) {
    return n.toFixed(2);
}

function show_results(results) {
    var next = new P();

    var dlg = e("div", {class: "results dialog visible"});
    var h1 = e("h1");
    var answer, result, is_correct, correct_count, total_time;
    a(dlg, h1);

    total_time = 0;
    var count = results.results.length;
    correct_count = 0;
    for(var i=0; i<count; i++) {
        result = results.results[i];
        is_correct = result.given_answer === result.correct_answer;
        if(is_correct) {
            correct_count++;
        }
        answer = e("div", {class: is_correct ? "correct" : "wrong"});
        a(dlg, h(answer, result.value_1 + " " + result.operation + " " + result.value_2 + " = " + result.given_answer + " in " + format(result.time_taken) + "s"));
        total_time += result.time_taken;
    }

    results.correct_count = correct_count;
    results.total_time = total_time;

    a(dlg, t(e("div"), "You took " + format(total_time) + " seconds"));

    if(correct_count == count) {
        t(h1, "Congratulations. You got them all correct!");
    } else {
        t(h1, "You got " + correct_count + " out of " + count + " correct");
    }

    var btn = t(e("button"), "Okay");
    btn.setAttribute("disabled", "disabled");

    var scores = null;

    a(dlg, btn);
    btn.onclick = function() {
        kill(dlg).then(function() {
            next.resolve(scores);
        });
    };

    a(document.body, dlg);


    ajax("POST", "db.php", results).then(function(the_scores) {
        scores = the_scores;
        btn.removeAttribute("disabled");
    });

    return next;
}

window.renderHighScoreTable = function(dlg, scores) {
    var best = {};
    var i, j, L = scores.length;
    var s, aa, ss;

    for(i=0; i<L; i++) {
        s = scores[i];
        ss = s[0].toString();

        aa = best[ss];
        if(!aa) {
            aa = best[ss] = [];
        }

        aa.push(s);
    }

    var div, ul, li, n;

    for(i=1; i<=12; i++) {
        ss = i.toString();
        div = e("div", {class: "score-section"});
        a(dlg, div);
        a(div, t(e("h2"), "Divide by " + i));
        ul = e("ul", {class: "scores"});
        for(j=0; j<5; j++) {
            aa = best[ss];
            li = a(ul, e("li", {class: "score-item"}));
            if(aa && aa[j]) {
                a(li, t(e("span", {class: "player-name"}), aa[j][1]));
                a(li, t(e("span", {class: "score"}), aa[j][2].toFixed(2)));
            } else {
                a(li, t(e("span", {class: "nothing"}), "-"));
            }
        }
        a(div, ul);
    }
};

function show_high_scores(scores) {
    var next = new P();

    if(window.disableHighScoreTable) {
        window.setTimeout(function() {
            next.resolve();
        }, 10);
    } else {
        var dlg = e("div", {class: "results dialog visible"});
        a(dlg, t(e("h1"), "Best Scores"));

        window.renderHighScoreTable(dlg, scores);

        var btn = t(e("button"), "Okay");

        a(dlg, btn);
        btn.onclick = function() {
            kill(dlg).then(function() {
                next.resolve();
            });
        };

        a(document.body, dlg);

    }
    return next;
}

function game_loop(student_id, player_name) {
    show_menu(player_name).then(play_game).then(function(results) {
        results.student_id = student_id;

        show_results(results).then(show_high_scores).then(function() {
            game_loop(student_id, player_name);
        });
    });
}

function start_game() {
    var dlg = e("div", {class: "ask dialog visible"});
    a(dlg, t(e("h1"), "Who are you?"));
    a(dlg, t(e("div"), "First Name"));
    var first = e("input", {type: "text"});
    a(dlg, first);
    a(dlg, t(e("div"), "Last Name"));
    var last = e("input", {type: "text"});
    a(dlg, last);
    a(dlg, t(e("div"), "Class"));
    var cohort = e("input", {type: "text"});
    a(dlg, cohort);

    var btn = t(e("button"), "Okay");
    a(dlg, btn);

    function done() {
        if(first.value && last.value && cohort.value) {
            var now = new Date();
            var params = Object.assign({q: "login", _: now.getTime()}, {first_name: first.value, last_name: last.value, cohort: cohort.value});
            ajax("GET", "db.php", params).then(function(rows) {
                if(rows.length === 1) {
                    kill(dlg);
                    game_loop(rows[0][0], first.value + " " + last.value)
                } else {
                    alert("Unknown student details. Please see your teacher for your details");
                }
            });
        }
    }

    btn.onclick = done;

    a(document.body, dlg);
    first.focus();
    first.onkeypress = last.onkeypress = cohort.onkeydown = function(e) {
        if(e.keyCode == 13) {
            done();
        }
    };
}

start_game();
