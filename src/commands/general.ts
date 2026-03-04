import { CommandRouter } from '../core/router/commandRouter';

export function registerGeneralCommands(router: CommandRouter) {
    // Health check command
    router.register(/\/health/, (msg) => {
        const chatId = msg.chat.id;
        router.bot.sendMessage(chatId, '✅ Bot is up and running!');
    });

    // Start command
    router.register(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const welcomeMessage = `
👋 Welcome to the Bot!

Here are the available commands:
/start - Show this welcome message
/menu - Display the main menu
/health - Check bot\'s health status
`;
        router.bot.sendMessage(chatId, welcomeMessage);
    });

    // Menu command
    router.register(/\/menu/, (msg) => {
        const chatId = msg.chat.id;
        // For now, let\'s make the menu simple. It can be expanded later.
        const menuMessage = `
📋 Main Menu

Select an option:
(No options implemented yet)
`;
        router.bot.sendMessage(chatId, menuMessage);
    });
}
