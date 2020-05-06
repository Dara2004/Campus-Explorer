import {expect} from "chai";
import InsightFacade from "../src/controller/InsightFacade";
import {InsightDatasetKind, InsightError} from "../src/controller/IInsightFacade";
import {Dataset} from "../src/model/Dataset";

const genericQuery = () => {
    const query: any = {};
    query.WHERE = { GT: {courses_avg: 95 }};
    query.OPTIONS = {};
    query.OPTIONS.COLUMNS = ["courses_avg", "courses_id"];
    query.OPTIONS.ORDER = "courses_avg";
    return query;
};

describe("Non-JSON Query Validation", function () {
    const insightFacade = new InsightFacade();
    insightFacade.datasets = [];
    const dataset = new Dataset(InsightDatasetKind.Courses);
    dataset.id = "courses";

    it("WHERE is not an object", function () {
        const query = genericQuery();
        query.WHERE = 3;
        return insightFacade.performQuery(query).then((result: any[]) => {
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });

    it("GT value is not an object", function () {
        const query = genericQuery();
        query.WHERE.GT = ["courses_avg"];
        return insightFacade.performQuery(query).then((result: any[]) => {
            expect.fail();
        }).catch((err: any) => {
            expect(err).to.be.instanceof(InsightError);
        });
    });
});
