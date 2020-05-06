/**
 * Builds a query object using the current document object model (DOM).
 * Must use the browser's global document object {@link https://developer.mozilla.org/en-US/docs/Web/API/Document}
 * to read DOM information.
 *
 * @returns query object adhering to the query EBNF
 */
let active = 0; // 0 for courses, 1 for rooms
let datasetId = "";
let query = {};
let hasTransformations = false;
let hasOrder = false;

function reset() {
    active = 0;
    datasetId = "";
    query = {};
    hasTransformations = false;
    hasOrder = false;
}

CampusExplorer.buildQuery = function() {
    reset();
    setActiveDataset();
    console.log(datasetId);
    query = {WHERE: {}, OPTIONS: {}};
    setConditions();
    setColumns();
    setOrders();
    setTransformations();
    console.log(query);
    return query;
};

function setActiveDataset() {
    if (!document.getElementsByClassName("tab-panel active")["tab-rooms"]) { // rooms is not active
        active = 0;
        datasetId = "courses";

    } else {
        active = 1;
        datasetId = "rooms";
    }
};

function setConditions() {
    const filters = getMoreConditions();
    if (filters.length === 0) {
        query.WHERE = {};
    }
    else if (filters.length > 1) {
        if (document.getElementById(datasetId + "-conditiontype-all").checked) {
            query.WHERE.AND = filters;
        } else if (document.getElementById(datasetId + "-conditiontype-any").checked) {
            query.WHERE.OR = filters;
        } else if (document.getElementById(datasetId + "-conditiontype-none").checked) {
            query.WHERE.NOT = {OR: filters};
        }
    } else if (filters.length === 1) {
        if (document.getElementById(datasetId + "-conditiontype-none").checked) {
            query.WHERE = {NOT: filters[0]};
        } else {
            query.WHERE = filters[0];
        }
    }
}

function isNot(conditionElement) {
    return conditionElement.children[0].children[0].checked;
}

function getField(conditionElement) {
    let index = conditionElement.children[1].children[0].selectedIndex;
    return conditionElement.children[1].children[0].children[index].value;
}

function getOperator(conditionElement) {
    let index = conditionElement.children[2].children[0].selectedIndex;
    return conditionElement.children[2].children[0].children[index].value;
}

function getConditionValue(conditionElement, operator) {
    let value = conditionElement.children[3].children[0].value;
    if (operator !== "IS") {
        let parsedValue = parseFloat(value);
        if (isNaN(parsedValue)) {
            return value;
        } else {
            return parsedValue;
        }
    }
    return value;
}

function getMoreConditions() {
    const filters = [];
    for (const c of document.getElementsByClassName("conditions-container")[active].children){
        const operator = getOperator(c);
        const value = getConditionValue(c, operator);
        console.log(value);
        const field = active === 0 ? "courses_" + getField(c) : "rooms_" + getField(c);
        const filter = {};
        filter[operator] = {};
        filter[operator][field] = value;
        isNot(c) ? filters.push({ NOT: filter }) : filters.push(filter);
    }
    return filters;
}

function setKey(className, key) {
    if (!className.includes("transformation")) { // if class = transformation
        return datasetId + "_" + key;
    } else {
        return key;
    }
}

function setColumns() {
    query.OPTIONS.COLUMNS = [];
    const columns = document.getElementsByClassName("form-group columns")[active].children[1].children;
    for (const c of columns) {
        const field = c.children[0];
        const val = field.value; //avg
        if (field.checked) {
            let className = "";
            if (c.attributes["class"]) {
                className = c.attributes["class"].value;
            }
            const key = setKey(className, val);
            query.OPTIONS.COLUMNS.push(key);
        }
    }
}

function setOrders() {
    const order = document.getElementsByClassName("control order fields")[active].children[0];
    for (const c of order) {
        if (c.selected) {
            hasOrder = true;
            break;
        }
    }
    if (hasOrder) {
        query.OPTIONS.ORDER = { dir: "UP", keys: [] };
        for (const c of order) {
            const field = c.value;
            if (c.selected) {
                let className = "";
                if (c.attributes["class"]) {
                    className = c.attributes["class"].value;
                }
                const key = setKey(className, field);
                query.OPTIONS.ORDER.keys.push(key);
            }
        }
    }
    if (document.getElementsByClassName("control descending")[active].children[0].checked) {
        query.OPTIONS.ORDER = { dir: "DOWN", keys: [] };
    }
}

function setTransformations() {
    const groups = document.getElementsByClassName("form-group groups")[active].children[1].children;
    const applySection = document.getElementsByClassName("form-group transformations")[active].children[1].children;
    for (const c of groups) {
        if (c.children[0].checked) {
            hasTransformations = true;
            break;
        }
    }
    if (applySection.length > 0) {
        hasTransformations = true;
    }
    if (hasTransformations) {
        query.TRANSFORMATIONS = { GROUP: [], APPLY: [] };
        setGroups(groups);
        setApply(applySection);
    }
}

function setGroups(groups) {
    for (const c of groups) {
        const field = c.children[0].value;
        if (c.children[0].checked) {
            query.TRANSFORMATIONS.GROUP.push(datasetId + "_" + field);
        }
    }
}

function setApply(applySection) {
    for (const apply of applySection) {
        const applyRule = apply.children[0].children[0].value;
        const applyToken = apply.children[1].children[0].value;
        const key = apply.children[2].children[0].value;
        const applyKey = datasetId + "_" + key;
        const obj = {};
        obj[applyRule] = {};
        obj[applyRule][applyToken] = applyKey;
        query.TRANSFORMATIONS.APPLY.push(obj);
    }
}
