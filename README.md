## Deployment

#### Create buckets to host input and output files
```
gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]-input
gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]-output
```

#### Deploy Cloud Function [gcf-easyserverless](./gcf-easyserverless)
```
gcloud functions deploy easyServerless --stage-bucket [BUCKET_NAME] --trigger-http --allow-unauthenticated --runtime nodejs16 --timeout 540 --source ./gcf-easyserverless
```
