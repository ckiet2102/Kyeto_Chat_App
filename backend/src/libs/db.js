import mongoose from "mongoose";
import path from "path";
import fs from "fs";

let mongoServerInstance = null;

export const connectDB = async () => {
  try {
    // Thử kết nối DB trong .env nếu khả dụng
    const connStr = process.env.MONGODB_CONNECTIONSTRING || "mongodb://127.0.0.1:27017/moji_chat";
    await mongoose.connect(connStr, { serverSelectionTimeoutMS: 2000 });
    console.log("🟢 Liên kết CSDL MongoDB thành công!");
  } catch (error) {
    console.log("⚠️ Khởi động CSDL MongoDB Persistence Disk Storage...");
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }

      if (!mongoServerInstance) {
        const { MongoMemoryServer } = await import("mongodb-memory-server");
        const dbPath = path.join(process.cwd(), "db-data");
        if (!fs.existsSync(dbPath)) {
          fs.mkdirSync(dbPath, { recursive: true });
        } else {
          const lockFile = path.join(dbPath, "mongod.lock");
          if (fs.existsSync(lockFile)) {
            try {
              fs.unlinkSync(lockFile);
            } catch (e) {}
          }
        }

        mongoServerInstance = await MongoMemoryServer.create({
          instance: {
            dbName: "moji_chat",
            dbPath: dbPath,
            storageEngine: "wiredTiger",
          },
        });
      }

      const mongoUri = mongoServerInstance.getUri();
      await mongoose.connect(mongoUri, { dbName: "moji_chat" });
      console.log("✅ CSDL MongoDB Persistent Storage sẵn sàng tại cổng 5001!");
    } catch (memErr) {
      console.error("❌ Lỗi khởi tạo CSDL:", memErr.message);
    }
  }
};
