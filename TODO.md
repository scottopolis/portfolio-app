# TODO - Finance App Feature Roadmap

## 1. AI Assistant Integration

Add an AI-powered assistant to help users manage their portfolios and investments through natural language.

### Requirements

- [ ] Text input component for user prompts
- [ ] OpenAI API integration
- [ ] Define function/tool schema for CRUD operations:
  - [ ] Create portfolio
  - [ ] Create investment
  - [ ] Update portfolio
  - [ ] Update investment
  - [ ] Delete portfolio
  - [ ] Delete investment
  - [ ] Query portfolio data
  - [ ] Query investment data
- [ ] Server-side API endpoints for AI tool calls
- [ ] Conversational UI to display AI responses
- [ ] Handle streaming responses from OpenAI
- [ ] Error handling and retry logic

### Considerations

- Use existing server functions in `src/data/investments.ts` as basis for tool implementations
- Consider rate limiting and cost management for OpenAI API calls
- Store conversation history (optional)
- Add user permissions checks before executing tool actions

## 2. Authentication System

Replace mock user system with proper authentication. Read https://tanstack.com/start/latest/docs/framework/react/guide/authentication-overview and follow those instructions.

### Requirements

- [ ] Integrate Clerk (or alternative auth provider)
- [ ] Replace Zustand user store with authenticated session
- [ ] Update all server functions to use authenticated user ID
- [ ] Remove mock users from database initialization
- [ ] Add protected routes
- [ ] Add sign-in/sign-up UI
- [ ] Handle authentication state in components
- [ ] Migrate from hardcoded user IDs to session-based user context

### Migration Notes

- Current system uses `user_id` throughout database queries
- All components currently rely on `useUserStore()` for current user
- Need to update all queries to use authenticated user ID instead

## 3. Database Security Audit

Review and improve database security to ensure proper data isolation.

### Tasks

- [ ] Audit all database queries for proper user_id filtering
- [ ] Ensure Row-Level Security (RLS) policies in PostgreSQL
- [ ] Add database-level constraints to prevent cross-user data access
- [ ] Review server functions for authorization checks
- [ ] Test that User A cannot access User B's data
- [ ] Add SQL injection protection (verify parameterized queries)
- [ ] Review API endpoints for proper authentication middleware

### Security Checklist

- [ ] All `SELECT` queries filter by authenticated user_id
- [ ] All `UPDATE` queries verify ownership before modification
- [ ] All `DELETE` queries verify ownership before deletion
- [ ] All `INSERT` queries automatically set user_id from session
- [ ] Portfolio access verified at database level
- [ ] Investment access verified at database level
- [ ] Distribution access verified at database level

## 4. Data Anonymization

Implement encryption/anonymization so database admins cannot identify users.

### Requirements

- [ ] Research PostgreSQL encryption options (pgcrypto)
- [ ] Encrypt user email addresses
- [ ] Encrypt user names
- [ ] Use password-derived keys for decryption (user-specific)
- [ ] Update queries to handle encrypted data
- [ ] Add decryption logic in server functions
- [ ] Ensure search/filtering still works with encrypted data
- [ ] Update user creation flow to handle encryption
- [ ] Document encryption/decryption process

### Considerations

- This is advanced - may require client-side encryption/decryption
- Consider using a vault service (HashiCorp Vault, AWS KMS)
- May impact query performance
- Backup/recovery becomes more complex
- Consider if this level of security is necessary for MVP
