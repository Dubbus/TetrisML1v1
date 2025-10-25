# Deploying frontend2

This file explains three deployment options: Amplify Console (recommended), S3+CloudFront (manual) and GitHub Actions (CI to S3).

1) Amplify Console (recommended)

- In AWS Console -> AWS Amplify -> Host web app -> Connect your Git provider, select the repo and branch.
- Set the app root to the repository root (Amplify uses `amplify.yml` at the repo root which will `cd frontend2`).
- In Amplify Console -> App settings -> Environment variables add:
  - VITE_API_BASE_URL = https://api.your-backend.example
- Start deploy. Amplify will run the `amplify.yml` build spec (it runs `npm ci` then `npm run build` in `frontend2`).

2) S3 + CloudFront (manual)

- Build locally:
```powershell
cd frontend2
npm ci
npm run build
```
- Upload to S3:
```powershell
aws s3 sync frontend2/dist s3://your-bucket-name --delete
```
- Create a CloudFront distribution with that S3 bucket as Origin. Configure the distribution for HTTPS, and set cache invalidation when you deploy.
- Configure S3 CORS (example):
```xml
<CORSConfiguration>
  <CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <AllowedHeader>*</AllowedHeader>
  </CORSRule>
</CORSConfiguration>
```

3) GitHub Actions -> S3 (CI)

- You can use the provided GitHub Actions workflow to automatically build and deploy to S3 on push to `main`. The workflow requires these repository secrets:
  - AWS_ACCESS_KEY_ID
  - AWS_SECRET_ACCESS_KEY
  - AWS_REGION
  - S3_BUCKET
  - CLOUDFRONT_DISTRIBUTION_ID (optional; used to invalidate cache)

See `.github/workflows/deploy-to-s3.yml` for the exact pipeline.

Notes
- Set `VITE_API_BASE_URL` as an environment variable in Amplify or embed the real backend URL before building when using S3.
- For testing, you can use the mock server (`npm run mock`) and set `VITE_API_BASE_URL=http://localhost:4000`.
