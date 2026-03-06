import TelegramBot from 'node-telegram-bot-api';

export async function manageActivitiesCommand(bot: TelegramBot, msg: TelegramBot.Message) {
    const chatId = msg.chat.id;

    const welcomeMessage = "📊 *Activity Management*\n\nWelcome to the activity log manager. What would you like to do?";

    const keyboard = {
        reply_markup: {
            inline_keyboard: [
                [
                    { text: '📜 View Recent 10', callback_data: 'view_recent_10' },
                    { text: '📜 View Recent 25', callback_data: 'view_recent_25' }
                ],
                [
                    { text: '📜 View Recent 50', callback_data: 'view_recent_50' },
                    { text: '📜 View Recent 100', callback_data: 'view_recent_100' }
                ],
                [
                    { text: '📑 View All Activities', callback_data: 'view_all_activities' }
                ],
                [
                    { text: '🗑️ Delete Single Activity', callback_data: 'delete_act_start' }
                ],
                [
                    { text: '🔥 Clear Activity Logs', callback_data: 'clear_activities_start' }
                ]
            ]
        }
    };

    await bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown', ...keyboard });
}
