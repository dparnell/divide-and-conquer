
document.title = "Multiply";

window.showMenu = function(dlg, result) {
    a(dlg, t(e("p"), "Choose a times table"));

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


window.buildQuestions = function(table) {
    var i, questions;

    questions = [];
    for(i = 0; i <= 12; i++) {
        questions.push({
            correct_answer: i * table,
            value_1: i,
            value_2: table,
            operation: "&times;"
        });
    }

    return questions;
};

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

    for(i=2; i<=12; i++) {
        ss = i.toString();
        div = e("div", {class: "score-section"});
        a(dlg, div);
        a(div, t(e("h2"), "Multiply by " + i));
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

    a(dlg, e("br", {style: "clear: both"}));
};
