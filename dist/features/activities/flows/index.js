"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerActivityFlows = registerActivityFlows;
const viewActivitiesFlow_1 = require("./viewActivitiesFlow");
const clearActivitiesFlow_1 = require("./clearActivitiesFlow");
const deleteActivityFlow_1 = require("./deleteActivityFlow");
function registerActivityFlows(bot) {
    bot.on('callback_query', (query) => {
        const data = query.data;
        if (!data)
            return;
        if (data.startsWith('view_recent_') || data === 'view_all_activities') {
            (0, viewActivitiesFlow_1.handleViewActivities)(bot, query);
        }
        else if (data.startsWith('clear_activities_')) {
            (0, clearActivitiesFlow_1.handleClearActivities)(bot, query);
        }
        else if (data === 'delete_act_start') {
            bot.answerCallbackQuery(query.id);
            (0, deleteActivityFlow_1.startDeleteActivityFlow)(bot, query.message.chat.id);
        }
    });
    (0, deleteActivityFlow_1.registerDeleteActivityFlow)(bot);
}
