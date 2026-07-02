import mongoose from "mongoose";
import BoardOp from "./src/models/BoardOp.js";
import dotenv from "dotenv";

dotenv.config({ path: "./.env" });

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const ops = await BoardOp.find({}).sort({ createdAt: -1 }).limit(20);
        console.log("Recent ops:");
        for (const op of ops) {
            console.log(`- Type: ${op.opType}, seq: ${op.seq}, objectId: ${op.payload?.objectId}`);
            if (op.opType === "shape") {
                console.log("  Shape type:", op.payload.type);
            }
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
