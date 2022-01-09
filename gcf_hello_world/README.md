Account list: `gcloud auth list`
List current project: `gcloud config list project`
Project list: `gcloud projects list`

Create a cloud storage bucket
```
gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]
```

When deploying a new function, you must specify --trigger-topic, --trigger-bucket, or --trigger-http. When deploying an update to an existing function, the function keeps the existing trigger unless otherwise specified.\
Deploy the function to a pub/sub topic named *hello_world*:
```
gcloud functions deploy helloWorld --stage-bucket [BUCKET_NAME] --trigger-topic hello_world  --runtime nodejs12
```

Test the function
```sh
# 'testing 💣💣' in base64 - run this in cmd
gcloud functions call helloWorld --data "{\"data\":\"dGVzdGluZyDwn5Kj8J+Sow==\"}"
```

