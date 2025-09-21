export var MonitorStatus;
(function (MonitorStatus) {
    MonitorStatus[MonitorStatus["DOWN"] = 0] = "DOWN";
    MonitorStatus[MonitorStatus["UP"] = 1] = "UP";
    MonitorStatus[MonitorStatus["PENDING"] = 2] = "PENDING";
    MonitorStatus[MonitorStatus["MAINTENANCE"] = 3] = "MAINTENANCE";
    MonitorStatus[MonitorStatus["PAUSED"] = 3] = "PAUSED";
})(MonitorStatus || (MonitorStatus = {}));
//# sourceMappingURL=types.js.map