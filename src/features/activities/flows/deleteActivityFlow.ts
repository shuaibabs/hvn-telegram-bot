import TelegramBot from 'node-telegram-bot-api';
import { getRecentActivities, deleteActivity, logActivity } from '../activityService';
import { setSession, getSession, clearSession } from '../../../core/bot/sessionManager';
import { escapeMarkdown } from '../../../shared/utils/telegram';

const DELETE_ACT_STAGES = {
    AWAIT_SELECTION: 'AWAIT_SELECTION',
    AWAIT_CONFIRMATION: 'AWAIT_CONFIRMATION',
} as const;

type DeleteActivitySession = {
    stage: keyof typeof DELETE_ACT_STAGES;
    activityId?: string;
    srNo?: number;
};

const cancelBtn = { text: '❌ Cancel', callback_data: 'delete_act_cancel' };

export async function startDeleteActivityFlow(bot: TelegramBot, chatId: number) {
    try {
        const activities = await getRecentActivities(15); // Show last 15 for selection
        if (activities.length === 0) {
            await bot.sendMessage(chatId, "There are no activities to delete.");
            return;
        }

        const buttons = activities.map(act => ([{
            text: `#${act.srNo} - ${act.action} by ${act.createdBy}`,
            callback_data: `delete_act_select_${act.id}`
        }]));

        buttons.push([cancelBtn]);

        setSession(chatId, 'deleteActivity', {
            stage: 'AWAIT_SELECTION',
        });

        await bot.sendMessage(chatId, "*Select an activity to delete (recent 15):*", {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: buttons,
            },
        });
    } catch (error: any) {
        await bot.sendMessage(chatId, `❌ Error fetching activities: ${error.message}`);
    }
}

async function handleSelection(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const chatId = callbackQuery.message!.chat.id;
    const session = getSession(chatId, 'deleteActivity') as DeleteActivitySession | undefined;
    if (!session || session.stage !== 'AWAIT_SELECTION') return;

    const activityId = callbackQuery.data?.replace('delete_act_select_', '');
    if (!activityId) return;

    try {
        const activities = await getRecentActivities(50);
        const activity = activities.find(a => a.id === activityId);
        if (!activity) throw new Error('Activity not found.');

        session.stage = 'AWAIT_CONFIRMATION';
        session.activityId = activityId;
        session.srNo = activity.srNo;
        setSession(chatId, 'deleteActivity', session);

        await bot.answerCallbackQuery(callbackQuery.id);

        await bot.sendMessage(chatId, `⚠️ *Confirm Deletion*\n\nAre you sure you want to delete activity *#${activity.srNo}* (${escapeMarkdown(activity.action)})?`, {
            parse_mode: 'Markdown',
            reply_markup: {
                inline_keyboard: [[
                    { text: "✅ Yes, Delete", callback_data: `delete_act_confirm_yes` },
                    cancelBtn,
                ]],
            },
        });
    } catch (error: any) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
        clearSession(chatId, 'deleteActivity');
    }
}

async function handleConfirmation(bot: TelegramBot, callbackQuery: TelegramBot.CallbackQuery) {
    const chatId = callbackQuery.message!.chat.id;
    const session = getSession(chatId, 'deleteActivity') as DeleteActivitySession | undefined;
    if (!session || session.stage !== 'AWAIT_CONFIRMATION' || !session.activityId) return;

    await bot.answerCallbackQuery(callbackQuery.id);

    try {
        await deleteActivity(session.activityId);
        const creator = callbackQuery.from.first_name + (callbackQuery.from.last_name ? ' ' + callbackQuery.from.last_name : '');

        await bot.sendMessage(chatId, `✅ Success! Activity *#${session.srNo}* has been deleted.`);

        // Log the deletion itself
        await logActivity(bot, {
            employeeName: 'System',
            action: 'DELETE_SINGLE_ACTIVITY',
            description: `Deleted activity log #${session.srNo}`,
            createdBy: creator
        }, true); // Broadcast to channel

    } catch (error: any) {
        await bot.sendMessage(chatId, `❌ Error: ${error.message}`);
    } finally {
        clearSession(chatId, 'deleteActivity');
    }
}

export function registerDeleteActivityFlow(bot: TelegramBot) {
    bot.on('callback_query', (callbackQuery) => {
        const data = callbackQuery.data || '';
        const chatId = callbackQuery.message!.chat.id;

        if (data === 'delete_act_cancel') {
            if (getSession(chatId, 'deleteActivity')) {
                clearSession(chatId, 'deleteActivity');
                bot.answerCallbackQuery(callbackQuery.id, { text: 'Cancelled' });
                bot.sendMessage(chatId, "❌ Action cancelled.");
            }
            return;
        }

        if (data.startsWith('delete_act_select_')) {
            handleSelection(bot, callbackQuery);
        } else if (data === 'delete_act_confirm_yes') {
            handleConfirmation(bot, callbackQuery);
        }
    });
}
