import TelegramBot from 'node-telegram-bot-api';
import { addUserCommand } from './addUserCommand';
import { deleteUserCommand } from './deleteUserCommand';
import { editUserCommand } from './editUserCommand';
import { listUsersCommand } from './listUsersCommand';
import { manageUsersCommand } from './manageUsersCommand';


export function registerUserCommands(bot: TelegramBot) {
    addUserCommand(bot);
    deleteUserCommand(bot);
    editUserCommand(bot);
    listUsersCommand(bot);
    manageUsersCommand(bot);
}
