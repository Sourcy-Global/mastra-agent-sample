import './crypto-polyfill';
import { Mastra } from '@mastra/core/mastra'
import { PinoLogger } from '@mastra/loggers'
import { weatherWorkflow, searchWorkflow } from './workflows'
import { weatherAgent, searchAgent } from './agents'

export const mastra = new Mastra({
	workflows: { weatherWorkflow, searchWorkflow },
	agents: { weatherAgent, searchAgent },
	logger: new PinoLogger({
		name: 'Mastra',
		level: 'info',
	}),
})
