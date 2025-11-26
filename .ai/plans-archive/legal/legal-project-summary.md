# Diet Planner - Legal Project Summary

**Document Purpose:** This document provides a comprehensive overview of the Diet Planner application for legal review and drafting of Terms of Service and Privacy Policy documents.

**Date:** January 2025  
**Version:** MVP (Minimum Viable Product)  
**Status:** In Development

---

## 1. Application Overview

### 1.1. Service Description

**Diet Planner** is a web-based application designed exclusively for professional dietitians. The application automates and accelerates the creation of personalized, 1-day meal plans for patients using artificial intelligence (AI).

### 1.2. Core Functionality

The application operates through a three-step workflow:

1. **Form Input**: Dietitians enter patient parameters (age, weight, height, activity level, caloric goals, macronutrient distribution, dietary restrictions, allergies, and other guidelines)
2. **AI Generation**: An AI language model generates meal plan proposals through a conversational interface, allowing iterative corrections
3. **Manual Editing & Export**: Dietitians review, manually edit, save, and export meal plans to .doc files for distribution to patients

### 1.3. Target Users

- **Primary Users**: Professional dietitians only
- **Not Intended For**: Patients, general consumers, or non-professional users
- **Access**: Requires account registration with email and password
- **Geographic Focus**: Primarily EU (English and Polish language support)

### 1.4. Business Model

- **Current Status**: Free service
- **Future Consideration**: May transition to paid subscription model (users will be notified of any pricing changes)

---

## 2. Data Collection and Processing

### 2.1. Data Controller vs. Data Processor Relationship

**Critical Legal Distinction:**

- **Platform Role**: Data Processor
- **User Role (Dietitians)**: Data Controllers for their clients' data
- **Legal Basis**: Platform processes data only as instructed by dietitians (users)

This distinction is fundamental to GDPR compliance, as dietitians are responsible for:
- Obtaining client consent
- Establishing legal basis for processing health data (GDPR Article 9)
- Handling data subject rights requests
- Ensuring compliance with professional regulations

### 2.2. Categories of Data Collected

#### 2.2.1. Account Data (Platform as Controller)
- **Email Address**: Required for account registration and authentication
- **Password**: Hashed and stored securely (handled by Supabase Auth)
- **Account Preferences**: Language preference (English/Polish), theme preference (light/dark)
- **Terms Acceptance**: Boolean flag and timestamp of acceptance

#### 2.2.2. Client Data (Platform as Processor, Dietitians as Controllers)
**Note:** This data is entered by dietitians and may include:

- **Patient Information**: 
  - Age, weight (kg), height (cm)
  - Physical activity level
  - Medical conditions (if mentioned in meal plan labels or content)
  - Dietary restrictions and allergies
  - Health information (entered in free-text fields)
- **Meal Plan Data**:
  - Meal plan names (may contain patient identifiers)
  - Meal content (ingredients, portions, preparation methods)
  - Nutritional information (calories, macronutrients)
  - Dietary guidelines and exclusions

**Important:** The platform does not have a separate "Patient" entity. Patient information is embedded within meal plan names and content fields, making it the dietitian's responsibility to ensure proper data handling.

#### 2.2.3. AI Conversation History (Telemetry Data)
- **Purpose**: Analytics and model improvement
- **Content**: Complete conversation history between dietitian and AI
- **Access**: Not accessible to users
- **Retention**: Permanent (even after account deletion)
- **Legal Basis**: Legitimate interest (analytics and service improvement)

#### 2.2.4. Usage Data
- **Session Information**: Number of AI interactions per session
- **Meal Plan Count**: Number of meal plans created per user
- **Purpose**: Analytics and service quality metrics

### 2.3. Data Processing Flow

1. **Registration**: User provides email and password → Account created in Supabase Auth
2. **Meal Plan Creation**: 
   - Dietitian enters patient data and guidelines → Stored in database
   - Data sent to OpenRouter (AI service) → AI generates meal plan
   - Conversation history stored for analytics
3. **Meal Plan Storage**: Meal plans saved to database, associated with user account
4. **Export**: Meal plans exported to .doc files (downloaded by dietitian)

---

## 3. Third-Party Services and Data Sharing

### 3.1. Supabase (Backend-as-a-Service)

**Service Provider:** Supabase Inc.  
**Location:** EU Region (data residency)  
**Services Used:**
- PostgreSQL database (data storage)
- User authentication (email/password)
- Row Level Security (RLS) for data access control

**Data Shared:**
- All account data
- All meal plans
- All user preferences
- AI conversation history

**Legal Considerations:**
- Supabase acts as a sub-processor
- Data stored in EU region (GDPR compliance)
- Supabase's privacy policy and terms apply

### 3.2. OpenRouter.ai (AI Service Provider)

**Service Provider:** OpenRouter Inc.  
**Location:** United States (may process data outside EU)  
**Services Used:**
- AI model access (OpenAI, Anthropic, Google, and other AI providers)
- Meal plan generation
- Conversational AI interface

**Data Shared:**
- Patient data (age, weight, height, activity level, dietary restrictions, health information)
- Meal plan generation requests
- Conversation history (prompts and responses)

**Legal Considerations:**
- OpenRouter acts as a sub-processor
- Data may be processed outside EU (requires appropriate safeguards)
- OpenRouter's privacy policy and terms apply
- Users should be informed of data transfer to third-party AI services

### 3.3. DigitalOcean (Hosting Provider)

**Service Provider:** DigitalOcean LLC  
**Location:** United States (may process data outside EU)  
**Services Used:**
- Application hosting (Docker container)
- Server infrastructure

**Data Processed:**
- Application code and runtime data
- Temporary request/response data

**Legal Considerations:**
- DigitalOcean acts as a sub-processor
- Data may be processed outside EU
- DigitalOcean's privacy policy and terms apply

### 3.4. GitHub (Code Repository)

**Service Provider:** GitHub Inc. (Microsoft)  
**Location:** United States  
**Services Used:**
- Code version control
- CI/CD pipelines

**Data Processed:**
- Source code (does not contain user data)
- Build artifacts

**Legal Considerations:**
- No user data stored in GitHub
- GitHub's privacy policy and terms apply

---

## 4. Data Storage and Retention

### 4.1. Storage Location

- **Primary Database**: Supabase (EU region)
- **Backup**: Managed by Supabase (location may vary)
- **Application Hosting**: DigitalOcean (may be outside EU)

### 4.2. Data Retention Policies

#### 4.2.1. Account Data
- **Retention Period**: Until account deletion
- **Deletion Process**: User-initiated account deletion removes all account data

#### 4.2.2. Meal Plans
- **Retention Period**: Until deleted by user or account deletion
- **User Control**: Users can delete individual meal plans at any time
- **Account Deletion**: All meal plans deleted upon account deletion

#### 4.2.3. AI Conversation History
- **Retention Period**: Permanent (even after account deletion)
- **Purpose**: Analytics and model improvement
- **User Access**: Not accessible to users
- **Legal Basis**: Legitimate interest (service improvement)

#### 4.2.4. User Preferences
- **Retention Period**: Until account deletion
- **Data**: Language preference, theme preference, terms acceptance

### 4.3. Data Deletion Process

**Account Deletion:**
1. User initiates deletion via account profile
2. All meal plans deleted
3. User preferences deleted
4. Auth user account deleted
5. **AI conversation history preserved** (for analytics)

**Individual Meal Plan Deletion:**
- User can delete individual meal plans at any time
- Deletion is permanent and immediate

---

## 5. User Responsibilities and Obligations

### 5.1. Professional Responsibilities

Dietitians using the platform are responsible for:

1. **Client Consent**: Obtaining explicit consent from clients before entering any client data
2. **GDPR Compliance**: Ensuring compliance with GDPR and Polish data protection laws
3. **Legal Basis**: Establishing legal basis for processing client health data (GDPR Article 9 - special category data)
4. **Content Verification**: Verifying all AI-generated content before using with patients
5. **Professional Liability**: Maintaining professional liability for all meal plans provided to clients
6. **Regulatory Compliance**: Complying with all applicable professional dietitian regulations
7. **Data Subject Rights**: Handling client data subject rights requests (access, rectification, erasure, etc.)

### 5.2. Platform Disclaimers

The platform:
- Does not verify dietitian credentials or professional qualifications
- Does not validate client consent
- Does not assume professional liability for meal plans
- Provides AI-generated content "as-is" without warranty
- Requires users to verify all AI-generated content

### 5.3. User Account Security

Users are responsible for:
- Maintaining account security (password)
- Not sharing account credentials
- Reporting security breaches
- The platform is not liable for breaches caused by user negligence

---

## 6. Security Measures

### 6.1. Technical Security

- **Authentication**: Supabase Auth (industry-standard password hashing)
- **Authorization**: Row Level Security (RLS) on all database tables
- **Data Encryption**: 
  - In transit: HTTPS/TLS
  - At rest: Managed by Supabase (database encryption)
- **Access Control**: Users can only access their own data
- **API Security**: JWT token-based authentication

### 6.2. Security Limitations

- **User Responsibility**: Users must maintain secure passwords
- **No Liability**: Platform not liable for breaches caused by user negligence
- **Third-Party Risks**: Security depends on third-party services (Supabase, OpenRouter, DigitalOcean)

### 6.3. Security Incident Response

- **Notification**: Users will be notified of security breaches affecting their data
- **Compliance**: Will comply with GDPR breach notification requirements (72 hours)

---

## 7. Legal Considerations

### 7.1. GDPR Compliance

**Key GDPR Requirements:**

1. **Data Controller vs. Processor**: Clear distinction (platform is processor, dietitians are controllers for client data)
2. **Legal Basis**: Users must establish legal basis for processing health data (Article 9)
3. **Data Subject Rights**: Users responsible for handling client rights requests
4. **Data Breach Notification**: Platform will notify users of breaches affecting their data
5. **Data Protection Impact Assessment (DPIA)**: May be required for health data processing

### 7.2. Health Data (Special Category Data)

**GDPR Article 9 Considerations:**

- Health data is special category data requiring explicit legal basis
- Dietitians must establish legal basis (e.g., healthcare provision, explicit consent)
- Platform processes health data only as instructed by dietitians
- Appropriate safeguards required (encryption, access controls)

### 7.3. Polish Data Protection Law

- **UODO (Urząd Ochrony Danych Osobowych)**: Polish data protection authority
- **Polish Language Support**: Terms and Privacy Policy available in Polish
- **Local Regulations**: Dietitians must comply with Polish professional regulations

### 7.4. Professional Liability

- **Platform Disclaims**: All professional liability for meal plans
- **User Liability**: Dietitians maintain full professional liability
- **AI Content**: Platform not liable for accuracy, completeness, or suitability of AI-generated content
- **Verification Required**: Users must verify all AI-generated content

### 7.5. International Data Transfers

- **OpenRouter**: Data may be transferred to US (requires appropriate safeguards)
- **DigitalOcean**: Hosting may be outside EU
- **Safeguards**: Standard Contractual Clauses (SCCs) or other appropriate safeguards may be required

---

## 8. Terms Acceptance and Modification

### 8.1. Terms Acceptance

- **Registration Requirement**: Mandatory checkbox during registration
- **Storage**: Terms acceptance stored in database (`terms_accepted`, `terms_accepted_at`)
- **User Acknowledgment**: Users acknowledge responsibility for verifying AI-generated content

### 8.2. Terms Modification

- **Right to Modify**: Platform reserves right to modify terms at any time
- **Notification**: Users will be notified via email of material changes
- **Continued Use**: Continued use constitutes acceptance of new terms
- **Termination Right**: Users can terminate account if they disagree with changes

### 8.3. Terms Display

- **Bilingual**: Terms available in English and Polish
- **Access**: Terms accessible via account profile
- **Format**: JSON-based content structure (markdown rendering)

---

## 9. User Rights

### 9.1. Account Rights

Users have the right to:
- **Access**: View their account data and meal plans
- **Rectification**: Update account information and meal plans
- **Erasure**: Delete individual meal plans or entire account
- **Data Portability**: Export meal plans to .doc files
- **Account Deletion**: Permanently delete account and associated data (except AI conversation history)

### 9.2. Limitations

- **AI Conversation History**: Users cannot access or delete AI conversation history (telemetry data)
- **Client Data Rights**: Users (dietitians) are responsible for handling client data subject rights requests

---

## 10. Liability Limitations

### 10.1. Service Disclaimers

The platform disclaims:
- All warranties, express or implied
- Liability for AI-generated content accuracy
- Professional liability for meal plans
- Liability for data breaches caused by user negligence
- Liability for misuse of the platform
- Liability for loss of data or business interruption

### 10.2. Maximum Liability

- **Current Limit**: Service fees paid (currently $0 for free service)
- **Future Consideration**: May be updated if service transitions to paid model

---

## 11. Current Terms and Privacy Policy Structure

### 11.1. Document Format

- **Format**: JSON files (`public/terms-privacy-policy.en.json`, `public/terms-privacy-policy.pl.json`)
- **Structure**: Two main sections:
  - Terms of Service
  - Privacy Policy
- **Content**: Markdown-formatted sections with headings and content

### 11.2. Terms of Service Sections (Current)

1. Service Description
2. User Responsibilities
3. Data Processing
4. AI Content Disclaimer
5. Liability Limitations
6. Terms Modifications

### 11.3. Privacy Policy Sections (Current)

1. Data Controller vs Processor
2. Data Categories
3. Third-Party Services
4. Data Retention
5. User Rights
6. Data Security

### 11.4. Legal Review Needed

The current terms and privacy policy are draft versions and require:
- Legal review by qualified attorney
- Compliance verification (GDPR, Polish law)
- Professional liability considerations
- International data transfer clauses
- Sub-processor disclosures
- Data breach notification procedures
- Terms modification procedures

---

## 12. Technical Architecture Summary

### 12.1. Technology Stack

- **Frontend**: Astro 5, React 19, TypeScript 5, Tailwind 4
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **AI**: OpenRouter.ai (multiple AI model providers)
- **Hosting**: DigitalOcean (Docker)
- **CI/CD**: GitHub Actions

### 12.2. Data Flow

1. User registration → Supabase Auth
2. Meal plan creation → Database storage → OpenRouter API → AI generation
3. Conversation history → Database (telemetry)
4. Meal plan export → .doc file generation → Download

### 12.3. Security Architecture

- **Authentication**: Supabase Auth (JWT tokens)
- **Authorization**: Row Level Security (RLS) policies
- **Data Encryption**: HTTPS/TLS in transit, database encryption at rest
- **Access Control**: User-scoped data access only

---

## 13. Key Legal Questions for Attorney Review

1. **Data Controller vs. Processor**: Is the distinction clear and legally sound?
2. **Health Data Processing**: Are appropriate safeguards and legal bases addressed?
3. **International Data Transfers**: Are appropriate safeguards in place (SCCs, etc.)?
4. **Sub-Processor Disclosures**: Are all third-party services properly disclosed?
5. **Liability Limitations**: Are disclaimers legally enforceable?
6. **Terms Modification**: Is the modification process legally compliant?
7. **GDPR Compliance**: Are all GDPR requirements addressed?
8. **Polish Law Compliance**: Are Polish data protection requirements addressed?
9. **Professional Liability**: Are professional liability disclaimers appropriate?
10. **Data Retention**: Are retention periods legally compliant?
11. **AI Conversation History**: Is permanent retention legally justified?
12. **User Rights**: Are all user rights properly addressed?

---

## 14. Recommendations for Legal Review

### 14.1. Priority Areas

1. **GDPR Compliance**: Comprehensive review of data processing, legal bases, and user rights
2. **Health Data**: Special attention to Article 9 requirements and safeguards
3. **International Transfers**: Review of data transfer mechanisms and safeguards
4. **Liability**: Review of disclaimers and limitation of liability clauses
5. **Sub-Processors**: Comprehensive disclosure of all third-party services

### 14.2. Additional Considerations

- **DPIA Requirement**: May need Data Protection Impact Assessment for health data processing
- **Professional Regulations**: Consideration of dietitian professional regulations
- **Insurance**: Consideration of professional liability insurance requirements
- **Breach Notification**: Detailed breach notification procedures
- **Terms Versioning**: Consideration of terms version tracking and user notification

---

## 15. Contact and Additional Information

**For Technical Questions:**
- Refer to `.ai/prd.md` (Product Requirements Document)
- Refer to `.ai/project-summary.md` (Technical Project Summary)
- Refer to `.ai/techstack.md` (Technology Stack Details)

**For Current Terms Content:**
- `public/terms-privacy-policy.en.json` (English)
- `public/terms-privacy-policy.pl.json` (Polish)

**For Database Schema:**
- Refer to `.ai/project-summary.md` (Database Schema section)
- Migration files in `supabase/migrations/`

---

## Document Revision History

- **2025-01-25**: Initial document creation for legal review

---

**Note:** This document is intended for legal review purposes. All legal interpretations and recommendations should be reviewed by qualified legal counsel familiar with GDPR, Polish data protection law, and professional liability considerations.

