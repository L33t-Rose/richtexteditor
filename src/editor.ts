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
        // let ref = this;
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
            const selection = window.getSelection();
            console.log(selection);
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
                    if (this.cursorPos == 0) {
                        return;
                    }
                    this.text[this.index] = this.text[this.index]
                        .slice(0, this.cursorPos - 1)
                        .concat(...this.text.slice(this.cursorPos + 1));
                    this.cursorPos -= 1;
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
