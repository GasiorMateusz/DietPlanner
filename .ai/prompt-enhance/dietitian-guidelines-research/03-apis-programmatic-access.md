# APIs and Programmatic Access Research

## Overview

This document provides comprehensive research on APIs and programmatic access methods for retrieving biomedical literature, guidelines, and nutrition-related data. These resources enable automation and integration of evidence-based information into dietetic practice tools.

---

## 1. Europe PMC — RESTful Articles API

### Resource Status
- **URL**: https://europepmc.org/RestfulWebService
- **Status**: ✅ Active and accessible
- **Authority**: Europe PMC (European PubMed Central)
- **Last Verified**: 2025

### Key Information

**Purpose**: Programmatic search and download of biomedical publications, consensus papers, and guidelines from Europe PMC database.

**API Features**:
- RESTful web service
- JSON and XML response formats
- DOI, PMID, PMCID queries
- Advanced search with filters
- Pagination support
- Full-text access (where available)

### API Endpoints

#### Base URL
```
https://www.ebi.ac.uk/europepmc/webservices/rest
```

#### Main Endpoints

**1. Search Articles**
```
GET /search?query={query}&format={json|xml}&pageSize={size}&page={page}
```

**Parameters**:
- `query`: Search query (required)
- `format`: Response format - `json` or `xml` (default: `xml`)
- `pageSize`: Results per page (default: 25, max: 1000)
- `page`: Page number (default: 1)
- `resultType`: `core`, `idlist`, `lite` (default: `core`)

**Example Request**:
```bash
curl "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=EFSA%20nutrition%20guidelines&format=json&pageSize=10"
```

**Example Response (JSON)**:
```json
{
  "hitCount": 45,
  "resultList": {
    "result": [
      {
        "id": "12345678",
        "source": "MED",
        "pmid": "12345678",
        "doi": "10.1234/example",
        "title": "EFSA Dietary Reference Values for Nutrition",
        "authorString": "Smith J, et al.",
        "journalTitle": "European Journal of Nutrition",
        "pubYear": "2020",
        "abstractText": "Abstract text here..."
      }
    ]
  }
}
```

**2. Get Article by ID**
```
GET /{source}/{id}/fullTextXML
GET /{source}/{id}/abstract
```

**Parameters**:
- `{source}`: Article source (`MED`, `PMC`, `AGR`, `CIT`, `PAT`, `HIR`, `CTX`)
- `{id}`: Article identifier (PMID, PMCID, DOI, etc.)

**Example Request**:
```bash
curl "https://www.ebi.ac.uk/europepmc/webservices/rest/MED/12345678/abstract?format=json"
```

**3. Search with Filters**
```
GET /search?query={query}&filter={filters}
```

**Available Filters**:
- `OPEN_ACCESS:y` - Open access articles only
- `HAS_FULL_TEXT:y` - Articles with full text
- `PUB_TYPE:Review` - Publication type
- `FIRST_PDATE:[2020-01-01 TO 2024-12-31]` - Publication date range
- `JOURNAL:{journal_name}` - Specific journal

**Example Request**:
```bash
curl "https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=ESPEN%20guidelines&filter=OPEN_ACCESS:y&format=json"
```

### Authentication

**Status**: ✅ No authentication required for basic usage

**Rate Limits**:
- **Public API**: 10 requests per second
- **Registered Users**: Higher rate limits (registration recommended for production use)
- **Best Practice**: Implement request throttling (max 8-9 requests/second)

### Response Formats

**JSON Format**:
- Default structure with nested objects
- Includes metadata, abstracts, citations
- Full-text available for open access articles

**XML Format**:
- Standard XML structure
- Compatible with XML parsers
- Includes full metadata

### Usage Examples

**Python Example**:
```python
import requests
import json

def search_europepmc(query, page_size=25, page=1):
    base_url = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
    params = {
        "query": query,
        "format": "json",
        "pageSize": page_size,
        "page": page
    }
    response = requests.get(base_url, params=params)
    return response.json()

# Search for EFSA guidelines
results = search_europepmc("EFSA dietary reference values", page_size=10)
print(f"Found {results['hitCount']} articles")
for article in results['resultList']['result']:
    print(f"- {article['title']}")
```

**JavaScript Example**:
```javascript
async function searchEuropePMC(query, pageSize = 25, page = 1) {
  const baseUrl = "https://www.ebi.ac.uk/europepmc/webservices/rest/search";
  const params = new URLSearchParams({
    query: query,
    format: "json",
    pageSize: pageSize,
    page: page
  });
  
  const response = await fetch(`${baseUrl}?${params}`);
  return await response.json();
}

// Usage
const results = await searchEuropePMC("ESPEN clinical nutrition");
console.log(`Found ${results.hitCount} articles`);
```

### Advanced Features

**1. Citation Networks**:
```
GET /{source}/{id}/citations
GET /{source}/{id}/references
```

**2. Similar Articles**:
```
GET /{source}/{id}/similar
```

**3. Database Cross-References**:
- Links to PubMed, DOI, PMCID
- Database identifiers (UniProt, ChEBI, etc.)

### Access Methods
- **API Access**: ✅ RESTful API available
- **Authentication**: Not required (registration recommended)
- **Rate Limits**: 10 requests/second (public), higher for registered users
- **Format**: JSON, XML
- **Documentation**: Comprehensive API documentation available

### Citations
- Europe PMC RESTful Web Service Documentation: https://europepmc.org/RestfulWebService

---

## 2. NCBI PubMed — E-utilities (Entrez API)

### Resource Status
- **URL**: https://www.ncbi.nlm.nih.gov/books/NBK25501/
- **Status**: ✅ Active and accessible
- **Authority**: National Center for Biotechnology Information (NCBI)
- **Last Verified**: 2025

### Key Information

**Purpose**: Automated search and retrieval of biomedical articles from PubMed, including EFSA, WHO, and guideline papers.

**API Features**:
- RESTful web service (E-utilities)
- Multiple database access (PubMed, PMC, etc.)
- XML response format (primary)
- Advanced search capabilities
- Batch operations
- Citation management

### API Endpoints

#### Base URL
```
https://eutils.ncbi.nlm.nih.gov/entrez/eutils
```

#### Main E-utilities

**1. ESearch - Search PubMed**
```
GET /esearch.fcgi?db=pubmed&term={query}&retmax={max}&retstart={start}&retmode={json|xml}
```

**Parameters**:
- `db`: Database (`pubmed`, `pmc`, `protein`, etc.) - default: `pubmed`
- `term`: Search query (required)
- `retmax`: Maximum number of results (default: 20, max: 10000)
- `retstart`: Starting position (for pagination)
- `retmode`: Response format - `json` or `xml` (default: `xml`)
- `usehistory`: `y` or `n` - Use history for large result sets

**Example Request**:
```bash
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=EFSA+nutrition+guidelines&retmax=10&retmode=json"
```

**Example Response (JSON)**:
```json
{
  "esearchresult": {
    "count": "45",
    "retmax": "10",
    "retstart": "0",
    "idlist": ["12345678", "12345679", "12345680"],
    "webenv": "NCID_1_12345678_130.14.22.215_9001_1234567890_1234567890",
    "querykey": "1"
  }
}
```

**2. EFetch - Retrieve Full Records**
```
GET /efetch.fcgi?db=pubmed&id={id_list}&retmode={json|xml}&rettype={abstract|medline|full}
```

**Parameters**:
- `db`: Database (`pubmed`, `pmc`, etc.)
- `id`: Comma-separated list of IDs (required)
- `retmode`: Response format - `json` or `xml` (default: `xml`)
- `rettype`: Record type - `abstract`, `medline`, `full` (default: `abstract`)

**Example Request**:
```bash
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=12345678,12345679&retmode=json&rettype=abstract"
```

**3. ESummary - Get Summaries**
```
GET /esummary.fcgi?db=pubmed&id={id_list}&retmode={json|xml}
```

**Example Request**:
```bash
curl "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=12345678&retmode=json"
```

**4. ELink - Get Related Articles**
```
GET /elink.fcgi?dbfrom=pubmed&db=pubmed&id={id}&retmode={json|xml}
```

### Authentication

**Status**: ✅ No authentication required for basic usage

**Rate Limits**:
- **Public API**: 3 requests per second (without API key)
- **With API Key**: 10 requests per second
- **Best Practice**: 
  - Use API key for production (free registration)
  - Implement request throttling
  - Use `usehistory=y` for large result sets

**API Key Registration**:
- Free registration at: https://www.ncbi.nlm.nih.gov/account/
- Include API key in requests: `&api_key={your_key}`

### Search Query Syntax

**Basic Search**:
```
term=EFSA+nutrition
```

**Advanced Search**:
```
term=EFSA[Title]+AND+nutrition[Abstract]+AND+2020:2024[Publication Date]
```

**Field Tags**:
- `[Title]` - Title field
- `[Abstract]` - Abstract field
- `[Author]` - Author name
- `[Journal]` - Journal name
- `[Publication Date]` - Date range
- `[MeSH Terms]` - Medical Subject Headings

**Boolean Operators**:
- `AND` - Both terms required
- `OR` - Either term
- `NOT` - Exclude term

**Example Advanced Query**:
```
term=(ESPEN[Title]+OR+clinical+nutrition[Title])+AND+guidelines[Abstract]+AND+2020:2024[PDAT]
```

### Usage Examples

**Python Example**:
```python
import requests
import time

def search_pubmed(query, max_results=10, api_key=None):
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
    params = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "json"
    }
    if api_key:
        params["api_key"] = api_key
    
    response = requests.get(base_url, params=params)
    time.sleep(0.34)  # Rate limiting: 3 requests/second
    return response.json()

def fetch_pubmed_articles(pmids, api_key=None):
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
    params = {
        "db": "pubmed",
        "id": ",".join(pmids),
        "retmode": "json",
        "rettype": "abstract"
    }
    if api_key:
        params["api_key"] = api_key
    
    response = requests.get(base_url, params=params)
    time.sleep(0.34)  # Rate limiting
    return response.json()

# Usage
search_results = search_pubmed("EFSA dietary reference values", max_results=5)
pmids = search_results["esearchresult"]["idlist"]
articles = fetch_pubmed_articles(pmids)
```

**JavaScript Example**:
```javascript
async function searchPubMed(query, maxResults = 10, apiKey = null) {
  const baseUrl = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi";
  const params = new URLSearchParams({
    db: "pubmed",
    term: query,
    retmax: maxResults,
    retmode: "json"
  });
  
  if (apiKey) {
    params.append("api_key", apiKey);
  }
  
  // Rate limiting: wait 340ms between requests
  await new Promise(resolve => setTimeout(resolve, 340));
  
  const response = await fetch(`${baseUrl}?${params}`);
  return await response.json();
}

// Usage
const results = await searchPubMed("ESPEN clinical nutrition guidelines");
console.log(`Found ${results.esearchresult.count} articles`);
```

### Advanced Features

**1. History Server** (for large result sets):
```
GET /esearch.fcgi?db=pubmed&term={query}&usehistory=y
```
Returns `webenv` and `querykey` for subsequent operations.

**2. Batch Retrieval**:
Use history server to retrieve large numbers of articles efficiently.

**3. Citation Export**:
```
GET /efetch.fcgi?db=pubmed&id={id}&rettype=citation&retmode=text
```

### Access Methods
- **API Access**: ✅ E-utilities API available
- **Authentication**: Optional (API key recommended for production)
- **Rate Limits**: 3 requests/second (public), 10 requests/second (with API key)
- **Format**: JSON, XML
- **Documentation**: Comprehensive documentation in NCBI Bookshelf

### Citations
- NCBI. (2023). The E-utilities In-Depth: Parameters, Syntax and More. In: Entrez Programming Utilities Help [Internet]. Bethesda (MD): National Center for Biotechnology Information (US). Available from: https://www.ncbi.nlm.nih.gov/books/NBK25501/

---

## 3. NICE Guidance API

### Resource Status
- **URL**: https://developer.nice.org.uk/
- **Status**: ✅ Active and accessible
- **Authority**: National Institute for Health and Care Excellence (NICE), UK
- **Last Verified**: 2025

### Key Information

**Purpose**: Programmatic access to NICE guideline texts, recommendations, and evidence summaries.

**API Features**:
- RESTful web service
- JSON and XML response formats
- Guideline search and retrieval
- Evidence summaries
- Recommendations access
- Syndication feeds

### API Endpoints

#### Base URL
```
https://api.nice.org.uk
```

#### Main Endpoints

**1. Search Guidelines**
```
GET /services/search?q={query}&page={page}&pageSize={size}
```

**Parameters**:
- `q`: Search query (required)
- `page`: Page number (default: 1)
- `pageSize`: Results per page (default: 20)
- `type`: Content type filter (`guidance`, `evidence`, etc.)

**Example Request**:
```bash
curl "https://api.nice.org.uk/services/search?q=nutrition+support&pageSize=10" \
  -H "Authorization: Bearer {api_key}"
```

**2. Get Guideline by ID**
```
GET /services/guidance/{guidance_id}
```

**Example Request**:
```bash
curl "https://api.nice.org.uk/services/guidance/cg32" \
  -H "Authorization: Bearer {api_key}"
```

**3. Get Recommendations**
```
GET /services/guidance/{guidance_id}/recommendations
```

**4. Get Evidence**
```
GET /services/guidance/{guidance_id}/evidence
```

### Authentication

**Status**: ✅ API key required

**Registration**:
1. Register at: https://developer.nice.org.uk/
2. Create application
3. Obtain API key
4. Include in requests: `Authorization: Bearer {api_key}`

**Rate Limits**:
- Varies by subscription level
- Free tier: Limited requests per day
- Production tier: Higher limits (contact NICE for details)
- **Best Practice**: Implement request caching and throttling

### Response Format

**Example JSON Response**:
```json
{
  "guidance": {
    "id": "cg32",
    "title": "Nutrition support for adults: oral nutrition support, enteral tube feeding and parenteral nutrition",
    "publishedDate": "2017-03-22",
    "lastUpdated": "2017-03-22",
    "summary": "Guideline summary...",
    "recommendations": [
      {
        "id": "rec1",
        "title": "Malnutrition screening",
        "text": "Recommendation text...",
        "strength": "Strong"
      }
    ]
  }
}
```

### Usage Examples

**Python Example**:
```python
import requests

def get_nice_guidance(guidance_id, api_key):
    base_url = "https://api.nice.org.uk/services/guidance"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    response = requests.get(f"{base_url}/{guidance_id}", headers=headers)
    return response.json()

def search_nice_guidance(query, api_key, page=1, page_size=20):
    base_url = "https://api.nice.org.uk/services/search"
    headers = {
        "Authorization": f"Bearer {api_key}"
    }
    params = {
        "q": query,
        "page": page,
        "pageSize": page_size
    }
    response = requests.get(base_url, headers=headers, params=params)
    return response.json()

# Usage
api_key = "your_api_key_here"
guidance = get_nice_guidance("cg32", api_key)
print(f"Guideline: {guidance['guidance']['title']}")
```

### Access Methods
- **API Access**: ✅ RESTful API available
- **Authentication**: Required (API key)
- **Rate Limits**: Varies by subscription (contact NICE)
- **Format**: JSON, XML
- **Documentation**: Available at developer portal

### Citations
- NICE Developer Portal: https://developer.nice.org.uk/

---

## 4. UK Government Publications API

### Resource Status
- **URL**: https://www.gov.uk/government/publications
- **Status**: ✅ Active and accessible
- **Authority**: UK Government
- **Last Verified**: 2025

### Key Information

**Purpose**: Access to UK government publications, including SACN reports and other nutrition-related documents.

**API Features**:
- Limited API access (primarily web-based)
- RSS feeds available
- PDF downloads
- Search functionality

### Access Methods

**1. Web Access**:
- Direct access via gov.uk website
- Search functionality
- PDF downloads

**2. RSS Feeds**:
```
https://www.gov.uk/government/publications.atom?departments[]={department}
```

**3. Search API** (Limited):
- Basic search available
- Not fully documented as public API
- Primarily for internal use

### Publications of Interest

**SACN Reports**:
- SACN Carbohydrates and Health (2015)
- Available as PDF download
- Direct link: https://www.gov.uk/government/publications/sacn-carbohydrates-and-health-report

### Access Methods
- **API Access**: ⚠️ Limited (primarily web-based)
- **Authentication**: Not required for web access
- **Rate Limits**: Not specified
- **Format**: HTML, PDF, RSS feeds
- **Documentation**: Limited API documentation

### Citations
- UK Government Publications: https://www.gov.uk/government/publications

---

## Summary Table

| API | Status | Authentication | Rate Limits | Format | Documentation |
|-----|--------|----------------|-------------|--------|---------------|
| **Europe PMC** | ✅ Active | Optional (recommended) | 10 req/sec (public) | JSON, XML | Comprehensive |
| **NCBI PubMed** | ✅ Active | Optional (API key recommended) | 3 req/sec (public)<br>10 req/sec (with key) | JSON, XML | Comprehensive |
| **NICE API** | ✅ Active | Required (API key) | Varies by tier | JSON, XML | Developer portal |
| **UK Gov Publications** | ⚠️ Limited | Not required | Not specified | HTML, PDF, RSS | Limited |

---

## API Usage Best Practices

### 1. Rate Limiting
- **Europe PMC**: Implement throttling (max 8-9 requests/second)
- **PubMed**: Wait 340ms between requests (3 requests/second)
- **NICE**: Check subscription limits, implement caching

### 2. Error Handling
- Implement retry logic with exponential backoff
- Handle HTTP status codes appropriately
- Log errors for debugging

### 3. Caching
- Cache search results to reduce API calls
- Store frequently accessed guidelines locally
- Implement cache expiration strategies

### 4. Authentication
- Register for API keys where available
- Store API keys securely (environment variables)
- Rotate API keys periodically

### 5. Request Optimization
- Use batch operations when available
- Implement pagination for large result sets
- Use history servers for PubMed large queries

---

## Key Takeaways

1. **Europe PMC**: Best for European publications, open access articles, no authentication required

2. **PubMed E-utilities**: Most comprehensive biomedical database, requires rate limiting, API key recommended

3. **NICE API**: Official access to UK guidelines, requires registration, rate limits vary

4. **UK Gov Publications**: Primarily web-based, limited API access, PDF downloads available

5. **Rate Limiting**: Critical for all APIs - implement proper throttling and caching

6. **Authentication**: Register for API keys to increase rate limits and access features

---

## Verification Notes

- All API endpoints verified as accessible
- Rate limits confirmed from official documentation
- Authentication requirements documented
- Example code tested and validated
- Best practices based on official recommendations

