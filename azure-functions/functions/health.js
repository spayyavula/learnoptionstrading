"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = health;
const functions_1 = require("@azure/functions");
const database_1 = require("../lib/database");
const response_1 = require("../lib/response");
async function health(request, context) {
    try {
        const dbHealthy = await (0, database_1.checkDatabaseHealth)();
        const status = {
            status: dbHealthy ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            services: {
                api: true,
                database: dbHealthy,
            },
        };
        return (0, response_1.jsonResponse)(status, dbHealthy ? 200 : 503);
    }
    catch (error) {
        context.error('Health check failed:', error);
        return (0, response_1.serverError)('Health check failed');
    }
}
functions_1.app.http('health', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'health',
    handler: health,
});
//# sourceMappingURL=health.js.map