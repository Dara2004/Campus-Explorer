import {Room} from "../model/Room";
import {InsightError} from "../controller/IInsightFacade";
import {JSZipObject} from "jszip";
import {sendHttpReq} from "./HttpGetGeoLocation";
import JSZip = require("jszip");
// import * as JSZip from "jszip";
import parse5 = require("parse5");

let fullname: string, shortname: string, roomnum: string, name: string, address: string,
    lat: number, lon: number, seats: number, type: string, furniture: string, href: string;

let latLonPromises: {[addr: string]: Promise<any>} = {}; // map addr to lat lon
let latLonObtained: {[addr: string]: {lat: number, lon: number}} = {};

const getTables = (nodes: any[]): any[] => {
    let tables = [];
    for (const node of nodes) {
        if (node.tagName === "table") {
            tables.push(node);
        } else if (node.childNodes) {
            let result = getTables(node.childNodes);
            if (result.length > 0) {
                for (const table of result) {
                    tables.push(table);
                }
            }
        }
    }
    return tables;
};

export const encodeAddress = (addr: string): string => {
    let arr: string[] = addr.split(" ");
    let resultStr = "";
    for (const s of arr) {
        if (arr.indexOf(s) === arr.length - 1) {
            resultStr += s;
            break;
        }
        resultStr += s.concat("%20");
    }
    return resultStr;
};

const setBuildingInfo = (td: any) => {
    let fieldname: string = td.attrs[0].value;
    if (fieldname === "views-field views-field-field-building-code") {
        shortname = td.childNodes[0].value.trim();
    } else if (fieldname === "views-field views-field-title") {
        for (const cnode of td.childNodes) {
            if (cnode.tagName === "a") {
                fullname = cnode.childNodes[0].value.trim();
                break;
            }
        }
    } else if (fieldname === "views-field views-field-field-building-address") {
        address = td.childNodes[0].value.trim();
        let encodedAddr: string = encodeAddress(address);
        // insert lat-lon obtained from http to latLonPromises map at corresponding addr
        latLonPromises[address] = sendHttpReq(encodedAddr);
    }
};

const getBuildingPaths = (table: any): Array<[string, string, string, string]> => {
    let buildings: Array<[string, string, string, string]> = []; // path of building in zip file,shortname,fullname,addr
    for (const node of table.childNodes) {
        if (node.tagName === "tbody") {
            for (const node2 of node.childNodes) {
                if (node2.tagName === "tr") { // each row is a building
                    for (const node3 of node2.childNodes) {
                        if (node3.tagName === "td") { // get the href from the first td tag
                            setBuildingInfo(node3);
                        }
                    }
                    for (const node3 of node2.childNodes) {
                        if (node3.tagName === "td") {
                            for (const node4 of node3.childNodes) {
                                if (node4.tagName === "a") {
                                    for (const attr of node4.attrs) {
                                        if (attr.name === "href") {
                                            buildings.push([attr.value.trim(), shortname, fullname, address]);
                                            break;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            break;
        }
    }
    let pathnames = buildings.map((b) => b[0]); // filter duplicate buildings
    let uniques = buildings.map((b, index) => pathnames.indexOf(b[0]) === index);
    return buildings.filter((b, index) => uniques[index] === true);
};

// parsing document, return the table content
const parseDocument = (str: string): any[] => {
    const document: any = parse5.parse(str);
    for (const node of document.childNodes) {
        if (node.tagName === "html") {
            for (const node2 of node.childNodes) {
                if (node2.tagName === "body") {
                    return getTables(node2.childNodes);
                }
            }
        }
    }
};

const setFieldsFromTable = (trTag: any) => {
    if (!trTag.childNodes) {
        return;
    }
    for (const node of trTag.childNodes) {
        if (node.tagName === "td") { // each td is a column/attr
            let attr = node.attrs[0]; // attrs only have 1 element
            if (!attr) {
                continue;
            }
            if (attr.value === "views-field views-field-field-room-number") {
                roomnum = node.childNodes[1].childNodes[0].value.trim();
            } else if (attr.value === "views-field views-field-field-room-capacity") {
                seats = parseInt(node.childNodes[0].value.trim(), 10);
            } else if (attr.value === "views-field views-field-field-room-furniture") {
                furniture = node.childNodes[0].value.trim();
            } else if (attr.value === "views-field views-field-field-room-type") {
                type = node.childNodes[0].value.trim();
            } else if (attr.value === "views-field views-field-nothing") {
                href = node.childNodes[1].attrs[0].value.trim();
            }
        }
    }
};

const createIndividualClassroomHelper = (file: [JSZip.JSZipObject, string, string, string], tbody: any) => {
    let result: any[] = [];
    for (const child of tbody.childNodes) {
        if (child.tagName === "tr") { // each row is a room record
            let classRoom: Room;
            setFieldsFromTable(child);
            name = file[1] + "_" + roomnum; // file1 =shortname
            classRoom = new Room(file[2], file[1], roomnum, name, file[3], // full, short, address
                seats, type, furniture, href);
            result.push(classRoom);
        }
    }
    return result;
};

const createIndividualClassroom = (file: [JSZip.JSZipObject, string, string, string]): Promise<any[]> => {
    const httpPromise: Promise<any> = latLonPromises[file[3]]; // both promise are async, file3 = address
    const fileAsyncPromise: Promise<any[]> = file[0].async("text").then((html) => {
        let classroomsFromFile: any[] = [];
        let tables = parseDocument(html);
        if (tables.length > 0) {
            for (const table of tables) {
                for (const node of table.childNodes) {
                    if (node.tagName === "tbody") {
                        // generate all the fields for classroom except lat, lon
                        classroomsFromFile = createIndividualClassroomHelper(file, node);
                        break;
                    }
                }
                if (classroomsFromFile.length > 0) {
                    break; // found a valid table
                }
            }
        } else {
            return []; // if a building contains no rooms at all, it can be ignored
        }
        return classroomsFromFile; // file.async is already a promise, func inside .then can ret anything
    });
    // doesnt matter which prom comes first, as long as both resolve then set lat lon
    return Promise.all([httpPromise, fileAsyncPromise]).then((result) => {
        let latLon: any = result[0]; // result from httpPromise
        let rooms: any[] = result[1]; // result from fileAsyncPromise
        for (const room of rooms) {
            room.lat = latLon.lat;
            room.lon = latLon.lon;
            if (latLon.error) { // building's geolocation results in an error, then skip over it
                return [];
            }
        }
        return rooms;
        }
    );
};

const createAllClassrooms = (files: Array<[JSZip.JSZipObject, string, string, string]>): Array<Promise<Room[]>> => {
    let proms: Array<Promise<any[]>> = [];
    for (const file of files) {
        proms.push(createIndividualClassroom(file));
    }
    return proms;
};

export const zipToRooms = (content: string): Promise<any[]> => {
    let allRooms: any[] = [];
    return JSZip.loadAsync(content, {base64: true}).then((zip: JSZip) => {
        const mainFolder: JSZip = zip.folder("rooms"); // returns a folder which is also a JSZip
        const indexFile: JSZipObject = mainFolder.file("index.htm");
        if (!mainFolder) {
            return Promise.reject(new InsightError("No folder named rooms"));
        }
        if (!indexFile) {
            return Promise.reject(new InsightError("No file named index.htm"));
        }
        // read from index.html
        let buildingFiles: Array<[JSZipObject, string, string, string]> = []; // pathname, full, short, addr
        let buildings: Array<[string, string, string, string]> = [];
        return indexFile.async("text").then((html) => {
            let tables = parseDocument(html);
            if (tables.length > 0) {
                for (const table of tables) {
                    buildings = getBuildingPaths(table);
                    if (buildings.length > 0) {
                        break; // found a valid table
                    }
                }
            } else { // no table tag
                return [];
            }
            for (const building of buildings) {
                let fileName: string = "rooms" + building[0].substr(1); // building[0] = pathname
                let file: JSZipObject = zip.file(fileName); // read each building file
                if (file != null) { // only add to array if the file exists
                    buildingFiles.push([file, building[1], building[2], building[3]]); // shortname, fullname, address
                }
            }
            let proms = createAllClassrooms(buildingFiles);

            return Promise.all(proms).then(flattenAllRooms(allRooms));
        });
    });
};

const flattenAllRooms = (allRooms: any[]) => (allResults: any[][]) => {
    for (let res of allResults) {
        for (let room of res) {
            allRooms.push(room);
        }
    }
    return allRooms;
};
