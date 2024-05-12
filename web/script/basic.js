function $(selector, parent = document) { return parent.querySelector(selector); }
function $$(selector, parent = document) { return [...parent.querySelectorAll(selector)]; }
function $e(tagName) { return document.createElement(tagName); }
function randomId() { return Math.random().toString().replace('.', ''); }
function array2csv(array) { return array.map(row => row.join(',')).join('\n'); }