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
const transformations: Transformation[] = [
    { type: "bold", begin: 0, length: 4 },
    // // { type: "strike", begin: 3, length: 3 },
    { type: "italicize", begin: 1, length: 5 },
];
function insertTranformation(
    transformations: Transformation[],
    incoming: Transformation,
    startFrom: number = 0,
) {
    // if(t)
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
            let incomingRemL = incoming.begin - prev.begin;
            // If it's negative than prev has remaining
            let incomingRemR =
                incoming.begin + incoming.length - (prev.begin + prev.length);
            // If this is positive then prev has some remaining on the left side
            let prevRemL = 0;
            let prevRemR = 0;
            console.log(incomingRemL, incomingRemR, prevRemL, prevRemR);

            if (incomingRemL < 0) {
                incomingRemL = Math.abs(incomingRemL);
                // prevRemL = Math.abs(incomingRemL);
            } else {
                prevRemL = Math.abs(incomingRemL);
                incomingRemL = 0;
                // incomingRemL = Math.abs(incomingRemL);
            }
            if (incomingRemR < 0) {
                prevRemR = Math.abs(incomingRemR);
                incomingRemR = 0;
            } else {
                prevRemR = 0;
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
const scratchArr: Transformation[] = [];
insertTranformation(scratchArr, { type: "strike", begin: 3, length: 6 });
console.log("t", scratchArr);

insertTranformation(scratchArr, { type: "bold", begin: 6, length: 1 });
console.log("t", scratchArr);

insertTranformation(scratchArr, { type: "superscript", begin: 5, length: 4 });
console.log("t", scratchArr);

insertTranformation(scratchArr, { type: "subscript", begin: 3, length: 3 });
console.log("t", scratchArr);

insertTranformation(scratchArr, { type: "italicize", begin: 1, length: 2 });
console.log("t", scratchArr);
insertTranformation(scratchArr, { type: "underline", begin: 1, length: 3 });
console.log("t", scratchArr);
insertTranformation(scratchArr, { type: "underline", begin: 9, length: 3 });
console.log("t", scratchArr);
insertTranformation(scratchArr, { type: "bold", begin: 9 - 2, length: 3 });
console.log("t", scratchArr);

// insertTranformation(scratchArr, { type: "bold", begin: 0, length: 4 });
const tagMap = { bold: "b", italicize: "i" };
