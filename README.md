# Rich Text Editor

This is a repo dedicated to me experimenting with Rich Text Editors. What they and how they work.

So far, I've done some prototyping of how I represent my document. I built it in svelte so that I can because I wanted a declarative way to create dom elements and I like svelte for that.

Here's the link to the prototype: [Link](https://svelte.dev/playground/ff40b21fb31d45339ff7c7f196ebc49d?version=5.34.7)

Ultimately I abandoned this prototype because I felt that trying to edit text in which segments of the text are embedded into a tree was simply not a good idea.

How to support ligatures. Keep in mind you need to make sure to decrement `cursorPos` once you transform the ligature.

```js
console.log(this.text[this.index], this.text[this.index].indexOf("-->"));
this.text[this.index] = this.text[this.index]
    .replaceAll("-->", "→")
    .replaceAll("<--", "←");
console.log(this.text[this.index]);
```
