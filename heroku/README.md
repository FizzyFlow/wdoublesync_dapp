### Heroku deployment helpers

Script to deploy app to heroku, and settings for heroku's nginx buildpack ( heroku-community/nginx ).

Works ok for SPA ( all urls goes to index.html ).

Usage:

```bash
bash deploy.sh frontend heroku_application_id
bash deploy.sh editor other_heroku_application_id
```

The app has to be built already (`npm run build`).