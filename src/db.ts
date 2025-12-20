import mongoose from "mongoose";
import chalk from "colors";
import { MONGO_PROD_URI, MONGO_URI } from "./constant";

const isProd = process.env.NODE_ENV === "PROD";
const dbUri = isProd ? MONGO_PROD_URI : MONGO_URI;

console.log(process.env.NODE_ENV)

export const connectDB = async () => {
  try {
    await mongoose.connect(dbUri);
    console.log(
      chalk.bgMagenta(
        `MongoDB Server up and running at ${dbUri} (${isProd ? "production" : "development"})`
      )
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};
