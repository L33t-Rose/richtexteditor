import { PlainTextDocument } from "./editor.ts";
const LS_PREFIX = "doc_";
function saveFile(editor: PlainTextDocument) {
    console.log(editor.text.join("\n"));
    localStorage.setItem(LS_PREFIX + editor.fileId, editor.text.join("\n"));
}
// Was thinking of adding a callback function but for now this will be synchronous
// Until I run into a situation where this needs to be async it will stay synchronous
function loadFile(editor: PlainTextDocument, id: string) {
    const text = localStorage.getItem(LS_PREFIX + id);
    if (!text) {
        alert("Couldn't be found");
        return;
    }
    editor.reset();
    editor.fileId = id;
    editor.text = text.split("\n");
    editor.render();
}

const editor = document.getElementById("editor");

// Editor UI
const editorUIFileID = document.querySelector(".editor-menu__file-id")!;
const saveBtn = document.querySelector<HTMLButtonElement>(
    ".editor-menu__saveBtn",
)!;
const loadBtn = document.querySelector<HTMLButtonElement>(
    ".editor-menu__loadBtn",
)!;
const newBtn = document.querySelector<HTMLButtonElement>(
    ".editor-menu__newBtn",
)!;
const fileDialog = document.querySelector<HTMLDialogElement>(".files")!;
const fileList = fileDialog.querySelector<HTMLDivElement>(".files__list")!;
const doc = new PlainTextDocument(
    editor!,
    "This is editable. Jeez I'm going to have to make this really long in order for me to test text wrapping when my text editor. I'm noticing super weird behaviors\n\nJunior Was Here",
);
doc.render();
editorUIFileID.textContent = doc.fileId;
saveBtn.addEventListener("click", function (e) {
    saveFile(doc);
});
loadBtn.addEventListener("click", function (e) {
    const files = Object.entries(window.localStorage).filter((entry) =>
        entry[0].startsWith(LS_PREFIX),
    );
    if (files.length === 0) {
        alert("No files stored yet. Save your file");
        return;
    }
    console.log(files);
    // Render File List inside of dialog
    fileList.replaceChildren();
    fileList.append(
        ...files.map(([id, text]) => {
            const fileContainer = document.createElement("div");
            fileContainer.classList.add("file");

            const fileId = document.createElement("small");
            fileId.classList.add("file__id");
            fileId.textContent = "File ID: " + id.slice(LS_PREFIX.length);

            const fileText = document.createElement("p");
            fileText.classList.add("file__text");
            fileText.textContent = text;

            const fileAction = document.createElement("menu");
            fileAction.classList.add("file__actions");
            const loadBtn = document.createElement("button");
            loadBtn.textContent = "Select";
            loadBtn.dataset.action = "load";
            loadBtn.dataset.fileId = id.slice(LS_PREFIX.length);
            // const deleteBtn = document.createElement("button")
            fileAction.append(loadBtn);
            fileContainer.append(fileId, fileText, fileAction);
            return fileContainer;
        }),
    );
    fileDialog.showModal();
    // loadFile(doc, id);
    // editorUIFileID.textContent = id;
});
newBtn.addEventListener("click", function (e) {
    doc.newFile();
    editorUIFileID.textContent = doc.fileId;
});
fileList.addEventListener("click", function (e) {
    if (!e.target) {
        return;
    }
    if (!(e.target instanceof HTMLButtonElement)) {
        return;
    }
    const action = e.target.dataset.action;
    if (action === "load") {
        console.log(e.target.dataset.fileId);
        loadFile(doc, e.target.dataset.fileId!);
        editorUIFileID.textContent = e.target.dataset.fileId!;
    } else {
        throw new Error("WIP");
    }
    fileDialog.close();
});
