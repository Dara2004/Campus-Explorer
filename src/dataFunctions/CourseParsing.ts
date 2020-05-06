import JSZip = require("jszip");
import {CourseSection} from "../model/CourseSection";
import {InsightError} from "../controller/IInsightFacade";
import Log from "../Util";
import {Room} from "../model/Room";
import {JSZipObject} from "jszip";

const checkCourseSect = (section: any): boolean => {
    let dept: string, id: string, avg: number, instructor: string, title: string, pass: number, fail: number;
    let audit: number, uuid: string, year: number;
    dept = section["Subject"];
    id = section["Course"];
    avg = section["Avg"];
    instructor = section["Professor"];
    title = section["Title"];
    pass = section["Pass"];
    fail = section["Fail"];
    audit = section["Audit"];
    uuid = section["id"].toString();
    year = parseInt(section["Year"], 10);
    if (dept != null && id != null && avg != null && instructor != null && title != null && pass != null &&
        fail != null && audit != null && uuid != null && year != null) {
        return true;
    } else {
        return false;
    }
};

export const createCourseSection = (files: JSZip.JSZipObject[]): Array<Promise<any[]>> => {
    let dept: string, id: string, avg: number, instructor: string, title: string, pass: number, fail: number;
    let audit: number, uuid: string, year: number;
    let proms: Array<Promise<any[]>> = [];
    for (let file of files) { // each file represents a course with many offerings (sections)
        let prom: Promise<any[]> = file.async("text").then((str) => {
            let obj;
            let courseSectionsFromFile: any[] = [];  // course sections from each file
            try {
                obj = JSON.parse(str); // parse the whole file
                let sections: any[] = obj.result;
                for (let section of sections) {
                    if (checkCourseSect(section)) {
                        dept = section["Subject"];
                        id = section["Course"];
                        avg = section["Avg"];
                        instructor = section["Professor"];
                        title = section["Title"];
                        pass = section["Pass"];
                        fail = section["Fail"];
                        audit = section["Audit"];
                        uuid = section["id"].toString();
                        if (section["Section"] === "overall") {
                            year = 1900;
                        } else {
                            year = parseInt(section["Year"], 10);
                        }
                        let cs: CourseSection = new CourseSection(dept, id, avg, instructor, title,
                            pass, fail, audit, uuid, year);
                        courseSectionsFromFile.push(cs);
                    }
                }
                return courseSectionsFromFile; // file.async is already a promise, func inside .then can ret anything
            } catch (e) {
                return [];
            }
        });
        proms.push(prom);
    }
    return proms;
};

export const zipToCourseSections = (content: string): Promise<any[]> => {
    let allCourseSections: any[] = [];
    return JSZip.loadAsync(content, {base64: true}).then((zip: JSZip) => {
        const folder: JSZip = zip.folder("courses"); // returns a folder which is also a JSZip
        if (!folder) {
            return Promise.reject(new InsightError("No folder named courses"));
        }
        const files: JSZip.JSZipObject[] = Object.values(folder.files); // folder has an attr called 'files'
        let proms = createCourseSection(files);
        return Promise.all(proms).then((allResults: any[][]) => {
            for (let fileResults of allResults) {
                for (let courseSection of fileResults) {
                    allCourseSections.push(courseSection);
                }
            }
            return allCourseSections; // the totality of all course sections
        });
    });
};

