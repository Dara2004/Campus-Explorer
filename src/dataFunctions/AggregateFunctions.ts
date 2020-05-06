import {CourseSection} from "../model/CourseSection";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {Decimal} from "decimal.js";

export const performTransformation = (query: any, queryResult: any[]) => {
    let groupResultMap = groupResults(queryResult, query);
    if (query.TRANSFORMATIONS.APPLY.length === 0) { // if APPLY array is empty then return only groups
        return generateGroupColumnWithoutApply(groupResultMap, query);
    } else {
        return executeApply(query, groupResultMap);
    }
};

const generateGroupColumnWithoutApply = (groupResultMap: any, query: any): any[] => {
    let groupResult: any[] = [];
    for (const comboKeyString in groupResultMap) {
        let comboKeyArr = JSON.parse(comboKeyString); // [ "Small Group", "Allard Hall (LAW)" ]
        let obj: any = {};
        for (let i = 0; i < query.TRANSFORMATIONS.GROUP.length; i++) {
            obj[query.TRANSFORMATIONS.GROUP[i]] = comboKeyArr[i]; // "rooms_fullname": "Allard Hall (LAW)"
        }
        groupResult.push(obj);
    }
    return groupResult;
};

function groupResults(queryResult: any[], query: any) {
    let groupResultMap: any = {}; // a map from each unique groupBy val to a list of courses or rooms
    for (const res of queryResult) { // iterate through all courses or rooms
        let comboKey: any = [];
        // build comboKey from query.TRANSFORMATIONS.GROUP array of keys
        for (const key of query.TRANSFORMATIONS.GROUP) {
            const actualKey = key.split("_")[1]; // eg: fullname
            comboKey.push(res[actualKey]); // eg: res: { fullname: "Allard Hall (LAW)" }
            // comboKey = [ "Small Group", "Allard Hall (LAW)" ]
        }
        let comboKeyString = JSON.stringify(comboKey); // create a string from comboKey
        // "[ "Small Group", "Allard Hall (LAW)" ]"
        if (!groupResultMap[comboKeyString]) { // if group hasnt existed for current value, create one
            groupResultMap[comboKeyString] = [res]; // { "[ "Small Group", "Allard Hall (LAW)" ]": [] }
        } else {
            groupResultMap[comboKeyString].push(res); // else push item to its group
        }
    }
    return groupResultMap;
}

const executeApply = (query: any, groupResultMap: any): any[] => {
    let applyRules: any[] = query.TRANSFORMATIONS.APPLY;
    let result: any[] = [];
    for (const comboKeyString in groupResultMap) {
        let group: any[] = groupResultMap[comboKeyString]; // get each group and apply rule to it
        let resultObj: any = {};
        for (const rule of applyRules) {
            let ruleName = Object.keys(rule)[0]; // "overallAvg"
            let obj: any = Object.values(rule)[0]; // { "AVG": "courses_avg" }
            let applyToken: string = Object.keys(obj)[0]; // "AVG"
            let applyColumn: string = obj[applyToken]; // "courses_avg"
            let calculatedVal;
            if (applyToken === "AVG") {
                calculatedVal = sumOrAvgPerGroup(group, applyColumn, true);
            } else if (applyToken === "COUNT") {
                calculatedVal = countPerGroup(group, applyColumn);
            } else if (applyToken === "MIN") {
                calculatedVal = minPerGroup(group, applyColumn);
            } else if (applyToken === "MAX") {
                calculatedVal = maxPerGroup(group, applyColumn);
            } else if (applyToken === "SUM") {
                calculatedVal = sumOrAvgPerGroup(group, applyColumn, false);
            }
            resultObj[ruleName] = calculatedVal; // "countRoomTypes": 2, "avgSeats": 144
        }
        // generate group columns
        let comboKeyArr = JSON.parse(comboKeyString); // [ "Small Group", "Allard Hall (LAW)" ]
        for (let i = 0; i < query.TRANSFORMATIONS.GROUP.length; i++) {
            resultObj[query.TRANSFORMATIONS.GROUP[i]] = comboKeyArr[i]; // "rooms_fullname": "Allard Hall (LAW)"
        }
        result.push(resultObj);
    }
    return result;
};

const sumOrAvgPerGroup = (group: any[], applyColumn: string, isAvg: boolean) => {
    let sum = new Decimal(0);
    for (const item of group) {
        let dec = new Decimal(item[applyColumn.split("_")[1]]);
        sum = sum.add(dec);
    }
    if (isAvg) {
        return Number((sum.toNumber() / group.length).toFixed(2));
    }
    return Number(sum.toFixed(2));
};

// count number of unique things in each group with regard to the applyColumn
const countPerGroup = (group: any[], applyColumn: string): number => {
    const applyColArr: any[] = [applyColumn]; // arr with applyColumn as the only element to call groupResults
    let newGroupResultMap: any = groupResults(group, {TRANSFORMATIONS: {GROUP: applyColArr}});
    return Object.keys(newGroupResultMap).length;
};

const minPerGroup = (group: any[], applyColumn: string): number => {
    let min: number = Infinity;
    for (const item of group) {
        if (item[applyColumn.split("_")[1]] < min) {
            min = item[applyColumn.split("_")[1]];
        }
    }
    return min;
};

const maxPerGroup = (group: any[], applyColumn: string): number => {
    let max: number = 0;
    for (const item of group) {
        if (item[applyColumn.split("_")[1]] > max) {
            max = item[applyColumn.split("_")[1]];
        }
    }
    return max;
};
