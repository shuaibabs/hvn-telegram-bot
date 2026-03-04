"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("../../core/logger/logger");
const logger = new logger_1.Logger();
function someNewFeature() {
    logger.warn('This is a warning message from the new feature.');
}
someNewFeature();
