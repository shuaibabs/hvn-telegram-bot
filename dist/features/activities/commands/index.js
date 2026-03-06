"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerActivityCommands = registerActivityCommands;
const env_1 = require("../../../config/env");
const manageActivitiesCommand_1 = require("./manageActivitiesCommand");
function registerActivityCommands(router) {
    const activityGroupId = env_1.env.TG_GROUP_ACTIVITY;
    const adminGroupId = env_1.env.TG_GROUP_USERS; // Usually admins manage this
    // We can allow both groups or just one
    const allowedGroups = [];
    if (activityGroupId)
        allowedGroups.push(activityGroupId);
    if (adminGroupId)
        allowedGroups.push(adminGroupId);
    router.register(/\/activities/, (msg) => (0, manageActivitiesCommand_1.manageActivitiesCommand)(router.bot, msg), allowedGroups);
    // Activity Group specific Start menu
    const activityGroupsOnly = activityGroupId ? [activityGroupId] : [];
    router.register(/^(?:\/start|start)$/i, (msg) => (0, manageActivitiesCommand_1.manageActivitiesCommand)(router.bot, msg), activityGroupsOnly);
    // Register Callbacks
    router.registerCallback('manage_activities_start', (query) => {
        if (query.message)
            (0, manageActivitiesCommand_1.manageActivitiesCommand)(router.bot, query.message);
    }, allowedGroups);
}
