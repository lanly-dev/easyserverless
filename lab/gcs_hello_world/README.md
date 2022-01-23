https://www.npmjs.com/package/@google-cloud/storage \
https://github.com/googleapis/nodejs-storage/tree/main/samples

ACL - Access Control List\
https://cloud.google.com/storage/docs/gsutil/commands/acl

IAM - Identity and Access Management\
https://cloud.google.com/storage/docs/access-control/using-iam-permissions \
https://cloud.google.com/storage/docs/access-control/iam-roles \
https://cloud.google.com/storage/docs/gsutil/commands/iam

> Every bucket name must be globally unique.
> https://cloud.google.com/storage/docs/naming-buckets

List permissions
```
gsutil acl get gs://<bucket>
gsutil iam get gs://<bucket>
```

Make the bucket public writable/upload
```sh
# Storage Legacy Bucket Writer, can overwrite or delete
gsutil acl ch -u allUsers:W gs://<bucket>
# Storage Object Creator, doesn't have delete permission can't overwrite
gsutil iam ch allUsers:roles/storage.objectCreator gs://<bucket>
```

and public readable/download
```sh
# Didn't work and (bucket need to be in Fine-Grained mode instead of Uniform to run this cmd?)
# Storage Legacy Bucket Reader
gsutil acl ch -u allUsers:R gs://<bucket>
# Storage Object Viewer
gsutil iam ch allUsers:roles/storage.objectViewer gs://<bucket>
```

Adding permission to SA
```
gsutil iam ch serviceAccount:[SERVICE_ACCOUNT]:[role/some.role] gs://[BUCKET_NAME]
```

~~Set uniform bucket-level access~~ (no need)
```
gsutil uniformbucketlevelaccess set on gs://BUCKET_NAME
```
