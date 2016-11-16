var _ = require('lodash');
//var Clipboard = require('clipboard');
var OperationHelper = require('apac').OperationHelper;

//var copyAmazon = new Clipboard('#buttonAmazon');
//var copyWalmart = new Clipboard('#buttonWalmart');
var opHelper = new OperationHelper({
    awsId:     'YOUR AMAZON ID HERE',
    awsSecret: 'YOUR AMAZON SECRET HERE',
    assocId:   'YOUR ASSOCIATED HERE',
    maxRequestsPerSecond: 1
});
var walmartApiKey = 'YOUR WALMART API KEY HERE';


class idCollection {

    constructor(strStoreURL, matchIdRegExp, numberOfRequests) {
        this.strStoreURL = strStoreURL;
        this.objHTMLElement = document.getElementById(strStoreURL.match(/\w+(?=\.com)/).join());
        this.arrayOfIds = [];
        this.matchIdRegExp = matchIdRegExp;
        this.numberOfRequests = numberOfRequests;
    }

    searchStoreURL(objTab) {
        return objTab.url.indexOf(this.strStoreURL) + 1;
    }

    searchItemId(objTab) {
        var matchedId = objTab.url.match(this.matchIdRegExp);
        var idsLength = this.arrayOfIds.length;
        if (matchedId && (_.indexOf(_.flatten(this.arrayOfIds), matchedId[0].slice(1)) === -1)) {
            this.arrayOfIds[idsLength] = [];
            this.arrayOfIds[idsLength][0] = matchedId[0].slice(1);
            this.arrayOfIds[idsLength][1] = objTab.url;
        }
    }

    outputItems() {
        var i, textHTML;
        var n = this.arrayOfIds.length;
        var self=this;

        this.requestData().then(function () {
            textHTML = '<div class="o-grid__cell">';
            for (i = 0; i < n; i++) {
                textHTML += '<div class="o-grid"><div class="o-grid__cell o-grid__cell--width-20"><a class="c-link" href="'
                    + self.arrayOfIds[i][1] + '" target="_blank">'
                    + self.arrayOfIds[i][0] + '</a></div><div class="o-grid__cell o-grid__cell--width-20">'
                    + self.arrayOfIds[i][2] + '</div><div class="o-grid__cell o-grid__cell--width-20">'
                    + _.replace(self.arrayOfIds[i][3], self.arrayOfIds[i][2], '') + '</div><div class="o-grid__cell o-grid__cell--width-20">'
                    + self.arrayOfIds[i][4] + '</div><div class="o-grid__cell o-grid__cell--width-20">'
                    + self.arrayOfIds[i][5] + '</div></div><hr>';
            }
            textHTML += '</div>';
            self.objHTMLElement.innerHTML = textHTML;
        });
    }

    requestData() {
        var xhr = new XMLHttpRequest();
        var stringIds;
        var arrayChunked, arrayIds = [];
        var self = this, i;

        return new Promise(function(resolve,reject){

        arrayChunked = _.chunk(self.arrayOfIds, self.numberOfRequests);

        arrayChunked.forEach(function (itemN, iN, arrN) {
            itemN.forEach(function (item, i, arr) {
                arrayIds.push(arr[i][0]);
            }, self);
            stringIds = arrayIds.join(',');
            if (this.strStoreURL === 'walmart.com') {
                xhr.open('GET', 'http://api.walmartlabs.com/v1/items?ids=' + stringIds
                    + '&apiKey=' + walmartApiKey + '&format=json', true);
                xhr.onreadystatechange = function() {
                    if(xhr.readyState == 4) {
                        if(xhr.status == 200) {
                            _.forEach(JSON.parse(xhr.responseText), function (value) {
                                i = 0;
                                _.forEach(value, function (value) {
                                    self.arrayOfIds[iN * self.numberOfRequests + i][3] = value.name;
                                    self.arrayOfIds[iN * self.numberOfRequests + i][5] = '$'+value.salePrice;
                                    self.arrayOfIds[iN * self.numberOfRequests + i][2] = value.brandName;
                                    self.arrayOfIds[iN * self.numberOfRequests + i][4] = value.modelNumber;
                                    i++;
                                });
                            });
                            //console.log(JSON.parse(xhr.responseText));
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            alert(xhr.status + ': ' + xhr.statusText);
                            reject(xhr.status + ': ' + xhr.statusText);
                        }
                    }
                };
                xhr.send();
            } else if (this.strStoreURL === 'amazon.com') {
                opHelper.execute('ItemLookup', {
                    'Condition': 'New',
                    'ItemId': stringIds,
                    'ResponseGroup': 'ItemAttributes,OfferFull'
                }).then((response) => {
//                    console.log(response.result);
                    iterateObj(response.result, self, iN);
                    resolve(response.result);
                }).catch((err) => {
                    console.error("Something went wrong! ", err);
                    reject ("Something went wrong! ");
            });
            }
        }, self);
});
}
}



function iterateObj(obj, self, iN) {
    _.forEach(obj, function (value) {
        value.Items.Item.forEach(function (item,i,arr) {
            self.arrayOfIds[iN * self.numberOfRequests + i][3] = item.ItemAttributes.Title;
            if (item.ItemAttributes.ListPrice) {
                self.arrayOfIds[iN * self.numberOfRequests + i][5] = item.ItemAttributes.ListPrice.FormattedPrice;
            } else {
                self.arrayOfIds[iN * self.numberOfRequests + i][5] = item.OfferSummary.LowestNewPrice.FormattedPrice;
            }
            self.arrayOfIds[iN * self.numberOfRequests + i][2] = item.ItemAttributes.Brand;
            if (item.ItemAttributes.Model){
                self.arrayOfIds[iN * self.numberOfRequests + i][4] = item.ItemAttributes.Model;
            } else {
                self.arrayOfIds[iN * self.numberOfRequests + i][4] = '0';
            }
        });
    });
}

function outputToCSV(arrayItems, nameOfFile) {
    var array = arrayItems.slice();
    array.forEach(function (item) {
        _.pull(item, item[1]);
    });
    var csv = array.map(function(d){
        return d.join(':');
    }).join('\n');
    var encodedUri = encodeURI(csv);
    var link = document.createElement("a");
    link.setAttribute("href", "data:text/csv;charset=utf-8,\uFEFF" + encodedUri);
    link.setAttribute("download", nameOfFile);
    link.click();
}


document.getElementById('buttonAmazon').onclick = function() {
    outputToCSV(idsAmazon.arrayOfIds, 'amazonitems.csv');
};

document.getElementById('buttonWalmart').onclick = function() {
    outputToCSV(idsWalmart.arrayOfIds, 'walmartitems.csv');
};


let idsAmazon = new idCollection('amazon.com', /\/B\w{9}/, 10);
let idsWalmart = new idCollection('walmart.com', /\/\d{8}/, 20);

chrome.tabs.query({}, function (tabs) {
    tabs.forEach(function (tab) {
        if (idsAmazon.searchStoreURL(tab)) {
            idsAmazon.searchItemId(tab);
        } else if (idsWalmart.searchStoreURL(tab)) {
            idsWalmart.searchItemId(tab);
        }
    });
    idsAmazon.outputItems();
    idsWalmart.outputItems();
});
