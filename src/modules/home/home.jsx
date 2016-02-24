"use strict";

var React = require('react'),
	Client = require('../../libs/remote-device/client.js'),
	styles = {
		wrapper: {
			position: 'absolute',
			top: 0,
			bottom: 0,
			left: 0,
			right: 0,
			height: '100%',
			width: '100%',
			zIndex: 1,
			overflow: 'hidden',
			textAlign: 'center'
		},
		modal: {
			position: 'absolute',
			top: '30%',
			left: '30%',
			right: '30%',
			bottom: '30%',
			textAlign: 'center',
			backgroundColor: '#FFF',
			color: '#040F1A',
			border: '1px solid #CCC',
			boxShadow: '0 0 4px 1px #CCC'
		},
		preps: {
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			width: '100%',
			height: '90%'
		},
		spinner: {
			height: 25
		}
	};

var Simulation = require('./simulation.jsx');

var Home = React.createClass({
	displayName : 'Home',
	//
	contextTypes: {
		router: React.PropTypes.func
	},
	//
	componentDidMount: function () {
		var that = this,
			id = this.context.router.getCurrentParams();
		//
		if (id && id.splat) {
			Client.connect(id.splat)
				.then(function () {
					that.setState({
						server: true
					});
				});
		}
	},
	getInitialState: function () {
		return {
			server: false
		};
	},
	//
	render: function () {
		var content = (
			<div style={styles.wrapper}>
				<div style={styles.modal}>
					<div style={styles.preps}>
						<img src="./modules/home/img/spinner.gif" style={styles.spinner} />
					</div>
				</div>
			</div>
		);
		if (this.state.server) {
			content = <Simulation />;
		}
		//
		return content;
	}
});

module.exports = Home;
