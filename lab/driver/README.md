https://github.com/googleapis/nodejs-functions#before-you-begin \
https://github.com/googleapis/nodejs-functions/tree/main/samples/generated/v1 \
https://cloud.google.com/docs/authentication/getting-started#cloud-console \
https://cloud.google.com/docs/authentication/production \
https://cloud.google.com/functions/docs/securing/managing-access-iam#allowing_unauthenticated_http_function_invocation

Get key from sa
```
gcloud iam service-accounts keys list --iam-account=sa-name@project-id.iam.gserviceaccount.com
```

https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-gcloud \
Create key-file
```
gcloud iam service-accounts keys create key-file --iam-account=sa-name@project-id.iam.gserviceaccount.com
```

list role
```
gcloud projects get-iam-policy [PROJECT_ID]
```

> Add service account into the project -> IAM & admin
