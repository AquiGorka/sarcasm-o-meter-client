"use strict";

var Promise = require('bluebird'),
	peer,
	connection,
	PeerJSKey = '';

alert('src/libs/remote-device/client.js :: Add your own PeerJS api key');

var Client = {
	connect: function (id) {
		if (id) {
			return new Promise(function (resolve, reject) {
				//
				peer = new Peer({ key: PeerJSKey });
				//
				connection = peer.connect(id);
				connection.on('open', function () {
					resolve();
				});
			});
		} else {
			return Promise.reject('Client connect error: Please provide a server id.');
		}
	},
	destroy: function () {
		if (peer) {
			peer.destroy();
		}
		return this;
	},
	onData: function (callback) {
		if (connection) {
			connection.on('data', callback);
		}
		return this;
	}
};

module.exports = Client;
