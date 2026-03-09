type _Range = {
    begin: number;
    length: number;
};
type Transformation = {
    type: number;
    begin: number;
    length: number;
};
type TextNode = {
    type: string;
    begin: number;
    length: number;
    attributes: Record<any, any> | null;
    tranformations: Transformation[];
};
type ContentNode = {
    type: string;
    textIdx: number;
    attributes: Record<any, any> | null;
    children: TextNode[];
};
export class PlainTextDocument {
    text: string[];
    node: HTMLElement;
    cursorPos: number = 0;
    fileId: string;
    index = 0;
    currentRange: Selection | null = null;
    content: ContentNode[];
    constructor(node: HTMLElement, text: string) {
        this.text = text.split("\n");
        this.content = this.text.map((text, i) => {
            const contentNode: ContentNode = {
                type: "paragraph",
                attributes: null,
                textIdx: i,
                children: [
                    {
                        type: "text",
                        attributes: null,
                        begin: 0,
                        length: text.length,
                        tranformations: [],
                    },
                ],
            };
            return contentNode;
        });
        console.log(this.text);
        console.log(this.content);
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
                    const node: ContentNode = {
                        type: "paragraph",
                        attributes: null,
                        children: [],
                        textIdx: this.index + 1,
                    };
                    // Case 1: Trying to create paragraph at end of paragraph
                    if (this.cursorPos == this.text[this.index].length) {
                        this.text.splice(this.index + 1, 0, "");
                        this.content.splice(this.index + 1, 0, node);
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
                        // Find the text node that cursorPos lies within
                        let i = 0;
                        for (
                            i;
                            i < this.content[this.index].children.length;
                            i++
                        ) {
                            const node = this.content[this.index].children[i];
                            if (
                                this.cursorPos >= node.begin &&
                                this.cursorPos <= node.begin + node.length
                            ) {
                                break;
                            }
                        }
                        const within = this.content[this.index].children[i];
                        const right: TextNode = {
                            type: within.type,
                            begin: 0,
                            length:
                                within.begin + within.length - this.cursorPos,
                            attributes: within.attributes,
                            tranformations: [],
                        };
                        this.content[this.index].children[i].length =
                            this.cursorPos - within.begin;
                        const len = this.content[this.index].children.length;
                        const rest = this.content[this.index].children.splice(
                            i + 1,
                            len - (i + 1),
                        );
                        node.children.push(right, ...rest);
                        this.content.splice(this.index + 1, 0, node);
                        for (
                            let j = this.index + 2;
                            j < this.content.length;
                            j++
                        ) {
                            this.content[j].textIdx++;
                        }
                        // newCursorPos = textForNewParagraph.length;
                    }
                    console.log(this.text);
                    console.log(this.content);
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
        this.node.replaceChildren();
        console.log("RENDER", this.content);
        for (let i = 0; i < this.content.length; i++) {
            const node = this.content[i];
            const element = ((cNode: ContentNode) => {
                if (cNode.type === "paragraph") {
                    return document.createElement("p");
                } else if (cNode.type === "heading") {
                    return document.createElement(`h${node.attributes.level}`);
                } else {
                    throw new Error("Unrecognized content node type");
                }
            })(node);
            const text = this.text[i];
            if (node.type === "paragraph" && text === "") {
                element.appendChild(document.createElement("br"));
            } else {
                // Don't worry about transformations for now
                let toBeDisplayed = text.replaceAll(/\s{2}/gm, " &nbsp;");
                if (toBeDisplayed.startsWith(" ")) {
                    toBeDisplayed = "&nbsp;" + toBeDisplayed.slice(1);
                }
                if (toBeDisplayed.endsWith(" ")) {
                    toBeDisplayed =
                        toBeDisplayed.slice(0, toBeDisplayed.length - 1) +
                        "&nbsp;";
                }
                element.textContent = toBeDisplayed;
            }
            element.dataset.editor_index = i.toString();
            this.node.appendChild(element);
        }
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
