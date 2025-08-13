#!/usr/bin/env node

/**
 * Example usage of the Prompt Library Service API
 * 
 * This script demonstrates how to:
 * 1. Start the service
 * 2. Create prompts
 * 3. Search and retrieve prompts
 * 4. Update prompts
 * 5. Get statistics
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api/v1';

// Helper function to make API requests
async function apiRequest(method, endpoint, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`Error ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 Prompt Library API Usage Example\n');

  try {
    // 1. Check service health
    console.log('1. Checking service health...');
    const health = await apiRequest('GET', '../../health');
    console.log('✅ Service is healthy:', health.data.status);
    console.log();

    // 2. Create a comprehensive prompt
    console.log('2. Creating a comprehensive AI assistant prompt...');
    const newPrompt = {
      title: 'AI Code Reviewer',
      content: `You are an expert code reviewer with years of experience in software development.

Your task is to review the provided {{language}} code and provide constructive feedback.

## Code to Review:
\`\`\`{{language}}
{{code}}
\`\`\`

## Review Focus Areas:
{{#each focus_areas}}
- {{this}}
{{/each}}

## Please provide:
1. **Code Quality Assessment**: Rate the code quality (1-10) and explain your rating
2. **Issues Found**: List any bugs, security vulnerabilities, or performance problems
3. **Best Practices**: Suggest improvements following {{language}} best practices
4. **Refactoring Suggestions**: Recommend any structural improvements
5. **Testing Recommendations**: Suggest appropriate test cases

## Guidelines:
- Be constructive and helpful in your feedback
- Provide specific examples and code snippets when possible
- Consider maintainability, readability, and performance
- Suggest alternative approaches when appropriate`,
      description: 'A comprehensive AI code review assistant that provides detailed feedback on code quality, security, and best practices.',
      tags: ['code-review', 'programming', 'quality-assurance', 'best-practices', 'security'],
      category: 'development',
      variables: [
        {
          name: 'language',
          description: 'The programming language of the code being reviewed',
          type: 'string',
          required: true,
          defaultValue: 'JavaScript'
        },
        {
          name: 'code',
          description: 'The actual code to be reviewed',
          type: 'string',
          required: true
        },
        {
          name: 'focus_areas',
          description: 'Specific areas to focus on during the review',
          type: 'array',
          required: false,
          defaultValue: ['security', 'performance', 'maintainability', 'readability']
        }
      ],
      author: 'Development Team'
    };

    const createdPrompt = await apiRequest('POST', '/prompts', newPrompt);
    console.log(`✅ Created prompt: ${createdPrompt.data.title} (ID: ${createdPrompt.data.id})`);
    console.log();

    // 3. Create another prompt for variety
    console.log('3. Creating a creative writing prompt...');
    const writingPrompt = {
      title: 'Creative Story Generator',
      content: `You are a creative writing coach helping to generate an engaging {{genre}} story.

## Story Parameters:
- **Genre**: {{genre}}
- **Setting**: {{setting}}
- **Main Character**: {{protagonist}}
- **Conflict**: {{conflict}}
- **Target Length**: {{length}}

## Your Task:
Create a compelling story outline that includes:

1. **Opening Hook**: An engaging first scene that draws readers in
2. **Character Development**: How the protagonist will grow and change
3. **Plot Structure**: Key plot points following the three-act structure
4. **Conflict Resolution**: How the main conflict will be resolved
5. **Theme**: The underlying message or theme of the story

## Writing Style:
- Use vivid, descriptive language
- Create relatable, multi-dimensional characters  
- Build tension and maintain reader engagement
- Include sensory details to immerse the reader

Please provide both a detailed outline and a sample opening paragraph.`,
      description: 'An AI assistant for generating creative story ideas and outlines across different genres.',
      tags: ['creative-writing', 'storytelling', 'fiction', 'narrative', 'character-development'],
      category: 'creative',
      variables: [
        {
          name: 'genre',
          description: 'The genre of the story',
          type: 'string',
          required: true,
          defaultValue: 'science fiction'
        },
        {
          name: 'setting',
          description: 'Where and when the story takes place',
          type: 'string',
          required: true,
          defaultValue: 'modern day urban setting'
        },
        {
          name: 'protagonist',
          description: 'The main character of the story',
          type: 'string',
          required: true,
          defaultValue: 'a young professional facing a life-changing decision'
        },
        {
          name: 'conflict',
          description: 'The main conflict or challenge in the story',
          type: 'string',
          required: true,
          defaultValue: 'a moral dilemma that tests their values'
        },
        {
          name: 'length',
          description: 'Target length of the story',
          type: 'string',
          required: false,
          defaultValue: 'short story (2000-5000 words)'
        }
      ],
      author: 'Creative Writing Team'
    };

    const createdWritingPrompt = await apiRequest('POST', '/prompts', writingPrompt);
    console.log(`✅ Created prompt: ${createdWritingPrompt.data.title} (ID: ${createdWritingPrompt.data.id})`);
    console.log();

    // 4. List all prompts
    console.log('4. Listing all prompts...');
    const allPrompts = await apiRequest('GET', '/prompts');
    console.log(`📋 Found ${allPrompts.data.total} prompts:`);
    allPrompts.data.items.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title} (${prompt.category})`);
    });
    console.log();

    // 5. Search for development-related prompts
    console.log('5. Searching for development-related prompts...');
    const searchResults = await apiRequest('GET', '/prompts/search?q=development&category=development');
    console.log(`🔍 Found ${searchResults.data.total} development prompts:`);
    searchResults.data.items.forEach((prompt, index) => {
      console.log(`   ${index + 1}. ${prompt.title}`);
      console.log(`      Tags: ${prompt.tags.join(', ')}`);
    });
    console.log();

    // 6. Get a specific prompt and demonstrate usage tracking
    console.log('6. Retrieving a specific prompt (usage tracking demonstration)...');
    const specificPrompt = await apiRequest('GET', `/prompts/${createdPrompt.data.id}`);
    console.log(`📖 Retrieved: ${specificPrompt.data.title}`);
    console.log(`   Usage count: ${specificPrompt.data.metadata.usage}`);
    
    // Retrieve it again to show usage increment
    const specificPromptAgain = await apiRequest('GET', `/prompts/${createdPrompt.data.id}`);
    console.log(`   Usage count after second retrieval: ${specificPromptAgain.data.metadata.usage}`);
    console.log();

    // 7. Update a prompt
    console.log('7. Updating a prompt...');
    const updateData = {
      description: 'An enhanced AI code review assistant with comprehensive feedback capabilities and security focus.',
      tags: ['code-review', 'programming', 'quality-assurance', 'best-practices', 'security', 'mentoring']
    };
    
    const updatedPrompt = await apiRequest('PUT', `/prompts/${createdPrompt.data.id}`, updateData);
    console.log(`✏️  Updated prompt: ${updatedPrompt.data.title}`);
    console.log(`   New version: ${updatedPrompt.data.metadata.version}`);
    console.log(`   Updated tags: ${updatedPrompt.data.tags.join(', ')}`);
    console.log();

    // 8. Get categories and tags
    console.log('8. Getting available categories and tags...');
    const categories = await apiRequest('GET', '/prompts/categories');
    const tags = await apiRequest('GET', '/prompts/tags');
    
    console.log(`📂 Available categories: ${categories.data.join(', ')}`);
    console.log(`🏷️  Available tags: ${tags.data.slice(0, 10).join(', ')}${tags.data.length > 10 ? '...' : ''}`);
    console.log();

    // 9. Get statistics
    console.log('9. Getting usage statistics...');
    const stats = await apiRequest('GET', '/prompts/stats');
    console.log(`📊 Library Statistics:`);
    console.log(`   Total prompts: ${stats.data.totalPrompts}`);
    console.log(`   Total categories: ${stats.data.totalCategories}`);
    console.log(`   Total tags: ${stats.data.totalTags}`);
    console.log(`   Most used prompts:`);
    stats.data.mostUsedPrompts.forEach((prompt, index) => {
      console.log(`      ${index + 1}. ${prompt.title} (${prompt.usage} uses)`);
    });
    console.log();

    // 10. Filter prompts by category
    console.log('10. Filtering prompts by category...');
    const creativePrompts = await apiRequest('GET', '/prompts?category=creative&limit=5');
    console.log(`🎨 Creative prompts (${creativePrompts.data.total} total):`);
    creativePrompts.data.items.forEach((prompt, index) => {
      console.log(`    ${index + 1}. ${prompt.title}`);
    });
    console.log();

    console.log('✅ Example completed successfully!');
    console.log();
    console.log('💡 Tips for using the Prompt Library:');
    console.log('   - Use descriptive titles and tags for easy searching');
    console.log('   - Include variables to make prompts reusable');
    console.log('   - Organize prompts with meaningful categories');
    console.log('   - The YAML storage format allows manual editing');
    console.log('   - Usage statistics help identify popular prompts');
    console.log('   - Automatic backups protect your prompt library');

  } catch (error) {
    console.error('❌ Example failed:', error.message);
    process.exit(1);
  }
}

// Run the example if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { apiRequest, main };