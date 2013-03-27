var {Cc, Ci} = require("chrome");

// Creates a cookie for ".example.com"
var url = "http://.example.com";
var cookieString = "your_key_name=your_key_value;domain=.example.com;expires=Thu, 15 Jan 2009 15:24:55 GMT";
 
var uriSvc = Cc["@mozilla.org/network/io-service;1"]
    .getService(Ci.nsIIOService);
 
var cookieSvc = Cc["@mozilla.org/cookieService;1"]
    .getService(Ci.nsICookieService);

exports.setCookie = function (uri, cookieString) {
	var cookieUri = uriSvc.newURI(uri, null, null);
	cookieSvc.setCookieString(cookieUri, null, cookieString, null);
};
