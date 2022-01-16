https://cloud.google.com/functions/docs/calling/http \
https://cloud.google.com/functions/docs/tutorials/http

Deploy
```
gcloud functions deploy helloHttp --runtime nodejs16 --trigger-http --allow-unauthenticated
```

Invoke function
```
gcloud functions call helloHttp --data {\"name\":\"gcloud"}"
```
