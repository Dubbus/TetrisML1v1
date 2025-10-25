param(
  [string] $BucketName,
  [string] $Region = 'us-east-1',
  [string] $CloudFrontId = ''
)

if (-not $BucketName) { Write-Error 'BucketName is required. Example: ./deploy_s3.ps1 -BucketName my-bucket -Region us-east-1 -CloudFrontId ABCD1234' ; exit 1 }

Write-Host "Building frontend2..."
Push-Location (Join-Path $PSScriptRoot '..')
Set-Location frontend2
npm ci
npm run build

Write-Host "Syncing to s3://$BucketName"
aws s3 sync dist s3://$BucketName --delete --region $Region

if ($CloudFrontId) {
  Write-Host "Invalidating CloudFront distribution $CloudFrontId"
  aws cloudfront create-invalidation --distribution-id $CloudFrontId --paths '/*'
}

Write-Host 'Deploy complete.'
Pop-Location
