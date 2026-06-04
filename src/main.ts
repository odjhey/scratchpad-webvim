import { basicSetup, EditorView } from "codemirror";
import { vim } from "@replit/codemirror-vim";

import "./style.css";

const STORAGE_KEY = "utils:cm6-scratchpad";

const startDoc =
	localStorage.getItem(STORAGE_KEY) ??
	`# Scratchpad

Press i to insert.
Press Esc for normal mode.

This version is bundled locally.
No CDN needed.
`;

const statusEl = document.querySelector<HTMLSpanElement>("#status");
const parentEl = document.querySelector<HTMLDivElement>("#editor");

if (!parentEl) {
	throw new Error("Missing #editor element");
}

let saveTimer: number | undefined;

new EditorView({
	doc: startDoc,
	parent: parentEl,
	extensions: [
		// Vim should come before basicSetup/keymaps.
		vim(),
		basicSetup,
		EditorView.lineWrapping,

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
