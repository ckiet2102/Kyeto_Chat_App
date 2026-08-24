import mongoose from "mongoose";
import path from "path";
import fs from "fs";

let mongoServerInstance = null;

export const connectDB = async () => {
  const connStr = process.env.MONGODB_CONNECTIONSTRING || process.env.MONGO_URI || process.env.MONGODB_URI;

  if (connStr) {
    try {
      console.log("⏳ Đang kết nối tới MongoDB Atlas...");
      await mongoose.connect(connStr, {
        serverSelectionTimeoutMS: 15000,
        connectTimeoutMS: 15000,
      });
      console.log("🟢 Liên kết CSDL MongoDB Atlas thành công!");
      return;
    } catch (error) {
      console.error("❌ Lỗi kết nối MongoDB Atlas:", error.message);
    }
  }

  // Chạy Local Fallback trong môi trường Dev/Test khi không có MONGODB_CONNECTIONSTRING
  try {
    const localUri = "mongodb://127.0.0.1:27017/moji_chat";
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
    console.log("🟢 Liên kết CSDL MongoDB Local thành công!");
  } catch (error) {
    console.log("⚠️ Khởi động CSDL MongoDB Memory Server...");
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
      console.log("✅ CSDL MongoDB Persistent Storage sẵn sàng!");
    } catch (memErr) {
      console.error("❌ Lỗi khởi tạo CSDL Local:", memErr.message);
    }
  }
};
