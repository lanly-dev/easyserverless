## Permissions
IAM Service Account Credentials API\
https://console.cloud.google.com/apis/api/iamcredentials.googleapis.com/overview
> Error: IAM Service Account Credentials API has not been used in project xxx before or it is disabled.

Add role `Service Account Token Creator` to the ~~`Google APIs Service Agent`~~ `appspot.gserviceaccount.com`
> Error: The caller does not have permission at Gaxios._request

## Deployment:
```sh
gcloud functions deploy easyServerless --trigger-http --allow-unauthenticated --runtime nodejs16 --timeout 540 --memory 8192MB
```

## Refs:
https://cloud.google.com/sdk/gcloud/reference/topic/gcloudignore \
https://cloud.google.com/sdk/gcloud/reference/functions/deploy
