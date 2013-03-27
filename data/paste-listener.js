window.addEventListener("message", function(event) {

	if (event.data && event.data.type && (event.data.type == "PASTE")) {
		// console.log("Content script received: " + event.data.text);

		self.port.emit('PASTE', event.data.text);
	}
}, false);
