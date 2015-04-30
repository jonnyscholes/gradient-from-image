module.exports = {
	getRandomInRange: getRandomInRange,
	getJson: getJson
};

function getRandomInRange(from, to) {
	return (Math.random() * (to - from) + from).toFixed(0) * 1;
}

function getJson(url, callback) {
	var request = new XMLHttpRequest();
	request.open('GET', url, true);

	request.onload = function() {
	  if (request.status >= 200 && request.status < 400) {
	    callback(null, JSON.parse(request.responseText))
	  } else {
		callback(new Error('Error: '+request.status), null);
	  }
	};

	request.onerror = function() {
	  callback(new Error('Connection Error'), null);
	};

	request.send();
}