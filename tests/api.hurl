# URL Shortener API Tests
#
# Variables:
# {{API_ENDPOINT}} - Base API URL (e.g., http://localhost:3000/api)
# {{TEST_USERNAME}} - Test user prefix (e.g., "testuser")
#

##############################
# Authentication Tests
##############################

#
# Should not allow access to the API without authentication
#
GET {{API_ENDPOINT}}
HTTP 401

# Create a test user account
POST {{API_ENDPOINT}}/auth/signup
Content-Type: application/json
{
    "email": "{{TEST_USERNAME}}@example.com",
    "password": "demo123!@#",
    "firstName": "Test",
    "lastName": "User"
}

HTTP *
[Asserts]
status == 201
jsonpath "$.success" == true

#
# Should fail, since account does not exist
#
POST {{API_ENDPOINT}}/auth/login
Content-Type: application/json
{
    "email": "{{TEST_USERNAME}}_demo@example.com",
    "password": "demo123!@#"
}

HTTP 401

#
# Should pass, since account exists
#
POST {{API_ENDPOINT}}/auth/login
Content-Type: application/json
{
    "email": "{{TEST_USERNAME}}@example.com",
    "password": "demo123!@#"
}

HTTP *
[Asserts]
status == 200
jsonpath "$.success" == true
jsonpath "$.token" != null

[Captures]
token: jsonpath "$.token"

# Confirm authenticated access to API
GET {{API_ENDPOINT}}
Authorization: Bearer {{token}}
HTTP 200

##############################
# URL Creation Tests
##############################

#
# Allow anonymous users to create short links
#
POST {{API_ENDPOINT}}/url
Content-Type: application/json
{
    "longUrl": "https://gedankrayze.com/development"
}

HTTP 201
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.shortUrl" != null
jsonpath "$.data.slug" != null

[Captures]
anon_slug: jsonpath "$.data.slug"

#
# Authenticated users should be able to create short links
#
POST {{API_ENDPOINT}}/url
Authorization: Bearer {{token}}
Content-Type: application/json
{
    "longUrl": "https://gedankrayze.com/authentication"
}

HTTP 201
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.shortUrl" != null
jsonpath "$.data.slug" != null

[Captures]
auth_slug: jsonpath "$.data.slug"
url_id: jsonpath "$.data._key"

#
# Create a URL with custom slug
#
POST {{API_ENDPOINT}}/url
Authorization: Bearer {{token}}
Content-Type: application/json
{
    "longUrl": "https://gedankrayze.com/custom",
    "customSlug": "custom-test"
}

HTTP 201
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.slug" == "custom-test"
jsonpath "$.data.isCustomSlug" == true

#
# Create a URL with expiration date
#
POST {{API_ENDPOINT}}/url
Authorization: Bearer {{token}}
Content-Type: application/json
{
    "longUrl": "https://gedankrayze.com/expiring",
    "expiresAt": "2025-12-31T23:59:59Z"
}

HTTP 201
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.expiresAt" != null

#
# Try to create a URL with already taken custom slug
#
POST {{API_ENDPOINT}}/url
Authorization: Bearer {{token}}
Content-Type: application/json
{
    "longUrl": "https://gedankrayze.com/duplicate",
    "customSlug": "custom-test"
}

HTTP 409
[Asserts]
jsonpath "$.success" == false

##############################
# URL Management Tests
##############################

#
# Should not allow access to URL listing without authentication
#
GET {{API_ENDPOINT}}/url
HTTP 401

#
# Get authenticated user's URLs
#
GET {{API_ENDPOINT}}/url
Authorization: Bearer {{token}}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.urls" count >= 2

#
# Update a URL
#
PUT {{API_ENDPOINT}}/url/{{url_id}}
Authorization: Bearer {{token}}
Content-Type: application/json
{
    "customSlug": "updated-slug"
}

HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.slug" == "updated-slug"

#
# Try to update a URL without authentication
#
PUT {{API_ENDPOINT}}/url/{{url_id}}
Content-Type: application/json
{
    "customSlug": "hacker-slug"
}

HTTP 401

#
# View analytics for a URL
#
GET {{API_ENDPOINT}}/url/{{url_id}}/analytics
Authorization: Bearer {{token}}
HTTP 200
[Asserts]
jsonpath "$.success" == true
jsonpath "$.data.analytics" != null

##############################
# URL Access and Redirection Tests
##############################

#
# Access the shortened URL
# Note: In real tests, we'd want to follow redirects
#
GET {{BASE_URL}}/{{anon_slug}}
HTTP 302
[Asserts]
header "Location" == "https://gedankrayze.com/development"

#
# Access the authenticated user's URL
#
GET {{BASE_URL}}/updated-slug
HTTP 302
[Asserts]
header "Location" == "https://gedankrayze.com/authentication"

#
# Get anonymous user's created URLs
#
GET {{API_ENDPOINT}}/url/anonymous
HTTP 200
[Asserts]
jsonpath "$.success" == true

##############################
# Cleanup Tests
##############################

#
# Delete a URL
#
DELETE {{API_ENDPOINT}}/url/{{url_id}}
Authorization: Bearer {{token}}
HTTP 200
[Asserts]
jsonpath "$.success" == true

#
# Confirm URL is deleted
#
GET {{API_ENDPOINT}}/url/{{url_id}}/analytics
Authorization: Bearer {{token}}
HTTP 404

#
# Try to delete a URL without authentication
#
DELETE {{API_ENDPOINT}}/url/{{url_id}}
HTTP 401