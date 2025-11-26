# Guideline Reference Library for AI Prompt Generation

This document provides a structured, condensed reference library of clinical guidelines and calculation methodologies for use in AI prompt generation. This is a quick reference for developers maintaining the prompt system.

**Last Updated**: 2025-01-26  
**Version**: MVP

---

## 1. Clinical Guidelines Overview

### 1.1 General Nutrition Guidelines

#### EFSA (European Food Safety Authority) - Dietary Reference Values (DRVs)
**Version**: 2023 (current)
**Purpose**: General population nutrition standards
**Key References**:
- **Macro Distribution Ranges**:
  - Protein: 10-35% of total energy intake (EI)
  - Fat: 20-35% of total energy intake (EI)
  - Carbohydrates: 45-65% of total energy intake (EI)
- **Protein Requirements**: 0.8-1.0 g/kg body weight (general population)
- **Access**: https://www.efsa.europa.eu/en/topics/topic/nutrition

**Prompt Usage**: Always included in system prompts as primary reference for macro distribution ranges.

---

#### SACN (Scientific Advisory Committee on Nutrition, UK) - Carbohydrates & Health
**Version**: 2015
**Purpose**: Carbohydrate, fiber, and sugar recommendations
**Key References**:
- **Fiber**: 30g/day for adults
- **Free Sugars**: <5% of total energy intake
- **Access**: https://www.gov.uk/government/publications/sacn-carbohydrates-and-health-report

**Prompt Usage**: Included in system prompts for carbohydrate and fiber guidance.

---

### 1.2 Clinical Nutrition Guidelines

#### ESPEN (European Society for Clinical Nutrition and Metabolism)
**Version**: 2023 (current)
**Purpose**: Clinical nutrition and medical nutrition therapy (MNT)
**Key References**:
- **Clinical Nutrition**: Energy/protein prescription for adult & pediatric MNT
- **Illness Stress Factors**: Adjustments based on disease state/inflammation
- **Protein Requirements**: Condition-specific protein needs (varies by condition)
- **Access**: https://www.espen.org/guidelines-home/espen-guidelines

**Prompt Usage**: 
- Always included in system prompts for clinical context
- Applied when illness/inflammation indicators detected

---

#### NICE (UK) - Nutrition Support in Adults
**Version**: 2017 (CG32)
**Purpose**: Malnutrition assessment and nutrition support
**Key References**:
- **Malnutrition Assessment**: Practical guidance
- **Nutrition Support**: Clinical targets and interventions
- **Access**: https://www.nice.org.uk/guidance/cg32

**Prompt Usage**: Included in system prompts as reference for clinical nutrition support.

---

### 1.3 Condition-Specific Guidelines

#### KDOQI/Kidney Foundation - Nutrition in CKD
**Version**: 2020 (current)
**Purpose**: Chronic kidney disease nutrition management
**Key References**:
- **Protein Restrictions**: Varies by CKD stage (stage 3: 0.6-0.8 g/kg, stage 4-5: 0.6 g/kg)
- **Electrolyte Management**: Sodium, potassium, phosphorus restrictions
- **Energy Requirements**: Maintain adequate energy intake despite protein restrictions
- **Access**: https://www.kidney.org/professionals/guidelines

**Prompt Usage**: 
- Referenced in system prompts for condition-specific guidance
- Included in user prompt CLINICAL CONTEXT section when CKD detected
- Detection keywords: "ckd", "chronic kidney", "renal", "kidney disease", "nefropatia", "choroba nerek"

---

#### ADA/EASD - Diabetes Nutrition Therapy Consensus
**Version**: Latest consensus (ongoing updates)
**Purpose**: Diabetes nutrition management
**Key References**:
- **Carbohydrate Counting**: Primary focus for glycemic control
- **Macro Targets**: Individualized based on patient needs
- **Insulin-to-Carb Ratios**: For insulin-dependent patients
- **Glycemic Index**: Secondary consideration
- **Access**: https://diabetesjournals.org/care

**Prompt Usage**: 
- Referenced in system prompts for condition-specific guidance
- Included in user prompt CLINICAL CONTEXT section when diabetes detected
- Detection keywords: "diabetes", "diabetic", "cukrzyca", "insulin", "glucose", "glikemia"
- Primary focus: Carbohydrate counting for glycemic control

---

#### EAACI - Food Allergy Guidelines
**Version**: Latest (ongoing updates)
**Purpose**: Allergy and intolerance management in food planning
**Key References**:
- **Safe Food Selection**: Avoid allergens completely
- **Cross-Contamination Prevention**: Strict protocols for severe allergies
- **Access**: https://www.eaaci.org/guidelines

**Prompt Usage**: 
- Referenced in system prompts for condition-specific guidance
- Included in user prompt CLINICAL CONTEXT section when allergies detected
- Detection keywords: "allergy", "allergic", "intolerance", "anaphylaxis", "alergia", "nietolerancja"
- Focus: Safe food selection and cross-contamination considerations

---

## 2. Calculation Methodologies

### 2.1 Energy Requirements

#### FAO/WHO/UNU - Human Energy Requirements
**Version**: 2001/2004
**Purpose**: Standard methodology for energy requirement estimation
**Key References**:
- **BMR Calculation**: Base Metabolic Rate using predictive equations
- **PAL Factors**: Physical Activity Level multipliers
- **Access**: https://www.fao.org/publications/card/en/c/3e7f526e-2081-5ef4-965a-4fb151797f45

**Prompt Usage**: Always included in system prompts as reference for energy calculation methodologies.

---

#### BMR Predictive Equations

**Mifflin-St Jeor (Preferred for Adults)**
- **Men**: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) + 5
- **Women**: BMR = 10 × weight(kg) + 6.25 × height(cm) - 5 × age(years) - 161
- **Accuracy**: Most accurate for general adult population
- **Prompt Usage**: Referenced as preferred method for adults

**Harris-Benedict (Alternative)**
- **Men**: BMR = 88.362 + (13.397 × weight(kg)) + (4.799 × height(cm)) - (5.677 × age(years))
- **Women**: BMR = 447.593 + (9.247 × weight(kg)) + (3.098 × height(cm)) - (4.330 × age(years))
- **Prompt Usage**: Referenced as alternative method

**Schofield (FAO/WHO 1985)**
- Population-specific equations by age and gender
- **Prompt Usage**: Referenced for specific populations if needed

---

#### PAL (Physical Activity Level) Factors

**FAO/WHO Standards**:
- **Sedentary**: PAL 1.2-1.3
- **Light activity**: PAL 1.4-1.5
- **Moderate activity**: PAL 1.6-1.7
- **High activity**: PAL 1.8-2.0

**Total Energy Expenditure (TEE) Calculation**:
- TEE = BMR × PAL

**Prompt Usage**: 
- Included in system prompts as reference
- Mapped in user prompts when activity level provided
- Activity level mapping: `sedentary` → "1.2-1.3", `light` → "1.4-1.5", `moderate` → "1.6-1.7", `high` → "1.8-2.0"

---

### 2.2 Illness Stress Factors (ESPEN)

**Purpose**: Adjust energy and protein requirements for clinical conditions

**Common Stress Factors**:
- **Surgery**: 1.0-1.2× BMR (moderate stress)
- **Infection**: 1.2-1.4× BMR (moderate-high stress)
- **Trauma**: 1.3-1.5× BMR (high stress)
- **Severe Burns**: 1.5-2.0× BMR (very high stress)

**Protein Adjustments**:
- **Stress/Illness**: Increase to 1.2-2.0 g/kg (varies by condition)
- **ES PEN Guidelines**: Condition-specific protein needs

**Prompt Usage**: 
- Referenced in system prompts for illness/inflammation scenarios
- Detection keywords: "inflammation", "illness", "infection", "surgery", "wound", "zapalenie", "choroba"
- Applied when illness/inflammation indicators detected

---

## 3. Macro Distribution Standards

### 3.1 EFSA %EI Ranges

**Protein**: 10-35% of total energy intake
**Fat**: 20-35% of total energy intake
**Carbohydrates**: 45-65% of total energy intake

**Validation Rules**:
- Sum of percentages should equal 100%
- Each percentage should fall within EFSA ranges
- If validation fails: Warn in comments field only (do not auto-correct)

---

### 3.2 Macronutrient Energy Density

**Protein**: 4 kcal/gram
**Fat**: 9 kcal/gram
**Carbohydrates**: 4 kcal/gram

**Calculation Example**:
- Target: 2000 kcal, Protein 25%, Fat 30%, Carbs 45%
- Protein: 2000 × 0.25 = 500 kcal ÷ 4 = 125g
- Fat: 2000 × 0.30 = 600 kcal ÷ 9 = 67g
- Carbs: 2000 × 0.45 = 900 kcal ÷ 4 = 225g

**Prompt Usage**: Included in user prompts as reference for macro calculations.

---

## 4. Condition Detection Keywords

### 4.1 CKD/Renal Conditions

**Keywords**:
- English: "ckd", "chronic kidney", "renal", "kidney disease"
- Polish: "nefropatia", "choroba nerek"

**Trigger**: If any keyword found in `exclusions_guidelines`, set `hasCKD: true`

---

### 4.2 Diabetes

**Keywords**:
- English: "diabetes", "diabetic", "insulin", "glucose", "glikemia"
- Polish: "cukrzyca"

**Trigger**: If any keyword found in `exclusions_guidelines`, set `hasDiabetes: true`

---

### 4.3 Allergies/Intolerances

**Keywords**:
- English: "allergy", "allergic", "intolerance", "anaphylaxis"
- Polish: "alergia", "nietolerancja"

**Trigger**: If any keyword found in `exclusions_guidelines`, set `hasAllergies: true`

---

### 4.4 Illness/Inflammation

**Keywords**:
- English: "inflammation", "illness", "infection", "surgery", "wound"
- Polish: "zapalenie", "choroba"

**Trigger**: If any keyword found in `exclusions_guidelines`, set `hasIllness: true`

---

## 5. Prompt Citation Format

### 5.1 System Prompt Citations

**Format**: `Guideline Name (Abbreviation, Year): Description`

**Examples**:
- `EFSA (European Food Safety Authority, 2023): Use for macro distribution ranges`
- `ESPEN (European Society for Clinical Nutrition and Metabolism, 2023): Apply for clinical nutrition`
- `KDOQI (Kidney Foundation, 2020): Reference for CKD nutrition`

**Usage**: Always include version year for traceability.

---

### 5.2 User Prompt Clinical Context

**Format**: 
```
CLINICAL CONTEXT:
[Condition] indicators detected - apply [Guideline] for [specific guidance].
```

**Examples**:
- `CKD indicators detected - apply KDOQI guidelines for protein restrictions and electrolyte management.`
- `Diabetes indicators detected - apply ADA/EASD consensus for carbohydrate counting and glycemic control.`
- `Allergies/intolerances detected - apply EAACI guidelines for safe food selection.`

**Usage**: Only include when conditions detected.

---

## 6. Comments Field Usage

### 6.1 When to Include in Comments

**Include**:
- Guideline citations when conditions present
- Warnings if targets significantly deviate from guidelines (>10% outside EFSA ranges)
- Clinical reasoning when modifications conflict with standard practice
- Significant discrepancies in target_kcal verification (>15% difference)

**Do NOT Include**:
- Routine guideline application (applied implicitly)
- Minor variations within guideline ranges
- Standard meal planning explanations

---

### 6.2 Comments Format

**Citation Format**: `"Guidelines applied: [Guideline Name] for [condition/context]."`

**Warning Format**: `"Note: [Target] falls outside [Guideline] range ([Range]). Consider [Suggestion]."`

**Examples**:
- `"Guidelines applied: KDOQI (2020) for CKD protein restrictions."`
- `"Note: Protein target (50% EI) falls outside EFSA range (10-35% EI). Consider reviewing target."`

---

## 7. Multi-Day Plan Considerations

### 7.1 Guideline Application

**Approach**: Allow day-to-day variation within guideline ranges while maintaining averages within targets.

**Example**:
- Day 1: Protein 30%, Fat 25%, Carbs 45%
- Day 2: Protein 25%, Fat 30%, Carbs 45%
- Day 3: Protein 28%, Fat 28%, Carbs 44%
- Average: Protein 27.7%, Fat 27.7%, Carbs 44.6% (within EFSA ranges)

**Prompt Usage**: Emphasize day-to-day variation in multi-day system prompts.

---

### 7.2 Meal Variety

**Reference**: Food-Based Dietary Guidelines (FBDGs)
**Purpose**: Ensure dietary variety across days
**Usage**: Referenced in multi-day system prompts for variety guidance

---

## 8. Prompt Maintenance Checklist

### 8.1 Annual Review

- [ ] Check guideline versions for updates
- [ ] Review new guideline publications
- [ ] Update version years if needed
- [ ] Verify links still accessible
- [ ] Review condition detection keywords (add new ones if needed)

### 8.2 When Guidelines Updated

1. **Identify Update**: New guideline version published
2. **Review Changes**: Check for significant changes to recommendations
3. **Update Citations**: Change version year in prompts
4. **Update Keywords**: Add new detection keywords if needed
5. **Test**: Verify prompts still function correctly
6. **Deploy**: Update production prompts

### 8.3 Token Budget Management

- **Target**: <2000 tokens per prompt
- **Current**: ~1600-1700 tokens (enhanced prompts)
- **Buffer**: ~300-400 tokens for updates
- **Monitor**: Track token usage with each update

---

## 9. Quick Reference Tables

### 9.1 PAL Factor Quick Reference

| Activity Level | PAL Range |
|---------------|-----------|
| Sedentary     | 1.2-1.3   |
| Light         | 1.4-1.5   |
| Moderate      | 1.6-1.7   |
| High          | 1.8-2.0   |

---

### 9.2 EFSA Macro Ranges Quick Reference

| Macronutrient | %EI Range |
|--------------|-----------|
| Protein      | 10-35%    |
| Fat          | 20-35%    |
| Carbohydrates| 45-65%    |

---

### 9.3 Condition Detection Quick Reference

| Condition | Keywords (EN) | Keywords (PL) | Guideline |
|-----------|---------------|---------------|-----------|
| CKD | ckd, chronic kidney, renal | nefropatia, choroba nerek | KDOQI |
| Diabetes | diabetes, diabetic, insulin | cukrzyca | ADA/EASD |
| Allergies | allergy, allergic, intolerance | alergia, nietolerancja | EAACI |
| Illness | inflammation, illness, infection | zapalenie, choroba | ESPEN |

---

## 10. Links Reference

### 10.1 Primary Guidelines

- **EFSA DRVs**: https://www.efsa.europa.eu/en/topics/topic/nutrition
- **ESPEN Guidelines**: https://www.espen.org/guidelines-home/espen-guidelines
- **NICE Guidance**: https://www.nice.org.uk/guidance/cg32
- **KDOQI Guidelines**: https://www.kidney.org/professionals/guidelines
- **EAACI Guidelines**: https://www.eaaci.org/guidelines
- **Diabetes Care**: https://diabetesjournals.org/care

### 10.2 Calculation Methodologies

- **FAO/WHO Energy Requirements**: https://www.fao.org/publications/card/en/c/3e7f526e-2081-5ef4-965a-4fb151797f45
- **SACN Carbohydrates & Health**: https://www.gov.uk/government/publications/sacn-carbohydrates-and-health-report
- **FAO PAL Tables**: https://www.fao.org/3/y5686e/y5686e07.htm

### 10.3 APIs (Future Use)

- **Europe PMC API**: https://europepmc.org/RestfulWebService
- **NCBI PubMed API**: https://www.ncbi.nlm.nih.gov/books/NBK25501/
- **NICE API**: https://developer.nice.org.uk/

---

**Document Purpose**: Quick reference for developers maintaining the AI prompt system
**Maintenance**: Review annually or when major guideline updates occur
**Owner**: Development team

---

**Last Updated**: 2025-01-26
**Status**: Ready for use in prompt generation

