# Prompt Library Service

A comprehensive REST API service for managing and storing prompts with file-based storage. This service provides a centralized location for storing, retrieving, and managing prompts with full CRUD operations, search capabilities, and organized storage.

## Features

### Core Functionality
- ✅ **CRUD Operations**: Create, read, update, and delete prompts
- ✅ **Search & Filter**: Full-text search with category and tag filtering
- ✅ **File-based Storage**: Human-readable YAML format for easy manual editing
- ✅ **Usage Tracking**: Automatic usage statistics and analytics
- ✅ **Version Control**: Automatic versioning of prompt updates
- ✅ **Backup System**: Automatic backups with retention management

### API Features
- ✅ **RESTful Design**: Clean, intuitive API endpoints
- ✅ **Input Validation**: Comprehensive request validation with Joi
- ✅ **Error Handling**: Structured error responses with appropriate HTTP codes
- ✅ **Pagination**: Efficient pagination for large datasets
- ✅ **CORS Support**: Cross-origin resource sharing enabled
- ✅ **Security Headers**: Helmet.js for security best practices

### Developer Experience
- ✅ **TypeScript**: Full type safety throughout the codebase
- ✅ **Comprehensive Testing**: Unit and integration tests with Jest
- ✅ **API Documentation**: OpenAPI/Swagger documentation
- ✅ **Code Quality**: ESLint configuration and best practices
- ✅ **Development Tools**: Hot reload and development scripts

## Quick Start

### Prerequisites
- Node.js 16.0 or higher
- npm or yarn package manager

### Installation

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd prompt_library
   npm install
   ```

2. **Set up environment** (optional):
   ```bash
   cp .env.example .env
   # Edit .env with your preferred settings
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Verify installation**:
   Open http://localhost:3000/health in your browser

### Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Start the production server**:
   ```bash
   npm start
   ```

## API Documentation

### Base URL
- Development: `http://localhost:3000/api/v1`
- Documentation: `http://localhost:3000/api/v1/docs`

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/prompts` | List all prompts with optional filtering |
| POST | `/prompts` | Create a new prompt |
| GET | `/prompts/:id` | Get a specific prompt by ID |
| PUT | `/prompts/:id` | Update a specific prompt |
| DELETE | `/prompts/:id` | Delete a specific prompt |
| GET | `/prompts/search?q=query` | Search prompts by query string |
| GET | `/prompts/categories` | Get all available categories |
| GET | `/prompts/tags` | Get all available tags |
| GET | `/prompts/stats` | Get usage statistics |

### Example Usage

#### Create a Prompt
```bash
curl -X POST http://localhost:3000/api/v1/prompts \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Code Review Assistant",
    "content": "You are an expert code reviewer. Analyze the following code for {{language}} and provide feedback on {{focus_areas}}.",
    "description": "AI assistant for comprehensive code reviews",
    "tags": ["code-review", "programming", "quality-assurance"],
    "category": "development",
    "variables": [
      {
        "name": "language",
        "description": "Programming language",
        "type": "string",
        "required": true,
        "defaultValue": "JavaScript"
      },
      {
        "name": "focus_areas",
        "description": "Specific areas to focus on during review",
        "type": "string",
        "required": false,
        "defaultValue": "performance, security, maintainability"
      }
    ],
    "author": "Development Team"
  }'
```

#### Search Prompts
```bash
curl "http://localhost:3000/api/v1/prompts/search?q=programming&category=development&limit=10"
```

#### Get Statistics
```bash
curl http://localhost:3000/api/v1/prompts/stats
```

### Request/Response Format

#### Prompt Object
```typescript
{
  id: string;              // UUID
  title: string;           // Prompt title (max 200 chars)
  content: string;         // Prompt content (max 50000 chars)
  description?: string;    // Optional description (max 1000 chars)
  tags: string[];          // Array of tags (max 20 tags)
  category: string;        // Category name (max 100 chars)
  variables?: Array<{      // Optional prompt variables
    name: string;
    description: string;
    type: 'string' | 'number' | 'boolean' | 'array';
    required: boolean;
    defaultValue?: any;
  }>;
  metadata: {
    createdAt: string;     // ISO 8601 timestamp
    updatedAt: string;     // ISO 8601 timestamp
    version: string;       // Semantic version
    author?: string;       // Author name
    usage: number;         // Usage counter
  };
}
```

#### API Response Format
```typescript
{
  success: boolean;        // Operation success status
  data?: any;             // Response data (if successful)
  error?: string;         // Error type (if failed)
  message?: string;       // Human-readable message
}
```

## Storage Format

The service uses YAML for human-readable storage. Data is stored in `data/prompts.yaml`:

```yaml
prompt-id-here:
  id: "550e8400-e29b-41d4-a716-446655440001"
  title: "Example Prompt"
  content: |
    This is a multi-line prompt content.
    It can include variables like {{variable_name}}.
  description: "An example prompt for demonstration"
  tags:
    - example
    - demo
    - tutorial
  category: "examples"
  variables:
    - name: "variable_name"
      description: "Description of the variable"
      type: "string"
      required: true
      defaultValue: "default value"
  metadata:
    createdAt: "2024-01-01T00:00:00.000Z"
    updatedAt: "2024-01-01T00:00:00.000Z"
    version: "1.0.0"
    author: "Example Author"
    usage: 0
```

### Manual Editing

You can manually edit the YAML file to:
- Add new prompts
- Modify existing prompts
- Organize prompt collections
- Backup and restore data

**Note**: Manual changes are loaded on server restart or service reinitialization.

## Development

### Project Structure
```
prompt_library/
├── src/
│   ├── types/           # TypeScript type definitions
│   ├── storage/         # Storage layer implementation
│   ├── services/        # Business logic services
│   ├── controllers/     # API controllers
│   ├── routes/          # Express route definitions
│   ├── middleware/      # Custom middleware
│   ├── validation/      # Request validation schemas
│   ├── app.ts          # Express application setup
│   └── server.ts       # Server entry point
├── tests/
│   ├── storage/        # Storage layer tests
│   ├── services/       # Service layer tests
│   ├── integration/    # API integration tests
│   └── setup.ts        # Test configuration
├── data/
│   ├── prompts.yaml    # Main data file
│   ├── backups/        # Automatic backups
│   └── sample-prompts.yaml # Sample data
└── dist/               # Compiled JavaScript (generated)
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm start           # Start production server

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Code Quality
npm run lint        # Check code with ESLint
npm run lint:fix    # Fix ESLint issues automatically
```

### Adding New Features

1. **Storage Layer**: Implement in `src/storage/`
2. **Business Logic**: Add services in `src/services/`
3. **API Endpoints**: Create routes in `src/routes/`
4. **Validation**: Define schemas in `src/validation/`
5. **Tests**: Add tests in `tests/` directory

### Configuration

Environment variables (create `.env` from `.env.example`):

```bash
# Server Configuration
PORT=3000                    # Server port
HOST=localhost              # Server host
NODE_ENV=development        # Environment

# Storage
DATA_DIR=data               # Data directory path

# Logging
LOG_LEVEL=info              # Log level
```

## Testing

### Test Coverage
The project includes comprehensive test coverage:

- **Unit Tests**: Storage layer, services, validation
- **Integration Tests**: Full API endpoint testing
- **Test Data**: Isolated test data for reliable testing

### Running Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- storage/FileStorage.test.ts

# Run tests in watch mode
npm run test:watch
```

### Test Environment
Tests use isolated test data directories that are automatically cleaned up between test runs.

## Deployment

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
COPY data/ ./data/
EXPOSE 3000
CMD ["npm", "start"]
```

### Production Considerations

1. **Data Persistence**: Ensure `data/` directory is backed up
2. **Process Management**: Use PM2 or similar for process management
3. **Reverse Proxy**: Use Nginx or similar for production
4. **Monitoring**: Implement logging and monitoring solutions
5. **Security**: Configure firewall and security headers

## Architecture

### Extensible Design

The service is designed for easy extension:

1. **Storage Abstraction**: Easy to swap storage backends
2. **Service Layer**: Business logic separated from API concerns
3. **Validation Layer**: Centralized request/response validation
4. **Middleware**: Modular middleware for cross-cutting concerns

### Future Enhancements

Potential areas for extension:
- Database storage backends (PostgreSQL, MongoDB)
- Authentication and authorization
- Rate limiting and API quotas
- Prompt template rendering
- Export/import functionality
- Webhook notifications
- Admin dashboard UI

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## Support

For issues, questions, or contributions:
- Create an issue in the repository
- Check the API documentation at `/api/v1/docs`
- Review the test files for usage examples