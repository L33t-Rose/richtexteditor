export class PlainTextDocument {
    ref = this;
    text: string[];
    node: HTMLElement;
    cursorPos: number = 0;
    fileId: string;
    index = 0;
    currentRange: Selection | null = null;
    constructor(node: HTMLElement, text: string) {
        this.text = text.split("\n");
        console.log(this.text);
        this.node = node;
        this.fileId = crypto.randomUUID();
        this.registerListeners();
    }
    private getParentIndex(e: Node) {
        let current = e.parentElement!;
        while (!("editor_index" in current.dataset)) {
            current = e.parentElement!;
        }
        return Number.parseInt(current.dataset.editor_index!);
    }
    private updateIndex(e: HTMLElement | Node) {
        if (!(e instanceof HTMLElement) && !(e instanceof Node)) {
            throw new Error("Non-element passed into updateIndex");
        }
        let curr = e;
        // Traverse up the DOM tree to find the closest node with the data-editorindex attr
        // This is for later on when we actually add in rich text
        // TODO: Try to make the typesafety better with curr.dataset
        // @ts-expect-error
        while (curr.nodeName === "#text" || !("editor_index" in curr.dataset)) {
            if (!curr.parentElement) {
                throw new Error(
                    "Encountered element in editor that's not associated with any of our nodes",
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
        // Turns out selectionchange doesn't activate for contenteditable elements for some reason...
        document.addEventListener("selectionchange", (e) => {
            console.log("cursorchange");
            console.log("change", e, window.getSelection());
            if (e.target === null) {
                return;
            }
            const selection = window.getSelection();
            if (!selection) {
                return;
            }
            // when you click out of the editor selectionchange gets triggered so we should check for this
            // before updating any state.
            if (selection.focusNode instanceof Document) {
                console.log("Here");
                return;
            }
            if (selection.type == "Range") {
                console.log("selection", selection);
                this.currentRange = selection;
                // throw new Error("We don't support ranges yet");
            }
            this.cursorPos = selection.focusOffset;
            this.updateIndex(selection.focusNode!);
            console.log("cursorPos", this.cursorPos, "index", this.index);
            //@ts-ignore
            debug.textContent = `cursorPos ${this.cursorPos}, "index", ${this.index}`;
        });
        this.node.addEventListener("beforeinput", async (e) => {
            e.preventDefault();
            console.log("input");
            console.log(e);

            switch (e.inputType) {
                case "insertFromPaste":
                case "insertReplacementText":
                case "insertText":
                    // When insertFromPaste and insertReplacementText happen e.data is null
                    // and their content inside of dataTransfer
                    const data =
                        e.data ??
                        (await new Promise((res) => {
                            e.dataTransfer?.items[0].getAsString((dtString) =>
                                res(dtString),
                            );
                        }));
                    console.log("data", data);
                    console.log("cursorPos", this.cursorPos);
                    // Notice how the code for handling range and caret selections are the same?
                    // We should just merge these and just keep track of a currentSelection.
                    if (this.currentRange) {
                        // Multi-line support
                        if (
                            !(
                                this.currentRange.anchorNode ===
                                this.currentRange.focusNode
                            )
                        ) {
                            // Compute the indexes of the anchor (a) and focus nodes (b)
                            const top =
                                this.currentRange.direction === "backward"
                                    ? this.currentRange.focusNode!
                                    : this.currentRange.anchorNode!;

                            const bottom =
                                this.currentRange.direction === "backward"
                                    ? this.currentRange.anchorNode!
                                    : this.currentRange.focusNode!;
                            const topOffset =
                                this.currentRange.direction === "backward"
                                    ? this.currentRange.focusOffset
                                    : this.currentRange.anchorOffset;
                            const bottomOffset =
                                this.currentRange.direction === "backward"
                                    ? this.currentRange.anchorOffset
                                    : this.currentRange.focusOffset;

                            const topIndex = this.getParentIndex(top);
                            const bottomIndex = this.getParentIndex(bottom);

                            // We might have to merge the text in the anchor with the focus
                            const newText =
                                this.text[topIndex].slice(0, topOffset) +
                                data +
                                this.text[bottomIndex].slice(bottomOffset);

                            this.text[topIndex] = newText;

                            // Delete everything between a to b
                            this.text.splice(
                                topIndex + 1,
                                bottomIndex - topIndex,
                            );

                            // Update index to anchorNode's index and then update cursorPosition
                            this.index = topIndex;
                            this.cursorPos = topOffset + data!.length;
                        } else {
                            const begin =
                                this.currentRange.direction === "backward"
                                    ? this.currentRange.focusOffset
                                    : this.currentRange.anchorOffset;
                            const end =
                                this.currentRange.direction === "backward"
                                    ? this.currentRange.anchorOffset
                                    : this.currentRange.focusOffset;
                            console.log(
                                "same?",
                                this.currentRange.anchorNode ===
                                    this.currentRange.focusNode,
                            );

                            this.text[this.index] =
                                this.text[this.index].slice(0, begin) +
                                data! +
                                this.text[this.index].slice(end);

                            this.cursorPos = begin + data!.length;
                            this.currentRange = null;
                        }
                    } else {
                        this.text[this.index] =
                            this.text[this.index].slice(0, this.cursorPos) +
                            data! +
                            this.text[this.index].slice(this.cursorPos);

                        this.cursorPos += data!.length;
                    }
                    break;
                case "deleteContentBackward":
                    console.log(this);
                    if (
                        !this.currentRange &&
                        this.index === 0 &&
                        this.cursorPos == 0
                    ) {
                        return;
                    }
                    console.log(
                        "cursor",
                        this.cursorPos,
                        "test",
                        this.text[this.index].slice(0, this.cursorPos - 1),
                        this.text[this.index].slice(this.cursorPos),
                    );
                    if (this.currentRange) {
                        const top =
                            this.currentRange.direction === "backward"
                                ? this.currentRange.focusNode!
                                : this.currentRange.anchorNode!;

                        const bottom =
                            this.currentRange.direction === "backward"
                                ? this.currentRange.anchorNode!
                                : this.currentRange.focusNode!;
                        const topOffset =
                            this.currentRange.direction === "backward"
                                ? this.currentRange.focusOffset
                                : this.currentRange.anchorOffset;
                        const bottomOffset =
                            this.currentRange.direction === "backward"
                                ? this.currentRange.anchorOffset
                                : this.currentRange.focusOffset;
                        const topIndex = this.getParentIndex(top);
                        const bottomIndex = this.getParentIndex(bottom);

                        // We might have to merge the text in the anchor with the focus
                        const newText =
                            this.text[topIndex].slice(0, topOffset) +
                            this.text[bottomIndex].slice(bottomOffset);

                        this.text[topIndex] = newText;

                        // Delete everything between a to b
                        this.text.splice(topIndex + 1, bottomIndex - topIndex);

                        // Update index to anchorNode's index and then update cursorPosition
                        this.index = topIndex;
                        this.cursorPos = topOffset;
                        // }
                        this.currentRange = null;
                    } else if (this.cursorPos == 0) {
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
                            this.cursorPos,
                        );
                        const textForNewParagraph = this.text[this.index].slice(
                            this.cursorPos,
                        );
                        this.text[this.index] = textToRemain;
                        this.text.splice(
                            this.index + 1,
                            0,
                            textForNewParagraph,
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
                this.cursorPos,
            );
            range.setEnd(
                this.node.childNodes[this.index].childNodes[0],
                this.cursorPos,
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
            }),
        );
    }
    newFile() {
        this.fileId = crypto.randomUUID();
        this.text = [""];
        this.reset();
        this.render();
    }
    reset() {
        this.cursorPos = 0;
        this.index = 0;
        this.currentRange = null;
    }
}
