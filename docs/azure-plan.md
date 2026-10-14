# Azure App Service plan

## Architecture and hosting

Run FastAPI on Azure App Service for Linux using Python 3.12 and Uvicorn. The manually triggered GitHub Actions workflow uses Node 22 to build the React/Vite frontend into `app/static`, then deploys the source ZIP. The workflow enables App Service/Oryx build during deployment to install `requirements.txt` and configures the startup command as `python -m uvicorn app.main:app --host 0.0.0.0 --port 8000`. Set App Service stack to Python 3.12, enable build automation for ZIP deployments, and ensure the plan supports Linux built-in runtime deployment. The workflow requires Azure CLI access to the app and resource group.

## Database and configuration

SQLite suits local assessment and a single-instance demo. App Service local storage may be ephemeral and is not durable or suitable for multiple instances. A production service should use Azure Database for PostgreSQL and managed identity/private networking. App settings hold non-secret configuration; put future secrets in Key Vault. No credentials are committed.

## GitHub OIDC

Create an Entra ID app registration/service principal and federated credential for this repository. Use issuer `https://token.actions.githubusercontent.com`, audience `api://AzureADTokenExchange`, and a subject matching the selected GitHub repository/environment (for example `repo:OWNER/REPO:environment:production`). Grant the minimum deployment role at the target resource group. Add `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `AZURE_SUBSCRIPTION_ID` as GitHub Actions secrets and `AZURE_WEBAPP_NAME` plus `AZURE_RESOURCE_GROUP` as repository variables. The workflow requests `id-token: write` and logs in via `azure/login@v2`, without a publish profile.

## Deployment

1. Create a Linux App Service configured for Python 3.12. Set its startup settings through the workflow or App Service configuration.
2. Configure its OIDC federated credential and GitHub values above.
3. Manually run **Deploy to Azure App Service** in GitHub Actions.
4. Check the action log, then visit `/health` and `/docs` at the App Service URL.

## Logging and cost

Use App Service log streaming and Application Insights for exceptions, traces, and availability. Avoid logging message bodies. Start with a low-cost tier for a short demo if its limits fit; stop/delete resources after assessment. Tier cost and availability vary by region and date; check current Azure pricing before provisioning.

## Local use

Azure is optional. On Windows run `run.bat`; elsewhere install `requirements.txt` and launch Uvicorn with `app.main:app`.
