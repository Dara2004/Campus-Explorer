import {expect} from "chai";
import * as fs from "fs-extra";
import {InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "../src/controller/IInsightFacade";
import InsightFacade from "../src/controller/InsightFacade";
import Log from "../src/Util";
import TestUtil from "./TestUtil";

// This should match the schema given to TestUtil.validate(..) in TestUtil.readTestQueries(..)
// except 'filename' which is injected when the file is read.
export interface ITestQuery {
    title: string;
    query: any;  // make any to allow testing structurally invalid queries
    isQueryValid: boolean;
    result: any;
    filename: string;  // This is injected when reading the file
}

describe("InsightFacade Add/Remove Dataset", function () {
    // // Reference any datasets you've added to test/data here and they will
    // // automatically be loaded in the 'before' hook.
    // const datasetsToLoad: { [id: string]: string } = {
    //     courses: "./test/data/courses.zip",
    //     bad1: "./test/data/bad1.zip",
    //     bad2: "./test/data/bad2.txt",
    //     rooms: "./test/data/rooms.zip"
    // };
    // let datasets: { [id: string]: string } = {};
    // let insightFacade: InsightFacade;
    // const cacheDir = __dirname + "/../data";
    //
    // before(function () {
    //     // This section runs once and loads all datasets specified in the datasetsToLoad object
    //     // into the datasets object
    //     Log.test(`Before all`);
    //     for (const id of Object.keys(datasetsToLoad)) {
    //         datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
    //     }
    // });
    //
    // beforeEach(function () {
    //     // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
    //     // This runs before each test, which should make each test independent from the previous one
    //     Log.test(`BeforeTest: ${this.currentTest.title}`);
    //     try {
    //         fs.removeSync(cacheDir);
    //         fs.mkdirSync(cacheDir);
    //         insightFacade = new InsightFacade();
    //     } catch (err) {
    //         Log.error(err);
    //     }
    // });
    //
    // after(function () {
    //     Log.test(`After: ${this.test.parent.title}`);
    // });
    //
    // afterEach(function () {
    //     Log.test(`AfterTest: ${this.currentTest.title}`);
    // });
    //
    // // This is a unit test. You should create more like this!
    // it("Should add a valid courses dataset", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect(result).to.deep.equal(expected);
    //     }).catch((err: any) => {
    //         expect.fail(err, expected, "Should not have rejected");
    //     });
    // });
    // it("Should add a valid rooms dataset", function () {
    //     const id: string = "rooms";
    //     const expected: string[] = [id];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
    //         expect(result).to.deep.equal(expected);
    //     }).catch((err: any) => {
    //         expect.fail(err, expected, "Should not have rejected");
    //     });
    // });
    //
    // it("Should reject if using wrong kind", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("Should reject if the zip file has no courses folder", function () {
    //     const id = "bad1";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // it("Should reject if dataset is not a zip file", function () {
    //     const id = "bad2";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // // An id is invalid if it contains an underscore
    // it("Should reject with InsightError if adding id contains an underscore", function () {
    //     const id = "%_%";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // // An id is invalid if it is only whitespace character
    // it("Should reject with InsightError if adding id is only whitespace character", function () {
    //     const id: string = " ";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((r) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // // Id already existed in added dataset, should be rejected and not saved
    // it ("Should reject with InsightError if adding id already existed in added dataset", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect(result).to.deep.equal([id]);
    //         insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((r) => {
    //             expect.fail(); // if promise resolves, the test fail
    //         }).catch((err: any) => {
    //             expect(err).to.be.an.instanceOf(InsightError);
    //         });
    //     }).catch((err: any) => {
    //         expect.fail(err, expected, "Should be added unless not implemented");
    //     });
    // });
    // it ("Should reject adding if the id is null", function () {
    //     const id: string = null;
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((r: string[]) => {
    //         expect.fail(0, 0, "Cannot be added if id is null");
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // it ("Should reject adding if the content is null", function () {
    //     const id: string = "courses";
    //     return insightFacade.addDataset(id, null, InsightDatasetKind.Courses).then((r: string[]) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // it ("Should reject adding if the id is an empty string", function () {
    //     const id: string = "";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((r: string[]) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // // Should remove successfully
    // it ("Should remove valid courses dataset", function () {
    //     const id: string = "courses";
    //     const expected: string = id;
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect(result).to.deep.equal([id]);
    //         insightFacade.removeDataset(id).then((r: string) => {
    //             expect(r).to.be.deep.equal(expected);
    //         }).catch((err: any) => {
    //             expect.fail(err, expected, "Should be removed unless not implemented");
    //         });
    //     }).catch((err: any) => {
    //         expect.fail(err, expected, "Should be added unless not implemented");
    //     });
    // });
    // it ("Should remove valid rooms dataset", function () {
    //     const id: string = "rooms";
    //     const expected: string = id;
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Rooms).then((result: string[]) => {
    //         expect(result).to.deep.equal([id]);
    //         insightFacade.removeDataset(id).then((r: string) => {
    //             expect(r).to.be.deep.equal(expected);
    //         }).catch((err: any) => {
    //             expect.fail(err, expected, "Should be removed unless not implemented");
    //         });
    //     }).catch((err: any) => {
    //         expect.fail(err, expected, "Should be added unless not implemented");
    //     });
    // });
    // // Attempting to remove a dataset with valid name but that hasn't been added yet is rejected with NotFoundError
    // it("Should reject with InsightError if removing a dataset that hasn't been added yet", function () {
    //     const id: string = "courses";
    //     const id2: string = "subjects";
    //     const expected: string[] = [id];
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect(result).to.deep.equal([id]);
    //         insightFacade.removeDataset(id2).then((r: string) => {
    //             expect.fail();
    //         }).catch((err: any) => {
    //             expect(err).to.be.an.instanceOf(NotFoundError);
    //         });
    //     }).catch((err: any) => {
    //         expect.fail(err, expected, "Should be added unless not implemented");
    //     });
    // });
    // // Attempting to remove a dataset with valid name but that hasn't been added yet is rejected with NotFoundError
    // it("Should reject with InsightError if removing a dataset that hasn't been added", function () {
    //     const id: string = "courses";
    //     const expected: string[] = [id];
    //     return insightFacade.removeDataset(id).then((r: string) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(NotFoundError);
    //     });
    // });
    // // Attemp to remove invalid id which contains an underscore, reject with an InsightError
    // it ("Should reject with InsightError if removing an id which contains an underscore", function () {
    //     const id: string = "%_%";
    //     return insightFacade.removeDataset(id).then((r: string) => {
    //         expect.fail(0, 0, "Cannot be removed if id contains an underscore");
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // // atttempt to remove invalid id which is only whitespace characters, reject with an InsightError
    // it ("Should reject with InsightError if removing an id which is a whitespace character", function () {
    //     const id: string = " ";
    //     return insightFacade.removeDataset(id).then((r: string) => {
    //         expect.fail(0, 0, "Cannot be removed if id is a whitespace");
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // it ("Should reject removing if the id is null", function () {
    //     const id: string = null;
    //     return insightFacade.removeDataset(id).then((r: string) => {
    //         expect.fail(0, 0, "Cannot be removed if id is null");
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
    // it ("Should reject removing if the id is an empty string", function () {
    //     const id: string = "";
    //     return insightFacade.removeDataset(id).then((r: string) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
});
/*
 * This test suite dynamically generates tests from the JSON files in test/queries.
 * You should not need to modify it; instead, add additional files to the queries directory.
 * You can still make tests the normal way, this is just a convenient tool for a majority of queries.
 */
describe("InsightFacade PerformQuery", () => {
    // const datasetsToQuery: { [id: string]: {path: string, kind: InsightDatasetKind} } = {
    //     courses: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    //     rooms: {path: "./test/data/rooms.zip", kind: InsightDatasetKind.Rooms},
    //     courses2: {path: "./test/data/courses.zip", kind: InsightDatasetKind.Courses},
    // };
    // let insightFacade: InsightFacade;
    // let testQueries: ITestQuery[] = [];
    //
    // // Load all the test queries, and call addDataset on the insightFacade instance for all the datasets
    // before(function () {
    //     Log.test(`Before: ${this.test.parent.title}`);
    //
    //     // Load the query JSON files under test/queries.
    //     // Fail if there is a problem reading ANY query.
    //     try {
    //         testQueries = TestUtil.readTestQueries();
    //     } catch (err) {
    //         expect.fail("", "", `Failed to read one or more test queries. ${err}`);
    //     }
    //
    //     // Load the datasets specified in datasetsToQuery and add them to InsightFacade.
    //     // Will fail* if there is a problem reading ANY dataset.
    //     const loadDatasetPromises: Array<Promise<string[]>> = [];
    //     insightFacade = new InsightFacade();
    //     for (const id of Object.keys(datasetsToQuery)) {
    //         const ds = datasetsToQuery[id];
    //         const data = fs.readFileSync(ds.path).toString("base64");
    //         loadDatasetPromises.push(insightFacade.addDataset(id, data, ds.kind));
    //     }
    //     return Promise.all(loadDatasetPromises).catch((err) => {
    //         /* *IMPORTANT NOTE: This catch is to let this run even without the implemented addDataset,
    //          * for the purposes of seeing all your tests run.
    //          * TODO For C1, remove this catch block (but keep the Promise.all)
    //          */
    //         return Promise.resolve("HACK TO LET QUERIES RUN");
    //     });
    // });
    //
    // beforeEach(function () {
    //     Log.test(`BeforeTest: ${this.currentTest.title}`);
    // });
    //
    // after(function () {
    //     Log.test(`After: ${this.test.parent.title}`);
    // });
    //
    // afterEach(function () {
    //     Log.test(`AfterTest: ${this.currentTest.title}`);
    // });
    //
    // // Dynamically create and run a test for each query in testQueries
    // // Creates an extra "test" called "Should run test queries" as a byproduct. Don't worry about it
    // it("Should run test queries", function () {
    //     describe("Dynamic InsightFacade PerformQuery tests", function () {
    //         for (const test of testQueries) {
    //             it(`[${test.filename}] ${test.title}`, function (done) {
    //                 insightFacade.performQuery(test.query).then((result) => {
    //                     TestUtil.checkQueryResult(test, result, done);
    //                 }).catch((err) => {
    //                     TestUtil.checkQueryResult(test, err, done);
    //                 });
    //             });
    //         }
    //     });
    // });
    //
    // it ("Should reject performing query if the id is an empty string", function () {
    //     const id: string = "";
    //     return insightFacade.performQuery(id).then((r: InsightDataset[]) => {
    //         expect.fail();
    //     }).catch((err: any) => {
    //         expect(err).to.be.an.instanceOf(InsightError);
    //     });
    // });
});

describe("InsightFacade ListDatasets", () => {
    // const datasetsToLoad: { [id: string]: string } = {
    //     courses: "./test/data/courses.zip",
    //     rooms: "./test/data/rooms.zip"
    // };
    // let datasets: { [id: string]: string } = {};
    // let insightFacade: InsightFacade;
    // const cacheDir = __dirname + "/../data";
    //
    // before(function () {
    //     // This section runs once and loads all datasets specified in the datasetsToLoad object
    //     // into the datasets object
    //     Log.test(`Before all`);
    //     for (const id of Object.keys(datasetsToLoad)) {
    //         datasets[id] = fs.readFileSync(datasetsToLoad[id]).toString("base64");
    //     }
    // });
    //
    // beforeEach(function () {
    //     // This section resets the data directory (removing any cached data) and resets the InsightFacade instance
    //     // This runs before each test, which should make each test independent from the previous one
    //     Log.test(`BeforeTest: ${this.currentTest.title}`);
    //     try {
    //         fs.removeSync(cacheDir);
    //         fs.mkdirSync(cacheDir);
    //         insightFacade = new InsightFacade();
    //     } catch (err) {
    //         Log.error(err);
    //     }
    // });
    //
    // after(function () {
    //     Log.test(`After: ${this.test.parent.title}`);
    // });
    //
    // afterEach(function () {
    //     Log.test(`AfterTest: ${this.currentTest.title}`);
    // });
    //
    // it("Should list all datasets", function () {
    //     const id: string = "courses";
    //     const id2: string = "rooms";
    //     return insightFacade.addDataset(id, datasets[id], InsightDatasetKind.Courses).then((result: string[]) => {
    //         expect(result).to.be.deep.equal([id]);
    //         return insightFacade.addDataset(id2, datasets[id2], InsightDatasetKind.Rooms).then((res: string[]) => {
    //             expect(res.length).to.equal(2);
    //             return insightFacade.listDatasets().then((r: InsightDataset[]) => {
    //                 Log.trace("listDataset returned");
    //                 let containsFirstDataset: boolean = r.some((insightDataset: InsightDataset) => {
    //                    return insightDataset.id === id && insightDataset.numRows === 64612
    //                        && insightDataset.kind === InsightDatasetKind.Courses;
    //                 });
    //                 expect(containsFirstDataset).to.equal(true);
    //                 let containsSecondDataset: boolean = r.some((insightDataset: InsightDataset) => {
    //                     return insightDataset.id === id2 && insightDataset.numRows === 364
    //                         && insightDataset.kind === InsightDatasetKind.Rooms;
    //                 });
    //                 expect(containsSecondDataset).to.equal(true);
    //             }).catch((err: any) => {
    //                 Log.error("List Datasets got an error");
    //                 expect.fail(err, 0, "Should not have rejected unless listdataset not implemented");
    //             });
    //         }).catch((err: any) => {
    //             Log.trace(err);
    //             expect.fail();
    //         });
    //     }).catch((err: any) => {
    //         expect.fail(err, 0, "Should not have rejected unless addDataset not implemented");
    //     });
    // });
});
