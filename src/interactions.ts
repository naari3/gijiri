import { entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { Client, CommandInteraction, GuildMember, Snowflake } from 'discord.js';
import { createListeningStream } from './createListeningStream';
import { ChannelDefinition } from './db/models/ChannelDefinition';

async function join(
  interaction: CommandInteraction,
  recordable: Set<Snowflake>,
  client: Client,
  connection?: VoiceConnection
) {
  await interaction.deferReply();
  const guildId = interaction.guildId ? interaction.guildId : undefined;
  const channelDefinition = await ChannelDefinition.findOne({ where: { guildId } });
  if (!channelDefinition) {
    await interaction.followUp('You should set text channel at first!');

    return;
  }
  if (!connection) {
    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
      const { channel } = interaction.member.voice;
      // eslint-disable-next-line no-param-reassign
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        selfDeaf: false,
        selfMute: true,
        adapterCreator: channel.guild.voiceAdapterCreator,
      });
    } else {
      await interaction.followUp('Join a voice channel and then try that again!');

      return;
    }
  }

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    const { receiver } = connection;

    receiver.speaking.on('start', (userId) => {
      if (recordable.has(userId)) {
        if (!guildId) {
          console.log('No guild id');

          return;
        }
        const user = client.users.cache.get(userId);
        if (!user) {
          console.log('No User');

          return;
        }
        createListeningStream(receiver, userId, client, user, guildId);
      }
    });
  } catch (error) {
    console.warn(error);
    await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
  }

  await interaction.followUp('Ready!');
}

async function record(
  interaction: CommandInteraction,
  recordable: Set<Snowflake>,
  client: Client,
  connection?: VoiceConnection
) {
  if (connection) {
    const userId = interaction.options.get('speaker')?.value as Snowflake;
    recordable.add(userId);

    const { receiver } = connection;
    if (connection.receiver.speaking.users.has(userId)) {
      const { guildId } = interaction;
      if (!guildId) {
        console.log('No guild id');

        return;
      }
      const user = client.users.cache.get(userId);
      if (!user) {
        console.log('No User');

        return;
      }
      createListeningStream(receiver, userId, client, user, guildId);
    }

    await interaction.reply({ ephemeral: true, content: 'Listening!' });
  } else {
    await interaction.reply({ ephemeral: true, content: 'Join a voice channel and then try that again!' });
  }
}

async function remove(
  interaction: CommandInteraction,
  recordable: Set<Snowflake>,
  _client: Client,
  connection?: VoiceConnection
) {
  if (connection) {
    const userId = interaction.options.get('speaker')?.value as Snowflake;
    if (recordable.has(userId)) {
      recordable.delete(userId);
    } else {
      return;
    }

    await interaction.reply({ ephemeral: true, content: 'Removed!' });
  } else {
    await interaction.reply({ ephemeral: true, content: 'Join a voice channel and then try that again!' });
  }
}

async function leave(
  interaction: CommandInteraction,
  recordable: Set<Snowflake>,
  _client: Client,
  connection?: VoiceConnection
) {
  if (connection) {
    connection.destroy();
    recordable.clear();
    await interaction.reply({ ephemeral: true, content: 'Left the channel!' });
  } else {
    await interaction.reply({ ephemeral: true, content: 'Not playing in this server!' });
  }
}

async function set(
  interaction: CommandInteraction,
  _recordable: Set<Snowflake>,
  _client: Client,
  _connection?: VoiceConnection
): Promise<void> {
  await interaction.deferReply();
  const guildId = interaction.guildId ? interaction.guildId : undefined;
  if (!guildId) {
    await interaction.followUp('You should run in any Server!');

    return;
  }
  await ChannelDefinition.upsert({ guildId, channelId: interaction.channelId });
  await interaction.followUp('Set this channel to send records!');
}

export const interactionHandlers = new Map<
  string,
  (
    _interaction: CommandInteraction,
    _recordable: Set<Snowflake>,
    _client: Client,
    _connection?: VoiceConnection
  ) => Promise<void>
>();

interactionHandlers.set('join', join);
interactionHandlers.set('record', record);
interactionHandlers.set('remove', remove);
interactionHandlers.set('leave', leave);
interactionHandlers.set('set', set);
