import { STRING } from 'sequelize';
import sequelize from '../config';

export const ChannelDefinitions = sequelize.define('channel_definitions', {
  guild_id: {
    type: STRING,
    unique: true,
  },
  channel_id: {
    type: STRING,
    unique: true,
  },
});
