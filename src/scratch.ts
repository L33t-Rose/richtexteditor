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
        const currTransform = transformations[i];
        const isIntersecting =
            (incoming.begin >= currTransform.begin &&
                incoming.begin <= currTransform.begin + currTransform.length) ||
            (currTransform.begin >= incoming.begin &&
                currTransform.begin <= incoming.begin + incoming.length);
        console.log(
            "incoming",
            incoming,
            "\ncurr",
            currTransform,
            isIntersecting,
        );
        if (incoming.begin < transformations[i].begin && !isIntersecting) {
            break;
        } else if (isIntersecting) {
            const isIncomingBeforeCurr = incoming.begin < currTransform.begin;
            // Resolve Intersection
            // For my sanity rn I will just have two branching paths for
            if (isIncomingBeforeCurr) {
                console.log("Intersection", currTransform, incoming);
                let currRemL = incoming.begin - currTransform.begin;
                let currRemR = 0;
                let incomingRemL = 0;
                let incomingRemR = 0;
            } else {
                let currRemL = incoming.begin - currTransform.begin;
                let currRemR = 0;
                let incomingRemL = 0;
                let incomingRemR =
                    incoming.begin +
                    incoming.length -
                    (currTransform.begin + currTransform.length);
                if (incomingRemR < 0) {
                    currRemR = currTransform.length + incomingRemR;
                    incomingRemR = 0;
                }
            }
        }
    }
    transformations.splice(i, 0, incoming);
}
const scratchArr: Transformation[] = [];
insertTranformation(scratchArr, { type: "bold", begin: 5, length: 4 });
insertTranformation(scratchArr, { type: "strike", begin: 3, length: 3 });
insertTranformation(scratchArr, { type: "italicize", begin: 1, length: 2 });
insertTranformation(scratchArr, { type: "bold", begin: 0, length: 4 });
console.log(scratchArr);
const tagMap = { bold: "b", italicize: "i" };
const transformedText = function (str: string) {
    // merge??
    transformations.sort((a, b) => a.begin - b.begin);
    const merged = [transformations[0]];
    // manage collisions
    for (let i = 1; i < transformations.length; i++) {
        const curr = transformations[i];
        const prev = transformations[i - 1];
        if (
            curr.begin >= prev.begin &&
            curr.begin <= prev.begin + prev.length
        ) {
            console.log("collision!", prev, curr);
            let prevRemL = curr.begin - prev.begin;
            let prevRemR = 0;
            let currRem = curr.begin + curr.length - (prev.begin + prev.length);
            if (currRem < 0) {
                prevRemR = prev.length + currRem;
                currRem = 0;
            }
            const newPrev = {
                type: prev.type,
                begin: prev.begin,
                length: prevRemL,
            };
            const intersect = {
                type: prev.type + "_" + curr.type,
                begin: curr.begin,
                length: curr.length - currRem,
            };
            const remPrev = {
                type: prev.type,
                begin: curr.begin + curr.length - currRem,
                length: prevRemR,
            };
            const remCurr = {
                type: curr.type,
                begin: prev.begin + prev.length,
                length: currRem,
            };
            console.log(newPrev, intersect, remPrev, remCurr);
            console.log(
                str.slice(newPrev.begin, newPrev.begin + newPrev.length),
                str.slice(intersect.begin, intersect.begin + intersect.length),
                str.slice(remPrev.begin, remPrev.begin + remPrev.length),
                str.slice(remCurr.begin, remCurr.begin + remCurr.length),
            );
            // console.log(str);
            // // What we need to calculate
            // // How many characters intersect between prev and curr
            // // It's not guaranteed that curr will cover to the end of prev
            // // So we need to calculate how many remaining characters are left
            // console.log("leftSideRem", str.slice(prev.begin, curr.begin));
            // console.log(
            //     "sections",
            //     str.slice(prev.begin, prev.begin + prev.length),
            //     str.slice(curr.begin, curr.begin + curr.length),
            // );
            // const diff = prev.begin + prev.length - curr.begin;
            // console.log(
            //     "diff",
            //     diff,
            //     str.slice(curr.begin, curr.begin + curr.length),
            // );
            // const currEnd = curr.begin + curr.length;
            // const remainingOfPrev =
            //     prev.begin + prev.length - (curr.begin + diff);
            // console.log(
            //     "remainingOfPrev",
            //     remainingOfPrev,
            //     str.slice(currEnd, prev.begin + prev.length),
            // );
            // const newPrevLength = curr.begin - prev.begin;
            // console.log(
            //     "newPrevLength",
            //     newPrevLength,
            //     str.slice(prev.begin, prev.begin + newPrevLength),
            // );
            // prev.length = newPrevLength;
            // console.log(transformations[i - 1]);
            // const remainingOfCurr =
            //     curr.begin + curr.length - (curr.begin + diff);
            // console.log(
            //     "remainingOfCurr",
            //     remainingOfCurr,
            //     str.slice(curr.begin + diff, curr.begin + curr.length),
            // );
        }
    }
    console.log(transformations);
    // let transformed = str;
    let transforms: string[] = [];
    let shifts: Record<number, number>[] = [];
    for (const t of transformations) {
        const localShifts: Record<number, number> = {};
        //@ts-ignore
        const tag = tagMap[t.type];
        // console.log(
        //     localShifts[t.begin] ?? t.begin,
        //     localShifts[t.begin + t.length] ?? t.begin + t.length,
        //     str.slice(
        //         localShifts[t.begin] ?? t.begin,
        //         localShifts[t.begin + t.length] ?? t.begin + t.length,
        //     ),
        // );
        transforms.push(
            str.slice(0, t.begin) +
                `<${tag}>` +
                str.slice(t.begin, t.begin + t.length) +
                `</${tag}>` +
                str.slice(t.begin + t.length),
        );
        localShifts[t.begin] =
            (localShifts[t.begin] ?? t.begin) + `<${tag}>`.length;
        localShifts[t.begin + t.length] =
            (localShifts[t.begin + t.length] ?? t.begin + t.length) +
            `</${tag}>`.length;
        shifts.push(localShifts);
        // console.log(transformed, localShifts);
    }
    return [transforms, shifts];
};

console.log(transformedText("Test here idk"));

// console.log(transformedText);
