# Deploy FansClash backend to project hvogahprmyrneupsqttw ONLY.
#
# Prerequisites:
#   1. Supabase personal access token: https://supabase.com/dashboard/account/tokens
#   2. Database password for project hvogahprmyrneupsqttw
#
# Usage (PowerShell):
#   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
#   $env:SUPABASE_DB_PASSWORD = "your-db-password"
#   .\scripts\deploy-fansclash-backend.ps1

$ErrorActionPreference = "Stop"
$ProjectRef = "hvogahprmyrneupsqttw"

if (-not $env:SUPABASE_ACCESS_TOKEN) {
  Write-Error "Set SUPABASE_ACCESS_TOKEN before running this script."
}

if (-not $env:SUPABASE_DB_PASSWORD) {
  Write-Error "Set SUPABASE_DB_PASSWORD before running this script."
}

Set-Location $PSScriptRoot\..

Write-Host "Linking to FansClash project $ProjectRef..."
npx supabase@latest link --project-ref $ProjectRef --password $env:SUPABASE_DB_PASSWORD

Write-Host "Pushing migrations..."
npx supabase@latest db push

Write-Host "Deploying Edge Functions..."
npx supabase@latest functions deploy initiate-deposit --project-ref $ProjectRef
npx supabase@latest functions deploy mpesa-callback --project-ref $ProjectRef --no-verify-jwt
npx supabase@latest functions deploy lock-event-at-kickoff --project-ref $ProjectRef --no-verify-jwt

Write-Host "Done. FansClash backend deployed to $ProjectRef."
