## Deployment:
```sh
gcloud functions deploy [FUNC_NAME] --stage-bucket [BUCKET_NAME] --trigger-http --allow-unauthenticated --runtime nodejs16 --timeout 540
```

## Refs:
https://cloud.google.com/sdk/gcloud/reference/topic/gcloudignore
