var widgets = require("sdk/widget");
var tabs = require("sdk/tabs");
var self = require("sdk/self");
var pageMod = require("sdk/page-mod");
var cookies = require("./cookies");
var panels = require("sdk/panel");
var tb = require("./toolbarbutton");
var { Hotkey } = require("sdk/hotkeys");

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

var panel = panels.Panel({
  width: 200,
  height: 72,
  contentURL: self.data.url('popup.html'),
  contentScriptFile: self.data.url('popup.js')
});

var showHotKey = Hotkey({
  combo: "accel-shift-o",
  onPress: function() {
    openDraft('new_document');
  }
});

panel.port.on('elementClick', function(msg) {
  openDraft(msg);
  panel.hide();
});

var tbutton = tb.ToolbarButton({
  id: 'draft_ff_tbb',
  label: 'Edit in Draft',
  image: self.data.url('icon-navbar.png'),
  panel: panel
});

if (require('self').loadReason == "install") {
  tbutton.moveTo({
    toolbarID: "nav-bar",
    forceMove: false // only move from palette
  });
}

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

function openDraft(name) {
  console.log(name);
  if (tabs.activeTab.url.substring(0, 6) == 'about:') return;

  var worker = tabs.activeTab.attach({
    contentScriptFile: self.data.url("content-script.js")
  });

  activeWorker = worker;
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

      if (name === 'new_document')
        url = protocol_and_host + "/documents/new";
      else 
        url = protocol_and_host + "/documents";

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
