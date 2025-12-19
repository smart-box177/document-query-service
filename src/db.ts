import mongoose from "mongoose";
import chalk from "colors";
import { MONGO_PROD_URI, MONGO_URI } from "./constant";

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(
      chalk.bgMagenta(`MongoDB Server up and running at ${MONGO_URI}`)
    );
    console.log(
      chalk.bgMagenta(`MongoDB Server up and running at ${MONGO_PROD_URI}`)
    );
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};