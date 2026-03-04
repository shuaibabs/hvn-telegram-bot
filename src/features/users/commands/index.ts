import { CommandRouter } from '../../../core/router/commandRouter';
import { env } from '../../../config/env';
import { addUserCommand } from './addUserCommand';
import { deleteUserCommand } from './deleteUserCommand';
import { editUserCommand } from './editUserCommand';
import { listUsersCommand } from './listUsersCommand';
import { manageUsersCommand } from './manageUsersCommand';

const hvnManageUsersGroupId = env.TG_GROUP_USERS;

export function registerUserCommands(router: CommandRouter) {
    router.register(/\/addUser/, (msg) => addUserCommand(router.bot, msg));
    router.register(/\/deleteUser/, (msg) => deleteUserCommand(router.bot, msg));
    router.register(/\/editUser/, (msg) => editUserCommand(router.bot, msg));
    router.register(/\/listUsers/, (msg) => listUsersCommand(router.bot, msg));
    router.register(/\/manageUsers/, (msg) => manageUsersCommand(router.bot, msg));
}
