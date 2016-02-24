"use strict";

var React = require('react'),
	Client = require('../../libs/remote-device/client.js'),
	$ = require('jquery'),
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
			textAlign: 'center',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center'
		},
		modal: {
			height: 500,
			width: 700,
			textAlign: 'center',
			backgroundColor: '#FFF',
			color: '#040F1A',
			border: '1px solid #CCC',
			boxShadow: '0 0 4px 1px #CCC',
			overflow: 'hidden',
			position: 'relative'
		},
		canvas: {
			width: '80%',
			height: '60%',
			margin: '17% 10%'
		},
		title: {
			wrapper: {
				position: 'absolute',
				top: 20,
				left: 0,
				right: 0,
				textAlign: 'center'
			},
			title: {
				fontSize: 40,
				padding: 2
			},
			subtitle: {
				fontSize: 20,
				fontStyle: 'italic'
			}
		},
		volumeMeter: {
			wrapper: {
				position: 'absolute',
				bottom: 15,
				left: '40%',
				right: '40%',
				borderBottom: '1px solid #CCC',
				height: 50,
				overflow: 'hidden'
			},
			canvas: {
				transform: 'rotate(180deg)',
				height: 50,
				width: 100,
				marginLeft: -30
			}
			
		}
	},
	graphMeter,
	drawInterval = null,
	drawValue = 0,
	newValue = 0,
	drawFunction = function () {
		drawValue += (newValue - drawValue) / 2;
		if (Math.abs(drawValue - newValue) < 0.1 && Math.abs(drawValue - newValue) > -0.1 ) {
			drawValue += 1;
		}
		if (graphMeter) {
			graphMeter.value = drawValue;
			graphMeter.draw();
		}
	},
	clearValueTimeout = null,
	VolumeMeter = require('volume-meter'),
	getuserMedia = require('getusermedia');

// rgraph needs this
window.jQuery = $;

// volume meter
var audioContext = null;
var volumeMeter = null;
var canvasContext = null;
var WIDTH = 200;
var HEIGHT = 50;
var rafID = null;
var mediaStreamSource = null;

function didntGetStream() {
    console.warn('Stream generation failed.');
}

function gotStream(stream) {
    // Create an AudioNode from the stream.
    mediaStreamSource = audioContext.createMediaStreamSource(stream);
    // Create a new volume meter and connect it.
    volumeMeter = createAudioMeter(audioContext);
    mediaStreamSource.connect(volumeMeter);
    // kick off the visual updating
    drawLoop();
}

function drawLoop( time ) {
    // clear the background
    canvasContext.clearRect(0, 0, WIDTH, HEIGHT * 10);
    // check if we're currently clipping
    if (volumeMeter.checkClipping()) {
    	canvasContext.fillStyle = "red";
    } else {
    	canvasContext.fillStyle = "rgba(0,255,0,1)";
    }
    //
    var grd = canvasContext.createLinearGradient(0,0,0,150);
	grd.addColorStop(0, "#0F0");
	grd.addColorStop(1, "yellow");
	canvasContext.fillStyle = grd;
    //
    // draw a bar based on the current volume
    canvasContext.fillRect(0, 0, WIDTH, volumeMeter.volume * 5 * HEIGHT * 10);
    // set up the next visual callback
    rafID = window.requestAnimationFrame( drawLoop );
}

function createAudioMeter(audioContext,clipLevel,averaging,clipLag) {
	var processor = audioContext.createScriptProcessor(512);
	processor.onaudioprocess = volumeAudioProcess;
	processor.clipping = false;
	processor.lastClip = 0;
	processor.volume = 0;
	processor.clipLevel = clipLevel || 0.98;
	processor.averaging = averaging || 0.95;
	processor.clipLag = clipLag || 750;
	// this will have no effect, since we don't copy the input to the output,
	// but works around a current Chrome bug.
	processor.connect(audioContext.destination);
	//
	processor.checkClipping =
		function(){
			if (!this.clipping)
				return false;
			if ((this.lastClip + this.clipLag) < window.performance.now())
				this.clipping = false;
			return this.clipping;
		};
	//
	processor.shutdown =
		function(){
			this.disconnect();
			this.onaudioprocess = null;
		};
	//
	return processor;
}

function volumeAudioProcess( event ) {
	var buf = event.inputBuffer.getChannelData(0);
    var bufLength = buf.length;
	var sum = 0;
    var x;
	// Do a root-mean-square on the samples: sum up the squares...
    for (var i=0; i<bufLength; i++) {
    	x = buf[i];
    	if (Math.abs(x)>=this.clipLevel) {
    		this.clipping = true;
    		this.lastClip = window.performance.now();
    	}
    	sum += x * x;
    }
    // ... then take the square root of the sum.
    var rms =  Math.sqrt(sum / bufLength);
    // Now smooth this out with the averaging factor applied
    // to the previous sample - take the max here because we
    // want "fast attack, slow release."
    this.volume = Math.max(rms, this.volume * this.averaging);
}

var Simulation = React.createClass({
	displayName: 'Simulation',
	//
	componentDidMount: function () {
		var that = this;
		//
		graphMeter = new RGraph.Meter({
				id: 'canvas-meter',
				min: 0,
				max: 100,
				value: 0,
				options: {
					angles: {
						start: RGraph.PI - 0.1,
						end: RGraph.TWOPI + 0.1
					},
					text: {
						size: 10
					},
					strokestyle: 'white',
					segment: {
						radius: {
							start: 90
						}
					},
					adjustable: true,
					green: {
						color: RGraph.ISOLD ? 'green' : 'Gradient(#060:#0f0:#060)'
					},
					yellow: {
						color: RGraph.ISOLD ? 'yellow' : 'Gradient(#660:yellow:#660)'
					},
					red: {
						color: RGraph.ISOLD ? 'red' : 'Gradient(#600:red:#600)'
					},
					needle: {
						linewidth: 2,
						tail: false,
						radius: 80
					},
					linewidth: {
						segments: 3
					}
				}
			})
			.on('beforedraw', function (obj) {
				RGraph.clear(obj.canvas, 'white');
			})
			.draw();
		//
		Client.onData(function (data) {
			if (newValue !== (data.value * 100)) {
				newValue = (data.value * 100);
				clearTimeout(clearValueTimeout);
				clearValueTimeout = setTimeout(function () {
					newValue = 0;
				}, 2500);
			}
		});
		//
		clearInterval(drawFunction);
		drawInterval = setInterval(drawFunction, 100);
		//
		// grab our canvas
		canvasContext = document.getElementById( "volume-meter" ).getContext("2d");
		// monkeypatch Web Audio
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		// grab an audio context
		audioContext = new AudioContext();
		try {
			// monkeypatch getUserMedia
			navigator.getUserMedia = 
			navigator.getUserMedia ||
			navigator.webkitGetUserMedia ||
			navigator.mozGetUserMedia;
			// ask for an audio input
			navigator.getUserMedia({
					"audio": {
						"mandatory": {
							"googEchoCancellation": "false",
							"googAutoGainControl": "false",
							"googNoiseSuppression": "false",
							"googHighpassFilter": "false"
						},
						"optional": []
					},
				}, gotStream, didntGetStream);
		} catch (e) {
			console.warn('getUserMedia threw exception :' + e);
		}
	},
	componentWillUnmount: function () {
		clearInterval(drawFunction);
		clearTimeout(clearValueTimeout);
	},
	//
	render: function () {
		//
		return (
			<div style={styles.wrapper}>
				<div style={styles.modal}>
					<div style={styles.title.wrapper}>
						<div style={styles.title.title}>
							Sarcasm-O-Meter
						</div>
						<div style={styles.title.subtitle}>
							Please, no one is judging you... let us know your thoughts...
						</div>
					</div>
					<div style={styles.volumeMeter.wrapper}>
						<canvas style={styles.volumeMeter.canvas} id="volume-meter"></canvas>
					</div>
					<canvas id="canvas-meter" style={styles.canvas}></canvas>
				</div>
			</div>
		);
	}
});

module.exports = Simulation;
