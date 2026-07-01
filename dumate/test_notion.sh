#!/bin/bash
export NOTION_API_KEY="ntn_...PzHU4Pa3p1mGPVaSzxKkM1QlzL1oK1RH"
echo "API Key starts with: ${NOTION_API_KEY:0:10}..."
echo "API Key length: ${#NOTION_API_KEY}"

# Test Notion API
curl -s -X GET "https://api.notion.com/v1/users/me" \
  -H "Authorization: Bearer *** \
  -H "Notion-Version: 2025-09-03" | python3 -m json.tool 2>/dev/null