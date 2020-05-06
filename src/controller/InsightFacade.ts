import Log from "../Util";
import {
    IInsightFacade,
    InsightDataset,
    InsightDatasetKind,
    InsightError,
    NotFoundError,
    ResultTooLargeError
} from "./IInsightFacade";
import {Dataset} from "../model/Dataset";
import {zipToCourseSections} from "../dataFunctions/CourseParsing";
import {loadEverythingFromDisk, saveToDisk} from "../dataFunctions/SavingToDisk";
import {shouldIncludeItem} from "../dataFunctions/QueryFunctions";
import {validateQuery, validateQueryBeforeGetId} from "../dataFunctions/ValidateFunctions";
import {zipToRooms} from "../dataFunctions/RoomParsing";
import {performTransformation} from "../dataFunctions/AggregateFunctions";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

    public datasets: Dataset[] = [];

    constructor() {
        this.datasets = loadEverythingFromDisk();
        Log.trace("Loaded data from disk");
    }

    public containsId (id: string): boolean {
        return (this.datasets.some((d: Dataset): boolean => {
            return (id === d.id);
        }));
    }

    public getDatasetIds (): string[] {
        return this.datasets.map((d: Dataset) => d.id);
    }

    public addDatasetHelper(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        let zipHelper;
        if (kind === InsightDatasetKind.Courses) {
            zipHelper = zipToCourseSections;
        } else if (kind === InsightDatasetKind.Rooms) {
            zipHelper = zipToRooms;
        } else {
            Promise.reject(new InsightError("invalid dataset kind"));
        }
        if (this.containsId(id)) {
            return Promise.reject(new InsightError("Id already exists"));
        } else {
            const d: Dataset = new Dataset(kind);
            d.id = id; // id is specified by user
            return zipHelper(content).then((result: any[]) => {
                if (result.length === 0) {  // if zip file is invalid, return no room
                    return Promise.reject(new InsightError("Invalid dataset"));
                }
                d.items = result;
                d.size = result.length;
                Log.trace("Number of rooms obtained from zip file: " + result.length);
                this.datasets.push(d);
                saveToDisk(this.datasets);
                return Promise.resolve(this.getDatasetIds());
            }).catch((errFromJSZip: any) => {
                Log.trace(errFromJSZip);
                return Promise.reject(new InsightError(errFromJSZip));
            });
        }
    }

    public addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
        if (id == null || id === "" || id.includes("_") || id.trim().length === 0) {
            return Promise.reject(new InsightError("Invalid id"));
        }

        return this.addDatasetHelper(id, content, kind);
    }

    public removeDataset(id: string): Promise<string> {
        // remove a dataset that hasn't been added yet counts as an error
        let filteredArr;
        if (id == null || id === "" || id.includes("_") || id.trim().length === 0) {
            return Promise.reject(new InsightError("Invalid id"));
        } else if (!this.containsId(id)) {
            return Promise.reject(new NotFoundError("Id not found"));
        } else {
            filteredArr = this.datasets.filter((d: Dataset) => {
                return (d.id !== id);
            });
            this.datasets = filteredArr;
            saveToDisk(this.datasets);
            return Promise.resolve(id);
        }
    }

    private getIdFromArray(arr: string[]) {
        if (arr != null) {
            return arr[0].split("_")[0]; // get id out of column or group key
        }
    }

    private getIdFromQuery (query: any): string {
        let idStr: string = "";
        if (!Object.keys(query).includes("TRANSFORMATIONS")) {
            idStr = this.getIdFromArray(query.OPTIONS.COLUMNS);
        } else {
            idStr = this.getIdFromArray(query.TRANSFORMATIONS.GROUP);
        }
        return idStr;
    }

    private getDatasetById(id: string): Dataset {
        const foundDatasets = this.datasets.filter((ds) => ds.id === id);
        if (foundDatasets.length === 0) {
            return null;
        } else {
            return foundDatasets[0];
        }
    }

    public performQuery(query: any): Promise <any[]> {
        if (!query) {
            return Promise.reject(new InsightError("query is null"));
        }
        let [isValid, invalidReason] = validateQueryBeforeGetId(query);
        if (!isValid) {
            Log.trace(invalidReason);
            return Promise.reject(new InsightError(invalidReason));
        }
        const idStr = this.getIdFromQuery(query);
        const ds = this.getDatasetById(idStr);
        if (!ds) {
            const errorMessage = "Dataset not found. ID = " + idStr;
            Log.trace(errorMessage);
            return Promise.reject(new InsightError(errorMessage));
        }
        [isValid, invalidReason] = validateQuery(query, ds);
        if (isValid) {
            return this.performValidQuery(query, ds);
        } else {
            Log.trace(invalidReason);
            return Promise.reject(new InsightError(invalidReason));
        }
    }

    public performValidQuery(query: any, ds: Dataset): Promise<any[]> {
        let queryResult = this.executeWhereQuery(query, ds); // queryResult is an array of courses or rooms
        if (Object.keys(query).includes("TRANSFORMATIONS")) { // then there must be GROUP and APPLY
            queryResult = performTransformation(query, queryResult);
        }
        queryResult = this.filterColumns(queryResult, query);
        queryResult = this.sortByOrder(query, queryResult);

        if (queryResult.length > 5000) {
            return Promise.reject(new ResultTooLargeError("The result is too big."));
        } else {
            return Promise.resolve(queryResult);
        }
    }

    private executeWhereQuery(query: any, ds: Dataset) {
        let queryResult: any[] = [];

        for (const item of ds.items) {
            if (Object.keys(query.WHERE).length === 0) {
                queryResult.push(item);
            } else if (shouldIncludeItem(item, query.WHERE, ds.kind)) {
                queryResult.push(item);
            }
        }
        return queryResult;
    }


    private sortByOrder(query: any, queryResult: any[]) {
        if (query.OPTIONS.ORDER) {
            if (typeof (query.OPTIONS.ORDER) === "string") {
                queryResult = queryResult.sort((item1: any, item2: any) => {
                    if (item1[query.OPTIONS.ORDER] < item2[query.OPTIONS.ORDER]) {
                        return -1;
                    } else if (item1[query.OPTIONS.ORDER] > item2[query.OPTIONS.ORDER]) {
                        return 1;
                    } else {
                        return 0;
                    }
                });
            } else if (typeof query.OPTIONS.ORDER === "object") {
                const isUp = (query.OPTIONS.ORDER.dir === "UP");
                const keys: any[] = query.OPTIONS.ORDER["keys"];
                queryResult = queryResult.sort((item1: any, item2: any) => {
                    for (const key of keys) {
                        if (item1[key] < item2[key]) {
                            return isUp ? -1 : 1;
                        } else if (item1[key] > item2[key]) {
                            return isUp ? 1 : -1;
                        }
                    }
                    return 0;
                });
            }
        }
        return queryResult;
    }

    private filterColumns(queryResult: any[], query: any) {
        queryResult = queryResult.map((item: any) => { // transform result to only include columns
            let result: any = {};
            for (const column of query.OPTIONS.COLUMNS) {
                let key = column;
                if (!query.TRANSFORMATIONS) {
                    key = column.split("_")[1];
                }
                result[column] = item[key];
            }
            return result;
        });
        return queryResult;
    }

    public listDatasets(): Promise<InsightDataset[]> {
        const result: InsightDataset[] = [];
        let iDataset: InsightDataset;
        for (const d of this.datasets) {
            if (d.kind === InsightDatasetKind.Courses) {
                iDataset = {id: d.id, kind: InsightDatasetKind.Courses, numRows: d.size};
            } else if (d.kind === InsightDatasetKind.Rooms) {
                iDataset = {id: d.id, kind: InsightDatasetKind.Rooms, numRows: d.size};
            }
            result.push(iDataset);
        }
        return Promise.resolve(result);
    }
}
