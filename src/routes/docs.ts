import { Hono } from 'hono';

const docsRoutes = new Hono();

const apiSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Memory Assistant API',
    version: '1.0.0',
    description: 'AI-powered memory assistant backend API',
  },
  servers: [
    {
      url: process.env.NODE_ENV === 'production' 
        ? 'https://your-api-domain.com' 
        : 'http://localhost:3001',
    },
  ],
  paths: {
    '/auth/signup': {
      post: {
        summary: 'User registration',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 6 },
                  name: { type: 'string', minLength: 1 },
                },
                required: ['email', 'password', 'name'],
              },
            },
          },
        },
        responses: {
          200: { description: 'User created successfully' },
          400: { description: 'Invalid input or user already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'User login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
                required: ['email', 'password'],
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/memories': {
      get: {
        summary: 'List memories',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'tags', in: 'query', schema: { type: 'string' } },
          { name: 'search', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of memories with pagination' },
        },
      },
      post: {
        summary: 'Create memory',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  content: { type: 'string', minLength: 1 },
                  title: { type: 'string' },
                  tags: { type: 'array', items: { type: 'string' } },
                },
                required: ['content'],
              },
            },
          },
        },
        responses: {
          201: { description: 'Memory created successfully' },
        },
      },
    },
    '/ai/search': {
      post: {
        summary: 'AI-powered memory search',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  query: { type: 'string', minLength: 1 },
                  limit: { type: 'number', minimum: 1, maximum: 20, default: 5 },
                },
                required: ['query'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'AI search results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    answer: { type: 'string' },
                    references: {
                      type: 'array',
                      items: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

docsRoutes.get('/openapi.json', (c) => {
  return c.json(apiSpec);
});

docsRoutes.get('/', (c) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Memory Assistant API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@3.25.0/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/docs/openapi.json',
            dom_id: '#swagger-ui',
            presets: [
              SwaggerUIBundle.presets.apis,
              SwaggerUIBundle.presets.standalone
            ]
          });
        </script>
      </body>
    </html>
  `;
  return c.html(html);
});

export { docsRoutes };