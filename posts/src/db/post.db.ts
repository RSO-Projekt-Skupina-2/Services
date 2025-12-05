import {
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
  DataTypes,
  ForeignKey,
} from "sequelize";
import { conn } from "./conn";


export class PostModel extends Model<
  InferAttributes<PostModel>,
  InferCreationAttributes<PostModel>
> {
  declare id: CreationOptional<number>;
  declare title: string;
  declare text: string;
  declare author: number
  declare topics: string[];
}

PostModel.init(
  {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.BIGINT,
    },
    topics: {
      type: DataTypes.JSON,
      allowNull: true,
    }
  },
  {
    sequelize: conn,
  }
);
