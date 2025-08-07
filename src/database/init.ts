
import { initModels } from "@/sourcy-models/lib/models/index.js";
import { testDbConnection } from "./connect.js";
import sequelizeConnection from "@/sourcy-models/lib/database/connect.js";


export async function setupSequelize() {
  const dbConnected = await testDbConnection();

  if (!dbConnected) {
    throw new Error("Failed to connect to database");
  }

  initModels.bind({ sequelize: sequelizeConnection })(sequelizeConnection);
}

export async function init() {
  await setupSequelize();
}