# Dietitian Guidelines Research - Executive Summary

## Overview

This document provides an executive summary of comprehensive research conducted on dietitian guidelines, calculation methods, APIs, and professional tools. The research covers European and global authoritative resources for clinical nutrition practice, meal planning, and evidence-based dietetic care.

**Research Date**: January 2025  
**Source Document**: `.ai/dietitian-guidelines.md`  
**Research Scope**: Clinical guidelines, calculation methodologies, APIs, and professional tools

---

## Quick Reference Table

| Category | Resource | Status | Access | Key Feature |
|----------|----------|--------|--------|-------------|
| **Clinical Guidelines** | EFSA DRVs | ✅ Active | Web, PDF | %EI ranges (Protein: 10-35%, Fat: 20-35%, Carbs: 45-65%) |
| **Clinical Guidelines** | ESPEN | ✅ Active | Web, PDF | Clinical nutrition, illness stress factors |
| **Clinical Guidelines** | NICE CG32 | ✅ Active | Web, PDF, API | Malnutrition assessment, nutrition support |
| **Clinical Guidelines** | KDOQI | ✅ Active | Web, PDF | CKD nutrition (2020 update) |
| **Clinical Guidelines** | EAACI | ✅ Active | Web, PDF | Food allergy management |
| **Clinical Guidelines** | ADA/EASD | ✅ Active | Web, PDF | Diabetes nutrition therapy |
| **Calculation Methods** | FAO/WHO/UNU | ✅ Active | Web, PDF | Energy requirements, PAL multipliers |
| **Calculation Methods** | Mifflin-St Jeor | ✅ Validated | Formula | **Preferred BMR equation for adults** |
| **Calculation Methods** | Harris-Benedict | ✅ Validated | Formula | General adult population |
| **Calculation Methods** | Schofield | ✅ Validated | Formula | All ages, international |
| **Calculation Methods** | ESPEN Stress Factors | ✅ Active | Web, PDF | Illness adjustment factors |
| **Calculation Methods** | SACN 2015 | ✅ Active | Web, PDF | Fiber (30g/day), free sugars (<5% EI) |
| **APIs** | Europe PMC | ✅ Active | REST API | 10 req/sec, JSON/XML, no auth required |
| **APIs** | NCBI PubMed | ✅ Active | E-utilities | 3 req/sec (public), 10 req/sec (with key) |
| **APIs** | NICE API | ✅ Active | REST API | API key required, rate limits vary |
| **APIs** | UK Gov | ⚠️ Limited | Web, RSS | Primarily web-based |
| **Tools** | ESPEN Templates | ✅ Active | Web, PDF | Clinical nutrition templates |
| **Tools** | NICE Examples | ✅ Active | Web, PDF, API | Worked calculation examples |
| **Tools** | FAO/WHO Tables | ✅ Active | Web, PDF | PAL multiplier tables |
| **Tools** | FBDGs Index | ✅ Active | Web, PDF | Cultural food guidelines |

---

## Key Findings by Category

### 1. Clinical Guidelines & Frameworks

**Status**: ✅ All resources active and accessible

**Key Resources**:
- **EFSA**: Authoritative EU reference for %EI ranges
- **ESPEN**: Clinical nutrition guidelines with illness stress factors
- **NICE CG32**: UK nutrition support guidance (with API access)
- **KDOQI**: CKD nutrition guidelines (2020 update)
- **EAACI**: Food allergy management
- **ADA/EASD**: Diabetes nutrition therapy consensus

**Key Recommendations**:
- **Macro Distribution**: EFSA ranges (Protein: 10-35%, Fat: 20-35%, Carbs: 45-65%)
- **Protein Requirements**: 0.8-2.0 g/kg/day (varies by condition)
- **Condition-Specific**: Each major condition has specific guidelines

**Access Methods**: Primarily web and PDF; NICE offers API access

---

### 2. Calculation Methods

**Status**: ✅ All methodologies validated and accessible

**BMR Equations**:
- **Mifflin-St Jeor**: **Preferred for adults** (most accurate)
- **Harris-Benedict**: Good for general adult population
- **Schofield**: Best for age-specific populations

**Energy Calculation Formula**:
```
TEE = BMR × PAL × Illness Stress Factor
```

**Key Values**:
- **PAL Multipliers**: 1.2 (sedentary) to 2.4 (extremely active)
- **Illness Stress Factors**: 1.0-2.2 (depending on condition)
- **Protein Requirements**: 0.8-2.0 g/kg/day (condition-dependent)
- **Fiber**: 30 g/day minimum (SACN)
- **Free Sugars**: <5% of total energy (SACN)

**Access Methods**: Formulas available in research documents; FAO/WHO report for detailed tables

---

### 3. APIs and Programmatic Access

**Status**: ✅ Three major APIs available; one limited

**Available APIs**:
1. **Europe PMC**: RESTful API, 10 req/sec, no auth required (recommended)
2. **NCBI PubMed**: E-utilities, 3 req/sec (public), 10 req/sec (with API key)
3. **NICE API**: RESTful API, API key required, rate limits vary
4. **UK Gov**: Limited API access, primarily web-based

**Key Features**:
- JSON and XML response formats
- Advanced search capabilities
- Batch operations (PubMed)
- Comprehensive documentation

**Best Practices**:
- Implement rate limiting and caching
- Register for API keys where available
- Use history servers for large queries (PubMed)

---

### 4. Professional Tools & Templates

**Status**: ✅ All resources active and accessible

**Available Tools**:
- **ESPEN Templates**: Clinical nutrition documentation templates
- **NICE Examples**: Worked calculation examples
- **FAO/WHO Tables**: Standardized PAL multiplier tables
- **FBDGs Index**: Cultural food-based dietary guidelines

**Key Features**:
- 7-day meal plan templates
- Calculation workflows
- Cultural adaptations
- Evidence-based examples

**Access Methods**: Web and PDF downloads; some via API (NICE)

---

## Critical Formulas Quick Reference

### BMR Calculation (Mifflin-St Jeor - Preferred)

**Men**:
```
BMR (kcal/day) = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
```

**Women**:
```
BMR (kcal/day) = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
```

### Total Energy Expenditure

```
TEE = BMR × PAL × Illness Stress Factor
```

### Macro Distribution (%EI Method)

**Protein (g/day)**:
```
Protein = (Total Energy (kcal) × Protein %EI) / 4
```

**Fat (g/day)**:
```
Fat = (Total Energy (kcal) × Fat %EI) / 9
```

**Carbohydrates (g/day)**:
```
Carbohydrates = (Total Energy (kcal) × Carbohydrate %EI) / 4
```

### PAL Multipliers

| Activity Level | PAL Range | Typical |
|----------------|-----------|---------|
| Sedentary | 1.2-1.3 | 1.25 |
| Light Active | 1.4-1.5 | 1.45 |
| Moderate Active | 1.6-1.7 | 1.65 |
| Very Active | 1.8-2.0 | 1.9 |
| Extremely Active | 2.0-2.4 | 2.2 |

### Protein Requirements

| Condition | Protein (g/kg/day) |
|----------|-------------------|
| Healthy adults | 0.8-1.0 |
| Clinical conditions | 1.2-1.5 |
| Severe stress/burns | 1.5-2.0 |
| CKD (non-dialysis) | 0.55-0.8 |
| Dialysis | 1.0-1.3 |

---

## API Quick Reference

### Europe PMC API

**Base URL**: `https://www.ebi.ac.uk/europepmc/webservices/rest`

**Search Endpoint**:
```
GET /search?query={query}&format=json&pageSize={size}
```

**Rate Limit**: 10 requests/second  
**Authentication**: Not required (recommended for production)

### NCBI PubMed E-utilities

**Base URL**: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils`

**Search Endpoint**:
```
GET /esearch.fcgi?db=pubmed&term={query}&retmode=json
```

**Rate Limit**: 3 req/sec (public), 10 req/sec (with API key)  
**Authentication**: Optional (API key recommended)

### NICE API

**Base URL**: `https://api.nice.org.uk`

**Search Endpoint**:
```
GET /services/search?q={query}
```

**Rate Limit**: Varies by subscription  
**Authentication**: Required (API key)

---

## Resource Access Summary

### ✅ Fully Accessible Resources

- **EFSA DRVs**: Web, PDF
- **ESPEN Guidelines**: Web, PDF
- **NICE CG32**: Web, PDF, **API**
- **KDOQI**: Web, PDF
- **EAACI**: Web, PDF
- **ADA/EASD**: Web, PDF
- **FAO/WHO/UNU Report**: Web, PDF
- **SACN Report**: Web, PDF
- **ESPEN Templates**: Web, PDF
- **NICE Examples**: Web, PDF, **API**
- **FAO/WHO Tables**: Web, PDF
- **FBDGs Index**: Web, PDF
- **Europe PMC API**: ✅ REST API
- **PubMed E-utilities**: ✅ REST API

### ⚠️ Limited Access Resources

- **UK Gov Publications**: Primarily web-based, limited API

---

## Key Recommendations

### For Clinical Practice

1. **Use EFSA %EI ranges** for macro distribution (Protein: 10-35%, Fat: 20-35%, Carbs: 45-65%)
2. **Use Mifflin-St Jeor equation** for BMR calculation in adults
3. **Apply ESPEN illness stress factors** for clinical conditions
4. **Reference condition-specific guidelines** (KDOQI for CKD, ADA/EASD for diabetes, EAACI for allergies)
5. **Follow SACN recommendations** for fiber (30g/day) and free sugars (<5% EI)

### For Meal Planning

1. **Use FBDGs** to translate macro targets into culturally appropriate meal plans
2. **Apply ESPEN/NICE templates** for structured 7-day meal planning
3. **Reference FAO/WHO PAL tables** for standardized energy calculations
4. **Ensure variety** using FBDG food group recommendations

### For Programmatic Access

1. **Use Europe PMC API** for European publications (no auth required, 10 req/sec)
2. **Use PubMed E-utilities** for comprehensive biomedical search (register for API key)
3. **Use NICE API** for UK guideline access (requires registration)
4. **Implement rate limiting and caching** for all API usage

---

## Document Structure

This research is organized into the following documents:

1. **00-research-summary.md** (this document): Executive summary and quick reference
2. **01-clinical-guidelines.md**: Comprehensive clinical guidelines research
3. **02-calculation-methods.md**: BMR equations, PAL multipliers, formulas
4. **03-apis-programmatic-access.md**: API documentation with examples
5. **04-tools-templates.md**: Professional tools and templates

---

## Verification Status

✅ **All Resources Verified**:
- URLs checked and accessible
- Formulas validated against authoritative sources
- API endpoints tested and documented
- Access methods confirmed
- Rate limits verified from official documentation

---

## Next Steps

Based on this research, the following resources are ready for use:

1. **Clinical Guidelines**: All major guidelines accessible and documented
2. **Calculation Methods**: Formulas ready for implementation
3. **APIs**: Three major APIs available with documentation
4. **Tools & Templates**: Templates and examples available for download

**Recommendation**: Use this research as a reference for evidence-based dietetic practice, meal planning, and programmatic access to nutrition resources.

---

## Citations

All resources are properly cited in their respective research documents:
- See `01-clinical-guidelines.md` for clinical guideline citations
- See `02-calculation-methods.md` for calculation method citations
- See `03-apis-programmatic-access.md` for API documentation citations
- See `04-tools-templates.md` for tools and template citations

---

**Research Completed**: January 2025  
**Last Verified**: January 2025  
**Status**: ✅ Complete and verified

