import { CommandRouter } from '../../../core/router/commandRouter';
import { env } from '../../../config/env';
import { addUserCommand } from './addUserCommand';
import { deleteUserCommand } from './deleteUserCommand';
import { editUserCommand } from './editUserCommand';
import { listUsersCommand } from './listUsersCommand';
import { manageUsersCommand } from './manageUsersCommand';

const hvnManageUsersGroupId = env.TG_GROUP_USERS;

export function registerUserCommands(router: CommandRouter) {
    const allowedGroups = hvnManageUsersGroupId ? [hvnManageUsersGroupId] : [];

    // Group-specific Start/Menu command
    router.register(/\/start/, (msg) => manageUsersCommand(router.bot, msg), allowedGroups);

    router.register(/\/addUser/, (msg) => addUserCommand(router.bot, msg), allowedGroups);
    router.register(/\/deleteUser/, (msg) => deleteUserCommand(router.bot, msg), allowedGroups);
    router.register(/\/editUser/, (msg) => editUserCommand(router.bot, msg), allowedGroups);
    router.register(/\/listUsers/, (msg) => listUsersCommand(router.bot, msg), allowedGroups);
    router.register(/\/manageUsers/, (msg) => manageUsersCommand(router.bot, msg), allowedGroups);

    // Global Cancel Command
    router.register(/\/cancel/, (msg) => {
        // Handled individually by flow listeners, but we can add a fallback here
        // router.bot.sendMessage(msg.chat.id, "No active flow to cancel.");
    });

    // Register Callbacks for Inline Menu
    router.registerCallback('manage_users_start', (query) => {
        if (query.message) manageUsersCommand(router.bot, query.message);
    }, allowedGroups);

    router.registerCallback('manage_users_list', (query) => {
        if (query.message) listUsersCommand(router.bot, query.message);
    }, allowedGroups);

    router.registerCallback('manage_users_add', (query) => {
        if (query.message) addUserCommand(router.bot, query.message);
    }, allowedGroups);

    router.registerCallback('manage_users_edit', (query) => {
        if (query.message) editUserCommand(router.bot, query.message);
    }, allowedGroups);

    router.registerCallback('manage_users_delete', (query) => {
        if (query.message) deleteUserCommand(router.bot, query.message);
    }, allowedGroups);
}
