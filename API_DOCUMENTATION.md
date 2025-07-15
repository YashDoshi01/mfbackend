# Mutual Funds API Documentation

## Base URL

```
http://localhost:5000/api/mutualfund
```

## Endpoints

### 1. Get Mutual Funds List (Paginated)

**GET** `/list-mf`

#### Query Parameters

-   `page` (optional): Page number (default: 1, minimum: 1)
-   `limit` (optional): Number of items per page (default: 100, range: 1-1000)
-   `search` (optional): Search term to filter funds by name, ISIN, or category

#### Example Requests

```bash
# Get first page with default limit (100)
curl "http://localhost:5000/api/mutualfund/list-mf"

# Get page 2 with 50 items per page
curl "http://localhost:5000/api/mutualfund/list-mf?page=2&limit=50"

# Search for HDFC funds with pagination
curl "http://localhost:5000/api/mutualfund/list-mf?page=1&limit=10&search=hdfc"
```

#### Response Format

```json
{
    "data": [
        {
            "isin": "INF179KA1JC4",
            "name": "HDFC Banking and PSU Debt Fund - Growth Option",
            "category": {
                "assetClass": "Debt",
                "fundType": "Banking",
                "subCategory": "PSU"
            },
            "nav": 23.1722,
            "navDate": "2025-07-13T18:30:00.000Z"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 10,
        "total": 13952,
        "totalPages": 1396,
        "hasNext": true,
        "hasPrev": false
    }
}
```

### 2. Get Statistics

**GET** `/stats`

Returns basic statistics about the mutual funds database.

#### Example Request

```bash
curl "http://localhost:5000/api/mutualfund/stats"
```

#### Response Format

```json
{
    "totalFunds": 13952,
    "message": "Use /list-mf endpoint with pagination parameters"
}
```

### 3. Get Raw Data (Legacy)

**GET** `/fixed-list`

Returns the raw CSV data from AMFI (for debugging purposes).

## Features

### Caching

-   Data is cached for 5 minutes to improve performance
-   Fresh data is fetched from AMFI if cache expires
-   Cache is shared across all requests

### Search Functionality

-   Search works across:
    -   Fund name
    -   ISIN code
    -   Asset class
    -   Fund type
    -   Sub category

### Error Handling

-   Validates pagination parameters
-   Returns appropriate HTTP status codes
-   Includes error messages in response

## Performance Notes

-   Total dataset: ~14,000 mutual funds
-   Recommended page size: 100-500 items
-   Maximum page size: 1000 items
-   Cache duration: 5 minutes
-   Search is case-insensitive
