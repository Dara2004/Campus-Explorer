import {CourseSection} from "./CourseSection";
import {Room} from "./Room";
import {InsightDatasetKind} from "../controller/IInsightFacade";

export class Dataset {

    public items: any[] = []; // a list of rooms or course sections (depending on the kind)
    public id: string = "";
    public kind: InsightDatasetKind;
    public size: number;

    public constructor(kind: InsightDatasetKind) {
        this.kind = kind;
    }
}
