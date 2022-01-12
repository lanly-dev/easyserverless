https://cloud.google.com/workflows/docs/quickstart-gcloud

List service accounts: `gcloud iam service-accounts list`

Create SA: `service-accounts create sa-name`

Deploy:
```sh
gcloud workflows deploy myFirstWorkflow --source=myFirstWorkflow.yaml --service-account=sa-name@PROJECT_ID.iam.gserviceaccount.com
```

Execute: `gcloud workflows run myFirstWorkflow`

Delete workflow: `gcloud workflows delete myFirstWorkflow`
