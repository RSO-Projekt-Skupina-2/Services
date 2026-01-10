import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
} from "sequelize";
import { conn } from "./conn";

export class LikeModel extends Model<
  InferAttributes<LikeModel>,
  InferCreationAttributes<LikeModel>
> {
  declare id: CreationOptional<number>;
  declare postId: number;
  declare userId: number;
  declare createdAt: CreationOptional<Date>;
}

LikeModel.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    postId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: "post_user_unique",
    },
    userId: {
      type: DataTypes.BIGINT,
      allowNull: false,
      unique: "post_user_unique",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize: conn,
    indexes: [
      {
        unique: true,
        fields: ["postId", "userId"],
        name: "post_user_unique",
      },
    ],
  }
);
