import {
	OpenAPIRegistry,
	OpenApiGeneratorV3,
	extendZodWithOpenApi,
	RouteConfig,
} from '@asteasolutions/zod-to-openapi'

import {
	OpenAPIObjectConfig
} from '@asteasolutions/zod-to-openapi/dist/v3.0/openapi-generator'


import { z } from 'zod'

extendZodWithOpenApi(z)

type AuthObj = {
}

type RouteConfigWithValidation = RouteConfig & {
	protectedFn?: (auth: Partial<AuthObj>) => boolean | Promise<boolean>,
}

const registry = new OpenAPIRegistry()

const allRoutes: RouteConfigWithValidation[] = []
const allComponents: Record<string, any> = {}

export const getRegistry = () => registry

export function generateOpenAPI(auth: Partial<AuthObj>) {
	const newRegistry = new OpenAPIRegistry()

	// const userIdKey = newRegistry.registerComponent(
	// 	'securitySchemes',
	// 	'auth',
	// 	{
	// 		type: 'apiKey',
	// 		in: 'header',
	// 		name: 'x-user-id',
	// 	}
	// )

	const config: OpenAPIObjectConfig = {
		openapi: '3.0.3',
		info: {
			version: '1.0.0',
			title: 'Lovat API',
			description: 'This is an API specification for the Lovat API',
			contact: {
				name: 'TODO',
			}
		},
		servers: [
			{
				url: process.env.SERVER_URL as string,
			},
		],
		security: [
			{
				// [userIdKey.name]: [],
			},
		]
	}

	for (const route of allRoutes) {
		const shouldShow = route?.protectedFn?.(auth ?? {}) ?? true

		if (!shouldShow) {
			continue
		}
		newRegistry.registerPath(route)
	}

	console.log('config: ', config)
	console.log('process.env.SERVER_URL: ', process.env.SERVER_URL)
	
	const document = new OpenApiGeneratorV3(newRegistry.definitions).generateDocument(config)

	return document
}

// Swagger will be dynamically generated.
export const registerRoute = (routeConfig: RouteConfigWithValidation) => {
	allRoutes.push(routeConfig)
	return routeConfig
}

export const registerParameter = <T extends z.ZodTypeAny>(refId: string, zodSchema: T) => {
	allComponents[`components/parameter/${refId}`] = zodSchema
	return zodSchema
}
