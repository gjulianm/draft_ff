var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var self = require("sdk/self");
var pageMod = require("sdk/page-mod");
var cookies = require("./cookies");

var activeWorker = null;

// Prod settings
var host = "draftin.com";
var protocol = "https";
var protocol_and_host = protocol + "://" + host;

var targetTab = null;
var draftTab = null;

// If either the target or Draft tabs are closed, remove the cookies
tabs.on('close', function(tab) {
  removeCookies(tab);
});

// If the original target's url has changed, all of this is stale. Remove the cookies
tabs.on('ready', function(tab) {
  if (targetTab && originalTargetURL != targetTab.url) {
    removeCookies(tabId);
  }
});

pageMod.PageMod({
  include: '*.draftin.com',
  contentScriptFile: self.data.url('paste-listener.js'),
  onAttach: function(worker) {
    worker.port.on('PASTE', function(data) {
      console.log(activeWorker);
      if (activeWorker != null) {
        activeWorker.port.emit('setCurrentValue', data);
        activeWorker.tab.activate();
      }
    });
  }
});

var widget = widgets.Widget({
  id: "draft-button",
  label: "Edit in Draft",
  contentURL: "http://draftin.com/images/favicon.ico",
  onClick: function() {
    if (tabs.activeTab.url.substring(0, 6) == 'about:') return;

    var worker = tabs.activeTab.attach({
      contentScriptFile: self.data.url("content-script.js")
    });

    activeWorker = worker;
    console.log(activeWorker);
    worker.port.emit('getCurrentValue', '');
    worker.port.once('getCurrentValueResp', function(currentTargetValue)  {
      // if the content script doesn't come up with something, it's because it's not supported or the user hasn't clicked into a textare. they might need some documentation
      if (currentTargetValue != "NOT_SUPPORTED_ELEMENT") {
        valueToSet = escape(currentTargetValue);

        // # make sure we dont blog the cookie limit or this wont work
        if (lengthInUtf8Bytes(valueToSet) > 4000) {
          valueToSet = null;
        }

        // set the referring url and current value of the text area for Draft to use
        cookies.setCookie(protocol_and_host, "currentTargetValue=" + valueToSet + "; domain=" + host + "; path=/;");
        cookies.setCookie(protocol_and_host, "currentTargetURL=" + escape(worker.tab.url) + "; domain=" + host + "; path=/;");
        
        url = protocol_and_host + "/documents/new";

        tabs.open({
          url: url,
          onOpen: function(draftTab) {
            setDraftTab(draftTab);
          }
        });
      } else {
        tabs.open(protocol_and_host + "/extension_help");
      }
    });
  }
});

function setTargetTab(tab) {
  targetTab = tab;
  originalTargetURL = targetTab.url;
}

function setDraftTab(tab) {
  draftTab = tab;
}

function removeCookies(tab) {
  if (targetTab == tab || draftTab == tab) {
    tab.attach({
      contentScriptFile: self.data.url('remove-cookies.js')

    });
  }
}


// http://stackoverflow.com/questions/5515869/string-length-in-bytes-in-javascript
function lengthInUtf8Bytes(str) {
  // Matches only the 10.. bytes that are non-initial characters in a multi-byte sequence.
  var m = encodeURIComponent(str).match(/%[89ABab]/g);
  return str.length + (m ? m.length : 0);
}
