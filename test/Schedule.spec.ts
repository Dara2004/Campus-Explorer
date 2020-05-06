import Scheduler from "../src/scheduler/Scheduler";

import {expect} from "chai";
import Log from "../src/Util";
import {SchedRoom, SchedSection, TimeSlot} from "../src/scheduler/IScheduler";

const scheduler = new Scheduler();

let allowedTime: any = ["MWF 0800-0900", "MWF 0900-1000", "MWF 1000-1100", "MWF 1100-1200", "MWF 1200-1300",
    "MWF 1300-1400", "MWF 1400-1500", "MWF 1500-1600", "MWF 1600-1700", "TR  0800-0930", "TR  0930-1100",
    "TR  1100-1230", "TR  1230-1400", "TR  1400-1530", "TR  1530-1700"];

let sections = [
    {
        courses_dept: "cpsc",
        courses_id: "340",
        courses_uuid: "1319",
        courses_pass: 101,
        courses_fail: 7,
        courses_audit: 2
    },
    {
        courses_dept: "cpsc",
        courses_id: "340",
        courses_uuid: "3397",
        courses_pass: 171,
        courses_fail: 3,
        courses_audit: 1
    },
    {
        courses_dept: "cpsc",
        courses_id: "344",
        courses_uuid: "62413",
        courses_pass: 93,
        courses_fail: 2,
        courses_audit: 0
    },
    {
        courses_dept: "cpsc",
        courses_id: "344",
        courses_uuid: "72385",
        courses_pass: 43,
        courses_fail: 1,
        courses_audit: 0
    }
];

let rooms = [
    {
        rooms_shortname: "AERL",
        rooms_number: "120",
        rooms_seats: 144,
        rooms_lat: 49.26372,
        rooms_lon: -123.25099
    },
    {
        rooms_shortname: "AERL",
        rooms_number: "120",
        rooms_seats: 144,
        rooms_lat: 49.26372,
        rooms_lon: -123.25099
    },
    {
        rooms_shortname: "ANGU",
        rooms_number: "105",
        rooms_seats: 94,
        rooms_lat: 49.2699,
        rooms_lon: -123.25318
    },
    {
        rooms_shortname: "BUCH",
        rooms_number: "A101",
        rooms_seats: 275,
        rooms_lat: 49.26826,
        rooms_lon: -123.25468
    }
];

let output = [ [ { rooms_shortname: "AERL",
    rooms_number: "120",
    rooms_seats: 144,
    rooms_lat: 49.26372,
    rooms_lon: -123.25099 },
    { courses_dept: "cpsc",
        courses_id: "340",
        courses_uuid: "1319",
        courses_pass: 101,
        courses_fail: 7,
        courses_audit: 2 },
    "MWF 0800-0900" ],
    [ { rooms_shortname: "ANGU",
        rooms_number: "098",
        rooms_seats: 260,
        rooms_lat: 49.26486,
        rooms_lon: -123.25364 },
        { courses_dept: "cpsc",
            courses_id: "340",
            courses_uuid: "3397",
            courses_pass: 171,
            courses_fail: 3,
            courses_audit: 1 },
        "MWF 0900-1000" ],
    [ { rooms_shortname: "BUCH",
        rooms_number: "A101",
        rooms_seats: 275,
        rooms_lat: 49.26826,
        rooms_lon: -123.25468 },
        { courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "62413",
            courses_pass: 93,
            courses_fail: 2,
            courses_audit: 0 },
        "MWF 0800-0900" ],
    [ { rooms_shortname: "ALRD",
        rooms_number: "105",
        rooms_seats: 94,
        rooms_lat: 49.2699,
        rooms_lon: -123.25318 },
        { courses_dept: "cpsc",
            courses_id: "344",
            courses_uuid: "72385",
            courses_pass: 43,
            courses_fail: 1,
            courses_audit: 0 },
        "MWF 0900-1000" ] ];

describe("Scheduling problem", function () {
   it("Should schedule all sections", function () {
       const result: Array<[SchedRoom, SchedSection, TimeSlot]> = scheduler.schedule(sections, rooms);
       expect(result.length).to.be.equal(4);
       expect(result).to.be.equal(output);
   });
});
