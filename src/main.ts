import { basicSetup, EditorView } from "codemirror";
import { Compartment } from "@codemirror/state";
import { vim } from "@replit/codemirror-vim";
import { oneDark } from "@codemirror/theme-one-dark";

import "./style.css";

const STORAGE_KEY = "utils:cm6-scratchpad";
const THEME_KEY = "utils:theme";

const themeCompartment = new Compartment();

const savedTheme = localStorage.getItem(THEME_KEY);
let isDark = savedTheme === "dark";

const startDoc =
	localStorage.getItem(STORAGE_KEY) ??
	`# Scratchpad

Press i to insert.
Press Esc for normal mode.

Dark mode is enabled.
`;

const statusEl = document.querySelector<HTMLSpanElement>("#status");
const parentEl = document.querySelector<HTMLDivElement>("#editor");
const themeButton = document.querySelector<HTMLButtonElement>("#toggle-theme");

if (!parentEl) {
	throw new Error("Missing #editor element");
}

let saveTimer: number | undefined;

const view = new EditorView({
	doc: startDoc,
	parent: parentEl,
	extensions: [
		vim(),
		basicSetup,
		EditorView.lineWrapping,

		themeCompartment.of(isDark ? oneDark : []),

		EditorView.updateListener.of((update) => {
			if (!update.docChanged) return;

			window.clearTimeout(saveTimer);

			saveTimer = window.setTimeout(() => {
				localStorage.setItem(STORAGE_KEY, update.state.doc.toString());

				if (statusEl) {
					statusEl.textContent = `Saved ${new Date().toLocaleTimeString()}`;
				}
			}, 300);
		}),
	],
});

function applyPageTheme() {
	document.documentElement.dataset.theme = isDark ? "dark" : "light";

	if (themeButton) {
		themeButton.textContent = isDark ? "Light mode" : "Dark mode";
	}
}

themeButton?.addEventListener("click", () => {
	isDark = !isDark;

	localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");

	view.dispatch({
		effects: themeCompartment.reconfigure(isDark ? oneDark : []),
	});

	applyPageTheme();
});

applyPageTheme();
