#!/bin/bash

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3001"
LOG_FILE="/tmp/nbx_test_results.log"

# Clear previous log
> $LOG_FILE

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}NBX Backend API Test Suite${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to log results
log_result() {
    local test_name=$1
    local status=$2
    local response=$3
    
    echo -e "${BLUE}Test: ${test_name}${NC}" | tee -a $LOG_FILE
    if [ "$status" == "PASS" ]; then
        echo -e "${GREEN}Status: PASS${NC}" | tee -a $LOG_FILE
    else
        echo -e "${RED}Status: FAIL${NC}" | tee -a $LOG_FILE
    fi
    echo "Response: $response" | tee -a $LOG_FILE
    echo "---" | tee -a $LOG_FILE
    echo ""
}

# Test 1: Register Investor User
echo -e "${YELLOW}[TEST 1] Registering Investor User${NC}"
INVESTOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "useremail": "investor1@nbx.test",
    "password": "InvestorPass123",
    "role": "investor"
  }')

echo "Response: $INVESTOR_RESPONSE" | tee -a $LOG_FILE
INVESTOR_TOKEN=$(echo $INVESTOR_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$INVESTOR_TOKEN" ]; then
    log_result "Register Investor User" "PASS" "$INVESTOR_RESPONSE"
    echo "Investor Token: $INVESTOR_TOKEN" >> $LOG_FILE
else
    log_result "Register Investor User" "FAIL" "$INVESTOR_RESPONSE"
fi

# Test 2: Register Company User
echo -e "${YELLOW}[TEST 2] Registering Company User${NC}"
COMPANY_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "useremail": "company1@nbx.test",
    "password": "CompanyPass123",
    "role": "company"
  }')

echo "Response: $COMPANY_RESPONSE" | tee -a $LOG_FILE
COMPANY_TOKEN=$(echo $COMPANY_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$COMPANY_TOKEN" ]; then
    log_result "Register Company User" "PASS" "$COMPANY_RESPONSE"
    echo "Company Token: $COMPANY_TOKEN" >> $LOG_FILE
else
    log_result "Register Company User" "FAIL" "$COMPANY_RESPONSE"
fi

# Test 3: Register Auditor User
echo -e "${YELLOW}[TEST 3] Registering Auditor User${NC}"
AUDITOR_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "useremail": "auditor1@nbx.test",
    "password": "AuditorPass123",
    "role": "auditor"
  }')

echo "Response: $AUDITOR_RESPONSE" | tee -a $LOG_FILE
AUDITOR_TOKEN=$(echo $AUDITOR_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$AUDITOR_TOKEN" ]; then
    log_result "Register Auditor User" "PASS" "$AUDITOR_RESPONSE"
    echo "Auditor Token: $AUDITOR_TOKEN" >> $LOG_FILE
else
    log_result "Register Auditor User" "FAIL" "$AUDITOR_RESPONSE"
fi

# Test 4: Login Investor User
echo -e "${YELLOW}[TEST 4] Login Investor User${NC}"
INVESTOR_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "useremail": "investor1@nbx.test",
    "password": "InvestorPass123"
  }')

echo "Response: $INVESTOR_LOGIN" | tee -a $LOG_FILE
if echo $INVESTOR_LOGIN | grep -q "accessToken"; then
    log_result "Login Investor User" "PASS" "$INVESTOR_LOGIN"
else
    log_result "Login Investor User" "FAIL" "$INVESTOR_LOGIN"
fi

# Test 5: Login Company User
echo -e "${YELLOW}[TEST 5] Login Company User${NC}"
COMPANY_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "useremail": "company1@nbx.test",
    "password": "CompanyPass123"
  }')

echo "Response: $COMPANY_LOGIN" | tee -a $LOG_FILE
if echo $COMPANY_LOGIN | grep -q "accessToken"; then
    log_result "Login Company User" "PASS" "$COMPANY_LOGIN"
    COMPANY_TOKEN=$(echo $COMPANY_LOGIN | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
else
    log_result "Login Company User" "FAIL" "$COMPANY_LOGIN"
fi

# Test 6: Login Auditor User
echo -e "${YELLOW}[TEST 6] Login Auditor User${NC}"
AUDITOR_LOGIN=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "useremail": "auditor1@nbx.test",
    "password": "AuditorPass123"
  }')

echo "Response: $AUDITOR_LOGIN" | tee -a $LOG_FILE
if echo $AUDITOR_LOGIN | grep -q "accessToken"; then
    log_result "Login Auditor User" "PASS" "$AUDITOR_LOGIN"
else
    log_result "Login Auditor User" "FAIL" "$AUDITOR_LOGIN"
fi

# Test 7: Create Company Profile (using company token)
echo -e "${YELLOW}[TEST 7] Create Company Profile${NC}"
COMPANY_PROFILE=$(curl -s -X POST "$BASE_URL/companies" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $COMPANY_TOKEN" \
  -d '{
    "name": "Tech Startup Inc",
    "symbol": "TSI",
    "description": "A leading technology startup",
    "industry": "Technology",
    "registrationNumber": "REG123456",
    "totalShares": 1000000,
    "sharePrice": 10
  }')

echo "Response: $COMPANY_PROFILE" | tee -a $LOG_FILE
COMPANY_ID=$(echo $COMPANY_PROFILE | grep -o '"_id":"[^"]*' | head -1 | cut -d'"' -f4)

if [ ! -z "$COMPANY_ID" ]; then
    log_result "Create Company Profile" "PASS" "$COMPANY_PROFILE"
    echo "Company ID: $COMPANY_ID" >> $LOG_FILE
else
    log_result "Create Company Profile" "FAIL" "$COMPANY_PROFILE"
fi

# Test 8: Create Bond (using company token and company ID)
if [ ! -z "$COMPANY_ID" ]; then
    echo -e "${YELLOW}[TEST 8] Create Bond${NC}"
    BOND_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/bond" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d '{
        "name": "Corporate Bond 2025",
        "symbol": "CB2025",
        "totalValue": 500000,
        "interestRate": 5.5,
        "maturityDate": "2030-12-31",
        "couponFrequency": "semi-annual"
      }')
    
    echo "Response: $BOND_RESPONSE" | tee -a $LOG_FILE
    if echo $BOND_RESPONSE | grep -q "name"; then
        log_result "Create Bond" "PASS" "$BOND_RESPONSE"
    else
        log_result "Create Bond" "FAIL" "$BOND_RESPONSE"
    fi
fi

# Test 9: Create Equity (using company token and company ID)
if [ ! -z "$COMPANY_ID" ]; then
    echo -e "${YELLOW}[TEST 9] Create Equity${NC}"
    EQUITY_RESPONSE=$(curl -s -X POST "$BASE_URL/companies/$COMPANY_ID/equity" \
      -H "Content-Type: application/json" \
      -H "Authorization: Bearer $COMPANY_TOKEN" \
      -d '{
        "name": "Common Stock",
        "symbol": "TSI-CS",
        "totalShares": 1000000,
        "pricePerShare": 10,
        "description": "Common equity shares of Tech Startup Inc"
      }')
    
    echo "Response: $EQUITY_RESPONSE" | tee -a $LOG_FILE
    if echo $EQUITY_RESPONSE | grep -q "name"; then
        log_result "Create Equity" "PASS" "$EQUITY_RESPONSE"
    else
        log_result "Create Equity" "FAIL" "$EQUITY_RESPONSE"
    fi
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Test Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo "Full test results saved to: $LOG_FILE"
echo ""
cat $LOG_FILE
