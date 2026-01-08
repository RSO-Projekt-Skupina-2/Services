Write-Host "=== Microservices API Test ===" -ForegroundColor Cyan

$USERS_URL = "http://localhost:3002"
$POSTS_URL = "http://localhost:3000"
$LIKES_URL = "http://localhost:3001"

$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$testUser = @{
    username = "testuser_$timestamp"
    email = "test_${timestamp}@example.com"
    password = "password123"
}

# Health checks
Write-Host "`n1. Health Checks..." -ForegroundColor Yellow
$usersHealth = Invoke-RestMethod -Uri "$USERS_URL/health" -Method Get -ErrorAction SilentlyContinue
if ($usersHealth) { Write-Host "   Users: OK" -ForegroundColor Green }

$postsHealth = Invoke-RestMethod -Uri "$POSTS_URL/health" -Method Get -ErrorAction SilentlyContinue
if ($postsHealth) { Write-Host "   Posts: OK" -ForegroundColor Green }

$likesHealth = Invoke-RestMethod -Uri "$LIKES_URL/health" -Method Get -ErrorAction SilentlyContinue
if ($likesHealth) { Write-Host "   Likes: OK" -ForegroundColor Green }

# Register user
Write-Host "`n2. Registering user..." -ForegroundColor Yellow
Write-Host "   Email: $($testUser.email)" -ForegroundColor Gray
$registerResponse = Invoke-RestMethod -Uri "$USERS_URL/users/register" -Method Post -ContentType "application/json" -Body ($testUser | ConvertTo-Json)
Write-Host "   User ID: $($registerResponse.id)" -ForegroundColor Green

# Login
Write-Host "`n3. Logging in..." -ForegroundColor Yellow
$loginBody = @{ email = $testUser.email; password = $testUser.password }
$loginResponse = Invoke-RestMethod -Uri "$USERS_URL/users/login" -Method Post -ContentType "application/json" -Body ($loginBody | ConvertTo-Json)
$token = $loginResponse.token
Write-Host "   Token received: $($token.Substring(0, 20))..." -ForegroundColor Green

# Get user info
Write-Host "`n4. Getting current user info..." -ForegroundColor Yellow
$headers = @{ Authorization = "Bearer $token" }
$userInfo = Invoke-RestMethod -Uri "$USERS_URL/users/me" -Method Get -Headers $headers
Write-Host "   Username: $($userInfo.username)" -ForegroundColor Green
Write-Host "   Email: $($userInfo.email)" -ForegroundColor Green

# Create post
Write-Host "`n5. Creating post (with authentication)..." -ForegroundColor Yellow
$postBody = @{
    title = "Test Post $timestamp"
    text = "This is a test post"
    topics = @("test")
}
$headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json" }
$createPostResponse = Invoke-RestMethod -Uri "$POSTS_URL/posts" -Method Post -Headers $headers -Body ($postBody | ConvertTo-Json)
Write-Host "   Post ID: $($createPostResponse.id)" -ForegroundColor Green
Write-Host "   Title: $($createPostResponse.title)" -ForegroundColor Green
Write-Host "   Author: $($createPostResponse.author)" -ForegroundColor Green

# Get all posts
Write-Host "`n6. Getting all posts..." -ForegroundColor Yellow
$allPosts = Invoke-RestMethod -Uri "$POSTS_URL/posts" -Method Get
Write-Host "   Total posts: $($allPosts.Count)" -ForegroundColor Green

# Test unauthorized access
Write-Host "`n7. Testing unauthorized post creation..." -ForegroundColor Yellow
try {
    $unauthorizedPost = @{ title = "Unauthorized"; text = "Should fail" }
    Invoke-RestMethod -Uri "$POSTS_URL/posts" -Method Post -ContentType "application/json" -Body ($unauthorizedPost | ConvertTo-Json) -ErrorAction Stop
    Write-Host "   SECURITY ISSUE: Unauthorized post created!" -ForegroundColor Red
}
catch {
    Write-Host "   Correctly rejected (401)" -ForegroundColor Green
}

# Get all users
Write-Host "`n8. Getting all users..." -ForegroundColor Yellow
$allUsers = Invoke-RestMethod -Uri "$USERS_URL/users" -Method Get
Write-Host "   Total users: $($allUsers.Count)" -ForegroundColor Green

Write-Host "`n=== Tests Complete ===" -ForegroundColor Cyan
Write-Host "`nCredentials for manual testing:" -ForegroundColor Yellow
Write-Host "  Email: $($testUser.email)"
Write-Host "  Password: $($testUser.password)"
Write-Host "  Token: $token"
