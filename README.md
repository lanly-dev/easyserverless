## Deployment

#### Create buckets to host input and output files and add public permission to upload/download input/output
```
gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]-input
gsutil acl ch -u allUsers:W gs://[BUCKET_NAME]-input

gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]-output
gsutil iam ch allUsers:roles/storage.objectViewer gs://[BUCKET_NAME]-output
```

#### Deploy Cloud Function [gcf-easyserverless](./gcf-easyserverless)
```
gcloud functions deploy easyServerless --stage-bucket [BUCKET_NAME] --trigger-http --allow-unauthenticated --runtime nodejs16 --timeout 540 --source ./gcf-easyserverless
```
