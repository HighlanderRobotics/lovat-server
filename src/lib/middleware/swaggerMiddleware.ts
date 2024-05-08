import { Response, NextFunction, Request } from 'express'
import { AnyZodObject, z, ZodError, ZodType } from 'zod'
import { RouteConfig, OpenAPIRegistry, ResponseConfig, ZodRequestBody } from '@asteasolutions/zod-to-openapi'
import { registerRoute } from '../swagger'

const supportedInputTypes = ['params', 'query', 'body', 'headers'] as const
type SupportedInputTypes = typeof supportedInputTypes[number]
import { RouteParameter } from '@asteasolutions/zod-to-openapi/dist/openapi-registry'

type ErrorStructure = {
	type: SupportedInputTypes | 'response'
	error: ZodError
}

type ResponseType = {
	description: string,
	schema: ZodType<unknown>,
}
type CustomRouteConfig = {
	method: RouteConfig['method'],
	path: RouteConfig['path'],
	tags: RouteConfig['tags'],
	summary: RouteConfig['summary'],
	description: RouteConfig['description'],
	params?: AnyZodObject,
	body?: ResponseType,
	query?: RouteParameter,
	validateInput: boolean,
	validateOutput: boolean,
	disableSwagger?: boolean,
	response200?: ResponseType,
	response202?: ResponseType,
	response404?: ResponseType,
	response400?: ResponseType,
}

const validateInput = (routeConfig: CustomRouteConfig, req: Request) => {
	if (routeConfig.params) {
		try {
			Object.assign(req.params, routeConfig.params.parse(req.params))
		} catch (error) {
			throw new Error(JSON.stringify({ type: 'params', error } as ErrorStructure))
		}
	}

	if (routeConfig.query) {
		try {
			Object.assign(req.query, routeConfig.query.parse(req.query))
		} catch (error) {
			throw new Error(JSON.stringify({ type: 'query', error } as ErrorStructure))
		}
	}

	if (routeConfig.body) {
		try {
			Object.assign(req.body, routeConfig.body.schema.parse(req.body))
		} catch (error) {
			throw new Error(JSON.stringify({ type: 'body', error } as ErrorStructure))
		}
	}
}

function getRouteResponseType(obj: any, key: string): ResponseType | undefined {
	if (obj[key]) {
		return obj[key] as ResponseType
	}

	return undefined
}

const validateOutput = (routeConfig: CustomRouteConfig, res: Response) => {
	const send = res.send

	res.send = function (body) {
		// Override once!
		res.send = send

		const config = getRouteResponseType(routeConfig, 'response' + res.statusCode)

		if (!config){
			return res.send('No response schema for status code: ' + res.statusCode)
		}

		const result = config.schema.safeParse(body)

		if (result.success) {
			return res.send(body)
		}

		return res.status(422).send({
			response: (result as any).error.issues
		})
	}
}
const validationFunction = (routeConfig: CustomRouteConfig) => (req: Request, res: Response, next: NextFunction) => {
	try {
		if (routeConfig.validateInput) {
			validateInput(routeConfig, req)
		}

		if (routeConfig.validateOutput) {
			validateOutput(routeConfig, res)
		}

		return next()
	} catch (error) {
		const errorObj = JSON.parse((error as any).message) as ErrorStructure
		return res.status(422).send({
			[errorObj.type]: errorObj.error.issues
		})
	}
}

const ValidationError = z.array(
	z.object({
		code: z.string(),
		message: z.string(),
		expected: z.string().optional(),
		received: z.string().optional(),
		path: z.array(z.string()),
	})
)

// Define the type for the function parameter
type MyFunctionType<
    Params = any,
    Body = any,
    Query = any,
    ResponseTypes = any
> = (
    req: Request<Params, any, Body, Query, any>,
    res: Response<ResponseTypes, any>
) => any;

type Protect<T> = T extends undefined ? undefined : T

type ResponseTypeRegistration = undefined | {
	[statusCode: number]: ResponseConfig
}

const registerResponse = (code: number, response?: ResponseType): ResponseTypeRegistration => {
	if (!response) {
		return undefined
	}

	return {
		[code]: {
			description: response.description,
			content: {
				'application/json': {
					schema: response.schema,
				},
			},
		},
	}
}

const swaggerValidationMiddleware = <T extends CustomRouteConfig>(config: T) => {
	const allResponses = [
		registerResponse(200, config.response200),
		registerResponse(202, config.response202),
		registerResponse(404, config.response404),
		registerResponse(400, config.response400),
	].filter(Boolean)

	if (config.disableSwagger !== true) {
		registerRoute({
			method: config.method,
			path: config.path,
			tags: config.tags,
			summary: config.summary,
			description: config.description,
			request: {
				params: config.params,
				body: config.body ? {
					description: config.body.description,
					content: {
						"application/json": {
							schema: config.body.schema,
						}
					}
				} : undefined,
				query: config.query,
			},
			responses: Object.assign({}, ...allResponses) as any
		})
	}

	return {
		handle: (
			callback: MyFunctionType<
			Protect<z.infer<NonNullable<T['params']>>>,
			Protect<z.infer<NonNullable<T['body']>['schema']>>,
			Protect<z.infer<NonNullable<T['query']>>>,
			any
			>
		// TODO: Might be able to type this better
		): any[] => {
			return [
				validationFunction(config),
				callback
			]
		}		
	}
}

export default swaggerValidationMiddleware