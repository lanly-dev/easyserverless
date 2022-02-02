## Permissions
IAM Service Account Credentials API\
https://console.cloud.google.com/apis/api/iamcredentials.googleapis.com/overview
> Error: IAM Service Account Credentials API has not been used in project xxx before or it is disabled.

Add role `Service Account Token Creator` to the `Google APIs Service Agent`
> Error: The caller does not have permission at Gaxios._request


## Deployment:
```sh
gcloud functions deploy easyServerless --trigger-http --allow-unauthenticated --runtime nodejs16 --timeout 540
```

## Refs:
https://cloud.google.com/sdk/gcloud/reference/topic/gcloudignore
