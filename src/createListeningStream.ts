/* eslint-disable @typescript-eslint/restrict-template-expressions */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import { User } from 'discord.js';
// import { createWriteStream } from 'fs';
import { opus } from 'prism-media';
import { pipeline } from 'stream';
import { SpeechClient } from '@google-cloud/speech';

function getDisplayName(userId: string, user?: User) {
  return user ? `${user.username}_${user.discriminator}` : userId;
}

export function createListeningStream(receiver: VoiceReceiver, userId: string, user?: User): void {
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

  const filename = `./recordings/${Date.now()}-${getDisplayName(userId, user)}.ogg`;

  // const out = createWriteStream(filename);

  // console.log(`👂 Started recording ${filename}`);

  const client = new SpeechClient();
  const recognizeStream = client
    .streamingRecognize({
      config: {
        encoding: 'OGG_OPUS',
        sampleRateHertz: 48000,
        audioChannelCount: 2,
        languageCode: 'ja-JP',
        model: 'phone_call',
      },
      interimResults: false,
    })
    .on('error', console.error)
    .on('data', (data) =>
      process.stdout.write(
        data.results[0] && data.results[0].alternatives[0]
          ? `${user?.username}: ${data.results[0].alternatives[0].transcript}\n`
          : '\n\nReached transcription time limit, press Ctrl+C\n'
      )
    );

  // pipeline(opusStream, oggStream, recognizeStream, (err) => {
  pipeline(opusStream, oggStream, recognizeStream, (err) => {
    // if (err) {
    //   console.warn(`❌ Error recording file ${filename} - ${err.message}`);
    // } else {
    //   console.log(`✅ Recorded ${filename}`);
    // }
  });
}
