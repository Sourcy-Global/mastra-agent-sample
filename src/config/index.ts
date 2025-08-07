import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

interface DatabaseConfig {
	host: string
	port: number
	database: string
	username: string
	password: string
	schema: string
}

interface Config {
	env: string
	postgres: DatabaseConfig
}

const config: Config = {
	env: process.env.NODE_ENV || 'development',
	postgres: {
		host: process.env.DB_HOST || 'localhost',
		port: parseInt(process.env.DB_PORT || '5432'),
		database: process.env.DB_NAME || 'mastra_agent_sample',
		username: process.env.DB_USER || 'postgres',
		password: process.env.DB_PASSWORD || 'password',
		schema: process.env.DB_SCHEMA || 'public',
	},
}

export default config
