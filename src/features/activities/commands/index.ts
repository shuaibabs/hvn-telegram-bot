import { CommandRouter } from '../../../core/router/commandRouter';
import { env } from '../../../config/env';
import { manageActivitiesCommand } from './manageActivitiesCommand';

export function registerActivityCommands(router: CommandRouter) {
    const activityGroupId = env.TG_GROUP_ACTIVITY;
    const adminGroupId = env.TG_GROUP_USERS; // Usually admins manage this

    // We can allow both groups or just one
    const allowedGroups = [];
    if (activityGroupId) allowedGroups.push(activityGroupId);
    if (adminGroupId) allowedGroups.push(adminGroupId);

    router.register(/\/activities/, (msg) => manageActivitiesCommand(router.bot, msg), allowedGroups);

    // Activity Group specific Start menu
    const activityGroupsOnly = activityGroupId ? [activityGroupId] : [];
    router.register(/^(?:\/start|start)$/i, (msg) => manageActivitiesCommand(router.bot, msg), activityGroupsOnly);

    // Register Callbacks
    router.registerCallback('manage_activities_start', (query) => {
        if (query.message) manageActivitiesCommand(router.bot, query.message);
    }, allowedGroups);
}
