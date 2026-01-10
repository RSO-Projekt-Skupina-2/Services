import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
} from "sequelize";
import { conn } from "./conn";

export class CommentModel extends Model<
  InferAttributes<CommentModel>,
  InferCreationAttributes<CommentModel>
> {
  declare id: CreationOptional<number>;
  declare postId: number;
  declare userId: number;
  declare text: string;
  declare createdAt: CreationOptional<Date>;
}

CommentModel.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: conn,
  }
);
