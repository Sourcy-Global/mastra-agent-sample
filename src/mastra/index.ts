import './crypto-polyfill'
import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import {
	searchWorkflow,
	summarizerWorkflow,
	specGenWorkflow,
	demandWorkflow,
	sourcingBotWorkflow,
	planningWorkflow,
} from '../workflows'
import {
	searchAgent,
	summarizerAgent,
	specGenAgent,
	demandAgent,
} from '../agents'

export const mastra = new Mastra({
	workflows: {
		searchWorkflow,
		summarizerWorkflow,
		specGenWorkflow,
		demandWorkflow,
		sourcingBotWorkflow,
		planningWorkflow,
	},
	agents: {
		searchAgent,
		summarizerAgent,
		specGenAgent,
		demandAgent,
	},
	logger: new PinoLogger({
		name: 'Mastra',
		level: 'info',
	}),
})
