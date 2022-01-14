https://github.com/googleapis/nodejs-functions/tree/main/samples/generated/v1 \
https://cloud.google.com/docs/authentication/production

Get key from sa
```
gcloud iam service-accounts keys list --iam-account=sa-name@project-id.iam.gserviceaccount.com
```

https://cloud.google.com/iam/docs/creating-managing-service-account-keys#iam-service-account-keys-create-gcloud
Create key-file
```
gcloud iam service-accounts keys create key-file --iam-account=sa-name@project-id.iam.gserviceaccount.com
```
