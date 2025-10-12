import { Token } from "./token.js";

const inputLanguageSelect = document.querySelector("#input-lang");
const inputArea = document.querySelector("#input");
const outputArea = document.querySelector("#output");
const wordCount = document.querySelector("#word-count");
const ttsButton = document.querySelector("#tts");
const copyOutputButton = document.querySelector("#copy-output");

let map = { ro: {} };
let inputLanguage = inputLanguageSelect.value;
const outputLanguage = "ro";
const tokens = [];

init();

async function init() {
	inputArea.addEventListener("keyup", transform);
	inputArea.addEventListener("keyup", onInput);
	inputLanguageSelect.onchange = onChangeLanguage;
	copyOutputButton.onclick = copyOutput;

	if ("speechSynthesis" in window) {
		ttsButton.onclick = tts;
	} else {
		ttsButton.style.display = "none";
	}

	const responses = await Promise.all([
		fetch("/json/dictionaries/ro/en_US.json"),
		fetch("/json/dictionaries/ro/de.json"),
	]);
	map["ro"]["en"] = await responses[0].json();
	map["ro"]["de"] = await responses[1].json();

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

	const inputText = inputArea.value
		.trim()
		.replaceAll("\n", " ")
		.split(/\b(?<!\')\b(?!\')/);

	for (const word of inputText) {
		/*if (word.includes("\n")) {
			outputArea.appendChild(document.createElement("br"));
			continue;
		}*/

		const token = tokenize(word);
		tokens.push(token);

		const wordElementContainer = document.createElement("div");
		wordElementContainer.classList.add("word-container");

		// Text element
		const wordTextElement = document.createElement("div");
		wordTextElement.textContent = token.outputs[0];
		wordTextElement.classList.add("word");
		if (token.highlight && token.outputs.length > 1) {
			wordTextElement.classList.add("word-hover");
		}
		if (token.unknown) {
			wordTextElement.classList.add("word-unknown");
		}
		wordElementContainer.appendChild(wordTextElement);

		// Alternative pronunciations
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

function tokenize(word) {
	word = word.toLowerCase();

	const token = new Token();
	token.input = word;
	if (word in map[outputLanguage][inputLanguage]) {
		token.outputs = map[outputLanguage][inputLanguage][word];
	} else {
		if (isAlpha(word)) {
			token.unknown = true;
		}
		token.outputs = [word];
	}

	if (!isAlpha(word)) {
		token.highlight = false;
	}

	token.chosenOutput = token.outputs[0];

	return token;
}

function onChangeLanguage() {
	inputLanguage = inputLanguageSelect.value;
	transform();
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
	msg.lang = inputLanguage;
	msg.rate = 0.7;
	window.speechSynthesis.speak(msg);
}

const isAlpha = (str) => /^[a-z]+$/gi.test(str);
