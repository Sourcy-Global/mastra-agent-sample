import config from '../config/index.js'
import { Sequelize } from 'sequelize'

const isDev = config.env === 'dev'

const acquireAttempts = new WeakMap()

const sequelizeConnection = new Sequelize(
	config.postgres.database,
	config.postgres.username,
	config.postgres.password,
	{
		host: config.postgres.host,
		dialect: 'postgres',
		schema: config.postgres.schema,
		logging: (_sql, timing) => {
			if (isDev) {
				console.debug(`[DB] Query Execution Time: ${timing} ms`, {
					// db_query: sql,
					db_query_execution_time: timing,
				})
			}
		},
		benchmark: true,
		pool: {
			max: 64,
			min: 0,
			idle: 30000,
			acquire: 60000,
		},
		port: 5432,
		dialectOptions: {
			// Your pg options here
			ssl: {
				require: true,
				rejectUnauthorized: false,
			},
			application_name: isDev ? 'sourcy-backend-dev' : 'sourcy-backend',
		},
		hooks: {
			beforeCreate: (
				instance: Record<string, any>,
				options: Record<string, any>
			) => {
				if (options?.context?.user?.employee_id !== undefined) {
					instance.created_by = options.context.user.employee_id
				}
			},
			beforeBulkCreate: (
				instances: Record<string, any>[],
				options: Record<string, any>
			) => {
				if (options?.context?.user?.employee_id !== undefined) {
					instances.forEach(instance => {
						instance.created_by = options.context.user.employee_id
					})
				}
			},
			beforeUpdate: (
				instance: Record<string, any>,
				options: Record<string, any>
			) => {
				if (options?.context?.user?.employee_id !== undefined) {
					instance.updated_by = options.context.user.employee_id
				}
			},
			beforeDestroy: (
				instance: Record<string, any>,
				options: Record<string, any>
			) => {
				if (options?.context?.user?.employee_id !== undefined) {
					instance.updated_by = options.context.user.employee_id
				}
			},
			beforeRestore: (
				instance: Record<string, any>,
				options: Record<string, any>
			) => {
				if (options?.context?.user?.employee_id !== undefined) {
					instance.updated_by = options.context.user.employee_id
				}
			},
			beforePoolAcquire: options => {
				if (isDev) {
					acquireAttempts.set(options, Date.now())
				}
			},
			afterPoolAcquire: (_connection, options) => {
				if (isDev) {
					const elapsedTime = Date.now() - acquireAttempts.get(options)
					console.debug(`[DB] Connection acquired: ${elapsedTime} ms`, {
						db_connection_acquire_time: elapsedTime,
					})
				}
			},
		},
	}
)

export const testDbConnection = async (): Promise<boolean> => {
	try {
		await sequelizeConnection.authenticate()
		const config = sequelizeConnection.config

		console.info(
			`Successfully connected to database: ${config.host}:${config.port}/${config.database}`
		)
		return true
	} catch (error) {
		console.error('Unable to connect to the database:')
		console.error(error)
		return false
	}
}

export default {
	testDbConnection,
	sequelizeConnection,
}
