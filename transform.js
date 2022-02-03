

const {
    Response,
    Route,
} = require("./lib/models/");
const POSTMAN_PARAM_REGEX = /{{[^}]+}}\/?/g;

const transformEntry = (r_data) => {
    if (r_data.response) {
        r_data.responses = r_data.response;
    }
    let route = Route();
    route.documentation = r_data.name;
    route.method = r_data.request.method || "GET";
    let url = r_data.request.url;
    route.endpoint = (typeof url == "string" ?
        url
        : (
            typeof url.path == "string" ?
                url.path
                : url.path.join("/")
        )
    );
    
    // removes all postman placeholder variables
    route.endpoint = route.endpoint.replace(POSTMAN_PARAM_REGEX, "");

    if (r_data.responses && r_data.responses.length > 0) {
        r_data.responses.forEach((r) => {
            let resp = Response();
            if (r.code) {
                resp.statusCode = r.code.toString();
            }
            if (r.header) {
                resp.headers = r.header;
            }
            if (r.body) {
                resp.body = r.body;
            }
            route.responses.push(resp);
        });
    } else {
        route.responses.push(Response())
    }
    return route;
}

const transformCollection = (collection, mockoon, env) => {
    if(collection.item) {
        collection.item.forEach((r_data) => {
            if (r_data.request && r_data.responses && r_data.responses.length == 0) {
            } else {
                if(r_data.item) {
                    r_data.item.forEach((rs_data) => {
                        transformCollection(rs_data, mockoon, env);
                    });
                } else {
                    env.routes.push(transformEntry(r_data));
                }
            }
        });
    } else {
        env.routes.push(transformEntry(collection));
    }
}

const transformPostmanToMockoon = ({ postman, mockoon, env }) => {

    env.uuid = postman.info._postman_id;
    env.name = postman.info.name;
    transformCollection(postman, mockoon, env);
    mockoon.data.push(env);
}

module.exports = {
    transformPostmanToMockoon
}