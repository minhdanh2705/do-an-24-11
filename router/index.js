// Router index - Export tất cả routers cho dễ import
const authRouter = require('./auth-router.js');
const busRouter = require('./bus-router.js');
const routeRouter = require('./route-router.js');
const studentRouter = require('./student-router.js');
const stopRouter = require('./stop-router.js');
const driverRouter = require('./driver-router.js');
const parentRouter = require('./parent-router.js');
const scheduleRouter = require('./schedule-router.js');

module.exports = {
    authRouter,
    busRouter,
    routeRouter,
    studentRouter,
    stopRouter,
    driverRouter,
    parentRouter,
    scheduleRouter
};
