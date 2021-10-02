/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import { Client, TextChannel, User } from 'discord.js';
import { opus } from 'prism-media';
import { pipeline } from 'stream';
import { SpeechClient } from '@google-cloud/speech';
import { ChannelDefinitions } from './db/models/ChannelDefinition';

export function createListeningStream(
  receiver: VoiceReceiver,
  userId: string,
  client: Client,
  user: User,
  guildId: string
): void {
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterInactivity,
      duration: 100,
    },
  });

  const oggStream = new opus.OggLogicalBitstream({
    opusHead: new opus.OpusHead({
      channelCount: 2,
      sampleRate: 48000,
    }),
    pageSizeControl: {
      maxPackets: 10,
    },
  });

  const sendMessage = async (message: string) => {
    const channelDefinition = await ChannelDefinitions.findOne({ where: { guild_id: guildId } });
    if (!channelDefinition) {
      return;
    }
    const channelId = channelDefinition?.get('channel_id') as string;
    const channel = await client.channels.fetch(channelId);
    if (channel?.isText()) {
      await (channel as TextChannel).send(`${user?.username}#${user?.discriminator}: ${message}`);
    }
  };

  const sClient = new SpeechClient();
  const recognizeStream = sClient
    .streamingRecognize({
      config: {
        encoding: 'OGG_OPUS',
        sampleRateHertz: 48000,
        audioChannelCount: 2,
        languageCode: 'ja-JP',
        model: 'phone_call',
        useEnhanced: true,
      },
      interimResults: false,
    })
    .on('error', console.error)
    .on('data', (data) => {
      if (data.results[0] && data.results[0].alternatives[0]) {
        if ((data.results[0].alternatives[0].transcript as string).trim() !== '') {
          sendMessage(data.results[0].alternatives[0].transcript).catch((r) => {
            throw r;
          });
        }
      }
    });

  pipeline(opusStream, oggStream, recognizeStream, (err) => {
    if (err) {
      console.warn(`❌ Error recording - ${err.message}`);
    }
  });
}
