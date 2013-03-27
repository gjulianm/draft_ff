window.addEventListener('load', function() {

	var div = document.getElementById('new_document');

	if (div) {
		div.addEventListener('click', function() {
			self.port.emit('elementClick', 'new_document');
		});
	}

	div = document.getElementById('previous_document');

	if (div) {
		div.addEventListener('click', function() {
			self.port.emit('elementClick', 'previous_document');
		});
	}

});
