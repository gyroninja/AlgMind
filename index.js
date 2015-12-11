"use strict";
let fs        = require("fs");
let synaptic  = require("synaptic");
let readline  = require("readline");

let Neuron    = synaptic.Neuron;
let Layer     = synaptic.Layer;
let Network   = synaptic.Network;
let Trainer   = synaptic.Trainer;
let Architect = synaptic.Architect;

let moves     = ["NOP",
				 "U", "U'", "U2", "F", "F'", "F2", "R", "R'", "R2", "B", "B'", "B2", "L", "L'", "L2", "D", "D'", "D2",
				 "u", "u'", "u2", "f", "f'", "f2", "r", "r'", "r2", "b", "b'", "b2", "l", "l'", "l2", "d", "d'", "d2",
				 "M", "M'", "M2", "E", "E'", "E2", "S", "S'", "S2",
				 "x", "x'", "x2", "y", "y'", "y2", "z", "z'", "z2"];

let input     = [];

let good      = [];
let bad       = [];

let inputRL = readline.createInterface({input: fs.createReadStream("input.txt")});

inputRL.on("line", (line) => {
	console.log("Reading Input Alg: " + line);
	console.log("Vectorized: " + vectorizeAlg(line));
	input.push(vectorizeAlg(line));
});

inputRL.on("close", () => {

	let goodRL = readline.createInterface({input: fs.createReadStream("good.txt")});

	goodRL.on("line", (line) => {
		console.log("Reading Good Alg: " + line);
		console.log("Vectorized: " + vectorizeAlg(line));
		good.push(vectorizeAlg(line));
	});

	goodRL.on("close", () => {

		let badRL = readline.createInterface({input: fs.createReadStream("bad.txt")});

		badRL.on("line", (line) => {
			console.log("Reading Bad Alg: " + line);
			console.log("Vectorized: " + vectorizeAlg(line));
			bad.push(vectorizeAlg(line));
		});

		badRL.on("close", () => {

			startNN();
		});
	});
});

function startNN() {

	let algorithmLSTM = new Architect.LSTM(20, 100, 1);

	let trainer = new Trainer(algorithmLSTM);
	trainer.train(createTrainingSet(good, bad), {
		iterations: 1000,
		error: 0.01,
		rate: 0.1,
		shuffle: true,
		log: 1
	});

	let parsedAlgs = [];

	for (let alg of input) {
		parsedAlgs.push([alg, algorithmLSTM.activate(alg)[0]]);
	}

	parsedAlgs.sort((a, b) => {return b[1] - a[1]});

	for (let alg of parsedAlgs) {
		console.log(algizeVector(alg[0]) + " | " + alg[1]);
	}

	//console.log(algorithmLSTM.activate(vectorizeAlg("M' U' M2 U' M2 U' M' U2 M2"))[0]);
	//console.log(algorithmLSTM.activate(vectorizeAlg("B' L' B' L2 U2 L' B2 R B2 L' B R' L B"))[0]);
	//console.log(algorithmLSTM.activate(vectorizeAlg("R' F R U R' U' F' U R"))[0]);
	//console.log(algorithmLSTM.activate(vectorizeAlg("R' F2 R U2 R U2 R' F2 U' R U' R'"))[0]);
	//console.log(algorithmLSTM.activate(vectorizeAlg("F B U2 B' U2 B' R B2 U2 R' F' R B' R'"))[0]);
	//console.log(algorithmLSTM.activate(vectorizeAlg("R U R' U'"))[0]);
	//console.log(algorithmLSTM.activate(vectorizeAlg("R U2 R' U2"))[0]);
	//console.log(algorithmLSTM.activate(vectorizeAlg("R' F R U' R' U'"))[0]);
	//console.log(algorithmLSTM.activate(vectorizeAlg("R U' R'"))[0]);
}

function vectorizeAlg(alg) {
	let vector = [];

	for (let move of alg.split(" ")) {
		vector.push(moves.indexOf(move));

		if (vector.length == 20) {
			console.log("Alg too long :(");

			break;
		}
	}

	while (vector.length < 20) {
		vector.push(0);
	}

	return vector;
}

function algizeVector(vector) {
	let alg = "";

	for (let moveId of vector) {
		if (moveId > 0) {
			alg += moves[moveId];
			alg += " ";
		}
	}

	return alg.trim();
}

function createTrainingSet(good, bad) {
	let trainingSet = [];

	for (let i = 0; i < good.length; i++) {

		trainingSet[i] = {input: good[i], output: [1]}
	}

	for (let i = good.length - 1; i < good.length + bad.length - 1; i++) {

		trainingSet[i] = {input: bad[i - good.length + 1], output: [0]}
	}

	return trainingSet;
}