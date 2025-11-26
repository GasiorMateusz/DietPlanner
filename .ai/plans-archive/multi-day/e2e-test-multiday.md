# Multi-Day Meal Plans - E2E Test Scenarios

This document outlines comprehensive end-to-end test scenarios for the multi-day meal plans feature.

## Test Environment Setup

### Prerequisites
- User account with authentication
- Clean database state (or test isolation)
- AI chat service available
- Export functionality working

### Test Data
- Test user credentials
- Sample startup form data
- Expected AI responses (mocked or real)

## Test Scenarios

### Scenario 1: Create Multi-Day Plan (3 Days)

**Objective**: Verify complete flow of creating a 3-day meal plan via AI chat

**Steps**:
1. Navigate to dashboard
2. Click "Create Plan" button
3. Fill startup form:
   - Patient age: 30
   - Patient weight: 70kg
   - Patient height: 175cm
   - Activity level: Moderate
   - Target kcal: 2000
   - Number of days: **3**
   - Ensure meal variety: **Checked**
   - Different guidelines per day: **Unchecked**
4. Submit form
5. Verify redirect to `/app/create`
6. Verify AI chat interface loads
7. Verify initial AI message appears
8. Verify multi-day plan display shows:
   - Summary with 3 days
   - Average macros
   - All 3 day plans visible
9. Click "Accept Plan" button
10. Verify redirect to `/app/view/[id]`
11. Verify plan view displays:
    - Plan name
    - 3 days listed
    - All days have meals
    - Summary statistics correct

**Expected Results**:
- ✅ Form accepts multi-day options
- ✅ AI generates 3-day plan
- ✅ Plan is saved to database
- ✅ View page displays all days correctly
- ✅ All day plans linked correctly

**Validation Points**:
- Database: `multi_day_plans` table has 1 record
- Database: `multi_day_plan_days` has 3 records
- Database: `meal_plans` has 3 records with `is_day_plan = true`
- Frontend: All 3 days visible and ordered correctly

---

### Scenario 2: Create Multi-Day Plan with Per-Day Guidelines

**Objective**: Verify creation with different guidelines per day

**Steps**:
1. Navigate to dashboard
2. Click "Create Plan"
3. Fill startup form:
   - Basic patient info
   - Number of days: **5**
   - Different guidelines per day: **Checked**
   - Per-day guidelines: "Day 1-2: Low carb. Day 3-5: High protein."
4. Submit form
5. Verify AI chat receives per-day guidelines
6. Verify AI generates plan considering guidelines
7. Accept plan
8. Verify plan saved correctly

**Expected Results**:
- ✅ Per-day guidelines included in AI prompt
- ✅ Generated plan reflects guidelines
- ✅ Plan saved with correct metadata

---

### Scenario 3: View Multi-Day Plan

**Objective**: Verify read-only view displays all information correctly

**Steps**:
1. Navigate to `/app/view/[existing-plan-id]`
2. Verify page loads without errors
3. Verify displays:
   - Plan name (header)
   - Number of days
   - Average macros (kcal, proteins, fats, carbs)
   - Common guidelines (if present)
   - Common allergens (if present)
   - All days in order (Day 1, Day 2, etc.)
   - Each day shows:
     - Day number and optional name
     - Daily summary
     - All meals with details
4. Scroll through all days
5. Verify days are sorted correctly

**Expected Results**:
- ✅ All plan data displayed
- ✅ Days in correct order
- ✅ No missing data
- ✅ Loading states work
- ✅ Error states handled

**Edge Cases**:
- Plan with 1 day
- Plan with 7 days
- Plan without common guidelines
- Plan without allergens
- Plan with day names

---

### Scenario 4: List Multi-Day Plans

**Objective**: Verify listing and search functionality

**Steps**:
1. Navigate to dashboard (or list endpoint)
2. Verify multi-day plans appear in list
3. Test search:
   - Enter plan name
   - Verify filtered results
4. Test sorting:
   - Sort by name (asc/desc)
   - Sort by created_at (asc/desc)
   - Sort by updated_at (asc/desc)
5. Verify pagination (if implemented)

**Expected Results**:
- ✅ All user's multi-day plans listed
- ✅ Search filters correctly
- ✅ Sorting works for all fields
- ✅ Only user's own plans shown

---

### Scenario 5: Export Multi-Day Plan (DOC)

**Objective**: Verify DOC export functionality

**Steps**:
1. Navigate to plan view page
2. Click "Export" button
3. Verify export modal opens
4. Configure options:
   - Daily summary: **Checked**
   - Meals summary: **Checked**
   - Ingredients: **Checked**
   - Preparation: **Checked**
   - Format: **DOC**
5. Click "Export" button
6. Verify file downloads
7. Verify filename: `[plan-name].doc`
8. Open downloaded file
9. Verify content:
   - Plan name as title
   - Number of days
   - Common guidelines (if present)
   - All days in order
   - Each day has:
     - Day header
     - Daily summary table
     - All meals with details

**Expected Results**:
- ✅ File downloads successfully
- ✅ Correct filename
- ✅ All selected content included
- ✅ Formatting correct
- ✅ All days present

---

### Scenario 6: Export Multi-Day Plan (HTML)

**Objective**: Verify HTML export functionality

**Steps**:
1. Navigate to plan view page
2. Click "Export" button
3. Select format: **HTML**
4. Configure content options
5. Export
6. Verify HTML file downloads
7. Open in browser
8. Verify:
   - Proper HTML structure
   - All content present
   - Styling applied
   - All days visible

**Expected Results**:
- ✅ Valid HTML file
- ✅ All content included
- ✅ Properly formatted
- ✅ Viewable in browser

---

### Scenario 7: Export with Partial Content Options

**Objective**: Verify export respects content options

**Steps**:
1. Navigate to plan view
2. Open export modal
3. Configure:
   - Daily summary: **Unchecked**
   - Meals summary: **Checked**
   - Ingredients: **Checked**
   - Preparation: **Unchecked**
4. Export
5. Verify exported file:
   - No daily summary sections
   - Meals summary present
   - Ingredients present
   - Preparation missing

**Expected Results**:
- ✅ Only selected content included
- ✅ Validation prevents empty export
- ✅ File structure correct

---

### Scenario 8: Update Multi-Day Plan Name

**Objective**: Verify updating plan metadata

**Steps**:
1. Navigate to plan view
2. Click "Edit" button
3. Verify redirect to `/app/edit/[id]`
4. (For now, verify edit page loads - full edit flow TBD)

**Expected Results**:
- ✅ Edit page accessible
- ✅ Plan data loads
- ✅ Edit interface ready

**Note**: Full edit functionality pending implementation

---

### Scenario 9: Delete Multi-Day Plan

**Objective**: Verify deletion with cascade

**Steps**:
1. Create a test multi-day plan (3 days)
2. Note the plan ID and day plan IDs
3. Call DELETE `/api/multi-day-plans/[id]`
4. Verify:
   - Multi-day plan deleted
   - Junction records deleted
   - Day plans deleted (or verify cleanup logic)
5. Verify cannot access plan view
6. Verify plan not in list

**Expected Results**:
- ✅ Plan deleted from database
- ✅ Junction records cascade deleted
- ✅ Day plans handled correctly
- ✅ 404 on view attempt
- ✅ Not in list

---

### Scenario 10: Update Multi-Day Plan (Replace Day Plans)

**Objective**: Verify updating day plans

**Steps**:
1. Create a 3-day plan
2. Call PUT `/api/multi-day-plans/[id]` with new `day_plans` array
3. Verify:
   - Old day plans deleted
   - New day plans created
   - Junction records updated
   - Summary recalculated
4. View plan and verify new content

**Expected Results**:
- ✅ Old day plans removed
- ✅ New day plans created
- ✅ Links updated correctly
- ✅ Summary recalculated
- ✅ View shows new content

---

### Scenario 11: Error Handling - Invalid Plan ID

**Objective**: Verify error handling for invalid IDs

**Steps**:
1. Navigate to `/app/view/invalid-uuid`
2. Verify error message displayed
3. Navigate to `/app/view/00000000-0000-0000-0000-000000000000`
4. Verify 404 or "not found" message
5. Test with non-existent but valid UUID

**Expected Results**:
- ✅ Validation errors for invalid UUIDs
- ✅ 404 for non-existent plans
- ✅ User-friendly error messages
- ✅ Retry/back options available

---

### Scenario 12: Error Handling - Unauthorized Access

**Objective**: Verify security - cannot access other user's plans

**Steps**:
1. Create plan as User A
2. Log in as User B
3. Attempt to access User A's plan via `/app/view/[user-a-plan-id]`
4. Verify:
   - 404 or unauthorized error
   - Plan not accessible
5. Attempt API call directly
6. Verify 404 response

**Expected Results**:
- ✅ Cannot view other user's plans
- ✅ Cannot access via API
- ✅ Proper error responses
- ✅ No data leakage

---

### Scenario 13: Create Plan with Maximum Days (7)

**Objective**: Verify system handles maximum day count

**Steps**:
1. Create plan with 7 days
2. Verify AI generates 7-day plan
3. Verify all 7 days saved
4. Verify view displays all 7 days
5. Verify export includes all 7 days
6. Test scrolling/navigation

**Expected Results**:
- ✅ 7 days created successfully
- ✅ All days visible
- ✅ Performance acceptable
- ✅ Export complete

---

### Scenario 14: Create Plan with Minimum Days (1)

**Objective**: Verify single-day plan still works

**Steps**:
1. Create plan with 1 day
2. Verify treated as multi-day plan
3. Verify single day displayed
4. Verify summary correct

**Expected Results**:
- ✅ Single day plan works
- ✅ Summary matches day
- ✅ No errors

---

### Scenario 15: Search Multi-Day Plans

**Objective**: Verify search functionality

**Steps**:
1. Create multiple plans with different names:
   - "Weekend Plan"
   - "Workout Week"
   - "Holiday Meals"
2. Test search:
   - Search "Weekend" → finds "Weekend Plan"
   - Search "Week" → finds "Weekend Plan" and "Workout Week"
   - Search "xyz" → no results
3. Verify case-insensitive search

**Expected Results**:
- ✅ Partial matches work
- ✅ Case-insensitive
- ✅ Multiple results shown
- ✅ Empty results handled

---

### Scenario 16: Validation - Required Fields

**Objective**: Verify form validation

**Steps**:
1. Attempt to submit startup form:
   - Without number of days → verify error
   - With number_of_days = 0 → verify error
   - With number_of_days = 8 → verify error
   - With different_guidelines_per_day = true but no per_day_guidelines → verify error
2. Verify error messages clear

**Expected Results**:
- ✅ All validations work
- ✅ Error messages helpful
- ✅ Form prevents invalid submission

---

### Scenario 17: AI Chat - Multi-Day Plan Display

**Objective**: Verify AI chat shows multi-day plan correctly

**Steps**:
1. Start multi-day plan creation
2. Wait for AI response
3. Verify:
   - Multi-day plan display component shown
   - Summary section visible
   - All days listed
   - Days sorted correctly
   - Accept button enabled
4. Verify single-day plan still shows old component

**Expected Results**:
- ✅ Correct component for multi-day
- ✅ All days visible in chat
- ✅ Accept works
- ✅ Single-day unchanged

---

### Scenario 18: Performance - Large Plan

**Objective**: Verify performance with 7-day plan

**Steps**:
1. Create 7-day plan with many meals per day
2. Measure:
   - Page load time
   - Export generation time
   - Scroll performance
3. Verify acceptable performance

**Expected Results**:
- ✅ Page loads < 2 seconds
- ✅ Export generates < 5 seconds
- ✅ Smooth scrolling
- ✅ No memory issues

---

### Scenario 19: Internationalization

**Objective**: Verify i18n support

**Steps**:
1. Switch language to Polish
2. Create multi-day plan
3. Verify:
   - Form labels in Polish
   - View page in Polish
   - Export in Polish
4. Switch back to English
5. Verify same content in English

**Expected Results**:
- ✅ All text translated
- ✅ Language persists
- ✅ Export uses correct language

---

### Scenario 20: Mobile Responsiveness

**Objective**: Verify mobile experience

**Steps**:
1. Open on mobile device (or resize browser)
2. Test:
   - View page layout
   - Export modal
   - Day cards
   - Navigation
3. Verify:
   - Text readable
   - Buttons accessible
   - Scrolling works
   - No horizontal scroll

**Expected Results**:
- ✅ Responsive layout
- ✅ Touch-friendly
- ✅ All features accessible
- ✅ Good UX on mobile

---

## Test Data Templates

### Standard Test Plan
```json
{
  "name": "Test Multi-Day Plan",
  "number_of_days": 3,
  "patient_age": 30,
  "patient_weight": 70,
  "patient_height": 175,
  "activity_level": "moderate",
  "target_kcal": 2000,
  "ensure_meal_variety": true,
  "different_guidelines_per_day": false
}
```

### Per-Day Guidelines Test Plan
```json
{
  "number_of_days": 5,
  "different_guidelines_per_day": true,
  "per_day_guidelines": "Day 1-2: Low carb focus. Day 3-5: High protein meals."
}
```

## Automated Test Checklist

### API Tests
- [ ] POST /api/multi-day-plans - Create
- [ ] GET /api/multi-day-plans - List with filters
- [ ] GET /api/multi-day-plans/[id] - Get by ID
- [ ] PUT /api/multi-day-plans/[id] - Update
- [ ] DELETE /api/multi-day-plans/[id] - Delete
- [ ] GET /api/multi-day-plans/[id]/export - Export

### Frontend Tests
- [ ] Startup form validation
- [ ] AI chat interface
- [ ] Plan view component
- [ ] Export modal
- [ ] Navigation flows

### Integration Tests
- [ ] Complete creation flow
- [ ] View flow
- [ ] Export flow
- [ ] Update flow
- [ ] Delete flow

## Test Execution Order

1. **Smoke Tests**: Scenarios 1, 3, 5 (basic functionality)
2. **Core Features**: Scenarios 2, 4, 6, 7
3. **Edge Cases**: Scenarios 11, 12, 13, 14
4. **Advanced**: Scenarios 8, 9, 10
5. **Quality**: Scenarios 15-20

## Success Criteria

All scenarios should pass with:
- ✅ No errors in console
- ✅ No database inconsistencies
- ✅ All UI elements functional
- ✅ Performance acceptable
- ✅ Security verified
- ✅ Data integrity maintained

---

**Last Updated**: Test scenarios created  
**Status**: Ready for test implementation

