"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = ping;
const functions_1 = require("@azure/functions");
async function ping(request, context) {
    return {
        status: 200,
        jsonBody: { message: 'pong from auth folder' }
    };
}
functions_1.app.http('authPing', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'authtest/ping',
    handler: ping,
});
//# sourceMappingURL=ping.js.map