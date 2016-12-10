/**
 * Wow, I have seriously not done most of the stuff in here before:
 * I've always used jQuery animations, so I've never done anything with pure Javascript, but I'm pretty happy with what I came up with.
 * Prototypes! I've never done prototypes before. They are... actually really awesome. I know other languages have started adding something similar, but nowhere near as clean as with JS.
 * addEventListener is weird, and I might not be using it right. I have used something similar in jQuery, which is a lot less weird.
 */




/* Global variables */
var cachedPages = {};




/* Prototype extensions. */
Number.prototype.zeroPad = function(num) {
    var asString = this.valueOf().toString();
    var neededZeros = num - asString.length;

    while (neededZeros-- > 0)
        asString = '0' + asString;

    return asString;
};

String.prototype.mainFromHTML = function() { return this.replace(/[\s\S]*\<main id="main"\>([\s\S]*)\<\/main\>[\s\S]*/, "$1"); }
String.prototype.titleFromHTML = function() { return this.replace(/[\s\S]*\<title\>([\s\S]*)\<\/title\>[\s\S]*/, "$1"); }




/* Set theme function */
function setTheme(themeId) {
    if ([1,2].indexOf(Number(themeId)) === -1) themeId = 1;

    localStorage.setItem('themeId', themeId);
    document.getElementById('themedCSS').setAttribute('href', '/theme' + themeId + '.css');
}




/* Page transition function
/* This is a fun one. Loads pageUrl (can be in any format that is accepted by xmlHttpRequest), extracts the stuff in #main, and then replaces the existing #main with the new stuff.
 * The good stuff, and the main reason for including it, is the page transition. Different options are available, though redrawing iframes is super difficult, so you want to try to be fairly light with the animation. After a bit of playing, I've implemented three effects:
 * The old page fades out and slides out to the left (like a book)
 * The new page fades in and slides in from the right (like a book)
 * The body's height adjusts slowly in order to make this transition less jarring. */
function loadPage(pageUrl, history) {
    var history = typeof history === 'undefined' || history;

    /*    if (pageUrl in cachedPages) {
     content = cachedPages[pageUrl].content;
     pageTitle = cachedPages[pageUrl].pageTitle;
     }
     else {*/
    content = false;

    xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", pageUrl, true);
    xmlhttp.send();
//    }

    var resizeFactor = .96;
    var resizeTarget = document.getElementById("main");
    resizeTarget.parentNode.style.height = resizeTarget.scrollHeight + 'px';

//    resizeTarget.style.zoom = 1;
    resizeTarget.style.opacity = 1;

    var timer = setInterval(function() {
        resizeTarget.style.opacity = resizeFactor * resizeTarget.style.opacity;
        resizeTarget.style.left = (resizeTarget.style.opacity - 1) * 100 + "%";

        /*
         resizeTarget.style.zoom = resizeFactor * resizeTarget.style.zoom;
         resizeTarget.style.width = resizeTarget.style.zoom * 100 + "%"; */

        if (resizeTarget.style.opacity < .1) {
            clearInterval(timer);

            resizeTarget.innerHTML = "";

            function showNew(responseText, pageTitle) {
                if (history) {
                    window.history.pushState({
                        "html": responseText,
                        "pageTitle": pageTitle
                    }, pageTitle, pageUrl);
                }

                resizeTarget.innerHTML = responseText;
                document.title = pageTitle;

                resizeTarget.style.left = 100 + "%";

                var timer2 = setInterval(function() {
                    resizeTarget.style.opacity = (2 - resizeFactor) * resizeTarget.style.opacity;
                    resizeTarget.style.left = (1 - resizeTarget.style.opacity) * 100 + "%";

                    if (resizeTarget.style.opacity > .9999) {
                        clearInterval(timer2);

                        resizeTarget.style.opacity = 1;
                        resizeTarget.style.left = "0%";
                    }
                }, 10);

                var timer3 = setInterval(function() {
                    // ...Second try, eff yeah! (Seriously, this is probably the weirdest line of code I've written in a long while.)
                    resizeTarget.parentNode.style.height = parseFloat(resizeTarget.parentNode.style.height) + (1 - resizeFactor) * (resizeTarget.scrollHeight - parseFloat(resizeTarget.parentNode.style.height)) + 'px';

                    if (Math.abs(resizeTarget.scrollHeight - parseFloat(resizeTarget.parentNode.style.height)) < 2) {
                        clearInterval(timer3);
                        resizeTarget.parentNode.style.height = resizeTarget.scrollHeight + 'px';
                    }
                }, 5);
            }

            function xmlReady() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    var content = xmlhttp.responseText.mainFromHTML();
                    var pageTitle = xmlhttp.responseText.titleFromHTML();

                    cachedPages[pageUrl] = {
                        'content' : content,
                        'pageTitle' : pageTitle
                    }

                    showNew(content, pageTitle);

                    return true;
                }

                return false;
            }

            if (content) {
                showNew(content, pageTitle);
            }
            else if (!xmlReady()) {
                xmlhttp.onreadystatechange = xmlReady();
            }
        }
    }, 10);

    return false;
}




/* Stuff to run when the page loads (currently just the clock nonsense and theme checking) */
window.onload = function() {
    cachedPages[window.location.pathname] = {
        'content' : document.body.innerHTML.mainFromHTML(),
        'pageTitle' : document.head.innerHTML.titleFromHTML()
    }


    setTheme(localStorage.getItem('themeId'));


    var timeElement = document.createElement('div');
    timeElement.setAttribute('id', 'dateContainer');
    document.getElementById('main_footer').appendChild(timeElement);

    function refreshClock() {
        var date = new Date();
        document.getElementById('dateContainer').innerHTML = date.getHours().zeroPad(2) + ':' + date.getMinutes().zeroPad(2) + ':' + date.getSeconds().zeroPad(2);
    }

    refreshClock();
    setInterval(refreshClock, 1000);
};




/* Use loadPage for history navigation. */
window.onpopstate = function(e) {
    if (!document.location.href.match(/\#/)) // Don't run when the hash changes.
        loadPage(document.location, false, false);
};

/* Use loadPage when a link is clicked. */
/* I've also never used any of these (always used jQuery). It actually works rather well, doesn't it? */
document.addEventListener('click', function(e) {
    var target = e.target;
    window.y=e;

    while(target.nodeName !== "A" && target !== null) {
        target = target.parentNode;
    }

    console.log(target.getAttribute('href'));
    if (!target.getAttribute('href').match(/(\/\/)/) && target.getAttribute('href').match(/(\.html|\/)$/)) { // Pretty lazy set, but it works.
        e.preventDefault();
        loadPage(target.getAttribute('href'))
    }
}, false); // Only works in newerish browsers. Old IE uses attachEvent instead.