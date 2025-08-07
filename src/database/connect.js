// Database connection for production
const mockSequelizeConnection = {
  query: async () => { throw new Error('Database not configured'); },
  escape: (value) => `'${value.replace(/'/g, "''")}'`,
};

const db = {
  sequelizeConnection: mockSequelizeConnection
};

export default db;