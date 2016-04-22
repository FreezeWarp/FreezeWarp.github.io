var cachedPages = {};

/* Prototype extensions.
 * Fun-fact! This is the first time I've done a prototype extension. It's shockingly simple, isn't it? */
Number.prototype.zeroPad = function(num) {
    var asString = this.valueOf().toString();
    var neededZeros = num - asString.length;

    while (neededZeros-- > 0)
        asString = '0' + asString;

    return asString;
};

String.prototype.titleFromHTML = function() { return this.replace(/([\s\S]*)\<main id="main"\>([\s\S]*)\<\/main\>([\s\S]*)/, "$2"); }
String.prototype.mainFromHTML = function() { return this.replace(/([\s\S]*)\<main id="main"\>([\s\S]*)\<\/main\>([\s\S]*)/, "$2"); }

function setTheme(themeId) {
    if ([1,2].indexOf(Number(themeId)) === -1) themeId = 1;

    localStorage.setItem('themeId', themeId);
    document.getElementById('themedCSS').setAttribute('href', '/theme' + themeId + '.css');
}

/* Stuff to run when the page loads (currently just the clock nonsense.) */
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

    while(target.nodeName !== "A" && target !== null) {
        target = target.parentNode;
    }

    console.log(target.getAttribute('href'));
    if (!target.getAttribute('href').match(/(\/\/|mailto|\#)/)) { // Pretty lazy set, but it works.
        e.preventDefault();
        loadPage(target.getAttribute('href'))
    }
}, false); // Only works in newerish browsers. Old IE uses attachEvent instead.


/* This is a fun one. Loads pageUrl (can be in any format that is accepted by xmlHttpRequest), extracts the stuff in #main, and then replaces the existing #main with the new stuff.
 * It also runs a fadeout/zoomout animation to hide the existing content (run simultaneously with background page load) and, once the new page is available and the the fadeout complete) runs a fadein/zoomin animation with the new content. */
function loadPage(pageUrl, history) { console.log(pageUrl);
    var history = typeof history === 'undefined' || history;

    if (pageUrl in cachedPages) {
        content = cachedPages[pageUrl].content;
        pageTitle = cachedPages[pageUrl].pageTitle;
    }
    else {
        content = false;

        xmlhttp = new XMLHttpRequest();
        xmlhttp.open("GET", pageUrl, true);
        xmlhttp.send();
    }

    var resizeFactor = .96;
    var resizeTarget = document.getElementById("main");

    resizeTarget.style.zoom = 1;
    resizeTarget.style.opacity = 1;
//    resizeTarget.style.display = "inline-block";

    var timer = setInterval(function() {
        resizeTarget.style.zoom = resizeFactor * resizeTarget.style.zoom;
        resizeTarget.style.opacity = resizeTarget.style.zoom;
        resizeTarget.style.width = resizeTarget.style.zoom * 100 + "%";

        if (resizeTarget.style.zoom < .1) {
            clearInterval(timer);
            resizeTarget.innerHTML = "";

            function showNew(responseText, pageTitle) {
                resizeTarget.innerHTML = responseText;
                document.title = pageTitle;

                if (history) {
                    window.history.pushState({
                        "html": responseText,
                        "pageTitle": pageTitle
                    }, pageTitle, pageUrl);
                }

                var timer2 = setInterval(function() {
                    resizeTarget.style.zoom = (2 - resizeFactor) * resizeTarget.style.zoom;
                    resizeTarget.style.opacity = resizeTarget.style.zoom;
                    resizeTarget.style.width = resizeTarget.style.zoom * 100 + "%";

                    if (resizeTarget.style.zoom > .9) {
                        clearInterval(timer2);

                        resizeTarget.style.zoom = 1;
                        resizeTarget.style.opacity = 1;
                        resizeTarget.style.width = resizeTarget.style.zoom * 100 + "%";
                    }
                }, 10);
            }

            function xmlReady() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    content = xmlhttp.responseText.mainFromHTML();
                    pageTitle = xmlhttp.responseText.titleFromHTML();

                    cachedPages[pageUrl] = {
                        'content' : content,
                        'pageTitle' : pageTitle
                    }

                    showNew(content, pageTitle);

                    return true;
                }

                return false;
            }

            if (content) { console.log("content");
                showNew(content, pageTitle);
            }
            else if (!xmlReady()) {
                xmlhttp.onreadystatechange = xmlReady();
            }
        }
    }, 10);

    return false;
}