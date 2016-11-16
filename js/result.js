var amazon = document.getElementById('Amazon');
var wallmart = document.getElementById('Walmart');
var copyAmazon = new Clipboard('#buttonAmazon');
var copyWalmart = new Clipboard('#buttonWalmart');

chrome.tabs.query({}, function (tabs) {
    tabs.forEach(function (tab) {
        var matchedAmazon, matchedWallmart;
        if (tab.url.indexOf('walmart.com') + 1) {
            matchedWallmart = tab.url.match(/\/\d{8}/);
            if (matchedWallmart) {
                wallmart.innerHTML += '<li class="c-list__item"><a class="c-link" href="' + tab.url + '" target="_blank">' + matchedWallmart[0].slice(1) + '</a></li>';
            }
        } else if (tab.url.indexOf('amazon.com') + 1) {
            matchedAmazon = tab.url.match(/\/B\w{9}/);
            if (matchedAmazon) {
                amazon.innerHTML += '<li class="c-list__item"><a class="c-link" href="' + tab.url + '" target="_blank">' + matchedAmazon[0].slice(1) + '</a></li>';
            }
        }

    });
});
