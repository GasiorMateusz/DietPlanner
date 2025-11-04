# API Endpoint Implementation Plan: GET /api/meal-plans/{id}/export

## 1. Endpoint Overview

This endpoint generates a Microsoft Word document (.doc) containing the specified meal plan details and returns it as a downloadable file. The endpoint leverages existing meal plan data from the database and formats it into a structured document suitable for printing or sharing with patients.

**Purpose**: Enable dietitians to export meal plans in a standardized, professional format.

**Key Characteristics**:

- Returns binary file data (not JSON)
- Requires authentication
- User-scoped access (users can only export their own meal plans)
- Synchronous generation (no background processing)

## 2. Request Details

**HTTP Method**: `GET`

**URL Structure**: `/api/meal-plans/{id}/export`

**Path Parameters**:

- `id` (required, UUID): The unique identifier of the meal plan to export

**Query Parameters**: None

**Request Body**: None

**Headers**:

- `Authorization`: Bearer token (required)
- Standard Astro request headers

## 3. Used Types

**Input Types**:

- Path parameter validated as: `z.string().uuid()` (Zod schema)

**Response Types**:

- Binary data (no DTO needed)
- Headers:
  - `Content-Type: application/msword`
  - `Content-Disposition: attachment; filename="[sanitized-name].doc"`

**Internal Types**:

- `TypedMealPlanRow` - fetched from database
- Custom service types for document generation (internal to service)

## 4. Response Details

**Success Response** (200 OK):

- Body: Binary .doc file content
- Headers:
  ```
  Content-Type: application/msword
  Content-Disposition: attachment; filename="Patient-Meal-Plan-2025.doc"
  Content-Length: [file size in bytes]
  ```

**Error Responses**:

- `401 Unauthorized`: Missing or invalid authentication token
- `404 Not Found`: Meal plan doesn't exist or user doesn't have access
- `500 Internal Server Error`: Database error or document generation failure

## 5. Data Flow

```
1. Request arrives at endpoint handler
   ↓
2. Middleware validates authentication (auth.uid() available)
   ↓
3. Validate 'id' path parameter (UUID format)
   ↓
4. Query meal_plans table via MealPlanService.getById(id, userId)
   ↓
5. If not found, return 404
   ↓
6. Pass meal plan data to DocumentGeneratorService.generateDoc(mealPlan)
   ↓
7. Service formats data into .doc structure
   - Include startup data (age, weight, height, etc.)
   - Include daily summary (kcal, macros)
   - Include all meals with ingredients, preparation, nutrition
   - Apply professional formatting
   ↓
8. Return binary stream with appropriate headers
   ↓
9. Client receives downloadable file
```

**External Dependencies**:

- Supabase database (read-only)
- Document generation library (e.g., `docx` npm package)
- Authentication middleware (existing)

## 6. Security Considerations

**Authentication**:

- Leverage existing middleware to ensure `auth.uid()` is present
- Reject unauthenticated requests with 401

**Authorization**:

- RLS policies on `meal_plans` table ensure users can only access their own plans
- Explicitly pass `userId` to service methods for defense-in-depth
- Return 404 (not 403) to prevent information leakage about existence of other users' plans

**Input Validation**:

- Validate `id` path parameter is valid UUID format before database query
- Prevents malformed queries and potential injection

**Output Sanitization**:

- Sanitize filename from meal plan name:
  - Remove/sanitize special characters
  - Limit length (max 100 chars)
  - Replace spaces with hyphens
  - Fallback to "meal-plan" if sanitized name is empty

**Data Privacy**:

- Only return meal plans owned by authenticated user
- No sensitive data in error messages

**Resource Protection**:

- Consider timeouts for large document generation
- Monitor memory usage during generation
- No file caching to prevent storage issues

## 7. Error Handling

| Scenario                        | Status Code | Response Body                        | Log Level |
| ------------------------------- | ----------- | ------------------------------------ | --------- |
| Missing auth token              | 401         | Standard auth error                  | WARN      |
| Invalid auth token              | 401         | Standard auth error                  | WARN      |
| Malformed UUID in path          | 404         | `{ error: "Meal plan not found" }`   | INFO      |
| Meal plan not found             | 404         | `{ error: "Meal plan not found" }`   | INFO      |
| DB connection error             | 500         | `{ error: "Internal server error" }` | ERROR     |
| DB query error                  | 500         | `{ error: "Internal server error" }` | ERROR     |
| Document generation failure     | 500         | `{ error: "Internal server error" }` | ERROR     |
| Out of memory during generation | 500         | `{ error: "Internal server error" }` | ERROR     |

**Error Handling Strategy**:

- Early returns for authentication failures
- Use try-catch for database operations
- Catch document generation errors and return 500
- Log detailed errors server-side, generic messages client-side
- Always return consistent error response structure for client-side handling

## 8. Performance Considerations

**Potential Bottlenecks**:

1. **Database Query**: Fetches entire meal plan row with large JSON blob
2. **Document Generation**: CPU-intensive formatting and rendering
3. **Memory Usage**: Large meals arrays may consume significant memory
4. **Large Documents**: Complex meal plans with many meals generate larger files

**Optimization Strategies**:

1. **Database**: Index on `id` already exists, query is O(1)
2. **Document Generation**:
   - Stream document generation if library supports it
   - Consider async/await properly to prevent blocking
   - Add timeout guards (30s max)
3. **Memory**:
   - Reuse document generator instances if library supports it
   - Monitor heap usage
4. **Caching**:
   - Consider server-side caching for frequently accessed plans
   - Use ETags if implementing cache
5. **Alternative Approach**:
   - For very large plans, consider background job with polling endpoint
   - Not implemented in MVP

**Monitoring Points**:

- Average response time (target: < 2s)
- Failure rate
- 90th percentile response time
- Memory usage during generation

## 9. Implementation Steps

### Step 1: Install Required Dependencies

```bash
npm install docx
npm install --save-dev @types/docx  # if TypeScript types exist
```

### Step 2: Create Document Generator Service

**File**: `src/lib/meal-plans/doc-generator.service.ts`

**Service Structure**:

```typescript
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType } from "docx";
import type { TypedMealPlanRow, MealPlanMeal } from "../../../types";

export class DocumentGeneratorService {
  /**
   * Generates a .doc file from meal plan data
   */
  async generateDoc(mealPlan: TypedMealPlanRow): Promise<Buffer>;

  /**
   * Sanitizes filename for safe file system usage
   */
  private sanitizeFilename(name: string): string;

  /**
   * Generates document sections from meal plan data
   */
  private generateSections(mealPlan: TypedMealPlanRow): Paragraph[];

  /**
   * Formats startup data section
   */
  private formatStartupData(mealPlan: TypedMealPlanRow): Paragraph[];

  /**
   * Formats daily summary section
   */
  private formatDailySummary(mealPlan: TypedMealPlanRow): Paragraph[];

  /**
   * Formats meals section
   */
  private formatMeals(meals: MealPlanMeal[]): Paragraph[];
}
```

### Step 3: Create Validation Schema

**File**: `src/lib/validation/meal-plans.schemas.ts` (if not exists, add to existing)

Add UUID path parameter validation:

```typescript
import { z } from "zod";

export const mealPlanIdPathParamSchema = z.object({
  id: z.string().uuid("Invalid meal plan ID format"),
});
```

### Step 4: Implement API Endpoint

**File**: `src/pages/api/meal-plans/[id]/export.ts`

**Endpoint Structure**:

```typescript
import type { APIRoute } from "astro";
import { mealPlanIdPathParamSchema } from "../../../../lib/validation/meal-plans.schemas";
import { MealPlanService } from "../../../../lib/meal-plans/meal-plan.service";
import { DocumentGeneratorService } from "../../../../lib/meal-plans/doc-generator.service";
import { getAuthToken } from "../../../../lib/auth/get-auth-token";

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  // 1. Validate path parameter
  // 2. Get auth token
  // 3. Fetch meal plan
  // 4. Generate document
  // 5. Return binary response with headers
};
```

### Step 5: Update MealPlanService (if needed)

**File**: `src/lib/meal-plans/meal-plan.service.ts`

Ensure `getById` method properly scopes by userId and handles not found cases.

### Step 6: Error Handling Implementation

- Add try-catch blocks around database and document generation calls
- Implement consistent error response format
- Add appropriate logging

### Step 7: Add Unit Tests

**File**: `src/lib/meal-plans/__tests__/doc-generator.service.test.ts`

Test cases:

- Document generation with valid meal plan
- Filename sanitization edge cases
- Empty/null handling
- Large meal plans

### Step 8: Integration Testing

**File**: Use existing test utilities in `testing/`

Test scenarios:

- Valid export request
- Unauthenticated request
- Non-existent plan
- Invalid UUID format

### Step 9: Documentation

- Update API documentation
- Add endpoint to route specification
- Document filename sanitization behavior

### Step 10: Code Review Checklist

- [ ] Authentication check in place
- [ ] Path parameter validation implemented
- [ ] Error handling covers all scenarios
- [ ] Security considerations addressed
- [ ] Performance acceptable for expected load
- [ ] Logging implemented appropriately
- [ ] Tests written and passing
- [ ] No linter errors
- [ ] Follows project coding standards
