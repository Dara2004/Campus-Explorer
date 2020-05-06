import {InsightDatasetKind, InsightError} from "../controller/IInsightFacade";
import {validateKey, validateOrder, validateTransformations} from "./ValidateFunctionsExtension";
import {Dataset} from "../model/Dataset";
import {allCoursesKeys, allRoomsKeys} from "../model/Keys";

export const isBad = ([isValid, reason]: [boolean, string]) => {
    return !isValid;
};

export const checkNumberOfKeysInQuery = (query: any): [boolean, string] => {
    const keys = Object.keys(query);
    if (keys.length !== 2) {
        if (keys.length === 3) {
            return [keys.includes("TRANSFORMATIONS"), "Query has 3 keys but does not have TRANSFORMATIONS"];
        }
        return [false, "Query does not have TRANSFORMATIONS and does not have 2 keys"];
    }
    return [true, ""];
};

const checkForNecessaryKeys = (query: any): [boolean, string] =>  {
    if (!Object.keys(query).includes("OPTIONS")) {
        return [false, "Missing OPTIONS"];
    }
    if (!Object.keys(query).includes("WHERE")) {
        return [false, "Missing WHERE"];
    }
    return [true, ""];
};

const validateOptions = (query: any, ds: Dataset): [boolean, string]  => {
    const keys = Object.keys(query.OPTIONS);
    if (keys.includes("ORDER")) {
        if (keys.length !== 2) {
            return [false, "Options must have 2 keys if it has Order"];
        }
    } else {
        if (keys.length !== 1) {
            return [false, "Options must have 1 keys if it has no Order"];
        }
    }
    let validationResult = validateColumns(query, ds);
    if (isBad(validationResult)) {
        return validationResult;
    }
    if (Object.keys(query.OPTIONS).includes("ORDER")) {
        validationResult = validateOrder(query);
        if (isBad(validationResult)) {
            return validationResult;
        }
    }
    return [true, ""];
};

const validateKeyArrayBeforeGetId = (keys: any, type: string): [boolean, string] => {
    if (!Array.isArray(keys) || keys.length === 0) {
        return [false, type + " must be a non-empty array"];
    }
    const firstKey = keys[0];
    if (typeof firstKey !== "string") {
        return [false, type + " key must be a string"];
    }
    if (firstKey.split("_").length !== 2) {
        return [false, type + " key must have 1 underscore"];
    }
    if (firstKey.split("_")[0].trim() === "") {
        return [false, type + " key's id must not be empty / whitespace"];
    }
    return [true, ""];
};

export const validateOptionsBeforeGetId = (query: any): [boolean, string] => {
    const optionsKeys = Object.keys(query.OPTIONS);
    if (!optionsKeys.includes("COLUMNS")) {
        return [false, "Missing COLUMNS"];
    }
    const columns = query.OPTIONS.COLUMNS;
    return validateKeyArrayBeforeGetId(columns, "Columns");
};

export const validateTransformationsBeforeGetId = (query: any): [boolean, string] => {
    // validate the columns
    const options = query.OPTIONS;
    if (options == null || Array.isArray(options) || typeof options !== "object") {
        return [false, "OPTIONS is not object"];
    }
    const columns = options.COLUMNS;
    if (!Array.isArray(columns) || columns.length === 0) {
        return [false, "COLUMNS is not a non-empty array"];
    }
    for (const col of columns) {
        if (typeof col !== "string") {
            return [false, "COLUMNS has a non-string elem"];
        }
    }
    const tf = query.TRANSFORMATIONS;
    if (!tf) {
        return [false, "TRANSFORMATIONS is null"];
    }
    if (typeof tf !==  "object") {
        return [false, "TRANSFORMATIONS must be an object"];
    }
    const keys = Object.keys(tf);
    if (keys.length !== 2) {
        return [false, "TRANSFORMATIONS must have 2 keys"];
    }
    if (!keys.includes("GROUP")) {
        return [false, "no GROUP"];
    }
    if (!keys.includes("APPLY")) {
        return [false, "no APPLY"];
    }
    const group = query.TRANSFORMATIONS.GROUP;
    return validateKeyArrayBeforeGetId(group, "Group");
};

export const validateQueryBeforeGetId = (query: any): [boolean, string] => {
    if (typeof query !== "object") {
        return [false, "query is not an object"];
    }
    let validationResult = checkNumberOfKeysInQuery(query);
    if (isBad(validationResult)) {
        return validationResult;
    }
    validationResult = checkForNecessaryKeys(query);
    if (isBad(validationResult)) {
        return validationResult;
    }
    if (Object.keys(query).includes("TRANSFORMATIONS")) {
        return validateTransformationsBeforeGetId(query);
    } else {
        return validateOptionsBeforeGetId(query);
    }
};

export const validateQuery = (query: any, ds: Dataset): [boolean, string] => {
    let validationResult;
    if (Object.keys(query).includes("TRANSFORMATIONS")) {
        validationResult = validateTransformations(query, ds);
        if (isBad(validationResult)) {
            return validationResult;
        }
    }
    validationResult = validateOptions(query, ds);
    if (isBad(validationResult)) {
        return validationResult;
    }

    // If query.WHERE is an object with 0 keys, return valid
    if (typeof query.WHERE === "object" && !Array.isArray(query.WHERE)) {
        if (Object.keys(query.WHERE).length === 0) {
            return [true, ""];
        }
    }
    return validateFilter(query.WHERE, ds);
};

const getApplyKeys = (query: any): string[] => {
    return query.TRANSFORMATIONS.APPLY.map((apply: any) => Object.keys(apply)[0]);
};

const validateColumns = (query: any, ds: Dataset): [boolean, string] => {
    const columns = query.OPTIONS.COLUMNS;

    if (Object.keys(query).includes("TRANSFORMATIONS")) {
        for (const column of columns) {
            let applyKeys = getApplyKeys(query);
            const groups = query.TRANSFORMATIONS.GROUP;
            const apply = query.TRANSFORMATIONS.APPLY;
            if (!groups.includes(column) && !applyKeys.includes(column)) {
                return [false, "Column must be in group or be an applykey"];
            }
        }
        return [true, "ok"];
    } else {
        const kind = ds.kind;
        for (const column of columns) {
            const [isValid, reason] = validateKey(column, ds);
            if (!isValid) {
                return [false, reason + " .. in columns"];
            }
        }
        return [true, "Valid"];
    }
};

const validateFilter = (filter: any, ds: Dataset): [boolean, string] => {
    if (typeof filter !== "object" && !Array.isArray(filter)) {
        return [false, "filter must be an object"];
    }
    if (Object.keys(filter).length !== 1) {
        return [false, "filter must have 1 key"];
    }
    if (filter.OR) {
        return validateAndOr(filter.OR, ds, "OR");
    } else if (filter.AND) {
        return validateAndOr(filter.AND, ds, "AND");
    } else if (filter.NOT) {
        return validateFilter(filter.NOT, ds);
    } else if (filter.IS) {
        return validateIS(filter.IS, ds);
    } else if (filter.LT) {
        return validateComparison(filter.LT, ds, "LT");
    } else if (filter.GT) {
        return validateComparison(filter.GT, ds, "GT");
    } else if (filter.EQ) {
        return validateComparison(filter.EQ, ds, "EQ");
    } else {
        return [false, "invalid filter key"];
    }
};

const validateAndOr = (filters: any, ds: Dataset, pred: string): [boolean, string] => {
    if (!Array.isArray(filters)) {
        return [false, pred + " filter needs to be an array"];
    }
    if (filters.length === 0) {
        return [false, pred + " filter should have at least 1 filter"];
    }
    for (const filter of filters) {
        const [isValid, reason] = validateFilter(filter, ds);
        if (!isValid) {
            return [false, reason + " in + " + pred];
        }
    }
    return [true, ""];
};

const validateComparison = (filter: any, ds: Dataset, comparer: string): [boolean, string] => {
    let keys = Object.keys(filter);
    if (keys.length !== 1) {
        return [false, "Must have 1 key in " + comparer];
    }
    let [isValid, reason] = validateKey(keys[0], ds, false, true);
    if (!isValid) {
        return [false, reason + " in " + comparer];
    }
    let vals = Object.values(filter);
    if (typeof vals[0] !== "number") {
        return [false, "invalid value type in " + comparer];
    }
    return [true, ""];
};

const validateIS = (filter: any, ds: Dataset): [boolean, string] => {
    let ISkeys = Object.keys(filter);
    if (ISkeys.length !== 1) {
        return [false, "IS may not have more than 1 key"];
    }
    let inputString = Object.values(filter)[0];
    if (typeof inputString !== "string") {
        return [false, "Inputstring must be a string"];
    }
    let interior = inputString.substr(1, inputString.length - 2);
    if (interior.includes("*")) {
        return [false, "Asterisks (*) can only " +
                         "be the first or last characters of input strings"];
    }
    let [isValid, reason] = validateKey(ISkeys[0], ds, false, false);
    if (!isValid) {
        return [false, reason + " in IS"];
    }
    return [true, "IS is valid"];
};
