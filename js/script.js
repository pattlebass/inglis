import { Token } from "./token.js";

const inputArea = document.querySelector("#input");
const outputArea = document.querySelector("#output");
const wordCount = document.querySelector("#word-count");
const ttsButton = document.querySelector("#tts");
const copyOutputButton = document.querySelector("#copy-output");

let map;
const tokens = [];

init();

async function init() {
	inputArea.addEventListener("keyup", transform);
	inputArea.addEventListener("keyup", onInput);
	copyOutputButton.onclick = copyOutput;

	if ("speechSynthesis" in window) {
		ttsButton.onclick = tts;
	} else {
		ttsButton.style.display = "none";
	}

	const response = await fetch("/CMU_dict.json");
	map = await response.json();

	onInput();
	transform();
}

function onInput() {
	wordCount.textContent = `${inputArea.value.length} / 5000`;

	if (inputArea.value.length === 0) {
		ttsButton.style.display = "none";
	} else {
		ttsButton.style.display = "";
	}
}

function transform() {
	outputArea.innerHTML = "";
	tokens.length = 0;

	for (const word of inputArea.value.trim().replaceAll("\n", " ").split(/\b/)) {
		/*if (word.includes("\n")) {
			outputArea.appendChild(document.createElement("br"));
			continue;
		}*/

		const token = new Token();
		token.input = word;
		token.outputs = toPhonetic(word);
		if (!isAlpha(word)) {
			token.highlight = false;
		}
		token.chosenOutput = token.outputs[0];
		tokens.push(token);

		const wordElementContainer = document.createElement("div");
		wordElementContainer.classList.add("word-container");

		const wordTextElement = document.createElement("div");
		wordTextElement.textContent = toPhonetic(word)[0];
		wordTextElement.classList.add("word");
		if (token.highlight && token.outputs.length > 1) {
			wordTextElement.classList.add("word-hover");
		}
		wordElementContainer.appendChild(wordTextElement);

		if (token.outputs.length > 1) {
			const wordPopup = document.createElement("span");
			wordPopup.classList.add("word-popup");

			const outputList = document.createElement("ul");
			outputList.classList.add("word-list");
			wordPopup.appendChild(outputList);

			for (const output of token.outputs) {
				const outputOption = document.createElement("li");
				outputOption.textContent = output;

				outputOption.onclick = () => {
					wordTextElement.textContent = output;
					token.chosenOutput = output;
				};

				outputList.appendChild(outputOption);
			}

			wordElementContainer.appendChild(wordPopup);

			wordElementContainer.onclick = () => {
				wordPopup.classList.toggle("show");
			};
		}

		outputArea.appendChild(wordElementContainer);
	}
}

function toPhonetic(word) {
	word = word.toLowerCase();

	if (word in map) {
		return map[word].map((e) => toBalta(e).replaceAll(" ", ""));
	}

	if (isAlpha(word)) {
		return [word + "(?)"];
	}

	return [word];
}

function toBalta(word) {
	const mapBalta = {
		eh1: "e",
		ey1: "ei",
		ey2: "ei",
		ay1: "ai",
		ao1: "oa",
		ao2: "oa",
		er0: "ăr",
		uh1: "u",
		ae1: "ea",
		iy0: "i",
		dh: "d",
		jh: "j",
		uw1: "u",
		ow1: "ou",
		y: "i",
		aw1: "au",
		ah0: "ă",
		ah1: "a",
		ih1: "i",
		hh: "h",
		er1: "ăr",
		aa1: "a",
		ay2: "ai",
		iy2: "i",
		ih1: "i",
		sh: "ș",
		ih0: "i",
		ng: "n",
		uh2: "u",
		uh1: "i",
		w: "u",
		ch: "ci",
		iy1: "i",
		uw0: "u",
		ow2: "ou",
		ao1: "au",
		ow0: "ou",
		ih2: "i",
	};

	let transformed = "";

	for (const sound of word.split(" ")) {
		if (sound in mapBalta) {
			transformed += mapBalta[sound] + " ";
		} else {
			transformed += sound;
		}
	}

	return transformed;
}

function copyOutput() {
	let output = "";

	for (const token of tokens) {
		output += token.chosenOutput;
	}

	navigator.clipboard.writeText(output);
}

function tts() {
	var msg = new SpeechSynthesisUtterance();
	msg.text = inputArea.value;
	msg.lang = "en";
	msg.rate = 0.7;
	window.speechSynthesis.speak(msg);
}

const isAlpha = (str) => /^[a-z]+$/gi.test(str);
