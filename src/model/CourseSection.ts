export class CourseSection {
    // EBNF types vs. dataset types
    public dept: string; // "Subject": string
    public id: string; // "Course": string
    public avg: number; // "Avg": number
    public instructor: string; // "Professor": string
    public title: string; // "Title": string
    public pass: number; // "Pass": number
    public fail: number; // "Fail": number
    public audit: number; // "Audit": 0
    public uuid: string; // "id": number
    public year: number; // "Year": string

    public constructor (dept: string, id: string, avg: number, instructor: string, title: string,
                        pass: number, fail: number, audit: number, uuid: string, year: number) {
        this.dept = dept;
        this.id = id;
        this.avg = avg;
        this.instructor = instructor;
        this.title = title;
        this.pass = pass;
        this.fail = fail;
        this.audit = audit;
        this.uuid = uuid;
        this.year = year;
    }
}
