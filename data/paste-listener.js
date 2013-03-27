window.addEventListener("message", function(event) {
	console.log('message from Windows ' + JSON.stringify(event));
	console.log(JSON.stringify(event.data));
	
	console.log('asd');

	if (event.data && event.data.type && (event.data.type == "PASTE")) {
		console.log("Content script received: " + event.data.text);

		self.port.emit('PASTE', event.data.text);
	}
}, false);
