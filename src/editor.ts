class PlainTextDocument {
    ref = this;
    text: string[];
    node: HTMLElement;
    cursorPos: number = 1;
    index = 0;
    constructor(node: HTMLElement, text: string) {
        this.text = text.split("\n");
        console.log(this.text);
        this.node = node;
        this.registerListeners();
    }
    private updateIndex(e: HTMLElement | EventTarget) {
        if (!(e instanceof HTMLElement) && !(e instanceof Node)) {
            throw new Error("Non-element passed into updateIndex");
        }
        let curr = e;
        // Traverse up the DOM tree to find the closest node with the data-editorindex attr
        // This is for later on when we actually add in rich text
        // TODO: Try to make the typesafety better with curr.dataset
        // @ts-expect-error
        while (curr.nodeName === "#text" || !("editor_index" in curr.dataset)) {
            console.log(curr);
            if (!curr.parentElement) {
                throw new Error(
                    "Encountered element in editor that's not associated with any of our nodes"
                );
            }
            curr = curr.parentElement;
        }
        // @ts-expect-error
        const textIndex = Number.parseInt(curr.dataset.editor_index!);
        this.index = textIndex;
    }
    private registerListeners() {
        if (!this.node) {
            throw new Error("No node passed in");
        }
        this.node.addEventListener("click", (e) => {
            if (!e.target) {
                return;
            }
            const selection = window.getSelection();
            if (!selection) {
                return;
            }
            if (selection.type == "Range") {
                throw new Error("We don't support ranges yet");
            }
            this.cursorPos = selection.anchorOffset;
            this.updateIndex(e.target);
            console.log("cursorPos", this.cursorPos, "index", this.index);
        });
        this.node.addEventListener("keyup", (e) => {
            if (!e.target) {
                return;
            }
            if (
                e.key != "ArrowLeft" &&
                e.key != "ArrowRight" &&
                e.key != "ArrowUp" &&
                e.key != "ArrowDown"
            ) {
                return;
            }
            console.log(e);
            const selection = window.getSelection();
            if (!selection) {
                throw new Error("No Selection?");
            }
            console.log("selection after moving", selection);
            this.cursorPos = selection.anchorOffset;
            this.updateIndex(selection.anchorNode!);
            console.log("cursorPos", this.cursorPos, "index", this.index);
        });
        this.node.addEventListener("beforeinput", (e) => {
            e.preventDefault();
            console.log(e);

            switch (e.inputType) {
                case "insertText":
                    console.log("cursorPos", this.cursorPos);
                    this.text[this.index] =
                        this.text[this.index].slice(0, this.cursorPos) +
                        e.data! +
                        this.text[this.index].slice(this.cursorPos);

                    this.cursorPos += e.data!.length;
                    break;
                case "deleteContentBackward":
                    console.log(this);
                    if (this.index === 0 && this.cursorPos == 0) {
                        return;
                    }
                    console.log(
                        "cursor",
                        this.cursorPos,
                        "test",
                        this.text[this.index].slice(0, this.cursorPos - 1),
                        this.text[this.index].slice(this.cursorPos)
                    );
                    if (this.cursorPos == 0) {
                        const prevTextLength = this.text[this.index - 1].length;
                        // Combine the text above with the current one.
                        this.text[this.index - 1] =
                            this.text[this.index - 1] + this.text[this.index];
                        // Move cursor
                        this.cursorPos = prevTextLength;
                        // Erase current one from array
                        this.text.splice(this.index, 1);
                        this.index -= 1;
                    } else {
                        this.text[this.index] =
                            this.text[this.index].slice(0, this.cursorPos - 1) +
                            this.text[this.index].slice(this.cursorPos);
                        this.cursorPos -= 1;
                    }
                    break;
                case "insertParagraph":
                    console.log(this.cursorPos, this.text[this.index].length);
                    // Need to handle two case
                    let newCursorPos = 0;
                    // Case 1: Trying to create paragraph at end of paragraph
                    if (this.cursorPos == this.text[this.index].length) {
                        this.text.splice(this.index + 1, 0, "");
                    } else {
                        // Case 2: Try to create paragraph in middle of a paragraph
                        const textToRemain = this.text[this.index].slice(
                            0,
                            this.cursorPos
                        );
                        const textForNewParagraph = this.text[this.index].slice(
                            this.cursorPos
                        );
                        this.text[this.index] = textToRemain;
                        this.text.splice(
                            this.index + 1,
                            0,
                            textForNewParagraph
                        );
                        // newCursorPos = textForNewParagraph.length;
                    }
                    console.log(this.text);
                    this.cursorPos = 0;
                    this.index += 1;
                    break;
                default:
                    throw Error("WIP");
            }
            this.render();
            /**
             * Naive solution for cursor management
             * This works by targetting the internal text nodes inside of our elements.
             * We can then create a range within the text node at wherever cursorPos is and then just
             * add it to the current caret.
             */
            const range = document.createRange();
            range.setStart(
                this.node.childNodes[this.index].childNodes[0],
                this.cursorPos
            );
            range.setEnd(
                this.node.childNodes[this.index].childNodes[0],
                this.cursorPos
            );
            const selection = window.getSelection();
            selection?.removeAllRanges();
            selection?.addRange(range);
        });
    }
    render() {
        this.node.replaceChildren(
            ...this.text.map((part, index) => {
                const a = document.createElement("p");

                if (part === "") {
                    a.appendChild(document.createElement("br"));
                } else {
                    // Per the spec the browser trims whitespace so I'm manually escaping the last space when rendering
                    // TODO: We don't support tabs right now because pressing tab will cause the focus to leave the editor
                    let toBeDisplayed = part.replaceAll(/\s{2}/gm, " &nbsp;");
                    if (toBeDisplayed.startsWith(" ")) {
                        toBeDisplayed = "&nbsp;" + toBeDisplayed.slice(1);
                    }
                    if (toBeDisplayed.endsWith(" ")) {
                        toBeDisplayed =
                            toBeDisplayed.slice(0, toBeDisplayed.length - 1) +
                            "&nbsp;";
                    }

                    // We need to do alternating between space and escaped space because if we don't the browser
                    // Will treat content as one long word thus preventing word wrapping to fail..
                    a.innerHTML = toBeDisplayed;
                }
                a.dataset.editor_index = index.toString();
                return a;
            })
        );
    }
}

const editor = document.getElementById("editor");
const doc = new PlainTextDocument(
    editor!,
    "This is editable. Jeez I'm going to have to make this really long in order for me to test text wrapping when my text editor. I'm noticing super weird behaviors\n\nJunior Was Here"
);
doc.render();
