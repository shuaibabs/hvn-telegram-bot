import TelegramBot from 'node-telegram-bot-api';
import { getAllFinancialRecords } from '../financialService';
import { getAllUsers, User } from '../../users/userService'; // To get user names

export async function listAllRecords(bot: TelegramBot, chatId: number) {
    try {
        const records = await getAllFinancialRecords();
        const users = await getAllUsers();
        const userMap = new Map(users.map((u: User) => [u.id, u.displayName]));

        if (records.length === 0) {
            await bot.sendMessage(chatId, "There are no financial records.");
            return;
        }

        const recordList = records.map(r => {
            const userName = r.userId ? userMap.get(r.userId) || 'Unknown User' : 'Unknown User';
            return `*${r.category}* (${r.type}) - ${r.amount} - ${r.description} on ${r.date.toDateString()} for ${userName}`;
        }).join('\n');

        const message = `*All Financial Records: *\n\n${recordList}`;
        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    } catch (error: any) {
        await bot.sendMessage(chatId, `Error fetching records: ${error.message}`);
    }
}
