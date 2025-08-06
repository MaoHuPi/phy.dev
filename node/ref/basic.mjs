export function $(selector, parent = document) { return parent.querySelector(selector); }
export function $$(selector, parent = document) { return [...parent.querySelectorAll(selector)]; }
export function $e(tagName) { return document.createElement(tagName); }
export function randomId() { return Math.random().toString().replace('.', ''); }
export function array2csv(array) { return array.map(row => row.join(',')).join('\n'); }