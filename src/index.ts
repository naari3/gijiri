/* eslint-disable no-console */
import Discord, { Interaction } from 'discord.js';
import { getVoiceConnection } from '@discordjs/voice';
import { deploy } from './deploy';
import { interactionHandlers } from './interactions';
import { ChannelDefinition } from './db/models/ChannelDefinition';

const client = new Discord.Client({ intents: ['GUILD_VOICE_STATES', 'GUILD_MESSAGES', 'GUILDS'] });

client.on('ready', async () => {
  await ChannelDefinition.sync();
  console.log('Ready');
});

client.on('messageCreate', async (message) => {
  if (!message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application?.owner?.id) {
    await deploy(message.guild);
    await message.reply('Deployed!');
  }
});

/**
 * The IDs of the users that can be recorded by the bot.
 */
const recordable = new Set<string>();

client.on('interactionCreate', async (interaction: Interaction) => {
  if (!interaction.isCommand() || !interaction.guildId) return;

  const handler = interactionHandlers.get(interaction.commandName);

  try {
    if (handler) {
      await handler(interaction, recordable, client, getVoiceConnection(interaction.guildId));
    } else {
      await interaction.reply('Unknown command');
    }
  } catch (error) {
    console.warn(error);
  }
});

client.on('error', console.warn);

// eslint-disable-next-line no-void
void client.login(process.env.TOKEN);
