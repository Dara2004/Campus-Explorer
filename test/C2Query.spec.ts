// import {expect} from "chai";
// import {Room} from "../src/model/Room";
// import InsightFacade from "../src/controller/InsightFacade";
// import {Dataset} from "../src/model/Dataset";
// import {InsightDatasetKind} from "../src/controller/IInsightFacade";
// import Log from "../src/Util";
//
// const insightFacade = new InsightFacade();
// const datasetManager = new Dataset(InsightDatasetKind.Rooms);
// insightFacade.datasets = [datasetManager]; // new arr with 1 thing
// const rooms: Room[] = [];
// datasetManager.items = rooms;
// datasetManager.id = "rooms";
//
// const iF2 = new InsightFacade();
// const dM2 = new Dataset(InsightDatasetKind.Rooms);
// iF2.datasets = [dM2];
// const rooms2: Room[] = [];
// dM2.items = rooms2;
// dM2.id = "rooms";
//
// const room = {lat: 1, shortname: "DMP"};
// rooms.push(room as Room);
// const room2 = {lat: 1, shortname: "BUCH"};
// const room3 = {lat: 3, shortname: "ANGU"};
// rooms2.push(room as Room);
// rooms2.push(room2 as Room);
// rooms2.push(room3 as Room);
//
// const genericQuery = () => {
//     const query: any = {};
//     query.WHERE = {};
//     query.OPTIONS = {};
//     query.OPTIONS.COLUMNS = ["rooms_lat", "rooms_shortname"];
//     return query;
// };
//
// const testWHERE = () => {
//     const query: any = {};
//     query.WHERE = {};
//     query.OPTIONS = {};
//     query.OPTIONS.COLUMNS = ["rooms_lat", "rooms_shortname"];
//     query.WHERE.LT = {};
//     query.WHERE.LT.rooms_lat = 10;
//     return query;
// };
// const testORDERbyShortName = () => {
//     const query: any = genericQuery();
//     query.OPTIONS.ORDER = {};
//     query.OPTIONS.ORDER["dir"] = "UP";
//     query.OPTIONS.ORDER["keys"] = ["rooms_shortname", "rooms_lat"];
//     return query;
// };
// const testORDERbyLat = () => {
//     const query: any = genericQuery();
//     query.OPTIONS.ORDER = {};
//     query.OPTIONS.ORDER["dir"] = "UP";
//     query.OPTIONS.ORDER["keys"] = ["rooms_lat", "rooms_shortname"];
//     return query;
// };
//
// const areEqual = (obj1: any, obj2: any): boolean => {
//     if (Object.keys(obj1).length !== Object.keys(obj2).length) {
//         return false;
//     }
//     for (const key of Object.keys(obj1)) {
//         if (obj1[key] !== obj2[key]) {
//             return false;
//         }
//     }
//     return true;
// };
// describe("c2 perform query test", function () {
//    it("empty WHERE", function () {
//         const query = genericQuery();
//         return insightFacade.performValidQuery(query).then((result: any[]) => {
//             expect(result.length).to.be.equal(1);
//             expect(areEqual(result[0], {rooms_lat: 1, rooms_shortname: "DMP"})).to.be.equal(true);
//        }).catch((err) => {
//             Log.error(err);
//             expect.fail();
//        });
//    });
//    it("test EQ IS GT LT", function () {
//         const query = testWHERE();
//         return insightFacade.performValidQuery(query).then((result: any[]) => {
//             expect(result.length).to.be.equal(1);
//             expect(areEqual(result[0], {rooms_lat: 1, rooms_shortname: "DMP"})).to.be.equal(true);
//         }).catch((err) => {
//             Log.error(err);
//             expect.fail();
//         });
//     });
//    it("test EQ IS GT LT negative", function () {
//         const query = testWHERE();
//         query.WHERE.LT.rooms_lat = 0;
//         return insightFacade.performValidQuery(query).then((result: any[]) => {
//             expect(result.length).to.be.equal(0);
//         }).catch((err) => {
//             Log.error(err);
//             expect.fail();
//         });
//     });
//    it("test GROUP", function () {
//        const query = genericQuery();
//        query.TRANSFORMATIONS = {GROUP: ["rooms_lat"], APPLY: []};
//        query.OPTIONS.COLUMNS = ["rooms_lat"];
//        return insightFacade.performValidQuery(query).then((result: any[]) => {
//            expect(result.length).to.be.equal(1);
//            expect(areEqual(result[0], {rooms_lat: 1})).to.be.equal(true);
//        }).catch((err) => {
//            Log.error(err);
//            expect.fail();
//        });
//    });
//    it("test grrrrouup 2 things together", function () {
//        const query = genericQuery();
//        query.TRANSFORMATIONS = {GROUP: ["rooms_lat"], APPLY: []};
//        query.OPTIONS.COLUMNS = ["rooms_lat"];
//        return iF2.performValidQuery(query).then((result: any[]) => {
//            expect(result.length).to.be.equal(1);
//            Log.trace(result[0]);
//            expect(areEqual(result[0], {rooms_lat: 1})).to.be.equal(true);
//        }).catch((err) => {
//            Log.error(err);
//            expect.fail();
//        });
//    });
//    it("test apply SUM", function () {
//        const query = genericQuery();
//        query.TRANSFORMATIONS = {GROUP: ["rooms_lat"], APPLY: []};
//        query.OPTIONS.COLUMNS = ["rooms_lat"];
//        return iF2.performValidQuery(query).then((result: any[]) => {
//            expect(result.length).to.be.equal(1);
//            Log.trace(result[0]);
//            expect(areEqual(result[0], {rooms_lat: 1})).to.be.equal(true);
//        }).catch((err) => {
//            Log.error(err);
//            expect.fail();
//        });
//    });
//    it("test ORDER by shortname", function () {
//         const query = testORDERbyShortName();
//         return iF2.performValidQuery(query).then((result: any[]) => {
//             expect(result.length).to.be.equal(3);
//             expect(areEqual(result[0], {rooms_lat: 3, rooms_shortname: "ANGU"})).to.be.equal(true);
//             expect(areEqual(result[1], {rooms_lat: 1, rooms_shortname: "BUCH"})).to.be.equal(true);
//             expect(areEqual(result[2], {rooms_lat: 1, rooms_shortname: "DMP"})).to.be.equal(true);
//         });
//    });
//    it("test ORDER by lat", function () {
//         const query = testORDERbyLat();
//         return iF2.performValidQuery(query).then((result: any[]) => {
//             expect(result.length).to.be.equal(3);
//             expect(areEqual(result[0], {rooms_lat: 1, rooms_shortname: "BUCH"})).to.be.equal(true);
//             expect(areEqual(result[1], {rooms_lat: 1, rooms_shortname: "DMP"})).to.be.equal(true);
//             expect(areEqual(result[2], {rooms_lat: 3, rooms_shortname: "ANGU"})).to.be.equal(true);
//         });
//     });
// });
