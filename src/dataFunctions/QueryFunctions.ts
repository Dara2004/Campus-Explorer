import {CourseSection} from "../model/CourseSection";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {mCoursesKeys, mRoomsKeys, sCoursesKeys, sRoomsKeys} from "../model/Keys";

// PRECONDITION: filter is not {}
export const shouldIncludeItem = (item: any, filter: any, kind: InsightDatasetKind): boolean => {
    if (filter.OR) {
        return executeOR(item, filter.OR, kind);
    } else if (filter.AND) {
        return executeAND(item, filter.AND, kind);
    } else if (filter.NOT) {
        return !(shouldIncludeItem(item, filter.NOT, kind));
    } else if (filter.IS) {
        return executeIS(item, filter.IS, kind);
    } else if (filter.LT) {
        return executeMCompare(item, filter.LT, kind, "LT");
    } else if (filter.GT) {
        return executeMCompare(item, filter.GT, kind, "GT");
    } else if (filter.EQ) {
        return executeMCompare(item, filter.EQ, kind, "EQ");
    }
};

const stringMatch = (sectionString: string, inputString: string): boolean => {
    if (inputString[0] === "*" && inputString[inputString.length - 1] === "*") {
        return sectionString.includes(inputString.substr(1, inputString.length - 2));
    } else if (inputString[0] === "*") {
        return sectionString.endsWith(inputString.substr(1));
    } else if (inputString[inputString.length - 1] === "*") {
        return sectionString.startsWith(inputString.substr(0, inputString.length - 1));
    } else {
        return sectionString === inputString;
    }
};

const executeIS = (item: any, filter: any, kind: InsightDatasetKind): boolean => {
    let ISkeys = Object.keys(filter);
    let ISkey = ISkeys[0].substring(ISkeys[0].indexOf("_") + 1);
    let ISvals: string[] = Object.values(filter);
    let ISval: string = ISvals[0];
    let items;
    if (kind === InsightDatasetKind.Courses) {
        items = sCoursesKeys;
    } else if (kind === InsightDatasetKind.Rooms) {
        items = sRoomsKeys;
    }
    for (const i of items) {
        if (i === ISkey) {
            return stringMatch(item[i], ISval);
        }
    }
};

const executeMCompare = (item: any, filter: any, kind: InsightDatasetKind, mComparator: string): boolean => {
    let keys = Object.keys(filter);
    let key = keys[0].substring(keys[0].indexOf("_") + 1);
    let val = Object.values(filter)[0];
    let items;
    if (kind === InsightDatasetKind.Courses) {
        items = mCoursesKeys;
    } else if (kind === InsightDatasetKind.Rooms) {
        items = mRoomsKeys;
    }
    for (const i of items) {
        if (i === key) {
            if (mComparator === "EQ") {
                return (val === item[i]);
            } else if (mComparator === "LT") {
                return (val > item[i]);
            } else if (mComparator === "GT") {
                return (val < item[i]);
            }
        }
    }
};

const executeOR = (cs: CourseSection, filters: any[], kind: InsightDatasetKind): boolean => {
    for (const filter of filters) {
        if (shouldIncludeItem(cs, filter, kind)) {
            return true;
        }
    }
    return false;
};

const executeAND = (cs: CourseSection, filters: any[], kind: InsightDatasetKind): boolean => {
    for (const filter of filters) {
        if (!shouldIncludeItem(cs, filter, kind)) {
            return false;
        }
    }
    return true;
};
