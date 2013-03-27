// supports textareas and editable divs, even in iframes. has some special support for Twitter
function getCurrentValue(document, includeBody) {

  var el = null;

  el = document.activeElement;

  if (el.nodeName == "DIV" || (includeBody && el.nodeName == "BODY")) {

    return el.innerText;
  } else if (el.nodeName == "TEXTAREA") {
    return el.value;
  } else if (el.nodeName == "IFRAME") {
    var innerDoc = el.contentDocument || el.contentWindow.document;
    return getCurrentValue(innerDoc, true);
  } else if (document.URL == "https://twitter.com/") {
    el = document.getElementById("tweet-box-mini-home-profile");
    return el.children[0].innerText;
  } else {
    return "NOT_SUPPORTED_ELEMENT";
  }

}

function setCurrentValue(document, data, includeBody) {
  var el = null;

  el = document.activeElement;

  if (el.nodeName == "DIV") {
    el.innerText = data;
  } else if (includeBody && el.nodeName == "BODY") {
    el.innerHTML = data;
  } else if (el.nodeName == "TEXTAREA") {
    el.value = data;
  } else if (el.nodeName == "IFRAME") {
    var innerDoc = el.contentDocument || el.contentWindow.document;
    setCurrentValue(innerDoc, data, true);
  } else {
    if (document.URL == "https://twitter.com/") {
      el = document.getElementById("tweet-box-mini-home-profile");
      el.focus();
      el.children[0].innerText = data;

    }
  }
}

self.port.on('getCurrentValue', function(data) {
  var currentValue = getCurrentValue(document);
  self.port.emit('getCurrentValueResp', currentValue);
});

self.port.on('getDraftValue', function(data) {
  var el = document.getElementById("document_content");

  if (el) {
    self.port.emit('getDraftValue', el.value);
  } else {
    el = document.getElementById("document_content_for_export");

    if (el) self.port.emit('getDraftValue', el.innerHTML);
  }
});

self.port.on('setCurrentValue', function(data) {
  setCurrentValue(document, data);
});
