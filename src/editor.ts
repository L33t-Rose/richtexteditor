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
    }
    init() {
        if (!this.node) {
            throw new Error("No node passed in");
        }
        this.node.addEventListener("click", (e) => {
            console.log(e);
            const selection = window.getSelection();
            console.log(selection);
            if (!selection) {
                return;
            }
            if (selection.type == "Range") {
                throw new Error("We don't support ranges yet");
            }
            console.log();
            this.cursorPos = selection.anchorOffset;
        });
        this.node.addEventListener("keyup", (e) => {
            if (e.key != "ArrowLeft" && e.key != "ArrowRight") {
                return;
            }
            console.log(e);
            const selection = window.getSelection();
            console.log("selection after moving", selection);
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
                    if (this.cursorPos == 0) {
                        return;
                    }
                    console.log(
                        "cursor",
                        this.cursorPos,
                        "test",
                        this.text[this.index].slice(0, this.cursorPos - 1),
                        this.text[this.index].slice(this.cursorPos)
                    );
                    this.text[this.index] =
                        this.text[this.index].slice(0, this.cursorPos - 1) +
                        this.text[this.index].slice(this.cursorPos);
                    this.cursorPos -= 1;
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
                        newCursorPos = textForNewParagraph.length;
                    }
                    console.log(this.text);
                    this.cursorPos = newCursorPos;
                    this.index += 1;
                    break;
                default:
                    throw Error("WIP");
            }
            this.render();
        });
    }
    render() {
        console.log(this.text);
        this.node.replaceChildren(
            ...this.text.map((part) => {
                // console.log(part);
                const a = document.createElement("p");
                if (part === "") {
                    a.appendChild(document.createElement("br"));
                } else {
                    a.textContent = part;
                }
                return a;
            })
        );
    }
}

const editor = document.getElementById("editor");
const doc = new PlainTextDocument(editor!, "here\n\nsure\n");
doc.init();
doc.render();
