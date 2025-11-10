# Continuation Prompt: Terms and Privacy Policy Feature

## Context

You are continuing work on the **Terms and Privacy Policy** feature for the Diet Planner MVP application. This feature implements GDPR-compliant legal documentation and user consent management with bilingual support (English/Polish).

## Implementation Status

### ✅ Completed Components

1. **Database & API Foundation**
   - ✅ Database migration created (`supabase/migrations/20250125200000_add_terms_acceptance_to_preferences.sql`)
   - ✅ `terms_accepted` and `terms_accepted_at` columns added to `user_preferences` table
   - ✅ Database trigger automatically sets `terms_accepted_at` timestamp
   - ✅ API endpoints extended (`GET /api/user-preferences`, `PUT /api/user-preferences`)
   - ✅ TypeScript types updated (`src/types.ts`)
   - ✅ Validation schemas updated (`src/lib/validation/user-preferences.schemas.ts`)
   - ✅ Service layer updated (`src/lib/user-preferences/user-preference.service.ts`)
   - ✅ API client updated (`src/lib/api/user-preferences.client.ts`)

2. **Terms Content & Configuration**
   - ✅ Terms configuration created (`src/lib/terms/terms.config.ts`)
   - ✅ Terms types defined (`src/lib/terms/terms.types.ts`)
   - ✅ Terms loader utility created (`src/lib/terms/terms-loader.ts`)
   - ✅ JSON content files created:
     - `public/terms-privacy-policy.en.json` (English)
     - `public/terms-privacy-policy.pl.json` (Polish)
   - ✅ Content structured with sections (id, heading, content)

3. **UI Components**
   - ✅ `TermsAndPrivacyModal` component created (`src/components/terms/TermsAndPrivacyModal.tsx`)
     - Tabbed interface (Terms/Privacy)
     - JSON content loading based on language
     - Checkboxes for required sections (UX only)
     - "Accept All" button logic
     - Registration and view modes
     - Error handling and loading states
   - ✅ `RegisterForm` updated (`src/components/auth/RegisterForm.tsx`)
     - Integrated Terms modal
     - Terms acceptance validation
     - API call to record acceptance after registration
   - ✅ `AccountProfile` component created (`src/components/account/AccountProfile.tsx`)
     - Account information display
     - Terms acceptance status display
     - View current terms button
     - Account deletion integration
     - Legal information display
   - ✅ `account.astro` page created (`src/pages/app/account.astro`)
     - Authentication check
     - User data fetching
     - AccountProfile component integration
   - ✅ Navigation updated (`src/components/NavBar.tsx`)
     - "My Account" link added
     - Account deletion moved from NavBar to AccountProfile

4. **Internationalization**
   - ✅ Translation keys added (`src/lib/i18n/types.ts`)
   - ✅ English translations added (`src/lib/i18n/translations/en.json`)
   - ✅ Polish translations added (`src/lib/i18n/translations/pl.json`)
   - ✅ Language selector added to auth pages (`src/components/auth/AuthPageWrapper.astro`)
   - ✅ TranslationProvider updated for unauthenticated users (localStorage persistence)

### 🔄 Pending/Incomplete Items

1. **Change Password Functionality**
   - ⚠️ TODO in `AccountProfile.tsx` (line 77): "Implement change password functionality"
   - **Action Required**: Implement change password form/dialog
   - **Reference**: See implementation plan section 4 (Component Details - AccountProfile)

2. **Testing (Phase 5)**
   - ⚠️ **Not yet implemented**: Comprehensive testing as outlined in implementation plan
   - **Required Tests**:
     - Registration flow (terms modal, checkboxes, acceptance)
     - Account profile (view terms, delete account)
     - API endpoints (GET/PUT user-preferences)
     - Error handling (network errors, JSON loading, API errors)
     - Accessibility (keyboard navigation, screen readers, ARIA)
     - Responsive design (mobile devices, scrolling)
   - **Action Required**: Create test files or test scenarios

3. **Legal Review Checkpoints**
   - ⚠️ **Not yet implemented**: Legal review documentation
   - **Action Required**: Add TODO comments for legal review
   - **Reference**: Implementation plan section 16 (Legal Compliance Notes)

4. **Final Integration Testing**
   - ⚠️ **Not yet completed**: End-to-end testing
   - **Action Required**: Test complete user flows
   - **Areas to test**:
     - Registration → Terms acceptance → Dashboard
     - Account profile → View terms → Account deletion
     - Language switching on auth pages
     - Terms content loading in both languages

5. **Error Handling Edge Cases**
   - ⚠️ **May need review**: Error handling for edge cases
   - **Areas to verify**:
     - JSON file not found (fallback to English)
     - Invalid JSON structure
     - Network errors during content loading
     - API errors during terms acceptance
     - Database trigger behavior

6. **Performance Optimization**
   - ⚠️ **May need review**: JSON content loading performance
   - **Action Required**: Verify content loads efficiently
   - **Consider**: Caching strategy for JSON content

## Key Documentation References

1. **Implementation Plan**: `.ai/terms-privacy-policy-implementation-plan.md`
   - Complete feature specification
   - Component details and structure
   - API integration details
   - Database schema
   - Translation keys
   - Testing requirements
   - Legal compliance notes

2. **Project Summary**: `.ai/project-summary.md`
   - Project overview and tech stack
   - Project structure
   - Key patterns and conventions
   - Database schema overview
   - API structure overview

3. **Related Files**:
   - `src/components/terms/TermsAndPrivacyModal.tsx` - Main modal component
   - `src/components/account/AccountProfile.tsx` - Account management component
   - `src/components/auth/RegisterForm.tsx` - Registration form with terms integration
   - `public/terms-privacy-policy.en.json` - English terms content
   - `public/terms-privacy-policy.pl.json` - Polish terms content
   - `src/lib/terms/terms-loader.ts` - Terms content loader
   - `src/lib/terms/terms.config.ts` - Terms configuration

## Next Steps (Priority Order)

### 1. Implement Change Password Functionality (High Priority)
- **Location**: `src/components/account/AccountProfile.tsx`
- **Requirements**:
  - Create change password form/dialog component
  - Integrate with Supabase Auth password update
  - Add validation (current password, new password, confirm password)
  - Handle errors and success states
  - Add translations for change password UI
- **Reference**: Supabase Auth documentation for password updates

### 2. Comprehensive Testing (High Priority)
- **Create test files**:
  - `src/components/terms/__tests__/TermsAndPrivacyModal.test.tsx`
  - `src/components/account/__tests__/AccountProfile.test.tsx`
  - `src/components/auth/__tests__/RegisterForm.test.tsx` (update existing)
  - `src/lib/terms/__tests__/terms-loader.test.ts`
  - `src/pages/api/__tests__/user-preferences.test.ts` (update existing)
- **Test scenarios**: See implementation plan section 15 (Phase 5: Testing)

### 3. Legal Review Documentation (Medium Priority)
- **Action**: Add TODO comments for legal review
- **Locations**:
  - `public/terms-privacy-policy.en.json` - Add comment about legal review
  - `public/terms-privacy-policy.pl.json` - Add comment about legal review
  - `src/components/terms/TermsAndPrivacyModal.tsx` - Add comment about legal review
- **Reference**: Implementation plan section 16 (Legal Compliance Notes)

### 4. Error Handling Verification (Medium Priority)
- **Verify error handling** for:
  - JSON file loading failures
  - Invalid JSON structure
  - Network errors
  - API errors
  - Database trigger behavior
- **Action**: Review and test all error scenarios

### 5. Accessibility Audit (Medium Priority)
- **Test accessibility**:
  - Keyboard navigation in modal
  - Screen reader announcements
  - Focus management
  - ARIA attributes
- **Action**: Manual testing and/or automated accessibility testing

### 6. Performance Optimization (Low Priority)
- **Verify performance**:
  - JSON content loading speed
  - Modal rendering performance
  - Content scrolling performance
- **Action**: Profile and optimize if needed

### 7. Cross-Browser Testing (Low Priority)
- **Test in browsers**:
  - Chrome/Edge
  - Firefox
  - Safari
- **Action**: Manual testing of key flows

## Technical Notes

### Database Schema
- Table: `user_preferences`
- Columns: `terms_accepted` (boolean), `terms_accepted_at` (timestamptz)
- Trigger: `handle_terms_accepted_at()` automatically sets timestamp
- RLS: Existing policies cover new columns

### API Endpoints
- `GET /api/user-preferences` - Returns `terms_accepted` and `terms_accepted_at`
- `PUT /api/user-preferences` - Accepts `terms_accepted` and sets timestamp via trigger

### Content Structure
- JSON files with structured sections
- Each section has: `id`, `heading`, `content` (markdown)
- Content rendered with `react-markdown`
- Language-based file loading with English fallback

### Component Modes
- `TermsAndPrivacyModal` supports two modes:
  - `registration`: Shows checkboxes, requires all sections checked
  - `view`: Read-only, no checkboxes, for account profile

### State Management
- Terms acceptance stored as boolean flag only (not which sections checked)
- Checkboxes are UX-only to ensure users read important sections
- Timestamp automatically set by database trigger

## Common Issues and Solutions

### Issue: Terms content not loading
- **Solution**: Check JSON file paths, verify file structure, check network requests
- **Fallback**: Automatic fallback to English if language file not found

### Issue: Terms acceptance not recorded
- **Solution**: Check API call after registration, verify database trigger, check RLS policies
- **Debug**: Check browser console and network tab

### Issue: Language switching not updating terms content
- **Solution**: Verify `TermsAndPrivacyModal` re-loads content on language change
- **Check**: `useEffect` dependencies and language change detection

### Issue: Database trigger not setting timestamp
- **Solution**: Verify trigger function and trigger definition in migration
- **Check**: Database logs and trigger execution

## Questions to Consider

1. **Change Password**: Should change password require current password verification?
2. **Terms Updates**: How will terms updates be handled in the future? (Email notifications, re-acceptance flow)
3. **Legal Review**: When will legal review be conducted? Who will review the terms content?
4. **Testing**: What testing framework should be used? (Vitest, Playwright, etc.)
5. **Performance**: Should JSON content be cached? What caching strategy?
6. **Accessibility**: Should we use automated accessibility testing tools?

## Success Criteria

The feature is considered complete when:

1. ✅ All core functionality is implemented (database, API, UI components)
2. ✅ Change password functionality is implemented
3. ✅ Comprehensive tests are written and passing
4. ✅ Error handling is robust and tested
5. ✅ Accessibility is verified
6. ✅ Legal review documentation is added
7. ✅ End-to-end user flows are tested and working
8. ✅ Performance is acceptable
9. ✅ Cross-browser compatibility is verified

## Getting Started

1. **Review the implementation plan**: Read `.ai/terms-privacy-policy-implementation-plan.md` thoroughly
2. **Review the project summary**: Read `.ai/project-summary.md` for context
3. **Examine existing code**: Review `TermsAndPrivacyModal.tsx`, `AccountProfile.tsx`, `RegisterForm.tsx`
4. **Check current status**: Verify what's implemented and what's pending
5. **Prioritize tasks**: Start with high-priority items (change password, testing)
6. **Implement incrementally**: Complete one task at a time, test as you go
7. **Document changes**: Update documentation as you make changes

## Additional Resources

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **React Hook Form**: https://react-hook-form.com/
- **Zod Validation**: https://zod.dev/
- **Shadcn/ui Components**: https://ui.shadcn.com/
- **React Markdown**: https://github.com/remarkjs/react-markdown
- **GDPR Compliance**: https://gdpr.eu/

---

**Last Updated**: 2025-01-25
**Status**: Core implementation complete, testing and polish pending
**Next Agent**: Focus on change password functionality and comprehensive testing

