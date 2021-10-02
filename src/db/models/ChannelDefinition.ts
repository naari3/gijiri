import { Model, Optional, STRING, INTEGER } from 'sequelize';
import sequelize from '../config';

// export const ChannelDefinitions = sequelize.define('channel_definitions', {
//   guild_id: {
//     type: STRING,
//     unique: true,
//   },
//   channel_id: {
//     type: STRING,
//     unique: true,
//   },
// });

interface ChannelDefinitionAttributes {
  id: number;
  guildId: string;
  channelId: string;
}

type ChannelDefinitionCreationAttributes = Optional<ChannelDefinitionAttributes, 'id'>;

export class ChannelDefinition extends Model<ChannelDefinitionAttributes, ChannelDefinitionCreationAttributes> {
  public id!: number; // Note that the `null assertion` `!` is required in strict mode.

  public guildId!: string;

  public channelId!: string;

  // timestamps!
  public readonly createdAt!: Date;

  public readonly updatedAt!: Date;
}
ChannelDefinition.init(
  {
    id: {
      type: INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    guildId: {
      type: STRING,
      unique: true,
      allowNull: false,
    },
    channelId: {
      type: STRING,
      unique: true,
      allowNull: false,
    },
  },
  { sequelize, modelName: 'channel_definition', tableName: 'channel_definitions' }
);
