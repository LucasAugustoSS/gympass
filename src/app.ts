import fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import cookie from "@fastify/cookie";

import { ZodError } from "zod";
import { env } from "./env";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
} from "fastify-type-provider-zod";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";

export const app = fastify();

// This is a custom plugin that will allow us to use Zod schemas for validation and serialization
app.setValidatorCompiler(validatorCompiler);
app.setSerializerCompiler(serializerCompiler);

app.register(fastifySwagger, {
  mode: "dynamic",
  openapi: {
    openapi: "3.1.0",
    info: {
      title: "Fastify API",
      version: "1.0.0",
      description: "API de exemplo com Fastify e Swagger",
    },
    servers: [{ url: "http://localhost:3333" }],
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
});

app.register(fastifyJwt, {
  secret: env.JWT_SECRET,
  sign: {
    expiresIn: "10m",
  },
  cookie: {
    cookieName: "refreshToken",
    signed: false,
  },
});

app.register(cookie);

app.setErrorHandler((error, _request, reply) => {
  if (error instanceof ZodError) {
    return reply
      .status(400)
      .send({ message: "Validation error", issues: error.format() });
  }

  if (env.NODE_ENV !== "production") {
    console.error(error);
  } else {
    // TODO: Here we should log to an external tool like a DataDog/NewRelic/Sentry
  }

  return reply.status(500).send({ message: "Internal server error" });
});
