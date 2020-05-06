import {Dataset} from "../model/Dataset";
import * as fs from "fs-extra";
import Log from "../Util";
import {InsightDatasetKind} from "../controller/IInsightFacade";

const filename: string = "./data/datasets.json";

/*
    You are not allowed to store the data in a database.
    You must also write a copy of the model to disk, and should be able to load these files to be queried if necessary.
    These files should be saved to the <PROJECT_DIR>/data directory.
    Make sure not to commit these files to version control, as this may cause unpredicted test failures.
 */

export const saveToDisk = (cs: Dataset[]): void => {
    fs.writeFileSync(filename, JSON.stringify(cs, null, 4));
    Log.trace("File has been created");
};

export const loadEverythingFromDisk = (): Dataset[] => {
    let obj: any[];
    try {
        obj = JSON.parse(fs.readFileSync(filename, "utf8"));
    } catch (e) {
        Log.error("Load from disk JSON Parsing failed");
        obj = [];
    }
    Log.trace("Done loading everything from disk");
    Log.trace(" -- Number of datasets: " + obj.length);
    return obj;
};
