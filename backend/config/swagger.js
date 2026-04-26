
/**
 * Swagger/OpenAPI Documentation
 * Access at /api-docs when running
 */

export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Smart Resource Allocation System API',
    version: '1.0.0',
    description: 'Data-Driven Volunteer Coordination for NGOs',
    contact: {
      name: 'API Support',
    },
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Firebase ID Token',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['ngo', 'volunteer', 'admin'] },
          skills: { type: 'array', items: { type: 'string' } },
          location: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
              address: { type: 'string' },
            },
          },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string', enum: ['First Aid', 'Medical Help', 'Food Distribution', 'Rescue Support', 'Logistics', 'Counseling', 'Transportation', 'Search & Rescue', 'Teaching', 'Wildlife Rescue'] },
          status: { type: 'string', enum: ['pending', 'assigned', 'completed'] },
          priority: { type: 'number' },
          severity: { type: 'integer', minimum: 1, maximum: 10 },
          peopleAffected: { type: 'integer' },
          urgency: { type: 'integer', minimum: 1, maximum: 10 },
          location: { type: 'object' },
          requiredSkills: { type: 'array', items: { type: 'string' } },
          assignedTo: { type: 'string', nullable: true },
          createdBy: { type: 'string' },
        },
      },
      TaskStats: {
        type: 'object',
        properties: {
          total: { type: 'integer' },
          completed: { type: 'integer' },
          pending: { type: 'integer' },
          assigned: { type: 'integer' },
          highPriority: { type: 'integer' },
          activeVolunteers: { type: 'integer' },
        },
      },
      VolunteerMatch: {
        type: 'object',
        properties: {
          volunteer: { $ref: '#/components/schemas/User' },
          distance: { type: 'number' },
          scores: {
            type: 'object',
            properties: {
              skill: { type: 'integer' },
              availability: { type: 'integer' },
              distance: { type: 'integer' },
              total: { type: 'number' },
            },
          },
        },
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          errors: { type: 'array' },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/api/auth/sync': {
      post: {
        tags: ['Authentication'],
        summary: 'Sync Firebase user with backend',
        description: 'After signing in/up via Firebase Auth on the frontend, call this endpoint to sync the user profile with Firestore. The Firebase ID token is sent in the Authorization header.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  role: { type: 'string', enum: ['ngo', 'volunteer'] },
                  skills: { type: 'array', items: { type: 'string' } },
                  location: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'User synced successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    message: { type: 'string' },
                    data: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: { description: 'Invalid or expired Firebase token' },
          500: { description: 'Sync failed' },
        },
      },
    },
    '/api/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'Get all tasks',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'status', in: 'query', schema: { type: 'string' } },
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          200: { description: 'List of tasks' },
        },
      },
    },
    '/api/tasks/create': {
      post: {
        tags: ['Tasks'],
        summary: 'Create new task (NGO/Admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'severity', 'peopleAffected', 'urgency'],
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  severity: { type: 'integer', minimum: 1, maximum: 10 },
                  peopleAffected: { type: 'integer', minimum: 0 },
                  urgency: { type: 'integer', minimum: 1, maximum: 10 },
                  category: { type: 'string' },
                  location: { type: 'object' },
                  requiredSkills: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Task created' },
          403: { description: 'Access denied' },
        },
      },
    },
    '/api/tasks/assign/{id}': {
      post: {
        tags: ['Tasks'],
        summary: 'Auto-assign best volunteer to task',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Task assigned' },
          404: { description: 'No volunteer found' },
        },
      },
    },
    '/api/tasks/priority': {
      get: {
        tags: ['Tasks'],
        summary: 'Get tasks sorted by priority',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Priority sorted tasks' },
        },
      },
    },
    '/api/tasks/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get dashboard statistics',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Statistics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/TaskStats' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/volunteers': {
      get: {
        tags: ['Volunteers'],
        summary: 'Get all volunteers',
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'List of volunteers' },
        },
      },
    },
  },
};
