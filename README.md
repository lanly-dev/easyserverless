## Installation
https://cloud.google.com/sdk/docs/downloads-interactive#windows
```ps1
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")

& $env:Temp\GoogleCloudSDKInstaller.exe
```

Or https://cloud.google.com/sdk/docs/downloads-versioned-archives

## Deployment

#### Create buckets to host input and output files
gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]-input
gsutil mb -p [PROJECT_ID] gs://[BUCKET_NAME]-output

#### Deploy Cloud Function [gcf-easyserverless](./gcf-easyserverless)
gcloud functions deploy easyServerless --stage-bucket [BUCKET_NAME] --trigger-topic [TOPIC] --runtime nodejs16 --timeout 540 --source ./gcf-easyserverless
