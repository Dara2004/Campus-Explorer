import {InsightDatasetKind} from "../controller/IInsightFacade";
import {isBad} from "./ValidateFunctions";
import {Dataset} from "../model/Dataset";
import {allCoursesKeys, allRoomsKeys, mCoursesKeys, mRoomsKeys, sCoursesKeys, sRoomsKeys} from "../model/Keys";

/**
 * @param key we expect id_key format e.g. rooms_seats
 */
export const validateKey = (key: any, ds: Dataset, allKeys: boolean = true, isM: boolean = false):
    [boolean, string] => {
    const roomsKeys = allKeys ? allRoomsKeys : (isM ? mRoomsKeys : sRoomsKeys);
    const coursesKeys = allKeys ? allCoursesKeys : (isM ? mCoursesKeys : sCoursesKeys);
    if (typeof key !== "string") {
        return [false, "Key must be string"];
    }
    const split = key.split("_");
    if (split.length !== 2) {
        return [false, "Key must contain exactly one underscore"];
    }
    const id = split[0];
    const k = split[1];
    if (id !== ds.id) {
        return [false, "Multiple IDs in query: " + id + ", " + ds.id];
    }
    if (ds.kind === InsightDatasetKind.Rooms) {
        if (!roomsKeys.includes(k)) {
            return [false, "Invalid key in key (the part after underscore) (Kind: Rooms)"];
        }
    } else { // Courses
        if (!coursesKeys.includes(k)) {
            return [false, "Invalid key in key (the part after underscore) (Kind: Courses)"];
        }
    }
    return [true, ""];
};

export const validateOrder = (query: any): [boolean, string] => {
    if (typeof query.OPTIONS.ORDER === "string") {
        if (!query.OPTIONS.COLUMNS.includes(query.OPTIONS.ORDER)) {
            return [false, "ORDER not in COLUMNS"];
        }
    } else if (typeof query.OPTIONS.ORDER === "object") {
        if (Object.keys(query.OPTIONS.ORDER).length !== 2) {
            return [false, "Extra keys in ORDER"];
        }
        if (Array.isArray(query.OPTIONS.ORDER.keys)) {
            if (query.OPTIONS.ORDER.keys.length === 0) {
                return [false, "ORDER keys must be non-empty array"];
            }
            let validationResult = validateDir(query);
            if (isBad(validationResult)) { // verify dir and keys inside order
                return validationResult;
            }
            for (const key of query.OPTIONS.ORDER.keys) {
                if (!query.OPTIONS.COLUMNS.includes(key)) {
                    return [false, "ORDER not in COLUMNS"];
                }
            }
        } else {
            return [false, "ORDER keys must be present and be a non-empty array"];
        }
    } else {
        return [false, "ORDER must be string or object"];
    }
    return [true, ""];
};

export const validateDir = (query: any): [boolean, string] => {
    if (!Object.keys(query.OPTIONS.ORDER).includes("dir")) {
           return [false, "ORDER missing 'dir' key"];
    }
    if (query.OPTIONS.ORDER.dir !== "UP" && query.OPTIONS.ORDER.dir !== "DOWN") {
        return [false, "Invalid ORDER direction"];
    }
    return [true, ""];
};

const validateGroup = (query: any, ds: Dataset): [boolean, string] => {
    const group = query.TRANSFORMATIONS.GROUP;
    // Each group must have format id_field
    for (const groupKey of group) {
        const [isValid, reason] = validateKey(groupKey, ds);
        if (!isValid) {
            return [false, reason + "in Group"];
        }
    }
    return [true, ""];
};

const validateApplyRule = (applyObj: any, ds: Dataset): [boolean, string] => {
    const applyRule: any = Object.values(applyObj)[0];
    if (typeof applyRule !== "object") {
        return [false, "apply rule must be an object"];
    }
    const keys = Object.keys(applyRule);
    if (keys.length !== 1) {
        return [false, "apply rule must have 1 key"];
    }
    const applyToken = keys[0];
    const applyTokens = ["MIN", "MAX", "AVG", "SUM", "COUNT"];
    if (!applyTokens.includes(applyToken)) {
        return [false, "apply token must be one of MIN MAX AVG SUM COUNT (it is " + applyToken + ")"];
    }
    const applyTokenVal = Object.values(applyRule)[0];
    if (applyToken === "COUNT") {
        let [isValid, reason] = validateKey(applyTokenVal, ds, true);
        if (!isValid) {
            return [isValid, reason + " in the apply token"];
        }
    } else {
        let [isValid, reason] = validateKey(applyTokenVal, ds, false, true);
        if (!isValid) {
            return [isValid, reason + " in the apply token"];
        }
    }
    return [true, ""];
};

const validateApply = (query: any, ds: Dataset): [boolean, string] => {
    const apply = query.TRANSFORMATIONS.APPLY;
    if (!Array.isArray(apply)) {
        return [false, "APPLY must be an array"];
    }
    const keys: string[] = [];
    for (const applyObj of apply) {
        if (!applyObj || typeof applyObj !== "object") {
            return [false, "APPLY object must be an object"];
        }
        const applyObjKeys = Object.keys(applyObj);
        if (applyObjKeys.length !== 1 || applyObjKeys[0] === "") {
            return [false, "APPLY object must have 1 non-empty key (the applykey e.g. numSeats"];
        }
        if (!Object.values(applyObj)[0]) {
            return [false, "APPLY value cannot be null"];
        }
        if (keys.includes(applyObjKeys[0])) {
            return [false, "Duplicate keys in APPLY"];
        }
        keys.push(applyObjKeys[0]);
        if (applyObjKeys[0].includes("_")) {
            return [false, "APPLY key (e.g. numSeats) must not have underscore"];
        }
        const validationResult = validateApplyRule(applyObj, ds);
        if (isBad(validationResult)) {
            return validationResult;
        }
    }
    return [true, ""];
};

export const validateTransformations = (query: any, ds: Dataset): [boolean, string] => {
    const tf = query.TRANSFORMATIONS;
    const group = tf.GROUP;
    let validationResult = validateGroup(query, ds);
    if (isBad(validationResult)) {
        return validationResult;
    }
    const apply = tf.APPLY;
    return validateApply(query, ds);
};
