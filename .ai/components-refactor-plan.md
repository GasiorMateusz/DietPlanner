# React Hook Form Refactoring Plan

## 1. Analysis

### 1.1 Component Inventory and Functionalities

#### Form Components (Primary Candidates for React Hook Form)

1. **StartupFormDialog.tsx** (368 lines)
   - **Functionality**: Collects patient data and dietary requirements for AI meal plan generation
   - **Fields**: 
     - Patient info: age, weight, height (numbers)
     - Activity level (select)
     - Target calories (number)
     - Macro distribution: protein %, fat %, carbs % (numbers, must sum validation)
     - Meal names (text)
     - Exclusions/guidelines (textarea)
   - **Complexity**: High - Complex nested state, manual validation, macro distribution calculations

2. **MealPlanEditor.tsx** (581 lines)
   - **Functionality**: Create/edit meal plans with multiple meal cards
   - **Fields**:
     - Plan name (text)
     - Dynamic array of meals (each with name, ingredients, preparation)
     - Daily summary (read-only, calculated)
   - **Complexity**: Very High - Dynamic form arrays, two modes (create/edit), API calls mixed with form logic

3. **MealCard.tsx** (103 lines)
   - **Functionality**: Individual meal card component used within MealPlanEditor
   - **Fields**: Name, ingredients, preparation (all text inputs)
   - **Complexity**: Medium - Controlled by parent, but could benefit from field array integration

4. **AIChatInterface.tsx** (394 lines)
   - **Functionality**: Chat interface for AI meal plan generation
   - **Fields**: Message input (textarea)
   - **Complexity**: Medium - Simple form but complex state management for chat

5. **LoginForm.tsx** (130 lines)
   - **Functionality**: User authentication login
   - **Fields**: Email, password
   - **Complexity**: Low - Simple form with manual validation

6. **RegisterForm.tsx** (202 lines)
   - **Functionality**: User registration
   - **Fields**: Email, password, confirm password, terms checkbox
   - **Complexity**: Medium - Password matching validation, terms acceptance

7. **DashboardHeader.tsx** (42 lines)
   - **Functionality**: Search input for meal plans
   - **Fields**: Search query (text)
   - **Complexity**: Low - Simple controlled input, not a true form

#### Non-Form Components (Reference Only)

- MealPlanList.tsx, MealPlanListItem.tsx, MealPlanActions.tsx, etc. - Display/action components

### 1.2 Form-Related Logic Identification

#### StartupFormDialog.tsx
```typescript
// Current issues:
- Manual state management with useState for all fields (lines 23-32)
- Manual error state management (line 34)
- Complex number parsing logic (lines 45-50, 52-71)
- Manual validation with Zod schema (lines 99-111)
- Nested state updates for macro distribution (lines 52-71)
- Form reset logic duplicated (lines 116-125, 139-148)
```

#### MealPlanEditor.tsx
```typescript
// Current issues:
- Complex editorState object managing all form state (lines 71-84)
- Manual meal array manipulation (lines 181-220)
- Manual validation function (lines 226-231)
- Inline API calls mixed with form submission (lines 236-348)
- Two initialization paths (create vs edit) with different data sources
```

#### Auth Forms (LoginForm, RegisterForm)
```typescript
// Current issues:
- Manual state for values and errors (similar pattern)
- Manual Zod validation (lines 28-41 in LoginForm)
- Manual error mapping from Zod errors
- Form submission logic mixed with API calls
```

### 1.3 High Complexity Areas

1. **StartupFormDialog.tsx**:
   - Macro distribution validation (must handle sum to 100%)
   - Number input parsing with null handling
   - Cross-field validation (macro percentages)
   - Form reset on close/submit

2. **MealPlanEditor.tsx**:
   - Dynamic meal array management
   - Two initialization modes (create/edit)
   - Complex state transitions
   - API calls embedded in form handlers
   - Export functionality mixed with form logic

3. **AIChatInterface.tsx**:
   - Chat state management separate from form
   - Optimistic UI updates for messages
   - Form validation mixed with chat logic

### 1.4 API Call Locations

#### Direct fetch calls in components:
- **MealPlanEditor.tsx**:
  - `loadMealPlanFromApi` (lines 117-169) - GET `/api/meal-plans/{id}`
  - `handleSave` (lines 236-348) - POST `/api/meal-plans` or PUT `/api/meal-plans/{id}`
  - `handleExport` (lines 353-410) - GET `/api/meal-plans/{id}/export`

- **AIChatInterface.tsx**:
  - `createAiSession` (lines 109-134) - POST `/api/ai/sessions`
  - `sendMessage` (lines 139-164) - POST `/api/ai/sessions/{id}/message`

- **DashboardView.tsx**:
  - `handleExport` (lines 77-127) - GET `/api/meal-plans/{id}/export`
  - `handleDeleteConfirm` (lines 143-188) - DELETE `/api/meal-plans/{id}`

- **Auth Forms**:
  - Supabase client calls (not fetch, but API-like)

- **useMealPlansList.ts** (custom hook):
  - GET `/api/meal-plans` with query params

#### Common patterns:
- All fetch calls include auth token retrieval
- Duplicated error handling (401 redirects, error parsing)
- No centralized API client
- Inline error handling in components

---

<refactoring_breakdown>

## Detailed Refactoring Breakdown

### StartupFormDialog.tsx Analysis

**Current State:**
- 368 lines of code with manual state management
- Uses `useState` for form data and errors separately
- Complex number parsing logic (`handleNumberInputChange`)
- Macro distribution updates require nested state updates
- Manual Zod validation with error mapping
- Form reset logic duplicated in multiple places

**React Hook Form Integration Strategy:**

**Option A: Full RHF Integration**
- Use `useForm` with Zod resolver (`@hookform/resolvers/zod`)
- Replace all `useState` calls with RHF form state
- Use `Controller` for complex inputs (Select, macro distribution)
- Leverage `useFieldArray` if we restructure macro distribution
- Use `watch` for conditional validation (macro sum = 100%)

**Pros:**
- Significant code reduction (estimated 40-50% reduction)
- Automatic validation integration with Zod
- Better performance (fewer re-renders)
- Built-in form state management
- Automatic error handling

**Cons:**
- Learning curve for team
- Need to refactor number input handling
- Macro distribution structure might need adjustment

**Option B: Hybrid Approach**
- Keep manual state for complex nested structures
- Use RHF for simple fields only

**Pros:**
- Less invasive change
- Can migrate incrementally

**Cons:**
- Doesn't fully leverage RHF benefits
- Still have manual state management

**Recommendation: Option A** - Full integration provides maximum benefit for this complex form.

**Specific Refactoring Areas:**

1. **Number Input Handling** (lines 45-50):
   ```typescript
   // Current: Manual parsing with null handling
   const handleNumberInputChange = (field, value) => {
     const numValue = value === "" ? null : parseFloat(value);
     // ...
   }
   
   // Refactored: Use RHF with valueAsNumber and custom transform
   <Controller
     name="patient_age"
     control={control}
     render={({ field }) => (
       <Input
         {...field}
         type="number"
         value={field.value ?? ""}
         onChange={(e) => {
           const val = e.target.value === "" ? null : parseFloat(e.target.value);
           field.onChange(val);
         }}
       />
     )}
   />
   ```

2. **Macro Distribution** (lines 52-71):
   ```typescript
   // Current: Nested state updates
   const handleMacroChange = (macro, value) => {
     setFormData(prev => ({
       ...prev,
       target_macro_distribution: {
         p_perc: prev.target_macro_distribution?.p_perc ?? 0,
         // ...
       }
     }));
   }
   
   // Refactored: Use RHF with nested field paths
   <Controller
     name="target_macro_distribution.p_perc"
     control={control}
     rules={{
       validate: (value) => {
         const total = getValues([
           'target_macro_distribution.p_perc',
           'target_macro_distribution.f_perc',
           'target_macro_distribution.c_perc'
         ]).reduce((sum, val) => sum + (val ?? 0), 0);
         return total === 100 || "Macro percentages must sum to 100%";
       }
     }}
     render={({ field }) => <Input {...field} />}
   />
   ```

3. **Validation** (lines 99-111):
   ```typescript
   // Current: Manual Zod validation and error mapping
   const validation = mealPlanStartupDataSchema.safeParse(dataToValidate);
   if (!validation.success) {
     const fieldErrors = {};
     validation.error.errors.forEach((error) => {
       fieldErrors[error.path.join(".")] = error.message;
     });
     setErrors(fieldErrors);
   }
   
   // Refactored: Automatic with zodResolver
   const form = useForm<MealPlanStartupData>({
     resolver: zodResolver(mealPlanStartupDataSchema),
     defaultValues: {
       patient_age: null,
       // ...
     }
   });
   ```

### MealPlanEditor.tsx Analysis

**Current State:**
- 581 lines with complex state management
- Two modes: create and edit
- Dynamic meal array
- API calls embedded in form handlers
- Manual validation function

**React Hook Form Integration Strategy:**

**Challenges:**
1. Dynamic meal array - Perfect use case for `useFieldArray`
2. Two initialization modes - Need different default values
3. Daily summary is read-only - Not part of form
4. API calls should be separated from form logic

**Approach:**
- Use `useForm` with `useFieldArray` for meals
- Separate API calls into custom hooks or services
- Use form mode/reset for switching between create/edit
- Keep daily summary outside form state

**Specific Refactoring Areas:**

1. **Dynamic Meal Array** (lines 181-220):
   ```typescript
   // Current: Manual array manipulation
   const handleMealAdd = () => {
     const newMeal = { name: "", ingredients: "", ... };
     setEditorState(prev => ({
       ...prev,
       meals: [...prev.meals, newMeal]
     }));
   };
   
   // Refactored: useFieldArray
   const { fields, append, remove } = useFieldArray({
     control,
     name: "meals"
   });
   
   const handleMealAdd = () => {
     append({
       name: "",
       ingredients: "",
       preparation: "",
       summary: { kcal: 0, p: 0, f: 0, c: 0 }
     });
   };
   ```

2. **Form Initialization** (lines 89-112):
   ```typescript
   // Current: useEffect with conditional logic
   useEffect(() => {
     if (mealPlanId) {
       loadMealPlanFromApi(mealPlanId);
     } else {
       loadMealPlanFromBridge();
     }
   }, [mealPlanId]);
   
   // Refactored: Use reset() with loaded data
   useEffect(() => {
     const loadData = async () => {
       const data = mealPlanId 
         ? await loadMealPlanFromApi(mealPlanId)
         : await loadMealPlanFromBridge();
       
       reset({
         planName: data.planName,
         meals: data.meals
       });
     };
     loadData();
   }, [mealPlanId, reset]);
   ```

3. **Validation** (lines 226-231):
   ```typescript
   // Current: Manual validation function
   const validateForm = (): string | null => {
     return validateMealPlanForm({
       planName: editorState.planName,
       meals: editorState.meals
     });
   };
   
   // Refactored: Use Zod schema with RHF
   const form = useForm<MealPlanFormData>({
     resolver: zodResolver(mealPlanFormSchema),
     mode: "onChange" // or "onBlur"
   });
   ```

### AIChatInterface.tsx Analysis

**Current State:**
- Simple textarea input
- Complex chat state management
- Optimistic UI updates
- Form validation for message length

**React Hook Form Integration Strategy:**

This is a good candidate for RHF, but simpler than others. The main benefit is:
- Automatic validation
- Cleaner form submission
- Better integration with validation

**Specific Refactoring:**
```typescript
// Current: Manual state and validation
const [inputValue, setInputValue] = useState("");
const validation = validateChatMessage(inputValue, MAX_MESSAGE_LENGTH);

// Refactored: RHF with validation
const form = useForm<{ message: string }>({
  resolver: zodResolver(z.object({
    message: z.string()
      .min(1, "Message cannot be empty")
      .max(MAX_MESSAGE_LENGTH, `Message must be less than ${MAX_MESSAGE_LENGTH} characters`)
  }))
});

const onSubmit = form.handleSubmit(async (data) => {
  // Send message logic
});
```

### Auth Forms Analysis

**Current State:**
- LoginForm: Simple email/password
- RegisterForm: Email, password, confirm password, terms
- Manual validation with Zod
- Manual error mapping

**React Hook Form Integration Strategy:**

These are straightforward candidates for RHF. Benefits:
- Remove manual state management
- Automatic validation
- Cleaner code

**Specific Refactoring:**
```typescript
// Current: Manual state
const [values, setValues] = useState({ email: "", password: "" });
const [errors, setErrors] = useState({});

// Refactored: RHF
const form = useForm<LoginInput>({
  resolver: zodResolver(loginSchema)
});

// Current: Manual error display
{errors.email ? <p>{errors.email}</p> : null}

// Refactored: RHF error display
<Input {...form.register("email")} />
{form.formState.errors.email && (
  <p>{form.formState.errors.email.message}</p>
)}
```

### API Call Management Considerations

**Current Issues:**
- API calls scattered across components
- Duplicated error handling
- Auth token retrieval in every call
- No centralized API client

**Refactoring Strategy:**

1. **Create API Client Layer:**
   - `src/lib/api/meal-plans.client.ts` - Meal plan operations
   - `src/lib/api/ai-chat.client.ts` - AI chat operations
   - `src/lib/api/auth.client.ts` - Auth operations (if needed)

2. **Extract to Custom Hooks:**
   - `useMealPlan` - Load/create/update meal plan
   - `useAIChat` - Chat operations
   - `useMealPlanExport` - Export functionality

3. **Benefits:**
   - Reusable API logic
   - Centralized error handling
   - Easier testing
   - Better separation of concerns

</refactoring_breakdown>

---

## 2. Refactoring Plan

### 2.1 Component Structure Changes

#### 2.1.1 Create API Client Layer

**New Files:**
- `src/lib/api/meal-plans.client.ts`
- `src/lib/api/ai-chat.client.ts`
- `src/lib/api/base.client.ts` (shared utilities)

**Structure:**
```typescript
// src/lib/api/base.client.ts
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  if (!token) {
    window.location.href = "/auth/login";
    throw new Error("Unauthorized");
  }
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (response.status === 401) {
    window.location.href = "/auth/login";
    throw new Error("Unauthorized");
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: "An error occurred",
    }));
    throw new Error(errorData.error || "An error occurred");
  }
  
  return response.json();
}

// src/lib/api/meal-plans.client.ts
export const mealPlansApi = {
  async getById(id: string): Promise<GetMealPlanByIdResponseDto> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/meal-plans/${id}`, { headers });
    return handleApiResponse(response);
  },
  
  async create(command: CreateMealPlanCommand): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch("/api/meal-plans", {
      method: "POST",
      headers,
      body: JSON.stringify(command),
    });
    await handleApiResponse(response);
  },
  
  async update(id: string, command: UpdateMealPlanCommand): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/meal-plans/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(command),
    });
    await handleApiResponse(response);
  },
  
  async export(id: string): Promise<Blob> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/meal-plans/${id}/export`, { headers });
    if (response.status === 401) {
      window.location.href = "/auth/login";
      throw new Error("Unauthorized");
    }
    if (!response.ok) {
      throw new Error("Failed to export");
    }
    return response.blob();
  },
  
  async delete(id: string): Promise<void> {
    const headers = await getAuthHeaders();
    const response = await fetch(`/api/meal-plans/${id}`, {
      method: "DELETE",
      headers,
    });
    await handleApiResponse(response);
  },
};
```

#### 2.1.2 Create Custom Hooks for Form Logic

**New Files:**
- `src/components/hooks/useMealPlanEditor.ts`
- `src/components/hooks/useStartupForm.ts`
- `src/components/hooks/useAIChatForm.ts`
- `src/components/hooks/useMealPlanExport.ts`

**Example Structure:**
```typescript
// src/components/hooks/useMealPlanEditor.ts
export function useMealPlanEditor(mealPlanId?: string) {
  const form = useForm<MealPlanFormData>({
    resolver: zodResolver(mealPlanFormSchema),
    mode: "onChange",
  });
  
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "meals",
  });
  
  // Load data logic
  // Save logic
  // Export logic
  
  return {
    form,
    fields,
    append,
    remove,
    // ... other methods
  };
}
```

#### 2.1.3 Component File Structure After Refactoring

```
src/components/
├── MealPlanEditor.tsx (main orchestrator, ~150 lines)
├── MealPlanEditorForm.tsx (form UI only, ~200 lines)
├── StartupFormDialog.tsx (~200 lines, down from 368)
├── AIChatInterface.tsx (~250 lines, down from 394)
├── auth/
│   ├── LoginForm.tsx (~80 lines, down from 130)
│   └── RegisterForm.tsx (~120 lines, down from 202)
└── hooks/
    ├── useMealPlanEditor.ts (~150 lines)
    ├── useStartupForm.ts (~100 lines)
    ├── useAIChatForm.ts (~80 lines)
    └── useMealPlanExport.ts (~50 lines)
```

### 2.2 React Hook Form Implementation

#### 2.2.1 Installation

```bash
npm install react-hook-form @hookform/resolvers
```

#### 2.2.2 StartupFormDialog.tsx Implementation

**Step 1: Install dependencies and create Zod schema integration**

```typescript
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { mealPlanStartupDataSchema } from "@/lib/validation/meal-plans.schemas";
import type { MealPlanStartupData } from "@/types";

export function StartupFormDialog({ open, onClose, onSubmit }: StartupFormDialogProps) {
  const form = useForm<MealPlanStartupData>({
    resolver: zodResolver(mealPlanStartupDataSchema),
    defaultValues: {
      patient_age: null,
      patient_weight: null,
      patient_height: null,
      activity_level: null,
      target_kcal: null,
      target_macro_distribution: null,
      meal_names: null,
      exclusions_guidelines: null,
    },
    mode: "onChange", // or "onBlur" for better performance
  });

  const onSubmitForm = form.handleSubmit(async (data) => {
    onSubmit(data);
    form.reset(); // Reset form after successful submission
  });

  const handleClose = () => {
    if (!form.formState.isSubmitting) {
      form.reset();
      onClose();
    }
  };

  // ... rest of component
}
```

**Step 2: Replace number inputs with Controller**

```typescript
<Controller
  name="patient_age"
  control={form.control}
  render={({ field, fieldState }) => (
    <div className="space-y-2">
      <Label htmlFor="patient_age">Patient Age</Label>
      <Input
        id="patient_age"
        type="number"
        value={field.value ?? ""}
        onChange={(e) => {
          const val = e.target.value === "" ? null : parseFloat(e.target.value);
          field.onChange(val);
        }}
        onBlur={field.onBlur}
        aria-invalid={fieldState.invalid}
        data-testid="startup-form-patient-age"
      />
      {fieldState.error && (
        <p className="text-sm text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  )}
/>
```

**Step 3: Handle macro distribution with custom validation**

```typescript
<Controller
  name="target_macro_distribution.p_perc"
  control={form.control}
  rules={{
    validate: (value) => {
      const macros = form.getValues("target_macro_distribution");
      if (!macros) return true;
      const total = (macros.p_perc ?? 0) + (macros.f_perc ?? 0) + (macros.c_perc ?? 0);
      return total === 100 || "Macro percentages must sum to 100%";
    },
  }}
  render={({ field, fieldState }) => (
    <div>
      <Label htmlFor="p_perc">Protein</Label>
      <Input
        id="p_perc"
        type="number"
        min="0"
        max="100"
        value={field.value ?? ""}
        onChange={(e) => {
          const val = e.target.value === "" ? 0 : parseFloat(e.target.value);
          field.onChange(val);
        }}
        onBlur={field.onBlur}
      />
      {fieldState.error && (
        <p className="text-xs text-destructive">{fieldState.error.message}</p>
      )}
    </div>
  )}
/>
```

**Step 4: Use form state for submission**

```typescript
<Button
  type="submit"
  disabled={form.formState.isSubmitting || !form.formState.isValid}
  data-testid="startup-form-generate-button"
>
  {form.formState.isSubmitting ? "Generating..." : "Generate"}
</Button>
```

#### 2.2.3 MealPlanEditor.tsx Implementation

**Step 1: Create form schema**

```typescript
// src/lib/validation/meal-plan-form.schema.ts
import { z } from "zod";

const mealSchema = z.object({
  name: z.string().min(1, "Meal name is required"),
  ingredients: z.string(),
  preparation: z.string(),
  summary: z.object({
    kcal: z.number().nonnegative(),
    p: z.number().nonnegative(),
    f: z.number().nonnegative(),
    c: z.number().nonnegative(),
  }),
});

export const mealPlanFormSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  meals: z.array(mealSchema).min(1, "At least one meal is required"),
});
```

**Step 2: Implement useFieldArray for meals**

```typescript
export default function MealPlanEditor({ mealPlanId }: MealPlanEditorProps) {
  const form = useForm<MealPlanFormData>({
    resolver: zodResolver(mealPlanFormSchema),
    defaultValues: {
      planName: "",
      meals: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "meals",
  });

  const handleMealAdd = () => {
    append({
      name: "",
      ingredients: "",
      preparation: "",
      summary: { kcal: 0, p: 0, f: 0, c: 0 },
    });
  };

  const handleMealRemove = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  // ... rest of component
}
```

**Step 3: Update MealCard to use form control**

```typescript
// Pass form control to MealCard
{fields.map((field, index) => (
  <MealCard
    key={field.id}
    mealIndex={index}
    control={form.control}
    isRemoveable={fields.length > 1}
    onRemove={handleMealRemove}
  />
))}
```

**Step 4: Update MealCard component**

```typescript
interface MealCardProps {
  mealIndex: number;
  control: Control<MealPlanFormData>;
  isRemoveable: boolean;
  onRemove: (index: number) => void;
}

export function MealCard({ mealIndex, control, isRemoveable, onRemove }: MealCardProps) {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <Controller
        name={`meals.${mealIndex}.name`}
        control={control}
        rules={{ required: "Meal name is required" }}
        render={({ field, fieldState }) => (
          <div className="space-y-2">
            <Label>
              Meal Name <span className="text-destructive">*</span>
            </Label>
            <Input
              {...field}
              placeholder="e.g., Breakfast, Lunch, Dinner"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.error && (
              <p className="text-sm text-destructive">{fieldState.error.message}</p>
            )}
          </div>
        )}
      />
      {/* Similar for ingredients and preparation */}
    </div>
  );
}
```

#### 2.2.4 AIChatInterface.tsx Implementation

```typescript
const form = useForm<{ message: string }>({
  resolver: zodResolver(z.object({
    message: z.string()
      .min(1, "Message cannot be empty")
      .max(MAX_MESSAGE_LENGTH, `Message must be less than ${MAX_MESSAGE_LENGTH} characters`)
  })),
  defaultValues: { message: "" },
});

const onSubmit = form.handleSubmit(async (data) => {
  if (!sessionId) {
    setChatState((prev) => ({
      ...prev,
      error: "No active session. Please refresh the page.",
    }));
    return;
  }

  // Clear error and optimistically add message
  setChatState((prev) => ({ ...prev, error: null }));
  const userMessage: UserChatMessage = {
    role: "user",
    content: data.message,
  };

  setChatState((prev) => ({
    ...prev,
    messageHistory: [...prev.messageHistory, userMessage],
    isLoading: true,
  }));

  form.reset();

  try {
    const response = await sendMessage(sessionId, userMessage);
    setChatState((prev) => ({
      ...prev,
      messageHistory: [...prev.messageHistory, response.message],
      promptCount: response.prompt_count,
      isLoading: false,
    }));
  } catch (error) {
    // Handle error
    setChatState((prev) => ({
      ...prev,
      messageHistory: prev.messageHistory.slice(0, -1),
      isLoading: false,
      error: error instanceof Error ? error.message : "Failed to send message",
    }));
    form.setValue("message", data.message); // Restore message on error
  }
});

// In JSX:
<Textarea
  {...form.register("message")}
  onKeyDown={handleKeyDown}
  disabled={chatState.isLoading || !sessionId}
  data-testid="ai-chat-message-input"
/>
{form.formState.errors.message && (
  <p className="text-sm text-destructive">{form.formState.errors.message.message}</p>
)}
```

#### 2.2.5 Auth Forms Implementation

**LoginForm.tsx:**

```typescript
const form = useForm<LoginInput>({
  resolver: zodResolver(loginSchema),
  defaultValues: { email: "", password: "" },
});

const onSubmit = form.handleSubmit(async (data) => {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    form.setError("root", { message: "Invalid email or password." });
    return;
  }

  window.location.href = "/app/dashboard";
});

// In JSX:
<Input
  {...form.register("email")}
  type="email"
  aria-invalid={!!form.formState.errors.email}
/>
{form.formState.errors.email && (
  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
)}
{form.formState.errors.root && (
  <Alert>
    <AlertDescription>{form.formState.errors.root.message}</AlertDescription>
  </Alert>
)}
```

### 2.3 Logic Optimization

#### 2.3.1 Extract Form Logic to Custom Hooks

**useStartupForm.ts:**
```typescript
export function useStartupForm(onSubmit: (data: MealPlanStartupData) => void) {
  const form = useForm<MealPlanStartupData>({
    resolver: zodResolver(mealPlanStartupDataSchema),
    defaultValues: {
      patient_age: null,
      // ... other defaults
    },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    onSubmit(data);
    form.reset();
  });

  const handleClose = () => {
    if (!form.formState.isSubmitting) {
      form.reset();
    }
  };

  return {
    form,
    handleSubmit,
    handleClose,
  };
}
```

**useMealPlanEditor.ts:**
```typescript
export function useMealPlanEditor(mealPlanId?: string) {
  const form = useForm<MealPlanFormData>({
    resolver: zodResolver(mealPlanFormSchema),
    defaultValues: { planName: "", meals: [] },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "meals",
  });

  // Load data effect
  useEffect(() => {
    const loadData = async () => {
      try {
        form.reset({ isLoading: true });
        const data = mealPlanId
          ? await mealPlansApi.getById(mealPlanId)
          : await loadFromBridge();
        
        form.reset({
          planName: data.planName,
          meals: data.meals,
        });
      } catch (error) {
        form.setError("root", {
          message: error instanceof Error ? error.message : "Failed to load",
        });
      }
    };
    loadData();
  }, [mealPlanId, form]);

  const handleSave = form.handleSubmit(async (data) => {
    try {
      if (mealPlanId) {
        await mealPlansApi.update(mealPlanId, {
          name: data.planName.trim(),
          plan_content: {
            daily_summary: dailySummary, // from separate state
            meals: data.meals,
          },
        });
      } else {
        await mealPlansApi.create({
          name: data.planName.trim(),
          plan_content: {
            daily_summary: dailySummary,
            meals: data.meals,
          },
          // ... other fields
        });
      }
      window.location.href = "/app/dashboard";
    } catch (error) {
      form.setError("root", {
        message: error instanceof Error ? error.message : "Failed to save",
      });
    }
  });

  return {
    form,
    fields,
    append,
    remove,
    handleSave,
    isFormReady: form.formState.isValid && !form.formState.isSubmitting,
  };
}
```

#### 2.3.2 Simplify Component Code

**Before (MealPlanEditor.tsx - 581 lines):**
- Complex state management
- Inline API calls
- Manual validation
- Mixed concerns

**After (MealPlanEditor.tsx - ~150 lines):**
```typescript
export default function MealPlanEditor({ mealPlanId }: MealPlanEditorProps) {
  const { form, fields, append, remove, handleSave, isFormReady } = useMealPlanEditor(mealPlanId);
  const { dailySummary, isLoading, error } = useMealPlanData(mealPlanId);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  return (
    <div className="container mx-auto p-4 sm:p-8 max-w-4xl">
      <h1>Meal Plan Editor</h1>
      
      <form onSubmit={handleSave}>
        <Controller
          name="planName"
          control={form.control}
          render={({ field }) => (
            <Input {...field} placeholder="Plan name" />
          )}
        />
        
        <DailySummaryStaticDisplay summary={dailySummary} />
        
        {fields.map((field, index) => (
          <MealCard
            key={field.id}
            mealIndex={index}
            control={form.control}
            onRemove={() => remove(index)}
          />
        ))}
        
        <Button type="button" onClick={() => append(defaultMeal)}>
          Add Meal
        </Button>
        
        <Button type="submit" disabled={!isFormReady}>
          Save
        </Button>
      </form>
    </div>
  );
}
```

### 2.4 API Call Management

#### 2.4.1 Create API Client Layer

As outlined in section 2.1.1, create centralized API clients.

#### 2.4.2 Create Custom Hooks for API Operations

**useMealPlanExport.ts:**
```typescript
export function useMealPlanExport() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportMealPlan = async (id: string) => {
    setIsExporting(true);
    setError(null);
    
    try {
      const blob = await mealPlansApi.export(id);
      
      // Extract filename from blob or use default
      const filename = `meal-plan-${id}.doc`;
      
      // Download blob
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export");
      throw err;
    } finally {
      setIsExporting(false);
    }
  };

  return { exportMealPlan, isExporting, error };
}
```

**useAIChat.ts:**
```typescript
export function useAIChat() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initializeSession = async (startupData: MealPlanStartupData) => {
    try {
      const response = await aiChatApi.createSession(startupData);
      setSessionId(response.session_id);
      setMessages([response.message]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to initialize");
      throw err;
    }
  };

  const sendMessage = async (message: UserChatMessage) => {
    if (!sessionId) throw new Error("No active session");
    
    setIsLoading(true);
    setError(null);
    
    // Optimistic update
    setMessages((prev) => [...prev, message]);
    
    try {
      const response = await aiChatApi.sendMessage(sessionId, message);
      setMessages((prev) => [...prev, response.message]);
    } catch (err) {
      // Remove optimistic message
      setMessages((prev) => prev.slice(0, -1));
      setError(err instanceof Error ? err.message : "Failed to send message");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sessionId,
    messages,
    isLoading,
    error,
    initializeSession,
    sendMessage,
  };
}
```

#### 2.4.3 Update Components to Use API Clients

**Before:**
```typescript
const response = await fetch(`/api/meal-plans/${id}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});
```

**After:**
```typescript
const data = await mealPlansApi.getById(id);
```

### 2.5 Testing Strategy

#### 2.5.1 Unit Testing for Forms

**Test Form Validation:**
```typescript
// src/test/unit/StartupFormDialog.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StartupFormDialog } from "@/components/StartupFormDialog";

describe("StartupFormDialog", () => {
  it("should validate required fields", async () => {
    const onSubmit = vi.fn();
    render(<StartupFormDialog open={true} onClose={vi.fn()} onSubmit={onSubmit} />);
    
    const submitButton = screen.getByTestId("startup-form-generate-button");
    await userEvent.click(submitButton);
    
    // RHF automatically handles validation
    await waitFor(() => {
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  it("should validate macro distribution sums to 100%", async () => {
    // Test macro validation
  });

  it("should handle number input with null values", async () => {
    // Test number parsing
  });
});
```

**Test useFieldArray:**
```typescript
// src/test/unit/MealPlanEditor.test.tsx
describe("MealPlanEditor", () => {
  it("should add new meal", async () => {
    const { result } = renderHook(() => useMealPlanEditor());
    
    act(() => {
      result.current.append({
        name: "Breakfast",
        ingredients: "",
        preparation: "",
        summary: { kcal: 0, p: 0, f: 0, c: 0 },
      });
    });
    
    expect(result.current.fields).toHaveLength(1);
  });

  it("should validate meal array has at least one meal", async () => {
    // Test validation
  });
});
```

#### 2.5.2 Integration Testing

**Test Form Submission:**
```typescript
// src/test/integration/meal-plan-creation.test.tsx
describe("Meal Plan Creation Flow", () => {
  it("should create meal plan from form", async () => {
    // Mock API
    const mockCreate = vi.fn().mockResolvedValue({});
    vi.spyOn(mealPlansApi, "create").mockImplementation(mockCreate);
    
    render(<MealPlanEditor />);
    
    // Fill form
    await userEvent.type(screen.getByLabelText("Plan Name"), "Test Plan");
    await userEvent.click(screen.getByText("Add Meal"));
    await userEvent.type(screen.getByLabelText("Meal Name"), "Breakfast");
    
    // Submit
    await userEvent.click(screen.getByText("Save"));
    
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Test Plan",
          meals: expect.arrayContaining([
            expect.objectContaining({ name: "Breakfast" }),
          ]),
        })
      );
    });
  });
});
```

#### 2.5.3 E2E Testing

**Test Complete User Flows:**
```typescript
// src/test/e2e/meal-plan-workflow.spec.ts
import { test, expect } from "@playwright/test";

test("create meal plan workflow", async ({ page }) => {
  await page.goto("/app/dashboard");
  
  // Open startup form
  await page.click('[data-testid="dashboard-create-meal-plan-button"]');
  
  // Fill form using RHF
  await page.fill('[data-testid="startup-form-patient-age"]', "30");
  await page.fill('[data-testid="startup-form-target-kcal"]', "2000");
  
  // Submit
  await page.click('[data-testid="startup-form-generate-button"]');
  
  // Verify navigation and form submission
  await expect(page).toHaveURL(/\/app\/create/);
});
```

#### 2.5.4 Edge Cases to Test

1. **Form Validation:**
   - Empty required fields
   - Invalid number formats
   - Macro distribution not summing to 100%
   - Maximum length validations
   - Special characters in inputs

2. **Dynamic Fields:**
   - Adding/removing meals
   - Minimum one meal requirement
   - Form state persistence during array manipulation

3. **API Integration:**
   - Network errors
   - 401 unauthorized responses
   - 404 not found
   - Validation errors from API
   - Optimistic UI updates and rollback

4. **Form State:**
   - Form reset on close
   - Form reset on successful submission
   - Dirty state detection
   - Unsaved changes warning

5. **Performance:**
   - Large number of meals (performance testing)
   - Rapid form field changes
   - Debounced validation

#### 2.5.5 Testing Utilities

**Create Test Helpers:**
```typescript
// src/test/utils/form-helpers.tsx
import { render } from "@testing-library/react";
import { FormProvider } from "react-hook-form";

export function renderWithForm(component: React.ReactElement, form: any) {
  return render(
    <FormProvider {...form}>
      {component}
    </FormProvider>
  );
}

export function createMockForm(defaultValues: any) {
  // Helper to create mock form for testing
}
```

### 2.6 Migration Strategy

#### Phase 1: Setup (Week 1)
1. Install React Hook Form and resolvers
2. Create API client layer
3. Create base client utilities
4. Set up testing utilities

#### Phase 2: Simple Forms (Week 2)
1. Refactor LoginForm
2. Refactor RegisterForm
3. Test thoroughly
4. Deploy and monitor

#### Phase 3: Complex Forms - Part 1 (Week 3)
1. Refactor StartupFormDialog
2. Create useStartupForm hook
3. Test validation edge cases
4. Deploy and monitor

#### Phase 4: Complex Forms - Part 2 (Week 4)
1. Refactor AIChatInterface
2. Create useAIChat hook
3. Test optimistic updates
4. Deploy and monitor

#### Phase 5: Most Complex Form (Week 5-6)
1. Refactor MealPlanEditor
2. Create useMealPlanEditor hook
3. Refactor MealCard component
4. Extensive testing
5. Deploy and monitor

#### Phase 6: Cleanup (Week 7)
1. Remove old validation utilities if no longer needed
2. Update documentation
3. Code review
4. Final testing

### 2.7 Benefits Summary

**Code Reduction:**
- StartupFormDialog: ~368 → ~200 lines (45% reduction)
- MealPlanEditor: ~581 → ~150 lines (74% reduction)
- LoginForm: ~130 → ~80 lines (38% reduction)
- RegisterForm: ~202 → ~120 lines (41% reduction)

**Improvements:**
- Better separation of concerns
- Reusable form logic
- Centralized API calls
- Easier testing
- Better performance (fewer re-renders)
- Type safety with Zod integration
- Automatic validation
- Better error handling

**Maintainability:**
- Easier to add new form fields
- Consistent form patterns
- Centralized error handling
- Better code organization

---

## 3. Implementation Checklist

### Prerequisites
- [ ] Install `react-hook-form`
- [ ] Install `@hookform/resolvers`
- [ ] Review existing Zod schemas
- [ ] Set up API client structure

### API Client Layer
- [ ] Create `src/lib/api/base.client.ts`
- [ ] Create `src/lib/api/meal-plans.client.ts`
- [ ] Create `src/lib/api/ai-chat.client.ts`
- [ ] Update components to use API clients
- [ ] Test API client error handling

### Custom Hooks
- [ ] Create `useMealPlanEditor.ts`
- [ ] Create `useStartupForm.ts`
- [ ] Create `useAIChatForm.ts`
- [ ] Create `useMealPlanExport.ts`
- [ ] Test all hooks

### Component Refactoring
- [ ] Refactor `LoginForm.tsx`
- [ ] Refactor `RegisterForm.tsx`
- [ ] Refactor `StartupFormDialog.tsx`
- [ ] Refactor `AIChatInterface.tsx`
- [ ] Refactor `MealPlanEditor.tsx`
- [ ] Update `MealCard.tsx` to use form control

### Testing
- [ ] Unit tests for forms
- [ ] Unit tests for hooks
- [ ] Integration tests
- [ ] E2E tests
- [ ] Edge case testing

### Documentation
- [ ] Update component documentation
- [ ] Create form patterns guide
- [ ] Update API client documentation

---

## 4. Risk Assessment

### Low Risk
- LoginForm, RegisterForm refactoring (simple forms)
- API client extraction (clear separation)

### Medium Risk
- StartupFormDialog (complex validation, but isolated)
- AIChatInterface (optimistic updates need careful handling)

### High Risk
- MealPlanEditor (complex, dynamic forms, critical user flow)
  - **Mitigation**: Extensive testing, gradual rollout, feature flag

### Dependencies
- React Hook Form compatibility with React 19
- Zod resolver compatibility
- Shadcn/ui components compatibility with Controller

---

## 5. Success Metrics

1. **Code Reduction**: Target 40-50% reduction in form component lines
2. **Test Coverage**: Maintain or improve current test coverage
3. **Performance**: No regression in form interaction performance
4. **User Experience**: No breaking changes, improved error messages
5. **Maintainability**: Easier to add new form fields, consistent patterns

---

## 6. Rollback Plan

If issues arise:
1. Keep old component versions as backup
2. Use feature flags for gradual rollout
3. Monitor error rates and user feedback
4. Have rollback procedure documented
5. Test rollback procedure in staging

