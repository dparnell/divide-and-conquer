/*
 * Application JS here
 */


/*
	By Osvaldas Valutis, www.osvaldas.info
	Available for use under the MIT License
*/

;( function ( document, window, index )
{
	  var s = (document.body || document.documentElement).style, prefixAnimation = "", prefixTransition = "";

	if( s.WebkitAnimation === "" )	prefixAnimation	 = "-webkit-";
	if( s.MozAnimation === "" )		prefixAnimation	 = "-moz-";
	if( s.OAnimation === "" )		prefixAnimation	 = "-o-";

	if( s.WebkitTransition === "" )	prefixTransition = "-webkit-";
	if( s.MozTransition === "" )		prefixTransition = "-moz-";
	if( s.OTransition === "" )		prefixTransition = "-o-";

	Object.prototype.onCSSAnimationEnd = function( callback )
	{
		var runOnce = function( e ){ callback(); e.target.removeEventListener( e.type, runOnce ); };
		this.addEventListener( "webkitAnimationEnd", runOnce );
		this.addEventListener( "mozAnimationEnd", runOnce );
		this.addEventListener( "oAnimationEnd", runOnce );
		this.addEventListener( "oanimationend", runOnce );
		this.addEventListener( "animationend", runOnce );
		if( ( prefixAnimation === "" && !( "animation" in s ) ) || getComputedStyle( this )[ prefixAnimation + "animation-duration" ] == "0s" ) callback();
		return this;
	};

	Object.prototype.onCSSTransitionEnd = function( callback )
	{
		var runOnce = function( e ){ callback(); e.target.removeEventListener( e.type, runOnce ); };
		this.addEventListener( "webkitTransitionEnd", runOnce );
		this.addEventListener( "mozTransitionEnd", runOnce );
		this.addEventListener( "oTransitionEnd", runOnce );
		this.addEventListener( "transitionend", runOnce );
		this.addEventListener( "transitionend", runOnce );
		if( ( prefixTransition === "" && !( "transition" in s ) ) || getComputedStyle( this )[ prefixTransition + "transition-duration" ] == "0s" ) callback();
		return this;
	};
}( document, window, 0 ));

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

// a simple promise
function P() {
    this.resolved_value = undefined;
    this.resolved = false;
    this.failed_value = undefined;
    this.failed = false;
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
        f(rejected_value);
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

function addClass(e, c) {
    e.setAttribute("class", e.getAttribute("class") + " " + c);

    return e;
}

function removeClass(e, c) {
    var klasses = e.getAttribute("class").split(" ");
    e.setAttribute("class", klasses.filter(function(klass) { return klass != c; }).join(" "));
    return e;
}

function kill(e) {
    var result = new P();
    addClass(e, "fade");
    e.onCSSAnimationEnd(function() {
        r(e);
        result.resolve();
    });

    return result;
}

function ask(m) {
    var result = new P();
    var dlg = e("div", {class: "ask dialog visible"});
    a(dlg, t(e("h1"), m));
    var txt = e("input", {type: "text"});
    a(dlg, txt);
    var btn = t(e("button"), "Okay");
    a(dlg, btn);

    btn.onclick = function() {
        if(txt.value) {
            kill(dlg).then(function() {
                result.resolve(txt.value);
            });
        }
    };

    a(document.body, dlg);

    return result;
}

function play_game(table) {
    var result = new P();
    ask("Play Game - " + table).then(function(value) {
        result.resolve(value);
    });

    return result;
}

function show_menu(player_name) {
    var result = new P();
    var dlg = e("div", {class: "menu dialog visible"});
    a(dlg, t(e("h1"), "Hi " + player_name+"! Choose your divisor"));

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
    return result;
}

function game_loop(player_name) {
    show_menu(player_name).then(play_game).then(function() {
        game_loop(player_name);
    });
}

function start_game() {
    ask("What is your name?").then(game_loop);
}

start_game();
