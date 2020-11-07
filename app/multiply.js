
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

    for(var i = 2; i <= 12; i++) {
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
