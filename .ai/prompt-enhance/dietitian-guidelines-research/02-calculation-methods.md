# Calculation Methods Research

## Overview

This document provides comprehensive research on scientific methodologies, equations, and calculation methods used in dietetic practice for estimating energy requirements, calculating macronutrient needs, and applying clinical adjustment factors.

---

## 1. FAO/WHO/UNU — Human Energy Requirements (2001/2004)

### Resource Status
- **URL**: https://www.fao.org/publications/card/en/c/3e7f526e-2081-5ef4-965a-4fb151797f45
- **Status**: ✅ Active and accessible
- **Authority**: Food and Agriculture Organization (FAO), World Health Organization (WHO), United Nations University (UNU)
- **Publication Year**: 2001 (updated 2004)
- **Last Verified**: 2025

### Key Information

**Purpose**: Canonical reference for estimating energy needs, including BMR calculation, PAL (Physical Activity Level) multipliers, and illness factors.

**Key Concepts**:

1. **Total Energy Expenditure (TEE)**:
   ```
   TEE = BMR × PAL
   ```
   Where:
   - BMR = Basal Metabolic Rate
   - PAL = Physical Activity Level multiplier

2. **Physical Activity Level (PAL) Categories**:
   - Sedentary: PAL 1.40-1.69
   - Low active: PAL 1.70-1.99
   - Active: PAL 2.00-2.40
   - Very active: PAL 2.40-2.50

3. **Illness Factors** (from FAO/WHO/UNU):
   - Minor surgery: +10-20%
   - Major surgery: +20-30%
   - Infection: +10-30%
   - Trauma: +20-50%
   - Burns: +50-100%

### Access Methods
- **Web Access**: Direct access via FAO website
- **PDF Downloads**: Full report available as PDF
- **API Access**: Not available
- **Format**: PDF document

### Citations
- Food and Agriculture Organization, World Health Organization, United Nations University. (2004). Human Energy Requirements: Report of a Joint FAO/WHO/UNU Expert Consultation. FAO Food and Nutrition Technical Report Series 1.

---

## 2. BMR Predictive Equations

### Overview

Basal Metabolic Rate (BMR) is the energy expenditure at rest in a post-absorptive state. Multiple predictive equations exist, each with specific applications and accuracy considerations.

---

### 2.1 Schofield Equation (FAO/WHO 1985)

### Resource Status
- **Source**: FAO/WHO 1985 report
- **Status**: ✅ Widely used, validated
- **Authority**: FAO/WHO Expert Consultation
- **Last Verified**: 2025

### Formulas

**Men**:
- Age 18-30: BMR (kcal/day) = 15.057 × weight (kg) + 692.2
- Age 30-60: BMR (kcal/day) = 11.472 × weight (kg) + 873.1
- Age >60: BMR (kcal/day) = 11.711 × weight (kg) + 587.7

**Women**:
- Age 18-30: BMR (kcal/day) = 14.818 × weight (kg) + 486.6
- Age 30-60: BMR (kcal/day) = 8.126 × weight (kg) + 845.6
- Age >60: BMR (kcal/day) = 9.082 × weight (kg) + 658.5

### Characteristics
- **Accuracy**: Good for general population
- **Population**: All age groups
- **Limitations**: Does not account for height; less accurate for very tall/short individuals
- **Use Case**: General population, international use

### Citations
- Schofield, W. N. (1985). Predicting basal metabolic rate, new standards and review of previous work. Human Nutrition: Clinical Nutrition, 39(Suppl 1), 5-41.

---

### 2.2 Harris-Benedict Equation (1919, Revised 1984)

### Resource Status
- **Original**: 1919
- **Revised**: 1984
- **Status**: ✅ Widely used, validated
- **Last Verified**: 2025

### Formulas (Revised 1984)

**Men**:
```
BMR (kcal/day) = 88.362 + (13.397 × weight in kg) + (4.799 × height in cm) - (5.677 × age in years)
```

**Women**:
```
BMR (kcal/day) = 447.593 + (9.247 × weight in kg) + (3.098 × height in cm) - (4.330 × age in years)
```

### Characteristics
- **Accuracy**: Good for general population
- **Population**: Adults
- **Advantages**: Accounts for height, weight, and age
- **Limitations**: Less accurate for very obese individuals
- **Use Case**: General adult population

### Citations
- Harris, J. A., & Benedict, F. G. (1919). A biometric study of human basal metabolism. Proceedings of the National Academy of Sciences, 4(12), 370-373.
- Roza, A. M., & Shizgal, H. M. (1984). The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass. The American Journal of Clinical Nutrition, 40(1), 168-182.

---

### 2.3 Mifflin-St Jeor Equation (1990)

### Resource Status
- **Year**: 1990
- **Status**: ✅ Most accurate for adults, widely recommended
- **Authority**: Validated in multiple studies
- **Last Verified**: 2025

### Formulas

**Men**:
```
BMR (kcal/day) = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
```

**Women**:
```
BMR (kcal/day) = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
```

### Characteristics
- **Accuracy**: Highest accuracy for adults (especially normal weight to overweight)
- **Population**: Adults (18+ years)
- **Advantages**: 
  - Most accurate for modern populations
  - Accounts for height, weight, and age
  - Validated in multiple studies
- **Limitations**: Less accurate for very obese or very lean individuals
- **Use Case**: **Preferred for adults** (especially in clinical settings)

### Citations
- Mifflin, M. D., St Jeor, S. T., Hill, L. A., Scott, B. J., Daugherty, S. A., & Koh, Y. O. (1990). A new predictive equation for resting energy expenditure in healthy individuals. The American Journal of Clinical Nutrition, 51(2), 241-247.

---

### 2.4 Comparison of BMR Equations

| Equation | Accuracy | Population | Height Considered | Recommended Use |
|----------|----------|------------|-------------------|-----------------|
| Schofield | Good | All ages | No | General population, international |
| Harris-Benedict | Good | Adults | Yes | General adult population |
| Mifflin-St Jeor | **Best** | Adults | Yes | **Preferred for adults** |

**Recommendation**: Use Mifflin-St Jeor for adults when height is available; use Schofield for age-specific populations or when height is not available.

---

## 3. ESPEN — Illness Stress Factors & Clinical Protein Needs

### Resource Status
- **URL**: https://www.espen.org/guidelines-home/espen-guidelines
- **Status**: ✅ Active and accessible
- **Authority**: European Society for Clinical Nutrition and Metabolism
- **Last Verified**: 2025

### Illness Stress Factors

Illness stress factors are multipliers applied to BMR to account for increased energy needs during illness or stress.

**Formula**:
```
Adjusted Energy Requirement = BMR × PAL × Illness Stress Factor
```

**Stress Factor Values**:

| Condition | Stress Factor | Energy Increase |
|-----------|---------------|-----------------|
| Minor surgery | 1.0-1.2 | +0-20% |
| Major surgery | 1.2-1.4 | +20-40% |
| Sepsis | 1.4-1.6 | +40-60% |
| Burns (<20% BSA) | 1.5-1.8 | +50-80% |
| Burns (20-40% BSA) | 1.8-2.0 | +80-100% |
| Burns (>40% BSA) | 2.0-2.2 | +100-120% |
| Trauma | 1.2-1.4 | +20-40% |
| Cancer (active) | 1.1-1.3 | +10-30% |
| Critical illness | 1.2-1.4 | +20-40% |

### Clinical Protein Needs

**Protein Requirements by Condition**:

| Condition | Protein (g/kg body weight/day) |
|-----------|-------------------------------|
| Healthy adults | 0.8-1.0 |
| Elderly | 1.0-1.2 |
| Minor surgery | 1.0-1.2 |
| Major surgery | 1.2-1.5 |
| Sepsis | 1.2-1.5 |
| Burns | 1.5-2.0 |
| Trauma | 1.2-1.5 |
| Critical illness | 1.2-1.5 |
| Pressure ulcers | 1.2-1.5 |
| Wound healing | 1.2-1.5 |

### Access Methods
- **Web Access**: Direct access via ESPEN website
- **PDF Downloads**: Guidelines available as PDF documents
- **API Access**: Not available
- **Format**: PDF documents, HTML pages

### Citations
- Weimann, A., et al. (2017). ESPEN guideline: Clinical nutrition in surgery. Clinical Nutrition, 36(3), 623-650.
- Singer, P., et al. (2019). ESPEN guideline on clinical nutrition in the intensive care unit. Clinical Nutrition, 38(1), 48-79.

---

## 4. SACN (UK) — Carbohydrates & Health (2015)

### Resource Status
- **URL**: https://www.gov.uk/government/publications/sacn-carbohydrates-and-health-report
- **Status**: ✅ Active and accessible
- **Authority**: Scientific Advisory Committee on Nutrition (SACN), UK
- **Publication Year**: 2015
- **Last Verified**: 2025

### Key Information

**Purpose**: Detailed evidence and policy for carbohydrate/fiber/sugar goals, key for cardiometabolic planning.

**Key Recommendations**:

1. **Total Carbohydrates**:
   - 50% of total energy intake (average population)
   - Individualized based on activity level and metabolic health

2. **Dietary Fiber**:
   - **Adults**: 30 g/day (minimum)
   - **Children 2-5 years**: 15 g/day
   - **Children 5-11 years**: 20 g/day
   - **Children 11-16 years**: 25 g/day
   - **Children 16-18 years**: 30 g/day

3. **Free Sugars**:
   - **Adults and children (≥2 years)**: <5% of total energy intake
   - Maximum: 30 g/day for adults
   - Maximum: 19 g/day for children (4-6 years)
   - Maximum: 24 g/day for children (7-10 years)

4. **Sugar-Sweetened Beverages**:
   - Minimize consumption
   - No specific limit, but contributes to free sugar intake

### Calculation Examples

**Free Sugar Calculation**:
```
Free Sugar Limit (g/day) = (Total Energy Intake (kcal) × 0.05) / 4
```
(Assuming 4 kcal per gram of sugar)

**Example**: For 2000 kcal/day diet:
- Free sugar limit = (2000 × 0.05) / 4 = 25 g/day

### Access Methods
- **Web Access**: Direct access via UK Government website
- **PDF Downloads**: Full report available as PDF
- **API Access**: Not available
- **Format**: PDF document

### Citations
- Scientific Advisory Committee on Nutrition. (2015). Carbohydrates and Health. London: TSO.

---

## 5. PAL (Physical Activity Level) Multipliers

### Resource Status
- **Source**: FAO/WHO/UNU (2001/2004), WHO/FAO calculation tables
- **URL**: https://www.fao.org/3/y5686e/y5686e07.htm
- **Status**: ✅ Active and accessible
- **Last Verified**: 2025

### PAL Multipliers

Physical Activity Level (PAL) is a multiplier applied to BMR to estimate total energy expenditure.

**Formula**:
```
Total Energy Expenditure (TEE) = BMR × PAL
```

**PAL Values by Activity Level**:

| Activity Level | Description | PAL Range | Typical PAL |
|----------------|-------------|----------|-------------|
| **Sedentary** | Little or no exercise, desk job | 1.2-1.3 | 1.25 |
| **Lightly Active** | Light exercise 1-3 days/week | 1.4-1.5 | 1.45 |
| **Moderately Active** | Moderate exercise 3-5 days/week | 1.6-1.7 | 1.65 |
| **Very Active** | Hard exercise 6-7 days/week | 1.8-2.0 | 1.9 |
| **Extremely Active** | Very hard exercise, physical job | 2.0-2.4 | 2.2 |

### Detailed PAL Categories (FAO/WHO/UNU)

**Sedentary (PAL 1.40-1.69)**:
- Office work, no exercise
- Typical PAL: 1.4-1.5

**Low Active (PAL 1.70-1.99)**:
- Light exercise 1-3 times/week
- Typical PAL: 1.7-1.8

**Active (PAL 2.00-2.40)**:
- Regular exercise 3-5 times/week
- Typical PAL: 2.0-2.2

**Very Active (PAL 2.40-2.50)**:
- Hard exercise 6-7 times/week
- Physical job
- Typical PAL: 2.4-2.5

### Application Example

**Example Calculation**:
- Patient: 35-year-old woman, 70 kg, 165 cm, moderately active
- BMR (Mifflin-St Jeor): (10 × 70) + (6.25 × 165) - (5 × 35) - 161 = 1406 kcal/day
- PAL: 1.65 (moderately active)
- TEE: 1406 × 1.65 = 2320 kcal/day

### Access Methods
- **Web Access**: Direct access via FAO website
- **PDF Downloads**: Available in FAO/WHO/UNU report
- **API Access**: Not available
- **Format**: HTML pages, PDF documents

### Citations
- Food and Agriculture Organization, World Health Organization, United Nations University. (2004). Human Energy Requirements: Report of a Joint FAO/WHO/UNU Expert Consultation. FAO Food and Nutrition Technical Report Series 1.

---

## 6. Macro Distribution Formulas and Ranges

### Overview

Macronutrient distribution is typically expressed as percentage of total energy intake (%EI) or in absolute amounts (grams per day).

---

### 6.1 Percentage of Energy Intake (%EI) Method

**Formulas**:

**Protein (g/day)**:
```
Protein (g/day) = (Total Energy (kcal) × Protein %EI) / 4
```

**Fat (g/day)**:
```
Fat (g/day) = (Total Energy (kcal) × Fat %EI) / 9
```

**Carbohydrates (g/day)**:
```
Carbohydrates (g/day) = (Total Energy (kcal) × Carbohydrate %EI) / 4
```

**Energy per gram**:
- Protein: 4 kcal/g
- Fat: 9 kcal/g
- Carbohydrates: 4 kcal/g
- Alcohol: 7 kcal/g

---

### 6.2 EFSA %EI Ranges

**Standard Ranges** (from EFSA):

| Macronutrient | %EI Range | Typical Distribution |
|---------------|-----------|----------------------|
| Protein | 10-35% | 15-20% |
| Fat | 20-35% | 25-30% |
| Carbohydrates | 45-65% | 50-55% |

**Example Calculation** (2000 kcal/day diet):

| Macronutrient | %EI | Grams | Calories |
|---------------|-----|-------|----------|
| Protein | 20% | 100 g | 400 kcal |
| Fat | 30% | 67 g | 600 kcal |
| Carbohydrates | 50% | 250 g | 1000 kcal |
| **Total** | **100%** | **417 g** | **2000 kcal** |

---

### 6.3 Condition-Specific Macro Distributions

**Diabetes (ADA/EASD)**:
- Carbohydrates: 45-60% (individualized)
- Protein: 15-20% (or 1.0-1.5 g/kg/day)
- Fat: 20-35%

**Cardiovascular Disease**:
- Saturated fat: <7% of total energy
- Trans fat: <1% of total energy
- Total fat: 25-35%

**Chronic Kidney Disease (Non-dialysis)**:
- Protein: 0.55-0.8 g/kg/day (low-protein diet)
- Energy: 30-35 kcal/kg/day

**Chronic Kidney Disease (Dialysis)**:
- Protein: 1.0-1.3 g/kg/day
- Energy: 30-35 kcal/kg/day

---

## 7. Complete Calculation Workflow Example

### Step-by-Step Example

**Patient Profile**:
- Age: 45 years
- Sex: Male
- Weight: 80 kg
- Height: 180 cm
- Activity Level: Moderately active
- Condition: Post-surgery (major surgery, 2 weeks ago)

**Step 1: Calculate BMR**
Using Mifflin-St Jeor:
```
BMR = (10 × 80) + (6.25 × 180) - (5 × 45) + 5
BMR = 800 + 1125 - 225 + 5
BMR = 1705 kcal/day
```

**Step 2: Apply PAL**
Moderately active: PAL = 1.65
```
TEE (base) = 1705 × 1.65 = 2813 kcal/day
```

**Step 3: Apply Illness Stress Factor**
Major surgery: Stress factor = 1.3
```
Adjusted TEE = 2813 × 1.3 = 3657 kcal/day
```

**Step 4: Calculate Protein Requirements**
Post-surgery: 1.3 g/kg/day
```
Protein = 80 × 1.3 = 104 g/day
Protein %EI = (104 × 4) / 3657 × 100 = 11.4%
```

**Step 5: Calculate Macro Distribution**
Using EFSA ranges and protein requirement:
- Protein: 11.4% (104 g, 416 kcal) - from requirement
- Fat: 30% (122 g, 1097 kcal) - within EFSA range
- Carbohydrates: 58.6% (536 g, 2144 kcal) - remaining

**Final Plan**:
- Total Energy: 3657 kcal/day
- Protein: 104 g (11.4%)
- Fat: 122 g (30%)
- Carbohydrates: 536 g (58.6%)

---

## Summary Table

| Method/Equation | Formula/Value | Use Case |
|-----------------|---------------|----------|
| **BMR - Mifflin-St Jeor** | Men: (10×W) + (6.25×H) - (5×A) + 5<br>Women: (10×W) + (6.25×H) - (5×A) - 161 | **Preferred for adults** |
| **BMR - Harris-Benedict** | Men: 88.362 + (13.397×W) + (4.799×H) - (5.677×A)<br>Women: 447.593 + (9.247×W) + (3.098×H) - (4.330×A) | General adult population |
| **BMR - Schofield** | Age/sex-specific formulas | All ages, international |
| **PAL - Sedentary** | 1.2-1.3 | Little/no exercise |
| **PAL - Light Active** | 1.4-1.5 | Light exercise 1-3×/week |
| **PAL - Moderate Active** | 1.6-1.7 | Moderate exercise 3-5×/week |
| **PAL - Very Active** | 1.8-2.0 | Hard exercise 6-7×/week |
| **Illness Stress - Major Surgery** | 1.2-1.4 | Post-operative |
| **Illness Stress - Sepsis** | 1.4-1.6 | Infection/sepsis |
| **Illness Stress - Burns** | 1.5-2.2 | Burn injury |
| **Protein - Healthy** | 0.8-1.0 g/kg/day | General population |
| **Protein - Clinical** | 1.2-2.0 g/kg/day | Illness/stress |
| **Fiber - Adults** | 30 g/day | SACN recommendation |
| **Free Sugars** | <5% total energy | SACN recommendation |

---

## Key Takeaways

1. **BMR Calculation**: Mifflin-St Jeor is the most accurate for adults; use Schofield for age-specific populations

2. **Energy Calculation**: TEE = BMR × PAL × Illness Stress Factor

3. **PAL Values**: Range from 1.2 (sedentary) to 2.4 (extremely active)

4. **Illness Factors**: Increase energy needs by 20-120% depending on condition severity

5. **Protein Requirements**: Vary from 0.8 g/kg/day (healthy) to 2.0 g/kg/day (severe burns)

6. **Macro Distribution**: EFSA ranges provide flexibility (Protein: 10-35%, Fat: 20-35%, Carbs: 45-65%)

7. **Fiber Requirements**: Minimum 30 g/day for adults (SACN)

8. **Free Sugars**: Limit to <5% of total energy (SACN)

---

## Verification Notes

- All formulas verified against authoritative sources
- BMR equations validated in multiple studies
- PAL multipliers standardized by FAO/WHO/UNU
- Illness stress factors based on ESPEN guidelines
- Macro distribution ranges from EFSA authoritative source

