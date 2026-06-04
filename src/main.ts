import { basicSetup, EditorView } from "codemirror";
import { Compartment } from "@codemirror/state";
import { MergeView } from "@codemirror/merge";
import { vim } from "@replit/codemirror-vim";
import { oneDark } from "@codemirror/theme-one-dark";

import "./style.css";

const SCRATCHPAD_KEY = "utils:cm6-scratchpad";

const LEFT_KEY = "utils:diff:left";
const RIGHT_KEY = "utils:diff:right";
const THEME_KEY = "utils:theme";

const themeCompartment = new Compartment();

const statusEl = document.querySelector<HTMLSpanElement>("#status");
const parent = document.querySelector<HTMLDivElement>("#editor");
const themeButton = document.querySelector<HTMLButtonElement>("#toggle-theme");

if (!parent) {
	throw new Error("Missing #editor");
}

let isDark =
	localStorage.getItem(THEME_KEY) === "dark" ||
	(!localStorage.getItem(THEME_KEY) &&
		window.matchMedia("(prefers-color-scheme: dark)").matches);

const defaultLeft = `// Paste old/local/original code here
`;

const defaultRight = `// Paste new/suggested code here
`;

const leftDoc =
	localStorage.getItem(LEFT_KEY) ??
	localStorage.getItem(SCRATCHPAD_KEY) ??
	defaultLeft;

const rightDoc = localStorage.getItem(RIGHT_KEY) ?? defaultRight;

document.documentElement.dataset.theme = isDark ? "dark" : "light";

function setStatus(message: string) {
	if (statusEl) {
		statusEl.textContent = message;
	}
}

function savePane(key: string, value: string) {
	localStorage.setItem(key, value);
	setStatus(`Saved ${new Date().toLocaleTimeString()}`);
}

function extensionsForPane(storageKey: string) {
	let saveTimer: number | undefined;

	return [
		vim(),
		basicSetup,
		EditorView.lineWrapping,

		themeCompartment.of(isDark ? oneDark : []),

		EditorView.updateListener.of((update) => {
			if (!update.docChanged) return;

			window.clearTimeout(saveTimer);

			saveTimer = window.setTimeout(() => {
				savePane(storageKey, update.state.doc.toString());
			}, 300);
		}),
	];
}

const mergeView = new MergeView({
	a: {
		doc: leftDoc,
		extensions: extensionsForPane(LEFT_KEY),
	},

	b: {
		doc: rightDoc,
		extensions: extensionsForPane(RIGHT_KEY),
	},

	parent,

	highlightChanges: true,
	gutter: true,

	collapseUnchanged: {
		margin: 3,
		minSize: 6,
	},
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

	mergeView.a.dispatch({
		effects: themeCompartment.reconfigure(isDark ? oneDark : []),
	});

	mergeView.b.dispatch({
		effects: themeCompartment.reconfigure(isDark ? oneDark : []),
	});

	applyPageTheme();
});

document
	.querySelector<HTMLButtonElement>("#copy-left")
	?.addEventListener("click", async () => {
		await navigator.clipboard.writeText(mergeView.a.state.doc.toString());
		setStatus("Copied left");
	});

document
	.querySelector<HTMLButtonElement>("#copy-right")
	?.addEventListener("click", async () => {
		await navigator.clipboard.writeText(mergeView.b.state.doc.toString());
		setStatus("Copied right");
	});

document.querySelector<HTMLButtonElement>("#clear")?.addEventListener("click", () => {
	if (!confirm("Clear both diff panes?")) return;

	mergeView.a.dispatch({
		changes: {
			from: 0,
			to: mergeView.a.state.doc.length,
			insert: "",
		},
	});

	mergeView.b.dispatch({
		changes: {
			from: 0,
			to: mergeView.b.state.doc.length,
			insert: "",
		},
	});

	localStorage.removeItem(LEFT_KEY);
	localStorage.removeItem(RIGHT_KEY);

	setStatus("Cleared");
});


function replaceEditorText(view: EditorView, text: string) {
	view.dispatch({
		changes: {
			from: 0,
			to: view.state.doc.length,
			insert: text,
		},
	});
}

document.querySelector<HTMLButtonElement>("#swap")?.addEventListener("click", () => {
	const leftText = mergeView.a.state.doc.toString();
	const rightText = mergeView.b.state.doc.toString();

	replaceEditorText(mergeView.a, rightText);
	replaceEditorText(mergeView.b, leftText);

	localStorage.setItem(LEFT_KEY, rightText);
	localStorage.setItem(RIGHT_KEY, leftText);

	setStatus("Swapped left and right");
});

applyPageTheme();
