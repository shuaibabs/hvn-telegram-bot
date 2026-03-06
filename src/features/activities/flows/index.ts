import TelegramBot from 'node-telegram-bot-api';
import { handleViewActivities } from './viewActivitiesFlow';
import { handleClearActivities } from './clearActivitiesFlow';
import { startDeleteActivityFlow, registerDeleteActivityFlow } from './deleteActivityFlow';

export function registerActivityFlows(bot: TelegramBot) {
    bot.on('callback_query', (query: TelegramBot.CallbackQuery) => {
        const data = query.data;
        if (!data) return;

        if (data.startsWith('view_recent_') || data === 'view_all_activities') {
            handleViewActivities(bot, query);
        } else if (data.startsWith('clear_activities_')) {
            handleClearActivities(bot, query);
        } else if (data === 'delete_act_start') {
            bot.answerCallbackQuery(query.id);
            startDeleteActivityFlow(bot, query.message!.chat.id);
        }
    });

    registerDeleteActivityFlow(bot);
}
