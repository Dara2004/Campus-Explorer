/**
 * Receives a query object as parameter and sends it as Ajax request to the POST /query REST endpoint.
 *
 * @param query The query object
 * @returns {Promise} Promise that must be fulfilled if the Ajax request is successful and be rejected otherwise.
 */
const request = new XMLHttpRequest();

CampusExplorer.sendQuery = function(query) {
    return new Promise(function(fulfill, reject) {
        method = 'POST';
        url = "http://localhost:4321/query";
        request.open(method, url, true);
        request.setRequestHeader("Content-Type", "application/json");
        request.onload = function () {
            // let result = JSON.parse(request.responseText);
            CampusExplorer.renderResult(JSON.parse(request.responseText));
            fulfill();
        };
        request.onerror = function() {
            CampusExplorer.renderResult("Error123");
            fulfill();
        }
        request.send(JSON.stringify(query));
    });
};
