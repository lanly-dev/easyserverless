https://cloud.google.com/sdk/gcloud/reference/topic/gcloudignore \
https://cloud.google.com/sdk/gcloud/reference/functions/deploy \
https://cloud.google.com/sdk/gcloud/reference/functions/deploy#--timeout

https://cloud.google.com/functions/docs/samples \
https://cloud.google.com/functions/docs/running/overview \
https://cloud.google.com/functions/docs/monitoring/error-reporting

Account list: `gcloud auth list`\
List current project: `gcloud config list project`\
Project list: `gcloud projects list`

Create a cloud storage bucket
```
gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]
```

When deploying a new function, you must specify `--trigger-topic`, `--trigger-bucket`, or `--trigger-http`. When deploying an update to an existing function, the function keeps the existing trigger unless otherwise specified.\
Function `helloWorld` must match with function in *index.js*\
Deploy the function to a pub/sub topic named *hello_world*:
```sh
# stage bucket is optional
gcloud functions deploy helloWorld --stage-bucket [BUCKET_NAME] --trigger-topic hello_world --runtime nodejs16
# Update
gcloud functions deploy helloWorld
```

Display files that will uploaded
```
gcloud meta list-files-for-upload
```

Test the function
```sh
# 'testing 💣💣' in base64 - run this in cmd
gcloud functions call helloWorld --data "{\"data\":\"dGVzdGluZyDwn5Kj8J+Sow==\"}"
```

Delete the function
```
gcloud functions delete helloWorld
```
