// 00000
const BOLD = 1;
const ITALICIZE = 2;
const STRIKETHROUGH = 4;
const SUBSCRIPT = 8;
const SUPERSCRIPT = 16;
enum TType {
    BOLD = 1,
    ITALICIZE = 2,
    STRIKETHROUGH = 4,
    SUBSCRIPT = 8,
    SUPERSCRIPT = 16,
}
console.log(TType);
console.log("combo", BOLD ^ ITALICIZE ^ BOLD ^ STRIKETHROUGH);
function typeToTextArr(type: number) {
    if (type === 0) {
        return [];
    }
    let res: string[] = [];
    let rem = type;
    const typeLookup = [
        "BOLD",
        "ITALICIZE",
        "STRIKETHROUGH",
        "SUBSCRIPT",
        "SUPERSCRIPT",
    ];
    for (let i = 0; i < 5; ++i) {
        if (rem & 1) {
            res.push(typeLookup[i]);
        }
        rem = rem >> 1;
    }
    return res;
}
console.log(
    typeToTextArr(
        BOLD ^ ITALICIZE ^ BOLD ^ STRIKETHROUGH ^ SUBSCRIPT ^ ITALICIZE,
    ),
);
console.log(typeToTextArr(BOLD ^ ITALICIZE));
console.log(typeToTextArr(BOLD ^ ITALICIZE ^ BOLD));

console.log((BOLD ^ ITALICIZE) & (ITALICIZE ^ BOLD ^ STRIKETHROUGH));
console.log(
    typeToTextArr((BOLD ^ ITALICIZE) | (ITALICIZE ^ BOLD ^ STRIKETHROUGH)),
);
type Transformation = { type: string; begin: number; length: number };
// const transformations: Transformation[] = [
//     { type: "bold", begin: 0, length: 4 },
//     // // { type: "strike", begin: 3, length: 3 },
//     { type: "italicize", begin: 1, length: 5 },
// ];
function insertTranformation(
    transformations: Transformation[],
    incoming: Transformation,
    startFrom: number = 0,
) {
    let i = startFrom;
    // Find spot to put it
    for (i; i < transformations.length; i++) {
        const prev = transformations[i];
        const isIntersecting =
            (incoming.begin >= prev.begin &&
                incoming.begin < prev.begin + prev.length) ||
            (prev.begin >= incoming.begin &&
                prev.begin < incoming.begin + incoming.length);
        console.log("incoming", incoming, "\ncurr", prev, isIntersecting);
        if (incoming.begin < transformations[i].begin && !isIntersecting) {
            break;
        } else if (isIntersecting) {
            console.log("Intersection!");
            // Resolve Intersection
            // In order for this to make sense I choose to assume that incoming is after prev then work with the edge cases from there.
            // If it's negative we'll know that incoming comes first;
            // Otherwise prev has remaining
            let incomingRemL = incoming.begin - prev.begin;
            let incomingRemR =
                incoming.begin + incoming.length - (prev.begin + prev.length);
            // If this is positive then prev has some remaining on the left side
            let prevRemL = 0;
            let prevRemR = 0;
            console.log(incomingRemL, incomingRemR, prevRemL, prevRemR);

            if (incomingRemL < 0) {
                incomingRemL = Math.abs(incomingRemL);
            } else {
                prevRemL = Math.abs(incomingRemL);
                incomingRemL = 0;
            }
            if (incomingRemR < 0) {
                prevRemR = Math.abs(incomingRemR);
                incomingRemR = 0;
            }
            console.log(incomingRemL, incomingRemR, prevRemL, prevRemR);

            const toInsert: Transformation[] = [];
            if (incomingRemL > 0) {
                toInsert.push({
                    type: incoming.type,
                    begin: incoming.begin,
                    length: incomingRemL,
                });
            }
            if (prevRemL > 0) {
                toInsert.push({
                    type: prev.type,
                    begin: prev.begin,
                    length: prevRemL,
                });
            }
            const intersection: Transformation = {
                type: prev.type + "_" + incoming.type,
                begin: Math.max(prev.begin, incoming.begin),
                length:
                    incoming.begin +
                    incoming.length -
                    Math.max(prev.begin, incoming.begin) -
                    incomingRemR,
            };
            toInsert.push(intersection);
            if (prevRemR > 0) {
                toInsert.push({
                    type: prev.type,
                    begin: intersection.begin + intersection.length,
                    length: prevRemR,
                });
            }
            transformations.splice(i, 1, ...toInsert);
            console.log("insert", toInsert);
            if (incomingRemR > 0) {
                const incomingR: Transformation = {
                    type: incoming.type,
                    begin: intersection.begin + intersection.length,
                    length: incomingRemR,
                };
                console.log("There is still some left of incoming", incomingR);
                insertTranformation(
                    transformations,
                    incomingR,
                    i + toInsert.length,
                );
            }
            return;
        }
    }
    transformations.splice(i, 0, incoming);
}
// const scratchArr: Transformation[] = [];
// insertTranformation(scratchArr, { type: "strike", begin: 3, length: 6 });
// console.log("t", scratchArr);

// insertTranformation(scratchArr, { type: "bold", begin: 6, length: 1 });
// console.log("t", scratchArr);

// insertTranformation(scratchArr, { type: "superscript", begin: 5, length: 4 });
// console.log("t", scratchArr);

// insertTranformation(scratchArr, { type: "subscript", begin: 3, length: 3 });
// console.log("t", scratchArr);

// insertTranformation(scratchArr, { type: "italicize", begin: 1, length: 2 });
// console.log("t", scratchArr);
// insertTranformation(scratchArr, { type: "underline", begin: 1, length: 3 });
// console.log("t", scratchArr);
// insertTranformation(scratchArr, { type: "underline", begin: 9, length: 3 });
// console.log("t", scratchArr);
// insertTranformation(scratchArr, { type: "bold", begin: 9 - 2, length: 3 });
// console.log("t", scratchArr);

// insertTranformation(scratchArr, { type: "bold", begin: 0, length: 4 });
const tagMap = { bold: "b", italicize: "i" };

// Can this work with my text division idea
// const contentTransformations: Transformation[] = [];
// insertTranformation(contentTransformations, {
//     type: "text",
//     begin: 0,
//     length: 100,
// });
// console.log("c", contentTransformations);
// insertTranformation(contentTransformations, {
//     type: "anchor",
//     begin: 0,
//     length: 10,
// });
// console.log("c", contentTransformations);
// insertTranformation(contentTransformations, {
//     type: "anchor",
//     begin: 20,
//     length: 15,
// });
// console.log("c", contentTransformations);

type _Transformation = {
    type: string;
    length: number;
};

function newInsertTransformation(
    transformations: _Transformation[],
    incomingBegin: number,
    incoming: _Transformation,
) {
    let pos = 0;
    let i = 0;
    while (i < transformations.length) {
        const prev = transformations[i];
        const isIntersecting =
            incomingBegin >= pos && incomingBegin < pos + prev.length;
        const posOffsetToAdd = prev.length;
        let incrementBy = 1;
        if (isIntersecting) {
            const batch: _Transformation[] = [];
            const intersectTransform = {
                type: prev.type + "_" + incoming.type,
                length:
                    Math.min(
                        pos + prev.length,
                        incomingBegin + incoming.length,
                    ) - incomingBegin,
            };
            batch.push(intersectTransform);
            incrementBy++;
            let prevRemL = incomingBegin - pos;

            let prevRemR =
                pos + prev.length - (incomingBegin + intersectTransform.length);

            if (prevRemR > 0) {
                let prevR: _Transformation = {
                    type: prev.type,
                    length: prevRemR,
                };
                batch.push(prevR);
                incrementBy += 1;
            }
            transformations.splice(i + 1, 0, ...batch);
            prev.length = prevRemL;
            if (prev.length === 0) {
                transformations.splice(i, 1);
                incrementBy--;
            }

            // This number should never be negative;
            let incomingRemR = incoming.length - intersectTransform.length;
            if (incomingRemR === 0) {
                break;
            }
            incoming.length -= intersectTransform.length;
            incomingBegin += intersectTransform.length;
        }
        // console.log(incrementBy, transformations, transformations.length);
        pos += posOffsetToAdd;
        i += incrementBy;
    }
}

const t: _Transformation[] = [{ type: "", length: 25 }];
// newInsertTransformation(t, 2, { type: "bold" });
console.log("begining t", structuredClone(t));
console.log("----------");

let begin = performance.now();
newInsertTransformation(t, 6, { type: "bold", length: 1 });
let end = performance.now();
console.log("t", structuredClone(t), end - begin);
console.log("----------");

begin = performance.now();
newInsertTransformation(t, 3, { type: "strike", length: 6 });
end = performance.now();
console.log("t", structuredClone(t), end - begin);
console.log("----------");

begin = performance.now();
newInsertTransformation(t, 5, { type: "superscript", length: 4 });
end = performance.now();
console.log("t", structuredClone(t), end - begin);
console.log("----------");

begin = performance.now();
newInsertTransformation(t, 3, { type: "subscript", length: 3 });
end = performance.now();
console.log("t", structuredClone(t), end - begin);
console.log("----------");

begin = performance.now();
newInsertTransformation(t, 1, { type: "italicize", length: 2 });
end = performance.now();
console.log("t", structuredClone(t), end - begin);
console.log("----------");

begin = performance.now();
newInsertTransformation(t, 1, { type: "underline", length: 3 });
end = performance.now();
console.log("t", structuredClone(t), end - begin);
console.log("----------");

begin = performance.now();
newInsertTransformation(t, 9, { type: "underline", length: 3 });
end = performance.now();
console.log("t", structuredClone(t), end - begin);
console.log("----------");

begin = performance.now();
newInsertTransformation(t, 9 - 2, { type: "bold", length: 3 });
end = performance.now();
console.log("t", structuredClone(t), end - begin);
console.log("----------");

const contentTransformations: _Transformation[] = [
    {
        type: "text",
        length: 100,
    },
];
console.log("c", structuredClone(contentTransformations));
newInsertTransformation(contentTransformations, 0, {
    type: "anchor",
    length: 10,
});
console.log("c", structuredClone(contentTransformations));
newInsertTransformation(contentTransformations, 20, {
    type: "anchor",
    length: 15,
});
console.log("c", structuredClone(contentTransformations));
