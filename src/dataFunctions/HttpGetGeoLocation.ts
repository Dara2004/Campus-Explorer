import * as http from "http";
import Log from "../Util";
import {InsightDataset, InsightDatasetKind} from "../controller/IInsightFacade";

export const sendHttpReq = (addr: string): Promise<any> => {
    return new Promise<any>((resolve, reject) => {
        http.get("http://cs310.students.cs.ubc.ca:11316/api/v1/project_team137/" + addr, (res) => {
            const {statusCode} = res;
            const contentType = res.headers["content-type"];

            let error;
            if (statusCode !== 200) {
                error = new Error("Request Failed.\n" +
                    `Status Code: ${statusCode}`);
            } else if (!/^application\/json/.test(contentType)) {
                error = new Error("Invalid content-type.\n" +
                    `Expected application/json but received ${contentType}`);
            }
            if (error) {
                Log.error(error.message);
                // consume response data to free up memory
                res.resume();
                return;
            }

            res.setEncoding("utf8");
            let rawData = "";
            res.on("data", (chunk) => {
                rawData += chunk;
            });
            res.on("end", () => {
                try {
                    const parsedData: any = JSON.parse(rawData);
                    // if (parsedData.error) {
                    //     reject();
                    // }
                    resolve(parsedData); // resolve with a GeoResponse
                } catch (e) {
                    Log.error(e.message);
                }
            });
        }).on("error", (e) => {
            Log.error(`Got error: ${e.message}`);
        });
    });
};
