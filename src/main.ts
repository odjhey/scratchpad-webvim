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

const loadLeftButton = document.querySelector<HTMLButtonElement>("#load-left");
const saveRightButton = document.querySelector<HTMLButtonElement>("#save-right");

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

	diffConfig: {
		scanLimit: 50_000,
		timeout: 5_000,
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

function isValidSaveId(id: string) {
	return /^[A-Za-z0-9_-]+$/.test(id);
}

function getPassphraseViaModal(): Promise<string | null> {
	return new Promise((resolve) => {
		const overlay = document.createElement("div");
		overlay.style.position = "fixed";
		overlay.style.inset = "0";
		overlay.style.background = "rgba(0,0,0,0.4)";
		overlay.style.display = "flex";
		overlay.style.alignItems = "center";
		overlay.style.justifyContent = "center";
		overlay.style.zIndex = "9999";

		const dialog = document.createElement("div");
		dialog.style.background = "white";
		dialog.style.color = "black";
		dialog.style.padding = "16px";
		dialog.style.borderRadius = "10px";
		dialog.style.minWidth = "320px";

		const title = document.createElement("div");
		title.textContent = "Enter saves passphrase";
		title.style.marginBottom = "10px";

		const input = document.createElement("input");
		input.type = "password";
		input.autocomplete = "current-password";
		input.style.width = "100%";
		input.style.boxSizing = "border-box";
		input.style.padding = "8px";
		input.style.marginBottom = "10px";

		const actions = document.createElement("div");
		actions.style.display = "flex";
		actions.style.gap = "8px";
		actions.style.justifyContent = "flex-end";

		const cancelBtn = document.createElement("button");
		cancelBtn.type = "button";
		cancelBtn.textContent = "Cancel";
		const okBtn = document.createElement("button");
		okBtn.type = "button";
		okBtn.textContent = "OK";

		actions.append(cancelBtn, okBtn);
		dialog.append(title, input, actions);
		overlay.appendChild(dialog);
		document.body.appendChild(overlay);

		input.focus();

		function cleanup() {
			overlay.remove();
		}

		cancelBtn.addEventListener("click", () => {
			cleanup();
			resolve(null);
		});

		okBtn.addEventListener("click", () => {
			cleanup();
			resolve(input.value);
		});

		input.addEventListener("keydown", (e) => {
			if (e.key === "Enter") {
				cleanup();
				resolve(input.value);
			}
			if (e.key === "Escape") {
				cleanup();
				resolve(null);
			}
		});
	});
}

async function loadIntoLeftFromApi() {
	const id = window.prompt("Enter save id/key")?.trim();
	if (!id) return setStatus("Missing id");
	if (!isValidSaveId(id)) return setStatus("Invalid id format");

	const passphrase = (await getPassphraseViaModal()) ?? "";
	if (!passphrase) return setStatus("Missing passphrase");

	setStatus(`Loading ${id}...`);

	const res = await fetch(`/api/saves/${encodeURIComponent(id)}`, {
		method: "GET",
		headers: {
			"x-saves-passphrase": passphrase,
		},
	});

	if (!res.ok) {
		setStatus(`Load failed (${res.status})`);
		return;
	}

	const text = await res.text();
	replaceEditorText(mergeView.a, text);
	localStorage.setItem(LEFT_KEY, text);
	setStatus(`Loaded ${id}`);
}

loadLeftButton?.addEventListener("click", () => {
	loadIntoLeftFromApi().catch((e) => {
		console.error(e);
		setStatus("Load error");
	});
});

async function saveRightToApi() {
	const id = window.prompt("Enter save id/key")?.trim();
	if (!id) return setStatus("Missing id");
	if (!isValidSaveId(id)) return setStatus("Invalid id format");

	const passphrase = (await getPassphraseViaModal()) ?? "";
	if (!passphrase) return setStatus("Missing passphrase");

	setStatus(`Saving ${id}...`);

	const text = mergeView.b.state.doc.toString();

	const res = await fetch(`/api/saves/${encodeURIComponent(id)}`, {
		method: "POST",
		headers: {
			"x-saves-passphrase": passphrase,
			"content-type": "text/plain",
		},
		body: text,
	});

	if (!res.ok) {
		setStatus(`Save failed (${res.status})`);
		return;
	}

	localStorage.setItem(RIGHT_KEY, text);
	setStatus(`Saved ${id}`);
}

saveRightButton?.addEventListener("click", () => {
	saveRightToApi().catch((e) => {
		console.error(e);
		setStatus("Save error");
	});
});

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
